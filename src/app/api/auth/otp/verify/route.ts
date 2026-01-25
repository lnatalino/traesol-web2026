// src/app/api/auth/otp/verify/route.ts
// Verifica un código OTP y marca al usuario como verificado

import { NextResponse } from "next/server";
import { verifyOtp, type OtpPurpose } from "@/lib/otpService";
import { createSupabaseServiceRole } from "@/lib/supabaseRoute";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code, purpose = "verify_email" } = body as {
      email: string;
      code: string;
      purpose?: OtpPurpose;
    };

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: "Email y código requeridos" },
        { status: 400 }
      );
    }

    // Validar formato del código (6 dígitos)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: "El código debe tener 6 dígitos" },
        { status: 400 }
      );
    }

    // Verificar OTP
    const result = await verifyOtp(email, code, purpose);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          expired: result.expired,
          used: result.used,
        },
        { status: 400 }
      );
    }

    // Si es verificación de email, marcar perfil como verificado
    if (purpose === "verify_email") {
      const supabase = createSupabaseServiceRole();
      
      // Buscar usuario por email
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const user = authUsers?.users?.find(
        u => u.email?.toLowerCase() === email.toLowerCase()
      );

      if (user) {
        // Marcar como verificado en user_profiles
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ verified: true })
          .eq("id", user.id);

        if (updateError) {
          console.error("[otp/verify] Error updating verified status:", updateError);
          // No falla la operación, el OTP ya fue verificado
        } else {
          console.log(`[otp/verify] Usuario ${email} marcado como verificado`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: purpose === "verify_email" 
        ? "Email verificado correctamente" 
        : "Código válido",
    });
  } catch (err) {
    console.error("[otp/verify] Error:", err);
    return NextResponse.json(
      { success: false, error: "Error inesperado" },
      { status: 500 }
    );
  }
}
