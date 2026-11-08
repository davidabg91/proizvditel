import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site";
import { getDeliveryGroups } from "@/lib/shared-delivery";
import { CATEGORY_LANDINGS, regionLandingFor } from "@/lib/seo-landing";

// Генерира се при всяка заявка. С `revalidate` картата оставаше замразена от
// последното качване (на живо беше на 2+ дни и без новите стопанства);
// търсачките я теглят рядко, а заявките са няколко леки SELECT-а.
export const dynamic = "force-dynamic";

/**
 * Карта на сайта. Освен статичните страници включва всички публикувани
 * профили, обяви, статии и теми във форума, за да ги открият търсачките,
 * без да разчитат само на вътрешните връзки.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${site}/`, changeFrequency: "daily", priority: 1 },
    { url: `${site}/za-proizvoditeli`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${site}/katalog`, changeFrequency: "daily", priority: 0.9 },
    ...CATEGORY_LANDINGS.map((c) => ({
      url: `${site}/katalog/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    { url: `${site}/proizvoditeli`, changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/savmestno`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${site}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${site}/forum`, changeFrequency: "daily", priority: 0.6 },
    { url: `${site}/novini`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${site}/kak-raboti`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${site}/za-nas`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site}/kontakti`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${site}/usloviya`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site}/poveritelnost`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site}/biskvitki`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site}/otkaz-ot-dogovor`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const [producers, listings, posts, topics, groups, news, regions] = await Promise.all([
      prisma.producer.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.productListing.findMany({
        where: { available: true, producer: { published: true } },
        select: {
          slug: true,
          updatedAt: true,
          producer: { select: { slug: true } },
        },
      }),
      prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.forumTopic.findMany({
        select: { slug: true, lastReplyAt: true },
      }),
      // Само адресите, които наистина отварят група. Преди тук влизаше всеки
      // град със стопанство със съвместна доставка, включително самотните —
      // техните страници дават 404 и нямат работа в картата на сайта.
      getDeliveryGroups(),
      prisma.newsItem.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      // Само областите със стопанства — празните са noindex.
      prisma.producer.groupBy({
        by: ["region"],
        where: { published: true, region: { not: null } },
        _max: { updatedAt: true },
      }),
    ]);

    const regionPages = regions.flatMap((r) => {
      const landing = regionLandingFor(r.region);
      return landing
        ? [
            {
              url: `${site}/proizvoditeli/${landing.slug}`,
              lastModified: r._max.updatedAt ?? undefined,
              changeFrequency: "weekly" as const,
              priority: 0.8,
            },
          ]
        : [];
    });

    return [
      ...staticPages,
      ...regionPages,
      ...producers.map((p) => ({
        url: `${site}/p/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...listings.map((l) => ({
        url: `${site}/p/${l.producer.slug}/oferta/${l.slug}`,
        lastModified: l.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...posts.map((b) => ({
        url: `${site}/blog/${b.slug}`,
        lastModified: b.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
      ...topics.map((t) => ({
        url: `${site}/forum/${t.slug}`,
        lastModified: t.lastReplyAt,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
      ...news.map((n) => ({
        url: `${site}/novini/${n.slug}`,
        lastModified: n.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      })),
      ...groups.map((g) => ({
        url: `${site}/savmestno/${encodeURIComponent(g.key)}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch (error) {
    // Без база данни връщаме поне статичните страници, вместо празна карта.
    console.error("sitemap error:", error);
    return staticPages;
  }
}
