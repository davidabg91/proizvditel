import { headers } from "next/headers";

/**
 * Прост ограничител на заявки (fixed window) в паметта на сървъра.
 *
 * Пази от най-честия случай — скрипт, който бомбардира вход, регистрация или
 * поръчки от един адрес. Броячите живеят в една инстанция на функцията, така
 * че при много паралелни инстанции лимитът е по-хлабав; за по-строга защита
 * се добавя правило за rate limit във Vercel Firewall.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/**
 * Връща true, ако заявката е позволена. `key` описва действието и кой го
 * прави, напр. `login:1.2.3.4`.
 */
export function allow(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // Чистим изтеклите броячи от време на време, за да не расте паметта.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

/** Удобна обвивка: лимит по IP за дадено действие. */
export async function allowIp(action: string, limit: number, windowMs: number) {
  return allow(`${action}:${await clientIp()}`, limit, windowMs);
}

export const TOO_MANY = "Твърде много опити. Изчакайте малко и опитайте отново.";
