"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ExistingImage = {
  id: string;
  url: string;
  path: string;
};

type FilePreview = {
  name: string;
  size: number;
  url: string;
};

type ImageGalleryFieldProps = {
  title: string;
  description?: string;
  fieldPrefix: string;
  existingImages?: ExistingImage[];
};

function formatSize(size: number): string {
  if (!Number.isFinite(size)) return "";
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

function releasePreviews(items: FilePreview[]) {
  items.forEach((preview) => URL.revokeObjectURL(preview.url));
}

export default function ImageGalleryField({
  title,
  description,
  fieldPrefix,
  existingImages = [],
}: ImageGalleryFieldProps) {
  const [currentExisting, setCurrentExisting] = useState<ExistingImage[]>(existingImages);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentExisting(existingImages);
  }, [existingImages]);

  useEffect(() => {
    return () => {
      releasePreviews(previews);
    };
  }, [previews]);

  const keepValue = useMemo(
    () => currentExisting.map((img) => img.id).join(","),
    [currentExisting]
  );

  const filesName = `${fieldPrefix}_galeria_files`;
  const keepName = `${fieldPrefix}_galeria_keep`;

  const refreshPreviews = (files: FileList | null | undefined) => {
    setPreviews((prev) => {
      releasePreviews(prev);
      if (!files) return [];
      return Array.from(files).map((file) => ({
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
      }));
    });
  };

  const handleInputChange = () => {
    const input = inputRef.current;
    refreshPreviews(input?.files ?? null);
  };

  const appendFiles = (files: File[]) => {
    if (!files.length) return;
    const input = inputRef.current;
    if (!input) return;

    const dataTransfer = new DataTransfer();
    if (input.files) {
      Array.from(input.files).forEach((file) => dataTransfer.items.add(file));
    }
    files.forEach((file) => dataTransfer.items.add(file));
    input.files = dataTransfer.files;
    refreshPreviews(input.files);
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const items = Array.from(event.dataTransfer.files || []).filter((file) => file.type.startsWith("image/"));
    appendFiles(items);
  };

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
  };

  const removeExisting = (id: string) => {
    setCurrentExisting((prev) => prev.filter((img) => img.id !== id));
  };

  const removePreview = (index: number) => {
    const input = inputRef.current;
    if (!input?.files) return;
    const dataTransfer = new DataTransfer();
    Array.from(input.files).forEach((file, idx) => {
      if (idx !== index) {
        dataTransfer.items.add(file);
      }
    });
    input.files = dataTransfer.files;
    refreshPreviews(input.files);
  };

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <header className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      </header>

      <input
        ref={inputRef}
        type="file"
        name={filesName}
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />
      <input type="hidden" name={keepName} value={keepValue} />

      <div
        className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <p className="font-medium">Arrastra imágenes aquí o selecciónalas</p>
        <p className="text-xs text-slate-400">Formatos recomendados: JPG o PNG. Tamaño máximo 10 MB por archivo.</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
        >
          Elegir archivos
        </button>
      </div>

      {currentExisting.length ? (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase text-slate-500">Imágenes guardadas</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {currentExisting.map((img) => (
              <figure key={img.id} className="overflow-hidden rounded-lg border bg-white shadow-sm">
                <img src={img.url} alt="Imagen existente" className="h-32 w-full object-cover" />
                <figcaption className="flex items-center justify-between border-t px-2 py-1 text-xs text-slate-500">
                  <span>Guardada</span>
                  <button
                    type="button"
                    onClick={() => removeExisting(img.id)}
                    className="text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      ) : null}

      {previews.length ? (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase text-slate-500">Nuevas imágenes</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {previews.map((preview, index) => (
              <figure key={`${preview.name}-${index}`} className="overflow-hidden rounded-lg border bg-white shadow-sm">
                <img src={preview.url} alt={preview.name} className="h-32 w-full object-cover" />
                <figcaption className="space-y-1 border-t px-2 py-1 text-xs text-slate-500">
                  <div className="truncate" title={preview.name}>{preview.name}</div>
                  <div>{formatSize(preview.size)}</div>
                  <button
                    type="button"
                    onClick={() => removePreview(index)}
                    className="text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
