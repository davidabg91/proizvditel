import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  typescript: true,
});

/** Комисиона на платформата в проценти (по подразбиране 5%). */
export const PLATFORM_FEE_PERCENT = Number(
  process.env.PLATFORM_FEE_PERCENT ?? "5",
);

/** Изчислява комисионата на платформата в стотинки. */
export function platformFee(amountInCents: number): number {
  return Math.round((amountInCents * PLATFORM_FEE_PERCENT) / 100);
}

/** Базовият URL на сайта (за return/redirect адреси) — виж `@/lib/site`. */
export { getSiteUrl } from "@/lib/site";

/**
 * Готов ли е свързаният акаунт да получава пари от нас.
 *
 * Производителите са получатели (recipient), а не търговци — плащането се
 * събира от платформата и се превежда към тях. Затова важна е способността
 * "transfers", а НЕ charges_enabled, която при такива акаунти остава false.
 */
export function canReceiveTransfers(acct: {
  capabilities?: { transfers?: string | null } | null;
}): boolean {
  return acct.capabilities?.transfers === "active";
}

/** Валутата на платформата. От 2026 г. всичко на сайта е в евро. */
export const SITE_CURRENCY = "eur";

// ─────────────────────────────────────────────
//  Такси на Stripe
// ─────────────────────────────────────────────
//
// При destination charge плащането се събира в акаунта на платформата и
// Stripe удържа обработващата такса от НЕЯ, а не от производителя. За да
// останат 5% чиста комисиона, приблизителната такса на Stripe се добавя към
// `application_fee_amount` (съответно се приспада от превода към стопанина).

/** Процент на таксата на Stripe (европейски карти — по подразбиране 1.5%). */
export const STRIPE_FEE_PERCENT = Number(process.env.STRIPE_FEE_PERCENT ?? "1.5");

/** Фиксирана част от таксата на Stripe в евроцентове (по подразбиране 0,25 €). */
export const STRIPE_FEE_FIXED = Number(process.env.STRIPE_FEE_FIXED_CENTS ?? "25");

/**
 * Кой поема обработващата такса на Stripe.
 * "producer" (по подразбиране) — приспада се от сумата към производителя;
 * "platform" — платформата я плаща от своите 5%.
 */
export const STRIPE_FEE_PAYER = process.env.STRIPE_FEE_PAYER ?? "producer";

/**
 * Приблизителна такса на Stripe за една транзакция (в евроцентове).
 * Реалната зависи от картата (карти извън ЕИП са по-скъпи), затова разликата
 * остава за сметка на платформата.
 */
export function estimatedStripeFee(amountInCents: number): number {
  if (amountInCents <= 0) return 0;
  return (
    Math.round((amountInCents * STRIPE_FEE_PERCENT) / 100) + STRIPE_FEE_FIXED
  );
}

/**
 * Колко общо се удържа от плащането преди превода към производителя:
 * комисионата на платформата + (ако така е настроено) таксата на Stripe.
 * `stripeFeeOverride` се подава при съвместни поръчки, където фиксираната
 * част от таксата се дели между няколко производителя.
 */
export function totalDeduction(
  amountInCents: number,
  stripeFeeOverride?: number,
): number {
  const fee = platformFee(amountInCents);
  if (STRIPE_FEE_PAYER !== "producer") return Math.min(fee, amountInCents);
  const stripeFee = stripeFeeOverride ?? estimatedStripeFee(amountInCents);
  return Math.min(fee + stripeFee, amountInCents);
}
