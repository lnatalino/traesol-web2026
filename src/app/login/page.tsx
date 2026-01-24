// src/app/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  // Leer parámetros de URL en cliente
  const params = typeof window !== "undefined" 
    ? new URLSearchParams(window.location.search) 
    : new URLSearchParams();
  const next = params.get("next") || "/admin";
  const error = params.get("error") || "";

  const msg =
    error === "invalid"
      ? "Usuario o contraseña incorrectos."
      : error === "missing"
        ? "Ingresa usuario y contraseña."
        : error === "unknown"
          ? "Ocurrió un error. Intenta nuevamente."
          : "";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header con logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Fundación Traesol</h1>
          <p className="text-slate-600 mt-2">Panel de Administración</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Iniciar sesión</h2>
          
          {msg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {msg}
            </div>
          )}

          <form action="/api/auth/simple-login" method="POST" className="space-y-5">
            <input type="hidden" name="next" value={next} />
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Correo electrónico
              </label>
              <input 
                name="email" 
                type="email" 
                autoComplete="email"
                required 
                placeholder="tu@correo.cl"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <div className="relative">
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  autoComplete="current-password"
                  required 
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors inline-flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              Ingresar
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link 
              href="/olvido-contrasena" 
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Este es un sistema cerrado.<br />
          Los usuarios son creados por el administrador.
        </p>
      </div>
    </div>
  );
}
