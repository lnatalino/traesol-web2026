import Link from "next/link";

export default function NotFoundOperativo() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
      <h1 className="text-2xl font-bold">Operativo no encontrado</h1>
      <p className="text-gray-600">
        Es posible que el operativo no exista, haya sido archivado o no esté publicado.
      </p>
      <Link href="/" className="inline-block px-4 py-2 rounded-xl border hover:bg-gray-50">
        Volver al inicio
      </Link>
    </main>
  );
}
