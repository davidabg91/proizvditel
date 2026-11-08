import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, platformFee, canReceiveTransfers } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { activateBoost } from "@/lib/boost";
import { createDeliveryChat } from "@/lib/delivery-chat";
import { notifyProducerNewOrder } from "@/lib/email";

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

/**
 * Сменя платежния статус на поръчките по едно плащане (при обща поръчка са
 * няколко). Изплащането (lib/payout.ts) върви само при статус „paid“, така че
 * върнатите и оспорените поръчки спират автоматично. Ако сумата вече е
 * преведена, остава за ръчно уреждане от администратора по Общите условия.
 */
async function markPayment(
  paymentIntent: string | Stripe.PaymentIntent | null,
  paymentStatus: "paid" | "refunded" | "partially_refunded" | "disputed",
) {
  const id = typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;
  if (!id) return;
  const orders = await prisma.order.findMany({
    where: { paymentIntentId: id },
    select: { id: true, paidOutAt: true },
  });
  if (orders.length === 0) return;
  await prisma.order.updateMany({ where: { paymentIntentId: id }, data: { paymentStatus } });
  const alreadyPaid = orders.filter((o) => o.paidOutAt);
  if (alreadyPaid.length > 0 && paymentStatus !== "paid") {
    console.warn(
      `Плащане ${id} е ${paymentStatus}, но вече е изплатено по поръчки:`,
      alreadyPaid.map((o) => o.id).join(", "),
    );
  }
}

export async function POST(req: Request) {
  // Stripe изисква отделен endpoint (и отделен подпис) за събитията от
  // свързаните акаунти. И двата сочат насам, затова пробваме всеки подпис.
  const secrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_CONNECT,
  ].filter((s): s is string => !!s?.trim());

  if (secrets.length === 0) {
    return NextResponse.json({ error: "Webhook не е конфигуриран." }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event | null = null;
  let lastError = "";
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(raw, sig ?? "", secret);
      break;
    } catch (e) {
      lastError = e instanceof Error ? e.message : "";
    }
  }
  if (!event) {
    return NextResponse.json(
      { error: `Невалиден подпис: ${lastError}` },
      { status: 400 },
    );
  }

  try {
    if (event.type === "account.updated") {
      const acct = event.data.object as Stripe.Account;
      await prisma.producer.updateMany({
        where: { stripeAccountId: acct.id },
        data: { stripeChargesEnabled: canReceiveTransfers(acct) },
      });
    } else if (event.type === "charge.refunded") {
      // Върнато плащане — поръчката вече не се изплаща на производителя.
      const charge = event.data.object as Stripe.Charge;
      await markPayment(
        charge.payment_intent,
        charge.amount_refunded >= charge.amount ? "refunded" : "partially_refunded",
      );
    } else if (event.type === "charge.dispute.created") {
      // Оспорено плащане (chargeback) — изплащането спира до решението.
      const dispute = event.data.object as Stripe.Dispute;
      await markPayment(dispute.payment_intent, "disputed");
    } else if (event.type === "charge.dispute.closed") {
      const dispute = event.data.object as Stripe.Dispute;
      await markPayment(dispute.payment_intent, dispute.status === "won" ? "paid" : "refunded");
    } else if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const kind = session.metadata?.kind ?? "single";

      // Подсилване на обява — таксата е към платформата, няма поръчка.
      if (kind === "boost") {
        await activateBoost(
          session.id,
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        );
        return NextResponse.json({ received: true });
      }

      const customerId = session.metadata?.customerId || null;
      const ship = extractShipping(session);
      const currency = session.currency ?? "eur";
      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : null;

      if (kind === "combined") {
        // Вече обработена?
        const exists = await prisma.order.findFirst({
          where: { groupId: session.id },
          select: { id: true },
        });
        if (exists) return NextResponse.json({ received: true });

        // Количество и цена — от редовете на самото плащане (каквото клиентът
        // е платил), а не от текущите цени в базата: производителят може да
        // е сменил цената, докато клиентът е плащал.
        const qtyById = new Map<string, number>();
        const paidUnitById = new Map<string, number>();
        try {
          const li = await stripe.checkout.sessions.listLineItems(session.id, {
            limit: 100,
            expand: ["data.price.product"],
          });
          for (const row of li.data) {
            const product = row.price?.product;
            const listingId =
              product && typeof product === "object" && "metadata" in product
                ? product.metadata?.listingId
                : undefined;
            if (!listingId) continue;
            qtyById.set(listingId, row.quantity ?? 1);
            if (row.price?.unit_amount != null) paidUnitById.set(listingId, row.price.unit_amount);
          }
        } catch (e) {
          console.error("listLineItems error:", e);
        }
        // Плащания отпреди тази промяна нямат listingId в продукта.
        if (qtyById.size === 0) {
          for (const pair of (session.metadata?.lst ?? "").split(",")) {
            const [id, q] = pair.split(":");
            if (id) qtyById.set(id, Math.max(1, parseInt(q, 10) || 1));
          }
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
          const unit = paidUnitById.get(l.id) ?? Math.round(l.price * 100);
          const g = byProducer.get(l.producer.id) ?? {
            accountId: l.producer.stripeAccountId,
            subtotal: 0,
            items: [],
          };
          g.subtotal += unit * qty;
          g.items.push({ title: `${l.title} (${l.unit})`, unitPrice: unit, qty });
          byProducer.set(l.producer.id, g);
        }

        for (const [producerId, g] of byProducer) {
          const fee = platformFee(g.subtotal);
          // Преводът се прави при отбелязване „доставена" (lib/payout.ts).
          const created = await prisma.order.create({
            data: {
              producerId,
              customerId: customerId || null,
              stripeSessionId: `${session.id}_${producerId}`,
              paymentIntentId,
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
          await notifyProducerNewOrder(created.id).catch((e) =>
            console.error("notifyProducerNewOrder error:", e),
          );

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

        // Две или повече стопанства в една доставка — отваря се общ чат, за да
        // се уговорят кой какво праща. Грешка тук не бива да вали webhook-а:
        // поръчките вече са записани, а Stripe би започнал да го повтаря.
        if (byProducer.size >= 2) {
          await createDeliveryChat(session.id).catch((e) =>
            console.error("createDeliveryChat error:", e),
          );
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
        const created = await prisma.order.create({
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
        await notifyProducerNewOrder(created.id).catch((e) =>
          console.error("notifyProducerNewOrder error:", e),
        );

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
