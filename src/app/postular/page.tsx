// src/app/postular/page.tsx
"use client";

import { useEffect, useReducer, useCallback, memo, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import { useSession } from "@/components/providers/SessionProvider";
import UsuarioLogueadoPostular from "@/components/public/UsuarioLogueadoPostular";
import { formatOperativoOptionLabel, type PublicOperativo } from "@/lib/operativosShared";

/* ===== Helpers RUT ===== */
function normalizeRut(raw: string) {
  return raw.replace(/\./g, "").replace(/-/g, "").replace(/\s+/g, "").toUpperCase();
}
function formatRut(raw: string) {
  const clean = raw.replace(/[^0-9Kk]/g, "").toUpperCase();
  if (!clean) return "";
  const dv = clean.slice(-1);
  let num = clean.slice(0, -1);
  let out = "";
  while (num.length > 3) {
    out = "." + num.slice(-3) + out;
    num = num.slice(0, -3);
  }
  out = num + out;
  return `${out}-${dv}`;
}

type Operativo = PublicOperativo & { slug: string };

type FormState = {
  // personales
  nombres: string;
  apellidos: string;
  nacionalidad: string;
  genero: "Masculino" | "Femenino" | "";
  fecha_nacimiento: string; // YYYY-MM-DD
  // identificación
  extranjero: boolean;
  rut: string;
  id_nacional: string;
  pasaporte: string;
  // contacto
  email: string;
  telefono: string;
  direccion: string;
  instagram: string;
  // profesional
  profesion: string;
  profesion_otro: string;
  especialidad: string;
  // tallas
  talla_polera: string;
  talla_pantalon: string;
  // alimentación
  alimentarias_alergias: string;
  alimentarias_veg: boolean;
  alimentarias_otro: string;
  // credencial y postulación
  nombre_credencial: string;
  tipo_postulacion: "general" | "especifica";
  operativo_slug: string;
  operativo_id: string;
  disponibilidad_anual: string;
  motivacion: string;
};

const initialForm: FormState = {
  nombres: "",
  apellidos: "",
  nacionalidad: "",
  genero: "",
  fecha_nacimiento: "",

  extranjero: false,
  rut: "",
  id_nacional: "",
  pasaporte: "",

  email: "",
  telefono: "",
  direccion: "",
  instagram: "",

  profesion: "Estudiante",
  profesion_otro: "",
  especialidad: "",

  talla_polera: "",
  talla_pantalon: "",

  alimentarias_alergias: "",
  alimentarias_veg: false,
  alimentarias_otro: "",

  nombre_credencial: "",
  tipo_postulacion: "general",
  operativo_slug: "",
  operativo_id: "",
  disponibilidad_anual: "",
  motivacion: "",
};

type Action =
  | { type: "set"; key: keyof FormState; value: any }
  | { type: "merge"; payload: Partial<FormState> }
  | { type: "reset" };

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case "set":
      return { ...state, [action.key]: action.value };
    case "merge":
      return { ...state, ...action.payload };
    case "reset":
      return initialForm;
    default:
      return state;
  }
}

/* ---- UI helpers ---- */
const Section = memo(function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
      <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
      {children}
    </section>
  );
});

const Field = memo(function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm text-slate-700">
      <span className="font-semibold text-slate-900">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
});

export default function PostularPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-600">Cargando formulario…</p></div>}>
      <PostularContent />
    </Suspense>
  );
}

