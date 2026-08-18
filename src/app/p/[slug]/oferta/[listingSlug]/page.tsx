import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductGallery } from "@/components/product/product-gallery";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { DeliveryBadges } from "@/components/product/delivery-badges";
import { ListingCard, type ListingCardData } from "@/components/product/listing-card";
import { getMutualPartners } from "@/lib/partners";
import { formatPrice } from "@/lib/utils";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

/** Полетата, които картата на обявата чете от заявката. */
type ListingRow = {
  id: string;
  slug: string;
  title: string;
  price: number;
  oldPrice: number | null;
  unit: string;
  currency: string;
  isOffer: boolean;
  available: boolean;
  soldOut: boolean;
  boostedUntil: Date | null;
  category: string | null;
  photos: { url: string }[];
};

type CardProducer = {
  slug: string;
  farmName: string;
  town: string | null;
  region: string | null;
};

function toCard(l: ListingRow, producer: CardProducer): ListingCardData {
  return {
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
    producer,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; listingSlug: string }>;
}): Promise<Metadata> {
  const { slug, listingSlug } = await params;
  const listing = await prisma.productListing.findFirst({
    where: { slug: listingSlug, producer: { slug } },
    select: {
      title: true,
      description: true,
      price: true,
      unit: true,
      producer: { select: { farmName: true, town: true } },
      photos: { orderBy: { sort: "asc" }, take: 1, select: { url: true } },
    },
  });
  if (!listing) return { title: "Обявата не е намерена" };

  const where = listing.producer.town ? ` от ${listing.producer.town}` : "";
  const description =
    listing.description?.slice(0, 160) ??
    `${listing.title} — ${listing.price.toFixed(2)} € / ${listing.unit}, директно от ${listing.producer.farmName}${where}. Поръчайте без посредник.`;

  return {
    title: listing.title,
    description,
    alternates: { canonical: `/p/${slug}/oferta/${listingSlug}` },
    openGraph: {
      title: `${listing.title} — ${listing.producer.farmName}`,
      description,
      type: "article",
      images: listing.photos[0]?.url ? [listing.photos[0].url] : undefined,
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string; listingSlug: string }>;
}) {
  const { slug, listingSlug } = await params;

  const listing = await prisma.productListing.findFirst({
    where: { slug: listingSlug, producer: { slug } },
    include: {
      photos: { orderBy: { sort: "asc" } },
      producer: {
        include: { payment: true },
      },
    },
  });

  if (!listing) notFound();
  const p = listing.producer;
  const location = [p.town, p.region].filter(Boolean).join(", ");

  const path = `/p/${p.slug}/oferta/${listing.slug}`;

  const cardProducer: CardProducer = {
    slug: p.slug,
    farmName: p.farmName,
    town: p.town,
    region: p.region,
  };

  // Останалите продукти на същото стопанство и — ако прави съвместна
  // доставка — продуктите на партньорите му. Изчерпаните и неналичните
  // отпадат: смисълът на тези редове е покупка с един клик.
  const [otherListings, partners] = await Promise.all([
    prisma.productListing.findMany({
      where: {
        producerId: p.id,
        id: { not: listing.id },
        available: true,
        soldOut: false,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { photos: { orderBy: { sort: "asc" }, take: 1 } },
    }),
    p.sharedDelivery ? getMutualPartners(p.id) : Promise.resolve([]),
  ]);

  const otherCards = otherListings.map((l) => toCard(l, cardProducer));

  const partnerCards = partners
    .flatMap((partner) =>
      partner.listings.map((l) =>
        toCard(l, {
          slug: partner.slug,
          farmName: partner.farmName,
          town: partner.town,
          region: partner.region,
        }),
      ),
    )
    .slice(0, 8);

  return (
    <main className="container-page py-10">
      <ProductJsonLd
        title={listing.title}
        description={listing.description}
        images={listing.photos.map((ph) => ph.url)}
        price={listing.price}
        unit={listing.unit}
        inStock={listing.available && !listing.soldOut}
        producerName={p.farmName}
        producerPath={`/p/${p.slug}`}
        url={path}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Каталог", path: "/katalog" },
          { name: p.farmName, path: `/p/${p.slug}` },
          { name: listing.title, path },
        ]}
      />
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/katalog" className="hover:text-primary">
          Каталог
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/p/${p.slug}`} className="hover:text-primary">
          {p.farmName}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
        <ProductGallery photos={listing.photos.map((ph) => ph.url)} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {listing.category ? <Badge tone="primary">{listing.category}</Badge> : null}
            {listing.isOffer ? <Badge tone="accent">Оферта</Badge> : null}
            {listing.soldOut ? <Badge tone="danger">Изчерпан</Badge> : null}
            {!listing.available ? <Badge tone="neutral">Не е налично</Badge> : null}
          </div>

          <h1 className="mt-3 font-serif text-3xl font-semibold">{listing.title}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-serif text-3xl font-semibold text-primary">
              {formatPrice(listing.price)}
            </span>
            <span className="text-muted-foreground">/ {listing.unit}</span>
            {listing.oldPrice && listing.oldPrice > listing.price ? (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(listing.oldPrice)}
              </span>
            ) : null}
          </div>

          {listing.stockNote ? (
            <p className="mt-2 text-sm text-accent">{listing.stockNote}</p>
          ) : null}

          {listing.description ? (
            <p className="mt-5 whitespace-pre-line leading-relaxed text-foreground/90">
              {listing.description}
            </p>
          ) : null}

          {/* Производител */}
          <div className="mt-6 flex items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-surface-muted">
              {p.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-serif text-lg font-semibold text-primary">
                  {p.farmName.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/p/${p.slug}`} className="font-semibold hover:text-primary">
                {p.farmName}
              </Link>
              {location ? (
                <p className="text-sm text-muted-foreground">{location}</p>
              ) : null}
            </div>
            <Button href={`/p/${p.slug}`} variant="outline" size="sm">
              Профил
            </Button>
          </div>

          {p.sharedDelivery ? (
            <div className="mt-4 rounded-[var(--radius-lg)] border border-success/30 bg-success-soft p-4 text-sm">
              <p className="font-semibold text-success">Съвместна доставка</p>
              <p className="mt-1 text-foreground/80">
                Този производител работи заедно с други стопанства от{" "}
                {p.town ?? "своя район"}. Можете да поръчате продукти от няколко
                производители с една обща доставка.
              </p>
              {p.town ? (
                <Link
                  href={`/savmestno/${encodeURIComponent(p.town)}`}
                  className="mt-2 inline-block font-semibold text-success hover:underline"
                >
                  Виж групата за {p.town} →
                </Link>
              ) : null}
            </div>
          ) : null}

          {/* Действия */}
          <div className="mt-6 flex flex-col gap-3">
            {listing.soldOut ? (
              <div className="rounded-[var(--radius-lg)] border border-danger/30 bg-danger-soft px-4 py-4">
                <p className="font-semibold text-danger">Продуктът е изчерпан</p>
                <p className="mt-1 text-sm text-foreground/80">
                  В момента този продукт го няма и не може да бъде поръчан. Попитайте
                  производителя кога очаква нови количества.
                </p>
                <Button
                  href={`/chat/${p.slug}`}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Попитай производителя
                </Button>
              </div>
            ) : listing.available ? (
              <div className="flex gap-3">
                <AddToCartButton
                  size="md"
                  block
                  item={{
                    listingId: listing.id,
                    producerSlug: p.slug,
                    producerName: p.farmName,
                    title: listing.title,
                    price: listing.price,
                    unit: listing.unit,
                    currency: listing.currency,
                    imageUrl: listing.photos[0]?.url ?? null,
                  }}
                />
                <Button href={`/chat/${p.slug}`} variant="outline" size="md" className="shrink-0">
                  Попитай
                </Button>
              </div>
            ) : (
              <p className="rounded-[var(--radius-md)] bg-surface-muted px-4 py-3 text-sm text-muted-foreground">
                Продуктът не е наличен в момента.
              </p>
            )}

            {p.deliveryProviders ? (
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
                <p className="mb-2 text-sm text-muted-foreground">Доставка с</p>
                <DeliveryBadges providers={p.deliveryProviders} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Още от същото стопанство */}
      {otherCards.length > 0 ? (
        <section className="mt-16 border-t border-border pt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-serif text-2xl font-semibold">
              Още от {p.farmName}
            </h2>
            <Link
              href={`/p/${p.slug}#produkti`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Всички обяви на стопанството →
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Добавете ги в кошницата заедно с този продукт — една поръчка, една
            доставка от същото стопанство.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {otherCards.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Продукти на партньорите по съвместна доставка */}
      {partnerCards.length > 0 ? (
        <section className="mt-16 rounded-[var(--radius-lg)] border border-success/30 bg-success-soft/40 p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-serif text-2xl font-semibold text-success">
              Може да дойде с една доставка
            </h2>
            {p.town ? (
              <Link
                href={`/savmestno/${encodeURIComponent(p.town)}`}
                className="text-sm font-semibold text-success hover:underline"
              >
                Виж цялата група за {p.town} →
              </Link>
            ) : null}
          </div>
          <p className="mt-1 max-w-3xl text-sm text-foreground/80">
            {p.farmName} прави съвместни доставки с тези стопанства. Поръчате ли
            и от тях, продукцията пътува заедно и плащате една доставка вместо
            няколко.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {partnerCards.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
