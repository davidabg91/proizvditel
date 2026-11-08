import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { findListingsBoostedFirst } from "@/lib/boost";
import { findProducerCards, toListingCard } from "@/lib/cards";
import { CATEGORY_LANDINGS, REGION_LANDINGS, regionLandingBySlug } from "@/lib/seo-landing";
import { ListingCard } from "@/components/product/listing-card";
import { ProducerCard } from "@/components/product/producer-card";
import { Button } from "@/components/ui/button";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/json-ld";
import { PageHero } from "@/components/layout/page-hero";

export const revalidate = 600;
export const dynamicParams = false;

export function generateStaticParams() {
  return REGION_LANDINGS.map((r) => ({ oblast: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ oblast: string }>;
}): Promise<Metadata> {
  const { oblast } = await params;
  const landing = regionLandingBySlug(oblast);
  if (!landing) return {};

  const count = await prisma.producer.count({
    where: { published: true, region: landing.region },
  });
  const title = `Земеделски производители — ${landing.label}`;
  const description = `Стопанства от ${landing.label}: плодове, зеленчуци, мед, млечни продукти и месо директно от производителя. Вижте профилите и поръчайте без посредник.`;

  return {
    title,
    description,
    alternates: { canonical: `/proizvoditeli/${landing.slug}` },
    openGraph: { title, description },
    // Празна област няма какво да предложи на търсещия — не я индексираме,
    // докато не се регистрира първото стопанство. Връзките се следват.
    robots: count === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ oblast: string }>;
}) {
  const { oblast } = await params;
  const landing = regionLandingBySlug(oblast);
  if (!landing) notFound();

  const [producers, listings] = await Promise.all([
    findProducerCards({ region: landing.region }),
    findListingsBoostedFirst(
      { available: true, producer: { published: true, region: landing.region } },
      12,
    ),
  ]);
  const cards = listings.map(toListingCard);

  return (
    <main>
      <BreadcrumbJsonLd
        items={[
          { name: "Начало", path: "/" },
          { name: "Производители", path: "/proizvoditeli" },
          { name: landing.region, path: `/proizvoditeli/${landing.slug}` },
        ]}
      />
      <ItemListJsonLd
        name={`Земеделски производители — ${landing.label}`}
        items={producers.map((p) => ({ name: p.farmName, path: `/p/${p.slug}` }))}
      />

      <PageHero
        eyebrow="Производители по област"
        title={`Земеделски производители — ${landing.label}`}
        breadcrumbs={[
          { label: "Производители", href: "/proizvoditeli" },
          { label: landing.region },
        ]}
        description={
          producers.length > 0
            ? `${producers.length} ${producers.length === 1 ? "стопанство" : "стопанства"} от ${landing.label} продават продукцията си директно през Производител.net. Вижте кой какво отглежда, от коя година работи и какви оценки има от клиенти — и поръчайте без посредник.`
            : `Все още няма регистрирани стопанства от ${landing.label}. Ако сте земеделски производител оттук, създайте безплатен профил и бъдете първият, когото купувачите от региона ще намерят.`
        }
      />

      <div className="container-page pb-16 pt-2 sm:pt-4">

      {producers.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-2xl">Стопанства</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {producers.map((p) => (
              <ProducerCard key={p.slug} producer={p} />
            ))}
          </div>
        </section>
      ) : (
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/za-proizvoditeli">Регистрирайте стопанството си</Button>
          <Button href="/proizvoditeli" variant="outline">
            Всички производители
          </Button>
        </div>
      )}

      {cards.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-2xl">Продукция от {landing.label}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-16 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-xl">Продукция по категория</h2>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {CATEGORY_LANDINGS.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/katalog/${c.slug}`}
                  className="inline-block rounded-full border border-border px-3 py-1 hover:border-primary hover:text-primary"
                >
                  {c.category}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl">Други области</h2>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {REGION_LANDINGS.filter((r) => r.slug !== landing.slug).map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/proizvoditeli/${r.slug}`}
                  className="inline-block rounded-full border border-border px-3 py-1 hover:border-primary hover:text-primary"
                >
                  {r.region}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      </div>
    </main>
  );
}
