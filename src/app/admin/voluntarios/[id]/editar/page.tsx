import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import type { VoluntarioAdminRow } from "@/lib/voluntariosAdmin";
import { VOLUNTARIO_COLUMNS } from "@/lib/voluntariosAdmin";

export const dynamic = "force-dynamic";

const GENEROS = ["Femenino", "Masculino", "Otro"];

type Params = Promise<{ id: string }>;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type FieldProps = {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
};

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function Field({ label, name, defaultValue = "", type = "text", required = false, placeholder }: FieldProps) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border px-3 py-2"
      />
    </label>
  );
}

export default async function EditVolunteerPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const session = await getAdminSession();
  const sp = await searchParams;
  const { id } = await params;

  if (!session.allowed) {
    redirect(`/login?next=/admin/voluntarios/${id}/editar`);
  }

  if (!id) {
    notFound();
  }

  const { data, error } = await supabaseService
    .from("voluntarios")
    .select(VOLUNTARIO_COLUMNS)
    .eq("id", id)
    .maybeSingle<VoluntarioAdminRow>();

  if (error) {
    const url = `/admin/voluntarios/${id}?error=${encodeURIComponent(String(error.message))}`;
    redirect(url);
  }

  if (!data) {
    notFound();
  }

  const notice = typeof sp?.success === "string" ? sp.success : "";
  const errorMessage = typeof sp?.error === "string" ? sp.error : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Editar voluntario</h1>
          <p className="text-sm text-slate-500">Actualiza los datos de contacto y ficha del voluntario.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href={`/admin/voluntarios/${id}`} className="rounded-md border px-3 py-1.5 hover:bg-slate-50">
            Ver ficha
          </Link>
          <Link href="/admin/voluntarios" className="rounded-md border px-3 py-1.5 hover:bg-slate-50">
            Volver al listado
          </Link>
        </div>
      </div>

      {notice ? (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <form action="/api/admin/voluntarios/update" method="post" className="space-y-6">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="redirectTo" value={`/admin/voluntarios/${id}?success=Voluntario+actualizado`} />

        <section className="grid gap-4 md:grid-cols-2">
          <Field label="Nombres" name="nombres" defaultValue={data.nombres} required />
          <Field label="Apellidos" name="apellidos" defaultValue={data.apellidos} required />
          <Field label="Email" name="email" type="email" defaultValue={data.email} required />
          <Field label="Teléfono" name="telefono" defaultValue={data.telefono} />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-600">Profesión</span>
            <input
              name="profesion"
              defaultValue={data.profesion ?? ""}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Profesión principal"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-600">Especialidad</span>
            <input
              name="especialidad"
              defaultValue={data.especialidad ?? ""}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Área de especialidad"
            />
          </label>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-600">Fecha de nacimiento</span>
            <input
              type="date"
              name="fecha_nacimiento"
              defaultValue={toDateInput(data.fecha_nacimiento)}
              className="w-full rounded-md border px-3 py-2"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-600">Género</span>
            <select name="genero" defaultValue={data.genero ?? ""} className="w-full rounded-md border px-3 py-2">
              <option value="">Sin dato</option>
              {GENEROS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Field label="Ciudad" name="ciudad" defaultValue={data.ciudad} />
          <Field label="Región" name="region" defaultValue={data.region} />
          <Field label="País" name="pais" defaultValue={data.pais} />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Field label="Talla polera" name="talla_polera" defaultValue={data.talla_polera} />
          <Field label="Talla pantalón" name="talla_pantalon" defaultValue={data.talla_pantalon} />
          <Field label="Tipo de usuario" name="tipo_usuario" defaultValue={data.tipo_usuario} />
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Guardar cambios
          </button>
          <Link
            href={`/admin/voluntarios/${id}`}
            className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
