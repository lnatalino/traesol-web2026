// src/app/mi-cuenta/registro/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatRut, isValidRutFormat, isAdult } from "@/lib/userAuth";
import BackButton from "@/components/BackButton";

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthdate: "",
    rut: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [underageMessage, setUnderageMessage] = useState(false);

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleBirthdateChange(value: string) {
    setField("birthdate", value);
    
    if (value && !isAdult(value)) {
      setUnderageMessage(true);
    } else {
      setUnderageMessage(false);
    }
  }

  function handleRutBlur() {
    if (form.rut) {
      setField("rut", formatRut(form.rut));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // Validaciones
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!form.birthdate) {
      setError("La fecha de nacimiento es requerida");
      return;
    }

    if (!isAdult(form.birthdate)) {
      setError("Debes ser mayor de 18 años para registrarte");
      return;
    }

    if (form.rut && !isValidRutFormat(form.rut)) {
      setError("El formato del RUT no es válido");
      return;
    }

    setLoading(true);

    // Usar endpoint de servidor para registro (evita email automático de Supabase)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          birthdate: form.birthdate,
          rut: form.rut || undefined,
          phone: form.phone || undefined,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || "Error al registrar");
        setLoading(false);
        return;
      }

      // Redirigir a página de verificación (el OTP ya fue enviado por el servidor)
      router.push(`/mi-cuenta/verificar?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      console.error("[registro] Error:", err);
      setError("Error de conexión. Intenta nuevamente.");
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <BackButton fallback="/mi-cuenta/login" />

      <div className="max-w-lg mx-auto mt-8">
        <div className="card">
          <h1 className="title mb-2">Crear cuenta</h1>
          <p className="subtitle mb-6">
            Regístrate para acceder a tu perfil de voluntario
          </p>

          {error && <div className="alert error mb-4">{error}</div>}

          {underageMessage && (
            <div className="alert warning mb-4">
              <strong>Aviso:</strong> Para voluntarios menores de edad, escribe a{" "}
              <a
                href="mailto:contacto@fundaciontraesol.cl"
                className="underline font-medium"
              >
                contacto@fundaciontraesol.cl
              </a>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1">Nombre *</label>
                <input
                  type="text"
                  className="inp"
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  placeholder="Juan"
                  required
                />
              </div>
              <div>
                <label className="label mb-1">Apellido *</label>
                <input
                  type="text"
                  className="inp"
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1">Fecha de nacimiento *</label>
                <input
                  type="date"
                  className="inp"
                  value={form.birthdate}
                  onChange={(e) => handleBirthdateChange(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label mb-1">RUT (opcional)</label>
                <input
                  type="text"
                  className="inp"
                  value={form.rut}
                  onChange={(e) => setField("rut", e.target.value)}
                  onBlur={handleRutBlur}
                  placeholder="12.345.678-9"
                />
              </div>
            </div>

            <div>
              <label className="label mb-1">Teléfono (opcional)</label>
              <input
                type="tel"
                className="inp"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div>
              <label className="label mb-1">Email *</label>
              <input
                type="email"
                className="inp"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1">Contraseña *</label>
                <input
                  type="password"
                  className="inp"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="label mb-1">Repetir contraseña *</label>
                <input
                  type="password"
                  className="inp"
                  value={form.confirmPassword}
                  onChange={(e) => setField("confirmPassword", e.target.value)}
                  placeholder="Repite tu contraseña"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full justify-center mt-2"
              disabled={loading || underageMessage}
            >
              {loading ? "Registrando..." : "Crear cuenta"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t text-center text-sm text-slate-600">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/mi-cuenta/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
