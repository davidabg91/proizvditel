import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

/**
 * robots.txt — какво да обхождат търсачките.
 * Личните и служебните раздели се изключват: там няма какво да се индексира,
 * а обхождането им хаби бюджета на робота.
 */
export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/tablo/", // табло на производителя
          "/admin/",
          "/sabshteniya/", // лични съобщения
          "/chat/",
          "/koshnitsa", // кошницата е лична и без стойност за търсене
          "/plateno", // страница след плащане
          "/vhod",
          "/registraciya",
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
