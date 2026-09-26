import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

/**
 * robots.txt — какво да обхождат търсачките.
 * Личните и служебните раздели се изключват: там няма какво да се индексира,
 * а обхождането им хаби бюджета на робота.
 */
const PRIVATE_PATHS = [
  "/api/",
  "/tablo/", // табло на производителя
  "/admin/",
  "/sabshteniya/", // лични съобщения
  "/chat/",
  "/koshnitsa", // кошницата е лична и без стойност за търсене
  "/plateno", // страница след плащане
  "/vhod",
  "/registraciya",
];

/**
 * Роботите на AI търсачките и асистентите. Изброени са изрично, за да е
 * ясно, че сайтът иска да бъде цитиран от тях. Робот с собствена група
 * пренебрегва групата „*“, затова личните раздели се повтарят.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
];

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
