import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { ArticleBody } from "@/components/blog/article-body";
import { ArticleAuthorCard } from "@/components/blog/author-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, coverUrl: true, category: true },
  });
  if (!post) return { title: "Статия" };
  const description = post.excerpt ?? `${post.title} — ${post.category} от Производител.net.`;
  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description,
      type: "article",
      images: post.coverUrl ?? undefined,
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: {
        select: {
          name: true,
          producer: {
            select: {
              slug: true,
              farmName: true,
              ownerName: true,
              description: true,
              logoUrl: true,
              town: true,
              region: true,
              startedYear: true,
              urnVerified: true,
              ratingAvg: true,
              ratingCount: true,
              published: true,
              crops: { select: { name: true }, take: 6 },
              listings: {
                where: { available: true, soldOut: false },
                orderBy: [{ boostedUntil: "desc" }, { createdAt: "desc" }],
                take: 3,
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  price: true,
                  unit: true,
                  photos: { orderBy: { sort: "asc" }, take: 1, select: { url: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!post || !post.published) notFound();

  const producer = post.author.producer;
  const authorName = producer?.farmName ?? post.author.name;

  return (
    <main className="pb-20">
      <ArticleJsonLd
        title={post.title}
        description={post.excerpt}
        image={post.coverUrl}
        authorName={authorName}
        publishedAt={post.createdAt}
        updatedAt={post.updatedAt}
        path={`/blog/${post.slug}`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Блог", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ]}
      />
      {post.coverUrl ? (
        <div className="h-64 w-full overflow-hidden bg-surface-muted sm:h-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <article className="container-page py-10">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/blog"
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            ← Към блога
          </Link>

          <div className="mt-4">
            <Badge tone="accent">{post.category}</Badge>
            <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
              {post.title}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {post.author.producer ? (
                <Link
                  href={`/p/${post.author.producer.slug}`}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {authorName}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{authorName}</span>
              )}{" "}
              · {formatDate(post.createdAt)}
            </p>
          </div>

          {post.excerpt ? (
            <p className="mt-6 border-l-2 border-accent pl-4 text-lg leading-relaxed text-foreground/90">
              {post.excerpt}
            </p>
          ) : null}

          <ArticleBody body={post.body} />

          {producer && producer.published ? (
            <ArticleAuthorCard
              author={{
                farmName: producer.farmName,
                slug: producer.slug,
                ownerName: producer.ownerName,
                description: producer.description,
                logoUrl: producer.logoUrl,
                town: producer.town,
                region: producer.region,
                startedYear: producer.startedYear,
                urnVerified: producer.urnVerified,
                ratingAvg: producer.ratingAvg,
                ratingCount: producer.ratingCount,
                crops: producer.crops.map((c) => c.name),
                listings: producer.listings.map((l) => ({
                  id: l.id,
                  slug: l.slug,
                  title: l.title,
                  price: l.price,
                  unit: l.unit,
                  imageUrl: l.photos[0]?.url ?? null,
                })),
              }}
            />
          ) : null}
        </div>
      </article>
    </main>
  );
}
