import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, platformFee } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook не е конфигуриран." }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig ?? "", secret);
  } catch (e) {
    return NextResponse.json(
      { error: `Невалиден подпис: ${e instanceof Error ? e.message : ""}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "account.updated": {
        const acct = event.data.object as Stripe.Account;
        await prisma.producer.updateMany({
          where: { stripeAccountId: acct.id },
          data: { stripeChargesEnabled: acct.charges_enabled ?? false },
        });
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const producerId = session.metadata?.producerId;
        const customerId = session.metadata?.customerId || null;
        if (!producerId) break;

        // Вече записана?
        const existing = await prisma.order.findUnique({
          where: { stripeSessionId: session.id },
          select: { id: true },
        });
        if (existing) break;

        // Позиции от поръчката
        let itemsData: { title: string; unitPrice: number; qty: number }[] = [];
        try {
          const lineItems = await stripe.checkout.sessions.listLineItems(
            session.id,
            { limit: 100 },
          );
          itemsData = lineItems.data.map((li) => ({
            title: li.description ?? "Продукт",
            unitPrice: li.price?.unit_amount ?? 0,
            qty: li.quantity ?? 1,
          }));
        } catch {
          // ако не успеем — записваме поръчката без разбивка
        }

        const amountTotal = session.amount_total ?? 0;

        await prisma.order.create({
          data: {
            producerId,
            customerId: customerId || null,
            stripeSessionId: session.id,
            paymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : null,
            amountTotal,
            applicationFee: platformFee(amountTotal),
            currency: session.currency ?? "bgn",
            email: session.customer_details?.email ?? null,
            status: "paid",
            items: { create: itemsData },
          },
        });

        // Потвърдена покупка → купувачът може да остави оценка
        if (customerId) {
          await prisma.purchase
            .upsert({
              where: {
                producerId_customerId: { producerId, customerId },
              },
              create: { producerId, customerId },
              update: {},
            })
            .catch(() => {});
        }
        break;
      }

      default:
        break;
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Грешка при обработка." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
