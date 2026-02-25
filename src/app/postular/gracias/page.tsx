export const dynamic = "force-dynamic";

export default function GraciasPage() {
  return (
    <main className="container py-14">
      <div className="max-w-xl mx-auto text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="title font-bold tracking-tight">¡Postulación recibida!</h1>
        <p className="subtitle max-w-2xl mx-auto mt-3 leading-relaxed">
          Te enviaremos un correo cuando revisemos tu postulación. Si te postulaste a un
          operativo específico, también podrías recibir novedades por email.
        </p>
        <div className="mt-8">
          <a href="/" className="btn-primary">Volver al inicio</a>
        </div>
      </div>
    </main>
  );
}
