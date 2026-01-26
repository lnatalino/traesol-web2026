// src/app/api/admin/users/[id]/resend-otp/route.ts
// Reenvía OTP para que un admin pueda establecer su contraseña

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { generateOtp } from "@/lib/otpService";
import { Resend } from "resend";
import { VerificationCodeEmail } from "@/emails/VerificationCodeEmail";
import * as React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM || "Fundación Traesol <noreply@fundaciontraesol.cl>";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: RouteParams) {
  const session = await getAdminSession();

  // Solo superadmin puede reenviar OTP a admins
  if (!session.allowed || !session.isSuperAdmin) {
    return NextResponse.json(
      { success: false, error: "No autorizado" },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    // Obtener email del usuario
    const { data: authData, error: authError } = await supabaseService.auth.admin.getUserById(id);

    if (authError || !authData.user?.email) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const email = authData.user.email;

    // Generar nuevo OTP
    const otpResult = await generateOtp(email, "reset_password", id);

    if (!otpResult.success || !otpResult.code) {
      return NextResponse.json(
        { success: false, error: "Error al generar código" },
        { status: 500 }
      );
    }

    // Enviar email
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Código para establecer contraseña - Fundación Traesol",
      react: React.createElement(VerificationCodeEmail, {
        code: otpResult.code,
        expiryMinutes: 15,
        purpose: "reset_password",
      }),
    });

    if (emailError) {
      console.error("[resend-otp] Error enviando email:", emailError);
      return NextResponse.json(
        { success: false, error: "Error al enviar email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Código enviado a ${email}`,
    });
  } catch (err) {
    console.error("[resend-otp] Error:", err);
    return NextResponse.json(
      { success: false, error: "Error inesperado" },
      { status: 500 }
    );
  }
}
