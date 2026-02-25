"use client";

import { useEffect, useRef, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Delay class: delay-1 through delay-4 */
  delay?: 0 | 1 | 2 | 3 | 4;
  /** Use stagger mode for children */
  stagger?: boolean;
  /** Threshold for intersection observer */
  threshold?: number;
};

/**
 * ScrollReveal - Animación suave de aparición al hacer scroll.
 * 
 * Envuelve contenido para que aparezca con fade-in + slide-up
 * cuando entra en el viewport. Usa IntersectionObserver.
 * 
 * No altera funcionalidad, solo agrega animación visual.
 */
export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  stagger = false,
  threshold = 0.1,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const baseClass = stagger ? "stagger-children" : "animate-on-scroll";
  const delayClass = delay > 0 ? `delay-${delay}` : "";

  return (
    <div ref={ref} className={`${baseClass} ${delayClass} ${className}`}>
      {children}
    </div>
  );
}
