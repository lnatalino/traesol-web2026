// src/components/CTAButtons.tsx
import Link from "next/link";
import { Heart, HandCoins, Building2 } from "lucide-react";

const card =
  "group relative rounded-3xl border border-[var(--brand-300)]/70 bg-[var(--brand-50)]/60 p-6 sm:p-8 shadow-sm hover:shadow transition-shadow";
const title = "text-2xl font-semibold tracking-tight text-[var(--brand-800)]";
const desc = "mt-2 text-base text-[color:var(--muted-700,#475569)]";
const iconWrap =
  "absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 ring-1 ring-[var(--brand-300)]/80";

export default function CTAButtons() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Link href="/postular" className={card}>
        <div className={iconWrap}>
          <Heart className="h-5 w-5 text-[var(--brand-600)]" />
        </div>
        <h3 className={title}>Hazte voluntario</h3>
        <p className={desc}>Postula en minutos y únete a un operativo.</p>
      </Link>

      {/* 🔗 Link actualizado */}
      <Link
        href="https://traesol.trytoku.com/forms/acceso"
        target="_blank"
        rel="noopener noreferrer"
        className={card}
      >
        <div className={iconWrap}>
          <HandCoins className="h-5 w-5 text-[var(--brand-600)]" />
        </div>
        <h3 className={title}>Hazte socio</h3>
        <p className={desc}>Apoya mensualmente nuestra misión.</p>
      </Link>

      <Link href="/empresas" className={card}>
        <div className={iconWrap}>
          <Building2 className="h-5 w-5 text-[var(--brand-600)]" />
        </div>
        <h3 className={title}>Contacto a empresas</h3>
        <p className={desc}>Alianzas, programas y voluntariado corporativo.</p>
      </Link>
    </div>
  );
}
