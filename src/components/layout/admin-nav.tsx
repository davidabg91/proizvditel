"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Преглед", exact: true },
  { href: "/admin/porachki", label: "Поръчки и плащания" },
  { href: "/admin/potrebiteli", label: "Потребители" },
  { href: "/admin/dokladi", label: "Доклади" },
];

export function AdminNav({ openReports = 0 }: { openReports?: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        const badge = item.href === "/admin/dokladi" && openReports > 0 ? openReports : 0;
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
                  active ? "bg-primary-foreground text-primary" : "bg-danger text-white",
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
