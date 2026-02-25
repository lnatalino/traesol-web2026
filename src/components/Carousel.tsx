"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
            ? "aspect-[21/9] min-h-[220px] sm:min-h-[260px] lg:min-h-[320px]"
            : "aspect-[16/9] rounded-2xl border border-slate-200/60 bg-slate-100 shadow-lg"
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
                    className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${
                      idx === activeIndex 
                        ? "opacity-100 scale-100" 
                        : "opacity-0 scale-[1.02]"
                    }`}
                    draggable={false}
                  />
                );

                return (
                  <div key={s.id} className={idx === activeIndex ? "relative h-full w-full" : "relative h-0 w-full"}>
                    {s.href ? <Link href={s.href}>{img}</Link> : img}
                    {s.titulo && idx === activeIndex && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-6 pb-5 pt-14">
                        <p className="text-white text-sm sm:text-base font-medium drop-shadow-sm max-w-xl">
                          {s.titulo}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Controles - más refinados */}
            {totalSlides > 1 && (
              <>
                <button
                  aria-label="Anterior"
                  className="z-20 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-105 active:scale-95"
                  onClick={prev}
                  type="button"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  aria-label="Siguiente"
                  className="z-20 absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-105 active:scale-95"
                  onClick={next}
                  type="button"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Dots - más elegantes */}
                <div className="z-20 absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
                  {slideList.map((_, idx) => (
                    <button
                      key={idx}
                      aria-label={`Ir a slide ${idx + 1}`}
                      onClick={() => setI(idx)}
                      className={`rounded-full transition-all duration-300 ${
                        idx === activeIndex 
                          ? "bg-white w-7 h-2.5" 
                          : "bg-white/50 w-2.5 h-2.5 hover:bg-white/70"
                      }`}
                      type="button"
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50 px-6 text-center text-slate-500">
            <p className="text-base font-medium">
              Pronto compartiremos nuevas historias y campañas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
