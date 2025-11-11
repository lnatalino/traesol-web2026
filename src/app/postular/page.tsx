"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase";

type Operativo = { id: string; titulo: string; slug: string; fecha_inicio: string | null; lugar: string | null };

export default function PostularPage() {
  const sp = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const [ops, setOps] = useState<Operativo[]>([]);

  const [f, setF] = useState({
    nombres: "", apellidos: "", nacionalidad: "",
    extranjero: false, rut: "", id_nacional: "", pasaporte: "",
    email: "", telefono: "", direccion: "", instagram: "",
    profesion: "Estudiante", profesion_otro: "", especialidad: "",
    talla_polera: "", talla_pantalon: "",
    alimentarias_alergias: "", alimentarias_veg: false, alimentarias_otro: "",
    nombre_credencial: "",
    tipo_postulacion: "general", operativo_slug: "",
    disponibilidad_anual: "", motivacion: "",
  });

  const [sending, setSending] = useState(false);
  const [msgOk, setMsgOk] = useState(""); const [msgErr, setMsgErr] = useState("");

  useEffect(() => {
    const slug = (sp.get("operativo") || "").trim().toLowerCase();
    if (slug) setF((s) => ({ ...s, tipo_postulacion: "especifica", operativo_slug: slug }));
  }, [sp]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("operativos")
        .select("id,titulo,slug,fecha_inicio,lugar")
        .eq("estado", "publicado")
        .order("fecha_inicio", { ascending: true });
      setOps((data || []) as Operativo[]);
    })();
  }, [supabase]);

  const on = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));
  const usarNombreRapido = () => {
    const n = `${(f.nombres || "").split(" ")[0] ?? ""} ${(f.apellidos || "").split(" ")[0] ?? ""}`.trim();
    on("nombre_credencial", n);
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsgOk(""); setMsgErr(""); setSending(true);
    try {
      if (!f.nombres.trim() || !f.apellidos.trim()) throw new Error("Completa nombres y apellidos.");
      if (!f.email.trim()) throw new Error("Indica tu email.");
      if (!f.extranjero && !f.rut.trim()) throw new Error("El RUT es obligatorio (marca extranjero si no tienes).");
      if (f.extranjero && !f.id_nacional.trim()) throw new Error("Indica tu identificación nacional.");

      await supabase.from("voluntarios").upsert({
        nombres: f.nombres, apellidos: f.apellidos, nacionalidad: f.nacionalidad || null,
        extranjero: f.extranjero, rut: f.extranjero ? null : f.rut,
        id_nacional: f.extranjero ? f.id_nacional : null, pasaporte: f.pasaporte || null,
        email: f.email, telefono: f.telefono || null, direccion: f.direccion || null,
        instagram: f.instagram || null,
        profesion: f.profesion, profesion_otro: f.profesion === "Otro" ? f.profesion_otro : null,
        especialidad: f.especialidad || null,
        talla_polera: f.talla_polera || null, talla_pantalon: f.talla_pantalon || null,
        alimentarias_alergias: f.alimentarias_alergias || null, alimentarias_veg: !!f.alimentarias_veg,
        alimentarias_otro: f.alimentarias_otro || null, nombre_credencial: f.nombre_credencial || null,
      });

      setMsgOk("¡Listo! Recibimos tu postulación. Te contactaremos pronto.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setMsgErr(err?.message || "No se pudo enviar la postulación.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSending(false);
    }
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="card space-y-4">
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="block text-sm">
      <span className="label">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
  const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...p} className={`inp ${p.className || ""}`} />
  );

  return (
    <main className="container">
      <header className="mb-6">
        <h1 className="title">Postulación de Voluntariado</h1>
        <p className="subtitle">Completa tus datos y, si llegaste desde un operativo específico, quedará asociada tu postulación.</p>
      </header>

      {msgOk && <div className="alert success">{msgOk}</div>}
      {msgErr && <div className="alert error">{msgErr}</div>}

      <form onSubmit={submit} className="space-y-6">
        <Section title="Datos personales">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nombres *"><input className="inp" value={f.nombres} onChange={(e)=>on("nombres",e.target.value)} required/></Field>
            <Field label="Apellidos *"><input className="inp" value={f.apellidos} onChange={(e)=>on("apellidos",e.target.value)} required/></Field>
            <Field label="Nacionalidad"><input className="inp" value={f.nacionalidad} onChange={(e)=>on("nacionalidad",e.target.value)} /></Field>
          </div>
        </Section>

        <Section title="Identificación">
          <div className="flex items-center gap-2 mb-3">
            <input id="extranjero" type="checkbox" checked={f.extranjero} onChange={(e)=>on("extranjero",e.target.checked)} />
            <label htmlFor="extranjero" className="text-sm">Soy extranjero/a (sin RUT chileno)</label>
          </div>
          {!f.extranjero ? (
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="RUT *"><input className="inp" placeholder="12.345.678-9" value={f.rut} onChange={(e)=>on("rut",e.target.value)} required/></Field>
              <Field label="Pasaporte (opcional)"><input className="inp" value={f.pasaporte} onChange={(e)=>on("pasaporte",e.target.value)} /></Field>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="N° identificación nacional *"><input className="inp" value={f.id_nacional} onChange={(e)=>on("id_nacional",e.target.value)} required/></Field>
              <Field label="Pasaporte (opcional)"><input className="inp" value={f.pasaporte} onChange={(e)=>on("pasaporte",e.target.value)} /></Field>
            </div>
          )}
        </Section>

        <Section title="Contacto y redes">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Email *"><input type="email" className="inp" value={f.email} onChange={(e)=>on("email",e.target.value)} required/></Field>
            <Field label="Teléfono"><input className="inp" value={f.telefono} onChange={(e)=>on("telefono",e.target.value)} /></Field>
            <Field label="Dirección de domicilio"><input className="inp" value={f.direccion} onChange={(e)=>on("direccion",e.target.value)} /></Field>
            <Field label="Instagram"><input className="inp" placeholder="@usuario" value={f.instagram} onChange={(e)=>on("instagram",e.target.value)} /></Field>
          </div>
        </Section>

        <Section title="Formación profesional">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Profesión">
              <Select value={f.profesion} onChange={(e)=>on("profesion",e.target.value)}>
                <option>Estudiante</option><option>Enfermería</option><option>Medicina</option>
                <option>Kinesiología</option><option>Odontología</option>
                <option>Técnico en Enfermería</option><option>Otro</option>
              </Select>
            </Field>
            <Field label="Profesión (especificar si elegiste ‘Otro’)"><input className="inp" value={f.profesion_otro} onChange={(e)=>on("profesion_otro",e.target.value)} /></Field>
            <Field label="Especialidad (opcional)"><input className="inp" value={f.especialidad} onChange={(e)=>on("especialidad",e.target.value)} /></Field>
          </div>
        </Section>

        <Section title="Tallas">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Talla de polera">
              <Select value={f.talla_polera} onChange={(e)=>on("talla_polera",e.target.value)}>
                <option value="">Selecciona…</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option>
              </Select>
            </Field>
            <Field label="Talla de pantalón">
              <Select value={f.talla_pantalon} onChange={(e)=>on("talla_pantalon",e.target.value)}>
                <option value="">Selecciona…</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option>
              </Select>
            </Field>
          </div>
        </Section>

        <Section title="Alimentación">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Alergias alimentarias"><input className="inp" placeholder="Ej: maní, mariscos…" value={f.alimentarias_alergias} onChange={(e)=>on("alimentarias_alergias",e.target.value)} /></Field>
            <Field label="Preferencia vegetariana/vegana">
              <label className="flex items-center gap-2"><input type="checkbox" checked={f.alimentarias_veg} onChange={(e)=>on("alimentarias_veg",e.target.checked)} /><span>Sí</span></label>
            </Field>
            <Field label="Otras restricciones"><input className="inp" value={f.alimentarias_otro} onChange={(e)=>on("alimentarias_otro",e.target.value)} /></Field>
          </div>
        </Section>

        <Section title="Credencial">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nombre para credencial"><input className="inp" value={f.nombre_credencial} onChange={(e)=>on("nombre_credencial",e.target.value)} /></Field>
            <div className="flex items-end"><button type="button" className="btn-outline" onClick={usarNombreRapido}>Usar nombre rápido</button></div>
          </div>
        </Section>

        <Section title="Postulación">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Tipo de postulación">
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="radio" checked={f.tipo_postulacion==="general"} onChange={()=>on("tipo_postulacion","general")} />General</label>
                <label className="flex items-center gap-2"><input type="radio" checked={f.tipo_postulacion==="especifica"} onChange={()=>on("tipo_postulacion","especifica")} />Operativo específico</label>
              </div>
            </Field>

            {f.tipo_postulacion === "especifica" ? (
              <Field label="Operativo">
                <Select value={f.operativo_slug} onChange={(e)=>on("operativo_slug",e.target.value)}>
                  <option value="">Selecciona un operativo…</option>
                  {ops.map((o)=>(<option key={o.id} value={o.slug}>{o.titulo}</option>))}
                </Select>
              </Field>
            ) : (
              <>
                <Field label="Disponibilidad al año">
                  <Select value={f.disponibilidad_anual} onChange={(e)=>on("disponibilidad_anual",e.target.value)}>
                    <option value="">Selecciona…</option><option>1</option><option>2</option><option>3</option><option>4 o más</option>
                  </Select>
                </Field>
                <Field label="¿Por qué te gustaría ser voluntario/a?">
                  <textarea className="inp min-h-[110px]" value={f.motivacion} onChange={(e)=>on("motivacion",e.target.value)} />
                </Field>
              </>
            )}
          </div>
        </Section>

        <div className="pt-2">
          <button className="btn-primary" disabled={sending}>{sending ? "Enviando…" : "Enviar postulación"}</button>
        </div>
      </form>
    </main>
  );
}
