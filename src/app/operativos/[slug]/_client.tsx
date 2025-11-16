// src/app/operativos/[slug]/_client.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabaseServer";

type Operativo = {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  lugar: string | null;
  direccion: string | null;
  cupos_total: number | null;
  estado: "borrador" | "publicado" | "cerrado" | "finalizado";
  imagen_cabecera_url: string | null;
  instagram_url: string | null;
  imagenes: Array<{ id: string; url: string; path: string | null }>;
};

function fDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString();
}

export default function OperativoDetailClient({ slug }: { slug: string }) {
  const supabase = createSupabaseBrowser();
  const [op, setOp] = useState<Operativo | null>(null);
  const [loading, setLoading] = useState(true);
  const [motivo, setMotivo] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setMotivo(null);

      // 1) publicado
      const { data: pub, error: e1 } = await supabase
        .from("operativos")
        .select(
          "id,titulo,slug,descripcion,fecha_inicio,fecha_fin,lugar,direccion,cupos_total,estado,imagen_cabecera_url,instagram_url,operativo_imagenes(id,url,path)"
        )
        .eq("slug", slug)
        .eq("estado", "publicado")
        .maybeSingle();

      if (e1) console.log("operativo publicado error:", e1);

      if (alive && pub) {
        const imagenes = Array.isArray((pub as any)?.operativo_imagenes)
          ? (pub as any).operativo_imagenes
              .filter((img: any) => typeof img?.url === "string" && img.url)
              .map((img: any) => ({
                id: String(img.id ?? img.url),
                url: String(img.url),
                path: img.path ?? null,
              }))
          : [];

        const { operativo_imagenes, ...rest } = (pub as any) ?? {};

        setOp({
          ...(rest as Omit<Operativo, "imagenes">),
          imagenes,
        });
        setLoading(false);
        return;
      }

      // 2) Diagnóstico: ver si existe con otro estado
      const { data: anyRow, error: e2 } = await supabase
        .from("operativos")
        .select("id,slug,estado,titulo")
        .eq("slug", slug)
        .maybeSingle();

      if (e2) console.log("operativo any error:", e2);

      if (alive) {
        if (anyRow) {
          setMotivo(`Existe con estado: ${anyRow.estado}`);
        } else {
          setMotivo("No existe");
        }
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [slug, supabase]);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-56 md:h-72 rounded-2xl bg-gray-200" />
        <div className="h-6 w-1/3 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
      </main>
    );
  }

  if (!op) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold">Operativo no encontrado</h1>
        {motivo && <p className="text-gray-600">{motivo}</p>}
        <a href="/" className="inline-block px-4 py-2 rounded-xl border hover:bg-gray-50">
          Volver al inicio
        </a>
      </main>
    );
  }

  const portadaFallback = op.imagenes[0]?.url;
  const imageSrc =
    op.imagen_cabecera_url && op.imagen_cabecera_url.trim() !== ""
      ? op.imagen_cabecera_url
      : portadaFallback || "https://placehold.co/1200x400?text=Operativo+Traesol";

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="relative h-56 md:h-72 rounded-2xl overflow-hidden border shadow">
        <Image src={imageSrc} alt={op.titulo} fill className="object-cover" unoptimized priority />
      </div>

      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">{op.titulo}</h1>
        <p className="text-gray-600">
          {fDate(op.fecha_inicio)}
          {op.fecha_fin ? ` — ${fDate(op.fecha_fin)}` : ""} {op.lugar ? `· ${op.lugar}` : ""}
        </p>
        {op.direccion && <p className="text-gray-500 text-sm">{op.direccion}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs border">
            Estado: {op.estado}
          </span>
          {typeof op.cupos_total === "number" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs border">
              Cupos: {op.cupos_total}
            </span>
          )}
          {op.instagram_url && (
            <a
              className="inline-flex items-center px-3 py-1 rounded-full text-xs border hover:bg-gray-50"
              href={op.instagram_url}
              target="_blank"
              rel="noreferrer"
            >
              Ver en Instagram
            </a>
          )}
        </div>
      </header>

      {op.descripcion && (
        <section className="prose max-w-none">
          <p>{op.descripcion}</p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">¿Quieres participar?</h2>
        <div className="flex gap-3">
          <a
            href={`/postular?operativo=${encodeURIComponent(op.slug)}`}
            className="px-4 py-2 rounded-xl border shadow hover:shadow-md transition"
          >
            Postular como voluntario
          </a>
          <a href="#contacto" className="px-4 py-2 rounded-xl border hover:bg-gray-50 transition">
            Consultas
          </a>
        </div>
        <p className="text-xs text-gray-500">* La postulación requiere aprobación manual.</p>
      </section>
    </main>
  );
}
