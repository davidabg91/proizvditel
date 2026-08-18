import { Button } from "@/components/ui/button";

/**
 * Карта „Заповядайте на място“ — физическият обект на стопанството.
 *
 * Показва се само когато производителят е включил hasShop и е попълнил поне
 * адрес или населено място. Без тези две неща картата не носи информация, а
 * празна карта в профила подсказва на клиента, че мястото е недовършено.
 */

export type ShopInfo = {
  hasShop: boolean;
  shopName: string | null;
  shopAddress: string | null;
  shopTown: string | null;
  shopRegion: string | null;
  shopHours: string | null;
  shopPhone: string | null;
  shopMapUrl: string | null;
  shopNote: string | null;
  shopPhotoUrl: string | null;
};

/** Пълният адрес на един ред — за показване и за връзката към картата. */
export function shopAddressLine(shop: ShopInfo): string {
  return [shop.shopAddress, shop.shopTown, shop.shopRegion]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");
}

/** Има ли изобщо какво да се покаже. */
export function hasShopInfo(shop: ShopInfo): boolean {
  return shop.hasShop && shopAddressLine(shop).length > 0;
}

/**
 * Връзка към картата. Приемаме само http(s) — полето се попълва от
 * производителя, а „javascript:“ в href-а е класическа дупка.
 */
function mapHref(shop: ShopInfo): string {
  const custom = shop.shopMapUrl?.trim();
  if (custom && /^https?:\/\//i.test(custom)) return custom;
  const query = `${shopAddressLine(shop)}, България`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function ShopCard({
  shop,
  farmName,
}: {
  shop: ShopInfo;
  farmName: string;
}) {
  if (!hasShopInfo(shop)) return null;

  const name = shop.shopName?.trim() || farmName;
  const address = shopAddressLine(shop);

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-accent/30 bg-accent-soft/40">
      {shop.shopPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shop.shopPhotoUrl}
          alt={`Обектът на ${name}`}
          className="h-40 w-full object-cover"
        />
      ) : null}

      <div className="p-6">
        <h3 className="flex items-center gap-2 font-semibold text-foreground">
          <span aria-hidden>📍</span> Заповядайте на място
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Тук можете да ни намерите и да купите директно, без доставка.
        </p>

        <dl className="mt-4 flex flex-col gap-3 text-sm">
          {shop.shopName?.trim() ? (
            <div>
              <dt className="text-muted-foreground">Обект</dt>
              <dd className="font-medium">{name}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted-foreground">Адрес</dt>
            <dd className="font-medium">{address}</dd>
          </div>
          {shop.shopHours?.trim() ? (
            <div>
              <dt className="text-muted-foreground">Работно време</dt>
              <dd className="font-medium whitespace-pre-line">{shop.shopHours}</dd>
            </div>
          ) : null}
          {shop.shopPhone?.trim() ? (
            <div>
              <dt className="text-muted-foreground">Телефон</dt>
              <dd className="font-medium">
                <a
                  href={`tel:${shop.shopPhone.replace(/\s+/g, "")}`}
                  className="hover:text-primary hover:underline"
                >
                  {shop.shopPhone}
                </a>
              </dd>
            </div>
          ) : null}
          {shop.shopNote?.trim() ? (
            <div>
              <dt className="text-muted-foreground">Как да ни намерите</dt>
              <dd className="whitespace-pre-line leading-relaxed text-foreground/90">
                {shop.shopNote}
              </dd>
            </div>
          ) : null}
        </dl>

        <Button
          href={mapHref(shop)}
          target="_blank"
          rel="noopener noreferrer"
          variant="outline"
          className="mt-5 w-full"
        >
          Виж на картата
        </Button>
      </div>
    </div>
  );
}
