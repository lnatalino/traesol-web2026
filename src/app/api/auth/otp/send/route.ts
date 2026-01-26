// src/app/api/auth/otp/send/route.ts
// Genera y envía un código OTP de 6 dígitos al email

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { generateOtp, checkOtpRateLimit, type OtpPurpose } from "@/lib/otpService";
import { VerificationCodeEmail } from "@/emails/VerificationCodeEmail";
import * as React from "react";

// Validar que RESEND_API_KEY esté configurado
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM || "Fundación Traesol <noreply@fundaciontraesol.cl>";

export async function POST(req: Request) {
  try {
    // Validar configuración de Resend PRIMERO
    if (!resend || !RESEND_API_KEY) {
      console.error("[otp/send] RESEND_API_KEY no está configurado en las variables de entorno");
      return NextResponse.json(
        { success: false, error: "Servicio de email no configurado. Contacta al administrador." },
        { status: 503 }
      );
    }

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

    console.log(`[otp/send] Solicitud para ${email} (${purpose})`);

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
        console.log(`[otp/send] Rate limit alcanzado para ${email}`);
        return NextResponse.json(
          { success: false, error: rateLimitError, rateLimited: true },
          { status: 429 }
        );
      }
    }

    // Generar OTP (con skipRateLimit=true porque ya verificamos arriba)
    const otpResult = await generateOtp(email, purpose, userId, true);

    if (!otpResult.success || !otpResult.code) {
      console.error(`[otp/send] Error generando OTP para ${email}:`, otpResult.error);
      return NextResponse.json(
        { success: false, error: otpResult.error || "Error al generar código" },
        { status: 500 }
      );
    }

    console.log(`[otp/send] OTP generado para ${email}, enviando email...`);

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
      console.error("[otp/send] Resend error:", JSON.stringify(emailError, null, 2));
      console.error("[otp/send] FROM_EMAIL usado:", FROM_EMAIL);
      return NextResponse.json(
        { success: false, error: `Error al enviar email: ${emailError.message || "Error desconocido"}` },
        { status: 500 }
      );
    }

    console.log(`[otp/send] ✓ OTP enviado exitosamente a ${email} - Resend ID: ${data?.id}`);

    return NextResponse.json({
      success: true,
      message: "Código enviado",
    });
  } catch (err) {
    console.error("[otp/send] Error inesperado:", err);
    return NextResponse.json(
      { success: false, error: "Error inesperado al enviar código" },
      { status: 500 }
    );
  }
}
