// src/components/public/OperativoCard.tsx
import Link from "next/link";
import { Calendar, MapPin, ArrowRight, Stethoscope } from "lucide-react";
import { formatDateChile } from "./DatePill";

type Props = {
  slug: string;
  titulo: string;
  fecha_inicio: string | null;
  lugar: string | null;
  imagen: string;
  /** Show "Postular" or "Ver detalles" */
  showPostular?: boolean;
  /** Is this a surgical operative? */
  isQuirurgico?: boolean;
};

const PLACEHOLDER_IMAGE = "https://placehold.co/800x400?text=Operativo+Traesol";

/**
 * Card de operativo para listados públicos.
 * Diseño tipo "isla" con imagen, fecha prominente, lugar y CTA.
 */
export function OperativoCard({
  slug,
  titulo,
  fecha_inicio,
  lugar,
  imagen,
  showPostular = true,
  isQuirurgico = false,
}: Props) {
  const imageSrc = imagen || PLACEHOLDER_IMAGE;
  const fechaDisplay = fecha_inicio ? formatDateChile(fecha_inicio) : "Fecha por confirmar";
  
  // CTA text depends on operative type
  const ctaText = isQuirurgico 
    ? "Postular equipo clínico"
    : showPostular 
      ? "Postular" 
      : "Ver detalles";
  
  // Link depends on operative type
  const href = isQuirurgico 
    ? `/quirurgico/${slug}` 
    : `/operativos/${slug}`;
  
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.08)]"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={imageSrc} 
          alt={titulo} 
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Badges overlay */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          {/* Date badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-lg backdrop-blur-sm">
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            {fechaDisplay}
          </div>
          
          {/* Quirurgico badge */}
          {isQuirurgico && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-600/95 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
              <Stethoscope className="h-3.5 w-3.5" />
              Quirúrgico
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 leading-snug">
          {titulo}
        </h3>
        
        {lugar && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="line-clamp-1">{lugar}</span>
          </div>
        )}
        
        {/* CTA - full-width on mobile */}
        <div className="mt-4">
          <span className={`inline-flex sm:w-auto w-full items-center justify-center gap-1.5 text-sm font-semibold transition group-hover:gap-2 rounded-xl py-2.5 sm:py-0 sm:rounded-none sm:bg-transparent ${
            isQuirurgico 
              ? "text-violet-600 bg-violet-50 sm:bg-transparent" 
              : "text-blue-600 bg-blue-50 sm:bg-transparent"
          }`}>
            {ctaText}
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
