// src/app/mi-cuenta/loading.tsx
// Loading skeleton para rutas de Mi Cuenta
export default function MiCuentaLoading() {
  return (
    <main className="container">
      <div className="max-w-4xl mx-auto mt-8 px-4">
        <div className="card">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 bg-slate-200 rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="h-6 bg-slate-200 rounded w-40 mb-2 animate-pulse" />
              <div className="h-4 bg-slate-200 rounded w-56 animate-pulse" />
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-4">
            <div className="h-4 bg-slate-200 rounded w-full animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
          </div>
          
          {/* Cards skeleton */}
          <div className="grid gap-4 mt-8">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 border border-slate-200 rounded-lg">
                <div className="h-5 bg-slate-200 rounded w-32 mb-2 animate-pulse" />
                <div className="h-4 bg-slate-200 rounded w-48 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
