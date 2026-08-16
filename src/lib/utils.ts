import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Обединява Tailwind класове, като разрешава конфликти коректно. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Форматира цена в български лева. */
export function formatPrice(
  amount: number,
  currency: "BGN" | "EUR" = "BGN",
): string {
  return new Intl.NumberFormat("bg-BG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Форматира дата на български. */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

/** Форматира относително време на български (напр. „преди 3 ч"). */
export function formatRelative(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "сега";
  if (mins < 60) return `преди ${mins} мин`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `преди ${hours} ч`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `преди ${days} дни`;
  return new Intl.DateTimeFormat("bg-BG", { day: "numeric", month: "short" }).format(
    new Date(date),
  );
}

/** Създава URL-безопасен slug (поддържа транслитерация на кирилица). */
const CYR_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch",
  ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => CYR_MAP[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
