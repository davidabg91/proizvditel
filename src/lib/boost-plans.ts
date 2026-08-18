/**
 * Планове за подсилване на обява (платено промотиране).
 * Файлът няма сървърни зависимости — може да се ползва и от клиентски компоненти.
 */

export type BoostPlanCode = "week" | "days15" | "month";

export type BoostPlan = {
  code: BoostPlanCode;
  label: string;
  days: number;
  /** Цена в евро */
  price: number;
  hint: string;
};

export const BOOST_PLANS: readonly BoostPlan[] = [
  { code: "week", label: "1 седмица", days: 7, price: 10, hint: "7 дни на челни позиции" },
  { code: "days15", label: "15 дни", days: 15, price: 18, hint: "Най-често избиран" },
  { code: "month", label: "1 месец", days: 30, price: 30, hint: "Най-изгодно на ден" },
] as const;

export const BOOST_CURRENCY = "eur";

export function findBoostPlan(code: string): BoostPlan | null {
  return BOOST_PLANS.find((p) => p.code === code) ?? null;
}

/** Форматира цена на план в евро (напр. „10,00 €"). */
export function formatBoostPrice(price: number): string {
  return new Intl.NumberFormat("bg-BG", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(price);
}

/** Активно ли е подсилването в момента. */
export function isBoosted(boostedUntil: Date | string | null | undefined): boolean {
  if (!boostedUntil) return false;
  return new Date(boostedUntil).getTime() > Date.now();
}
