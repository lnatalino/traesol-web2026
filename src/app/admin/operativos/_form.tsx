import type { ReactNode } from "react";
import ImageGalleryField from "@/app/admin/components/ImageGalleryField";

type LanyardTypeOption = {
  id: string;
  name: string;
  ribbon_color_name: string;
  ribbon_hex: string | null;
};

type OperativoDefaults = {
  titulo?: string | null;
  slug?: string | null;
  descripcion?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  lugar?: string | null;
  direccion?: string | null;
  cupos_total?: number | null;
  estado?: string | null;
  imagen_cabecera_url?: string | null;
  instagram_url?: string | null;
  whatsapp_grupo_url?: string | null;
  lanyard_type_id?: string | null;
  imagenes?: Array<{ id: string; url: string; path: string }>;
};

type OperativoFormProps = {
  action: string;
  submitLabel: string;
  defaults?: OperativoDefaults;
  lanyardTypes?: LanyardTypeOption[];
  children?: ReactNode;
};

const ESTADOS = [
  { value: "borrador", label: "Borrador" },
  { value: "publicado", label: "Publicado" },
  { value: "cerrado", label: "Cerrado" },
  { value: "finalizado", label: "Finalizado" },
];

export function OperativoForm({ action, submitLabel, defaults, lanyardTypes = [], children }: OperativoFormProps) {
  const cupos = typeof defaults?.cupos_total === "number" ? String(defaults?.cupos_total ?? "") : "";
  const estado = (defaults?.estado || "borrador").toLowerCase();
  const cabeceraInputId = "operativo-cabecera";
  const cabeceraRemoveId = "operativo-cabecera-remove";

  return (
    <form action={action} method="post" className="space-y-8" encType="multipart/form-data">
      <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Información general</p>
          <p className="text-sm text-slate-500">Define el título, el slug público y la descripción visible del operativo.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Título *</span>
            <input
              name="titulo"
              required
              minLength={3}
              maxLength={200}
              defaultValue={defaults?.titulo ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              placeholder="Operativo Traesol"
            />
            <p className="text-xs text-slate-500">Mínimo 3 caracteres, máximo 200.</p>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Slug</span>
            <input
              name="slug"
              defaultValue={defaults?.slug ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              placeholder="operativo-traesol-2026"
            />
            <p className="text-xs text-slate-500">Si lo dejas vacío, se generará automáticamente desde el título.</p>
          </label>
        </div>
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-slate-700">Descripción</span>
          <textarea
            name="descripcion"
            defaultValue={defaults?.descripcion ?? ""}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            rows={5}
            placeholder="Breve descripción del operativo"
          />
        </label>
      </section>

      <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Calendario y cupos</p>
          <p className="text-sm text-slate-500">Controla fechas oficiales, cupos disponibles y estado operativo.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Fecha de inicio</span>
            <input
              type="date"
              name="fecha_inicio"
              defaultValue={defaults?.fecha_inicio ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Fecha de término</span>
            <input
              type="date"
              name="fecha_fin"
              defaultValue={defaults?.fecha_fin ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Cupos totales</span>
            <input
              type="number"
              name="cupos_total"
              min={0}
              max={10000}
              step={1}
              defaultValue={cupos}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            />
            <p className="text-xs text-slate-500">Puedes actualizar los cupos incluso después de publicar.</p>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Estado</span>
            <select
              name="estado"
              defaultValue={estado}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            >
              {ESTADOS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-slate-700">Tema / Lanyard</span>
          <select
            name="lanyard_type_id"
            defaultValue={defaults?.lanyard_type_id ?? ""}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
          >
            <option value="">Sin tema específico (lanyard genérico)</option>
            {lanyardTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.name} ({lt.ribbon_color_name})
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            Define el tema del operativo para determinar el color de lanyard de los voluntarios (ej: cinta rosada para cáncer de mama).
          </p>
        </label>
      </section>

      <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Ubicación y enlaces</p>
          <p className="text-sm text-slate-500">Comparte dónde se realizará el operativo y los enlaces internos para coordinaciones.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Lugar</span>
            <input
              name="lugar"
              defaultValue={defaults?.lugar ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              placeholder="Ciudad o región"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Dirección</span>
            <input
              name="direccion"
              defaultValue={defaults?.direccion ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              placeholder="Dirección o punto de encuentro"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">URL de Instagram</span>
            <input
              type="url"
              name="instagram_url"
              defaultValue={defaults?.instagram_url ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              placeholder="https://www.instagram.com/"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Link grupo WhatsApp</span>
            <input
              type="url"
              name="whatsapp_grupo_url"
              defaultValue={defaults?.whatsapp_grupo_url ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              placeholder="https://chat.whatsapp.com/..."
            />
            <p className="text-xs text-slate-500">Solo visible para administradores. No se mostrará en la web pública.</p>
          </label>
        </div>
      </section>

      <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Material gráfico</p>
          <p className="text-sm text-slate-500">Define la imagen principal del hero y administra la galería complementaria.</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5">
            <label htmlFor={cabeceraInputId} className="text-sm font-medium text-slate-700">
              Imagen de cabecera
            </label>
            {defaults?.imagen_cabecera_url ? (
              <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="aspect-video overflow-hidden rounded-2xl bg-white">
                  <img
                    src={defaults.imagen_cabecera_url}
                    alt="Cabecera actual"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="break-all text-xs text-slate-500">
                  <a href={defaults.imagen_cabecera_url} target="_blank" rel="noreferrer" className="underline">
                    {defaults.imagen_cabecera_url}
                  </a>
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <input id={cabeceraRemoveId} type="checkbox" name="imagen_cabecera_eliminar" value="1" />
                  <label htmlFor={cabeceraRemoveId}>Eliminar imagen actual</label>
                </div>
              </div>
            ) : null}
            <input
              id={cabeceraInputId}
              type="file"
              name="imagen_cabecera_file"
              accept="image/*"
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
            />
            <p className="text-xs text-slate-500">Máx. 10 MB. Si falta portada, se mostrará la primera imagen de la galería.</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
            <ImageGalleryField
              title="Galería de imágenes"
              description="Se mostrará en la página pública del operativo debajo de la descripción."
              fieldPrefix="operativo"
              existingImages={defaults?.imagenes ?? []}
            />
          </div>
        </div>
      </section>

      {children}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
        >
          {submitLabel}
        </button>
        <p className="text-xs text-slate-500">Todos los cambios se guardan en Supabase.</p>
      </div>
    </form>
  );
}
