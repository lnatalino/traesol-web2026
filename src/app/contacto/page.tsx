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
    <main className="container">
      <h1 className="title">Contacto</h1>
      <p className="subtitle">Escríbenos y te responderemos a la brevedad.</p>

      {okMsg && <div className="alert success">{okMsg}</div>}
      {errMsg && <div className="alert error">{errMsg}</div>}

      <section className="card space-y-4 mt-4">
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
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

          <div className="grid md:grid-cols-2 gap-4">
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
              className="inp mt-1 min-h-[140px]"
              value={form.mensaje}
              onChange={(e) => set("mensaje", e.target.value)}
              required
            />
          </label>

          <div className="pt-2">
            <button className="btn-primary" disabled={sending}>
              {sending ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
