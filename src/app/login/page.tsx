// src/app/login/page.tsx
export const metadata = { title: "Acceso · Traesol" };

type LoginSearchParams = { next?: string; error?: string };

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: LoginSearchParams | Promise<LoginSearchParams>;
}) {
  const resolved = await Promise.resolve(searchParams ?? {});
  const next = resolved.next || "/admin";
  const error = resolved.error || "";

  const msg =
    error === "invalid"
      ? "Usuario o contraseña incorrectos."
      : error === "missing"
        ? "Ingresa usuario y contraseña."
        : error === "unknown"
          ? "Ocurrió un error. Intenta nuevamente."
          : "";

  return (
    <div className="max-w-md mx-auto py-16">
      <h1 className="text-2xl font-semibold mb-4">Acceso administrativo</h1>
      {msg && <p className="mb-3 text-red-600">{msg}</p>}

      <form action="/api/auth/simple-login" method="POST" className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div className="space-y-1">
          <label className="block text-sm font-medium">Usuario (email)</label>
          <input name="email" type="text" required className="inp w-full" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium">Contraseña</label>
          <input name="password" type="password" required className="inp w-full" />
        </div>
        <button className="btn-primary" type="submit">Ingresar</button>
      </form>
      <p className="mt-4 text-sm text-slate-500">¿Olvidaste tu contraseña? Contáctanos.</p>
    </div>
  );
}
