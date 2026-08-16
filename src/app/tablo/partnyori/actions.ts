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

export async function togglePartner(
  partnerId: string,
  on: boolean,
): Promise<ActionResult> {
  const producer = await currentProducer();
  if (!producer) return { ok: false, error: "Изисква се вход." };
  if (partnerId === producer.id)
    return { ok: false, error: "Невалиден избор." };

  const partner = await prisma.producer.findUnique({
    where: { id: partnerId },
    select: { id: true },
  });
  if (!partner) return { ok: false, error: "Производителят не е намерен." };

  if (on) {
    await prisma.producerPartner.upsert({
      where: {
        producerId_partnerId: { producerId: producer.id, partnerId },
      },
      create: { producerId: producer.id, partnerId },
      update: {},
    });
  } else {
    await prisma.producerPartner.deleteMany({
      where: { producerId: producer.id, partnerId },
    });
  }

  revalidatePath("/tablo/partnyori");
  revalidatePath(`/p/${producer.slug}`);
  return { ok: true };
}
