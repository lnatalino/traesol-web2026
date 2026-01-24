// src/components/public/NovedadCard.tsx
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { formatDateChile } from "./DatePill";

type Props = {
  slug: string;
  titulo: string;
  resumen: string | null;
  imagen: string | null;
  fecha_publicacion: string | null;
  /** Type of content */
  tipo?: "noticia" | "comunicado" | "evento";
};

const PLACEHOLDER_IMAGE = "https://placehold.co/800x600?text=Traesol";

const TIPO_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  noticia: { bg: "bg-blue-100", text: "text-blue-700", label: "Noticia" },
  comunicado: { bg: "bg-amber-100", text: "text-amber-700", label: "Comunicado" },
  evento: { bg: "bg-green-100", text: "text-green-700", label: "Evento" },
};

/**
 * Card de novedad estilo "Instagram" para el feed público.
 * Imagen cuadrada, título, resumen y fecha.
 */
export function NovedadCard({
  slug,
  titulo,
  resumen,
  imagen,
  fecha_publicacion,
  tipo = "noticia",
}: Props) {
  const imageSrc = imagen || PLACEHOLDER_IMAGE;
  const fechaDisplay = fecha_publicacion ? formatDateChile(fecha_publicacion) : "";
  const style = TIPO_STYLES[tipo] || TIPO_STYLES.noticia;
  
  return (
    <Link
      href={`/novedades/${slug}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Square image for Instagram feel */}
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={imageSrc} 
          alt={titulo} 
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        
        {/* Type badge */}
        <div className="absolute left-3 top-3">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>
            {style.label}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Date */}
        {fechaDisplay && (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            {fechaDisplay}
          </div>
        )}
        
        <h3 className="text-base font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600">
          {titulo}
        </h3>
        
        {resumen && (
          <p className="mt-2 text-sm text-slate-600 line-clamp-2">
            {resumen}
          </p>
        )}
        
        {/* CTA */}
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition group-hover:gap-2">
          Leer más
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  );
}
