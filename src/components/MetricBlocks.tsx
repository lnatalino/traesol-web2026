type Metrics = { operativos_publicados: number; voluntarios_total: number; asistencias_marcadas: number };

export default function MetricBlocks({ m }: { m: Metrics }) {
  const box = "rounded-2xl border p-5 shadow bg-white";
  const num = "text-3xl font-semibold";
  const label = "text-sm text-gray-500";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className={box}><div className={num}>{m.operativos_publicados}</div><div className={label}>Operativos publicados</div></div>
      <div className={box}><div className={num}>{m.voluntarios_total}</div><div className={label}>Voluntarios registrados</div></div>
      <div className={box}><div className={num}>{m.asistencias_marcadas}</div><div className={label}>Asistencias marcadas</div></div>
    </div>
  );
}
