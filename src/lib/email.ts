import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site";
import { formatPrice } from "@/lib/utils";

/**
 * Изпращане на имейли през Resend (REST, без отделен пакет).
 *
 * Включва се само когато са зададени RESEND_API_KEY и EMAIL_FROM (адрес от
 * потвърден в Resend домейн, напр. „Производител.net <noreply@proizvoditel.net>“).
 * Без тях функциите не правят нищо — сайтът работи, просто без имейли.
 */
export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

export async function sendEmail(msg: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  if (!emailEnabled()) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, ...msg }),
  });
  if (!res.ok) {
    console.error("Resend error:", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

/** Текстът от потребители влиза в HTML на писмото — екранираме го. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, body: string): string {
  return `<!doctype html><html lang="bg"><body style="margin:0;background:#f7f5f0;font-family:Arial,sans-serif;color:#1b1e1a">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="background:#1f4a38;color:#f6dfa6;padding:18px 24px;border-radius:16px 16px 0 0;font-size:20px;font-weight:bold">Производител.net</div>
<div style="background:#fff;padding:24px;border-radius:0 0 16px 16px;border:1px solid #e4e0d6;border-top:0">
<h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>
${body}
</div>
<p style="font-size:12px;color:#5b6157;text-align:center;margin-top:16px">Това писмо е изпратено автоматично от Производител.net.</p>
</div></body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0 8px"><a href="${esc(href)}" style="background:#1f4a38;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;display:inline-block">${esc(label)}</a></p>`;
}

/** Известие до производителя за нова поръчка (карта или наложен платеж). */
export async function notifyProducerNewOrder(orderId: string): Promise<void> {
  if (!emailEnabled()) return;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      producer: { select: { farmName: true, user: { select: { email: true } } } },
    },
  });
  if (!order?.producer.user?.email) return;

  const method = order.paymentMethod === "cod" ? "наложен платеж" : "платена с карта";
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${esc(i.title)}</td><td style="padding:6px 0;text-align:right">× ${i.qty}</td><td style="padding:6px 0;text-align:right">${formatPrice((i.unitPrice * i.qty) / 100)}</td></tr>`,
    )
    .join("");
  const link = `${getSiteUrl()}/tablo/porachki`;

  const html = layout(
    `Нова поръчка (${method})`,
    `<p>Здравейте, ${esc(order.producer.farmName)}! Имате нова поръчка № ${order.id.slice(-6).toUpperCase()}.</p>
<table style="width:100%;border-collapse:collapse;font-size:14px;border-top:1px solid #e4e0d6;border-bottom:1px solid #e4e0d6;margin:12px 0">${rows}</table>
<p style="font-size:16px"><strong>Общо: ${formatPrice(order.amountTotal / 100)}</strong></p>
<p style="font-size:14px;color:#5b6157">${esc(order.customerName ?? "")}${order.phone ? ` · ${esc(order.phone)}` : ""}<br>${esc(order.shippingAddress ?? "")}</p>
${button(link, "Отвори поръчките")}`,
  );
  const text = `Нова поръчка № ${order.id.slice(-6).toUpperCase()} (${method}) за ${formatPrice(order.amountTotal / 100)}.\n${order.items.map((i) => `- ${i.title} × ${i.qty}`).join("\n")}\nВижте я в ${link}`;

  await sendEmail({
    to: order.producer.user.email,
    subject: `Нова поръчка в Производител.net — ${formatPrice(order.amountTotal / 100)}`,
    html,
    text,
  });
}

/** Писмо с връзка за нова парола. */
export async function sendPasswordResetEmail(to: string, link: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Нова парола за Производител.net",
    html: layout(
      "Смяна на паролата",
      `<p>Получихме заявка за нова парола за вашия профил. Връзката е валидна 1 час.</p>
${button(link, "Задай нова парола")}
<p style="font-size:13px;color:#5b6157">Ако не сте поискали смяна, просто игнорирайте това писмо — паролата ви остава същата.</p>`,
    ),
    text: `Задайте нова парола (валидна 1 час): ${link}\nАко не сте поискали смяна, игнорирайте писмото.`,
  });
}
