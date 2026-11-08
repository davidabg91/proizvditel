import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { FieldBackdrop } from "@/components/brand/field-backdrop";
import { WheatEdge } from "@/components/brand/wheat-edge";
import { Icon } from "@/components/ui/icons";
import { COMPANY } from "@/lib/company";

const COLUMNS = [
  {
    title: "Платформа",
    links: [
      { href: "/proizvoditeli", label: "Производители" },
      { href: "/katalog", label: "Каталог с продукти" },
      { href: "/savmestno", label: "Съвместна доставка" },
      { href: "/za-proizvoditeli", label: "За производители" },
      { href: "/registraciya", label: "Регистрация" },
      { href: "/vhod", label: "Вход" },
    ],
  },
  {
    title: "Общност",
    links: [
      { href: "/blog", label: "Блог" },
      { href: "/forum", label: "Форум" },
      { href: "/novini", label: "Новини и събития" },
    ],
  },
  {
    title: "Информация",
    links: [
      { href: "/za-nas", label: "За нас" },
      { href: "/kak-raboti", label: "Как работи" },
      { href: "/kontakti", label: "Контакти" },
      { href: "/otkaz-ot-dogovor", label: "Отказ и рекламации" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative isolate mt-auto overflow-hidden text-white">
      <FieldBackdrop id="site-footer" fields="none" />
      {/* Житната линия, която отделя страницата от футъра */}
      <WheatEdge id="site-footer" />

      <div className="container-page relative pb-14 pt-24 sm:pb-16 sm:pt-28">
        {/* Покана за производителите */}
        <div className="flex flex-col items-start justify-between gap-5 rounded-[var(--radius-xl)] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="font-serif text-xl font-semibold text-white sm:text-2xl">
              Отглеждате продукция?
            </p>
            <p className="mt-1 text-sm text-white/70 sm:text-base">
              Създайте безплатен профил и продавайте директно на клиентите.
            </p>
          </div>
          <Link
            href="/za-proizvoditeli"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#f0c977] px-6 text-sm font-semibold text-[#1a3a2c] transition-colors hover:bg-[#f5d792]"
          >
            Започнете безплатно
            <Icon name="arrow-right" size={16} />
          </Link>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo withTagline tone="light" />
            <p className="mt-4 text-sm leading-relaxed text-white/65">
              Свързваме българските земеделски производители директно с хората,
              които ценят прясната и местна продукция.
            </p>
            <ul className="mt-5 flex flex-col gap-2 text-sm text-white/75">
              <li>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Icon name="mail" size={16} className="text-[#f0c977]" />
                  {COMPANY.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 transition-colors hover:text-white"
                >
                  <Icon name="phone" size={16} className="text-[#f0c977]" />
                  {COMPANY.phone}
                </a>
              </li>
            </ul>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#f0c977]">
                {col.title}
              </h4>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/75 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-sm text-white/55">
          <p className="leading-relaxed">
            {COMPANY.name} · ЕИК {COMPANY.eik} · {COMPANY.addressLines.join(", ")} ·
            Дружеството не е регистрирано по ЗДДС
          </p>
          <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} Производител.net. Всички права запазени.</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/usloviya" className="transition-colors hover:text-white">
                Общи условия
              </Link>
              <Link href="/poveritelnost" className="transition-colors hover:text-white">
                Поверителност
              </Link>
              <Link href="/biskvitki" className="transition-colors hover:text-white">
                Бисквитки
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
