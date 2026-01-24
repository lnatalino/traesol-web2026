// src/app/api/admin/quirurgico/pacientes-v2/[id]/portal-token/route.ts
// Gestión de token de portal para un paciente

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import {
  createPortalToken,
  revokePortalToken,
  getPortalTokenInfo,
  getPaciente,
} from "@/lib/quirurgico";

type RouteParams = { params: Promise<{ id: string }> };

// GET - Obtener info del token actual
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const tokenInfo = await getPortalTokenInfo(id);

    return NextResponse.json({ token_info: tokenInfo });
  } catch (error) {
    console.error("[api/admin/pacientes/[id]/portal-token] get error:", error);
    return NextResponse.json(
      { error: "Error al obtener info del token" },
      { status: 500 }
    );
  }
}

// POST - Crear o regenerar token
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    
    // Verificar que el paciente existe
    const paciente = await getPaciente(id);
    if (!paciente) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const { token, url, expiresAt } = await createPortalToken(
      id,
      session.email || "admin"
    );

    return NextResponse.json({
      success: true,
      portal_url: url,
      expires_at: expiresAt.toISOString(),
      // No devolver el token en plano en producción, solo la URL
    });
  } catch (error) {
    console.error("[api/admin/pacientes/[id]/portal-token] create error:", error);
    return NextResponse.json(
      { error: "Error al crear token de acceso" },
      { status: 500 }
    );
  }
}

// DELETE - Revocar token
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    await revokePortalToken(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/pacientes/[id]/portal-token] revoke error:", error);
    return NextResponse.json(
      { error: "Error al revocar token" },
      { status: 500 }
    );
  }
}
