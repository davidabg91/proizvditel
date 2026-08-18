import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { ArticleBody } from "@/components/blog/article-body";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await prisma.newsItem.findUnique({
    where: { slug },
    select: { title: true, summary: true, coverUrl: true },
  });
  if (!item) return { title: "Новината не е намерена" };

  return {
    title: item.title,
    description: item.summary,
    alternates: { canonical: `/novini/${slug}` },
    openGraph: {
      title: item.title,
      description: item.summary,
      type: "article",
      images: item.coverUrl ?? undefined,
    },
  };
}

export default async function NewsItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const item = await prisma.newsItem.findUnique({ where: { slug } });
  if (!item || !item.published) notFound();

  const dates = item.eventDate
    ? item.eventEndDate && item.eventEndDate > item.eventDate
      ? `${formatDate(item.eventDate)} — ${formatDate(item.eventEndDate)}`
      : formatDate(item.eventDate)
    : null;

  const isPast =
    item.eventDate !== null && item.eventDate < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <main className="pb-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Новини", path: "/novini" },
          { name: item.title, path: `/novini/${item.slug}` },
        ]}
      />

      {item.coverUrl ? (
        <div className="h-64 w-full overflow-hidden bg-surface-muted sm:h-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.coverUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="container-page">
        <div className="mx-auto max-w-2xl pt-10">
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link href="/novini" className="hover:text-primary">
              Новини и събития
            </Link>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">{item.category}</Badge>
            {isPast ? <Badge tone="neutral">Отминало</Badge> : null}
          </div>

          <h1 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
            {item.title}
          </h1>

          {dates || item.location ? (
            <div className="mt-4 rounded-[var(--radius-lg)] border border-accent/30 bg-accent-soft/40 px-4 py-3">
              {dates ? (
                <p className="font-semibold text-foreground">📅 {dates}</p>
              ) : null}
              {item.location ? (
                <p className="mt-0.5 text-sm text-foreground/80">📍 {item.location}</p>
              ) : null}
            </div>
          ) : null}

          <p className="mt-6 border-l-2 border-accent pl-4 text-lg leading-relaxed text-foreground/90">
            {item.summary}
          </p>

          {item.body ? <ArticleBody body={item.body} /> : null}

          {item.sourceUrl ? (
            <div className="mt-8 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
              <p className="text-sm text-muted-foreground">Източник</p>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block font-medium text-primary underline underline-offset-2 hover:text-primary-hover"
              >
                {item.sourceName || item.sourceUrl}
              </a>
              <p className="mt-2 text-xs text-muted-foreground">
                Проверявайте датите и подробностите в първоизточника — програмите
                и събитията се променят.
              </p>
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-3 border-t border-border pt-6">
            <Button href="/novini" variant="outline">
              ← Всички новини
            </Button>
            <Button href="/forum" variant="ghost">
              Обсъди във форума
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
