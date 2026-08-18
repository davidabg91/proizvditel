import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatRelative } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const [
    users,
    customers,
    producers,
    bannedUsers,
    publishedProducers,
    stripeProducers,
    listings,
    reviews,
    openReports,
    orderAgg,
    visitsAgg,
    recentOrders,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.producer.count(),
    prisma.user.count({ where: { banned: true } }),
    prisma.producer.count({ where: { published: true } }),
    prisma.producer.count({ where: { stripeChargesEnabled: true } }),
    prisma.productListing.count(),
    prisma.review.count(),
    prisma.report.count({ where: { status: "open" } }),
    prisma.order.aggregate({
      _count: true,
      _sum: { amountTotal: true, applicationFee: true },
    }),
    prisma.producer.aggregate({ _sum: { visits: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { producer: { select: { farmName: true, slug: true } } },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, role: true, banned: true, createdAt: true },
    }),
  ]);

  const revenue = (orderAgg._sum.amountTotal ?? 0) / 100;
  const fees = (orderAgg._sum.applicationFee ?? 0) / 100;

  const stats = [
    { label: "Потребители", value: users, sub: `${customers} купувачи` },
    { label: "Производители", value: producers, sub: `${publishedProducers} активни` },
    { label: "Обяви", value: listings },
    { label: "Поръчки (карта)", value: orderAgg._count },
    { label: "Оборот", value: formatPrice(revenue) },
    { label: "Комисиони (5%)", value: formatPrice(fees) },
    { label: "Посещения", value: visitsAgg._sum.visits ?? 0 },
    { label: "Оценки", value: reviews },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">Админ преглед</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Общ поглед върху активността в платформата.
        </p>
      </div>

      {/* Проблеми */}
      {openReports > 0 || bannedUsers > 0 ? (
        <div className="mb-6 flex flex-wrap gap-3">
          {openReports > 0 ? (
            <Link
              href="/admin/dokladi"
              className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-2 text-sm font-semibold text-danger"
            >
              {openReports} нови доклада за преглед →
            </Link>
          ) : null}
          {bannedUsers > 0 ? (
            <span className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2 text-sm text-muted-foreground">
              {bannedUsers} блокирани потребители
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Статистики */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-5"
          >
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-serif text-2xl font-semibold">{s.value}</p>
            {s.sub ? <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p> : null}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Последни поръчки */}
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Последни поръчки</h2>
            <Link href="/admin/porachki" className="text-sm text-primary hover:underline">
              Всички
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Още няма поръчки.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.producer.farmName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelative(o.createdAt)} · {o.fulfillmentStatus}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium">
                    {formatPrice(o.amountTotal / 100)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Последни регистрации */}
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Нови регистрации</h2>
            <Link href="/admin/potrebiteli" className="text-sm text-primary hover:underline">
              Всички
            </Link>
          </div>
          <ul className="flex flex-col divide-y divide-border">
            {recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {u.banned ? <Badge tone="danger">Блокиран</Badge> : null}
                  <Badge tone={u.role === "producer" ? "primary" : "neutral"}>
                    {u.role === "producer" ? "Производител" : u.role === "admin" ? "Админ" : "Купувач"}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
