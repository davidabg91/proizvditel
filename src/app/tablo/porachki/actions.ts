"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ActionResult = { ok: true } | { ok: false; error: string };

const STATUSES = new Set([
  "new",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export async function updateOrder(
  orderId: string,
  data: { fulfillmentStatus: string; courier: string; trackingNote: string },
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Изисква се вход." };

  const producer = await prisma.producer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!producer) return { ok: false, error: "Профилът не е намерен." };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { producerId: true, customerId: true, deliveredAt: true, paidOutAt: true },
  });
  if (!order || order.producerId !== producer.id)
    return { ok: false, error: "Няма достъп." };

  if (!STATUSES.has(data.fulfillmentStatus))
    return { ok: false, error: "Невалиден статус." };

  const delivered = data.fulfillmentStatus === "delivered";
  // Веднъж изплатена, поръчката не може да се „върне“ назад от доставена.
  if (order.paidOutAt && !delivered)
    return { ok: false, error: "Поръчката вече е изплатена и не може да се промени." };

  await prisma.order.update({
    where: { id: orderId },
    data: {
      fulfillmentStatus: data.fulfillmentStatus,
      courier: data.courier.trim() || null,
      trackingNote: data.trackingNote.trim() || null,
      // Срокът за рекламации тече от първото отбелязване като доставена.
      deliveredAt: delivered ? (order.deliveredAt ?? new Date()) : null,
    },
  });

  // Едва доставената поръчка дава право на „потвърден“ отзив — не самото
  // заявяване (при наложен платеж то може да е фалшиво).
  if (delivered && order.customerId) {
    await prisma.purchase
      .upsert({
        where: {
          producerId_customerId: { producerId: producer.id, customerId: order.customerId },
        },
        create: { producerId: producer.id, customerId: order.customerId },
        update: {},
      })
      .catch(() => {});
  }

  revalidatePath("/tablo/porachki");
  revalidatePath("/tablo");
  return { ok: true };
}

/** Брой нови (необработени) поръчки за производителя. */
export async function getNewOrdersCount(producerId: string): Promise<number> {
  return prisma.order.count({
    where: { producerId, fulfillmentStatus: "new" },
  });
}

