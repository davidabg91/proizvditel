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

/** Базовият URL на сайта (за return/redirect адреси). */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")
  );
}
