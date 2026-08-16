import type { Metadata } from "next";
import { Manrope, Lora } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WeatherBar } from "@/components/home/weather-bar";
import { CartProvider } from "@/components/cart/cart-context";
import { getHeaderUser } from "@/lib/session";

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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Производител.net — Направо от нивата",
    template: "%s · Производител.net",
  },
  description:
    "Платформа за българските земеделски производители. Регистрирайте стопанството си, представете продукцията си и продавайте директно на клиентите.",
  keywords: [
    "земеделски производители",
    "директни продажби",
    "местна продукция",
    "фермерски пазар",
    "България",
  ],
  openGraph: {
    type: "website",
    siteName: "Производител.net",
    title: "Производител.net — Направо от нивата",
    description:
      "Прясна, местна продукция директно от българския производител.",
    locale: "bg_BG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Производител.net — Направо от нивата",
    description:
      "Прясна, местна продукция директно от българския производител.",
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
      className={`${manrope.variable} ${lora.variable} h-full antialiased`}
      style={{
        // Свързваме избраните шрифтове с токените от дизайн системата
        ["--font-sans" as string]: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif",
        ["--font-serif" as string]: "var(--font-lora), ui-serif, Georgia, serif",
      }}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <CartProvider>
          <SiteHeader user={user} />
          <WeatherBar />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
