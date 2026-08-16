"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { paymentSchema, type PaymentInput } from "@/lib/validators";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updatePayment(input: PaymentInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Изисква се вход." };

  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };
  const d = parsed.data;

  const producer = await prisma.producer.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  });
  if (!producer) return { ok: false, error: "Профилът не е намерен." };

  const data = {
    acceptsBankTransfer: d.acceptsBankTransfer,
    bankName: d.bankName || null,
    bankIban: d.bankIban || null,
    bankHolder: d.bankHolder || null,
    acceptsRevolut: d.acceptsRevolut,
    revolutLink: d.revolutLink || null,
    acceptsCod: d.acceptsCod,
    codNote: d.codNote || null,
  };

  await prisma.paymentSettings.upsert({
    where: { producerId: producer.id },
    create: { producerId: producer.id, ...data },
    update: data,
  });

  revalidatePath("/tablo/plashtania");
  revalidatePath(`/p/${producer.slug}`);
  return { ok: true };
}
