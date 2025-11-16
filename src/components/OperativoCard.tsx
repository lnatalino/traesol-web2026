export type OperativoCardVariant = "home" | "full";

type OperativoCardProps = {
  href: string;
  titulo: string;
  fecha: string | null;
  lugar: string | null;
  imagen: string;
  resumen?: string;
  variant?: OperativoCardVariant;
};

const dateFormatter = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long" });

function formatDate(value: string | null) {
  if (!value) return "Fecha por confirmar";
  try {
    return dateFormatter.format(new Date(value));
  } catch {
    return "Fecha por confirmar";
  }
}

export default function OperativoCard({
  href,
  titulo,
  fecha,
  lugar,
  imagen,
  resumen,
  variant = "full",
}: OperativoCardProps) {
  const dateLabel = formatDate(fecha);
  const locationLabel = lugar || "Lugar por confirmar";
  const imageHeight = variant === "home" ? "h-40" : "h-48";
  const showSummary = variant === "full" && resumen;

  return (
    <a
      href={href}
      className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className={`relative w-full bg-slate-100 ${imageHeight}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imagen} alt={titulo} className="h-full w-full object-cover" />
      </div>
      <div className={`flex flex-1 flex-col p-5 ${variant === "home" ? "gap-3" : ""}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Operativo Traesol</p>
        <h3 className="text-xl font-semibold text-slate-900">{titulo}</h3>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{dateLabel}</span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{locationLabel}</span>
        </div>
        {showSummary ? (
          <p className="mt-4 flex-1 text-sm text-slate-600">{resumen}</p>
        ) : null}
        {variant === "full" ? (
          <div className="mt-6">
            <span className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700">
              Ver detalle
            </span>
          </div>
        ) : null}
      </div>
    </a>
  );
}
