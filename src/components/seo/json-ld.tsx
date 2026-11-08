import { COMPANY } from "@/lib/company";
import { getSiteUrl } from "@/lib/site";

/**
 * Структурирани данни (Schema.org, JSON-LD).
 *
 * Търсачките и езиковите модели четат оттук кой стои зад сайта, какво се
 * продава и на каква цена. Без тях продуктите не могат да получат богати
 * резултати в Google, а асистентите нямат откъде да цитират данните.
 */

/**
 * JSON за вграждане в <script>. В данните има текст от потребители (заглавия,
 * описания, отзиви), а JSON.stringify не пипа „</script>“ — без екраниране
 * едно заглавие може да затвори скрипта и да вмъкне свой код. Заменяме
 * символите с \uXXXX: за JSON парсъра на търсачката това е същият текст.
 */
export function safeJson(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(data) }}
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

/**
 * Категории, които законът брои за бързоразвалящи се — при тях право на
 * отказ не се прилага (виж /otkaz-ot-dogovor, т. 2). За всичко останало
 * важи общият 14-дневен срок за сметка на купувача.
 */
const PERISHABLE_CATEGORIES = [
  "Плодове",
  "Зеленчуци",
  "Млечни продукти",
  "Месо и яйца",
  "Цветя и разсади",
];

/** Политиката за връщане такава, каквато е публикувана на сайта. */
function returnPolicy(category: string | null, site: string) {
  const link = `${site}/otkaz-ot-dogovor`;
  if (category && PERISHABLE_CATEGORIES.includes(category)) {
    return {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "BG",
      returnPolicyCountry: "BG",
      returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      merchantReturnLink: link,
    };
  }
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "BG",
    returnPolicyCountry: "BG",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 14,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnShippingFees",
    merchantReturnLink: link,
  };
}

/** Условията за доставка, попълнени от производителя в профила му. */
export type ShippingForSchema = {
  price: number | null;
  freeOver: number | null;
  handlingMin: number | null;
  handlingMax: number | null;
  transitMin: number | null;
  transitMax: number | null;
};

/** Дни като интервал — подрежда границите, ако са въведени разбъркано. */
function days(min: number | null, max: number | null) {
  if (min === null && max === null) return undefined;
  const a = min ?? max!;
  const b = max ?? min!;
  return {
    "@type": "QuantitativeValue",
    minValue: Math.min(a, b),
    maxValue: Math.max(a, b),
    unitCode: "DAY",
  };
}

function shippingDetails(
  shipping: ShippingForSchema | null | undefined,
  price: number,
) {
  // Без обявена цена не подаваме нищо: условията на сайта казват, че тогава
  // доставката се уговаря с производителя, а измислен тариф е по-лош от
  // липсващо поле.
  if (!shipping || shipping.price === null) return undefined;

  // Прагът за безплатна доставка се мери спрямо цената на самата бройка —
  // ако тя вече го надхвърля, всяка поръчка с този продукт е над прага.
  const rate =
    shipping.freeOver !== null && price >= shipping.freeOver ? 0 : shipping.price;

  const handlingTime = days(shipping.handlingMin, shipping.handlingMax);
  const transitTime = days(shipping.transitMin, shipping.transitMax);

  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: rate.toFixed(2),
      currency: "EUR",
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: "BG",
    },
    deliveryTime:
      handlingTime || transitTime
        ? {
            "@type": "ShippingDeliveryTime",
            handlingTime,
            transitTime,
          }
        : undefined,
  };
}

/** Отзив за обявата, подготвен за структурираните данни. */
export type ReviewForSchema = {
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
};

/** Обява за продукт — цена, наличност, доставка, връщане и оценки. */
export function ProductJsonLd({
  title,
  description,
  category,
  images,
  price,
  unit,
  inStock,
  producerName,
  producerPath,
  url,
  shipping,
  ratingAvg,
  ratingCount,
  reviews = [],
}: {
  title: string;
  description: string | null;
  category: string | null;
  images: string[];
  price: number;
  unit: string;
  inStock: boolean;
  producerName: string;
  producerPath: string;
  url: string;
  shipping?: ShippingForSchema | null;
  ratingAvg: number;
  ratingCount: number;
  reviews?: ReviewForSchema[];
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
        category: category ?? undefined,
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
          shippingDetails: shippingDetails(shipping, price),
          hasMerchantReturnPolicy: returnPolicy(category, site),
        },
        // Оценките се подават само когато наистина има такива — измислен
        // рейтинг е нарушение на правилата на Google.
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
        review:
          reviews.length > 0
            ? reviews.map((r) => ({
                "@type": "Review",
                author: { "@type": "Person", name: r.authorName },
                datePublished: r.createdAt.toISOString().slice(0, 10),
                reviewBody: r.comment ?? undefined,
                reviewRating: {
                  "@type": "Rating",
                  ratingValue: r.rating,
                  bestRating: 5,
                  worstRating: 1,
                },
              }))
            : undefined,
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

/**
 * Въпроси и отговори. Google вече показва FAQ богати резултати само за
 * официални сайтове, но AI търсачките четат блока като готови отговори.
 */
export function FaqJsonLd({ items }: { items: { q: string; a: string }[] }) {
  if (items.length === 0) return null;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }}
    />
  );
}

/** Списък с елементи на страница — продукти или стопанства. */
export function ItemListJsonLd({
  name,
  items,
}: {
  name: string;
  items: { name: string; path: string }[];
}) {
  if (items.length === 0) return null;
  const site = getSiteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name,
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          url: `${site}${item.path}`,
        })),
      }}
    />
  );
}
