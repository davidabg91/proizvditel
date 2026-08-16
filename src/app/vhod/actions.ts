"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

export type LoginResult =
  | { ok: true; role: string }
  | { ok: false; error: string };

export async function login(input: {
  email: string;
  password: string;
}): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { role: true },
    });
    return { ok: true, role: user?.role ?? "customer" };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Грешен имейл или парола." };
    }
    throw err;
  }
}
