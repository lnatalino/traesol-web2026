// src/components/forms/ProfileForm.tsx
// Formulario de perfil reutilizable para voluntarios y staff
// Se usa en: Mi cuenta/Perfil, Confirmar datos antes de postular, Admin
"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import {
  PROFESIONES,
  TALLAS_POLERA,
  TALLAS_PANTALON,
  GENEROS,
  formatRut,
  validateProfileForApplication,
  type ProfileFormData,
} from "@/lib/schemas/profile";

interface ProfileFormProps {
  userId: string;
  userEmail: string;
  /** Modo: edit = edición normal, apply = confirmación para postular, staff = perfil staff */
  mode: "edit" | "apply" | "staff";
  /** Callback al guardar exitosamente */
  onSave?: (data: ProfileFormData) => void;
  /** Callback al cancelar */
  onCancel?: () => void;
  /** Si true, muestra botón de enviar postulación en vez de guardar */
  showSubmitApplication?: boolean;
  /** Texto del botón principal */
  submitLabel?: string;
  /** Si true, valida campos obligatorios antes de permitir guardar */
  requireComplete?: boolean;
  /** Compact mode para modal */
  compact?: boolean;
}

export default function ProfileForm({
  userId,
  userEmail,
  mode,
  onSave,
  onCancel,
  submitLabel = "Guardar cambios",
  requireComplete = false,
  compact = false,
}: ProfileFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rutLocked, setRutLocked] = useState(false);

  // Form state
  const [form, setForm] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    rut: "",
    extranjero: false,
    id_nacional: "",
    pasaporte: "",
    nacionalidad: "",
    genero: null,
    birthdate: "",
    phone: "",
    direccion: "",
    comuna: "",
    instagram: "",
    profesion: "",
    profesion_otro: "",
    especialidad: "",
    talla_polera: null,
    talla_pantalon: null,
    restricciones_alimentarias: "",
    alimentarias_veg: false,
    nombre_credencial: "",
    disponibilidad_anual: "",
    motivacion: "",
    cargo_interno: "",
    profile_type: mode === "staff" ? "staff" : "volunteer",
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Cargar perfil existente
  useEffect(() => {
    async function loadProfile() {
      if (!userId) return;
      
      setLoading(true);
      try {
        const supabase = createSupabaseBrowser();
        const { data, error: fetchError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", userId)
          .single();
        
        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("[ProfileForm] Error loading profile:", fetchError);
        }
        
        if (data) {
          setForm({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            rut: data.rut ? formatRut(data.rut) : "",
            extranjero: data.extranjero || false,
            id_nacional: data.id_nacional || "",
            pasaporte: data.pasaporte || "",
            nacionalidad: data.nacionalidad || "",
            genero: data.genero || null,
            birthdate: data.birthdate || "",
            phone: data.phone || "",
            direccion: data.direccion || "",
            comuna: data.comuna || "",
            instagram: data.instagram || "",
            profesion: data.profesion || "",
            profesion_otro: data.profesion_otro || "",
            especialidad: data.especialidad || "",
            talla_polera: data.talla_polera || null,
            talla_pantalon: data.talla_pantalon || null,
            restricciones_alimentarias: data.restricciones_alimentarias || "",
            alimentarias_veg: data.alimentarias_veg || false,
            nombre_credencial: data.nombre_credencial || "",
            disponibilidad_anual: data.disponibilidad_anual || "",
            motivacion: data.motivacion || "",
            cargo_interno: data.cargo_interno || "",
            profile_type: data.profile_type || "volunteer",
          });
          setRutLocked(!!data.rut);
        }
      } catch (err) {
        console.error("[ProfileForm] Error:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [userId]);

  const setField = useCallback(<K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Limpiar error de ese campo
    if (validationErrors[key]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, [validationErrors]);

  const handleRutBlur = useCallback(() => {
    if (form.rut && !rutLocked) {
      setField("rut", formatRut(form.rut));
    }
  }, [form.rut, rutLocked, setField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setValidationErrors({});

    // Validar si es requerido
    if (requireComplete || mode === "apply") {
      const validation = validateProfileForApplication(form, mode === "staff");
      if (!validation.isComplete) {
        setValidationErrors(validation.errors);
        setError(`Faltan campos obligatorios: ${validation.missingFields.join(", ")}`);
        return;
      }
    }

    // Validaciones básicas
    if (!form.first_name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!form.last_name.trim()) {
      setError("El apellido es obligatorio");
      return;
    }

    setSaving(true);

    try {
      const supabase = createSupabaseBrowser();
      
      // Preparar datos para guardar
      const updates: Record<string, unknown> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        nacionalidad: form.nacionalidad?.trim() || null,
        genero: form.genero || null,
        birthdate: form.birthdate || null,
        extranjero: form.extranjero,
        id_nacional: form.extranjero ? form.id_nacional?.trim() || null : null,
        pasaporte: form.pasaporte?.trim() || null,
        phone: form.phone?.trim() || null,
        direccion: form.direccion?.trim() || null,
        comuna: form.comuna?.trim() || null,
        instagram: form.instagram?.trim() || null,
        profesion: form.profesion || null,
        profesion_otro: form.profesion === "Otro" ? form.profesion_otro?.trim() || null : null,
        especialidad: form.especialidad?.trim() || null,
        talla_polera: form.talla_polera || null,
        talla_pantalon: form.talla_pantalon || null,
        restricciones_alimentarias: form.restricciones_alimentarias?.trim() || null,
        alimentarias_veg: form.alimentarias_veg,
        nombre_credencial: form.nombre_credencial?.trim() || null,
        profile_type: mode === "staff" ? "staff" : "volunteer",
      };

      // RUT solo si no está bloqueado
      if (!rutLocked && form.rut && !form.extranjero) {
        updates.rut = form.rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
      }

      // Campos específicos de voluntario
      if (mode !== "staff") {
        updates.disponibilidad_anual = form.disponibilidad_anual?.trim() || null;
        updates.motivacion = form.motivacion?.trim() || null;
      }

      // Campos específicos de staff
      if (mode === "staff") {
        updates.cargo_interno = form.cargo_interno?.trim() || null;
      }

      // Upsert en user_profiles
      const { error: upsertError } = await supabase
        .from("user_profiles")
        .upsert({ id: userId, ...updates }, { onConflict: "id" });

      if (upsertError) {
        throw upsertError;
      }

      // Bloquear RUT si se guardó
      if (!rutLocked && form.rut && !form.extranjero) {
        setRutLocked(true);
      }

      setSuccess("Perfil guardado correctamente");
      
      if (onSave) {
        onSave(form);
      }
    } catch (err) {
      console.error("[ProfileForm] Save error:", err);
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // Generar nombre para credencial
  const generateCredencialName = useCallback(() => {
    const firstName = form.first_name.split(" ")[0] || "";
    const lastName = form.last_name.split(" ")[0] || "";
    setField("nombre_credencial", `${firstName} ${lastName}`.trim());
  }, [form.first_name, form.last_name, setField]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const sectionClass = compact
    ? "space-y-3"
    : "space-y-4 rounded-2xl border border-slate-200 bg-white p-5";
  
  const headingClass = compact
    ? "text-base font-semibold text-slate-900 pb-2 border-b border-slate-100"
    : "text-lg font-semibold text-slate-900";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Sección: Datos personales */}
      <section className={sectionClass}>
        <h3 className={headingClass}>Datos personales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Nombre"
            value={form.first_name}
            onChange={(v) => setField("first_name", v)}
            required
            error={validationErrors.first_name}
          />
          <InputField
            label="Apellido"
            value={form.last_name}
            onChange={(v) => setField("last_name", v)}
            required
            error={validationErrors.last_name}
          />
          
          {/* RUT o Extranjero */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 mb-2">
              <input
                type="checkbox"
                checked={form.extranjero}
                onChange={(e) => setField("extranjero", e.target.checked)}
                className="rounded border-slate-300"
                disabled={rutLocked}
              />
              Soy extranjero/a (sin RUT chileno)
            </label>
          </div>
          
          {!form.extranjero ? (
            <InputField
              label="RUT"
              value={form.rut || ""}
              onChange={(v) => setField("rut", v)}
              onBlur={handleRutBlur}
              placeholder="12.345.678-9"
              disabled={rutLocked}
              required={mode === "apply"}
              error={validationErrors.rut}
              helperText={rutLocked ? "El RUT no puede modificarse una vez guardado" : undefined}
            />
          ) : (
            <InputField
              label="ID Nacional"
              value={form.id_nacional || ""}
              onChange={(v) => setField("id_nacional", v)}
              placeholder="Número de identificación"
              required={mode === "apply"}
              error={validationErrors.id_nacional}
            />
          )}
          
          <InputField
            label="Pasaporte"
            value={form.pasaporte || ""}
            onChange={(v) => setField("pasaporte", v)}
            placeholder="Opcional"
          />
          
          <SelectField
            label="Género"
            value={form.genero || ""}
            onChange={(v) => setField("genero", v as ProfileFormData["genero"])}
            options={[
              { value: "", label: "Seleccionar..." },
              ...GENEROS.map((g) => ({ value: g, label: g })),
            ]}
          />
          
          <InputField
            label="Nacionalidad"
            value={form.nacionalidad || ""}
            onChange={(v) => setField("nacionalidad", v)}
            placeholder="Ej: Chilena"
          />
          
          <InputField
            label="Fecha de nacimiento"
            type="date"
            value={form.birthdate || ""}
            onChange={(v) => setField("birthdate", v)}
          />
        </div>
      </section>

      {/* Sección: Contacto */}
      <section className={sectionClass}>
        <h3 className={headingClass}>Contacto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Email"
            value={userEmail}
            disabled
            helperText="No editable (vinculado a tu cuenta)"
          />
          <InputField
            label="Teléfono"
            value={form.phone || ""}
            onChange={(v) => setField("phone", v)}
            placeholder="+56 9 1234 5678"
            required={mode === "apply" || mode === "staff"}
            error={validationErrors.phone}
          />
          <InputField
            label="Dirección"
            value={form.direccion || ""}
            onChange={(v) => setField("direccion", v)}
            placeholder="Calle, número, depto..."
            className="md:col-span-2"
          />
          <InputField
            label="Comuna"
            value={form.comuna || ""}
            onChange={(v) => setField("comuna", v)}
          />
          <InputField
            label="Instagram"
            value={form.instagram || ""}
            onChange={(v) => setField("instagram", v)}
            placeholder="@usuario"
          />
        </div>
      </section>

      {/* Sección: Profesión */}
      <section className={sectionClass}>
        <h3 className={headingClass}>Formación</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Profesión"
            value={form.profesion || ""}
            onChange={(v) => setField("profesion", v)}
            options={[
              { value: "", label: "Seleccionar..." },
              ...PROFESIONES.map((p) => ({ value: p, label: p })),
            ]}
          />
          {form.profesion === "Otro" && (
            <InputField
              label="Especificar profesión"
              value={form.profesion_otro || ""}
              onChange={(v) => setField("profesion_otro", v)}
              placeholder="Describe tu profesión"
            />
          )}
          <InputField
            label="Especialidad"
            value={form.especialidad || ""}
            onChange={(v) => setField("especialidad", v)}
            placeholder="Si aplica (ej: Cardiología)"
          />
        </div>
      </section>

      {/* Sección: Logística */}
      <section className={sectionClass}>
        <h3 className={headingClass}>Datos para logística</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Talla de polera"
            value={form.talla_polera || ""}
            onChange={(v) => setField("talla_polera", v as ProfileFormData["talla_polera"])}
            options={[
              { value: "", label: "Seleccionar..." },
              ...TALLAS_POLERA.map((t) => ({ value: t, label: t })),
            ]}
            required={mode === "apply" || mode === "staff"}
            error={validationErrors.talla_polera}
          />
          <SelectField
            label="Talla de pantalón"
            value={form.talla_pantalon || ""}
            onChange={(v) => setField("talla_pantalon", v as ProfileFormData["talla_pantalon"])}
            options={[
              { value: "", label: "Seleccionar..." },
              ...TALLAS_PANTALON.map((t) => ({ value: t, label: t })),
            ]}
          />
          <div className="md:col-span-2">
            <InputField
              label="Restricciones alimentarias"
              value={form.restricciones_alimentarias || ""}
              onChange={(v) => setField("restricciones_alimentarias", v)}
              placeholder="Ej: Vegetariano, sin gluten, alergia a mariscos, o 'Ninguna'"
              required={mode === "apply" || mode === "staff"}
              error={validationErrors.restricciones_alimentarias}
              helperText="Si no tienes restricciones, escribe 'Ninguna'"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.alimentarias_veg}
              onChange={(e) => setField("alimentarias_veg", e.target.checked)}
              className="rounded border-slate-300"
            />
            Soy vegetariano/a o vegano/a
          </label>
        </div>
      </section>

      {/* Sección: Credencial */}
      <section className={sectionClass}>
        <h3 className={headingClass}>Credencial</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <InputField
              label="Nombre para credencial"
              value={form.nombre_credencial || ""}
              onChange={(v) => setField("nombre_credencial", v)}
              placeholder="Nombre corto para tu credencial"
              helperText="Máx. 20 caracteres aproximadamente"
            />
            <button
              type="button"
              onClick={generateCredencialName}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Usar nombre y primer apellido
            </button>
          </div>
        </div>
      </section>

      {/* Sección: Voluntario (solo si no es staff) */}
      {mode !== "staff" && (
        <section className={sectionClass}>
          <h3 className={headingClass}>Información adicional</h3>
          <div className="space-y-4">
            <InputField
              label="Disponibilidad anual para voluntariado"
              value={form.disponibilidad_anual || ""}
              onChange={(v) => setField("disponibilidad_anual", v)}
              placeholder="Ej: Fines de semana, vacaciones de invierno y verano"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Motivación
              </label>
              <textarea
                value={form.motivacion || ""}
                onChange={(e) => setField("motivacion", e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="¿Por qué quieres ser voluntario?"
              />
            </div>
          </div>
        </section>
      )}

      {/* Sección: Staff (solo para staff) */}
      {mode === "staff" && (
        <section className={sectionClass}>
          <h3 className={headingClass}>Información de staff</h3>
          <InputField
            label="Cargo interno en Traesol"
            value={form.cargo_interno || ""}
            onChange={(v) => setField("cargo_interno", v)}
            placeholder="Ej: Director médico, Coordinadora logística"
          />
        </section>
      )}

      {/* Botones */}
      <div className="flex gap-4 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 btn-outline"
            disabled={saving}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className={`${onCancel ? "flex-1" : "w-full"} btn-primary justify-center disabled:opacity-50`}
        >
          {saving ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

// =========================================================================
// Componentes auxiliares
// =========================================================================

interface InputFieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
}

function InputField({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  disabled,
  required,
  error,
  helperText,
  className,
}: InputFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled ? "bg-slate-100 cursor-not-allowed" : "border-slate-300"
        } ${error ? "border-red-300 focus:ring-red-500 focus:border-red-500" : ""}`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  error?: string;
}

function SelectField({ label, value, onChange, options, required, error }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? "border-red-300" : "border-slate-300"
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
