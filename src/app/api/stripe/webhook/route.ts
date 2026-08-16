import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, platformFee } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type ItemData = { title: string; unitPrice: number; qty: number };

/** Извлича данните за клиента/доставката от сесията (устойчиво към версии). */
function extractShipping(session: Stripe.Checkout.Session) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = session as any;
  const ship = s.collected_information?.shipping_details ?? s.shipping_details ?? null;
  const cust = session.customer_details;
  const addr = ship?.address ?? cust?.address ?? null;
  const shippingAddress = addr
    ? [addr.line1, addr.line2, addr.postal_code, addr.city, addr.country]
        .filter(Boolean)
        .join(", ")
    : null;
  return {
    customerName: ship?.name ?? cust?.name ?? null,
    phone: cust?.phone ?? null,
    email: cust?.email ?? null,
    shippingAddress,
  };
}

async function chargeIdForSession(
  session: Stripe.Checkout.Session,
): Promise<string | undefined> {
  const piId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (!piId) return undefined;
  const pi = await stripe.paymentIntents.retrieve(piId);
  return typeof pi.latest_charge === "string"
    ? pi.latest_charge
    : (pi.latest_charge?.id ?? undefined);
}

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
    if (event.type === "account.updated") {
      const acct = event.data.object as Stripe.Account;
      await prisma.producer.updateMany({
        where: { stripeAccountId: acct.id },
        data: { stripeChargesEnabled: acct.charges_enabled ?? false },
      });
    } else if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const kind = session.metadata?.kind ?? "single";
      const customerId = session.metadata?.customerId || null;
      const ship = extractShipping(session);
      const currency = session.currency ?? "bgn";
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : null;

      if (kind === "combined") {
        // Вече обработена?
        const exists = await prisma.order.findFirst({
          where: { groupId: session.id },
          select: { id: true },
        });
        if (exists) return NextResponse.json({ received: true });

        const lst = session.metadata?.lst ?? "";
        const qtyById = new Map<string, number>();
        for (const pair of lst.split(",")) {
          const [id, q] = pair.split(":");
          if (id) qtyById.set(id, Math.max(1, parseInt(q, 10) || 1));
        }
        const listings = await prisma.productListing.findMany({
          where: { id: { in: [...qtyById.keys()] } },
          select: {
            id: true,
            title: true,
            price: true,
            unit: true,
            producer: { select: { id: true, stripeAccountId: true } },
          },
        });

        // Групиране по производител
        const byProducer = new Map<
          string,
          { accountId: string | null; subtotal: number; items: ItemData[] }
        >();
        for (const l of listings) {
          const qty = qtyById.get(l.id) ?? 1;
          const unit = Math.round(l.price * 100);
          const g = byProducer.get(l.producer.id) ?? {
            accountId: l.producer.stripeAccountId,
            subtotal: 0,
            items: [],
          };
          g.subtotal += unit * qty;
          g.items.push({ title: `${l.title} (${l.unit})`, unitPrice: unit, qty });
          byProducer.set(l.producer.id, g);
        }

        const chargeId = await chargeIdForSession(session);

        for (const [producerId, g] of byProducer) {
          const fee = platformFee(g.subtotal);
          const transferAmount = g.subtotal - fee; // платформата задържа 5%
          let transferId: string | null = null;
          if (g.accountId && transferAmount > 0) {
            try {
              const tr = await stripe.transfers.create({
                amount: transferAmount,
                currency,
                destination: g.accountId,
                transfer_group: session.metadata?.transferGroup ?? undefined,
                source_transaction: chargeId,
                metadata: { producerId, groupId: session.id },
              });
              transferId = tr.id;
            } catch {
              // записваме поръчката дори трансферът да се провали (обработва се ръчно)
            }
          }

          await prisma.order.create({
            data: {
              producerId,
              customerId: customerId || null,
              stripeSessionId: `${session.id}_${producerId}`,
              paymentIntentId,
              transferId,
              groupId: session.id,
              combined: true,
              amountTotal: g.subtotal,
              applicationFee: fee,
              currency,
              paymentMethod: "card",
              paymentStatus: "paid",
              status: "paid",
              customerName: ship.customerName,
              email: ship.email,
              phone: ship.phone,
              shippingAddress: ship.shippingAddress,
              fulfillmentStatus: "new",
              items: { create: g.items },
            },
          });

          if (customerId) {
            await prisma.purchase
              .upsert({
                where: { producerId_customerId: { producerId, customerId } },
                create: { producerId, customerId },
                update: {},
              })
              .catch(() => {});
          }
        }
      } else {
        // Единична поръчка (destination charge)
        const producerId = session.metadata?.producerId;
        if (!producerId) return NextResponse.json({ received: true });

        const exists = await prisma.order.findUnique({
          where: { stripeSessionId: session.id },
          select: { id: true },
        });
        if (exists) return NextResponse.json({ received: true });

        let itemsData: ItemData[] = [];
        try {
          const li = await stripe.checkout.sessions.listLineItems(session.id, {
            limit: 100,
          });
          itemsData = li.data.map((x) => ({
            title: x.description ?? "Продукт",
            unitPrice: x.price?.unit_amount ?? 0,
            qty: x.quantity ?? 1,
          }));
        } catch {}

        const amountTotal = session.amount_total ?? 0;
        await prisma.order.create({
          data: {
            producerId,
            customerId: customerId || null,
            stripeSessionId: session.id,
            paymentIntentId,
            amountTotal,
            applicationFee: platformFee(amountTotal),
            currency,
            paymentMethod: "card",
            paymentStatus: "paid",
            status: "paid",
            customerName: ship.customerName,
            email: ship.email,
            phone: ship.phone,
            shippingAddress: ship.shippingAddress,
            fulfillmentStatus: "new",
            items: { create: itemsData },
          },
        });

        if (customerId) {
          await prisma.purchase
            .upsert({
              where: { producerId_customerId: { producerId, customerId } },
              create: { producerId, customerId },
              update: {},
            })
            .catch(() => {});
        }
      }
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Грешка при обработка." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