function PostularContent() {
  const sp = useSearchParams();
  const { user, loading: sessionLoading } = useSession();
  
  // Estado para controlar si mostrar formulario aunque esté logueado
  // (cuando elige "postular a otra persona")
  const [mostrarFormularioOtraPersona, setMostrarFormularioOtraPersona] = useState(false);
  
  const [ops, setOps] = useState<Operativo[]>([]);
  const [sending, setSending] = useState(false);
  const [msgOk, setMsgOk] = useState("");
  const [msgErr, setMsgErr] = useState("");
  const [msgWarn, setMsgWarn] = useState("");
  const [msgAuto, setMsgAuto] = useState("");
  const [rutLookup, setRutLookup] = useState("");

  const [f, dispatch] = useReducer(reducer, initialForm);
  const slugFromUrlRef = useRef<string | null>(null);
  const setField = useCallback(
    <K extends keyof FormState>(k: K, v: FormState[K]) => {
      dispatch({ type: "set", key: k, value: v });
    },
    []
  );

  // Prefill por query ?operativo=
  useEffect(() => {
    const slug = (sp.get("operativo") || "").trim().toLowerCase();
    slugFromUrlRef.current = slug || null;
    if (slug) {
      dispatch({
        type: "merge",
        payload: { tipo_postulacion: "especifica", operativo_slug: slug },
      });
    }
    
    // Si viene con ?otra_persona=1, activar el modo "postular a otra persona"
    const otraPersona = sp.get("otra_persona");
    if (otraPersona === "1") {
      setMostrarFormularioOtraPersona(true);
    }
  }, [sp]);

  // Cargar operativos publicados para el select
  useEffect(() => {
    let cancelled = false;

    async function loadOperativos(): Promise<void> {
      try {
        const res = await fetch("/api/operativos/public", { cache: "no-store" });
        if (!res.ok) {
          console.error("Carga de operativos públicos falló", res.status, res.statusText);
          if (!cancelled) setOps([]);
          return;
        }

        const json: any = await res.json();
        if (!json || typeof json !== "object" || !Array.isArray(json.items)) {
          console.error("Respuesta inesperada de /api/operativos/public", json);
          if (!cancelled) setOps([]);
          return;
        }

        if (!json.ok) {
          console.error("Carga de operativos públicos falló", json.error);
          if (!cancelled) setOps([]);
          return;
        }

        const lista = json.items as PublicOperativo[];

        if (!cancelled) {
          setOps(
            lista
              .filter(
                (op): op is Operativo =>
                  typeof op?.id === "string" && typeof op?.slug === "string" && op.slug.trim().length > 0
              )
              .map((op) => ({ ...op, slug: op.slug.trim() }))
          );
        }
      } catch (error) {
        console.error("No se pudieron cargar los operativos", error);
        if (!cancelled) {
          setOps([]);
        }
      }
    }

    loadOperativos();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const slug = slugFromUrlRef.current;
    if (!slug) return;
    if (!ops.length) return;
    if (f.operativo_id) return;
    const match = ops.find((op) => op.slug === slug);
    if (match) {
      dispatch({
        type: "merge",
        payload: { operativo_id: match.id, operativo_slug: match.slug ?? "", tipo_postulacion: "especifica" },
      });
      slugFromUrlRef.current = null;
    }
  }, [ops, f.operativo_id]);

  const usarNombreRapido = useCallback(() => {
    const n = `${(f.nombres || "").split(" ")[0] ?? ""} ${
      (f.apellidos || "").split(" ")[0] ?? ""
    }`.trim();
    setField("nombre_credencial", n);
  }, [f.nombres, f.apellidos, setField]);

  const handleOperativoSelect = useCallback(
    (operativoId: string) => {
      if (!operativoId) {
        dispatch({
          type: "merge",
          payload: { operativo_id: "", operativo_slug: "", tipo_postulacion: "general" },
        });
        return;
      }

      const selected = ops.find((op) => op.id === operativoId);
      dispatch({
        type: "merge",
        payload: {
          operativo_id: operativoId,
          operativo_slug: selected?.slug ?? "",
          tipo_postulacion: "especifica",
        },
      });
    },
    [ops]
  );

  /* ===== Autocompletar por RUT ===== */
  const preFillByRut = useCallback(
    async (raw?: string) => {
      setMsgAuto("");
      try {
        const candidate = typeof raw === "string" && raw.trim().length ? raw : rutLookup;
        const normalizedRut = normalizeRut(candidate || "");
        if (!normalizedRut) throw new Error("Ingresa tu RUT para autocompletar.");

        const res = await fetch("/api/voluntarios/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rut: normalizedRut }),
        });
        const j = await res.json();
        if (!j.ok) throw new Error(j.error || "No se pudo buscar.");

        if (!j.found) {
          setMsgAuto("No encontramos un registro previo con ese RUT.");
          return;
        }

        const d = j.data || {};
        const takeString = (value: any, fallback: string): string =>
          typeof value === "string" && value !== null ? value : fallback;

        const sanitized: Partial<FormState> = {
          nombres: takeString(d.nombres, f.nombres),
          apellidos: takeString(d.apellidos, f.apellidos),
          nacionalidad: takeString(d.nacionalidad, f.nacionalidad),
          genero: takeString(d.genero, f.genero) as FormState["genero"],
          fecha_nacimiento: takeString(d.fecha_nacimiento, f.fecha_nacimiento),
          rut: d.rut ? formatRut(String(d.rut)) : f.rut,
          id_nacional: takeString(d.id_nacional, f.id_nacional),
          pasaporte: takeString(d.pasaporte, f.pasaporte),
          email: takeString(d.email, f.email),
          telefono: takeString(d.telefono, f.telefono),
          direccion: takeString(d.direccion, f.direccion),
          instagram: takeString(d.instagram, f.instagram),
          profesion: takeString(d.profesion, f.profesion),
          profesion_otro: takeString(d.profesion_otro, f.profesion_otro),
          especialidad: takeString(d.especialidad, f.especialidad),
          talla_polera: takeString(d.talla_polera, f.talla_polera),
          talla_pantalon: takeString(d.talla_pantalon, f.talla_pantalon),
          nombre_credencial: takeString(d.nombre_credencial, f.nombre_credencial),
        };

        const hasVeg = typeof d.alimentarias_veg === "boolean";
        sanitized.alimentarias_veg = hasVeg ? Boolean(d.alimentarias_veg) : f.alimentarias_veg;
        sanitized.alimentarias_alergias = takeString(d.alimentarias_alergias, f.alimentarias_alergias);
        sanitized.alimentarias_otro = takeString(d.alimentarias_otro, f.alimentarias_otro);

        if (sanitized.rut) sanitized.extranjero = false;
        else if (sanitized.id_nacional) sanitized.extranjero = true;
        else sanitized.extranjero = f.extranjero;

        dispatch({ type: "merge", payload: sanitized });
        setMsgAuto("¡Listo! Completamos tus datos desde tu registro. Si editas algo, se actualizará.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e: any) {
        setMsgAuto(e?.message || "No se pudo autocompletar.");
      }
    },
    [f, rutLookup]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsgOk("");
    setMsgErr("");
    setMsgWarn("");
    setSending(true);

    const normalizeRutForDB = (rut: string) =>
      rut.replace(/\./g, "").replace(/-/g, "").trim().toUpperCase();

    try {
      // Validaciones mínimas
      if (!f.nombres.trim() || !f.apellidos.trim())
        throw new Error("Completa nombres y apellidos.");
      if (!f.email.trim()) throw new Error("Indica tu email.");
      if (!f.genero) throw new Error("Selecciona tu género.");
      if (!f.extranjero && !f.rut.trim())
        throw new Error("El RUT es obligatorio (o marca 'soy extranjero/a').");
      if (f.extranjero && !f.id_nacional.trim())
        throw new Error("Indica tu identificación nacional.");

      const rutNorm = f.extranjero ? null : normalizeRutForDB(f.rut);
      const idNac = f.extranjero ? f.id_nacional.trim() : null;

      const selectedOperativo = f.operativo_id
        ? ops.find((op) => op.id === f.operativo_id) || null
        : null;
      const tipo = selectedOperativo ? "especifica" : "general";

      if (tipo === "especifica" && !selectedOperativo) {
        throw new Error("Selecciona un operativo válido para la postulación específica.");
      }

      const payload = {
        nombres: f.nombres.trim(),
        apellidos: f.apellidos.trim(),
        nacionalidad: f.nacionalidad || null,
        genero: f.genero || null,
        fecha_nacimiento: f.fecha_nacimiento || null,
        rut: rutNorm,
        id_nacional: idNac,
        pasaporte: f.pasaporte || null,
        email: f.email.trim(),
        telefono: f.telefono || null,
        direccion: f.direccion || null,
        instagram: f.instagram || null,
        profesion: f.profesion,
        profesion_otro: f.profesion === "Otro" ? f.profesion_otro : null,
        especialidad: f.especialidad || null,
        talla_polera: f.talla_polera || null,
        talla_pantalon: f.talla_pantalon || null,
        alimentarias_alergias: f.alimentarias_alergias || null,
        alimentarias_veg: !!f.alimentarias_veg,
        alimentarias_otro: f.alimentarias_otro || null,
        nombre_credencial: f.nombre_credencial || null,
        disponibilidad_anual: f.disponibilidad_anual || null,
        motivacion: f.motivacion || null,
        extranjero: f.extranjero,
        tipo_postulacion: tipo,
        operativo_id: selectedOperativo ? selectedOperativo.id : null,
        operativo_slug: selectedOperativo ? selectedOperativo.slug : null,
        // Si un usuario logueado eligió "postular a otra persona", marcarlo
        // Esto asegura que NO se toque su user_profiles
        postulando_otra_persona: user && mostrarFormularioOtraPersona ? true : undefined,
        postulado_por_user_id: user && mostrarFormularioOtraPersona ? user.id : undefined,
      } as const;

      const response = await fetch("/api/postulaciones/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({} as any));
      const code = typeof data?.code === "string" ? data.code : "";
      const legacyStatus = typeof data?.status === "string" ? data.status : ""; // backward compat
      const status = (code || legacyStatus).toUpperCase();
      const apiMessage = typeof data?.message === "string" ? data.message : "";

      if (!response.ok && !status) {
        const message = apiMessage || data?.error || "No se pudo enviar la postulación.";
        throw new Error(message);
      }

      const handleNotice = (message: string, variant: "warn" | "error") => {
        if (variant === "warn") {
          setMsgWarn(message);
          setMsgErr("");
        } else {
          setMsgErr(message);
          setMsgWarn("");
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      };

      if (status === "ALREADY_PENDING") {
        handleNotice(
          apiMessage || "Ya enviaste tu postulación para este operativo. Está en proceso de revisión.",
          "warn"
        );
        return;
      }

      if (status === "ALREADY_ACCEPTED") {
        handleNotice(
          apiMessage || "Ya estás inscrito en este operativo. Revisa tu correo.",
          "warn"
        );
        return;
      }

      if (status === "INVITED_ALREADY") {
        handleNotice(
          apiMessage || "Ya fuiste invitado a este operativo. Revisa tu correo y acepta la invitación.",
          "warn"
        );
        return;
      }

      if (status === "ALREADY_REVIEWED") {
        handleNotice(
          apiMessage ||
            "Tu postulación para este operativo ya fue revisada. Si tienes dudas, escríbenos a nuestro correo de contacto.",
          "warn"
        );
        return;
      }

      if (!data?.ok && !status) {
        throw new Error(apiMessage || data?.error || "No se pudo enviar la postulación.");
      }

      if (status === "OK" || status === "PROFILE_UPDATED" || data?.ok) {
        const successMessage =
          status === "PROFILE_UPDATED"
            ? apiMessage || "Actualizamos tus datos en Traesol."
            : apiMessage || "Tu postulación fue recibida. Te enviaremos un correo cuando sea evaluada.";
        setMsgOk(successMessage);
        window.location.assign("/postular/gracias");
        return;
      }
    } catch (err: any) {
      const m = String(err?.message || "");
      if (m.includes("duplicate key value") || m.includes("unique constraint")) {
        setMsgErr(
          "Ya existe un registro con ese identificador. Actualizamos tus datos y seguimos; intenta nuevamente."
        );
      } else {
        setMsgErr(m || "No se pudo enviar la postulación.");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 lg:px-6">
        <BackButton fallback="/" />

        {/* Header siempre visible */}
        <section className="rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950/80 to-blue-900 px-6 py-12 text-white shadow-[0_12px_24px_-4px_rgba(0,0,0,0.15)] sm:px-10 relative overflow-hidden">
          <div className="space-y-4 text-center lg:text-left relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Hazte voluntario</p>
            <h1 className="text-4xl font-bold tracking-tight leading-tight sm:text-5xl">Postulación de Voluntariado</h1>
            <p className="text-base text-white/80 sm:text-lg max-w-2xl mx-auto lg:mx-0">
              {user && !mostrarFormularioOtraPersona 
                ? "Bienvenido/a de vuelta. Tu cuenta te permite postular rápidamente a operativos."
                : "Completa tus datos y, si llegaste desde un operativo específico, asociaremos automáticamente tu postulación."
              }
            </p>
          </div>
        </section>

        {/* Si está logueado y NO eligió "postular a otra persona", mostrar alternativa */}
        {!sessionLoading && user && !mostrarFormularioOtraPersona ? (
          <UsuarioLogueadoPostular onMostrarFormulario={() => setMostrarFormularioOtraPersona(true)} />
        ) : (
          <>
            {/* Bloque de autocompletar RUT (solo para NO logueados o postular a otra persona) */}
            {(!user || mostrarFormularioOtraPersona) && (
              <div className="mx-auto max-w-4xl">
                {/* Banner persuasivo para crear cuenta (solo visitantes) */}
                {!user && (
                  <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900">No necesitas cuenta, pero te la recomendamos</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          Puedes postular sin crear una cuenta. Sin embargo, con una cuenta podrás:
                        </p>
                        <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                          <li>Postular a futuros operativos con un clic</li>
                          <li>Mantener tu historial de participación</li>
                          <li>Editar tus datos en cualquier momento</li>
                          <li>Recibir notificaciones y confirmaciones</li>
                        </ul>
                      </div>
                      <a
                        href="/mi-cuenta/registro"
                        className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap self-start"
                      >
                        Crear cuenta gratis
                      </a>
                    </div>
                  </div>
                )}

                {/* Banner de "postular a otra persona" */}
                {mostrarFormularioOtraPersona && (
                  <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-amber-900">Postulando a otra persona</h3>
                        <p className="text-sm text-amber-700 mt-1">
                          Completa los datos de la persona que quieres inscribir. Esta postulación no modificará tu perfil.
                          Te recomendamos que esa persona cree su propia cuenta para gestionar sus datos y participaciones.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Autocompletar por RUT */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
                  <p className="text-sm font-semibold text-slate-900">¿Ya fuiste voluntario antes?</p>
                  <p className="text-sm text-slate-600">Usa tu RUT para completar el formulario en segundos.</p>
                  <div className="flex flex-col sm:flex-row gap-3 mt-3">
                    <input
                      type="text"
                      className="inp flex-1"
                      placeholder="12.345.678-9"
                      value={rutLookup}
                      onChange={(event) => setRutLookup(event.target.value)}
                      onBlur={(event) => setRutLookup(formatRut(event.target.value))}
                      aria-label="RUT para autocompletar"
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => preFillByRut(rutLookup)}
                      disabled={!rutLookup.trim()}
                    >
                      Autocompletar
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Mensajes */}
            {(() => {
              const successParam = sp.get("success") || "";
              const errorParam = sp.get("error") || "";
              const noticeParam = sp.get("notice") || sp.get("warning") || "";
              const successMessage = msgOk || successParam;
              const warningMessage = msgWarn || noticeParam;
              const errorMessage = msgErr || errorParam;
              return (
                <div className="mx-auto max-w-4xl space-y-3">
                  {successMessage ? <div className="alert success">{successMessage}</div> : null}
                  {warningMessage ? <div className="alert warning">{warningMessage}</div> : null}
                  {errorMessage ? <div className="alert error">{errorMessage}</div> : null}
                </div>
              );
            })()}
            {msgAuto && <div className="mx-auto max-w-4xl alert info">{msgAuto}</div>}

            {/* Formulario principal */}
            <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_4px_12px_rgba(0,0,0,0.06)] sm:p-10">
              <form onSubmit={submit} className="space-y-6" autoComplete="off">
        {/* Datos personales */}
        <Section title="Datos personales">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nombres *">
              <input
                className="inp"
                value={f.nombres}
                onChange={(e) => setField("nombres", e.target.value)}
                required
              />
            </Field>
            <Field label="Apellidos *">
              <input
                className="inp"
                value={f.apellidos}
                onChange={(e) => setField("apellidos", e.target.value)}
                required
              />
            </Field>
            <Field label="Nacionalidad">
              <input
                className="inp"
                value={f.nacionalidad}
                onChange={(e) => setField("nacionalidad", e.target.value)}
              />
            </Field>
            <Field label="Género *">
              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="genero"
                    checked={f.genero === "Masculino"}
                    onChange={() => setField("genero", "Masculino")}
                  />
                  Masculino
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="genero"
                    checked={f.genero === "Femenino"}
                    onChange={() => setField("genero", "Femenino")}
                  />
                  Femenino
                </label>
              </div>
            </Field>
            <Field label="Fecha de nacimiento">
              <input
                type="date"
                className="inp"
                value={f.fecha_nacimiento}
                onChange={(e) => setField("fecha_nacimiento", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* Identificación */}
        <Section title="Identificación">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <input
                id="extranjero"
                type="checkbox"
                checked={f.extranjero}
                onChange={(e) => setField("extranjero", e.target.checked)}
              />
              <label htmlFor="extranjero" className="text-sm">
                Soy extranjero/a (sin RUT chileno)
              </label>
            </div>

            {!f.extranjero ? (
              <Field label="RUT *">
                <input
                  className="inp"
                  placeholder="12.345.678-9"
                  value={f.rut}
                  onChange={(e) => setField("rut", e.target.value)}
                  onBlur={(e) => setField("rut", formatRut(e.target.value))}
                  required
                />
              </Field>
            ) : (
              <div className="space-y-2">
                <Field label="N° identificación nacional *">
                  <input
                    className="inp"
                    value={f.id_nacional}
                    onChange={(e) => setField("id_nacional", e.target.value)}
                    required
                  />
                </Field>
                <p className="text-xs text-slate-500">
                  Ingresa tu identificación y luego usa el botón de autocompletar para recuperar tus datos si ya colaboraste antes.
                </p>
              </div>
            )}

            <Field label="Pasaporte (opcional)">
              <input
                className="inp"
                value={f.pasaporte ?? ""}
                onChange={(e) => setField("pasaporte", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* Contacto */}
        <Section title="Contacto y redes">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Email *">
              <input
                type="email"
                className="inp"
                value={f.email}
                onChange={(e) => setField("email", e.target.value)}
                required
              />
            </Field>
            <Field label="Teléfono">
              <input
                className="inp"
                value={f.telefono}
                onChange={(e) => setField("telefono", e.target.value)}
              />
            </Field>
            <Field label="Dirección de domicilio">
              <input
                className="inp"
                value={f.direccion}
                onChange={(e) => setField("direccion", e.target.value)}
              />
            </Field>
            <Field label="Instagram">
              <input
                className="inp"
                placeholder="@usuario"
                value={f.instagram}
                onChange={(e) => setField("instagram", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* Profesional */}
        <Section title="Formación profesional">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Profesión">
              <select
                className="inp"
                value={f.profesion}
                onChange={(e) => setField("profesion", e.target.value)}
              >
                <option>Estudiante</option>
                <option>Enfermería</option>
                <option>Medicina</option>
                <option>Kinesiología</option>
                <option>Odontología</option>
                <option>Técnico en Enfermería</option>
                <option>Otro</option>
              </select>
            </Field>
            <Field label="Profesión (especificar si elegiste ‘Otro’)">
              <input
                className="inp"
                value={f.profesion_otro}
                onChange={(e) => setField("profesion_otro", e.target.value)}
              />
            </Field>
            <Field label="Especialidad (opcional)">
              <input
                className="inp"
                value={f.especialidad}
                onChange={(e) => setField("especialidad", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* Tallas */}
        <Section title="Tallas">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Talla de polera">
              <select
                className="inp"
                value={f.talla_polera}
                onChange={(e) => setField("talla_polera", e.target.value)}
              >
                <option value="">Selecciona…</option>
                <option>XS</option>
                <option>S</option>
                <option>M</option>
                <option>L</option>
                <option>XL</option>
                <option>XXL</option>
              </select>
            </Field>
            <Field label="Talla de pantalón">
              <select
                className="inp"
                value={f.talla_pantalon}
                onChange={(e) => setField("talla_pantalon", e.target.value)}
              >
                <option value="">Selecciona…</option>
                <option>XS</option>
                <option>S</option>
                <option>M</option>
                <option>L</option>
                <option>XL</option>
                <option>XXL</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Alimentación */}
        <Section title="Alimentación">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Alergias alimentarias">
              <input
                className="inp"
                placeholder="Ej: maní, mariscos…"
                value={f.alimentarias_alergias}
                onChange={(e) =>
                  setField("alimentarias_alergias", e.target.value)
                }
              />
            </Field>
            <Field label="Preferencia vegetariana/vegana">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={f.alimentarias_veg}
                  onChange={(e) => setField("alimentarias_veg", e.target.checked)}
                />
                <span>Sí</span>
              </label>
            </Field>
            <Field label="Otras restricciones">
              <input
                className="inp"
                value={f.alimentarias_otro}
                onChange={(e) => setField("alimentarias_otro", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* Credencial */}
        <Section title="Credencial">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nombre para credencial">
              <input
                className="inp"
                value={f.nombre_credencial}
                onChange={(e) => setField("nombre_credencial", e.target.value)}
              />
            </Field>
            <div className="flex items-end">
              <button
                type="button"
                className="btn-outline"
                onClick={usarNombreRapido}
              >
                Usar nombre rápido
              </button>
            </div>
          </div>
        </Section>

        {/* Postulación */}
        <Section title="Postulación">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Field label="¿A qué operativo quieres postular?">
                <select
                  className="inp"
                  value={f.operativo_id}
                  onChange={(e) => handleOperativoSelect(e.target.value)}
                >
                  <option value="">No postular a ningún operativo (solo registrarme como voluntario general)</option>
                  {ops.map((o) => (
                    <option key={o.id} value={o.id}>
                      {formatOperativoOptionLabel(o)}
                    </option>
                  ))}
                </select>
              </Field>
              <p className="mt-2 text-xs text-slate-500">
                Si llegaste desde un operativo específico, ya lo dejamos preseleccionado. Puedes cambiarlo para postular a otro operativo o elegir la opción general.
              </p>
            </div>
            <Field label="Disponibilidad al año">
              <select
                className="inp"
                value={f.disponibilidad_anual}
                onChange={(e) => setField("disponibilidad_anual", e.target.value)}
              >
                <option value="">Selecciona…</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4 o más</option>
              </select>
            </Field>
          </div>
          <Field label="¿Por qué te gustaría ser voluntario/a?">
            <textarea
              className="inp"
              value={f.motivacion}
              onChange={(e) => setField("motivacion", e.target.value)}
            />
          </Field>
        </Section>

        <div className="pt-4">
          <button className="btn-primary w-full" disabled={sending}>
            {sending ? "Enviando…" : "Enviar postulación"}
          </button>
        </div>
              </form>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
