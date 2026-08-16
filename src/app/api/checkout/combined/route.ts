import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, getSiteUrl } from "@/lib/stripe";

type IncomingItem = { listingId: string; qty: number };

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe не е конфигуриран." }, { status: 500 });
  }

  let body: { items?: IncomingItem[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Невалидни данни." }, { status: 400 });
  }
  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Липсват продукти." }, { status: 400 });
  }

  const qtyById = new Map<string, number>();
  for (const it of items) {
    const q = Math.max(1, Math.min(99, Math.floor(Number(it.qty) || 1)));
    qtyById.set(it.listingId, q);
  }

  const listings = await prisma.productListing.findMany({
    where: { id: { in: [...qtyById.keys()] }, available: true },
    select: {
      id: true,
      title: true,
      price: true,
      unit: true,
      currency: true,
      producer: {
        select: {
          id: true,
          farmName: true,
          stripeAccountId: true,
          stripeChargesEnabled: true,
        },
      },
    },
  });

  // Само продукти на производители, приемащи карти
  const payable = listings.filter(
    (l) => l.producer.stripeChargesEnabled && l.producer.stripeAccountId,
  );
  if (payable.length === 0) {
    return NextResponse.json(
      { error: "Няма продукти с плащане с карта." },
      { status: 400 },
    );
  }

  const currency = (payable[0].currency || "BGN").toLowerCase();

  const line_items = payable.map((l) => ({
    quantity: qtyById.get(l.id) ?? 1,
    price_data: {
      currency,
      unit_amount: Math.round(l.price * 100),
      product_data: { name: `${l.title} (${l.unit})` },
    },
  }));

  // Компактен списък продукт:количество — webhook-ът преизчислява по база
  const lst = payable.map((l) => `${l.id}:${qtyById.get(l.id) ?? 1}`).join(",");

  const session = await auth();
  const site = getSiteUrl();
  const transferGroup = `grp_${randomUUID()}`;

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      shipping_address_collection: { allowed_countries: ["BG"] },
      phone_number_collection: { enabled: true },
      payment_intent_data: {
        transfer_group: transferGroup,
        metadata: { kind: "combined" },
      },
      customer_email: session?.user?.email ?? undefined,
      success_url: `${site}/plateno?session_id={CHECKOUT_SESSION_ID}&combined=1`,
      cancel_url: `${site}/koshnitsa`,
      metadata: {
        kind: "combined",
        customerId: session?.user?.id ?? "",
        transferGroup,
        lst,
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Грешка при плащането." },
      { status: 500 },
    );
  }
}
