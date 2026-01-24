import { NextResponse } from "next/server";
import type { Database } from "@/lib/database.types";
import {
  sendMail,
  tplEmpresaSolicitudConfirmacion,
  tplEmpresaSolicitudInterna,
  type EmpresaProductoEmailSummary,
  type EmpresaSolicitudEmailPayload,
} from "@/lib/email";
import { supabaseService } from "@/lib/supabaseService";

const INTERNAL_EMAIL = process.env.EMAIL_INTERNAL_TO || "contacto@fundaciontraesol.cl";
const INTERNAL_CC = process.env.EMAIL_EMPRESAS_CC || "lnatalino@fundaciontraesol.cl";
type EmpresaSolicitudInsert = Database["public"]["Tables"]["empresa_solicitudes"]["Insert"];
type EmpresaSolicitudItemInsert = Database["public"]["Tables"]["empresa_solicitud_items"]["Insert"];

const cleanString = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return "";
};

const cleanOptional = (value: unknown): string | null => {
  const trimmed = cleanString(value);
  return trimmed ? trimmed : null;
};

const parseDeseaReunion = (value: string | null): boolean | null => {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  if (["si", "sí", "s", "true", "1", "yes"].includes(normalized)) return true;
  if (["no", "false", "0"].includes(normalized)) return false;
  return null;
};

type ProductoSeleccion = {
  id: string;
  cantidad: number;
  nota: string | null;
  titulo?: string | null;
  categoria?: string | null;
  config?: Record<string, any> | null;
};

type ProductoResumen = EmpresaProductoEmailSummary & {
  id: string;
  cantidad: number;
  nota: string | null;
  categoria: string | null;
  config?: Record<string, any> | null;
};

function normalizeCantidad(value: unknown): number | null {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  if (num <= 0) return null;
  return Math.round(num);
}

