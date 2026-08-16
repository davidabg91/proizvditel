import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
      },
      select: { id: true, title: true, price: true, unit: true, currency: true },
    });

    if (listings.length === 0) {
      return NextResponse.json(
        { error: "Избраните продукти вече не са налични." },
        { status: 400 },
      );
    }

    const currency = (listings[0].currency || "BGN").toLowerCase();
    const itemsData = listings.map((l) => ({
      title: `${l.title} (${l.unit})`,
      unitPrice: Math.round(l.price * 100),
      qty: qtyById.get(l.id) ?? 1,
    }));

    const amountTotal = itemsData.reduce((s, it) => s + it.unitPrice * it.qty, 0);
    const session = await auth();

    const fullAddress = [
      shippingAddress.trim(),
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
        currency,
        paymentMethod: "cod",
        paymentStatus: "pending",
        status: "pending",
        customerName: customerName.trim(),
        email: email?.trim() || session?.user?.email || null,
        phone: phone.trim(),
        shippingAddress: fullAddress,
        fulfillmentStatus: "new",
        items: { create: itemsData },
      },
    });

    if (session?.user?.id) {
      await prisma.purchase
        .upsert({
          where: {
            producerId_customerId: { producerId: producer.id, customerId: session.user.id },
          },
          create: { producerId: producer.id, customerId: session.user.id },
          update: {},
        })
        .catch(() => {});

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
            body: `🛒 Нова поръчка с наложен платеж (№ ${order.id.slice(-6).toUpperCase()}):\n${itemsText}\n\nОбща сума: ${(amountTotal / 100).toFixed(2)} лв.\nДоставка до: ${shippingAddress.trim()}${note?.trim() ? `\nБележка: ${note.trim()}` : ""}\nТелефон: ${phone.trim()}`,
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
