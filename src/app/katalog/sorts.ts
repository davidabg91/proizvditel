/** Подреждането в каталога — общо за сървърната страница и за менюто. */
export const SORTS = [
  { value: "", label: "Препоръчани" },
  { value: "new", label: "Най-нови" },
  { value: "price_asc", label: "Цена: ниска → висока" },
  { value: "price_desc", label: "Цена: висока → ниска" },
] as const;
