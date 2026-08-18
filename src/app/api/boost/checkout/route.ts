import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, getSiteUrl } from "@/lib/stripe";
import { BOOST_CURRENCY, findBoostPlan } from "@/lib/boost";

/**
 * Създава плащане за подсилване на обява.
 * Таксата постъпва при платформата (без Connect трансфер към производителя).
 */
export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Плащанията не са конфигурирани." }, { status: 500 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Изисква се вход." }, { status: 401 });
  }

  let body: { listingId?: string; plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Невалидни данни." }, { status: 400 });
  }

  const plan = findBoostPlan(body.plan ?? "");
  if (!plan) {
    return NextResponse.json({ error: "Изберете валиден период." }, { status: 400 });
  }

  const producer = await prisma.producer.findUnique({
    where: { userId: session.user.id },
    select: { id: true, farmName: true },
  });
  if (!producer) {
    return NextResponse.json({ error: "Няма профил на стопанство." }, { status: 403 });
  }

  const listing = await prisma.productListing.findUnique({
    where: { id: body.listingId ?? "" },
    select: { id: true, title: true, producerId: true },
  });
  if (!listing || listing.producerId !== producer.id) {
    return NextResponse.json({ error: "Обявата не е намерена." }, { status: 404 });
  }

  const site = getSiteUrl();
  const amount = Math.round(plan.price * 100);

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: BOOST_CURRENCY,
            unit_amount: amount,
            product_data: {
              name: `Подсилване на обява — ${plan.label}`,
              description: listing.title,
            },
          },
        },
      ],
      customer_email: session.user.email ?? undefined,
      success_url: `${site}/tablo/produkti?boost_session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/tablo/produkti?boost=cancel`,
      metadata: {
        kind: "boost",
        listingId: listing.id,
        producerId: producer.id,
        plan: plan.code,
        days: String(plan.days),
      },
    });

    await prisma.listingBoost.create({
      data: {
        listingId: listing.id,
        producerId: producer.id,
        plan: plan.code,
        days: plan.days,
        amount,
        currency: BOOST_CURRENCY,
        stripeSessionId: checkout.id,
        status: "pending",
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (e) {
    console.error("boost checkout error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Грешка при плащането." },
      { status: 500 },
    );
  }
}
