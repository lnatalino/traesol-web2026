import OperativoCard from "./OperativoCard";

type Operativo = {
  id: string;
  titulo: string;
  slug: string;
  fecha_inicio: string;
  lugar: string | null;
  imagen_cabecera_url: string | null;
  imagenes?: Array<{ url: string; path?: string | null }>;
};

export default function OperativosCarousel({ items }: { items: Operativo[] }) {
  if (!items.length) return null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {items.map((op) => {
        const fallback = op.imagenes?.[0]?.url;
        const imageSrc =
          (op.imagen_cabecera_url && op.imagen_cabecera_url.trim() !== "" ? op.imagen_cabecera_url : fallback) ||
          "https://placehold.co/800x400?text=Operativo+Traesol";

        return (
          <OperativoCard
            key={op.id}
            href={`/operativos/${op.slug}`}
            titulo={op.titulo}
            fecha={op.fecha_inicio}
            lugar={op.lugar}
            imagen={imageSrc}
            variant="home"
          />
        );
      })}
    </div>
  );
}
