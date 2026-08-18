import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { ArticleBody } from "@/components/blog/article-body";

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
        select: { name: true, producer: { select: { slug: true, farmName: true } } },
      },
    },
  });

  if (!post || !post.published) notFound();

  const authorName = post.author.producer?.farmName ?? post.author.name;

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

          {post.author.producer ? (
            <div className="mt-10 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
              <p className="text-sm text-muted-foreground">Статия от</p>
              <Link
                href={`/p/${post.author.producer.slug}`}
                className="mt-1 inline-block font-semibold hover:text-primary"
              >
                {post.author.producer.farmName}
              </Link>
            </div>
          ) : null}
        </div>
      </article>
    </main>
  );
}
