import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BLOG_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Блог",
  description:
    "Полезното за продуктите — ползи, качества, съвети, сезонност и рецепти от българските производители.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();

  const where: Prisma.BlogPostWhereInput = { published: true };
  if (sp.category && BLOG_CATEGORIES.includes(sp.category as never)) {
    where.category = sp.category;
  }

  const posts = await prisma.blogPost.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      author: {
        select: { name: true, producer: { select: { slug: true, farmName: true } } },
      },
    },
  });

  const [featured, ...rest] = posts;

  return (
    <main className="container-page py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Блог</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">Полезното за продуктите</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Ползи и качества на храните, съвети за отглеждане и съхранение,
            сезонност и рецепти — от хората, които ги произвеждат.
          </p>
        </div>
        {session?.user?.role === "producer" ? (
          <Button href="/tablo/blog">Напиши статия</Button>
        ) : null}
      </div>

      {/* Категории */}
      <div className="mt-8 flex flex-wrap gap-2">
        <Chip label="Всички" href="/blog" active={!sp.category} />
        {BLOG_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={c}
            href={`/blog?category=${encodeURIComponent(c)}`}
            active={sp.category === c}
          />
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-16 text-center">
          <p className="text-lg font-medium">Още няма статии тук</p>
          <p className="mt-1 text-muted-foreground">Очаквайте скоро полезно съдържание.</p>
        </div>
      ) : (
        <>
          {/* Акцент */}
          {featured ? (
            <Link
              href={`/blog/${featured.slug}`}
              className="group mt-8 grid overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm transition-all hover:shadow-md md:grid-cols-2"
            >
              <div className="aspect-[16/10] overflow-hidden bg-surface-muted md:aspect-auto">
                {featured.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featured.coverUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/15 via-accent/10 to-transparent" />
                )}
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-8">
                <Badge tone="accent" className="w-fit">{featured.category}</Badge>
                <h2 className="mt-3 font-serif text-2xl font-semibold group-hover:text-primary sm:text-3xl">
                  {featured.title}
                </h2>
                {featured.excerpt ? (
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {featured.excerpt}
                  </p>
                ) : null}
                <p className="mt-4 text-sm text-muted-foreground">
                  {featured.author.producer?.farmName ?? featured.author.name} ·{" "}
                  {formatDate(featured.createdAt)}
                </p>
              </div>
            </Link>
          ) : null}

          {/* Останалите */}
          {rest.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-surface-muted">
                    {p.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.coverUrl}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/15 via-accent/10 to-transparent" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-xs font-medium uppercase tracking-wide text-accent">
                      {p.category}
                    </span>
                    <h3 className="mt-1 line-clamp-2 font-semibold leading-snug group-hover:text-primary">
                      {p.title}
                    </h3>
                    {p.excerpt ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {p.excerpt}
                      </p>
                    ) : null}
                    <p className="mt-auto pt-4 text-xs text-muted-foreground">
                      {p.author.producer?.farmName ?? p.author.name} ·{" "}
                      {formatDate(p.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}

function Chip({ label, href, active }: { label: string; href: string; active: boolean }) {
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
