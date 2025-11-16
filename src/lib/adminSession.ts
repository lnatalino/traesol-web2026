import { cookies } from "next/headers";

export type AdminSession = {
  role: string;
  email: string;
  allowed: boolean;
};

const ALLOWED_ROLES = new Set(["admin", "editor"]);

export async function getAdminSession(): Promise<AdminSession> {
  const store = await cookies();
  const role = store.get("traesol-role")?.value ?? "";
  const email = store.get("traesol-email")?.value ?? "";
  const allowed = ALLOWED_ROLES.has(role);
  return { role, email, allowed };
}

export function isAdminRole(role: string | null | undefined): boolean {
  return ALLOWED_ROLES.has(String(role ?? ""));
}
