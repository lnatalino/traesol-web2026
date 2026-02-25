// src/components/CTAButtons.tsx
import Link from "next/link";
import { Heart, HandCoins, Building2, ArrowRight } from "lucide-react";

const card =
  "group relative rounded-2xl border border-slate-200/80 bg-white p-7 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_24px_-4px_rgba(0,0,0,0.08)] overflow-hidden";
const title = "text-xl font-bold tracking-tight text-slate-900";
const desc = "mt-2 text-sm text-slate-500 leading-relaxed";

export default function CTAButtons() {
  const items = [
    {
      href: "/postular",
      icon: Heart,
      iconColor: "text-rose-500",
      iconBg: "bg-rose-50",
      label: "Hazte voluntario",
      description: "Postula en minutos y únete a un operativo de salud.",
      external: false,
    },
    {
      href: "https://traesol.trytoku.com/forms/acceso",
      icon: HandCoins,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      label: "Hazte socio",
      description: "Apoya mensualmente nuestra misión con un aporte.",
      external: true,
    },
    {
      href: "/empresas",
      icon: Building2,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      label: "Empresas",
      description: "Alianzas, programas y voluntariado corporativo.",
      external: false,
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        const linkProps = item.external
          ? { target: "_blank" as const, rel: "noopener noreferrer" }
          : {};

        return (
          <Link
            key={item.label}
            href={item.href}
            className={card}
            {...linkProps}
          >
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.03] blur-2xl bg-blue-600 group-hover:opacity-[0.06] transition-opacity" />
            
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.iconBg} mb-4 transition-transform duration-200 group-hover:scale-110`}>
              <Icon className={`h-6 w-6 ${item.iconColor}`} />
            </div>
            <h3 className={title}>{item.label}</h3>
            <p className={desc}>{item.description}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition-all group-hover:gap-2.5">
              Más información
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
