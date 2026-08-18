import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FORUM_CATEGORIES } from "@/lib/constants";
import { formatRelative } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  alternates: { canonical: "/forum" },
  title: "Форум",
  description:
    "Общност на българските земеделски производители — въпроси, съвети и обмяна на опит.",
};

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();

  const where: Prisma.ForumTopicWhereInput = {};
  if (sp.category && FORUM_CATEGORIES.includes(sp.category as never)) {
    where.category = sp.category;
  }

  const topics = await prisma.forumTopic.findMany({
    where,
    orderBy: { lastReplyAt: "desc" },
    take: 50,
    include: {
      author: {
        select: { name: true, role: true, producer: { select: { slug: true } } },
      },
      _count: { select: { posts: true } },
    },
  });

  return (
    <main className="container-page py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Общност</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">Форум</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Задавайте въпроси, споделяйте опит и си помагайте — за всичко, свързано
            със земеделието и продукцията.
          </p>
        </div>
        <Button href={session?.user ? "/forum/nova" : "/vhod?next=/forum/nova"}>
          Нова тема
        </Button>
      </div>

      {/* Категории */}
      <div className="mt-8 flex flex-wrap gap-2">
        <CategoryChip label="Всички" href="/forum" active={!sp.category} />
        {FORUM_CATEGORIES.map((c) => (
          <CategoryChip
            key={c}
            label={c}
            href={`/forum?category=${encodeURIComponent(c)}`}
            active={sp.category === c}
          />
        ))}
      </div>

      {/* Теми */}
      {topics.length > 0 ? (
        <ul className="mt-6 divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          {topics.map((t) => (
            <li key={t.id}>
              <Link
                href={`/forum/${t.slug}`}
                className="flex items-start justify-between gap-4 p-5 transition-colors hover:bg-surface-muted"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="accent">{t.category}</Badge>
                  </div>
                  <h2 className="mt-2 font-semibold leading-snug text-foreground">
                    {t.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.author.name} · последна активност {formatRelative(t.lastReplyAt)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-serif text-xl font-semibold text-foreground">
                    {t._count.posts}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t._count.posts === 1 ? "отговор" : "отговора"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-16 text-center">
          <p className="text-lg font-medium">Още няма теми тук</p>
          <p className="mt-1 text-muted-foreground">
            Бъдете първият, който ще започне разговор.
          </p>
          <Button
            href={session?.user ? "/forum/nova" : "/vhod?next=/forum/nova"}
            className="mt-5"
          >
            Създай тема
          </Button>
        </div>
      )}
    </main>
  );
}

function CategoryChip({
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
      className={[
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border-strong bg-surface text-foreground hover:border-primary hover:text-primary",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
