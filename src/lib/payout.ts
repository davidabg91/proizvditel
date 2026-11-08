import { prisma } from "@/lib/prisma";
import { stripe, platformFee, estimatedStripeFee, totalDeduction } from "@/lib/stripe";

/**
 * Изплащане към производителя.
 *
 * Парите от картовите плащания постъпват в баланса на платформата и стоят
 * там, докато поръчката не бъде отбелязана като „доставена". Така през целия
 * рисков период (докато стоката пътува) буферът е у платформата, която по
 * договора със Stripe носи оспорванията и връщанията.
 */

/**
 * Колко дни след „доставена“ чакаме, преди да преведем сумата. През това
 * време купувачът може да подаде рекламация, а производителят сам е
 * отбелязал доставката — без срок това не би защитило никого.
 */
export const PAYOUT_HOLD_DAYS = Math.max(
  0,
  Number(process.env.PAYOUT_HOLD_DAYS ?? 3) || 0,
);

/** Намира идентификатора на плащането, от което да излезе преводът. */
async function chargeIdForOrder(paymentIntentId: string): Promise<string | undefined> {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  return typeof pi.latest_charge === "string"
    ? pi.latest_charge
    : (pi.latest_charge?.id ?? undefined);
}

export type PayoutResult =
  | { ok: true; skipped?: string; transferId?: string }
  | { ok: false; error: string };

/**
 * Превежда дължимото на производителя за една поръчка.
 * Идемпотентно — ако преводът вече е направен, не прави нищо.
 */
export async function payoutOrder(orderId: string): Promise<PayoutResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      producerId: true,
      amountTotal: true,
      currency: true,
      paymentMethod: true,
      paymentStatus: true,
      combined: true,
      groupId: true,
      transferId: true,
      paidOutAt: true,
      paymentIntentId: true,
      producer: { select: { stripeAccountId: true } },
    },
  });
  if (!order) return { ok: false, error: "Поръчката не е намерена." };

  // Вече изплатена
  if (order.transferId || order.paidOutAt) return { ok: true, skipped: "already" };

  // Наложен платеж — парите се събират от куриера, няма какво да превеждаме.
  if (order.paymentMethod !== "card") return { ok: true, skipped: "not-card" };
  if (order.paymentStatus !== "paid") return { ok: true, skipped: "not-paid" };

  if (!order.producer.stripeAccountId)
    return { ok: false, error: "Производителят няма свързан Stripe акаунт." };
  if (!order.paymentIntentId)
    return { ok: false, error: "Липсва идентификатор на плащането." };

  // Комисионата и таксата на Stripe се удържат от сумата към производителя.
  // При съвместна поръчка фиксираната част от таксата вече е разделена между
  // производителите, затова я преизчисляваме по същия начин.
  let deduction: number;
  if (order.combined && order.groupId) {
    const group = await prisma.order.findMany({
      where: { groupId: order.groupId },
      select: { amountTotal: true },
    });
    const grandTotal = group.reduce((s, o) => s + o.amountTotal, 0);
    const totalStripeFee = estimatedStripeFee(grandTotal);
    const share =
      grandTotal > 0
        ? Math.round((totalStripeFee * order.amountTotal) / grandTotal)
        : 0;
    deduction = totalDeduction(order.amountTotal, share);
  } else {
    deduction = totalDeduction(order.amountTotal);
  }

  const amount = Math.max(0, order.amountTotal - deduction);
  if (amount === 0) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paidOutAt: new Date() },
    });
    return { ok: true, skipped: "zero" };
  }

  try {
    // Поръчките отпреди тази промяна минаваха като destination charge —
    // преводът е станал автоматично при плащането. Разпознаваме ги по
    // transfer_data в плащането, за да не преведем сумата втори път.
    const pi = await stripe.paymentIntents.retrieve(order.paymentIntentId);
    if (pi.transfer_data?.destination) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paidOutAt: new Date() },
      });
      return { ok: true, skipped: "auto-transferred" };
    }

    const chargeId = await chargeIdForOrder(order.paymentIntentId);
    // Ключът за идемпотентност гарантира един превод на поръчка, дори при
    // двоен клик или два паралелни опита — Stripe връща същия превод.
    const transfer = await stripe.transfers.create(
      {
        amount,
        currency: order.currency,
        destination: order.producer.stripeAccountId,
        source_transaction: chargeId,
        metadata: {
          orderId: order.id,
          producerId: order.producerId,
          commission: String(platformFee(order.amountTotal)),
        },
      },
      { idempotencyKey: `payout_${order.id}` },
    );

    await prisma.order.update({
      where: { id: order.id },
      data: { transferId: transfer.id, paidOutAt: new Date() },
    });

    return { ok: true, transferId: transfer.id };
  } catch (e) {
    console.error("payoutOrder error:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Грешка при превода към производителя.",
    };
  }
}

/**
 * Изплаща всички поръчки, при които срокът за рекламации е изтекъл.
 * Вика се веднъж дневно от Vercel Cron (/api/cron/payouts).
 */
export async function payoutDueOrders(): Promise<{
  paid: number;
  skipped: number;
  failed: { orderId: string; error: string }[];
}> {
  const cutoff = new Date(Date.now() - PAYOUT_HOLD_DAYS * 24 * 60 * 60_000);
  const due = await prisma.order.findMany({
    where: {
      paymentMethod: "card",
      paymentStatus: "paid",
      fulfillmentStatus: "delivered",
      deliveredAt: { lte: cutoff },
      paidOutAt: null,
      transferId: null,
    },
    select: { id: true },
    take: 100,
  });

  let paid = 0;
  let skipped = 0;
  const failed: { orderId: string; error: string }[] = [];
  for (const o of due) {
    const res = await payoutOrder(o.id);
    if (!res.ok) failed.push({ orderId: o.id, error: res.error });
    else if (res.transferId) paid++;
    else skipped++;
  }
  return { paid, skipped, failed };
}
