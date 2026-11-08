import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { findListingsBoostedFirst } from "@/lib/boost";
import { Icon, categoryIcon, type IconName } from "@/components/ui/icons";
import { SectionHeading } from "@/components/layout/page-hero";
import { ListingCard } from "@/components/product/listing-card";
import { ProducerCard } from "@/components/product/producer-card";
import { HomeHero } from "@/components/home/home-hero";
import { FaqSection } from "@/components/seo/faq-section";
import { CATEGORY_LANDINGS, REGION_LANDINGS } from "@/lib/seo-landing";

const HOME_FAQ = [
  {
    q: "Какво е Производител.net?",
    a: "Производител.net е български сайт за земеделски производители и онлайн пазар за тяхната продукция. Стопанствата публикуват профил и обяви, а купувачите поръчват плодове, зеленчуци, мед, млечни продукти, месо и други храни директно от тях, без посредник.",
  },
  {
    q: "Как да купя продукция директно от производител?",
    a: "Изберете продукт от каталога или от профила на стопанството, добавете го в кошницата и платете с карта онлайн или с наложен платеж. Производителят изпраща пратката с куриер или я предава лично.",
  },
  {
    q: "Как да продавам продукцията си като земеделски производител?",
    a: "Регистрирайте стопанството си безплатно, попълнете профила и публикувайте обяви с цена и количество. Купувачите ще ви намират по продукция и по област и ще поръчват директно от вас.",
  },
  {
    q: "Проверени ли са производителите?",
    a: "Стопанствата могат да посочат УРН (уникален регистрационен номер на земеделски производител) и да качат регистрационната си карта. След преглед профилът получава знак „Потвърден производител“.",
  },
  {
    q: "От кои области има производители?",
    a: "Платформата обхваща всички 28 области в България. Можете да разгледате стопанствата по област — например Пловдив, Кюстендил, Пазарджик, Добрич или Смолян.",
  },
];

/** Категориите за бърз избор над офертите на началната страница. */
const HOME_SHELF_CATEGORIES = [
  "Плодове",
  "Зеленчуци",
  "Мед и пчелни продукти",
  "Млечни продукти",
  "Месо и яйца",
  "Билки и подправки",
];

export const revalidate = 60;

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const [listings, producers] = await Promise.all([
    // Първо платените (подсилени) обяви, след тях — най-новите.
    findListingsBoostedFirst(
      { available: true, soldOut: false, producer: { published: true } },
      8,
    ),
    prisma.producer.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        crops: { select: { name: true }, take: 4 },
        _count: { select: { listings: { where: { available: true, soldOut: false } } } },
      },
    }),
  ]);

  const listingCards = listings.map((l) => ({
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
    producer: l.producer,
  }));

  const producerCards = producers.map((p) => ({
    slug: p.slug,
    farmName: p.farmName,
    ownerName: p.ownerName,
    description: p.description,
    town: p.town,
    region: p.region,
    logoUrl: p.logoUrl,
    coverUrl: p.coverUrl,
    coverPosition: p.coverPosition,
    coverPositionX: p.coverPositionX,
    coverScale: p.coverScale,
    urnVerified: p.urnVerified,
    startedYear: p.startedYear,
    totalDecares: p.totalDecares,
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    sharedDelivery: p.sharedDelivery,
    listingsCount: p._count.listings,
    topCrops: p.crops.map((c) => c.name),
  }));

  return (
    <main>
      <HomeHero />

      {/* Как работи */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="Как работи"
          title="Три стъпки до прясната храна"
          description="Без регистрация, без абонамент. Купувате директно от човека, който отглежда продукцията."
        />
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          <Step
            n="01"
            icon="search"
            title="Открийте производител"
            text="Разгледайте стопанствата по област и категория. Вижте какво отглеждат, снимки от нивата и оценки от клиенти."
          />
          <Step
            n="02"
            icon="basket"
            title="Изберете продукция"
            text="Прегледайте каталога с актуални цени и оферти. Всеки продукт е директно от стопанството, без посредници."
          />
          <Step
            n="03"
            icon="truck"
            title="Поръчайте директно"
            text="Платете с карта или с наложен платеж. Производителят изпраща с куриер или предава лично."
          />
        </ol>
      </section>

      {/* Оферти */}
      {listingCards.length > 0 ? (
        <section className="border-y border-border bg-surface-muted/50">
          <div className="container-page py-16 sm:py-20">
            <SectionHeading
              eyebrow="Пазар"
              title="Актуални предложения"
              description="Прясна продукция директно от стопанствата — изберете количество и добавете в кошницата."
              action={{ href: "/katalog", label: "Целият каталог" }}
            />

            {/* Бърз избор по категория */}
            <nav
              aria-label="Категории продукция"
              className="no-scrollbar -mx-6 mt-7 flex gap-2 overflow-x-auto px-6 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
            >
              <Link
                href="/katalog"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                <Icon name="basket" size={16} />
                Всички
              </Link>
              {HOME_SHELF_CATEGORIES.map((c) => (
                <Link
                  key={c}
                  href={`/katalog?category=${encodeURIComponent(c)}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon name={categoryIcon(c)} size={16} className="text-primary" />
                  {c}
                </Link>
              ))}
            </nav>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {listingCards.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link
                href="/katalog"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
              >
                Разгледай всички продукти
                <Icon
                  name="arrow-right"
                  size={18}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Производители */}
      {producerCards.length > 0 ? (
        <section className="container-page py-16 sm:py-20">
          <SectionHeading
            eyebrow="Стопанства"
            title="Запознайте се с производителите"
            action={{ href: "/proizvoditeli", label: "Всички производители" }}
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {producerCards.map((p) => (
              <ProducerCard key={p.slug} producer={p} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Разглеждане по категория */}
      <section className="border-t border-border bg-surface-muted/50">
        <div className="container-page py-16 sm:py-20">
          <SectionHeading
            eyebrow="Каталог"
            title="Продукция по категория"
            action={{ href: "/katalog", label: "Всички продукти" }}
          />
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORY_LANDINGS.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/katalog/${c.slug}`}
                  className="group flex h-full items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon name={categoryIcon(c.category)} size={20} strokeWidth={1.6} />
                  </span>
                  <span className="text-sm font-semibold leading-tight text-foreground">
                    {c.category}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-14">
            <h2 className="text-xl sm:text-2xl">Земеделски производители по област</h2>
            <ul className="mt-5 flex flex-wrap gap-2 text-sm">
              {REGION_LANDINGS.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/proizvoditeli/${r.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 font-medium text-foreground/80 transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
                  >
                    <Icon name="pin" size={13} className="text-accent" />
                    {r.region}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="mx-auto max-w-3xl">
          <FaqSection items={HOME_FAQ} />
        </div>
      </section>
    </main>
  );
}

function Step({
  n,
  icon,
  title,
  text,
}: {
  n: string;
  icon: IconName;
  title: string;
  text: string;
}) {
  return (
    <li className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-xs sm:p-7">
      <span
        aria-hidden
        className="absolute -right-2 -top-4 font-serif text-[5.5rem] font-semibold leading-none text-primary/[0.06]"
      >
        {n}
      </span>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-[#f0c977] shadow-sm">
        <Icon name={icon} size={22} />
      </span>
      <h3 className="mt-5 text-xl font-semibold">{title}</h3>
      <p className="mt-2 leading-relaxed text-muted-foreground">{text}</p>
    </li>
  );
}
