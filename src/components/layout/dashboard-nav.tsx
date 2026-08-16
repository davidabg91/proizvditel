"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/tablo", label: "Преглед", exact: true },
  { href: "/tablo/porachki", label: "Поръчки" },
  { href: "/tablo/profil", label: "Профил на стопанството" },
  { href: "/tablo/produkciya", label: "Продукция" },
  { href: "/tablo/snimki", label: "Снимки" },
  { href: "/tablo/produkti", label: "Обяви за продажба" },
  { href: "/tablo/blog", label: "Блог" },
  { href: "/tablo/klienti", label: "Клиенти и оценки" },
  { href: "/tablo/partnyori", label: "Партньори за доставка" },
  { href: "/tablo/plashtania", label: "Начини на плащане" },
];

export function DashboardNav({
  partnerRequests = 0,
  newOrders = 0,
}: {
  partnerRequests?: number;
  newOrders?: number;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        const badge =
          item.href === "/tablo/partnyori" && partnerRequests > 0
            ? partnerRequests
            : item.href === "/tablo/porachki" && newOrders > 0
              ? newOrders
              : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between gap-2 rounded-[var(--radius-md)] px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground/80 hover:bg-surface-muted hover:text-foreground",
            )}
          >
            <span>{item.label}</span>
            {badge > 0 ? (
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                  active ? "bg-primary-foreground text-primary" : "bg-accent text-accent-foreground",
                )}
              >
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
