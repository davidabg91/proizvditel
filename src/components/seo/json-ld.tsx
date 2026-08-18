import { COMPANY } from "@/lib/company";
import { getSiteUrl } from "@/lib/site";

/**
 * Структурирани данни (Schema.org, JSON-LD).
 *
 * Търсачките и езиковите модели четат оттук кой стои зад сайта, какво се
 * продава и на каква цена. Без тях продуктите не могат да получат богати
 * резултати в Google, а асистентите нямат откъде да цитират данните.
 */

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Съдържанието е наше, не потребителско — сериализираме го директно.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Организацията и сайтът — слага се веднъж, в общия слой. */
export function SiteJsonLd() {
  const site = getSiteUrl();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": `${site}/#organization`,
          name: COMPANY.brand,
          legalName: COMPANY.name,
          url: site,
          logo: `${site}/logo.png`,
          email: COMPANY.email,
          telephone: COMPANY.phone,
          taxID: COMPANY.eik,
          address: {
            "@type": "PostalAddress",
            streetAddress: COMPANY.addressLines[1],
            addressLocality: "Плевен",
            postalCode: "5802",
            addressCountry: "BG",
          },
          areaServed: { "@type": "Country", name: "България" },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${site}/#website`,
          url: site,
          name: COMPANY.brand,
          inLanguage: "bg-BG",
          publisher: { "@id": `${site}/#organization` },
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${site}/katalog?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
    </>
  );
}

/** Пътечка от връзки — помага на Google да покаже структурата в резултата. */
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  const site = getSiteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${site}${item.path}`,
        })),
      }}
    />
  );
}

/** Обява за продукт — цена, наличност и кой я предлага. */
export function ProductJsonLd({
  title,
  description,
  images,
  price,
  unit,
  inStock,
  producerName,
  producerPath,
  url,
}: {
  title: string;
  description: string | null;
  images: string[];
  price: number;
  unit: string;
  inStock: boolean;
  producerName: string;
  producerPath: string;
  url: string;
}) {
  const site = getSiteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: title,
        description: description ?? `${title} — директно от ${producerName}.`,
        image: images.length > 0 ? images : undefined,
        brand: { "@type": "Brand", name: producerName },
        offers: {
          "@type": "Offer",
          url: `${site}${url}`,
          price: price.toFixed(2),
          priceCurrency: "EUR",
          availability: inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          seller: {
            "@type": "Organization",
            name: producerName,
            url: `${site}${producerPath}`,
          },
          eligibleQuantity: { "@type": "QuantitativeValue", unitText: unit },
        },
      }}
    />
  );
}

/** Данни за физическия обект, ако производителят е попълнил такъв. */
type ShopForSchema = {
  shopAddress: string | null;
  shopTown: string | null;
  shopRegion: string | null;
  shopPhone: string | null;
  shopMapUrl: string | null;
  shopPhotoUrl: string | null;
};

/** Профил на стопанство. */
export function ProducerJsonLd({
  farmName,
  description,
  slug,
  logoUrl,
  town,
  region,
  phone,
  email,
  ratingAvg,
  ratingCount,
  shop,
}: {
  farmName: string;
  description: string | null;
  slug: string;
  logoUrl: string | null;
  town: string | null;
  region: string | null;
  phone: string | null;
  email: string | null;
  ratingAvg: number;
  ratingCount: number;
  /** Подава се само когато обектът е публикуван и има адрес. */
  shop?: ShopForSchema | null;
}) {
  const site = getSiteUrl();

  // Когато има обект на място, адресът в структурираните данни е неговият —
  // това е точката, на която клиентът наистина може да отиде. Работното
  // време умишлено не се подава: Schema.org иска строг формат („Mo-Sa
  // 08:00-18:00“), а полето в профила е свободен текст на български.
  const images = [logoUrl, shop?.shopPhotoUrl].filter(Boolean) as string[];
  const mapUrl = shop?.shopMapUrl?.trim();

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        additionalType: "https://schema.org/Farm",
        name: farmName,
        description: description ?? `${farmName} — земеделско стопанство в България.`,
        url: `${site}/p/${slug}`,
        image: images.length > 0 ? images : undefined,
        telephone: shop?.shopPhone ?? phone ?? undefined,
        email: email ?? undefined,
        hasMap: mapUrl && /^https?:\/\//i.test(mapUrl) ? mapUrl : undefined,
        address: {
          "@type": "PostalAddress",
          streetAddress: shop?.shopAddress ?? undefined,
          addressLocality: shop?.shopTown ?? town ?? undefined,
          addressRegion: shop?.shopRegion ?? region ?? undefined,
          addressCountry: "BG",
        },
        // Оценките се подават само ако наистина има такива.
        aggregateRating:
          ratingCount > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: ratingAvg.toFixed(1),
                reviewCount: ratingCount,
                bestRating: 5,
                worstRating: 1,
              }
            : undefined,
        parentOrganization: { "@id": `${site}/#organization` },
      }}
    />
  );
}

/** Статия в блога. */
export function ArticleJsonLd({
  title,
  description,
  image,
  authorName,
  publishedAt,
  updatedAt,
  path,
}: {
  title: string;
  description: string | null;
  image: string | null;
  authorName: string;
  publishedAt: Date;
  updatedAt: Date;
  path: string;
}) {
  const site = getSiteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: description ?? title,
        image: image ?? `${site}/opengraph-image.png`,
        author: { "@type": "Person", name: authorName },
        publisher: { "@id": `${site}/#organization` },
        datePublished: publishedAt.toISOString(),
        dateModified: updatedAt.toISOString(),
        mainEntityOfPage: `${site}${path}`,
        inLanguage: "bg-BG",
      }}
    />
  );
}
