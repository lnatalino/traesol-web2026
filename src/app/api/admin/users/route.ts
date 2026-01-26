// src/app/api/admin/users/route.ts
// API unificada para gestión de usuarios (voluntarios + admins)
// Protegida por roles: admin puede ver voluntarios, superadmin puede ver todos

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { generateOtp } from "@/lib/otpService";
import { Resend } from "resend";
import { VerificationCodeEmail } from "@/emails/VerificationCodeEmail";
import * as React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM || "Fundación Traesol <noreply@fundaciontraesol.cl>";

// =========================================================================
// GET - Listar usuarios
// =========================================================================

export async function GET(req: Request) {
  const session = await getAdminSession();

  if (!session.allowed) {
    return NextResponse.json(
      { success: false, error: "No autorizado" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const roleFilter = searchParams.get("role") || undefined;
  const search = searchParams.get("search") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  // Admin normal solo puede ver voluntarios
  // Superadmin puede ver todos
  let effectiveRoleFilter = roleFilter;
  if (!session.isSuperAdmin && (!roleFilter || roleFilter !== "volunteer")) {
    effectiveRoleFilter = "volunteer";
  }

  try {
    // Usar función RPC para obtener usuarios con perfil y rol
    // Si la función RPC no existe, fallback a query manual
    let users;
    let total;

    try {
      const { data: rpcUsers, error: rpcError } = await supabaseService.rpc(
        "get_all_users_for_admin" as never,
        {
          p_role_filter: effectiveRoleFilter || null,
          p_search: search || null,
          p_limit: limit,
          p_offset: offset,
        } as never
      );

      if (rpcError) throw rpcError;

      const { data: countData, error: countError } = await supabaseService.rpc(
        "count_users_for_admin" as never,
        {
          p_role_filter: effectiveRoleFilter || null,
          p_search: search || null,
        } as never
      );

      if (countError) throw countError;

      users = rpcUsers;
      total = countData as number;
    } catch {
      // Fallback: query manual si las funciones RPC no existen
      console.log("[admin/users] RPC no disponible, usando query manual");
      
      const { data: authUsers } = await supabaseService.auth.admin.listUsers({
        page: Math.floor(offset / limit) + 1,
        perPage: limit,
      });

      if (!authUsers?.users) {
        return NextResponse.json({ success: true, users: [], total: 0 });
      }

      // Tipos para tablas sin tipos generados
      type ProfileRow = {
        id: string;
        first_name: string | null;
        last_name: string | null;
        rut: string | null;
        phone: string | null;
        birthdate: string | null;
        verified: boolean;
        enabled: boolean;
      };
      type RoleRow = { user_id: string; role: string };

      // Obtener perfiles
      const userIds = authUsers.users.map(u => u.id);
      const { data: profiles } = await supabaseService
        .from("user_profiles")
        .select("id, first_name, last_name, rut, phone, birthdate, verified, enabled")
        .in("id", userIds) as { data: ProfileRow[] | null };

      // Obtener roles
      const { data: roles } = await supabaseService
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds) as { data: RoleRow[] | null };

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));

      users = authUsers.users
        .map(u => {
          const profile = profileMap.get(u.id);
          const role = roleMap.get(u.id) || "volunteer";
          return {
            id: u.id,
            email: u.email,
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            rut: profile?.rut || null,
            phone: profile?.phone || null,
            birthdate: profile?.birthdate || null,
            role,
            verified: profile?.verified ?? false,
            enabled: profile?.enabled ?? true,
            created_at: u.created_at,
          };
        })
        .filter(u => {
          // Filtrar por rol si se especifica
          if (effectiveRoleFilter && u.role !== effectiveRoleFilter) return false;
          // Filtrar por búsqueda
          if (search) {
            const s = search.toLowerCase();
            return (
              u.email?.toLowerCase().includes(s) ||
              u.first_name?.toLowerCase().includes(s) ||
              u.last_name?.toLowerCase().includes(s) ||
              u.rut?.toLowerCase().includes(s)
            );
          }
          return true;
        });

      total = users.length;
    }

    return NextResponse.json({
      success: true,
      users: users || [],
      total: total || 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error("[admin/users] Error:", err);
    return NextResponse.json(
      { success: false, error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

// =========================================================================
// POST - Crear usuario admin (solo superadmin)
// =========================================================================

export async function POST(req: Request) {
  const session = await getAdminSession();

  // Solo superadmin puede crear administradores
  if (!session.allowed || !session.isSuperAdmin) {
    return NextResponse.json(
      { success: false, error: "Solo superadmin puede crear administradores" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { email, firstName, lastName, rut, role = "admin" } = body;

    // Validaciones
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Email inválido" },
        { status: 400 }
      );
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "Nombre y apellido son requeridos" },
        { status: 400 }
      );
    }

    // REGLA DE NEGOCIO: Solo permitir crear rol "admin"
    // Superadmin solo puede ser creado por script/migración, NUNCA desde UI
    if (role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Solo se pueden crear administradores desde el panel" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verificar que no exista ya
    const { data: existingUsers } = await supabaseService.auth.admin.listUsers();
    const exists = existingUsers?.users?.some(
      u => u.email?.toLowerCase() === normalizedEmail
    );

    if (exists) {
      return NextResponse.json(
        { success: false, error: "Ya existe un usuario con ese email" },
        { status: 409 }
      );
    }

    // Generar contraseña temporal aleatoria (el admin deberá resetearla)
    const tempPassword = crypto.randomUUID().slice(0, 12);

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseService.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true, // Ya confirmado para admins
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (authError || !authData.user) {
      console.error("[admin/users POST] Error creating user:", authError);
      return NextResponse.json(
        { success: false, error: "Error al crear usuario" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Crear perfil (verified=true para admins)
    await supabaseService.from("user_profiles").upsert({
      id: userId,
      first_name: firstName,
      last_name: lastName,
      rut: rut || null,
      verified: true,
      enabled: true,
    } as never);

    // Asignar rol
    await supabaseService.from("user_roles").upsert({
      user_id: userId,
      role,
    } as never);

    // Enviar OTP para que el admin establezca su contraseña
    const otpResult = await generateOtp(normalizedEmail, "reset_password", userId);

    if (otpResult.success && otpResult.code) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: normalizedEmail,
          subject: "Bienvenido al Panel Admin - Fundación Traesol",
          react: React.createElement(VerificationCodeEmail, {
            code: otpResult.code,
            expiryMinutes: 15,
            purpose: "reset_password",
          }),
        });
        console.log(`[admin/users POST] OTP enviado a ${normalizedEmail}`);
      } catch (emailErr) {
        console.error("[admin/users POST] Error enviando email:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Administrador creado. Se envió un código para establecer contraseña.",
      user: {
        id: userId,
        email: normalizedEmail,
        first_name: firstName,
        last_name: lastName,
        role,
      },
    });
  } catch (err) {
    console.error("[admin/users POST] Error:", err);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
