"use server";

import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site";
import { emailEnabled, sendPasswordResetEmail } from "@/lib/email";
import { allow, allowIp, TOO_MANY } from "@/lib/rate-limit";

export type ResetResult = { ok: true } | { ok: false; error: string };

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/**
 * Изпраща писмо с връзка за нова парола. Отговорът е един и същ, независимо
 * дали имейлът съществува — иначе формата би издавала кои имейли са
 * регистрирани.
 */
export async function requestPasswordReset(rawEmail: string): Promise<ResetResult> {
  if (!emailEnabled()) {
    return {
      ok: false,
      error: "Възстановяването по имейл временно не е налично. Пишете ни и ще ви помогнем.",
    };
  }
  const email = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Въведете валиден имейл." };
  }
  if (!(await allowIp("pw-reset", 5, 60 * 60_000)) || !allow(`pw-reset:${email}`, 3, 60 * 60_000)) {
    return { ok: false, error: TOO_MANY };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, banned: true },
  });
  if (user && !user.banned) {
    const token = randomBytes(32).toString("base64url");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: sha256(token),
        resetTokenExpiresAt: new Date(Date.now() + 60 * 60_000),
      },
    });
    await sendPasswordResetEmail(email, `${getSiteUrl()}/vhod/nova-parola?token=${token}`);
  }
  return { ok: true };
}

export async function resetPassword(token: string, password: string): Promise<ResetResult> {
  if (!(await allowIp("pw-reset-confirm", 10, 15 * 60_000))) {
    return { ok: false, error: TOO_MANY };
  }
  if (password.length < 8 || password.length > 200) {
    return { ok: false, error: "Паролата трябва да е поне 8 символа." };
  }
  const user = token
    ? await prisma.user.findFirst({
        where: { resetTokenHash: sha256(token) },
        select: { id: true, resetTokenExpiresAt: true, banned: true },
      })
    : null;
  if (!user || user.banned || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    return { ok: false, error: "Връзката е невалидна или е изтекла. Поискайте нова." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
  });
  return { ok: true };
}
