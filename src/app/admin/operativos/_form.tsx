import type { ReactNode } from "react";
import ImageGalleryField from "@/app/admin/components/ImageGalleryField";

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
  imagenes?: Array<{ id: string; url: string; path: string }>;
};

type OperativoFormProps = {
  action: string;
  submitLabel: string;
  defaults?: OperativoDefaults;
  children?: ReactNode;
};

const ESTADOS = [
  { value: "borrador", label: "Borrador" },
  { value: "publicado", label: "Publicado" },
  { value: "cerrado", label: "Cerrado" },
  { value: "finalizado", label: "Finalizado" },
];

export function OperativoForm({ action, submitLabel, defaults, children }: OperativoFormProps) {
  const cupos = typeof defaults?.cupos_total === "number" ? String(defaults?.cupos_total ?? "") : "";
  const estado = (defaults?.estado || "borrador").toLowerCase();
  const cabeceraInputId = "operativo-cabecera";
  const cabeceraRemoveId = "operativo-cabecera-remove";

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
            placeholder="Operativo Traesol"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Slug</span>
          <input
            name="slug"
            defaultValue={defaults?.slug ?? ""}
            className="w-full rounded-md border px-3 py-2"
            placeholder="operativo-tralesol-2026"
          />
          <p className="text-xs text-slate-500">Si lo dejas vacío, se generará automáticamente desde el título.</p>
        </label>
      </div>

      <label className="space-y-2 text-sm block">
        <span className="font-medium text-slate-700">Descripción</span>
        <textarea
          name="descripcion"
          defaultValue={defaults?.descripcion ?? ""}
          className="w-full rounded-md border px-3 py-2"
          rows={5}
          placeholder="Breve descripción del operativo"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Fecha de inicio</span>
          <input
            type="date"
            name="fecha_inicio"
            defaultValue={defaults?.fecha_inicio ?? ""}
            className="w-full rounded-md border px-3 py-2"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Fecha de término</span>
          <input
            type="date"
            name="fecha_fin"
            defaultValue={defaults?.fecha_fin ?? ""}
            className="w-full rounded-md border px-3 py-2"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Lugar</span>
          <input
            name="lugar"
            defaultValue={defaults?.lugar ?? ""}
            className="w-full rounded-md border px-3 py-2"
            placeholder="Ciudad o región"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Dirección</span>
          <input
            name="direccion"
            defaultValue={defaults?.direccion ?? ""}
            className="w-full rounded-md border px-3 py-2"
            placeholder="Dirección o punto de encuentro"
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
            defaultValue={cupos}
            className="w-full rounded-md border px-3 py-2"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Estado</span>
          <select
            name="estado"
            defaultValue={estado}
            className="w-full rounded-md border px-3 py-2"
          >
            {ESTADOS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 text-sm">
          <label htmlFor={cabeceraInputId} className="font-medium text-slate-700">Imagen de cabecera</label>
          {defaults?.imagen_cabecera_url ? (
            <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="aspect-video overflow-hidden rounded-md bg-white">
                <img
                  src={defaults.imagen_cabecera_url}
                  alt="Cabecera actual"
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-xs text-slate-500 break-all">
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
            className="block w-full rounded-md border px-3 py-2 text-sm"
          />
          <p className="text-xs text-slate-500">Máx. 10 MB. Si faltan portadas, se mostrará la primera imagen de la galería.</p>
        </div>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">URL de Instagram</span>
          <input
            type="url"
            name="instagram_url"
            defaultValue={defaults?.instagram_url ?? ""}
            className="w-full rounded-md border px-3 py-2"
            placeholder="https://www.instagram.com/"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium text-slate-700">Link grupo WhatsApp</span>
          <input
            type="url"
            name="whatsapp_grupo_url"
            defaultValue={defaults?.whatsapp_grupo_url ?? ""}
            className="w-full rounded-md border px-3 py-2"
            placeholder="https://chat.whatsapp.com/..."
          />
          <p className="text-xs text-slate-500">Solo visible para administradores. No se mostrará en la web pública.</p>
        </label>
      </div>

      <ImageGalleryField
        title="Galería de imágenes"
        description="Se mostrará en la página pública del operativo debajo de la descripción."
        fieldPrefix="operativo"
        existingImages={defaults?.imagenes ?? []}
      />

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
