import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { COMPANY } from "@/lib/company";

const COLUMNS = [
  {
    title: "Платформа",
    links: [
      { href: "/proizvoditeli", label: "Производители" },
      { href: "/katalog", label: "Каталог с продукти" },
      { href: "/savmestno", label: "Съвместна доставка" },
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
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo withTagline />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Свързваме българските земеделски производители директно с хората,
              които ценят прясната и местна продукция.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {col.title}
              </h4>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          <p className="leading-relaxed">
            {COMPANY.name} · ЕИК {COMPANY.eik} · {COMPANY.addressLines.join(", ")}
          </p>
          <p className="mt-1 leading-relaxed">
            {COMPANY.email} · {COMPANY.phone} · Дружеството не е регистрирано по ЗДДС
          </p>
          <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} Производител.net. Всички права запазени.</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/usloviya" className="hover:text-foreground">
                Общи условия
              </Link>
              <Link href="/poveritelnost" className="hover:text-foreground">
                Поверителност
              </Link>
              <Link href="/biskvitki" className="hover:text-foreground">
                Бисквитки
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
