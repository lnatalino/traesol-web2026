"use client";

import { useState } from "react";

export default function ContactoPage() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    asunto: "",
    mensaje: "",
  });
  const [sending, setSending] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const set = (k: keyof typeof form, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOkMsg(""); setErrMsg("");

    if (!form.email.trim()) return setErrMsg("Ingresa un correo.");
    if (!form.mensaje.trim()) return setErrMsg("Escribe tu mensaje.");

    setSending(true);
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo enviar.");
      setOkMsg("¡Gracias! Recibimos tu mensaje y te responderemos pronto.");
      setForm({ nombre: "", email: "", telefono: "", asunto: "", mensaje: "" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setErrMsg(err?.message || "No se pudo enviar el formulario.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-12 lg:px-6">
        <header className="space-y-3 text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Contacto</p>
          <h1 className="text-4xl font-semibold text-slate-900">Conversemos</h1>
          <p className="text-base text-slate-600">
            Escríbenos para coordinar operativos, alianzas o voluntariado. Te responderemos a la brevedad.
          </p>
        </header>

        {okMsg && <div className="alert success">{okMsg}</div>}
        {errMsg && <div className="alert error">{errMsg}</div>}

        <section className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-[32px] border border-blue-100 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-6 text-white shadow-xl sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">Escríbenos</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">Estamos para ayudarte</h2>
            <p className="mt-4 text-sm text-white/80">
              Cuéntanos qué necesitas: coordinación de operativos, voluntariado, alianzas empresariales o información general sobre Traesol.
            </p>
            <div className="mt-8 space-y-4 text-sm text-white/85">
              <div className="rounded-2xl border border-white/30 bg-white/10 p-4">
                También puedes escribirnos a <span className="font-semibold">contacto@traesol.cl</span> si prefieres usar tu correo.
              </div>
              <div className="rounded-2xl border border-white/30 bg-white/10 p-4">
                Revisamos cada mensaje en menos de 48 horas hábiles.
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-lg sm:p-10">
            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="label">Nombre</span>
                  <input
                    className="inp mt-1"
                    value={form.nombre}
                    onChange={(e) => set("nombre", e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="label">Email *</span>
                  <input
                    type="email"
                    className="inp mt-1"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="label">Teléfono</span>
                  <input
                    className="inp mt-1"
                    value={form.telefono}
                    onChange={(e) => set("telefono", e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="label">Asunto</span>
                  <input
                    className="inp mt-1"
                    value={form.asunto}
                    onChange={(e) => set("asunto", e.target.value)}
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="label">Mensaje *</span>
                <textarea
                  className="inp mt-1 min-h-[180px]"
                  value={form.mensaje}
                  onChange={(e) => set("mensaje", e.target.value)}
                  required
                />
              </label>

              <div className="pt-2">
                <button className="btn-primary w-full text-base" disabled={sending}>
                  {sending ? "Enviando…" : "Enviar mensaje"}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
