"use client";

import { useState } from "react";
import { PUBLIC_CONTACT_EMAIL } from "@/lib/constants/publicContact";
import { PublicHero } from "@/components/public";

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
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <PublicHero
        eyebrow="Contacto"
        title="Conversemos"
        subtitle="Escríbenos para coordinar operativos, alianzas o voluntariado. Te responderemos a la brevedad."
      />

      {/* Contenido */}
      <div className="mx-auto max-w-5xl space-y-8 px-5 py-14 lg:px-6">
        {okMsg && <div className="rounded-xl bg-green-50 border border-green-200 text-green-800 px-5 py-3.5 text-sm font-medium">{okMsg}</div>}
        {errMsg && <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 px-5 py-3.5 text-sm font-medium">{errMsg}</div>}

        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Escríbenos</p>
            <h2 className="mt-4 text-2xl font-bold leading-tight text-slate-900 tracking-tight">Estamos para ayudarte</h2>
            <p className="mt-4 text-sm text-slate-600">
              Cuéntanos qué necesitas: coordinación de operativos, voluntariado, alianzas empresariales o información general sobre Traesol.
            </p>
            <div className="mt-8 space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                También puedes escribirnos a{" "}
                <a href={`mailto:${PUBLIC_CONTACT_EMAIL}`} className="font-semibold text-blue-600 hover:underline">
                  {PUBLIC_CONTACT_EMAIL}
                </a>{" "}
                si prefieres usar tu correo.
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                Revisamos cada mensaje en menos de 48 horas hábiles.
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-10">
            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Nombre</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    value={form.nombre}
                    onChange={(e) => set("nombre", e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Email *</span>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Teléfono</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    value={form.telefono}
                    onChange={(e) => set("telefono", e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Asunto</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    value={form.asunto}
                    onChange={(e) => set("asunto", e.target.value)}
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="font-medium text-slate-700">Mensaje *</span>
                <textarea
                  className="mt-1 w-full min-h-[180px] rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-y"
                  value={form.mensaje}
                  onChange={(e) => set("mensaje", e.target.value)}
                  required
                />
              </label>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={sending}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-700/25 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
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
