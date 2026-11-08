import Link from "next/link";
import { HeroSearch } from "@/components/home/hero-search";
import { FieldBackdrop } from "@/components/brand/field-backdrop";
import { Icon, type IconName } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Началният екран — заема цялата височина под хедъра и лентата за времето.
 *
 * Идеята е посетителят да разбере с един поглед три неща: какво е сайтът
 * (храна директно от стопанствата), как се ползва (търсачката) и защо да му
 * се вярва (редът с гаранции). Производителите имат собствен, по-тих вход.
 */

const CATEGORIES: { slug: string; label: string; icon: IconName }[] = [
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
      <FieldBackdrop id="home-hero" />

      <div className="container-page relative z-10 flex flex-1 flex-col items-center justify-center pb-[clamp(6rem,15vh,9rem)] pt-10 text-center sm:pt-12 [@media(max-height:820px)]:pt-8">
        <p className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f1d9a6] backdrop-blur-sm sm:px-4 sm:text-xs sm:tracking-[0.16em]">
          <Icon name="sprout" size={14} />
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
                <Icon name={c.icon} size={16} strokeWidth={1.7} />
              </span>
              {c.label}
            </Link>
          ))}
        </nav>

        <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-left text-[13px] text-white/85 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-8 sm:text-sm">
          {PROMISES.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <Icon name="check-circle" size={18} className="text-[#f0c977]" />
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
