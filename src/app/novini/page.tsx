import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { NEWS_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Новини и събития за земеделски производители",
  description:
    "Изложения, панаири, обучения, програми и субсидии за българските земеделски стопанства. Какво предстои и къде.",
  alternates: { canonical: "/novini" },
};

/** Началото на днешния ден — събитие днес още е предстоящо. */
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const category = NEWS_CATEGORIES.find((c) => c === sp.category);
  const today = startOfToday();

  const [upcoming, rest] = await Promise.all([
    // Предстоящи събития — подредени по това кое идва най-скоро
    prisma.newsItem.findMany({
      where: {
        published: true,
        eventDate: { gte: today },
        ...(category ? { category } : {}),
      },
      orderBy: { eventDate: "asc" },
      take: 20,
    }),
    // Всичко останало — новини без дата и отминали събития
    prisma.newsItem.findMany({
      where: {
        published: true,
        OR: [{ eventDate: null }, { eventDate: { lt: today } }],
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const total = upcoming.length + rest.length;

  return (
    <main className="container-page py-12">
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow">Новини</p>
        <h1 className="mt-2 text-3xl sm:text-4xl">Новини и събития</h1>
        <p className="mt-2 text-muted-foreground">
          Изложения, панаири, обучения и програми за българските земеделски
          стопанства — какво предстои и къде.
        </p>
      </div>

      {/* Филтри по категория */}
      <div className="mb-8 flex flex-wrap gap-2">
        <FilterChip label="Всички" href="/novini" active={!category} />
        {NEWS_CATEGORIES.map((c) => (
          <FilterChip
            key={c}
            label={c}
            href={`/novini?category=${encodeURIComponent(c)}`}
            active={category === c}
          />
        ))}
      </div>

      {total === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-16 text-center">
          <p className="text-lg font-medium">Още няма публикувани новини</p>
          <p className="mt-1 text-muted-foreground">
            Тук ще намирате предстоящи изложения, обучения и програми за
            земеделски производители.
          </p>
          <Link
            href="/forum"
            className="mt-4 inline-block font-medium text-primary hover:underline"
          >
            Междувременно вижте какво се обсъжда във форума →
          </Link>
        </div>
      ) : null}

      {upcoming.length > 0 ? (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">Предстоящи</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((item) => (
              <NewsCard key={item.id} item={item} upcoming />
            ))}
          </div>
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section>
          {upcoming.length > 0 ? (
            <h2 className="mb-4 text-xl font-semibold">Останали новини</h2>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
          : "rounded-full border border-border-strong px-4 py-1.5 text-sm font-medium text-foreground/80 hover:border-primary hover:text-primary"
      }
    >
      {label}
    </Link>
  );
}

type Item = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  eventDate: Date | null;
  eventEndDate: Date | null;
  location: string | null;
  coverUrl: string | null;
  createdAt: Date;
};

function NewsCard({ item, upcoming }: { item: Item; upcoming?: boolean }) {
  const dates = item.eventDate
    ? item.eventEndDate && item.eventEndDate > item.eventDate
      ? `${formatDate(item.eventDate)} — ${formatDate(item.eventEndDate)}`
      : formatDate(item.eventDate)
    : null;

  return (
    <Link
      href={`/novini/${item.slug}`}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {item.coverUrl ? (
        <div className="aspect-[16/9] overflow-hidden bg-surface-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={upcoming ? "primary" : "neutral"}>{item.category}</Badge>
          {upcoming ? <Badge tone="success">Предстои</Badge> : null}
        </div>

        <h3 className="mt-2 font-semibold leading-snug group-hover:text-primary">
          {item.title}
        </h3>

        {dates || item.location ? (
          <p className="mt-1.5 text-sm font-medium text-accent">
            {[dates, item.location].filter(Boolean).join(" · ")}
          </p>
        ) : null}

        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {item.summary}
        </p>

        {!item.eventDate ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {formatDate(item.createdAt)}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
