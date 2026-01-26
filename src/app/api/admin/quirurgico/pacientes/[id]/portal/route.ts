import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { ensureSurgicalPortalToken } from "@/lib/quirurgicoServer";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function resolvePortalBaseUrl() {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl";
  if (envBase && envBase.trim()) {
    return envBase;
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) {
    return null;
  }
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}

export async function POST(req: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  const resolvedParams = await params;
  const patientId = resolvedParams?.id;
  if (!patientId) {
    return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  }

  try {
    const baseUrl = await resolvePortalBaseUrl();
    const { url, token } = await ensureSurgicalPortalToken(patientId, { baseUrl });
    console.log("[quirurgico portal] url generada:", url);
    return NextResponse.json({ ok: true, url, token });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pudimos generar el portal.";
    console.error("[quirurgico] portal action", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
