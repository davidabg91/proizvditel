import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/product/listing-card";
import { getDeliveryGroup } from "@/lib/shared-delivery";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ town: string }>;
}): Promise<Metadata> {
  const { town } = await params;
  return { title: `Съвместна доставка · ${decodeURIComponent(town)}` };
}

export default async function TownGroupPage({
  params,
}: {
  params: Promise<{ town: string }>;
}) {
  const { town: raw } = await params;
  const town = decodeURIComponent(raw);

  // Групата може да събира стопанства от няколко села — взимаме я цялата,
  // а не само тези, чийто град съвпада буквално с адреса.
  const group = await getDeliveryGroup(town);
  if (!group) notFound();

  const producers = await prisma.producer.findMany({
    where: { slug: { in: group.producers.map((p) => p.slug) } },
    orderBy: { farmName: "asc" },
    select: {
      slug: true,
      farmName: true,
      town: true,
      region: true,
      logoUrl: true,
      listings: {
        where: { available: true },
        orderBy: [{ soldOut: "asc" }, { createdAt: "desc" }],
        include: { photos: { orderBy: { sort: "asc" }, take: 1 } },
      },
    },
  });

  if (producers.length < 2) notFound();

  const region = group.region;

  return (
    <main className="container-page py-12">
      <Link
        href="/savmestno"
        className="text-sm font-medium text-muted-foreground hover:text-primary"
      >
        ← Всички групи
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
          {group.title}
        </h1>
        <Badge tone="success">Съвместна доставка</Badge>
        {group.connected ? <Badge tone="primary">Свързани партньори</Badge> : null}
      </div>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {producers.length} стопанства изпращат продукцията си заедно
        {group.towns.length > 0 ? ` — ${group.towns.join(", ")}` : ""}
        {region && group.towns.length === 0 ? ` (${region})` : ""}. Изберете
        продукти от различни стопанства и се свържете с тях — доставката може да е
        една обща.
      </p>

      <div className="mt-6 rounded-[var(--radius-lg)] border border-primary/25 bg-primary-soft/50 p-5 text-sm text-foreground/90">
        <p className="font-semibold text-primary">Как става?</p>
        <p className="mt-1">
          Изберете продукти от стопанствата по-долу и пишете на производителите
          през платформата. Те се координират помежду си кога и къде да изпратят
          стоката заедно, за да платите една доставка.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-12">
        {producers.map((p) => (
          <section key={p.slug}>
            <div className="flex items-center justify-between gap-3">
              <Link href={`/p/${p.slug}`} className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-surface-muted font-serif text-lg font-semibold text-primary">
                  {p.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    p.farmName.charAt(0)
                  )}
                </span>
                <span className="text-lg font-semibold hover:text-primary">
                  {p.farmName}
                </span>
              </Link>
              <div className="flex gap-2">
                <Button href={`/p/${p.slug}`} variant="ghost" size="sm">
                  Профил
                </Button>
                <Button href={`/chat/${p.slug}`} variant="outline" size="sm">
                  Пиши
                </Button>
              </div>
            </div>

            {p.listings.length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {p.listings.slice(0, 8).map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={{
                      id: l.id,
                      slug: l.slug,
                      title: l.title,
                      price: l.price,
                      oldPrice: l.oldPrice,
                      unit: l.unit,
                      currency: l.currency,
                      isOffer: l.isOffer,
                      available: l.available,
                      soldOut: l.soldOut,
                      boostedUntil: l.boostedUntil,
                      category: l.category,
                      imageUrl: l.photos[0]?.url ?? null,
                      producer: {
                        slug: p.slug,
                        farmName: p.farmName,
                        town: p.town,
                        region: p.region,
                      },
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Няма активни обяви в момента.
              </p>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
