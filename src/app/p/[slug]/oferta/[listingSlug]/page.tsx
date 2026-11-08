import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductGallery } from "@/components/product/product-gallery";
import { PaymentMethodsDisplay } from "@/components/product/payment-display";
import { FieldBackdrop } from "@/components/brand/field-backdrop";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { DeliveryBadges } from "@/components/product/delivery-badges";
import { ListingCard, type ListingCardData } from "@/components/product/listing-card";
import { getMutualPartners } from "@/lib/partners";
import { formatPrice, farmInitial } from "@/lib/utils";
import { Icon, categoryIcon, type IconName } from "@/components/ui/icons";
import { ReviewsList } from "@/components/product/reviews-list";
import { ReviewForm } from "@/components/product/review-form";
import { RatingStars } from "@/components/ui/rating";
import { auth } from "@/auth";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { submitListingReview, deleteListingReview } from "./review-actions";

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
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true } } },
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

  // Оценки за обявата. Правото да се оцени идва от потвърдена покупка при
  // стопанството — същият праг като при оценките на профила.
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const isOwner = !!currentUserId && p.userId === currentUserId;
  const existingReview = currentUserId
    ? listing.reviews.find((r) => r.authorId === currentUserId) ?? null
    : null;

  let canReview = false;
  if (currentUserId && !isOwner) {
    const purchase = await prisma.purchase.findUnique({
      where: {
        producerId_customerId: { producerId: p.id, customerId: currentUserId },
      },
      select: { id: true },
    });
    canReview = !!purchase;
  }

  // Срок за доставка: подготовка + път. Показва се само ако е попълнен.
  const totalMin =
    (p.handlingDaysMin ?? p.handlingDaysMax ?? null) === null &&
    (p.transitDaysMin ?? p.transitDaysMax ?? null) === null
      ? null
      : (p.handlingDaysMin ?? p.handlingDaysMax ?? 0) +
        (p.transitDaysMin ?? p.transitDaysMax ?? 0);
  const totalMax =
    totalMin === null
      ? null
      : (p.handlingDaysMax ?? p.handlingDaysMin ?? 0) +
        (p.transitDaysMax ?? p.transitDaysMin ?? 0);
  const deliveryDays =
    totalMin === null || totalMax === null
      ? null
      : totalMin === totalMax
        ? `${totalMin} ${totalMin === 1 ? "работен ден" : "работни дни"}`
        : `${totalMin}–${totalMax} работни дни`;

  const reviewItems = listing.reviews.map((r) => ({
    id: r.id,
    authorName: r.author.name,
    rating: r.rating,
    comment: r.comment,
    verified: r.verified,
    createdAt: r.createdAt,
  }));

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
    <main className="container-page py-8 sm:py-10">
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
        category={listing.category}
        shipping={{
          price: p.shippingPrice,
          freeOver: p.freeShippingOver,
          handlingMin: p.handlingDaysMin,
          handlingMax: p.handlingDaysMax,
          transitMin: p.transitDaysMin,
          transitMax: p.transitDaysMax,
        }}
        ratingAvg={listing.ratingAvg}
        ratingCount={listing.ratingCount}
        reviews={listing.reviews.map((r) => ({
          authorName: r.author.name,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
        }))}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Каталог", path: "/katalog" },
          { name: p.farmName, path: `/p/${p.slug}` },
          { name: listing.title, path },
        ]}
      />
      <nav aria-label="Пътечка" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/katalog" className="transition-colors hover:text-primary">
              Каталог
            </Link>
          </li>
          {listing.category ? (
            <>
              <li aria-hidden className="text-border-strong">/</li>
              <li>{listing.category}</li>
            </>
          ) : null}
          <li aria-hidden className="text-border-strong">/</li>
          <li>
            <Link href={`/p/${p.slug}`} className="transition-colors hover:text-primary">
              {p.farmName}
            </Link>
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <ProductGallery
          photos={listing.photos.map((ph) => ph.url)}
          alt={`${listing.title} от ${listing.producer.farmName}`}
        />

        <div className="flex flex-col gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {listing.category ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                  <Icon name={categoryIcon(listing.category)} size={14} />
                  {listing.category}
                </span>
              ) : null}
              {listing.isOffer ? <Badge tone="accent">Оферта</Badge> : null}
              {listing.soldOut ? <Badge tone="danger">Изчерпан</Badge> : null}
              {!listing.available ? <Badge tone="neutral">Не е налично</Badge> : null}
            </div>

            <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl">
              {listing.title}
            </h1>

            {listing.ratingCount > 0 ? (
              <a href="#otzivi" className="mt-2 inline-flex items-center gap-2 hover:opacity-80">
                <RatingStars value={listing.ratingAvg} count={listing.ratingCount} size="sm" />
                <span className="text-sm text-muted-foreground underline-offset-2 hover:underline">
                  {listing.ratingCount === 1 ? "1 оценка" : `${listing.ratingCount} оценки`}
                </span>
              </a>
            ) : null}
          </div>

          {/* Цена и поръчка */}
          <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-serif text-4xl font-semibold text-primary">
                {formatPrice(listing.price)}
              </span>
              <span className="text-lg text-muted-foreground">/ {listing.unit}</span>
              {listing.oldPrice && listing.oldPrice > listing.price ? (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(listing.oldPrice)}
                  </span>
                  <span className="rounded-full bg-danger px-2.5 py-0.5 text-xs font-bold text-white">
                    −{Math.round((1 - listing.price / listing.oldPrice) * 100)}%
                  </span>
                </>
              ) : null}
            </div>

            {listing.stockNote ? (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent-hover">
                <Icon name="clock" size={15} />
                {listing.stockNote}
              </p>
            ) : null}

            <div className="mt-5">
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
                    <Icon name="chat" size={16} />
                    Попитай производителя
                  </Button>
                </div>
              ) : listing.available ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-foreground">
                    Количество ({listing.unit})
                  </p>
                  <AddToCartButton
                    size="lg"
                    withQty
                    showTotal
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
                  <Button href={`/chat/${p.slug}`} variant="outline" className="w-full">
                    <Icon name="chat" size={17} />
                    Попитай производителя
                  </Button>
                </div>
              ) : (
                <p className="rounded-[var(--radius-md)] bg-surface-muted px-4 py-3 text-sm text-muted-foreground">
                  Продуктът не е наличен в момента.
                </p>
              )}
            </div>

            {p.deliveryProviders || p.shippingPrice !== null ? (
              <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Доставка
                </p>
                {p.shippingPrice !== null ? (
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <Icon name="truck" size={17} />
                    </span>
                    <div>
                      <p>
                        Доставка:{" "}
                        <strong>
                          {p.shippingPrice === 0
                            ? "безплатна"
                            : formatPrice(p.shippingPrice)}
                        </strong>
                        {p.freeShippingOver !== null && p.shippingPrice > 0
                          ? ` — безплатна над ${formatPrice(p.freeShippingOver)}`
                          : ""}
                      </p>
                      {deliveryDays ? (
                        <p className="mt-0.5 text-muted-foreground">
                          Получавате я за {deliveryDays}.
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {p.deliveryProviders ? (
                  <div>
                    <p className="mb-2 text-muted-foreground">Изпраща с</p>
                    <DeliveryBadges providers={p.deliveryProviders} />
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 border-t border-border pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Плащане
              </p>
              <PaymentMethodsDisplay
                payment={p.payment}
                cardEnabled={!!p.stripeAccountId && p.stripeChargesEnabled && p.urnVerified}
                variant="plain"
              />
            </div>

            <ul className="mt-5 grid gap-2 border-t border-border pt-5 text-sm text-muted-foreground sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <Icon name="check-circle" size={17} className="text-success" />
                Директно от стопанството
              </li>
              <li className="flex items-center gap-2">
                <Icon name="shield" size={17} className="text-success" />
                Поръчка без посредник
              </li>
            </ul>
          </div>

          {/* Производител */}
          <Link
            href={`/p/${p.slug}`}
            className="group flex items-center gap-4 rounded-[var(--radius-xl)] border border-border bg-surface p-4 shadow-xs transition-colors hover:border-primary/30"
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-primary-soft">
              {p.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-serif text-lg font-semibold text-primary">
                  {farmInitial(p.farmName)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Продава</p>
              <p className="truncate font-semibold transition-colors group-hover:text-primary">
                {p.farmName}
              </p>
              {location ? (
                <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                  <Icon name="pin" size={14} />
                  {location}
                </p>
              ) : null}
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-strong text-foreground transition-colors group-hover:border-primary group-hover:bg-primary-soft group-hover:text-primary">
              <Icon name="arrow-right" size={16} />
            </span>
          </Link>

          {p.sharedDelivery ? (
            <div className="flex items-start gap-3 rounded-[var(--radius-xl)] border border-primary/20 bg-primary-soft/60 p-4 text-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[#f0c977]">
                <Icon name="handshake" size={17} />
              </span>
              <div>
                <p className="font-semibold text-primary">Съвместна доставка</p>
                <p className="mt-0.5 text-foreground/80">
                  Този производител работи заедно с други стопанства от{" "}
                  {p.town ?? "своя район"}. Можете да поръчате продукти от няколко
                  производители с една обща доставка.
                </p>
                {p.town ? (
                  <Link
                    href={`/savmestno/${encodeURIComponent(p.town)}`}
                    className="mt-1.5 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    Виж групата за {p.town}
                    <Icon name="arrow-right" size={14} />
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-xs sm:p-8">
          <h2 className="flex items-center gap-2.5 text-xl font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Icon name="leaf" size={18} />
            </span>
            За продукта
          </h2>
          {listing.description ? (
            <p className="mt-4 whitespace-pre-line leading-relaxed text-foreground/90">
              {listing.description}
            </p>
          ) : (
            <p className="mt-4 text-muted-foreground">
              Производителят не е добавил описание. Попитайте го за сорта, начина
              на отглеждане и количествата.
            </p>
          )}

          <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-border pt-6 text-sm sm:grid-cols-2">
            {listing.category ? <Detail label="Категория" value={listing.category} /> : null}
            <Detail label="Мерна единица" value={`1 ${listing.unit}`} />
            <Detail
              label="Наличност"
              value={
                listing.soldOut
                  ? "Изчерпан"
                  : listing.available
                    ? listing.stockNote || "Налично"
                    : "Не е налично"
              }
            />
            <Detail label="Производител" value={p.farmName} href={`/p/${p.slug}`} />
            {location ? <Detail label="Произход" value={location} /> : null}
            {deliveryDays ? <Detail label="Срок за доставка" value={deliveryDays} /> : null}
          </dl>
        </section>

        <section className="relative isolate overflow-hidden rounded-[var(--radius-xl)] p-6 text-white shadow-sm sm:p-8">
          <FieldBackdrop id="how-to-order" fields="none" />
          <h2 className="text-xl font-semibold text-white">Как да поръчате</h2>
          <ol className="mt-5 flex flex-col gap-4">
            {ORDER_STEPS.map((step, i) => (
              <li key={step.title} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#f0c977] ring-1 ring-white/15">
                  <Icon name={step.icon} size={18} />
                </span>
                <div>
                  <p className="font-semibold text-white">
                    {i + 1}. {step.title}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-white/70">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link
            href="/koshnitsa"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f0c977] hover:underline"
          >
            Към кошницата
            <Icon name="arrow-right" size={15} />
          </Link>
        </section>
      </div>

      {/* Оценки за продукта */}
      <section id="otzivi" className="mt-14 scroll-mt-28">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-serif text-2xl font-semibold">Оценки за продукта</h2>
          {listing.ratingCount > 0 ? (
            <RatingStars value={listing.ratingAvg} count={listing.ratingCount} />
          ) : null}
        </div>

        {canReview || existingReview ? (
          <div className="mt-5">
            <ReviewForm
              submit={submitListingReview.bind(null, p.slug, listing.slug)}
              remove={deleteListingReview.bind(null, p.slug, listing.slug)}
              initial={
                existingReview
                  ? {
                      rating: existingReview.rating,
                      comment: existingReview.comment ?? "",
                    }
                  : null
              }
              hint={`Как беше „${listing.title}“ — качество, свежест, количество?`}
              placeholder="Опишете продукта такъв, какъвто го получихте. (по избор)"
            />
          </div>
        ) : currentUserId && !isOwner ? (
          <p className="mt-5 rounded-[var(--radius-lg)] border border-border bg-surface-muted/60 p-4 text-sm text-muted-foreground">
            Само клиенти с потвърдена от производителя покупка могат да оставят
            оценка.
          </p>
        ) : null}

        <div className="mt-6">
          <ReviewsList
            reviews={reviewItems}
            empty="Все още няма оценки за този продукт."
          />
        </div>
      </section>

      {/* Още от същото стопанство */}
      {otherCards.length > 0 ? (
        <section className="mt-14">
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
        <section className="mt-14 rounded-[var(--radius-xl)] border border-primary/20 bg-primary-soft/50 p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-serif text-2xl font-semibold text-primary">
              Може да дойде с една доставка
            </h2>
            {p.town ? (
              <Link
                href={`/savmestno/${encodeURIComponent(p.town)}`}
                className="text-sm font-semibold text-primary hover:underline"
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

const ORDER_STEPS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "basket",
    title: "Изберете количество",
    text: "Добавете продукта в кошницата — може и заедно с други продукти от стопанството.",
  },
  {
    icon: "wallet",
    title: "Платете удобно",
    text: "С карта онлайн или с наложен платеж — според това, което приема производителят.",
  },
  {
    icon: "truck",
    title: "Получете пратката",
    text: "Производителят изпраща с куриер или предава лично и се свързва с вас за детайлите.",
  },
];

function Detail({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">
        {href ? (
          <Link href={href} className="text-primary hover:underline">
            {value}
          </Link>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
