import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { OrdersManager } from "./orders-manager";

export const metadata = { title: "Поръчки" };

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/vhod");

  const producer = await prisma.producer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!producer) redirect("/vhod");

  const orders = await prisma.order.findMany({
    where: { producerId: producer.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const rows = orders.map((o) => ({
    id: o.id,
    createdAt: o.createdAt.toISOString(),
    amountTotal: o.amountTotal,
    currency: o.currency,
    paymentMethod: o.paymentMethod ?? "card",
    combined: o.combined,
    customerName: o.customerName,
    email: o.email,
    phone: o.phone,
    shippingAddress: o.shippingAddress,
    fulfillmentStatus: o.fulfillmentStatus,
    courier: o.courier,
    trackingNote: o.trackingNote,
    items: o.items.map((i) => ({
      title: i.title,
      unitPrice: i.unitPrice,
      qty: i.qty,
    })),
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Поръчки</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Всички поръчки (с карта и наложен платеж) — какво да изпратите, до кого и с кой куриер.
          Обновявайте статуса, за да следите изпълнението.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-12 text-center">
          <p className="text-lg font-medium">Все още няма поръчки</p>
          <p className="mt-1 text-muted-foreground">
            Тук ще се появяват поръчките от клиенти, направени през сайта.
          </p>
        </div>
      ) : (
        <OrdersManager orders={rows} />
      )}
    </div>
  );
}
