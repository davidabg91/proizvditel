import type { Metadata } from "next";
import { after } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Icon, categoryIcon, type IconName } from "@/components/ui/icons";
import { FieldBackdrop } from "@/components/brand/field-backdrop";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating";
import { ListingCard } from "@/components/product/listing-card";
import { PaymentMethodsDisplay } from "@/components/product/payment-display";
import { DeliveryBadges } from "@/components/product/delivery-badges";
import { ReviewsList } from "@/components/product/reviews-list";
import { ReviewForm } from "@/components/product/review-form";
import { submitReview, deleteReview } from "./review-actions";
import { getMutualPartners } from "@/lib/partners";
import { ReportButton } from "@/components/report/report-button";
import { ProfileCover } from "@/components/profile/profile-cover";
import { ShopCard, hasShopInfo } from "@/components/profile/shop-card";
import { isBoosted } from "@/lib/boost-plans";
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
        // Изчерпаните остават видими, но най-отдолу. Подсилването се нарежда
        // после, в паметта — виж orderedListings по-долу.
        orderBy: [{ soldOut: "asc" }, { createdAt: "desc" }],
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

  // Налични преди изчерпани, а сред тях активно подсилените най-отпред.
  // Не се прави в базата: там `boostedUntil desc` вдига и изтеклите
  // подсилвания над новите обяви, защото стара дата пак е по-голяма от NULL.
  const orderedListings = [...producer.listings].sort(
    (a, b) =>
      Number(a.soldOut) - Number(b.soldOut) ||
      Number(isBoosted(b.boostedUntil)) - Number(isBoosted(a.boostedUntil)),
  );

  const listingCards = orderedListings.map((l) => ({
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

  // Обект на място — показва се само с попълнен адрес.
  const showShop = hasShopInfo(producer);

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
        shop={showShop ? producer : null}
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
        {/* Заглавна карта — под корицата, без застъпване */}
        <header className="mt-6 rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4 sm:items-center sm:gap-5">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-xl)] border border-border bg-primary-soft shadow-sm sm:h-24 sm:w-24">
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
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-serif text-2xl font-semibold leading-tight sm:text-4xl">
                    {producer.farmName}
                  </h1>
                  {producer.urnVerified ? (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1 text-xs font-semibold text-white shadow-xs"
                      title={`Потвърден земеделски производител с проверена регистрационна карта${producer.urn ? ` (УРН: ${producer.urn})` : ""}`}
                    >
                      <Icon name="shield" size={14} />
                      Потвърден производител
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground sm:text-base">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="users" size={16} className="text-accent" />
                    {producer.ownerName}
                  </span>
                  {location ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="pin" size={16} className="text-accent" />
                      {location}
                    </span>
                  ) : null}
                </p>
                <div className="mt-2">
                  <RatingStars value={producer.ratingAvg} count={producer.ratingCount} />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Button href={`/chat/${producer.slug}`} size="lg">
                <Icon name="chat" size={18} />
                Изпрати съобщение
              </Button>
              {listingCards.length > 0 ? (
                <Button href="#produkti" size="lg" variant="outline">
                  <Icon name="basket" size={18} />
                  Продуктите
                </Button>
              ) : null}
            </div>
          </div>

          {/* Ключови данни */}
          <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-6 sm:grid-cols-4">
            <Fact icon="basket" label="Продукти" value={String(listingCards.length - soldOutCount)} />
            <Fact
              icon="sprout"
              label="Стопанисва от"
              value={producer.startedYear ? `${producer.startedYear} г.` : "—"}
            />
            <Fact
              icon="field"
              label="Площ"
              value={producer.totalDecares ? `${producer.totalDecares} дка` : "—"}
            />
            <Fact icon="eye" label="Посещения" value={String(producer.visits)} />
          </dl>

          {showShop || producer.sharedDelivery ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {showShop ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-hover">
                  <Icon name="store" size={14} />
                  Магазин на място
                </span>
              ) : null}
              {producer.sharedDelivery ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                  <Icon name="truck" size={14} />
                  Съвместна доставка
                </span>
              ) : null}
            </div>
          ) : null}
        </header>

        {/* Съдържание */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="flex min-w-0 flex-col gap-8">
            {/* За стопанството */}
            {producer.description ? (
              <Panel title="За стопанството" icon="leaf">
                <p className="whitespace-pre-line leading-relaxed text-foreground/90">
                  {producer.description}
                </p>
              </Panel>
            ) : null}

            {/* Продукти за продажба */}
            <section id="produkti" className="scroll-mt-28">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-2xl font-semibold">Продукти за продажба</h2>
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
                <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {listingCards.map((l) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-surface/60 p-8 text-center">
                  <Icon name="basket" size={30} strokeWidth={1.4} className="text-primary/50" />
                  <p className="text-muted-foreground">Няма активни обяви в момента.</p>
                  <Button href={`/chat/${producer.slug}`} variant="outline" size="sm">
                    Попитайте какво предлага
                  </Button>
                </div>
              )}
            </section>

            {/* Продукция */}
            {producer.crops.length > 0 ? (
              <Panel title="Какво отглеждаме" icon="sprout">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {producer.crops.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-[var(--radius-lg)] border border-border bg-surface-muted/40 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                          <Icon name={categoryIcon(c.category)} size={19} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold leading-tight">{c.name}</p>
                          {c.varieties ? (
                            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                              {c.varieties}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {c.sinceYear || c.decares || c.annualYield ? (
                        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                          {c.sinceYear ? (
                            <span className="rounded-full bg-surface px-2.5 py-1 font-medium text-muted-foreground ring-1 ring-border">
                              от {c.sinceYear} г.
                            </span>
                          ) : null}
                          {c.decares ? (
                            <span className="rounded-full bg-surface px-2.5 py-1 font-medium text-muted-foreground ring-1 ring-border">
                              {c.decares} дка
                            </span>
                          ) : null}
                          {c.annualYield ? (
                            <span className="rounded-full bg-surface px-2.5 py-1 font-medium text-muted-foreground ring-1 ring-border">
                              {c.annualYield} {c.yieldUnit ?? ""} годишно
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}

            {/* Галерия */}
            {gallery.length > 0 ? (
              <Panel title="Галерия" icon="eye">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.map((photo) => (
                    <div
                      key={photo.id}
                      className="group aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-surface-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.caption || `${producer.farmName} — снимка`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}

            {/* Оценки */}
            <section id="ocenki" className="scroll-mt-28">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">Оценки от клиенти</h2>
                {producer.ratingCount > 0 ? (
                  <RatingStars value={producer.ratingAvg} count={producer.ratingCount} />
                ) : null}
              </div>

              {canReview || existingReview ? (
                <div className="mt-5">
                  <ReviewForm
                    submit={submitReview.bind(null, producer.slug)}
                    remove={deleteReview.bind(null, producer.slug)}
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

              <div className="mt-5">
                <ReviewsList reviews={reviewItems} />
              </div>
            </section>
          </div>

          {/* Странична колона */}
          <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-sm">
              <div className="relative isolate overflow-hidden px-6 py-5 text-white">
                <FieldBackdrop id="contact-card" fields="none" />
                <h3 className="font-serif text-lg font-semibold text-white">Свържете се</h3>
                <p className="mt-0.5 text-sm text-white/70">
                  Питайте за продукцията, количества и доставка.
                </p>
              </div>
              <div className="p-6">
                <ul className="flex flex-col gap-3 text-sm">
                  {producer.phone ? (
                    <ContactRow
                      icon="phone"
                      label="Телефон"
                      href={`tel:${producer.phone.replace(/\s+/g, "")}`}
                    >
                      {producer.phone}
                    </ContactRow>
                  ) : null}
                  {producer.contactEmail ? (
                    <ContactRow icon="mail" label="Имейл" href={`mailto:${producer.contactEmail}`}>
                      {producer.contactEmail}
                    </ContactRow>
                  ) : null}
                  {producer.website ? (
                    <ContactRow
                      icon="globe"
                      label="Уебсайт"
                      href={/^https?:\/\//i.test(producer.website) ? producer.website : undefined}
                    >
                      {producer.website}
                    </ContactRow>
                  ) : null}
                  {location ? (
                    <ContactRow icon="pin" label="Локация">
                      {location}
                    </ContactRow>
                  ) : null}
                </ul>
                {producer.deliveryProviders ? (
                  <div className="mt-5 border-t border-border pt-4">
                    <p className="mb-2 text-sm font-medium text-muted-foreground">Доставка с</p>
                    <DeliveryBadges providers={producer.deliveryProviders} />
                  </div>
                ) : null}
                <Button href={`/chat/${producer.slug}`} className="mt-5 w-full">
                  <Icon name="chat" size={17} />
                  Изпрати съобщение
                </Button>
              </div>
            </div>

            <ShopCard shop={producer} farmName={producer.farmName} />

            <PaymentMethodsDisplay payment={producer.payment} />

            {producer.sharedDelivery ? (
              <div className="rounded-[var(--radius-xl)] border border-primary/20 bg-primary-soft/60 p-6">
                <h3 className="flex items-center gap-2 font-semibold text-primary">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[#f0c977]">
                    <Icon name="truck" size={16} />
                  </span>
                  Съвместна доставка
                </h3>
                {partners.length > 0 ? (
                  <>
                    <p className="mt-2 text-sm text-foreground/80">
                      Работим заедно с тези стопанства — поръчайте от нас и от тях
                      с една обща доставка.
                    </p>
                    <ul className="mt-3 flex flex-col gap-2">
                      {partners.map((n) => (
                        <li key={n.slug}>
                          <Link
                            href={`/p/${n.slug}`}
                            className="flex items-center gap-2.5 rounded-full bg-surface py-1 pl-1 pr-3 text-sm font-medium text-foreground shadow-xs transition-colors hover:text-primary"
                          >
                            <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary-soft font-serif text-xs font-semibold text-primary">
                              {n.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={n.logoUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                n.farmName.charAt(0)
                              )}
                            </span>
                            <span className="truncate">{n.farmName}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-foreground/80">
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
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <Icon name="arrow-left" size={16} />
            Всички производители
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

function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] bg-surface-muted/60 p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-primary shadow-xs">
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate font-serif text-lg font-semibold leading-tight">{value}</dd>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: IconName;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-xs sm:p-7">
      <h2 className="flex items-center gap-2.5 text-xl font-semibold">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon name={icon} size={18} />
        </span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ContactRow({
  icon,
  label,
  href,
  children,
}: {
  icon: IconName;
  label: string;
  href?: string;
  children: React.ReactNode;
}) {
  const external = href?.startsWith("http");
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon name={icon} size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {href ? (
          <a
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
            className="break-words font-medium text-foreground hover:text-primary hover:underline"
          >
            {children}
          </a>
        ) : (
          <p className="break-words font-medium">{children}</p>
        )}
      </div>
    </li>
  );
}
