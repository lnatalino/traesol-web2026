import { AdminNav } from "./AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-white">
      <aside className="border-b border-white/60 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <AdminNav />
        </div>
      </aside>
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-12">{children}</main>
    </div>
  );
}
