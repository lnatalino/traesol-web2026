"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export type Slide = {
  id: string;
  titulo?: string | null;
  imagen_url: string;
  href?: string | null;
};

export default function Carousel({
  slides = [] as Slide[],
  auto = true,
  interval = 5500,
}: {
  slides: Slide[];
  auto?: boolean;
  interval?: number;
}) {
  const [i, setI] = useState(0);
  const t = useRef<NodeJS.Timeout | null>(null);

  const go = (k: number) => setI((prev) => (k + slides.length) % slides.length);
  const next = () => go(i + 1);
  const prev = () => go(i - 1);

  // Auto-slide solo tiene sentido si hay 2+ slides
  useEffect(() => {
    if (!auto || slides.length <= 1) return;
    if (t.current) clearInterval(t.current);
    t.current = setInterval(next, interval);
    return () => { if (t.current) clearInterval(t.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, slides.length, auto, interval]);

  if (!slides?.length) return null;

  // Swipe (móvil)
  const touch = useRef<{ x: number | null }>({ x: null });
  const onTouchStart = (e: React.TouchEvent) => { touch.current.x = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touch.current.x == null) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    if (dx > 40) prev();
    if (dx < -40) next();
    touch.current.x = null;
  };

  // Teclado
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-gray-200 outline-none"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      <div className="h-[320px] sm:h-[420px]">
        {slides.map((s, idx) => {
          const img = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={s.imagen_url}
              alt={s.titulo || "Slide"}
              className={`w-full h-full object-cover transition-opacity duration-500 ${idx === i ? "opacity-100" : "opacity-0 absolute inset-0"}`}
              draggable={false}
            />
          );
          return (
            <div key={s.id} className={idx === i ? "relative h-full" : "h-0"}>
              {s.href ? <Link href={s.href}>{img}</Link> : img}
              {s.titulo && idx === i && (
                <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white px-4 py-3 text-sm sm:text-base">
                  {s.titulo}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Controles: SIEMPRE visibles (aunque haya 1, para pruebas) */}
      <button
        aria-label="Anterior"
        className="z-20 absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-9 h-9 grid place-items-center shadow"
        onClick={prev}
        type="button"
      >
        ‹
      </button>
      <button
        aria-label="Siguiente"
        className="z-20 absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-9 h-9 grid place-items-center shadow"
        onClick={next}
        type="button"
      >
        ›
      </button>

      {/* Dots */}
      <div className="z-20 absolute bottom-2 inset-x-0 flex items-center justify-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Ir a slide ${idx + 1}`}
            onClick={() => go(idx)}
            className={`w-2.5 h-2.5 rounded-full ${idx === i ? "bg-white" : "bg-white/50"} ring-1 ring-black/10`}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
