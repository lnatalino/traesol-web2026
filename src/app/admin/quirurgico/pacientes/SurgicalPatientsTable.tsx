import Link from "next/link";
import { normalizeRut, type QuirurgicoPacienteWithOperativo, type OperativoQuirurgicoSummary } from "@/lib/quirurgico";
import { DeletePatientButton } from "./DeletePatientButton";
import { PortalLinkButton } from "./PortalLinkButton";

const DATE_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_FORMAT.format(date);
}

function formatBoolean(value: boolean): string {
  return value ? "Sí" : "No";
}

function buildOperativoLocation(op?: OperativoQuirurgicoSummary | null): string {
  if (!op) return "";
  return [op.ciudad, op.lugar].filter(Boolean).join(" · ");
}

function formatRut(value?: string | null): string {
  if (!value) return "—";
  const normalized = normalizeRut(value);
  return normalized?.formateado ?? value;
}

type SurgicalPatientsTableProps = {
  patients: QuirurgicoPacienteWithOperativo[];
  queryValue: string;
  operativoId: string;
  operativos: OperativoQuirurgicoSummary[];
  errorMessage?: string;
};

export default function SurgicalPatientsTable({
  patients,
  queryValue,
  operativoId,
  operativos,
  errorMessage,
}: SurgicalPatientsTableProps) {
  const hasPatients = patients.length > 0;

  return (
    <section className="space-y-4 rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Pacientes quirúrgicos</h2>
          <p className="text-sm text-slate-500">Filtra por operativo o busca por nombre/RUT para encontrar un paciente.</p>
        </div>
        <Link
          href="/admin/quirurgico/pacientes/nuevo"
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          + Nuevo paciente
        </Link>
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-3" method="get">
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Buscar
          <input
            type="text"
            name="q"
            defaultValue={queryValue}
            placeholder="Nombre o RUT"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Operativo
          <select
            name="operativo"
            defaultValue={operativoId}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Todos</option>
            {operativos.map((op) => {
              const location = buildOperativoLocation(op);
              return (
                <option key={op.id} value={op.id}>
                  {op.titulo}
                  {location ? ` · ${location}` : ""}
                </option>
              );
            })}
          </select>
          {operativos.length === 0 ? (
            <p className="mt-1 text-xs text-slate-500">No hay operativos cargados aún.</p>
          ) : null}
        </label>
        <div className="flex items-end gap-3">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            Aplicar filtros
          </button>
          <Link
            href="/admin/quirurgico/pacientes"
            className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Limpiar
          </Link>
        </div>
      </form>

      {errorMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {errorMessage}
        </div>
      ) : null}

      {hasPatients ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">RUT</th>
                <th className="px-4 py-3">Operativo</th>
                <th className="px-4 py-3">Ciudad origen</th>
                <th className="px-4 py-3">Vuelo</th>
                <th className="px-4 py-3">Hospedaje</th>
                <th className="px-4 py-3">Fecha cirugía</th>
                <th className="px-4 py-3">Portal</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((patient) => (
                <tr key={patient.id} className="text-slate-700">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{patient.nombre_completo}</div>
                    <div className="text-xs text-slate-500">{patient.email || "Sin email"}</div>
                  </td>
                  <td className="px-4 py-3">{formatRut(patient.rut)}</td>
                  <td className="px-4 py-3">
                    {patient.operativo?.titulo || "—"}
                    {buildOperativoLocation(patient.operativo) ? (
                      <span className="block text-xs text-slate-500">{buildOperativoLocation(patient.operativo)}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{patient.ciudad_origen || "—"}</td>
                  <td className="px-4 py-3">{formatBoolean(patient.requiere_vuelo)}</td>
                  <td className="px-4 py-3">{formatBoolean(patient.requiere_hospedaje)}</td>
                  <td className="px-4 py-3">{formatDate(patient.fecha_cirugia)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        patient.portal_is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {patient.portal_is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <PortalLinkButton />
                      <Link
                        href={`/admin/quirurgico/pacientes/${patient.id}`}
                        className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                      >
                        Ver / Editar
                      </Link>
                      <DeletePatientButton patientId={patient.id} patientName={patient.nombre_completo} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-8 text-center text-sm text-slate-500">
          No hay pacientes registrados aún. Comienza creando uno nuevo.
        </div>
      )}
    </section>
  );
}
