// src/app/privacidad/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PublicHero } from "@/components/public";

export const metadata: Metadata = {
  title: "Política de Privacidad · Fundación Traesol",
  description:
    "Política de Privacidad y Protección de Datos Personales de Fundación Traesol. Conoce cómo tratamos tu información personal.",
};

export default function PoliticaPrivacidadPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <PublicHero
        eyebrow="Fundación Traesol"
        title="Política de Privacidad y Protección de Datos"
        subtitle="Tu confianza es fundamental para nosotros. Aquí explicamos cómo recopilamos, usamos y protegemos tu información personal."
        meta="Última actualización: 21 de enero de 2026"
      />

      {/* Contenido */}
      <article className="max-w-4xl mx-auto px-5 py-14 md:py-16">
        <div className="prose prose-slate prose-lg max-w-none">
          
          {/* 1. Identidad del responsable */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">1</span>
              Identidad del Responsable
            </h2>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <p className="text-slate-700 mb-4">
                <strong>Fundación Traesol</strong> es una organización sin fines de lucro dedicada a la 
                realización de operativos médicos, educativos y sociales en Chile y el extranjero.
              </p>
              <p className="text-slate-700 mb-4">
                Somos responsables del tratamiento de los datos personales que nos proporcionas a través 
                de nuestra plataforma digital y canales de comunicación.
              </p>
              <div className="flex items-center gap-2 text-slate-600">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:contacto@fundaciontraesol.cl" className="text-blue-700 hover:underline">
                  contacto@fundaciontraesol.cl
                </a>
              </div>
            </div>
          </section>

          {/* 2. Alcance */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">2</span>
              Alcance de esta Política
            </h2>
            <p className="text-slate-700 mb-4">
              Esta política de privacidad aplica a todos los servicios y plataformas operados por 
              Fundación Traesol, incluyendo:
            </p>
            <ul className="grid gap-2 text-slate-700">
              {[
                "Sitio web público (fundaciontraesol.cl)",
                "Formularios digitales de postulación y contacto",
                "Plataforma de gestión de voluntarios",
                "Panel administrativo interno",
                "Comunicaciones electrónicas (correos, notificaciones)",
                "Galerías privadas de operativos",
                "Sistema de emisión de certificados",
                "Sistemas de mensajería y contacto institucional",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 3. Datos que recopilamos */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">3</span>
              Datos Personales que Recopilamos
            </h2>
            <p className="text-slate-700 mb-6">
              Recopilamos diferentes tipos de información según el tipo de interacción que tengas con nosotros:
            </p>

            {/* Voluntarios */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Voluntarios y Profesionales de la Salud
              </h3>
              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <ul className="grid md:grid-cols-2 gap-2 text-slate-700 text-sm">
                  {[
                    "Nombre completo",
                    "RUT, pasaporte o documento de identidad",
                    "Nacionalidad",
                    "Dirección de residencia",
                    "Teléfono de contacto",
                    "Correo electrónico",
                    "Profesión y especialidad médica",
                    "Tallas de vestuario (uniforme)",
                    "Restricciones y preferencias alimentarias",
                    "Historial de participación en operativos",
                    "Registro de asistencias",
                    "Certificados emitidos",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Empresas y contactos */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Personas o Empresas que nos Contactan
              </h3>
              <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                <ul className="grid md:grid-cols-2 gap-2 text-slate-700 text-sm">
                  {[
                    "Nombre completo",
                    "Empresa u organización",
                    "Cargo o rol",
                    "Correo electrónico",
                    "Teléfono de contacto",
                    "Contenido del mensaje enviado",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Pacientes */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                Pacientes o Beneficiarios
              </h3>
              <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                <p className="text-slate-700 text-sm">
                  En el marco de nuestros operativos médicos, podemos recopilar información mínima necesaria 
                  para la coordinación de atención de salud. Esta información es tratada con <strong>estricta 
                  confidencialidad</strong>, bajo protocolos médicos establecidos, y <strong>nunca es publicada 
                  ni compartida públicamente</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Finalidad */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">4</span>
              Finalidad del Uso de los Datos
            </h2>
            <p className="text-slate-700 mb-4">
              Utilizamos tus datos personales exclusivamente para los siguientes propósitos:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                { icon: "👥", title: "Gestión de voluntarios", desc: "Registro, coordinación y seguimiento de participaciones" },
                { icon: "📋", title: "Organización de operativos", desc: "Planificación logística de actividades médicas" },
                { icon: "📧", title: "Comunicación institucional", desc: "Envío de información relevante sobre nuestras actividades" },
                { icon: "📜", title: "Emisión de certificados", desc: "Documentación de participación y acreditaciones" },
                { icon: "👕", title: "Gestión logística", desc: "Uniformes, asistencia, inventario y coordinación" },
                { icon: "📊", title: "Métricas de impacto", desc: "Estadísticas internas para mejorar nuestro trabajo" },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{item.icon}</span>
                    <h4 className="font-semibold text-slate-900">{item.title}</h4>
                  </div>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-rose-50 rounded-xl p-5 border border-rose-200">
              <p className="text-rose-800 font-medium flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <strong>Importante:</strong> No vendemos, no arrendamos ni comercializamos tus datos personales 
                bajo ninguna circunstancia.
              </p>
            </div>
          </section>

          {/* 5. Base legal */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">5</span>
              Base Legal y Consentimiento
            </h2>
            <p className="text-slate-700 mb-4">
              El tratamiento de tus datos personales se fundamenta en:
            </p>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>Consentimiento informado:</strong> Al enviar cualquier formulario en nuestra plataforma, 
                  otorgas tu consentimiento para el tratamiento de tus datos según lo descrito en esta política.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>Interés legítimo:</strong> Para el cumplimiento de nuestras funciones como fundación 
                  y la organización de operativos de salud.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>Cumplimiento normativo:</strong> Conforme a la Ley 19.628 sobre Protección de la 
                  Vida Privada de Chile y estándares internacionales de protección de datos.
                </span>
              </li>
            </ul>
            <p className="text-slate-700 mt-4">
              Puedes solicitar en cualquier momento la modificación o eliminación de tus datos personales 
              escribiéndonos a <a href="mailto:contacto@fundaciontraesol.cl" className="text-blue-700 hover:underline">contacto@fundaciontraesol.cl</a>.
            </p>
          </section>

          {/* 6. Almacenamiento y seguridad */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">6</span>
              Almacenamiento y Seguridad
            </h2>
            <p className="text-slate-700 mb-4">
              Nos tomamos muy en serio la seguridad de tu información. Implementamos las siguientes medidas:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: "🔒", title: "Plataformas seguras", desc: "Utilizamos servicios cloud con altos estándares de seguridad y encriptación" },
                { icon: "🛡️", title: "Control de acceso", desc: "Solo personal autorizado puede acceder a datos personales" },
                { icon: "🔐", title: "Encriptación", desc: "Datos sensibles protegidos mediante protocolos de encriptación" },
                { icon: "📝", title: "Auditorías", desc: "Revisiones periódicas de nuestras prácticas de seguridad" },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{item.icon}</span>
                    <h4 className="font-semibold text-slate-900">{item.title}</h4>
                  </div>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 7. Compartición */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">7</span>
              Compartición de Datos
            </h2>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
              <p className="text-slate-700 mb-4">
                <strong>No compartimos tus datos personales con terceros ajenos a Fundación Traesol.</strong>
              </p>
              <p className="text-slate-700 mb-4">
                La información que recopilamos se utiliza exclusivamente dentro de nuestra organización para 
                cumplir con nuestras funciones operativas y misionales.
              </p>
              <p className="text-slate-700">
                <strong>Excepciones:</strong> Solo compartiremos información cuando exista una obligación legal 
                que nos lo requiera, como requerimientos de autoridades judiciales o administrativas competentes.
              </p>
            </div>
          </section>

          {/* 8. Derechos */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">8</span>
              Tus Derechos
            </h2>
            <p className="text-slate-700 mb-4">
              Como titular de tus datos personales, tienes los siguientes derechos:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                { title: "Acceso", desc: "Conocer qué datos personales tenemos sobre ti", color: "blue" },
                { title: "Rectificación", desc: "Solicitar la corrección de datos inexactos o incompletos", color: "emerald" },
                { title: "Eliminación", desc: "Pedir que eliminemos tus datos personales", color: "amber" },
                { title: "Oposición", desc: "Oponerte al tratamiento de tus datos en ciertos casos", color: "rose" },
              ].map((item, i) => (
                <div key={i} className={`bg-${item.color}-50 rounded-xl p-4 border border-${item.color}-100`}>
                  <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
              <p className="text-slate-700">
                <strong>¿Cómo ejercer tus derechos?</strong> Escríbenos a{" "}
                <a href="mailto:contacto@fundaciontraesol.cl" className="text-blue-700 hover:underline font-medium">
                  contacto@fundaciontraesol.cl
                </a>{" "}
                indicando tu nombre completo y el derecho que deseas ejercer. Responderemos en un plazo máximo 
                de 15 días hábiles.
              </p>
            </div>
          </section>

          {/* 9. Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">9</span>
              Cookies y Tecnologías Similares
            </h2>
            <p className="text-slate-700 mb-4">
              Nuestro sitio web utiliza cookies de forma mínima y responsable:
            </p>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Cookies esenciales:</strong> Necesarias para el funcionamiento básico del sitio</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Cookies de sesión:</strong> Para mantener tu sesión activa cuando inicias sesión</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Métricas básicas:</strong> Para entender cómo se usa nuestro sitio y mejorarlo</span>
              </li>
            </ul>
            <p className="text-slate-700 mt-4">
              <strong>No utilizamos cookies publicitarias ni de seguimiento invasivo.</strong> No compartimos 
              información de navegación con terceros para fines comerciales.
            </p>
          </section>

          {/* 10. Enlaces externos */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">10</span>
              Enlaces a Sitios Externos
            </h2>
            <p className="text-slate-700">
              Nuestro sitio puede contener enlaces a sitios web externos, como plataformas de donación, 
              redes sociales u otros servicios de terceros. No somos responsables por las políticas de 
              privacidad ni las prácticas de estos sitios externos. Te recomendamos revisar sus políticas 
              de privacidad antes de proporcionar cualquier información personal.
            </p>
          </section>

          {/* 11. Cambios */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">11</span>
              Cambios a esta Política
            </h2>
            <p className="text-slate-700 mb-4">
              Podemos actualizar esta política de privacidad ocasionalmente para reflejar cambios en 
              nuestras prácticas, servicios o requisitos legales.
            </p>
            <p className="text-slate-700">
              Cuando realicemos cambios significativos, actualizaremos la fecha de "última actualización" 
              al inicio de este documento. Te recomendamos revisar esta página periódicamente para 
              mantenerte informado sobre cómo protegemos tu información.
            </p>
          </section>

          {/* Contacto final */}
          <section className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-8 border border-blue-100">
            <h2 className="text-xl font-bold text-slate-900 mb-4">¿Tienes preguntas?</h2>
            <p className="text-slate-700 mb-4">
              Si tienes cualquier duda o consulta sobre esta política de privacidad o sobre el 
              tratamiento de tus datos personales, no dudes en contactarnos:
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:contacto@fundaciontraesol.cl"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Escribirnos
              </a>
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center gap-2 border border-slate-300 text-slate-700 px-6 py-3 rounded-full font-semibold hover:bg-slate-50 transition"
              >
                Ir a contacto
              </Link>
            </div>
          </section>

        </div>
      </article>
    </main>
  );
}
