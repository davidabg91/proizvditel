import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

/** Генерира уникален slug за производител на база име на стопанството. */
export async function uniqueProducerSlug(name: string): Promise<string> {
  const base = slugify(name) || "stopanstvo";
  let slug = base;
  let n = 1;
  // Опитваме base, base-2, base-3, ...
  while (await prisma.producer.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

/** Генерира уникален slug за блог статия. */
export async function uniqueBlogSlug(title: string): Promise<string> {
  const base = slugify(title) || "statia";
  let slug = base;
  let n = 1;
  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

/** Генерира уникален slug за форум тема. */
export async function uniqueTopicSlug(title: string): Promise<string> {
  const base = slugify(title) || "tema";
  let slug = base;
  let n = 1;
  while (await prisma.forumTopic.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

/** Генерира уникален slug за обява в рамките на един производител. */
export async function uniqueListingSlug(
  producerId: string,
  title: string,
): Promise<string> {
  const base = slugify(title) || "produkt";
  let slug = base;
  let n = 1;
  while (
    await prisma.productListing.findUnique({
      where: { producerId_slug: { producerId, slug } },
    })
  ) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}
