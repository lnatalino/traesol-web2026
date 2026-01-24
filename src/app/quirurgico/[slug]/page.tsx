// src/app/quirurgico/[slug]/page.tsx
// Página pública de detalle de un operativo quirúrgico

import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, ArrowLeft, Stethoscope, UserPlus } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { PostulacionEquipoForm } from "./_components/PostulacionEquipoForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type OperativoQuirurgicoPublic = {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  ciudad: string | null;
  lugar: string | null;
  imagen_cabecera_url: string | null;
};

async function fetchOperativo(slug: string): Promise<OperativoQuirurgicoPublic | null> {
  const supabase = createSupabaseServer();
  
  try {
    const { data, error } = await supabase
      .from("operativos_quirurgicos")
      .select("id,slug,titulo,descripcion,fecha_inicio,fecha_fin,ciudad,lugar,imagen_cabecera_url")
      .eq("slug", slug)
      .eq("publicado", true)
      .maybeSingle();

    if (error) {
      console.error("[quirurgico/[slug]] fetch error:", error.message);
      return null;
    }

    return data as OperativoQuirurgicoPublic | null;
  } catch (err) {
    console.error("[quirurgico/[slug]] fetch error:", err);
    return null;
  }
}

function formatDateRange(inicio: string | null, fin: string | null): string {
  if (!inicio) return "Fecha por confirmar";
  
  const format = new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Santiago",
  });
  
  const startDate = new Date(inicio);
  const formattedStart = format.format(startDate);
  
  if (!fin) return formattedStart;
  
  const endDate = new Date(fin);
  if (startDate.getTime() === endDate.getTime()) return formattedStart;
  
  return `${format.format(startDate)} - ${format.format(endDate)}`;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const op = await fetchOperativo(slug);
  
  if (!op) return { title: "Operativo no encontrado" };
  
  return {
    title: `${op.titulo} · Traesol`,
    description: op.descripcion || `Operativo quirúrgico en ${op.ciudad || op.lugar || "Chile"}`,
  };
}

export default async function OperativoQuirurgicoPage({ params }: PageProps) {
  const { slug } = await params;
  const op = await fetchOperativo(slug);
  
  if (!op) {
    notFound();
  }

  const imageSrc = op.imagen_cabecera_url || "https://placehold.co/1200x600?text=Operativo+Quirúrgico";
  const ubicacion = [op.lugar, op.ciudad].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero with image */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/80 to-violet-900/40" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={op.titulo}
          className="h-[400px] w-full object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-end pb-8">
          <div className="mx-auto w-full max-w-6xl px-4 lg:px-6">
            <Link
              href="/operativos"
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/80 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver a operativos
            </Link>
            
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                <Stethoscope className="h-3.5 w-3.5" />
                Operativo Quirúrgico
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              {op.titulo}
            </h1>
            
            <div className="mt-4 flex flex-wrap items-center gap-4 text-white/90">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDateRange(op.fecha_inicio, op.fecha_fin)}
              </div>
              {ubicacion && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {ubicacion}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {op.descripcion && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Acerca del operativo
                </h2>
                <div className="prose prose-slate max-w-none">
                  <p className="whitespace-pre-wrap">{op.descripcion}</p>
                </div>
              </div>
            )}

            {/* Info box */}
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-violet-100 p-3">
                  <UserPlus className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-violet-900">
                    ¿Eres profesional de la salud?
                  </h3>
                  <p className="mt-1 text-sm text-violet-700">
                    Los operativos quirúrgicos requieren equipos clínicos especializados. 
                    Si eres médico, enfermero/a, anestesiólogo/a, instrumentista u otro 
                    profesional de la salud, puedes postular para ser parte del equipo.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar with form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                Postular al equipo clínico
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                Completa el formulario para postular como parte del equipo médico de este operativo.
              </p>
              
              <PostulacionEquipoForm operativoId={op.id} operativoTitulo={op.titulo} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
