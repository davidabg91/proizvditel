import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { findListingsBoostedFirst } from "@/lib/boost";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/product/listing-card";
import { ProducerCard } from "@/components/product/producer-card";
import { HeroSearch } from "@/components/home/hero-search";
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

export const revalidate = 60;

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const [listings, producers, producerCount] = await Promise.all([
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
    prisma.producer.count({ where: { published: true } }),
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
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Декоративен фон със земеделски мотиви */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-pattern.webp"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        {/* Градиент за четимост на текста */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/30" />
        <div className="container-page relative z-10 grid gap-12 py-16 lg:grid-cols-[1fr_1fr] lg:items-start lg:py-24">
          <div>
            <p className="eyebrow">Сайт за земеделски производители</p>
            <h1 className="mt-4 text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
              Прясна, местна продукция — директно от българския производител
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Производител.net е онлайн пазар, който свързва българските земеделски
              производители с хората, които ценят качеството. Открийте кой отглежда
              храната ви и поръчайте директно от него — без посредник.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/katalog" size="lg">
                Разгледай каталога
              </Button>
              <Button href="/registraciya" size="lg" variant="outline">
                Регистрирай стопанство
              </Button>
            </div>
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              <Stat value={`${producerCount}`} label="производители" />
              <Stat value={`${listings.length > 0 ? "Ежедневно" : "Скоро"}`} label="нови оферти" />
              <Stat value="28" label="области в България" />
            </dl>
          </div>

          <div className="relative flex flex-col items-center lg:pl-6">
            {/* Меки цветни ореоли за дълбочина (само на голям екран) */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 -z-10 hidden h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl lg:block"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-8 right-4 -z-10 hidden h-56 w-56 rounded-full bg-accent/20 blur-3xl lg:block"
            />

            {/* Единен брандов панел: банер (лого3) + търсачка */}
            <div className="w-full max-w-[520px] overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-lg ring-1 ring-border/50">
              <Image
                src="/logo3.png"
                alt="Производител.net — от производителя, директно за вас"
                width={1536}
                height={1024}
                priority
                className="hidden h-auto w-full object-cover lg:block"
              />
              <HeroSearch bare />
            </div>
          </div>
        </div>
      </section>

      {/* Как работи */}
      <section className="container-page py-16">
        <div className="max-w-2xl">
          <p className="eyebrow">Как работи</p>
          <h2 className="mt-3 text-3xl">Три стъпки до прясната храна</h2>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          <Step
            n="01"
            title="Открийте производител"
            text="Разгледайте стопанствата по област и категория. Вижте какво отглеждат, снимки от нивата и оценки от клиенти."
          />
          <Step
            n="02"
            title="Изберете продукция"
            text="Прегледайте каталога с актуални цени и оферти. Всеки продукт е директно от стопанството, без посредници."
          />
          <Step
            n="03"
            title="Поръчайте директно"
            text="Свържете се с производителя и се разберете за плащане и доставка — плащане с карта или наложен платеж."
          />
        </div>
      </section>

      {/* Оферти */}
      {listingCards.length > 0 ? (
        <section className="border-t border-border bg-surface-muted/40">
          <div className="container-page py-16">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow">Пазар</p>
                <h2 className="mt-3 text-3xl">Актуални предложения</h2>
              </div>
              <Link
                href="/katalog"
                className="hidden text-sm font-semibold text-primary hover:underline sm:block"
              >
                Виж целия каталог →
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {listingCards.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Производители */}
      {producerCards.length > 0 ? (
        <section className="container-page py-16">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Стопанства</p>
              <h2 className="mt-3 text-3xl">Запознайте се с производителите</h2>
            </div>
            <Link
              href="/proizvoditeli"
              className="hidden text-sm font-semibold text-primary hover:underline sm:block"
            >
              Всички производители →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {producerCards.map((p) => (
              <ProducerCard key={p.slug} producer={p} />
            ))}
          </div>
        </section>
      ) : null}

      {/* CTA за производители */}
      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="container-page grid gap-8 py-16 lg:grid-cols-[1.5fr_1fr] lg:items-center">
          <div>
            <h2 className="text-3xl text-primary-foreground sm:text-4xl">
              Вие сте производител? Представете стопанството си.
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-primary-foreground/80">
              Създайте безплатен профил, качете продукцията си и започнете да
              продавате директно на клиентите — без прекупвачи и посредници.
            </p>
          </div>
          <div className="flex lg:justify-end">
            <Button href="/za-proizvoditeli" size="lg" variant="accent">
              Започнете безплатно
            </Button>
          </div>
        </div>
      </section>

      {/* Разглеждане по категория и област + въпроси */}
      <section className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl">Продукция по категория</h2>
            <ul className="mt-5 flex flex-wrap gap-2 text-sm">
              {CATEGORY_LANDINGS.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/katalog/${c.slug}`}
                    className="inline-block rounded-full border border-border px-3 py-1.5 hover:border-primary hover:text-primary"
                  >
                    {c.category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl">Земеделски производители по област</h2>
            <ul className="mt-5 flex flex-wrap gap-2 text-sm">
              {REGION_LANDINGS.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/proizvoditeli/${r.slug}`}
                    className="inline-block rounded-full border border-border px-3 py-1.5 hover:border-primary hover:text-primary"
                  >
                    {r.region}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <FaqSection items={HOME_FAQ} />
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="font-serif text-2xl font-semibold text-foreground">{value}</dt>
      <dd className="text-sm text-muted-foreground">{label}</dd>
    </div>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="border-t-2 border-primary/20 pt-5">
      <span className="font-serif text-sm font-semibold text-accent">{n}</span>
      <h3 className="mt-2 text-xl font-semibold">{title}</h3>
      <p className="mt-2 leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
