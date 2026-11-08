import Link from "next/link";
import { HeroSearch } from "@/components/home/hero-search";
import { cn } from "@/lib/utils";

/**
 * Началният екран — заема цялата височина под хедъра и лентата за времето.
 *
 * Идеята е посетителят да разбере с един поглед три неща: какво е сайтът
 * (храна директно от стопанствата), как се ползва (търсачката) и защо да му
 * се вярва (редът с гаранции). Производителите имат собствен, по-тих вход.
 */

const CATEGORIES: { slug: string; label: string; icon: CategoryIconKind }[] = [
  { slug: "plodove", label: "Плодове", icon: "fruit" },
  { slug: "zelenchutsi", label: "Зеленчуци", icon: "vegetable" },
  { slug: "med", label: "Мед", icon: "honey" },
  { slug: "mlechni-produkti", label: "Млечни", icon: "milk" },
  { slug: "meso-i-yaytsa", label: "Месо и яйца", icon: "egg" },
  { slug: "bilki-i-podpravki", label: "Билки", icon: "herb" },
];

const PROMISES = [
  "Директно от стопанството",
  "Без прекупвачи",
  "Карта или наложен платеж",
  "Проверени производители",
];

export function HomeHero() {
  return (
    <section
      className={cn(
        "relative isolate flex flex-col overflow-hidden text-white",
        // Цял екран минус хедъра (4rem) и лентата за времето (~2.6rem).
        "min-h-[calc(100svh-6.6rem)]",
      )}
    >
      <HeroBackdrop />

      <div className="container-page relative z-10 flex flex-1 flex-col items-center justify-center pb-[clamp(6rem,15vh,9rem)] pt-10 text-center sm:pt-12 [@media(max-height:820px)]:pt-8">
        <p className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f1d9a6] backdrop-blur-sm sm:px-4 sm:text-xs sm:tracking-[0.16em]">
          <SproutIcon />
          Сайт за земеделски производители
        </p>

        <h1 className="mt-6 max-w-5xl text-[2.25rem] leading-[1.06] text-white sm:text-6xl xl:text-[4.25rem] [@media(max-height:820px)]:mt-5 [@media(max-height:820px)]:xl:text-6xl">
          Прясна храна директно от{" "}
          <br className="hidden sm:block" />
          <span className="italic text-[#f0c977]">българските производители</span>
        </h1>

        <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/80 sm:text-lg lg:text-xl">
          Плодове, зеленчуци, мед, сирене и месо от стопанства във всички 28
          области.{" "}
          <span className="hidden sm:inline">
            Поръчвате от човека, който ги отглежда — без посредник.
          </span>
        </p>

        <HeroSearch />

        <nav
          aria-label="Популярни категории"
          className="no-scrollbar -mx-6 mt-6 flex w-[calc(100%+3rem)] gap-2 overflow-x-auto px-6 sm:mx-0 sm:w-auto sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
        >
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/katalog/${c.slug}`}
              className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] py-1.5 pl-1.5 pr-4 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white hover:text-primary"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-[#f0c977] transition-colors group-hover:bg-primary-soft group-hover:text-primary">
                <CategoryIcon kind={c.icon} />
              </span>
              {c.label}
            </Link>
          ))}
        </nav>

        <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-left text-[13px] text-white/85 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-8 sm:text-sm">
          {PROMISES.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <CheckIcon />
              {p}
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm text-white/65">
          Отглеждате продукция?{" "}
          <Link
            href="/za-proizvoditeli"
            className="font-semibold text-[#f0c977] underline-offset-4 hover:underline"
          >
            Създайте безплатен профил на стопанството →
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ── Фон: зелено небе по зазоряване, слънце и ниви ─────────────────── */

function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#123126_0%,#1a4031_45%,#245039_100%)]" />
      {/* Ниско слънце горе вдясно */}
      <div className="absolute -right-24 -top-32 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(240,201,119,0.42)_0%,rgba(240,201,119,0.12)_40%,transparent_70%)] sm:right-[8%]" />
      <div className="absolute -left-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(120,170,130,0.18)_0%,transparent_70%)]" />
      {/* Фините земеделски мотиви от стария фон — обърнати в светли линии */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero-pattern.webp"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.07] mix-blend-screen invert"
      />
      <Fields />
    </div>
  );
}

/** Хълмове с редове посеви; последният слой е в цвета на страницата. */
function Fields() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-[clamp(5.5rem,16vh,10rem)] w-full"
      viewBox="0 0 1440 260"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="hero-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f5f47" />
          <stop offset="1" stopColor="#264f3b" />
        </linearGradient>
        <linearGradient id="hero-wheat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c99a4b" />
          <stop offset="1" stopColor="#a9752a" />
        </linearGradient>
        <linearGradient id="hero-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a7d57" />
          <stop offset="1" stopColor="#3a6a49" />
        </linearGradient>
      </defs>

      {/* Далечни хълмове */}
      <path
        d="M0 120 C 180 70 340 80 520 108 S 860 150 1040 104 S 1320 60 1440 92 V260 H0Z"
        fill="url(#hero-far)"
        opacity="0.9"
      />
      {/* Житна нива */}
      <path
        d="M0 168 C 220 120 420 132 640 160 S 1020 196 1220 150 S 1400 130 1440 138 V260 H0Z"
        fill="url(#hero-wheat)"
        opacity="0.92"
      />
      <g stroke="#e9c27a" strokeOpacity="0.35" strokeWidth="1.2" fill="none">
        <path d="M60 186 C 260 150 440 160 660 184 S 1020 214 1240 176" />
        <path d="M120 204 C 300 176 470 182 680 202 S 1010 226 1260 196" />
      </g>
      {/* Зелена нива отпред вляво */}
      <path
        d="M0 200 C 160 176 300 182 470 206 S 780 236 980 244 S 1180 256 1260 260 H0Z"
        fill="url(#hero-green)"
      />
      {/* Преход към страницата */}
      <path
        d="M0 236 C 260 218 520 222 760 238 S 1220 252 1440 228 V260 H0Z"
        fill="var(--color-background)"
      />
    </svg>
  );
}

/* ── Икони (тънки линии, в стила на останалите в сайта) ──────────────── */

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function SproutIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden {...STROKE}>
      <path d="M12 21v-9" />
      <path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6Z" />
      <path d="M12 14c0-3.5-2.5-5.5-6.5-5.5 0 3.5 2.5 5.5 6.5 5.5Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="18"
      height="18"
      aria-hidden
      className="shrink-0 text-[#f0c977]"
    >
      <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.18" />
      <path
        d="m6.3 10.2 2.4 2.4 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type CategoryIconKind = "fruit" | "vegetable" | "honey" | "milk" | "egg" | "herb";

function CategoryIcon({ kind }: { kind: CategoryIconKind }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...STROKE}>
      {kind === "fruit" ? (
        <>
          <path d="M12 7.5c-1.6-1.2-4.6-1.3-6.2.6-1.9 2.2-1.2 6.3.9 9 1.4 1.8 2.9 2.6 4 1.9.7-.4 1.9-.4 2.6 0 1.1.7 2.6-.1 4-1.9 2.1-2.7 2.8-6.8.9-9-1.6-1.9-4.6-1.8-6.2-.6Z" />
          <path d="M12 7.5c0-2 .8-3.6 2.3-4.5" />
        </>
      ) : kind === "vegetable" ? (
        <>
          <path d="M14.5 9.5 4 20l.2-.2c3.5-1 8.6-3.6 11.2-6.2a2.9 2.9 0 0 0-.9-4.1Z" />
          <path d="M15 9c.3-2 1.3-3.6 3-4.5M15.5 9.5c1.6-.8 3.4-.9 5-.3M14.8 8.7c-.6-1.6-.5-3.4.3-5" />
          <path d="m8.5 15.5 1.5 1.5M11 13l1.3 1.3" />
        </>
      ) : kind === "honey" ? (
        <>
          <path d="M7 8h10l1 3v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7l1-3Z" />
          <path d="M8 5h8v3H8z" />
          <path d="M9.5 13.5h5l-1 2.5h-3z" />
        </>
      ) : kind === "milk" ? (
        <>
          <path d="M9 3h6v3l2 3v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9l2-3V3Z" />
          <path d="M7 12h10" />
        </>
      ) : kind === "egg" ? (
        <path d="M12 3c-3.3 0-6 5-6 9.5S8.7 21 12 21s6-4 6-8.5S15.3 3 12 3Z" />
      ) : (
        <>
          <path d="M5 20C5 11 10 5 19 4c0 9-5 15-14 16Z" />
          <path d="M5 20 14 10" />
        </>
      )}
    </svg>
  );
}
