// src/app/api/auth/reset-password/route.ts
// Restablece la contraseña de un usuario después de verificar OTP
// NO usa magic links, solo código OTP

import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otpService";
import { createSupabaseServiceRole } from "@/lib/supabaseRoute";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code, newPassword } = body as {
      email: string;
      code: string;
      newPassword: string;
    };

    // Validaciones
    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: "El código debe tener 6 dígitos" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar OTP (propósito: reset_password)
    const otpResult = await verifyOtp(email, code, "reset_password");

    if (!otpResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: otpResult.error,
          expired: otpResult.expired,
          used: otpResult.used,
        },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    const supabase = createSupabaseServiceRole();
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const user = authUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar contraseña usando Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("[reset-password] Error updating password:", updateError);
      return NextResponse.json(
        { success: false, error: "Error al actualizar contraseña" },
        { status: 500 }
      );
    }

    console.log(`[reset-password] Contraseña actualizada para ${email}`);

    return NextResponse.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (err) {
    console.error("[reset-password] Error:", err);
    return NextResponse.json(
      { success: false, error: "Error inesperado" },
      { status: 500 }
    );
  }
}
