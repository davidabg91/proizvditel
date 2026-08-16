import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";

export const metadata = { title: "Поръчки и плащания · Админ" };

export default async function AdminOrdersPage() {
  const [orders, agg] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { producer: { select: { farmName: true, slug: true } } },
    }),
    prisma.order.aggregate({
      _count: true,
      _sum: { amountTotal: true, applicationFee: true },
    }),
  ]);

  const revenue = (agg._sum.amountTotal ?? 0) / 100;
  const fees = (agg._sum.applicationFee ?? 0) / 100;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold sm:text-3xl">Поръчки и плащания</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Всички плащания с карта през платформата.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <p className="text-sm text-muted-foreground">Брой поръчки</p>
          <p className="mt-2 font-serif text-2xl font-semibold">{agg._count}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <p className="text-sm text-muted-foreground">Оборот</p>
          <p className="mt-2 font-serif text-2xl font-semibold">
            {formatPrice(revenue, "BGN")}
          </p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <p className="text-sm text-muted-foreground">Комисиони (5%)</p>
          <p className="mt-2 font-serif text-2xl font-semibold text-primary">
            {formatPrice(fees, "BGN")}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-12 text-center text-muted-foreground">
          Още няма поръчки.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface-muted text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Дата</th>
                <th className="px-4 py-3 font-semibold">Производител</th>
                <th className="px-4 py-3 font-semibold">Клиент</th>
                <th className="px-4 py-3 font-semibold">Сума</th>
                <th className="px-4 py-3 font-semibold">Комисиона</th>
                <th className="px-4 py-3 font-semibold">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDate(o.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/p/${o.producer.slug}`} className="font-medium hover:text-primary">
                      {o.producer.farmName}
                    </Link>
                    {o.combined ? (
                      <Badge tone="neutral" className="ml-2">Съвместна</Badge>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {o.customerName ?? o.email ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">
                    {formatPrice(o.amountTotal / 100, o.currency.toUpperCase() as "BGN" | "EUR")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatPrice(o.applicationFee / 100, o.currency.toUpperCase() as "BGN" | "EUR")}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={o.fulfillmentStatus === "delivered" ? "success" : "primary"}>
                      {o.fulfillmentStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
