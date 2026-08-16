import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProducer } from "@/lib/session";
import { getIncomingPartnerRequestCount } from "@/lib/partners";
import { getNewOrdersCount } from "@/app/tablo/porachki/actions";
import { Button } from "@/components/ui/button";

function completeness(p: {
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  region: string | null;
  phone: string | null;
  crops: unknown[];
  photos: unknown[];
  _count: { listings: number };
}) {
  const checks = [
    !!p.description,
    !!p.logoUrl,
    !!p.coverUrl,
    !!p.region,
    !!p.phone,
    p.crops.length > 0,
    p.photos.length > 0,
    p._count.listings > 0,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export default async function DashboardHome() {
  const producer = await getCurrentProducer();
  if (!producer) redirect("/vhod");

  const pct = completeness(producer);

  const stats = [
    { label: "Посещения на профила", value: producer.visits },
    { label: "Активни обяви", value: producer._count.listings },
    { label: "Култури", value: producer.crops.length },
    {
      label: "Оценка",
      value: producer.ratingCount > 0 ? producer.ratingAvg.toFixed(1) : "—",
    },
  ];

  const partnerRequests = await getIncomingPartnerRequestCount(producer.id);
  const newOrders = await getNewOrdersCount(producer.id);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Здравейте, {producer.ownerName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ето как изглежда стопанството ви в Производител.
          </p>
        </div>
        <Button href={`/p/${producer.slug}`} variant="outline" size="sm">
          Виж публичния профил
        </Button>
      </div>

      {/* Известие за нови поръчки */}
      {newOrders > 0 ? (
        <Link
          href="/tablo/porachki"
          className="mb-6 flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-primary/40 bg-primary-soft p-5 transition-colors hover:bg-primary-soft/70"
        >
          <div>
            <p className="font-semibold text-primary">
              {newOrders}{" "}
              {newOrders === 1 ? "нова поръчка" : "нови поръчки"} за обработка
            </p>
            <p className="mt-0.5 text-sm text-foreground/80">
              Вижте какво да изпратите, до кого и обновете статуса.
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-primary">Виж →</span>
        </Link>
      ) : null}

      {/* Известие за заявка за партньорство */}
      {partnerRequests > 0 ? (
        <Link
          href="/tablo/partnyori"
          className="mb-6 flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-accent/40 bg-accent-soft p-5 transition-colors hover:bg-accent-soft/70"
        >
          <div>
            <p className="font-semibold text-accent">
              {partnerRequests}{" "}
              {partnerRequests === 1
                ? "производител иска да работи с вас"
                : "производители искат да работят с вас"}
            </p>
            <p className="mt-0.5 text-sm text-foreground/80">
              Прегледайте заявките и потвърдете, за да предлагате съвместна доставка.
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-accent">Виж →</span>
        </Link>
      ) : null}

      {/* Статистика */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-5"
          >
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-serif text-3xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Попълненост на профила */}
      {pct < 100 ? (
        <div className="mt-8 rounded-[var(--radius-lg)] border border-border bg-primary-soft/60 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Завършете профила си</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                По-пълните профили печелят повече доверие и клиенти.
              </p>
            </div>
            <span className="font-serif text-3xl font-semibold text-primary">
              {pct}%
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Бързи връзки */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <QuickLink
          href="/tablo/profil"
          title="Профил на стопанството"
          text="Редактирайте данните, логото и снимката на площта."
        />
        <QuickLink
          href="/tablo/produkti"
          title="Обяви за продажба"
          text="Добавете продукти с цени, снимки и оферти."
        />
        <QuickLink
          href="/tablo/produkciya"
          title="Продукция"
          text="Опишете какво отглеждате — култури, сортове, площи."
        />
        <QuickLink
          href="/tablo/plashtania"
          title="Начини на плащане"
          text="Банков превод, Revolut или наложен платеж."
        />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  text,
}: {
  href: string;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[var(--radius-lg)] border border-border bg-surface p-5 transition-colors hover:border-primary/40 hover:bg-surface-muted"
    >
      <h3 className="font-semibold text-foreground group-hover:text-primary">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </Link>
  );
}
