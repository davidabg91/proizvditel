/** Официалният адрес на сайта (канонична версия — с www). */
export const OFFICIAL_SITE_URL = "https://www.proizvoditel.net";

/**
 * Базовият URL на сайта — ползва се за метаданни и за return/success
 * адресите към Stripe.
 *
 * Ред на предимство:
 *  1. NEXT_PUBLIC_SITE_URL — ръчно зададен (има най-висок приоритет);
 *  2. официалният домейн — при production билд във Vercel;
 *  3. адресът на конкретния preview деплой;
 *  4. localhost — при локална разработка.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  if (process.env.VERCEL_ENV === "production") return OFFICIAL_SITE_URL;

  // Preview деплой — връщаме адреса на самия деплой, за да не препраща
  // плащанията към production.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

  return "http://localhost:3000";
}
