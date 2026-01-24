import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ribbon } from "lucide-react";
import { getAdminSession } from "@/lib/adminSession";
import { LanyardTypesClient } from "./LanyardTypesClient";

export const dynamic = "force-dynamic";

export default async function LanyardTypesPage() {
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/inventario/lanyard-types");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/inventario"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Ribbon className="h-4 w-4" />
            <span>Inventario</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Tipos de lanyard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Define los colores de cinta según el tema del operativo (tipo de cáncer, etc.)
          </p>
        </div>
      </div>

      {/* Client component */}
      <LanyardTypesClient />
    </div>
  );
}
