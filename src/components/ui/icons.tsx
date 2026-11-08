import { cn } from "@/lib/utils";

/**
 * Иконите на сайта — тънки линии, една дебелина, един стил. Нарочно без
 * външна библиотека: няколко десетки пътя са по-леки от цял пакет.
 */
export type IconName =
  | "arrow-right"
  | "arrow-left"
  | "basket"
  | "calendar"
  | "chat"
  | "check"
  | "check-circle"
  | "chevron-down"
  | "clock"
  | "eye"
  | "field"
  | "globe"
  | "handshake"
  | "leaf"
  | "mail"
  | "phone"
  | "pin"
  | "search"
  | "shield"
  | "sprout"
  | "star"
  | "store"
  | "truck"
  | "users"
  | "wallet"
  // категории продукция
  | "fruit"
  | "vegetable"
  | "honey"
  | "milk"
  | "egg"
  | "herb"
  | "grain"
  | "nut"
  | "wine"
  | "flower";

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.8,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      {PATHS[name]}
    </svg>
  );
}

const PATHS: Record<IconName, React.ReactNode> = {
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  "arrow-left": <path d="M19 12H5M11 6l-6 6 6 6" />,
  basket: (
    <>
      <path d="M8.5 10a3.5 3.5 0 0 1 7 0" />
      <path d="M3.5 10h17l-1.2 8.1a2 2 0 0 1-2 1.7H6.7a2 2 0 0 1-2-1.7L3.5 10Z" />
      <path d="M9 13.5v3M12 13.5v3M15 13.5v3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  chat: <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12Z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.3 2.7 2.7L16 9.7" />
    </>
  ),
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  field: (
    <>
      <path d="M3 19c3-4 6-6 9-6s6 2 9 6" />
      <path d="M3 15c3-3 6-4.5 9-4.5S18 12 21 15" />
      <path d="M12 3v7M9.5 5.5 12 3l2.5 2.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9S14.5 18.4 12 21c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3Z" />
    </>
  ),
  handshake: (
    <>
      <path d="m11 17 2 2a1.4 1.4 0 0 0 2-2" />
      <path d="m14 14 2.5 2.5a1.4 1.4 0 0 0 2-2L14.7 10.7a2 2 0 0 0-2.8 0l-.9.9a1.4 1.4 0 0 1-2-2L12.3 6.3a3.5 3.5 0 0 1 4.3-.5L18 7h3v7h-1.5" />
      <path d="M3 7h3l4-1.5M3 14h1.5l5 5a1.4 1.4 0 0 0 2-2" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 20C5 11 10 5 19 4c0 9-5 15-14 16Z" />
      <path d="M5 20 14 10" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  phone: (
    <path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5.5c0 4.4 3 8.2 7 9.5 4-1.3 7-5.1 7-9.5V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 21v-9" />
      <path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6Z" />
      <path d="M12 14c0-3.5-2.5-5.5-6.5-5.5 0 3.5 2.5 5.5 6.5 5.5Z" />
    </>
  ),
  star: (
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
  ),
  store: (
    <>
      <path d="M4 10v10h16V10" />
      <path d="M3 10 4.5 4h15L21 10a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 9h4l3 3.5V16h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18.5 14.5A6.5 6.5 0 0 1 21.5 20" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12" />
      <path d="M16.5 13.5h.01" />
    </>
  ),
  fruit: (
    <>
      <path d="M12 7.5c-1.6-1.2-4.6-1.3-6.2.6-1.9 2.2-1.2 6.3.9 9 1.4 1.8 2.9 2.6 4 1.9.7-.4 1.9-.4 2.6 0 1.1.7 2.6-.1 4-1.9 2.1-2.7 2.8-6.8.9-9-1.6-1.9-4.6-1.8-6.2-.6Z" />
      <path d="M12 7.5c0-2 .8-3.6 2.3-4.5" />
    </>
  ),
  vegetable: (
    <>
      <path d="M14.5 9.5 4 20l.2-.2c3.5-1 8.6-3.6 11.2-6.2a2.9 2.9 0 0 0-.9-4.1Z" />
      <path d="M15 9c.3-2 1.3-3.6 3-4.5M15.5 9.5c1.6-.8 3.4-.9 5-.3M14.8 8.7c-.6-1.6-.5-3.4.3-5" />
      <path d="m8.5 15.5 1.5 1.5M11 13l1.3 1.3" />
    </>
  ),
  honey: (
    <>
      <path d="M7 8h10l1 3v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7l1-3Z" />
      <path d="M8 5h8v3H8z" />
      <path d="M9.5 13.5h5l-1 2.5h-3z" />
    </>
  ),
  milk: (
    <>
      <path d="M9 3h6v3l2 3v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9l2-3V3Z" />
      <path d="M7 12h10" />
    </>
  ),
  egg: <path d="M12 3c-3.3 0-6 5-6 9.5S8.7 21 12 21s6-4 6-8.5S15.3 3 12 3Z" />,
  herb: (
    <>
      <path d="M12 21V9" />
      <path d="M12 13c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 10c0-3 2-5 5-5 0 3-2 5-5 5ZM12 17c2.5 0 4.5-1.6 4.5-4-2.5 0-4.5 1.6-4.5 4Z" />
    </>
  ),
  grain: (
    <>
      <path d="M12 21V5" />
      <path d="M12 8c-2 0-3.5-1.5-3.5-3.5C10.5 4.5 12 6 12 8ZM12 8c2 0 3.5-1.5 3.5-3.5C13.5 4.5 12 6 12 8ZM12 13c-2 0-3.5-1.5-3.5-3.5 2 0 3.5 1.5 3.5 3.5ZM12 13c2 0 3.5-1.5 3.5-3.5-2 0-3.5 1.5-3.5 3.5ZM12 18c-2 0-3.5-1.5-3.5-3.5 2 0 3.5 1.5 3.5 3.5ZM12 18c2 0 3.5-1.5 3.5-3.5-2 0-3.5 1.5-3.5 3.5Z" />
    </>
  ),
  nut: (
    <>
      <path d="M12 4c4.5 0 7 3 7 6.5S16 20 12 20 5 14 5 10.5 7.5 4 12 4Z" />
      <path d="M5.5 9h13M12 4v5" />
    </>
  ),
  wine: (
    <>
      <path d="M8 3h8l-.5 6a3.5 3.5 0 0 1-7 0L8 3Z" />
      <path d="M12 12.5V20M8.5 20h7" />
    </>
  ),
  flower: (
    <>
      <circle cx="12" cy="9" r="2.2" />
      <path d="M12 6.8c0-2 1-3.3 2.3-3.3s2.2 1.6 1 3.5M14.2 9.6c1.9.6 3 1.8 2.6 3s-2.3 1.4-3.6-.1M10.6 10.8c-1.2 1.6-2.7 2-3.5 1.1s-.2-2.5 1.7-3.3M9.7 8c-1.9-.4-3-1.6-2.7-2.9S9.2 3.6 10.5 5" />
      <path d="M12 11.2V21M12 17c-2 0-3.5-1.2-4-3M12 18.5c1.8 0 3.2-1 3.8-2.6" />
    </>
  ),
};

/** Икона за категория продукция (по името от CATEGORIES). */
export function categoryIcon(category: string | null | undefined): IconName {
  switch (category) {
    case "Плодове":
      return "fruit";
    case "Зеленчуци":
      return "vegetable";
    case "Мед и пчелни продукти":
      return "honey";
    case "Млечни продукти":
      return "milk";
    case "Месо и яйца":
      return "egg";
    case "Зърнени култури":
      return "grain";
    case "Билки и подправки":
      return "herb";
    case "Ядки":
      return "nut";
    case "Вино и напитки":
      return "wine";
    case "Цветя и разсади":
      return "flower";
    default:
      return "leaf";
  }
}
