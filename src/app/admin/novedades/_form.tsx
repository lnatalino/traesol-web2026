import type { ReactNode } from "react";
import ImageGalleryField from "@/app/admin/components/ImageGalleryField";

type NovedadDefaults = {
  titulo?: string | null;
  slug?: string | null;
  bajada?: string | null;
  cuerpo?: string | null;
  imagen_portada_url?: string | null;
  link_externo?: string | null;
  fecha_publicacion?: string | null;
  publicado?: boolean | null;
  en_carrusel?: boolean | null;
  en_novedades?: boolean | null;
  imagenes?: Array<{ id: string; url: string; path: string }>;
};

type NovedadFormProps = {
  action: string;
  submitLabel: string;
  defaults?: NovedadDefaults;
  children?: ReactNode;
};

function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 16);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function NovedadForm({ action, submitLabel, defaults, children }: NovedadFormProps) {
  const fechaValue = toDatetimeLocal(defaults?.fecha_publicacion ?? null);
  const portadaInputId = "novedad-portada";
  const portadaRemoveId = "novedad-portada-remove";

  return (
    <form action={action} method="post" className="space-y-8" encType="multipart/form-data">
      <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Información principal</p>
          <p className="text-sm text-slate-500">Título público, slug y resumen para la tarjeta destacada.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Título *</span>
            <input
              name="titulo"
              required
              defaultValue={defaults?.titulo ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              placeholder="Novedad destacada"
            />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Slug</span>
            <input
              name="slug"
              defaultValue={defaults?.slug ?? ""}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
              placeholder="novedad-destacada"
            />
            <p className="text-xs text-slate-500">Si lo dejas vacío, se genera automáticamente desde el título.</p>
          </label>
        </div>
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-slate-700">Bajada</span>
          <textarea
            name="bajada"
            defaultValue={defaults?.bajada ?? ""}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            rows={3}
            placeholder="Descripción breve para destacar la novedad"
          />
        </label>
      </section>

      <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Contenido y enlaces</p>
          <p className="text-sm text-slate-500">Incluye el cuerpo completo y un link externo opcional.</p>
        </header>
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-slate-700">Cuerpo</span>
          <textarea
            name="cuerpo"
            defaultValue={defaults?.cuerpo ?? ""}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            rows={8}
            placeholder="Contenido principal (puede ser texto o HTML simple)"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Link externo</span>
          <input
            type="url"
            name="link_externo"
            defaultValue={defaults?.link_externo ?? ""}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            placeholder="https://www.instagram.com/..."
          />
        </label>
      </section>

      <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Medios</p>
          <p className="text-sm text-slate-500">Gestiona la imagen principal y la galería complementaria.</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5">
            <label htmlFor={portadaInputId} className="text-sm font-medium text-slate-700">
              Imagen de portada
            </label>
            {defaults?.imagen_portada_url ? (
              <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="aspect-video overflow-hidden rounded-2xl bg-white">
                  <img
                    src={defaults.imagen_portada_url}
                    alt="Portada actual"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="break-all text-xs text-slate-500">
                  <a href={defaults.imagen_portada_url} target="_blank" rel="noreferrer" className="underline">
                    {defaults.imagen_portada_url}
                  </a>
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <input id={portadaRemoveId} type="checkbox" name="imagen_portada_eliminar" value="1" />
                  <label htmlFor={portadaRemoveId}>Eliminar imagen actual</label>
                </div>
              </div>
            ) : null}
            <input
              id={portadaInputId}
              type="file"
              name="imagen_portada_file"
              accept="image/*"
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm"
            />
            <p className="text-xs text-slate-500">Máx. 10 MB. Si no cargas portada, se usará la primera imagen de la galería.</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
            <ImageGalleryField
              title="Galería de imágenes"
              description="Estas imágenes aparecerán como galería en la página pública. La imagen de portada se mantiene por separado."
              fieldPrefix="novedad"
              existingImages={defaults?.imagenes ?? []}
            />
          </div>
        </div>
      </section>

      <section className="space-y-6 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Publicación</p>
          <p className="text-sm text-slate-500">Define la fecha y dónde debe mostrarse esta novedad.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Fecha de publicación</span>
            <input
              type="datetime-local"
              name="fecha_publicacion"
              defaultValue={fechaValue}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            />
            <p className="text-xs text-slate-500">Si la dejas vacía, se usará la fecha actual al guardar.</p>
          </label>
          <div className="flex flex-wrap gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm">
            <label className="flex items-center gap-2 font-medium text-slate-700">
              <input
                type="checkbox"
                name="publicado"
                defaultChecked={Boolean(defaults?.publicado)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span>Publicado</span>
            </label>
            <label className="flex items-center gap-2 font-medium text-slate-700">
              <input
                type="checkbox"
                name="en_carrusel"
                defaultChecked={Boolean(defaults?.en_carrusel)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span>En carrusel</span>
            </label>
            <label className="flex items-center gap-2 font-medium text-slate-700">
              <input
                type="checkbox"
                name="en_novedades"
                defaultChecked={defaults?.en_novedades !== false}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span>En novedades</span>
            </label>
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
        <p className="text-xs text-slate-500">Los cambios se verán reflejados en la sección pública de Novedades.</p>
      </div>
    </form>
  );
}
