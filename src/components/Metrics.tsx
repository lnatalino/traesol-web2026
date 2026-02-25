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

export function useCountUp(target: number, duration = 2500) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
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

export function CountUpNumber({
  target,
  className,
  prefix = "",
  suffix = "",
}: {
  target: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const { ref, val } = useCountUp(target);
  return (
    <span ref={ref} className={className}>
      {`${prefix}${val.toLocaleString("es-CL")}${suffix}`}
    </span>
  );
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

  const metrics = [
    {
      icon: Building2,
      value: totals.operativos,
      label: "Operativos",
      suffix: "+",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Users,
      value: totals.voluntarios,
      label: "Voluntarios",
      suffix: "+",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      icon: HeartPulse,
      value: totals.atenciones,
      label: "Atenciones de salud",
      suffix: "+",
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="group relative rounded-2xl border border-slate-200/80 bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center text-center"
        >
          {/* Decorative gradient dot */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full opacity-[0.04] blur-2xl bg-blue-600 group-hover:opacity-[0.08] transition-opacity" />
          
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${metric.bgColor} mb-5 transition-transform duration-200 group-hover:scale-110`}>
            <metric.icon className={`w-7 h-7 ${metric.color}`} />
          </div>
          <CountUpNumber
            target={metric.value}
            suffix={metric.suffix}
            className="text-5xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight tabular-nums"
          />
          <div className="mt-3 text-sm font-medium text-slate-500 tracking-wide uppercase">
            {metric.label}
          </div>
        </div>
      ))}
    </div>
  );
}
