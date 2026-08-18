import type { NextConfig } from "next";

/**
 * Заглавия за сигурност — слагат се на всеки отговор.
 *
 * Тук няма Content-Security-Policy. Тя иска изброяване на всички източници
 * (снимките идват от Vercel Blob, старите — като data: URL), а сгрешена
 * директива чупи целия сайт. Прави се отделно, с проверка в браузър.
 */
const securityHeaders = [
  // Браузърът да не гадае типа на файла — спира „снимка", която е скрипт.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Външен сайт вижда само домейна ни като referrer, не пълния адрес.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Сайтът не се отваря в чужд iframe (защита от clickjacking).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Достъпът до местоположение остава — времето на началната страница го
  // ползва. Камерата и микрофонът не ни трябват никъде.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
  },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Файловете в /public нямат отпечатък в името, затова не могат да са
        // „immutable". Седмица кеш маха повторната заявка при всяко зареждане;
        // при смяна на лого дайте ново име на файла.
        source: "/:file*.(png|jpg|jpeg|gif|svg|ico|webp|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
