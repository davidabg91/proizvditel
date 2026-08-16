import { getCurrentUser } from "@/lib/session";

/** Проверява дали имейлът е админски (по ADMIN_EMAIL, разделени със запетая). */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAIL ?? "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

/** Връща текущия потребител, ако е админ, иначе null. */
export async function getAdmin() {
  const user = await getCurrentUser();
  if (user && isAdminEmail(user.email)) return user;
  return null;
}
