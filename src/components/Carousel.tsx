"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export type Slide = {
  id: string;
  titulo?: string | null;
  imagen_url: string;
  href?: string | null;
};

type CarouselVariant = "default" | "hero";

export default function Carousel({
  slides = [] as Slide[],
  auto = true,
  interval = 5500,
  variant = "default",
}: {
  slides: Slide[];
  auto?: boolean;
  interval?: number;
  variant?: CarouselVariant;
}) {
  const slideList = (slides ?? []).filter((s) => Boolean(s?.imagen_url)) as Slide[];
  const [i, setI] = useState(0);
  const t = useRef<NodeJS.Timeout | null>(null);
  const totalSlides = slideList.length;

  const next = () => {
    if (!totalSlides) return;
    setI((prev) => (prev + 1) % totalSlides);
  };

  const prev = () => {
    if (!totalSlides) return;
    setI((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Auto-slide solo tiene sentido si hay 2+ slides
  useEffect(() => {
    if (t.current) {
      clearInterval(t.current);
      t.current = null;
    }

    if (!auto || totalSlides <= 1) return;

    t.current = setInterval(() => {
      setI((prev) => (prev + 1) % totalSlides);
    }, interval);

    return () => {
      if (t.current) {
        clearInterval(t.current);
        t.current = null;
      }
    };
  }, [totalSlides, auto, interval]);

  const activeIndex = totalSlides ? Math.min(i, totalSlides - 1) : 0;

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
    <div className="w-full" tabIndex={0} onKeyDown={onKeyDown}>
      <div
        className={`relative w-full overflow-hidden ${
          variant === "hero"
            ? "aspect-[21/9] min-h-[200px] sm:min-h-[240px] lg:min-h-[300px]"
            : "aspect-[16/9] rounded-[32px] border border-white/20 bg-white/10 shadow-2xl backdrop-blur"
        }`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {totalSlides ? (
          <>
            <div className="relative h-full w-full">
              {slideList.map((s, idx) => {
                const img = (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.imagen_url}
                    alt={s.titulo || "Slide"}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${idx === activeIndex ? "opacity-100" : "opacity-0"}`}
                    draggable={false}
                  />
                );

                return (
                  <div key={s.id} className={idx === activeIndex ? "relative h-full w-full" : "relative h-0 w-full"}>
                    {s.href ? <Link href={s.href}>{img}</Link> : img}
                    {s.titulo && idx === activeIndex && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-4 pb-4 pt-10 text-sm text-white sm:text-base">
                        {s.titulo}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Controles */}
            <button
              aria-label="Anterior"
              className="z-20 absolute left-4 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/80 text-slate-700 shadow hover:bg-white"
              onClick={prev}
              type="button"
            >
              ‹
            </button>
            <button
              aria-label="Siguiente"
              className="z-20 absolute right-4 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/80 text-slate-700 shadow hover:bg-white"
              onClick={next}
              type="button"
            >
              ›
            </button>

            {/* Dots */}
            <div className="z-20 absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
              {slideList.map((_, idx) => (
                <button
                  key={idx}
                  aria-label={`Ir a slide ${idx + 1}`}
                  onClick={() => setI(idx)}
                  className={`h-2.5 w-2.5 rounded-full ${idx === activeIndex ? "bg-white" : "bg-white/45"} ring-1 ring-black/10 transition`}
                  type="button"
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-[24px] bg-slate-100/80 px-6 text-center text-slate-600">
            <p className="text-base font-medium">
              Pronto compartiremos nuevas historias y campañas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
