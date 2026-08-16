"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function currentProducer() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.producer.findUnique({
    where: { userId: session.user.id },
    select: { id: true, slug: true },
  });
}

/** Производителят потвърждава, че този клиент е купувал от него. */
export async function confirmPurchase(customerId: string): Promise<ActionResult> {
  const producer = await currentProducer();
  if (!producer) return { ok: false, error: "Изисква се вход." };

  const customer = await prisma.user.findUnique({
    where: { id: customerId },
    select: { id: true },
  });
  if (!customer) return { ok: false, error: "Клиентът не е намерен." };

  await prisma.purchase.upsert({
    where: {
      producerId_customerId: { producerId: producer.id, customerId },
    },
    create: { producerId: producer.id, customerId },
    update: {},
  });

  revalidatePath("/tablo/klienti");
  revalidatePath(`/p/${producer.slug}`);
  return { ok: true };
}

/** Отменя потвърждението за покупка (не изтрива вече оставена оценка). */
export async function removePurchase(customerId: string): Promise<ActionResult> {
  const producer = await currentProducer();
  if (!producer) return { ok: false, error: "Изисква се вход." };

  await prisma.purchase.deleteMany({
    where: { producerId: producer.id, customerId },
  });

  revalidatePath("/tablo/klienti");
  return { ok: true };
}
