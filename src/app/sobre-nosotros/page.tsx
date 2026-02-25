// src/app/sobre-nosotros/page.tsx
import { LucideIcon, Sparkles, Stethoscope, Share2, Users } from "lucide-react";
import { 
  PublicPageLayout, 
  PublicHero, 
  PublicSection,
  PrimaryButtonLink 
} from "@/components/public";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata = { title: "Sobre Nosotros · Traesol" };

export default function SobreNosotrosPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero con logo institucional */}
      <PublicHero
        eyebrow="Fundación Traesol"
        title="Sobre Traesol"
        subtitle="Disminuimos las barreras de acceso a atención médica de excelencia en territorios vulnerables y excluidos del país."
      >
        {/* Logo institucional destacado */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/branding/logo-traesol.png"
          alt="Logo Fundación Traesol"
          className="mx-auto w-[160px] sm:w-[200px] md:w-[240px] h-auto mb-6"
          style={{ filter: "drop-shadow(0 0 18px rgba(255,255,255,0.25)) drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400">Lo que hacemos</p>
            <p className="mt-3 text-sm text-slate-300">
              Operativos médico-quirúrgicos, transferencia de competencias y educación continua junto a equipos locales y voluntariado especializado.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400">Desde 2015</p>
            <p className="mt-3 text-base font-semibold text-white">Co-diseñamos intervenciones junto al sistema público.</p>
            <p className="mt-1 text-sm text-slate-300">
              Equilibramos operativos, docencia y educación comunitaria en cada territorio.
            </p>
          </div>
        </div>
      </PublicHero>

      {/* Contenido */}
      <div className="mx-auto max-w-6xl space-y-14 px-5 py-14 lg:px-6">
        {/* Quiénes somos */}
        <ScrollReveal>
        <PublicSection className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Quiénes somos</p>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_minmax(0,0.85fr)]">
          <div className="space-y-4 text-base leading-relaxed text-slate-700">
            <p>
              Realizamos operativos médico-quirúrgicos en territorio integrados con transferencia de competencias y educación continua, trabajando junto a los equipos locales para que cada intervención deje capacidades instaladas.
            </p>
            <p>
              Desde 2015 articulamos una red de especialistas y subespecialistas que donan su tiempo para apoyar al sistema público de salud, contribuyendo a disminuir listas de espera y acercando atención de excelencia a personas que viven lejos de centros de alta complejidad.
            </p>
            <p>
              Nuestro propósito es reducir las brechas de acceso en comunidades vulnerables, llegando a más personas mediante el ejercicio profesional y voluntario que da vida a Traesol.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-cyan-50/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Desde 2015</p>
            <h3 className="mt-3 text-2xl font-bold text-slate-900 tracking-tight">Vocación y Servicio</h3>
            <p className="mt-2 text-sm text-slate-600">
              Co-diseñamos intervenciones junto al sistema público para equilibrar operativos, docencia y educación comunitaria. Nuestro enfoque combina impacto clínico, fortalecimiento de equipos locales y promoción de salud en terreno.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <HighlightItem label="Intervenciones coordinadas con equipos locales" />
              <HighlightItem label="Impacto directo en territorios con mayores brechas" />
              <HighlightItem label="Formación continua y trabajo comunitario" />
            </ul>
          </div>
        </div>
      </PublicSection>
      </ScrollReveal>

      {/* Nuestros pilares */}
      <ScrollReveal>
      <PublicSection className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Nuestros pilares</p>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Nuestros pilares</h2>
          </div>
          <p className="text-sm text-slate-500 max-w-xl">
            Sostenemos cada operativo combinando atención, formación y trabajo comunitario.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Pilar
            titulo="Atención Médico-Quirúrgica"
            texto="Operativos con equipos especialistas y subespecialistas para resolver patologías prioritarias con estándares de excelencia."
            Icon={Stethoscope}
          />
          <Pilar
            titulo="Transferencia de Competencias"
            texto="Trabajo conjunto con equipos locales para fortalecer capacidades, protocolos y continuidad del cuidado."
            Icon={Share2}
          />
          <Pilar
            titulo="Educación y Comunidad"
            texto="Acciones educativas para pacientes, familias y equipos de salud; prevención y promoción en terreno."
            Icon={Users}
          />
        </div>
      </PublicSection>
      </ScrollReveal>

      {/* CTA Súmate */}
      <ScrollReveal>
      <PublicSection className="rounded-2xl border border-dashed border-blue-200/80 bg-blue-50/30 p-6 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Súmate</p>
        <h2 className="mt-3 text-3xl font-bold text-slate-900 tracking-tight">Súmate</h2>
        <p className="mt-3 text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
          Sé voluntario y marca la diferencia. Tu tiempo y esfuerzo pueden cambiar vidas.
        </p>
        <div className="mt-6">
          <PrimaryButtonLink href="/postular">
            Hazte voluntario
          </PrimaryButtonLink>
        </div>
      </PublicSection>
      </ScrollReveal>
      </div>
    </main>
  );
}

function HighlightItem({ label }: { label: string }) {
  return (
    <li className="flex items-start gap-2">
      <Sparkles className="mt-0.5 h-4 w-4 text-blue-500" />
      <span>{label}</span>
    </li>
  );
}

function Pilar({ titulo, texto, Icon }: { titulo: string; texto: string; Icon: LucideIcon }) {
  return (
    <div className="group h-full rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-transform duration-200 group-hover:scale-110">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900">{titulo}</h3>
      <p className="mt-2 text-sm text-slate-500 leading-relaxed">{texto}</p>
    </div>
  );
}
