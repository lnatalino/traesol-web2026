"use client";

import { CountUpNumber } from "@/components/Metrics";
import type { EmpresaMetricsRecord } from "@/lib/empresas";

export function EmpresasHeroMetrics({ metrics }: { metrics: EmpresaMetricsRecord }) {
  const cards = [
    {
      label: 'Operativos con empresas',
      value: metrics.operativosConEmpresas,
      prefix: '+',
    },
    {
      label: 'Colaboradores movilizados',
      value: metrics.colaboradoresMovilizados,
      prefix: '+',
    },
    {
      label: 'Regiones impactadas',
      value: metrics.regionesImpactadas,
      prefix: '',
    },
  ];

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-3 max-w-3xl mx-auto">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm p-5 text-center hover:bg-white/15 transition-colors">
          <p className="text-sm text-slate-300 mb-1">{card.label}</p>
          <p className="text-3xl font-bold tracking-tight text-white">
            <CountUpNumber target={card.value} prefix={card.prefix} />
          </p>
        </div>
      ))}
    </div>
  );
}
