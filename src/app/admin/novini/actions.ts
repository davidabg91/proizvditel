"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/admin";
import { newsItemSchema, type NewsItemInput } from "@/lib/validators";
import { slugify } from "@/lib/utils";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Уникален slug — при съвпадение добавя номер. */
async function uniqueSlug(title: string, ignoreId?: string): Promise<string> {
  const base = slugify(title) || "novina";
  let slug = base;
  for (let i = 2; i < 60; i++) {
    const existing = await prisma.newsItem.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === ignoreId) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/** Празен низ означава „няма дата", а не невалидна дата. */
function toDate(value?: string): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function refresh(slug?: string) {
  revalidatePath("/novini");
  revalidatePath("/admin/novini");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/novini/${slug}`);
}

function data(d: NewsItemInput) {
  return {
    title: d.title.trim(),
    summary: d.summary.trim(),
    body: d.body?.trim() || null,
    category: d.category,
    eventDate: toDate(d.eventDate),
    eventEndDate: toDate(d.eventEndDate),
    location: d.location?.trim() || null,
    sourceUrl: d.sourceUrl?.trim() || null,
    sourceName: d.sourceName?.trim() || null,
    coverUrl: d.coverUrl?.trim() || null,
    published: d.published,
  };
}

export async function createNewsItem(input: NewsItemInput): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Няма достъп." };

  const parsed = newsItemSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };

  try {
    const slug = await uniqueSlug(parsed.data.title);
    await prisma.newsItem.create({
      data: { ...data(parsed.data), slug, authorId: admin.id },
    });
    refresh(slug);
    return { ok: true };
  } catch (error) {
    console.error("createNewsItem error:", error);
    return { ok: false, error: "Грешка при записа." };
  }
}

export async function updateNewsItem(
  id: string,
  input: NewsItemInput,
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Няма достъп." };

  const parsed = newsItemSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };

  try {
    const slug = await uniqueSlug(parsed.data.title, id);
    const item = await prisma.newsItem.update({
      where: { id },
      data: { ...data(parsed.data), slug },
    });
    refresh(item.slug);
    return { ok: true };
  } catch (error) {
    console.error("updateNewsItem error:", error);
    return { ok: false, error: "Грешка при редакцията." };
  }
}

export async function deleteNewsItem(id: string): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: "Няма достъп." };

  try {
    await prisma.newsItem.delete({ where: { id } });
    refresh();
    return { ok: true };
  } catch (error) {
    console.error("deleteNewsItem error:", error);
    return { ok: false, error: "Грешка при изтриване." };
  }
}
