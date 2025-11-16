"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabaseServer";

type Props = { operativoSlug?: string };

export default function PostulacionVoluntarioForm({ operativoSlug = "" }: Props) {
  const supabase = createSupabaseBrowser();
  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOkMsg(null);
    setErrMsg(null);

    const form = new FormData(e.currentTarget);
    const rut = (form.get("rut") as string)?.trim();
    const pasaporte = (form.get("pasaporte") as string)?.trim();
    const nombres = (form.get("nombres") as string)?.trim();
    const apellidos = (form.get("apellidos") as string)?.trim();
    const email = (form.get("email") as string)?.trim();
    const telefono = (form.get("telefono") as string)?.trim();
    const profesion = (form.get("profesion") as string)?.trim();
    const especialidad = (form.get("especialidad") as string)?.trim();
    const operativo = (form.get("operativo") as string)?.trim();

    // Validaciones mínimas
    if (!nombres || !apellidos || !email) {
      setErrMsg("Por favor completa al menos nombres, apellidos y email.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("api_postular_voluntario", {
        p_rut: rut || null,
        p_pasaporte: pasaporte || null,
        p_nombres: nombres,
        p_apellidos: apellidos,
        p_email: email,
        p_telefono: telefono || null,
        p_profesion: profesion || null,
        p_especialidad: especialidad || null,
        p_operativo_slug: operativo || null,
      });

      if (error) {
        console.error(error);
        setErrMsg("No pudimos registrar tu postulación. Intenta nuevamente.");
      } else {
        setOkMsg("¡Listo! Tu postulación fue recibida. Te contactaremos por correo.");
        (e.currentTarget as HTMLFormElement).reset();
      }
    } catch (err) {
      console.error(err);
      setErrMsg("Error inesperado. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border p-4 shadow bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Nombres *</label>
          <input name="nombres" className="w-full border rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Apellidos *</label>
          <input name="apellidos" className="w-full border rounded-lg px-3 py-2" required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Email *</label>
          <input type="email" name="email" className="w-full border rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Teléfono</label>
          <input name="telefono" className="w-full border rounded-lg px-3 py-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">RUT (opcional)</label>
          <input name="rut" className="w-full border rounded-lg px-3 py-2" placeholder="12.345.678-9" />
        </div>
        <div>
          <label className="block text-sm mb-1">Pasaporte (opcional)</label>
          <input name="pasaporte" className="w-full border rounded-lg px-3 py-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Profesión</label>
          <input name="profesion" className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Especialidad</label>
          <input name="especialidad" className="w-full border rounded-lg px-3 py-2" />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Operativo (slug)</label>
        <input
          name="operativo"
          defaultValue={operativoSlug}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="ej: operativo-san-ramon"
        />
        <p className="text-xs text-gray-500 mt-1">
          Si llegaste desde un operativo, el campo ya viene prellenado.
        </p>
      </div>

      {okMsg && <div className="text-green-700 text-sm">{okMsg}</div>}
      {errMsg && <div className="text-red-600 text-sm">{errMsg}</div>}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-xl border shadow hover:shadow-md transition disabled:opacity-50"
      >
        {loading ? "Enviando..." : "Enviar postulación"}
      </button>
    </form>
  );
}
