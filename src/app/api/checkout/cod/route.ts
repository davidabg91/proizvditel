import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SITE_CURRENCY, platformFee } from "@/lib/stripe";
import { allowIp } from "@/lib/rate-limit";
import { notifyProducerNewOrder } from "@/lib/email";

type IncomingItem = { listingId: string; qty: number };

export async function POST(req: Request) {
  try {
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
      return NextResponse.json({ error: "Липсват продукти в поръчката." }, { status: 400 });
    }

    // Поръчката с наложен платеж не минава през плащане, затова е лесна
    // мишена за фалшиви заявки. Пазим се с лимит по адрес и по телефон.
    if (!(await allowIp("cod", 10, 60 * 60_000))) {
      return NextResponse.json(
        { error: "Изпратихте много поръчки за кратко време. Опитайте по-късно." },
        { status: 429 },
      );
    }

    if (!customerName?.trim()) {
      return NextResponse.json({ error: "Моля, въведете име и фамилия." }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: "Моля, въведете телефон за връзка." }, { status: 400 });
    }
    if (!shippingAddress?.trim()) {
      return NextResponse.json(
        { error: "Моля, въведете адрес за доставка или офис на куриер." },
        { status: 400 },
      );
    }

    const name = customerName.trim();
    const phoneClean = phone.trim();
    const phoneDigits = phoneClean.replace(/\D/g, "");
    const address = shippingAddress.trim();
    if (name.length < 3 || name.length > 120) {
      return NextResponse.json({ error: "Въведете име и фамилия." }, { status: 400 });
    }
    if (phoneDigits.length < 9 || phoneDigits.length > 15 || phoneClean.length > 30) {
      return NextResponse.json(
        { error: "Въведете валиден телефон, напр. 0888 123 456." },
        { status: 400 },
      );
    }
    if (address.length < 5 || address.length > 300) {
      return NextResponse.json(
        { error: "Въведете пълен адрес или офис на куриер." },
        { status: 400 },
      );
    }
    if ((note?.length ?? 0) > 500) {
      return NextResponse.json({ error: "Бележката е твърде дълга." }, { status: 400 });
    }
    const emailClean = email?.trim() ?? "";
    if (emailClean && (emailClean.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean))) {
      return NextResponse.json({ error: "Невалиден имейл." }, { status: 400 });
    }

    // Не повече от 3 поръчки с един телефон за час — спира масовото пускане.
    const recentSamePhone = await prisma.order.count({
      where: {
        paymentMethod: "cod",
        phone: phoneClean,
        createdAt: { gt: new Date(Date.now() - 60 * 60_000) },
      },
    });
    if (recentSamePhone >= 3) {
      return NextResponse.json(
        { error: "С този телефон вече има няколко нови поръчки. Изчакайте производителя да се свърже с вас." },
        { status: 429 },
      );
    }

    const producer = await prisma.producer.findUnique({
      where: { slug: producerSlug },
      select: {
        id: true,
        farmName: true,
        slug: true,
        payment: { select: { acceptsCod: true } },
      },
    });

    if (!producer) {
      return NextResponse.json({ error: "Стопанството не е намерено." }, { status: 404 });
    }

    if (producer.payment && !producer.payment.acceptsCod) {
      return NextResponse.json(
        { error: "Този производител не приема наложен платеж." },
        { status: 400 },
      );
    }

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
      return NextResponse.json(
        { error: "Избраните продукти вече не са налични." },
        { status: 400 },
      );
    }

    const currency = SITE_CURRENCY;
    const itemsData = listings.map((l) => ({
      title: `${l.title} (${l.unit})`,
      unitPrice: Math.round(l.price * 100),
      qty: qtyById.get(l.id) ?? 1,
    }));

    const amountTotal = itemsData.reduce((s, it) => s + it.unitPrice * it.qty, 0);
    const session = await auth();

    const fullAddress = [
      address,
      note?.trim() ? `Бележка: ${note.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const order = await prisma.order.create({
      data: {
        producerId: producer.id,
        customerId: session?.user?.id || null,
        stripeSessionId: `cod_${randomUUID()}`,
        amountTotal,
        applicationFee: 0,
        // Не се събира — записва се само за да се вижда изпуснатият приход.
        notionalFee: platformFee(amountTotal),
        currency,
        paymentMethod: "cod",
        paymentStatus: "pending",
        status: "pending",
        customerName: name,
        email: emailClean || session?.user?.email || null,
        phone: phoneClean,
        shippingAddress: fullAddress,
        fulfillmentStatus: "new",
        items: { create: itemsData },
      },
    });

    // Правото на „потвърден“ отзив НЕ се дава тук: поръчката с наложен
    // платеж още не е платена и може да е фалшива. Дава се, когато
    // производителят я отбележи като доставена (tablo/porachki/actions.ts).

    await notifyProducerNewOrder(order.id).catch((e) =>
      console.error("notifyProducerNewOrder error:", e),
    );

    if (session?.user?.id) {
      // Автоматично изпращаме съобщение в чата между клиента и производителя
      try {
        const conv = await prisma.conversation.upsert({
          where: {
            producerId_customerId: { producerId: producer.id, customerId: session.user.id },
          },
          create: { producerId: producer.id, customerId: session.user.id },
          update: { lastMessageAt: new Date() },
        });

        const itemsText = itemsData.map((it) => `• ${it.title} × ${it.qty}`).join("\n");
        await prisma.message.create({
          data: {
            conversationId: conv.id,
            senderId: session.user.id,
            body: `🛒 Нова поръчка с наложен платеж (№ ${order.id.slice(-6).toUpperCase()}):\n${itemsText}\n\nОбща сума: ${(amountTotal / 100).toFixed(2)} €\nДоставка до: ${address}${note?.trim() ? `\nБележка: ${note.trim()}` : ""}\nТелефон: ${phoneClean}`,
          },
        });
      } catch (convErr) {
        console.error("Error creating conversation message for COD order:", convErr);
      }
    }

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      producerSlug: producer.slug,
    });
  } catch (error) {
    console.error("COD checkout error:", error);
    return NextResponse.json(
      { error: "Възникна грешка при обработка на поръчката." },
      { status: 500 },
    );
  }
}
