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
    select: { producerId: true },
  });
  if (!order || order.producerId !== producer.id)
    return { ok: false, error: "Няма достъп." };

  if (!STATUSES.has(data.fulfillmentStatus))
    return { ok: false, error: "Невалиден статус." };

  await prisma.order.update({
    where: { id: orderId },
    data: {
      fulfillmentStatus: data.fulfillmentStatus,
      courier: data.courier.trim() || null,
      trackingNote: data.trackingNote.trim() || null,
    },
  });

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
