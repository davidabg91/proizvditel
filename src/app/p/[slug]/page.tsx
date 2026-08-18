import type { Metadata } from "next";
import { after } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating";
import { ListingCard } from "@/components/product/listing-card";
import { PaymentMethodsDisplay } from "@/components/product/payment-display";
import { DeliveryBadges } from "@/components/product/delivery-badges";
import { ReviewsList } from "@/components/product/reviews-list";
import { ReviewForm } from "@/components/product/review-form";
import { getMutualPartners } from "@/lib/partners";
import { ReportButton } from "@/components/report/report-button";
import { ProfileCover } from "@/components/profile/profile-cover";
import { ProducerJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const producer = await prisma.producer.findUnique({
    where: { slug },
    select: {
      farmName: true,
      description: true,
      town: true,
      region: true,
      logoUrl: true,
      coverUrl: true,
      crops: { select: { name: true }, take: 5 },
    },
  });
  if (!producer) return { title: "Профилът не е намерен" };

  const location = [producer.town, producer.region].filter(Boolean).join(", ");
  const crops = producer.crops.map((c) => c.name).join(", ");
  const description =
    producer.description?.slice(0, 160) ??
    `${producer.farmName}${location ? ` — ${location}` : ""}. ${crops ? `Отглеждаме: ${crops}. ` : ""}Поръчайте прясна продукция директно от стопанството.`;

  return {
    title: producer.farmName,
    description,
    alternates: { canonical: `/p/${slug}` },
    openGraph: {
      title: `${producer.farmName}${location ? ` — ${location}` : ""}`,
      description,
      type: "profile",
      images: producer.coverUrl ?? producer.logoUrl ?? undefined,
    },
  };
}

