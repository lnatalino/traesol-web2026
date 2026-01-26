// src/app/api/auth/register/route.ts
// Registro de usuarios SIN email automático de Supabase
// Usamos admin.createUser para tener control total

import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";
import { generateOtp } from "@/lib/otpService";
import { Resend } from "resend";
import { VerificationCodeEmail } from "@/emails/VerificationCodeEmail";
import * as React from "react";

// Validar que RESEND_API_KEY esté configurado
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM || "Fundación Traesol <noreply@fundaciontraesol.cl>";

interface RegisterBody {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthdate: string;
  rut?: string;
  phone?: string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RegisterBody;
    const { email, password, firstName, lastName, birthdate, rut, phone } = body;

    // Validaciones básicas
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const { data: existingUsers } = await supabaseService.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(u => u.email === email.toLowerCase());
    
    if (userExists) {
      return NextResponse.json(
        { success: false, error: "Este email ya está registrado" },
        { status: 400 }
      );
    }

    // Crear usuario con admin API (NO envía email de confirmación)
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true, // Marcamos como confirmado en Supabase (nosotros manejamos verificación)
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError) {
      console.error("[register] auth.admin.createUser error:", authError);
      return NextResponse.json(
        { success: false, error: "Error al crear cuenta" },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: "No se pudo crear el usuario" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Crear perfil en user_profiles (verified=false, requiere OTP)
    // Usamos cast temporal por tipos no generados
    const { error: profileError } = await supabaseService
      .from("user_profiles")
      .upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        birthdate: birthdate || null,
        rut: rut || null,
        phone: phone || null,
        verified: false, // NO verificado hasta que ingrese el código OTP
      } as never);

    if (profileError) {
      console.error("[register] Error creando perfil:", profileError);
      // Continuar, el usuario ya se creó
    }

    // Crear rol por defecto (volunteer)
    const { error: roleError } = await supabaseService
      .from("user_roles")
      .upsert({
        user_id: userId,
        role: "volunteer",
      } as never);

    if (roleError) {
      console.error("[register] Error creando rol:", roleError);
    }

    // Generar y enviar código OTP
    const otpResult = await generateOtp(email.toLowerCase(), "verify_email", userId);

    if (!otpResult.success || !otpResult.code) {
      console.error("[register] Error generando OTP:", otpResult.error);
      // No fallar el registro, el usuario puede pedir reenvío
    } else if (!resend) {
      console.error("[register] RESEND_API_KEY no configurado, no se puede enviar OTP");
    } else {
      // Enviar email con el código
      try {
        console.log(`[register] Enviando OTP a ${email}...`);
        const { data, error: emailError } = await resend.emails.send({
          from: FROM_EMAIL,
          to: email.toLowerCase(),
          subject: "Código de verificación - Fundación Traesol",
          react: React.createElement(VerificationCodeEmail, {
            code: otpResult.code,
            expiryMinutes: 15,
            purpose: "verify_email",
          }),
        });

        if (emailError) {
          console.error("[register] Error enviando email:", JSON.stringify(emailError, null, 2));
        } else {
          console.log(`[register] ✓ OTP enviado a ${email} - Resend ID: ${data?.id}`);
        }
      } catch (emailErr) {
        console.error("[register] Error enviando email:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      message: "Cuenta creada. Revisa tu correo para el código de verificación.",
    });
  } catch (err) {
    console.error("[register] Error inesperado:", err);
    return NextResponse.json(
      { success: false, error: "Error inesperado" },
      { status: 500 }
    );
  }
}
