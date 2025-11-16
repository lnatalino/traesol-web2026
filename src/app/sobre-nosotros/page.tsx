// src/app/sobre-nosotros/page.tsx
import Link from "next/link";
import { LucideIcon, Sparkles, Stethoscope, Share2, Users } from "lucide-react";

export const metadata = { title: "Sobre Nosotros · Traesol" };

export default function SobreNosotrosPage() {
  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 lg:px-6">
        <section className="rounded-[32px] bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 px-6 py-12 text-white shadow-2xl sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Fundación Traesol</p>
          <div className="mt-6 space-y-4">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">Sobre Traesol</h1>
            <p className="text-base text-white/85 sm:text-lg">
              Disminuimos las barreras de acceso a atención médica de excelencia en territorios vulnerables y excluidos del país.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,0.7fr)]">
            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-white/85 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Lo que hacemos</p>
              <p className="mt-3 text-sm">
                Operativos médico-quirúrgicos, transferencia de competencias y educación continua junto a equipos locales y voluntariado especializado.
              </p>
            </div>
            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-white shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Desde 2015</p>
              <p className="mt-3 text-lg font-semibold">Co-diseñamos intervenciones junto al sistema público.</p>
              <p className="mt-1 text-sm text-white/80">
                Equilibramos operativos, docencia y educación comunitaria en cada territorio.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg sm:p-10">
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
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-inner">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Desde 2015</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-900">Vocación y Servicio (Desde 2015)</h3>
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
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg sm:p-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Nuestros pilares</p>
              <h2 className="text-3xl font-semibold text-slate-900">Nuestros pilares</h2>
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
        </section>

        <section className="rounded-3xl border border-dashed border-blue-200 bg-white/80 p-6 text-center shadow-lg sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Súmate</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Súmate</h2>
          <p className="mt-3 text-base text-slate-600">
            Sé voluntario y marca la diferencia. Tu tiempo y esfuerzo pueden cambiar vidas.
          </p>
          <div className="mt-6">
            <Link
              href="/postular"
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
            >
              Hazte voluntario
            </Link>
          </div>
        </section>
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
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{titulo}</h3>
      <p className="mt-2 text-sm text-slate-600">{texto}</p>
    </div>
  );
}
