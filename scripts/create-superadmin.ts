import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createSuperadmin() {
  const email = "lnatalino@fundaciontraesol.cl";
  const password = "Lucca2005";

  console.log("Creando superadmin en Supabase Auth...");

  // Verificar si ya existe
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const exists = existingUsers?.users?.some(u => u.email === email);

  if (exists) {
    console.log("Usuario ya existe en Supabase Auth. Actualizando contraseña...");
    const user = existingUsers?.users?.find(u => u.email === email);
    if (user) {
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true,
      });
      if (error) {
        console.error("Error actualizando:", error);
        return;
      }
      console.log("✓ Contraseña actualizada");
      
      // Asegurar que tenga perfil y rol
      await ensureProfileAndRole(user.id, email);
    }
    return;
  }

  // Crear usuario nuevo
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: "Luis", last_name: "Natalino" },
  });

  if (error) {
    console.error("Error creando usuario:", error);
    return;
  }

  console.log("✓ Usuario creado:", data.user?.id);
  
  if (data.user) {
    await ensureProfileAndRole(data.user.id, email);
  }
}

async function ensureProfileAndRole(userId: string, email: string) {
  // Crear/actualizar perfil
  const { error: profileError } = await supabase
    .from("user_profiles")
    .upsert({
      id: userId,
      first_name: "Luis",
      last_name: "Natalino",
      verified: true,
    }, { onConflict: "id" });

  if (profileError) {
    console.error("Error en perfil:", profileError);
  } else {
    console.log("✓ Perfil creado/actualizado");
  }

  // Crear/actualizar rol como superadmin
  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert({
      user_id: userId,
      role: "superadmin",
    }, { onConflict: "user_id" });

  if (roleError) {
    console.error("Error en rol:", roleError);
  } else {
    console.log("✓ Rol superadmin asignado");
  }

  console.log("\n✅ Superadmin listo para usar:");
  console.log("   Email:", email);
  console.log("   Login: /mi-cuenta/login");
}

createSuperadmin();
