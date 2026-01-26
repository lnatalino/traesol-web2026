// src/app/mi-cuenta/perfil/editar/page.tsx
// Página de edición completa del perfil de voluntario
// Incluye TODOS los campos requeridos para postular a operativos
"use client";

import { useEffect, useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { formatRut, isValidRutFormat } from "@/lib/userAuth";
import BackButton from "@/components/BackButton";
import { createSupabaseBrowser } from "@/lib/supabase";

// Opciones de tallas
const TALLAS_POLERA = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const TALLAS_PANTALON = ["36", "38", "40", "42", "44", "46", "48", "50"];

interface FormData {
  first_name: string;
  last_name: string;
  rut: string;
  phone: string;
  birthdate: string;
  direccion: string;
  comuna: string;
  instagram: string;
  talla_polera: string;
  talla_pantalon: string;
  restricciones_alimentarias: string;
}

function EditarPerfilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { user, loading: sessionLoading, refresh } = useSession();
  
  const [form, setForm] = useState<FormData>({
    first_name: "",
    last_name: "",
    rut: "",
    phone: "",
    birthdate: "",
    direccion: "",
    comuna: "",
    instagram: "",
    talla_polera: "",
    talla_pantalon: "",
    restricciones_alimentarias: "",
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [rutLocked, setRutLocked] = useState(false);

  // Cargar perfil actual
  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;
      
      setLoadingProfile(true);
      try {
        const supabase = createSupabaseBrowser();
        const { data } = await supabase
          .from("user_profiles")
          .select("first_name, last_name, rut, phone, birthdate, direccion, comuna, instagram, talla_polera, talla_pantalon, restricciones_alimentarias")
          .eq("id", user.id)
          .single();
        
        if (data) {
          setForm({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            rut: data.rut ? formatRut(data.rut) : "",
            phone: data.phone || "",
            birthdate: data.birthdate || "",
            direccion: data.direccion || "",
            comuna: data.comuna || "",
            instagram: data.instagram || "",
            talla_polera: data.talla_polera || "",
            talla_pantalon: data.talla_pantalon || "",
            restricciones_alimentarias: data.restricciones_alimentarias || "",
          });
          setRutLocked(!!data.rut);
        }
      } catch (err) {
        console.error("[editar-perfil] Error cargando perfil:", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    
    if (user) {
      loadProfile();
    }
  }, [user]);

  function setField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleRutBlur() {
    if (form.rut && !rutLocked) {
      setField("rut", formatRut(form.rut));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validaciones
    if (!form.first_name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!form.last_name.trim()) {
      setError("El apellido es obligatorio");
      return;
    }
    if (!form.phone.trim()) {
      setError("El teléfono es obligatorio");
      return;
    }
    if (!form.talla_polera) {
      setError("La talla de polera es obligatoria");
      return;
    }
    if (!form.restricciones_alimentarias.trim()) {
      setError("Debes indicar tus restricciones alimentarias (o 'Ninguna')");
      return;
    }
    
    // Validar RUT si se proporciona
    if (form.rut && !rutLocked && !isValidRutFormat(form.rut)) {
      setError("El formato del RUT no es válido");
      return;
    }

    setSaving(true);

    try {
      const supabase = createSupabaseBrowser();
      
      const updates: Record<string, string | null> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim() || null,
        birthdate: form.birthdate || null,
        direccion: form.direccion.trim() || null,
        comuna: form.comuna.trim() || null,
        instagram: form.instagram.trim() || null,
        talla_polera: form.talla_polera || null,
        talla_pantalon: form.talla_pantalon || null,
        restricciones_alimentarias: form.restricciones_alimentarias.trim() || null,
      };

      // Solo incluir RUT si no estaba bloqueado
      if (!rutLocked && form.rut) {
        updates.rut = form.rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
      }

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("id", user?.id);

      if (updateError) {
        throw updateError;
      }

      // Si se guardó RUT, bloquearlo
      if (!rutLocked && form.rut) {
        setRutLocked(true);
      }

      // Refrescar sesión
      await refresh();

      // Si hay returnTo, redirigir
      if (returnTo) {
        router.push(returnTo);
      } else {
        setSuccess("Perfil actualizado correctamente");
      }
    } catch (err) {
      console.error("[editar-perfil] Error guardando:", err);
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  // Loading
  if (sessionLoading || loadingProfile) {
    return (
      <main className="container">
        <div className="max-w-2xl mx-auto mt-12 px-4">
          <div className="card text-center py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-48 mx-auto mb-4" />
              <div className="h-4 bg-slate-200 rounded w-32 mx-auto" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Sin sesión
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/mi-cuenta/login?next=/mi-cuenta/perfil/editar";
    }
    return null;
  }

  return (
    <main className="bg-slate-50 min-h-screen">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <BackButton fallback="/mi-cuenta" />
        
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-2xl font-semibold text-slate-900">
              Editar mi perfil
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Completa todos los campos requeridos para poder postular a operativos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Datos personales */}
            <section>
              <h2 className="text-lg font-medium text-slate-900 mb-4">Datos personales</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => setField("first_name", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => setField("last_name", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    RUT <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.rut}
                    onChange={(e) => setField("rut", e.target.value)}
                    onBlur={handleRutBlur}
                    placeholder="12.345.678-9"
                    disabled={rutLocked}
                    className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      rutLocked ? "bg-slate-100 cursor-not-allowed" : ""
                    }`}
                  />
                  {rutLocked && (
                    <p className="text-xs text-slate-500 mt-1">
                      El RUT no puede modificarse una vez guardado.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    value={form.birthdate}
                    onChange={(e) => setField("birthdate", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={form.instagram}
                    onChange={(e) => setField("instagram", e.target.value)}
                    placeholder="@usuario"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Dirección */}
            <section>
              <h2 className="text-lg font-medium text-slate-900 mb-4">Ubicación</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={form.direccion}
                    onChange={(e) => setField("direccion", e.target.value)}
                    placeholder="Calle, número, depto..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Comuna
                  </label>
                  <input
                    type="text"
                    value={form.comuna}
                    onChange={(e) => setField("comuna", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </section>

            {/* Logística */}
            <section>
              <h2 className="text-lg font-medium text-slate-900 mb-4">Datos para logística</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Talla de polera <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.talla_polera}
                    onChange={(e) => setField("talla_polera", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecciona una talla</option>
                    {TALLAS_POLERA.map((talla) => (
                      <option key={talla} value={talla}>
                        {talla}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Talla de pantalón
                  </label>
                  <select
                    value={form.talla_pantalon}
                    onChange={(e) => setField("talla_pantalon", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecciona una talla</option>
                    {TALLAS_PANTALON.map((talla) => (
                      <option key={talla} value={talla}>
                        {talla}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Restricciones alimentarias <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.restricciones_alimentarias}
                    onChange={(e) => setField("restricciones_alimentarias", e.target.value)}
                    placeholder="Ej: Vegetariano, sin gluten, alergia a mariscos, o 'Ninguna'"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Si no tienes restricciones, escribe &quot;Ninguna&quot;
                  </p>
                </div>
              </div>
            </section>

            {/* Botones */}
            <div className="flex gap-4 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 btn-outline"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 btn-primary justify-center disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function EditarPerfilPage() {
  return (
    <Suspense fallback={
      <main className="container">
        <div className="max-w-2xl mx-auto mt-12 px-4">
          <div className="card text-center py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-48 mx-auto mb-4" />
              <div className="h-4 bg-slate-200 rounded w-32 mx-auto" />
            </div>
          </div>
        </div>
      </main>
    }>
      <EditarPerfilContent />
    </Suspense>
  );
}
