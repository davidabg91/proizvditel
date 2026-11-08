import type { Metadata } from "next";
import { Manrope, Lora, Caveat } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WeatherBar } from "@/components/home/weather-bar";
import { CartProvider } from "@/components/cart/cart-context";
import { getHeaderUser } from "@/lib/session";
import { getSiteUrl } from "@/lib/site";
import { SiteJsonLd } from "@/components/seo/json-ld";
import { CookieConsent } from "@/components/legal/cookie-consent";
import { Analytics } from "@vercel/analytics/next";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Ръкописен шрифт за името на стопанство без корица. Без preload — браузърът
// го изтегля само на страниците, където наистина се появява.
const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin", "cyrillic"],
  weight: ["700"],
  display: "swap",
  preload: false,
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Canonical не се задава тук: наследява се от всяка страница без собствен
  // и така всички те биха сочели към началната като свое „копие“.
  title: {
    default:
      "Производител.net — сайт за земеделски производители и продукция директно от нивата",
    template: "%s · Производител.net",
  },
  description:
    "Онлайн пазар за българските земеделски производители: плодове, зеленчуци, мед, сирене и месо директно от стопанството. Безплатен профил за фермери, поръчка без посредник.",
  keywords: [
    "сайт за земеделски производители",
    "земеделски производители",
    "продукция от производител",
    "онлайн пазар за фермери",
    "директно от производителя",
    "фермерски пазар онлайн",
    "български плодове и зеленчуци",
    "мед от производител",
  ],
  verification: {
    // Кодовете се задават в средата (Vercel → Environment Variables), за да не
    // се налага нов commit при смяна на собственика в Search Console.
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Производител.net",
    title: "Производител.net — сайт за земеделски производители",
    description:
      "Прясна, местна продукция директно от българските земеделски производители.",
    locale: "bg_BG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Производител.net — сайт за земеделски производители",
    description:
      "Прясна, местна продукция директно от българските земеделски производители.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getHeaderUser();
  return (
    <html
      lang="bg"
      className={`${manrope.variable} ${lora.variable} ${caveat.variable} h-full antialiased`}
      style={{
        // Свързваме избраните шрифтове с токените от дизайн системата
        ["--font-sans" as string]: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif",
        ["--font-serif" as string]: "var(--font-lora), ui-serif, Georgia, serif",
      }}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteJsonLd />
        <CartProvider>
          <SiteHeader user={user} />
          <WeatherBar />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
          <CookieConsent />
        </CartProvider>
        {/* Брояч на посещенията. Без бисквитки и без профилиране — затова
            стои извън съгласието, а описанието му е в /biskvitki. */}
        <Analytics />
      </body>
    </html>
  );
}
