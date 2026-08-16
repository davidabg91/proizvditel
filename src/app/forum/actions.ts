"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { forumTopicSchema, forumReplySchema, type ForumTopicInput } from "@/lib/validators";
import { uniqueTopicSlug } from "@/lib/slug";

export type TopicResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };
export type ReplyResult = { ok: true } | { ok: false; error: string };

export async function createTopic(input: ForumTopicInput): Promise<TopicResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Изисква се вход." };

  const parsed = forumTopicSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };

  const slug = await uniqueTopicSlug(parsed.data.title);
  await prisma.forumTopic.create({
    data: {
      title: parsed.data.title,
      category: parsed.data.category,
      body: parsed.data.body,
      slug,
      authorId: session.user.id,
    },
  });

  revalidatePath("/forum");
  return { ok: true, slug };
}

export async function createReply(
  topicId: string,
  body: string,
): Promise<ReplyResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Изисква се вход." };

  const parsed = forumReplySchema.safeParse({ body });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };

  const topic = await prisma.forumTopic.findUnique({
    where: { id: topicId },
    select: { id: true, slug: true },
  });
  if (!topic) return { ok: false, error: "Темата не е намерена." };

  await prisma.$transaction([
    prisma.forumPost.create({
      data: { topicId, authorId: session.user.id, body: parsed.data.body },
    }),
    prisma.forumTopic.update({
      where: { id: topicId },
      data: { lastReplyAt: new Date() },
    }),
  ]);

  revalidatePath(`/forum/${topic.slug}`);
  revalidatePath("/forum");
  return { ok: true };
}
