import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, getSiteUrl, SITE_CURRENCY } from "@/lib/stripe";

type IncomingItem = { listingId: string; qty: number };

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe не е конфигуриран." }, { status: 500 });
  }

  let body: {
    producerSlug?: string;
    items?: IncomingItem[];
    customerName?: string;
    phone?: string;
    email?: string;
    shippingAddress?: string;
    note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Невалидни данни." }, { status: 400 });
  }

  const { producerSlug, items, customerName, phone, email, shippingAddress, note } = body;
  if (!producerSlug || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Липсват продукти." }, { status: 400 });
  }

  const producer = await prisma.producer.findUnique({
    where: { slug: producerSlug },
    select: {
      id: true,
      farmName: true,
      stripeAccountId: true,
      stripeChargesEnabled: true,
    },
  });
  if (!producer || !producer.stripeAccountId || !producer.stripeChargesEnabled) {
    return NextResponse.json(
      { error: "Този производител не приема плащане с карта." },
      { status: 400 },
    );
  }

  // Взимаме реалните цени от базата (никога от клиента)
  const qtyById = new Map<string, number>();
  for (const it of items) {
    const q = Math.max(1, Math.min(99, Math.floor(Number(it.qty) || 1)));
    qtyById.set(it.listingId, q);
  }
  const listings = await prisma.productListing.findMany({
    where: {
      id: { in: [...qtyById.keys()] },
      producerId: producer.id,
      available: true,
      soldOut: false,
    },
    select: { id: true, title: true, price: true, unit: true, currency: true },
  });
  if (listings.length === 0) {
    return NextResponse.json({ error: "Продуктите не са налични." }, { status: 400 });
  }

  const currency = SITE_CURRENCY;
  const line_items = listings.map((l) => ({
    quantity: qtyById.get(l.id) ?? 1,
    price_data: {
      currency,
      unit_amount: Math.round(l.price * 100),
      product_data: { name: `${l.title} (${l.unit})` },
    },
  }));

  const total = line_items.reduce(
    (s, li) => s + li.price_data.unit_amount * li.quantity,
    0,
  );

  const session = await auth();
  const site = getSiteUrl();

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      shipping_address_collection: { allowed_countries: ["BG"] },
      phone_number_collection: { enabled: true },
      payment_intent_data: {
        // Преводът към производителя НЕ е автоматичен — прави се чак когато
        // поръчката бъде отбелязана като „доставена" (виж lib/payout.ts).
        // Така сумата стои в баланса на платформата, докато трае рискът от
        // оспорване, за което по договора със Stripe отговаря платформата.
        transfer_group: `order_${producer.id}_${Date.now()}`,
        metadata: {
          producerId: producer.id,
          customerId: session?.user?.id ?? "",
        },
      },
      customer_email: email?.trim() || session?.user?.email || undefined,
      success_url: `${site}/plateno?session_id={CHECKOUT_SESSION_ID}&producer=${encodeURIComponent(producerSlug)}`,
      cancel_url: `${site}/koshnitsa`,
      metadata: {
        kind: "single",
        producerId: producer.id,
        producerSlug,
        customerId: session?.user?.id ?? "",
        customerName: customerName?.trim() ?? "",
        phone: phone?.trim() ?? "",
        shippingAddress: shippingAddress?.trim() ?? "",
        note: note?.trim() ?? "",
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
