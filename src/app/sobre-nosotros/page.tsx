// src/app/sobre-nosotros/page.tsx
import Link from "next/link";

export const metadata = { title: "Sobre Nosotros · Traesol" };

export default function SobreNosotrosPage() {
  return (
    <main className="container space-y-8">
      <header className="prose max-w-none">
        <h1>Sobre Nosotros</h1>
        <p className="lead">
          Somos una fundación que busca disminuir las barreras de acceso a atención
          médica de excelencia en zonas vulnerables y excluidas del país.
        </p>
      </header>

      <section className="card space-y-3">
        <h2 className="section-title">Quiénes somos</h2>
        <p>
          Realizamos actividades médico-quirúrgicas, transferencia de competencias y
          educación a través de cada uno de nuestros operativos a lo largo del país.
          Convocamos especialistas y subespecialistas que donan su tiempo y dedicación
          a nuestra labor.
        </p>
        <p>
          Nuestro objetivo es disminuir las barreras de acceso a la atención médica
          de excelencia en zonas vulnerables y excluidas del país, para llegar a más
          personas con nuestra ayuda y nuestro ejercicio profesional.
        </p>
        <p>Fundación Traesol nace el año 2015.</p>
      </section>

      <section className="card space-y-4">
        <h2 className="section-title">Nuestros pilares</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Pilar
            titulo="Atención Médico-Quirúrgica"
            texto="Operativos con equipos especialistas y subespecialistas para resolver patologías prioritarias con estándares de excelencia."
          />
          <Pilar
            titulo="Transferencia de Competencias"
            texto="Trabajo conjunto con equipos locales para fortalecer capacidades, protocolos y continuidad del cuidado."
          />
          <Pilar
            titulo="Educación y Comunidad"
            texto="Acciones educativas para pacientes, familias y equipos de salud; prevención y promoción en terreno."
          />
        </div>
      </section>

      <section className="card text-center space-y-2">
        <h2 className="section-title">Súmate</h2>
        <p className="text-gray-600">
          Sé voluntario y marca la diferencia. Tu tiempo y esfuerzo pueden cambiar vidas.
        </p>
        <Link href="/postular" className="btn-primary inline-block">
          Hazte voluntario
        </Link>
      </section>
    </main>
  );
}

function Pilar({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="font-semibold mb-1">{titulo}</h3>
      <p className="text-sm text-gray-600">{texto}</p>
    </div>
  );
}
