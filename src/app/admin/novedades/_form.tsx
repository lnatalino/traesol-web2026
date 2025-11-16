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
    <form action={action} method="post" className="space-y-6" encType="multipart/form-data">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Título *</span>
          <input
            name="titulo"
            required
            defaultValue={defaults?.titulo ?? ""}
            className="w-full rounded-md border px-3 py-2"
            placeholder="Novedad destacada"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Slug</span>
          <input
            name="slug"
            defaultValue={defaults?.slug ?? ""}
            className="w-full rounded-md border px-3 py-2"
            placeholder="novedad-destacada"
          />
          <p className="text-xs text-slate-500">Si lo dejas vacío, se genera automáticamente desde el título.</p>
        </label>
      </div>

      <label className="space-y-2 text-sm block">
        <span className="font-medium text-slate-700">Bajada</span>
        <textarea
          name="bajada"
          defaultValue={defaults?.bajada ?? ""}
          className="w-full rounded-md border px-3 py-2"
          rows={3}
          placeholder="Descripción breve para destacar la novedad"
        />
      </label>

      <label className="space-y-2 text-sm block">
        <span className="font-medium text-slate-700">Cuerpo</span>
        <textarea
          name="cuerpo"
          defaultValue={defaults?.cuerpo ?? ""}
          className="w-full rounded-md border px-3 py-2"
          rows={8}
          placeholder="Contenido principal (puede ser texto o HTML simple)"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 text-sm">
          <label htmlFor={portadaInputId} className="font-medium text-slate-700">Imagen de portada</label>
          {defaults?.imagen_portada_url ? (
            <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="aspect-video overflow-hidden rounded-md bg-white">
                <img
                  src={defaults.imagen_portada_url}
                  alt="Portada actual"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-xs text-slate-500 break-all">
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
            className="block w-full rounded-md border px-3 py-2 text-sm"
          />
          <p className="text-xs text-slate-500">Se almacena en Supabase (máx. 10 MB). Si no cargas una portada, se usará la primera imagen de la galería.</p>
        </div>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Link externo</span>
          <input
            type="url"
            name="link_externo"
            defaultValue={defaults?.link_externo ?? ""}
            className="w-full rounded-md border px-3 py-2"
            placeholder="https://www.instagram.com/..."
          />
        </label>
      </div>

      <ImageGalleryField
        title="Galería de imágenes"
        description="Estas imágenes aparecerán como galería en la página pública. La imagen de portada se mantiene por separado."
        fieldPrefix="novedad"
        existingImages={defaults?.imagenes ?? []}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Fecha de publicación</span>
          <input
            type="datetime-local"
            name="fecha_publicacion"
            defaultValue={fechaValue}
            className="w-full rounded-md border px-3 py-2"
          />
          <p className="text-xs text-slate-500">Si la dejas vacía, se usará la fecha actual al guardar.</p>
        </label>
        <div className="flex items-start gap-6 rounded-md border px-4 py-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="publicado"
              defaultChecked={Boolean(defaults?.publicado)}
              className="h-4 w-4"
            />
            <span className="font-medium text-slate-700">Publicado</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="en_carrusel"
              defaultChecked={Boolean(defaults?.en_carrusel)}
              className="h-4 w-4"
            />
            <span className="font-medium text-slate-700">En carrusel</span>
          </label>
        </div>
      </div>

      {children}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
