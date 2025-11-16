export const dynamic = "force-dynamic";

export default function GraciasPage() {
  return (
    <main className="container py-10">
      <h1 className="title">¡Postulación recibida!</h1>
      <p className="subtitle max-w-2xl">
        Te enviaremos un correo cuando revisemos tu postulación. Si te postulaste a un
        operativo específico, también podrías recibir novedades por email.
      </p>
      <div className="mt-6">
        <a href="/" className="btn-primary">Volver al inicio</a>
      </div>
    </main>
  );
}
