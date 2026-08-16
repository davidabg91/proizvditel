import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthorLine } from "@/components/forum/author-line";
import { formatRelative } from "@/lib/utils";
import { ReplyForm } from "./reply-form";

const authorSelect = {
  select: { name: true, role: true, producer: { select: { slug: true } } },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = await prisma.forumTopic.findUnique({
    where: { slug },
    select: { title: true },
  });
  return { title: topic?.title ?? "Тема" };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const topic = await prisma.forumTopic.findUnique({
    where: { slug },
    include: {
      author: authorSelect,
      posts: {
        orderBy: { createdAt: "asc" },
        include: { author: authorSelect },
      },
    },
  });
  if (!topic) notFound();

  await prisma.forumTopic.update({
    where: { id: topic.id },
    data: { views: { increment: 1 } },
  });

  const session = await auth();

  return (
    <main className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/forum"
          className="text-sm font-medium text-muted-foreground hover:text-primary"
        >
          ← Към форума
        </Link>

        <div className="mt-4">
          <Badge tone="accent">{topic.category}</Badge>
          <h1 className="mt-3 font-serif text-3xl font-semibold">{topic.title}</h1>
        </div>

        {/* Начално съобщение */}
        <article className="mt-6 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <div className="flex items-center justify-between gap-3">
            <AuthorLine author={topic.author} meta={formatRelative(topic.createdAt)} />
          </div>
          <p className="mt-4 whitespace-pre-wrap leading-relaxed text-foreground/90">
            {topic.body}
          </p>
        </article>

        {/* Отговори */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">
            {topic.posts.length}{" "}
            {topic.posts.length === 1 ? "отговор" : "отговора"}
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            {topic.posts.map((post) => (
              <article
                key={post.id}
                className="rounded-[var(--radius-lg)] border border-border bg-surface p-5"
              >
                <AuthorLine author={post.author} meta={formatRelative(post.createdAt)} />
                <p className="mt-3 whitespace-pre-wrap leading-relaxed text-foreground/90">
                  {post.body}
                </p>
              </article>
            ))}
          </div>
        </div>

        {/* Форма за отговор */}
        <div className="mt-8">
          {session?.user ? (
            <ReplyForm topicId={topic.id} />
          ) : (
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface-muted/60 p-6 text-center">
              <p className="text-muted-foreground">
                Влезте, за да участвате в разговора.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Button href={`/vhod?next=/forum/${slug}`}>Вход</Button>
                <Button href="/registraciya/kupuvach" variant="outline">
                  Регистрация
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
