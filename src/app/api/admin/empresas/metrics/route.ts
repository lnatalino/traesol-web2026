import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { getEmpresaMetrics, updateEmpresaMetrics } from "@/lib/empresas";

function parseNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function sanitizePayload(payload: Record<string, unknown>) {
  return {
    operativosConEmpresas: parseNumber(payload.operativosConEmpresas, 0),
    colaboradoresMovilizados: parseNumber(payload.colaboradoresMovilizados, 0),
    regionesImpactadas: parseNumber(payload.regionesImpactadas, 0),
  };
}

async function ensureAdmin() {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const unauthorized = await ensureAdmin();
  if (unauthorized) return unauthorized;

  const data = await getEmpresaMetrics();
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const unauthorized = await ensureAdmin();
  if (unauthorized) return unauthorized;

  let raw: Record<string, unknown> = {};
  try {
    raw = await req.json();
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });
  }

  const payload = sanitizePayload(raw);

  try {
    const data = await updateEmpresaMetrics(payload);
    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "No se pudo guardar" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  return POST(req);
}
