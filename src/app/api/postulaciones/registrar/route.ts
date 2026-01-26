import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";
import {
  sendPostulacionOperativoEmails,
  sendRegistroVoluntarioEmail,
  sendActualizacionVoluntarioEmail,
  sendPostulacionAdminEmail,
  sendPostulacionRecibidaEmail,
} from "@/lib/email";
import {
  inferInscripcionOrigen,
  INSCRIPCION_ESTADO,
  INSCRIPCION_ORIGEN,
  INSCRIPCION_TIPO_SCOPE,
  isConfirmedEstado,
  isInvitacionTipo,
  isPendingEstado,
  isRejectedEstado,
  normalizeInscripcionEstado,
  type InscripcionInsert,
} from "@/lib/inscripciones";

export const dynamic = "force-dynamic";

function normalizeRut(raw: string): string {
  return raw.replace(/\./g, "").replace(/-/g, "").trim().toUpperCase();
}

function asString(value: unknown, { trim = true }: { trim?: boolean } = {}): string {
  if (typeof value !== "string") return "";
  return trim ? value.trim() : value;
}

function nullable(value: unknown): string | null {
  const str = asString(value);
  return str ? str : null;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

type VoluntarioMinimal = {
  id: string;
  nombres: string | null;
  apellidos: string | null;
  email: string | null;
};

type OperativoInfo = {
  id: string;
  titulo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
  slug: string | null;
  whatsapp_grupo_url: string | null;
};

type ExistingInscripcion = {
  id: string;
  estado: string | null;
  tipo: string | null;
  origen: string | null;
};

type PostulacionCode =
  | "OK"
  | "ALREADY_PENDING"
  | "ALREADY_ACCEPTED"
  | "ALREADY_REVIEWED"
  | "INVITED_ALREADY"
  | "PROFILE_UPDATED";

function buildOperativoLink(op: OperativoInfo | null): string | null {
  if (!op?.slug) return null;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl";
  return `${base.replace(/\/$/, "")}/operativos/${op.slug}`;
}

function statusResponse({
  code,
  message,
  ok,
  extra,
}: {
  code: PostulacionCode;
  message: string;
  ok: boolean;
  extra?: Record<string, unknown>;
}) {
  return NextResponse.json(
    {
      ok,
      code,
      message,
      ...(extra ?? {}),
    },
    { status: 200 }
  );
}

// =========================================================================
// Postulación desde cuenta de usuario (usa voluntarios + inscripciones)
// NOTA: Usamos la misma tabla que postulaciones anónimas para que Admin funcione
// =========================================================================
async function handleUserAccountPostulation(
  body: Record<string, unknown>,
  userId: string,
  nombres: string,
  email: string
) {
  const operativoId = nullable(body?.operativo_id);
  const operativoSlug = nullable(body?.operativo_slug);
  const apellidos = nullable(body?.apellidos);
  const rut = nullable(body?.rut);
  const telefono = nullable(body?.telefono);
  const tallaPolera = nullable(body?.talla_polera);
  const tallaPantalon = nullable(body?.talla_pantalon);
  const restricciones = nullable(body?.alimentarias_alergias);
  const profesion = nullable(body?.profesion);
  const fechaNacimiento = nullable(body?.fecha_nacimiento);
  const direccion = nullable(body?.direccion);
  const instagram = nullable(body?.instagram);

  // Para usuarios con cuenta, solo permitimos postulación específica a operativo
  const targetField = operativoId ? "id" : "slug";
  const targetValue = operativoId || operativoSlug;

  if (!targetValue) {
    return NextResponse.json(
      { ok: false, error: "Selecciona un operativo válido para postularte." },
      { status: 400 }
    );
  }

  // Buscar operativo
  const { data: operativo, error: opError } = await supabaseService
    .from("operativos")
    .select("id,titulo,slug,fecha_inicio,fecha_fin,lugar,whatsapp_grupo_url")
    .eq(targetField, targetValue)
    .maybeSingle<OperativoInfo>();

  if (opError) throw opError;
  if (!operativo) {
    return NextResponse.json(
      { ok: false, error: "El operativo seleccionado no existe." },
      { status: 400 }
    );
  }

  // 1. Buscar o crear voluntario por email (igual que flujo anónimo)
  let voluntario: VoluntarioMinimal | null = null;
  let wasNewVoluntario = false;

  const { data: existente, error: findVolError } = await supabaseService
    .from("voluntarios")
    .select("id,nombres,apellidos,email")
    .eq("email", email)
    .maybeSingle<VoluntarioMinimal>();
  
  if (findVolError && findVolError.code !== "PGRST116") throw findVolError;
  voluntario = existente ?? null;

  // Si no existe por email, buscar por RUT
  if (!voluntario && rut) {
    const { data: existenteRut, error: findRutError } = await supabaseService
      .from("voluntarios")
      .select("id,nombres,apellidos,email")
      .eq("rut", rut)
      .maybeSingle<VoluntarioMinimal>();
    
    if (findRutError && findRutError.code !== "PGRST116") throw findRutError;
    voluntario = existenteRut ?? null;
  }

  // Datos para voluntario (sin user_id porque la tabla actual no lo tiene)
  const voluntarioRecord = {
    nombres,
    apellidos,
    email,
    telefono,
    rut,
    fecha_nacimiento: fechaNacimiento,
    direccion,
    instagram,
    profesion: profesion || "No especificada",
    talla_polera: tallaPolera,
    talla_pantalon: tallaPantalon,
    alimentarias_alergias: restricciones,
    nombre_credencial: [nombres, apellidos].filter(Boolean).join(" ").trim() || nombres,
  };

  if (voluntario) {
    // Actualizar datos existentes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabaseService as any)
      .from("voluntarios")
      .update(voluntarioRecord)
      .eq("id", voluntario.id)
      .select("id,nombres,apellidos,email")
      .single();

    if (updateError) throw updateError;
    voluntario = updated as VoluntarioMinimal;
  } else {
    // Crear nuevo voluntario
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inserted, error: insertError } = await (supabaseService as any)
      .from("voluntarios")
      .insert(voluntarioRecord)
      .select("id,nombres,apellidos,email")
      .single();

    if (insertError) throw insertError;
    voluntario = inserted as VoluntarioMinimal;
    wasNewVoluntario = true;
  }

  if (!voluntario?.id) {
    throw new Error("No se pudo crear/obtener el voluntario.");
  }

  // 2. Verificar si ya existe inscripción para este operativo
  type ExistingInscripcion = {
    id: string;
    estado: string | null;
    tipo: string | null;
    origen: string | null;
  };

  const { data: existingInsc, error: findInscError } = await supabaseService
    .from("inscripciones")
    .select("id,estado,tipo,origen")
    .eq("voluntario_id", voluntario.id)
    .eq("operativo_id", operativo.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ExistingInscripcion>();

  if (findInscError && findInscError.code !== "PGRST116") throw findInscError;

  if (existingInsc) {
    const estado = normalizeInscripcionEstado(existingInsc.estado);
    const origin = inferInscripcionOrigen(existingInsc.tipo, existingInsc.origen);

    if (isPendingEstado(estado)) {
      if (isInvitacionTipo(existingInsc.origen ?? existingInsc.tipo)) {
        return statusResponse({
          ok: false,
          code: "INVITED_ALREADY",
          message: "Ya fuiste invitado a este operativo. Revisa tu correo y acepta la invitación.",
          extra: { origin },
        });
      }
      return statusResponse({
        ok: false,
        code: "ALREADY_PENDING",
        message: "Ya enviaste tu postulación para este operativo. Está en proceso de revisión.",
        extra: { origin },
      });
    }

    if (isConfirmedEstado(estado)) {
      const extraText = operativo.whatsapp_grupo_url
        ? " Revisa el correo de confirmación donde te compartimos el link al grupo de WhatsApp."
        : " Revisa el correo de confirmación que te enviamos con los siguientes pasos.";
      return statusResponse({
        ok: false,
        code: "ALREADY_ACCEPTED",
        message: `Ya estás inscrito en este operativo.${extraText}`,
        extra: { origin },
      });
    }

    // Si fue rechazado, PERMITIR repostulación reactivando la inscripción existente
    if (isRejectedEstado(estado)) {
      // Reactivar la inscripción existente cambiando estado a pendiente
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: reactivateError } = await (supabaseService as any)
        .from("inscripciones")
        .update({
          estado: INSCRIPCION_ESTADO.PENDIENTE,
          origen: INSCRIPCION_ORIGEN.POSTULACION,
          // updated_at se actualiza automáticamente por Supabase
        })
        .eq("id", existingInsc.id);

      if (reactivateError) {
        console.error("[postulaciones/registrar] Error reactivando inscripción:", reactivateError);
        return statusResponse({
          ok: false,
          code: "ALREADY_REVIEWED",
          message: "No se pudo procesar tu nueva postulación. Por favor intenta más tarde.",
          extra: { origin },
        });
      }

      // Enviar email de confirmación de repostulación
      try {
        await sendPostulacionRecibidaEmail({
          to: email,
          nombre: [nombres, apellidos].filter(Boolean).join(" ") || nombres,
          operativoTitulo: operativo.titulo || "Operativo Traesol",
          operativoFecha: operativo.fecha_inicio,
          operativoLugar: operativo.lugar,
          operativoSlug: operativo.slug,
        });
      } catch (mailError) {
        console.error("sendPostulacionRecibidaEmail error (repostulación)", mailError);
      }

      // Email al admin
      try {
        await sendPostulacionAdminEmail({
          inscripcionId: existingInsc.id,
          voluntario: {
            nombres,
            apellidos,
            email,
            telefono,
            rut,
            id_nacional: null,
            profesion,
            talla_polera: tallaPolera,
            restricciones_alimentarias: restricciones,
          },
          operativo: {
            titulo: operativo.titulo,
            fecha_inicio: operativo.fecha_inicio,
            lugar: operativo.lugar,
            link: buildOperativoLink(operativo),
          },
          isReapplication: true,
        });
      } catch (adminMailError) {
        console.error("sendPostulacionAdminEmail error (repostulación)", adminMailError);
      }

      return statusResponse({
        ok: true,
        code: "OK",
        message: "¡Hemos recibido tu nueva postulación! Te contactaremos pronto.",
        extra: { reapplication: true, inscripcionId: existingInsc.id },
      });
    }
  }

  // 3. Crear inscripción (igual que flujo anónimo)
  const inscPayload: InscripcionInsert = {
    voluntario_id: voluntario.id,
    operativo_id: operativo.id,
    tipo: INSCRIPCION_TIPO_SCOPE.ESPECIFICA,
    origen: INSCRIPCION_ORIGEN.POSTULACION,
    estado: INSCRIPCION_ESTADO.PENDIENTE,
  };

  let inscripcionId: string | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insc, error: inscError } = await (supabaseService as any)
      .from("inscripciones")
      .insert(inscPayload)
      .select("id")
      .single();

    if (inscError) throw inscError;
    inscripcionId = (insc as { id: string } | null)?.id ?? null;
  } catch (inscErr: unknown) {
    const message = String((inscErr as { message?: string })?.message || "");
    const code = (inscErr as { code?: string })?.code;
    if (code === "23505" || message.includes("duplicate key value")) {
      return statusResponse({
        ok: false,
        code: "ALREADY_PENDING",
        message: "Ya registramos una postulación para este operativo. Si necesitas actualizarla, escríbenos para ayudarte.",
        extra: { reason: "duplicate" },
      });
    }
    throw inscErr;
  }

  // 4. Enviar emails
  // Email al voluntario confirmando postulación
  try {
    await sendPostulacionRecibidaEmail({
      to: email,
      nombre: [nombres, apellidos].filter(Boolean).join(" ") || nombres,
      operativoTitulo: operativo.titulo || "Operativo Traesol",
      operativoFecha: operativo.fecha_inicio,
      operativoLugar: operativo.lugar,
      operativoSlug: operativo.slug,
    });
  } catch (mailError) {
    console.error("sendPostulacionRecibidaEmail error (user account)", mailError);
  }

  // Email al admin con botones de acción
  if (inscripcionId) {
    try {
      await sendPostulacionAdminEmail({
        inscripcionId,
        voluntario: {
          nombres,
          apellidos,
          email,
          telefono,
          rut,
          id_nacional: null,
          profesion,
          talla_polera: tallaPolera,
          restricciones_alimentarias: restricciones,
        },
        operativo: {
          id: operativo.id,
          titulo: operativo.titulo,
          slug: operativo.slug,
          fecha_inicio: operativo.fecha_inicio,
          lugar: operativo.lugar,
        },
        postuladoPor: null,
        // Ya no necesitamos isUserAccount porque usamos inscripciones normales
      });
    } catch (mailError) {
      console.error("sendPostulacionAdminEmail error (user account)", mailError);
    }
  }

  // Email de bienvenida si es nuevo voluntario
  if (wasNewVoluntario) {
    try {
      await sendRegistroVoluntarioEmail({
        to: email,
        nombres,
      });
    } catch (mailError) {
      console.error("sendRegistroVoluntarioEmail error", mailError);
    }
  }

  return statusResponse({
    ok: true,
    code: "OK",
    message: "Tu postulación fue recibida. Te enviaremos un correo cuando sea evaluada.",
    extra: {
      voluntarioId: voluntario.id,
      inscripcionId,
      wasNewVoluntario,
      tipo_postulacion: "especifica",
      fromUserAccount: true,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nombres = asString(body?.nombres);
    const email = normalizeEmail(asString(body?.email));
    const genero = asString(body?.genero);
    const extranjero = Boolean(body?.extranjero);
    const rut = extranjero ? null : normalizeRut(asString(body?.rut));
    const idNacional = extranjero ? asString(body?.id_nacional) : null;
    
    // Flags para postulación de otra persona
    const postulandoOtraPersona = Boolean(body?.postulando_otra_persona);
    const postuladoPorUserId = nullable(body?.postulado_por_user_id);
    
    // Flag para postulación desde cuenta de usuario (vs anónimo)
    const fromUserAccount = Boolean(body?.from_user_account);
    const userId = nullable(body?.user_id);

    if (!nombres || !email) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos obligatorios (nombres, email)." },
        { status: 400 }
      );
    }
    
    // Si viene de cuenta de usuario, manejar con operativo_participantes
    if (fromUserAccount && userId) {
      return handleUserAccountPostulation(body, userId, nombres, email);
    }

    if (!extranjero && !rut) {
      return NextResponse.json(
        { ok: false, error: "El RUT es obligatorio para postulantes chilenos." },
        { status: 400 }
      );
    }

    if (extranjero && !idNacional) {
      return NextResponse.json(
        { ok: false, error: "Indica tu identificación nacional." },
        { status: 400 }
      );
    }

    let wasNewVoluntario = false;
    let updatedVoluntario = false;
    let voluntario: VoluntarioMinimal | null = null;

    if (email) {
      const { data: existente, error } = await supabaseService
        .from("voluntarios")
        .select("id,nombres,apellidos,email")
        .eq("email", email)
        .maybeSingle<VoluntarioMinimal>();
      if (error && error.code !== "PGRST116") throw error;
      voluntario = existente ?? null;
    }

    if (!voluntario && rut) {
      const { data: existente, error } = await supabaseService
        .from("voluntarios")
        .select("id,nombres,apellidos,email")
        .eq("rut", rut)
        .maybeSingle<VoluntarioMinimal>();
      if (error && error.code !== "PGRST116") throw error;
      voluntario = existente ?? null;
    }

    if (!voluntario && idNacional) {
      const { data: existente, error } = await supabaseService
        .from("voluntarios")
        .select("id,nombres,apellidos,email")
        .eq("id_nacional", idNacional)
        .maybeSingle<VoluntarioMinimal>();
      if (error && error.code !== "PGRST116") throw error;
      voluntario = existente ?? null;
    }

    const record = {
      nombres,
      apellidos: nullable(body?.apellidos),
      nacionalidad: nullable(body?.nacionalidad),
      genero: genero || null,
      fecha_nacimiento: nullable(body?.fecha_nacimiento),
      rut,
      id_nacional: idNacional,
      pasaporte: nullable(body?.pasaporte),
      email,
      telefono: nullable(body?.telefono),
      direccion: nullable(body?.direccion),
      instagram: nullable(body?.instagram),
      profesion: nullable(body?.profesion) || null,
      profesion_otro: asString(body?.profesion) === "Otro" ? nullable(body?.profesion_otro) : null,
      especialidad: nullable(body?.especialidad),
      talla_polera: nullable(body?.talla_polera),
      talla_pantalon: nullable(body?.talla_pantalon),
      alimentarias_alergias: nullable(body?.alimentarias_alergias),
      alimentarias_veg: Boolean(body?.alimentarias_veg),
      alimentarias_otro: nullable(body?.alimentarias_otro),
      nombre_credencial: nullable(body?.nombre_credencial),
    } as const;

    if (voluntario) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updated, error: updateError } = await (supabaseService as any)
        .from("voluntarios")
        .update(record)
        .eq("id", voluntario.id)
        .select("id,nombres,apellidos,email")
        .single();

      if (updateError) throw updateError;
      voluntario = updated as VoluntarioMinimal;
      updatedVoluntario = true;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted, error: insertError } = await (supabaseService as any)
        .from("voluntarios")
        .insert({ ...record })
        .select("id,nombres,apellidos,email")
        .single();

      if (insertError) throw insertError;
      voluntario = inserted as VoluntarioMinimal;
      wasNewVoluntario = true;
    }

    if (!voluntario?.id || !voluntario.email) {
      throw new Error("No se pudo obtener la información del voluntario.");
    }

    const tipoPostulacion = asString(body?.tipo_postulacion) === "especifica" ? "especifica" : "general";
    const operativoId = nullable(body?.operativo_id);
    const operativoSlug = nullable(body?.operativo_slug);

    let operativo: OperativoInfo | null = null;
    if (tipoPostulacion === "especifica") {
      const targetField = operativoId ? "id" : "slug";
      const targetValue = operativoId || operativoSlug;

      if (!targetValue) {
        return NextResponse.json(
          { ok: false, error: "Selecciona un operativo válido para la postulación específica." },
          { status: 400 }
        );
      }

      const { data: op, error: opError } = await supabaseService
        .from("operativos")
        .select("id,titulo,slug,fecha_inicio,fecha_fin,lugar,whatsapp_grupo_url")
        .eq(targetField, targetValue)
        .maybeSingle<OperativoInfo>();

      if (opError) throw opError;
      if (!op) {
        return NextResponse.json(
          { ok: false, error: "El operativo seleccionado no existe." },
          { status: 400 }
        );
      }

      operativo = op;
    }

    let inscripcionId: string | null = null;
    let createdInscripcion = false;

    if (operativo?.id) {
      const { data: existingInscripcion, error: findInsError } = await supabaseService
        .from("inscripciones")
        .select("id,estado,tipo,origen,created_at")
        .eq("voluntario_id", voluntario.id)
        .eq("operativo_id", operativo.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<ExistingInscripcion>();

      if (findInsError && findInsError.code !== "PGRST116") {
        throw findInsError;
      }

      if (existingInscripcion) {
        const origin = inferInscripcionOrigen(
          existingInscripcion.tipo,
          existingInscripcion.origen,
        );
        const estado = normalizeInscripcionEstado(existingInscripcion.estado);
        if (isPendingEstado(estado)) {
          if (isInvitacionTipo(existingInscripcion.origen ?? existingInscripcion.tipo)) {
            return statusResponse({
              ok: false,
              code: "INVITED_ALREADY",
              message: "Ya fuiste invitado a este operativo. Revisa tu correo y acepta la invitación.",
              extra: { origin },
            });
          }

          return statusResponse({
            ok: false,
            code: "ALREADY_PENDING",
            message: "Ya enviaste tu postulación para este operativo. Está en proceso de revisión.",
            extra: { origin },
          });
        }

        if (isConfirmedEstado(estado)) {
          const extraText = operativo.whatsapp_grupo_url
            ? " Revisa el correo de confirmación donde te compartimos el link al grupo de WhatsApp."
            : " Revisa el correo de confirmación que te enviamos con los siguientes pasos.";
          return statusResponse({
            ok: false,
            code: "ALREADY_ACCEPTED",
            message: `Ya estás inscrito en este operativo.${extraText}`,
            extra: { origin },
          });
        }

        if (isRejectedEstado(estado)) {
          return statusResponse({
            ok: false,
            code: "ALREADY_REVIEWED",
            message:
              "Tu postulación para este operativo ya fue revisada. Si tienes dudas, escríbenos a contacto@fundaciontraesol.cl.",
            extra: { origin },
          });
        }
      }

        const insertPayload: InscripcionInsert = {
        voluntario_id: voluntario.id,
        operativo_id: operativo.id,
          tipo: INSCRIPCION_TIPO_SCOPE.ESPECIFICA,
          origen: INSCRIPCION_ORIGEN.POSTULACION,
          estado: INSCRIPCION_ESTADO.PENDIENTE,
        };

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: insc, error: inscError } = await (supabaseService as any)
          .from("inscripciones")
          .insert(insertPayload)
          .select("id")
          .single();

        if (inscError) throw inscError;
        inscripcionId = (insc as { id: string } | null)?.id ?? null;
        createdInscripcion = true;
      } catch (inscErr: any) {
        const message = String(inscErr?.message || "");
        if (inscErr?.code === "23505" || message.includes("duplicate key value")) {
          return statusResponse({
            ok: false,
            code: "ALREADY_PENDING",
            message:
              "Ya registramos una postulación para este operativo. Si necesitas actualizarla, escríbenos para ayudarte.",
            extra: { reason: "duplicate" },
          });
        }
        throw inscErr;
      }

      const operativoLink = buildOperativoLink(operativo);
      
      // Email al voluntario confirmando postulación
      try {
        await sendPostulacionRecibidaEmail({
          to: voluntario.email || "",
          nombre: [voluntario.nombres, voluntario.apellidos].filter(Boolean).join(" ") || nombres,
          operativoTitulo: operativo.titulo || "Operativo Traesol",
          operativoFecha: operativo.fecha_inicio,
          operativoLugar: operativo.lugar,
          operativoSlug: operativo.slug,
        });
      } catch (mailError) {
        console.error("sendPostulacionRecibidaEmail error", mailError);
      }

      // Email al admin con botones de acción (solo si tenemos inscripcionId)
      if (inscripcionId) {
        try {
          await sendPostulacionAdminEmail({
            inscripcionId,
            voluntario: {
              nombres: voluntario.nombres || nombres,
              apellidos: voluntario.apellidos || nullable(body?.apellidos),
              email: voluntario.email,
              telefono: nullable(body?.telefono),
              rut: rut,
              id_nacional: idNacional,
              profesion: nullable(body?.profesion),
              talla_polera: nullable(body?.talla_polera),
              restricciones_alimentarias: nullable(body?.alimentarias_alergias),
            },
            operativo: {
              id: operativo.id,
              titulo: operativo.titulo,
              slug: operativo.slug,
              fecha_inicio: operativo.fecha_inicio,
              lugar: operativo.lugar,
            },
            // Incluir info si fue postulado por otra persona
            postuladoPor: postulandoOtraPersona && postuladoPorUserId ? {
              userId: postuladoPorUserId,
              // Podríamos buscar el email del usuario, pero por ahora solo el ID
            } : null,
          });
        } catch (mailError) {
          console.error("sendPostulacionAdminEmail error", mailError);
        }
      }

      // Email legacy (por compatibilidad)
      try {
        await sendPostulacionOperativoEmails({
          voluntario: {
            nombres: voluntario.nombres || nombres,
            apellidos: voluntario.apellidos,
            email: voluntario.email,
          },
          operativo: {
            titulo: operativo.titulo || "Operativo Traesol",
            fecha_inicio: operativo.fecha_inicio,
            fecha_fin: operativo.fecha_fin,
            lugar: operativo.lugar,
            link: operativoLink,
          },
          origen: "postulacion-web",
        });
      } catch (mailError) {
        console.error("sendPostulacionOperativoEmails error", mailError);
      }
    }

    if (wasNewVoluntario) {
      try {
        await sendRegistroVoluntarioEmail({
          to: voluntario.email,
          nombres: voluntario.nombres || nombres,
        });
      } catch (mailError) {
        console.error("sendRegistroVoluntarioEmail error", mailError);
      }
    } else if (updatedVoluntario && !createdInscripcion) {
      try {
        await sendActualizacionVoluntarioEmail({
          to: voluntario.email,
          nombres: voluntario.nombres || nombres,
        });
      } catch (mailError) {
        console.error("sendActualizacionVoluntarioEmail error", mailError);
      }
    }

    if (!operativo?.id) {
      return statusResponse({
        ok: true,
        code: "PROFILE_UPDATED",
        message: "Actualizamos tus datos en Traesol.",
        extra: {
          voluntarioId: voluntario.id,
          wasNewVoluntario,
          tipo_postulacion: tipoPostulacion,
          createdInscripcion,
        },
      });
    }

    return statusResponse({
      ok: true,
      code: "OK",
      message: "Tu postulación fue recibida. Te enviaremos un correo cuando sea evaluada.",
      extra: {
        voluntarioId: voluntario.id,
        inscripcionId,
        wasNewVoluntario,
        tipo_postulacion: tipoPostulacion,
        createdInscripcion,
      },
    });
  } catch (err: any) {
    console.error("POST /api/postulaciones/registrar", err);
    const message = err?.message ? String(err.message) : "Error inesperado";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
