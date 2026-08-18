"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { LEGAL_VERSION } from "@/lib/company";
import { registerSchema, type RegisterInput } from "@/lib/validators";
import { uniqueProducerSlug } from "@/lib/slug";
import { signIn } from "@/auth";

export type RegisterResult =
  | { ok: true }
  | { ok: false; error: string };

export async function registerProducer(
  input: RegisterInput,
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Невалидни данни." };
  }

  const data = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    return { ok: false, error: "Вече съществува акаунт с този имейл." };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const slug = await uniqueProducerSlug(data.farmName);

  const crops = (data.crops ?? [])
    .filter((c) => c.name && c.name.trim().length > 0)
    .map((c) => ({
      name: c.name.trim(),
      category: c.category || null,
      varieties: c.varieties || null,
      sinceYear: c.sinceYear ?? null,
      decares: c.decares ?? null,
      annualYield: c.annualYield ?? null,
      yieldUnit: c.yieldUnit || null,
    }));

  await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.ownerName,
      role: "producer",
      termsAcceptedAt: new Date(),
      termsVersion: LEGAL_VERSION,
      producer: {
        create: {
          farmName: data.farmName,
          slug,
          ownerName: data.ownerName,
          urn: data.urn || null,
          urnDocumentUrl: data.urnDocumentUrl || null,
          region: data.region || null,
          town: data.town || null,
          phone: data.phone || null,
          contactEmail: data.email,
          startedYear: data.startedYear ?? null,
          totalDecares: data.totalDecares ?? null,
          description: data.description || null,
          crops: { create: crops },
          payment: { create: {} },
        },
      },
    },
  });

  // Автоматичен вход след регистрация
  await signIn("credentials", {
    email: data.email,
    password: data.password,
    redirect: false,
  });

  return { ok: true };
}
