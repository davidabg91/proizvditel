import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/product/listing-card";
import { ProducerCard } from "@/components/product/producer-card";
import { HeroSearch } from "@/components/home/hero-search";

export default async function Home() {
  const [listings, producers, producerCount] = await Promise.all([
    prisma.productListing.findMany({
      where: { available: true, producer: { published: true } },
      orderBy: [{ isOffer: "desc" }, { createdAt: "desc" }],
      take: 8,
      include: {
        photos: { orderBy: { sort: "asc" }, take: 1 },
        producer: { select: { slug: true, farmName: true, town: true, region: true } },
      },
    }),
    prisma.producer.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        crops: { select: { name: true }, take: 3 },
        _count: { select: { listings: { where: { available: true } } } },
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
    category: l.category,
    imageUrl: l.photos[0]?.url ?? null,
    producer: l.producer,
  }));

  const producerCards = producers.map((p) => ({
    slug: p.slug,
    farmName: p.farmName,
    ownerName: p.ownerName,
    town: p.town,
    region: p.region,
    logoUrl: p.logoUrl,
    coverUrl: p.coverUrl,
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
          src="/c563ec48-f188-401a-ba38-b3406dc1bff3.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        {/* Градиент за четимост на текста */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/30" />
        <div className="container-page relative z-10 grid gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
          <div>
            <p className="eyebrow">Направо от нивата</p>
            <h1 className="mt-4 text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
              Прясна, местна продукция — директно от българския производител
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Производител свързва земеделските стопанства с хората, които ценят
              качеството. Открийте кой отглежда храната ви и поръчайте директно от
              него.
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

          <div className="lg:pl-6">
            <HeroSearch />
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
            text="Свържете се с производителя и се разберете за плащане и доставка — банков превод, Revolut или наложен платеж."
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
              продавате директно на клиентите — без комисиони и посредници.
            </p>
          </div>
          <div className="flex lg:justify-end">
            <Button href="/registraciya" size="lg" variant="accent">
              Започнете безплатно
            </Button>
          </div>
        </div>
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
