"use server";

import { allowIp, TOO_MANY } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { customerRegisterSchema, type CustomerRegisterInput } from "@/lib/validators";
import { signIn } from "@/auth";
import { LEGAL_VERSION } from "@/lib/company";

export type RegisterResult = { ok: true } | { ok: false; error: string };

export async function registerCustomer(
  input: CustomerRegisterInput,
): Promise<RegisterResult> {
  const parsed = customerRegisterSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };
  const d = parsed.data;

  if (!(await allowIp("register", 5, 60 * 60_000))) {
    return { ok: false, error: TOO_MANY };
  }

  const existing = await prisma.user.findUnique({ where: { email: d.email } });
  if (existing) return { ok: false, error: "Вече съществува акаунт с този имейл." };

  const passwordHash = await bcrypt.hash(d.password, 12);
  await prisma.user.create({
    data: {
      email: d.email,
      passwordHash,
      name: d.name,
      role: "customer",
      termsAcceptedAt: new Date(),
      termsVersion: LEGAL_VERSION,
    },
  });

  await signIn("credentials", {
    email: d.email,
    password: d.password,
    redirect: false,
  });

  return { ok: true };
}
