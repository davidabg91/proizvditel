"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { customerRegisterSchema, type CustomerRegisterInput } from "@/lib/validators";
import { signIn } from "@/auth";

export type RegisterResult = { ok: true } | { ok: false; error: string };

export async function registerCustomer(
  input: CustomerRegisterInput,
): Promise<RegisterResult> {
  const parsed = customerRegisterSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };
  const d = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: d.email } });
  if (existing) return { ok: false, error: "Вече съществува акаунт с този имейл." };

  const passwordHash = await bcrypt.hash(d.password, 12);
  await prisma.user.create({
    data: {
      email: d.email,
      passwordHash,
      name: d.name,
      role: "customer",
    },
  });

  await signIn("credentials", {
    email: d.email,
    password: d.password,
    redirect: false,
  });

  return { ok: true };
}
