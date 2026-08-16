"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { blogPostSchema, type BlogPostInput } from "@/lib/validators";
import { uniqueBlogSlug } from "@/lib/slug";

export type ActionResult =
  | { ok: true; slug?: string }
  | { ok: false; error: string };

function data(d: BlogPostInput) {
  return {
    title: d.title.trim(),
    category: d.category,
    excerpt: d.excerpt || null,
    body: d.body,
    coverUrl: d.coverUrl || null,
    published: d.published,
  };
}

export async function createPost(input: BlogPostInput): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Изисква се вход." };
  if (session.user.role !== "producer" && session.user.role !== "admin")
    return { ok: false, error: "Само производители могат да пишат статии." };

  const parsed = blogPostSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };

  const slug = await uniqueBlogSlug(parsed.data.title);
  await prisma.blogPost.create({
    data: { ...data(parsed.data), slug, authorId: session.user.id },
  });

  revalidatePath("/blog");
  revalidatePath("/tablo/blog");
  return { ok: true, slug };
}

export async function updatePost(
  id: string,
  input: BlogPostInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Изисква се вход." };

  const parsed = blogPostSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };

  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { authorId: true, slug: true },
  });
  if (!post || post.authorId !== session.user.id)
    return { ok: false, error: "Няма достъп." };

  await prisma.blogPost.update({ where: { id }, data: data(parsed.data) });
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/tablo/blog");
  return { ok: true, slug: post.slug };
}

export async function deletePost(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Изисква се вход." };

  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!post || post.authorId !== session.user.id)
    return { ok: false, error: "Няма достъп." };

  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/blog");
  revalidatePath("/tablo/blog");
  return { ok: true };
}
