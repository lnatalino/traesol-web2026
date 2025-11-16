// src/components/Metrics.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Users, HeartPulse } from "lucide-react"; // <-- íconos nítidos

export type MetricsInput = {
  operativos_publicados: number;
  voluntarios_total: number;
  asistencias_marcadas: number;
};

// bases históricas
const BASES = { operativos: 200, voluntarios: 400, atenciones: 8000 };

function useCountUp(target: number, duration = 2500) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const start = () => {
      if (started.current) return;
      started.current = true;
      if (reduceMotion || duration <= 0 || target <= 0) {
        setVal(target);
        return;
      }
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && start()),
      { threshold: 0.2 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [target, duration]);

  return { ref, val };
}

export default function Metrics({ m }: { m: MetricsInput }) {
  const totals = useMemo(
    () => ({
      operativos: BASES.operativos + (m?.operativos_publicados ?? 0),
      voluntarios: BASES.voluntarios + (m?.voluntarios_total ?? 0),
      atenciones: BASES.atenciones + (m?.asistencias_marcadas ?? 0),
    }),
    [m]
  );

  const op = useCountUp(totals.operativos);
  const vol = useCountUp(totals.voluntarios);
  const aten = useCountUp(totals.atenciones);

  // quitamos variables CSS personalizadas; usamos Tailwind neutro
  const box = "rounded-2xl border bg-white p-8 shadow-sm flex flex-col items-center justify-center text-center";
  const num = "text-5xl font-bold text-gray-900 tracking-tight tabular-nums";
  const label = "mt-3 text-lg font-semibold text-gray-600";
  const iconClass = "w-12 h-12 text-blue-700 mb-4"; // color fijo limpio

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className={box}>
        <Building2 className={iconClass} />
        <div ref={op.ref} className={num}>{op.val.toLocaleString("es-CL")}</div>
        <div className={label}>Operativos</div>
      </div>

      <div className={box}>
        <Users className={iconClass} />
        <div ref={vol.ref} className={num}>{vol.val.toLocaleString("es-CL")}</div>
        <div className={label}>Voluntarios</div>
      </div>

      <div className={box}>
        <HeartPulse className={iconClass} />
        <div ref={aten.ref} className={num}>{aten.val.toLocaleString("es-CL")}</div>
        <div className={label}>Atenciones de salud</div>
      </div>
    </div>
  );
}