function parseSelecciones(input: unknown): ProductoSeleccion[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item: any) => {
      const productoId = cleanString(item?.productoId ?? item?.producto_id ?? "");
      if (!productoId) return null;
      return {
        id: productoId,
        cantidad: normalizeCantidad(item?.cantidad) ?? 1,
        nota: cleanOptional(item?.nota),
      } satisfies ProductoSeleccion;
    })
    .filter((item: ProductoSeleccion | null): item is ProductoSeleccion => Boolean(item));
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseCarrito(input: unknown): ProductoSeleccion[] {
  if (!input || typeof input !== "object") return [];
  const items = Array.isArray((input as any)?.items) ? (input as any).items : [];
  return items
    .map((item: any) => {
      const productoId = cleanString(item?.productoId ?? item?.producto_id ?? "");
      if (!productoId) return null;
      return {
        id: productoId,
        cantidad: normalizeCantidad(item?.cantidad) ?? 1,
        nota: cleanOptional(item?.nota),
        titulo: cleanOptional(item?.titulo),
        categoria: cleanOptional(item?.categoria),
        config: isPlainObject(item?.config) ? item.config : null,
      } satisfies ProductoSeleccion;
    })
    .filter((item: ProductoSeleccion | null): item is ProductoSeleccion => Boolean(item));
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const contacto_email = cleanString(body?.email || body?.contacto_email);
    const empresa_nombre = cleanString(body?.nombre_empresa || body?.empresa_nombre);

    if (!contacto_email) {
      return NextResponse.json({ ok: false, error: "Falta el correo de contacto" }, { status: 400 });
    }
    if (!empresa_nombre) {
      return NextResponse.json({ ok: false, error: "Falta el nombre de la empresa" }, { status: 400 });
    }

    const contacto_nombre = cleanOptional(body?.nombre_persona || body?.contacto_nombre) || empresa_nombre;
    const contacto_cargo = cleanOptional(body?.cargo || body?.contacto_cargo);
    const contacto_telefono = cleanOptional(body?.telefono || body?.contacto_telefono);
    const ciudad = cleanOptional(body?.ciudad);
    const comentario = cleanOptional(body?.mensaje || body?.comentario);
    const desea_reunion = cleanOptional(body?.desea_reunion);
    const carritoParsed = parseCarrito(body?.carrito);
    const selecciones = carritoParsed.length > 0 ? carritoParsed : parseSelecciones(body?.selecciones);
    const carrito_resumen = selecciones.length
      ? JSON.stringify(
          selecciones.map((item) => ({
            producto_id: item.id,
            cantidad: item.cantidad ?? 1,
            nota: item.nota ?? null,
            config: item.config ?? null,
          })),
          null,
          2,
        )
      : null;

    const solicitudInsert: EmpresaSolicitudInsert = {
      empresa_nombre,
      contacto_nombre,
      contacto_email,
      contacto_cargo,
      contacto_telefono,
      ciudad,
      comentario,
      desea_reunion,
      origen: "web_empresas",
      carrito_resumen,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: solicitudData, error: solicitudError } = await (supabaseService as any)
      .from("empresa_solicitudes")
      .insert(solicitudInsert)
      .select(
        "id,empresa_nombre,contacto_nombre,contacto_email,contacto_telefono,ciudad,comentario,carrito_resumen",
      )
      .single();

    if (solicitudError || !solicitudData) {
      const message = solicitudError?.message || "No se pudo guardar la solicitud";
      return NextResponse.json({ ok: false, error: message }, { status: 500 });
    }

    const solicitudId = solicitudData.id;

    let productosResumen: ProductoResumen[] = [];

    if (selecciones.length > 0) {
      const uniqueIds = Array.from(new Set(selecciones.map((item) => item.id)));
      const { data: productosData, error: productosError } = await supabaseService
        .from("empresa_productos")
        .select("id,nombre,categoria,activo")
        .in("id", uniqueIds);

      if (productosError) {
        return NextResponse.json({ ok: false, error: "No se pudo validar los productos seleccionados" }, { status: 500 });
      }

      const activos = ((productosData ?? []) as Array<{ id: string; nombre: string; categoria: string | null; activo: boolean }>).filter((item) => item.activo);
      productosResumen = selecciones
        .map((seleccion): ProductoResumen | null => {
          const meta = activos.find((prod) => prod.id === seleccion.id);
          if (!meta) return null;
          return {
            id: meta.id,
            nombre: meta.nombre,
            cantidad: seleccion.cantidad ?? 1,
            nota: seleccion.nota,
            categoria: meta.categoria,
            config: seleccion.config ?? null,
          };
        })
        .filter((item): item is ProductoResumen => Boolean(item));

      if (productosResumen.length) {
        const detallePayload: EmpresaSolicitudItemInsert[] = productosResumen.map((item) => ({
          solicitud_id: solicitudId,
          producto_id: item.id,
          cantidad: item.cantidad ?? 1,
          nota: item.nota ?? null,
          config: item.config ?? null,
        }));
        console.log("[EMPRESAS] Detalle a insertar", JSON.stringify(detallePayload, null, 2));
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: detalleError } = await (supabaseService as any).from("empresa_solicitud_items").insert(detallePayload);
          if (detalleError) {
            console.error("[EMPRESAS] Error al guardar detalle", detalleError);
            return NextResponse.json(
              {
                ok: false,
                code: "DETALLE_ERROR",
                message: "No se pudo guardar el detalle de productos.",
                supabaseError: detalleError.message,
              },
              { status: 500 },
            );
          }
        } catch (detalleException) {
          console.error("[EMPRESAS] Excepción insertando detalle", detalleException);
          return NextResponse.json(
            {
              ok: false,
              code: "DETALLE_EXCEPTION",
              message: "No se pudo guardar el detalle de productos.",
            },
            { status: 500 },
          );
        }
      }
    }

    const fechaRecepcion = new Intl.DateTimeFormat("es-CL", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());

    const carritoResumenEmail = productosResumen.length
      ? {
          items: productosResumen.map((item) => ({
            productoId: item.id,
            titulo: item.nombre,
            categoria: item.categoria,
            cantidad: item.cantidad ?? 1,
            nota: item.nota,
            config: item.config ?? null,
          })),
        }
      : null;
    const deseaReunionFlag = parseDeseaReunion(desea_reunion);

    const emailPayload: EmpresaSolicitudEmailPayload = {
      empresaNombre: empresa_nombre,
      contactoNombre: contacto_nombre,
      contactoEmail: contacto_email,
      contactoTelefono: contacto_telefono,
      ciudad,
      comentario,
      fechaRecepcion,
      carritoResumen: carritoResumenEmail,
      deseaReunion: deseaReunionFlag,
    };

    const internalRecipients = [INTERNAL_EMAIL, INTERNAL_CC].filter(Boolean) as string[];

    try {
      await Promise.all([
        sendMail({
          to: internalRecipients,
          subject: `Nueva solicitud de empresa: ${empresa_nombre} – ${contacto_nombre || "sin nombre"}`,
          html: tplEmpresaSolicitudInterna(emailPayload),
          replyTo: contacto_email,
          from: process.env.RESEND_FROM,
        }),
        sendMail({
          to: contacto_email,
          subject: "Hemos recibido tu contacto – Fundación Traesol",
          html: tplEmpresaSolicitudConfirmacion(emailPayload),
          from: process.env.RESEND_FROM,
        }),
      ]);
    } catch (emailError) {
      console.error("Error enviando correos de solicitud de empresa", emailError);
    }

    const data = { ok: true, solicitudId };
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
