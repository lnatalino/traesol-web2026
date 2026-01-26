// src/app/operativos/[slug]/_client.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";

type OperativoRow = {
  id: string;
  slug: string;
  titulo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
  direccion: string | null;
  descripcion: string | null;
  cupos_total: number | null;
  imagen_cabecera_url: string | null;
  estado: string | null;
  instagram_url: string | null;
  whatsapp_grupo_url: string | null;
  created_at: string;
};

type OperativoImagenRow = {
  id: string;
  operativo_id: string;
  url: string | null;
  path: string | null;
};

type Operativo = OperativoRow & {
  imagenes: Array<Pick<OperativoImagenRow, "id" | "url" | "path">>;
};

type OperativoWithImages = OperativoRow & {
  operativo_imagenes?: Array<Pick<OperativoImagenRow, "id" | "url" | "path">>;
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
      const { data: pub, error: publishedError } = await supabase
        .from("operativos")
        .select(
          "id,titulo,slug,descripcion,fecha_inicio,fecha_fin,lugar,direccion,cupos_total,estado,imagen_cabecera_url,instagram_url,operativo_imagenes(id,url,path)"
        )
        .eq("slug", slug)
        .eq("estado", "publicado")
        .maybeSingle<OperativoWithImages>();

      if (publishedError) console.error("[operativos] client published error", publishedError);

      if (alive && pub) {
        const { operativo_imagenes: publishedImages, ...rest } = pub;

        const imagenes = Array.isArray(publishedImages)
          ? publishedImages
              .filter((img) => typeof img?.url === "string" && !!img.url)
              .map((img) => ({ id: String(img.id ?? img.url), url: String(img.url), path: img.path ?? null }))
          : [];

        setOp({
          ...rest,
          imagenes,
        });
        setLoading(false);
        return;
      }

      // 2) Diagnóstico: ver si existe con otro estado
      const { data: anyRow, error: anyStateError } = await supabase
        .from("operativos")
        .select("id,slug,estado,titulo")
        .eq("slug", slug)
        .maybeSingle<Pick<OperativoRow, "id" | "slug" | "estado" | "titulo">>();

      if (anyStateError) console.error("[operativos] client any-state error", anyStateError);

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
        <Link href="/" className="inline-block px-4 py-2 rounded-xl border hover:bg-gray-50">
          Volver al inicio
        </Link>
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
        <Image src={imageSrc} alt={op.titulo || "Operativo Traesol"} fill className="object-cover" unoptimized priority />
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
          <Link
            href={`/postular?operativo=${encodeURIComponent(op.slug)}`}
            className="px-4 py-2 rounded-xl border shadow hover:shadow-md transition"
          >
            Postular como voluntario
          </Link>
          <a href="#contacto" className="px-4 py-2 rounded-xl border hover:bg-gray-50 transition">
            Consultas
          </a>
        </div>
        <p className="text-xs text-gray-500">* La postulación requiere aprobación manual.</p>
      </section>
    </main>
  );
}
