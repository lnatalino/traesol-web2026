// src/app/api/auth/otp/verify/route.ts
// Verifica un código OTP, marca al usuario como verificado, y retorna info para login

import { NextResponse } from "next/server";
import { verifyOtp, type OtpPurpose } from "@/lib/otpService";
import { createSupabaseServiceRole } from "@/lib/supabaseRoute";
import { getEffectiveRole } from "@/lib/adminAuth";

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

    const supabase = createSupabaseServiceRole();
    let userId: string | null = null;
    let userRole: string = "volunteer";

    // Buscar usuario por email
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const user = authUsers?.users?.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (user) {
      userId = user.id;
      
      // Si es verificación de email, marcar perfil como verificado
      if (purpose === "verify_email") {
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ verified: true } as never)
          .eq("id", user.id);

        if (updateError) {
          console.error("[otp/verify] Error updating verified status:", updateError);
        } else {
          console.log(`[otp/verify] Usuario ${email} marcado como verificado`);
        }
      }

      // Obtener rol del usuario
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData?.role) {
        userRole = roleData.role;
      }

      // Calcular rol efectivo (considera SUPERADMIN_EMAILS)
      userRole = getEffectiveRole(userRole, email);
    }

    // Crear respuesta con cookie de rol
    const response = NextResponse.json({
      success: true,
      message: purpose === "verify_email" 
        ? "Email verificado correctamente" 
        : "Código válido",
      userId,
      role: userRole,
      // Indicar a dónde redirigir
      redirectTo: userRole === "admin" || userRole === "superadmin" ? "/admin" : "/mi-cuenta",
    });

    // Establecer cookie de rol para el middleware (permite acceso a /admin)
    response.cookies.set("traesol-role", userRole, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 horas
    });

    return response;
  } catch (err) {
    console.error("[otp/verify] Error:", err);
    return NextResponse.json(
      { success: false, error: "Error inesperado" },
      { status: 500 }
    );
  }
}
