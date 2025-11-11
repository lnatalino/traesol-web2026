import Image from "next/image";

type Operativo = {
  id: string;
  titulo: string;
  slug: string;
  fecha_inicio: string;
  lugar: string | null;
  imagen_cabecera_url: string | null;
};

export default function OperativosCarousel({ items }: { items: Operativo[] }) {
  if (!items.length) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map(op => (
        <a key={op.id} href={`/operativos/${op.slug}`} className="rounded-2xl overflow-hidden border shadow hover:shadow-md transition bg-white">
          <div className="relative h-40">
            <Image
              src={op.imagen_cabecera_url || "https://placehold.co/800x400?text=Operativo"}
              alt={op.titulo}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold">{op.titulo}</h3>
            <p className="text-sm text-gray-500">
              {new Date(op.fecha_inicio).toLocaleDateString()} {op.lugar ? `· ${op.lugar}` : ""}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}
