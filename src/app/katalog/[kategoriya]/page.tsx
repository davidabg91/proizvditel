import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findListingsBoostedFirst } from "@/lib/boost";
import { findProducerCards, toListingCard } from "@/lib/cards";
import { CATEGORY_LANDINGS, categoryLandingBySlug, REGION_LANDINGS } from "@/lib/seo-landing";
import { ListingCard } from "@/components/product/listing-card";
import { ProducerCard } from "@/components/product/producer-card";
import { Button } from "@/components/ui/button";
import { FaqSection } from "@/components/seo/faq-section";
import { BreadcrumbJsonLd, ItemListJsonLd } from "@/components/seo/json-ld";
import { PageHero } from "@/components/layout/page-hero";

export const revalidate = 600;
export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORY_LANDINGS.map((c) => ({ kategoriya: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kategoriya: string }>;
}): Promise<Metadata> {
  const { kategoriya } = await params;
  const landing = categoryLandingBySlug(kategoriya);
  if (!landing) return {};
  return {
    title: landing.title,
    description: landing.description,
    alternates: { canonical: `/katalog/${landing.slug}` },
    openGraph: { title: landing.title, description: landing.description },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ kategoriya: string }>;
}) {
  const { kategoriya } = await params;
  const landing = categoryLandingBySlug(kategoriya);
  if (!landing) notFound();

  const [listings, producers] = await Promise.all([
    findListingsBoostedFirst(
      { available: true, category: landing.category, producer: { published: true } },
      24,
      [{ soldOut: "asc" }, { isOffer: "desc" }, { createdAt: "desc" }],
    ),
    // Стопанства с поне една обява в категорията.
    findProducerCards(
      { listings: { some: { available: true, category: landing.category } } },
      9,
    ),
  ]);
  const cards = listings.map(toListingCard);

  return (
    <main>
      <BreadcrumbJsonLd
        items={[
          { name: "Начало", path: "/" },
          { name: "Каталог", path: "/katalog" },
          { name: landing.category, path: `/katalog/${landing.slug}` },
        ]}
      />
      <ItemListJsonLd
        name={landing.heading}
        items={cards.map((l) => ({
          name: l.title,
          path: `/p/${l.producer.slug}/oferta/${l.slug}`,
        }))}
      />

      <PageHero
        eyebrow="Каталог"
        title={landing.heading}
        breadcrumbs={[{ label: "Каталог", href: "/katalog" }, { label: landing.category }]}
        description={landing.intro.map((p) => (
          <p key={p.slice(0, 24)} className="mt-3 first:mt-0">
            {p}
          </p>
        ))}
      />

      <div className="container-page pb-16 pt-2 sm:pt-4">

      <CategoryNav current={landing.slug} />

      <section className="mt-10">
        <h2 className="text-2xl">Актуални обяви: {landing.category.toLowerCase()}</h2>
        {cards.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-10 text-center">
            <p className="text-lg font-medium">В момента няма активни обяви в тази категория</p>
            <p className="mt-1 text-muted-foreground">
              Производителите добавят нова продукция всеки сезон. Вижте целия каталог
              или, ако отглеждате {landing.category.toLowerCase()}, публикувайте първата обява.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button href="/katalog" variant="outline">
                Целият каталог
              </Button>
              <Button href="/za-proizvoditeli">Продавайте тук</Button>
            </div>
          </div>
        )}
      </section>

      {producers.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-2xl">Стопанства, които предлагат {landing.category.toLowerCase()}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {producers.map((p) => (
              <ProducerCard key={p.slug} producer={p} />
            ))}
          </div>
        </section>
      ) : null}

      <FaqSection items={landing.faq} />

      <section className="mt-16">
        <h2 className="text-xl">Производители по област</h2>
        <ul className="mt-4 flex flex-wrap gap-2 text-sm">
          {REGION_LANDINGS.map((r) => (
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
      </section>
      </div>
    </main>
  );
}

function CategoryNav({ current }: { current: string }) {
  return (
    <ul className="mt-8 flex flex-wrap gap-2 text-sm">
      {CATEGORY_LANDINGS.map((c) => (
        <li key={c.slug}>
          <Link
            href={`/katalog/${c.slug}`}
            aria-current={c.slug === current ? "page" : undefined}
            className={
              c.slug === current
                ? "inline-block rounded-full bg-primary px-3 py-1 font-semibold text-primary-foreground"
                : "inline-block rounded-full border border-border px-3 py-1 hover:border-primary hover:text-primary"
            }
          >
            {c.category}
          </Link>
        </li>
      ))}
    </ul>
  );
}