export default async function ProducerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const producer = await prisma.producer.findUnique({
    where: { slug },
    include: {
      crops: { orderBy: { createdAt: "asc" } },
      photos: { orderBy: { sort: "asc" } },
      payment: true,
      listings: {
        where: { available: true },
        // Изчерпаните остават видими, но най-отдолу.
        orderBy: [{ soldOut: "asc" }, { boostedUntil: "desc" }, { createdAt: "desc" }],
        include: { photos: { orderBy: { sort: "asc" }, take: 1 } },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  if (!producer || !producer.published) notFound();

  // Брояч на посещения — не броим собственика.
  // userId вече е в producer (без допълнителна заявка); записът се прави
  // след отговора чрез after(), за да не бави зареждането.
  const session = await auth();
  const isOwner = !!session?.user?.id && producer.userId === session.user.id;

  if (!isOwner) {
    after(async () => {
      await prisma.producer
        .update({
          where: { id: producer.id },
          data: { visits: { increment: 1 } },
        })
        .catch(() => {});
    });
  }

  // Оценки — състояние на текущия посетител
  const currentUserId = session?.user?.id ?? null;
  const existingReview = currentUserId
    ? producer.reviews.find((r) => r.authorId === currentUserId) ?? null
    : null;
  let canReview = false;
  if (currentUserId && !isOwner) {
    const purchase = await prisma.purchase.findUnique({
      where: {
        producerId_customerId: { producerId: producer.id, customerId: currentUserId },
      },
      select: { id: true },
    });
    canReview = !!purchase;
  }

  const reviewItems = producer.reviews.map((r) => ({
    id: r.id,
    authorName: r.author.name,
    rating: r.rating,
    comment: r.comment,
    verified: r.verified,
    createdAt: r.createdAt,
  }));

  const partners = producer.sharedDelivery
    ? await getMutualPartners(producer.id)
    : [];

  const fieldPhotos = producer.photos.filter((p) => p.type === "field");
  const productPhotos = producer.photos.filter((p) => p.type === "product");
  const gallery = [...fieldPhotos, ...productPhotos];

  const location = [producer.town, producer.region].filter(Boolean).join(", ");

  const listingCards = producer.listings.map((l) => ({
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
      slug: producer.slug,
      farmName: producer.farmName,
      town: producer.town,
      region: producer.region,
    },
  }));

  const soldOutCount = listingCards.filter((l) => l.soldOut).length;

  return (
    <main className="pb-20">
      <ProducerJsonLd
        farmName={producer.farmName}
        description={producer.description}
        slug={producer.slug}
        logoUrl={producer.logoUrl}
        town={producer.town}
        region={producer.region}
        phone={producer.phone}
        email={producer.contactEmail}
        ratingAvg={producer.ratingAvg}
        ratingCount={producer.ratingCount}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Производители", path: "/proizvoditeli" },
          { name: producer.farmName, path: `/p/${producer.slug}` },
        ]}
      />
      {/* Корица с възможност за наместване и мащабиране */}
      <ProfileCover
        coverUrl={producer.coverUrl}
        initialPositionY={producer.coverPosition ?? 50}
        initialPositionX={producer.coverPositionX ?? 50}
        initialScale={producer.coverScale ?? 100}
        isOwner={isOwner}
      />

      <div className="container-page">
        {/* Заглавна част — под корицата, без застъпване */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface-muted shadow-sm sm:h-24 sm:w-24">
              {producer.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={producer.logoUrl}
                  alt={producer.farmName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-serif text-3xl font-semibold text-primary">
                  {producer.farmName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-serif text-2xl font-semibold sm:text-4xl">
                  {producer.farmName}
                </h1>
                {producer.urnVerified ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success border border-success/30 shadow-xs"
                    title={`Потвърден земеделски производител с проверена регистрационна карта${producer.urn ? ` (УРН: ${producer.urn})` : ""}`}
                  >
                    <span className="font-bold">✓</span>
                    <span>Потвърден производител</span>
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-muted-foreground">
                {producer.ownerName}
                {location ? ` · ${location}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <RatingStars value={producer.ratingAvg} count={producer.ratingCount} />
                <span className="text-sm text-muted-foreground">
                  {producer.visits} посещения
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {producer.sharedDelivery ? (
              <Badge tone="success">Съвместна доставка</Badge>
            ) : null}
            {producer.startedYear ? (
              <Badge tone="outline">Стопанисва от {producer.startedYear} г.</Badge>
            ) : null}
            {producer.totalDecares ? (
              <Badge tone="outline">{producer.totalDecares} дка</Badge>
            ) : null}
          </div>
        </div>

        {/* Съдържание */}
        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-12">
            {/* За стопанството */}
            {producer.description ? (
              <section>
                <h2 className="text-xl font-semibold">За стопанството</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-foreground/90">
                  {producer.description}
                </p>
              </section>
            ) : null}

            {/* Продукти за продажба */}
            <section id="produkti">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-semibold">Продукти за продажба</h2>
                {listingCards.length > 0 ? (
                  <span className="text-sm text-muted-foreground">
                    {listingCards.length} обяви
                    {soldOutCount > 0 ? ` · ${soldOutCount} изчерпани` : ""}
                  </span>
                ) : null}
              </div>
              {soldOutCount > 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Продуктите с етикет{" "}
                  <span className="font-semibold text-danger">„Изчерпан“</span> ги няма
                  в момента и не могат да бъдат поръчани. Производителят ще ги върне в
                  наличност, когато има отново количества.
                </p>
              ) : null}
              {listingCards.length > 0 ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {listingCards.map((l) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-8 text-center text-muted-foreground">
                  Няма активни обяви в момента.
                </p>
              )}
            </section>

            {/* Продукция */}
            {producer.crops.length > 0 ? (
              <section>
                <h2 className="text-xl font-semibold">Какво отглеждаме</h2>
                <div className="mt-5 overflow-hidden rounded-[var(--radius-lg)] border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-muted text-left text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Култура</th>
                        <th className="px-4 py-3 font-semibold">Сортове</th>
                        <th className="px-4 py-3 font-semibold">От</th>
                        <th className="px-4 py-3 font-semibold">Площ</th>
                        <th className="px-4 py-3 font-semibold">Годишно</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-surface">
                      {producer.crops.map((c) => (
                        <tr key={c.id}>
                          <td className="px-4 py-3 font-medium">{c.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {c.varieties ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {c.sinceYear ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {c.decares ? `${c.decares} дка` : "—"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {c.annualYield
                              ? `${c.annualYield} ${c.yieldUnit ?? ""}`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {/* Галерия */}
            {gallery.length > 0 ? (
              <section>
                <h2 className="text-xl font-semibold">Галерия</h2>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.map((photo) => (
                    <div
                      key={photo.id}
                      className="aspect-square overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.caption ?? ""}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Оценки */}
            <section id="ocenki">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Оценки от клиенти</h2>
                {producer.ratingCount > 0 ? (
                  <RatingStars
                    value={producer.ratingAvg}
                    count={producer.ratingCount}
                  />
                ) : null}
              </div>

              {canReview || existingReview ? (
                <div className="mt-5">
                  <ReviewForm
                    slug={producer.slug}
                    initial={
                      existingReview
                        ? {
                            rating: existingReview.rating,
                            comment: existingReview.comment ?? "",
                          }
                        : null
                    }
                  />
                </div>
              ) : currentUserId && !isOwner ? (
                <p className="mt-5 rounded-[var(--radius-lg)] border border-border bg-surface-muted/60 p-4 text-sm text-muted-foreground">
                  Само клиенти с потвърдена от производителя покупка могат да
                  оставят оценка.
                </p>
              ) : null}

              <div className="mt-6">
                <ReviewsList reviews={reviewItems} />
              </div>
            </section>
          </div>

          {/* Странична колона */}
          <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
              <h3 className="font-semibold">Свържете се</h3>
              <dl className="mt-4 flex flex-col gap-3 text-sm">
                {producer.phone ? (
                  <div>
                    <dt className="text-muted-foreground">Телефон</dt>
                    <dd className="font-medium">{producer.phone}</dd>
                  </div>
                ) : null}
                {producer.contactEmail ? (
                  <div>
                    <dt className="text-muted-foreground">Имейл</dt>
                    <dd className="font-medium break-words">
                      {producer.contactEmail}
                    </dd>
                  </div>
                ) : null}
                {producer.website ? (
                  <div>
                    <dt className="text-muted-foreground">Уебсайт</dt>
                    <dd className="font-medium break-words">{producer.website}</dd>
                  </div>
                ) : null}
                {location ? (
                  <div>
                    <dt className="text-muted-foreground">Локация</dt>
                    <dd className="font-medium">{location}</dd>
                  </div>
                ) : null}
              </dl>
              {producer.deliveryProviders ? (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 text-sm text-muted-foreground">Доставка с</p>
                  <DeliveryBadges providers={producer.deliveryProviders} />
                </div>
              ) : null}
              <Button
                href={`/chat/${producer.slug}`}
                className="mt-5 w-full"
                variant="primary"
              >
                Изпрати съобщение
              </Button>
            </div>

            <PaymentMethodsDisplay payment={producer.payment} />

            {producer.sharedDelivery ? (
              <div className="rounded-[var(--radius-lg)] border border-success/30 bg-success-soft/60 p-6">
                <h3 className="font-semibold text-success">Съвместна доставка</h3>
                {partners.length > 0 ? (
                  <>
                    <p className="mt-1 text-sm text-foreground/80">
                      Работим заедно с тези стопанства — поръчайте от нас и от тях
                      с една обща доставка.
                    </p>
                    <ul className="mt-3 flex flex-col gap-2">
                      {partners.map((n) => (
                        <li key={n.slug}>
                          <Link
                            href={`/p/${n.slug}`}
                            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
                          >
                            <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-surface font-serif text-xs font-semibold text-primary">
                              {n.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={n.logoUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                n.farmName.charAt(0)
                              )}
                            </span>
                            {n.farmName}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-foreground/80">
                    Този производител е готов за съвместна доставка. Когато се
                    свърже с партньори, ще можете да поръчате заедно с тях.
                  </p>
                )}
              </div>
            ) : null}
          </aside>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <Link
            href="/proizvoditeli"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Всички производители
          </Link>
          {!isOwner ? (
            <ReportButton
              targetType="producer"
              targetId={producer.id}
              targetLabel={producer.farmName}
              loggedIn={!!currentUserId}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
