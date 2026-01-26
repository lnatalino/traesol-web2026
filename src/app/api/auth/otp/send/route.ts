// src/app/api/auth/otp/send/route.ts
// Genera y envía un código OTP de 6 dígitos al email

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { generateOtp, checkOtpRateLimit, type OtpPurpose } from "@/lib/otpService";
import { VerificationCodeEmail } from "@/emails/VerificationCodeEmail";
import * as React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM || "Fundación Traesol <notificaciones@mail.traesol.cl>";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, purpose = "verify_email", userId, skipRateLimit = false } = body as {
      email: string;
      purpose?: OtpPurpose;
      userId?: string;
      skipRateLimit?: boolean;
    };

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email requerido" },
        { status: 400 }
      );
    }

    // Validar propósito
    if (purpose !== "verify_email" && purpose !== "reset_password") {
      return NextResponse.json(
        { success: false, error: "Propósito inválido" },
        { status: 400 }
      );
    }

    // Verificar rate limit primero (antes de generar OTP)
    if (!skipRateLimit) {
      const rateLimitError = await checkOtpRateLimit(email, purpose);
      if (rateLimitError) {
        return NextResponse.json(
          { success: false, error: rateLimitError, rateLimited: true },
          { status: 429 }
        );
      }
    }

    // Generar OTP (con skipRateLimit=true porque ya verificamos arriba)
    const otpResult = await generateOtp(email, purpose, userId, true);

    if (!otpResult.success || !otpResult.code) {
      return NextResponse.json(
        { success: false, error: otpResult.error || "Error al generar código" },
        { status: 500 }
      );
    }

    // Enviar email con Resend
    const subject = purpose === "verify_email"
      ? "Código de verificación - Fundación Traesol"
      : "Código de recuperación - Fundación Traesol";

    const { data, error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      react: React.createElement(VerificationCodeEmail, {
        code: otpResult.code,
        expiryMinutes: 15,
        purpose,
      }),
    });

    if (emailError) {
      console.error("[otp/send] Resend error:", emailError);
      return NextResponse.json(
        { success: false, error: "Error al enviar email" },
        { status: 500 }
      );
    }

    console.log(`[otp/send] OTP enviado a ${email} (${purpose}) - Resend ID: ${data?.id}`);

    return NextResponse.json({
      success: true,
      message: "Código enviado",
    });
  } catch (err) {
    console.error("[otp/send] Error:", err);
    return NextResponse.json(
      { success: false, error: "Error inesperado" },
      { status: 500 }
    );
  }
}
