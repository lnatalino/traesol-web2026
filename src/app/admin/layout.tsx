import { AdminNav } from "./AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <AdminNav />
        </div>
      </aside>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
