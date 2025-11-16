# Migraciones sugeridas para el módulo de inscripciones

Copiar y ejecutar en Supabase (SQL editor) según corresponda:

```sql
-- 1. Columna para registrar el origen de la inscripción.
ALTER TABLE public.inscripciones
ADD COLUMN IF NOT EXISTS origen text;

-- 2. Token único para respuestas (aceptar / rechazar invitaciones).
ALTER TABLE public.inscripciones
ADD COLUMN IF NOT EXISTS token_respuesta uuid;

-- 3. Marca temporal de respuesta (útil para auditoría / futuras métricas).
ALTER TABLE public.inscripciones
ADD COLUMN IF NOT EXISTS respondido_en timestamptz;

-- 4. Valor por defecto del estado en nuevas inscripciones desde formularios.
ALTER TABLE public.inscripciones
ALTER COLUMN estado SET DEFAULT 'postulado';

-- 5. (Opcional) Asegurar unicidad del token cuando exista.
CREATE UNIQUE INDEX IF NOT EXISTS inscripciones_token_respuesta_key
ON public.inscripciones(token_respuesta)
WHERE token_respuesta IS NOT NULL;
```

> Nota: ejecutar los comandos sobre la base de datos `postgres` de Supabase. Ajustar los nombres de tablas/esquemas si difieren del entorno actual.
