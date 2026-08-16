/** Български области */
export const REGIONS = [
  "Благоевград",
  "Бургас",
  "Варна",
  "Велико Търново",
  "Видин",
  "Враца",
  "Габрово",
  "Добрич",
  "Кърджали",
  "Кюстендил",
  "Ловеч",
  "Монтана",
  "Пазарджик",
  "Перник",
  "Плевен",
  "Пловдив",
  "Разград",
  "Русе",
  "Силистра",
  "Сливен",
  "Смолян",
  "София (област)",
  "София (столица)",
  "Стара Загора",
  "Търговище",
  "Хасково",
  "Шумен",
  "Ямбол",
] as const;

/** Категории продукция */
export const CATEGORIES = [
  "Плодове",
  "Зеленчуци",
  "Зърнени култури",
  "Билки и подправки",
  "Мед и пчелни продукти",
  "Млечни продукти",
  "Месо и яйца",
  "Ядки",
  "Вино и напитки",
  "Цветя и разсади",
  "Друго",
] as const;

/** Мерни единици */
export const UNITS = [
  "кг",
  "тон",
  "бр",
  "връзка",
  "литър",
  "кашон",
  "буркан",
  "стек",
] as const;

/** Единици за годишна продукция */
export const YIELD_UNITS = ["кг", "тон", "бр", "литра"] as const;

/** Категории във форума */
export const FORUM_CATEGORIES = [
  "Растениевъдство",
  "Животновъдство",
  "Пчеларство",
  "Овощарство и лозарство",
  "Техника и машини",
  "Пазар и цени",
  "Субсидии и документи",
  "Болести и вредители",
  "Общи разговори",
] as const;

/** Доставчици / начини на предаване */
export const DELIVERY_PROVIDERS = [
  { code: "econt", name: "Econt", bg: "#0a4a8f", fg: "#ffffff" },
  { code: "speedy", name: "Speedy", bg: "#e2231a", fg: "#ffffff" },
  { code: "pigeon", name: "Pigeon Express", bg: "#1f8a70", fg: "#ffffff" },
  { code: "personal", name: "Лично предаване", bg: "#1f4a38", fg: "#ffffff" },
] as const;

export type DeliveryProviderCode = (typeof DELIVERY_PROVIDERS)[number]["code"];

export function parseProviders(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Категории в блога */
export const BLOG_CATEGORIES = [
  "Ползи и качества",
  "Съвети за отглеждане",
  "Сезонност",
  "Съхранение и приготвяне",
  "Рецепти",
  "Друго",
] as const;

export type Region = (typeof REGIONS)[number];
export type Category = (typeof CATEGORIES)[number];
export type ForumCategory = (typeof FORUM_CATEGORIES)[number];
