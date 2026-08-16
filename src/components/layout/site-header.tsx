"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { doSignOut } from "@/lib/auth-actions";
import { useCart } from "@/components/cart/cart-context";

function BasketIcon() {
  // Фермерска кошница за реколта
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <path d="M8.5 10a3.5 3.5 0 0 1 7 0" />
      <path d="M3.5 10h17l-1.2 8.1a2 2 0 0 1-2 1.7H6.7a2 2 0 0 1-2-1.7L3.5 10Z" />
      <path d="M4.2 13.7h15.6" />
      <path d="M9 10.2l.5 9.3M12 10v9.5M15 10.2l-.5 9.3" />
    </svg>
  );
}

function CartLink({ onClick, full }: { onClick?: () => void; full?: boolean }) {
  const { count, ready } = useCart();
  return (
    <Link
      href="/koshnitsa"
      onClick={onClick}
      aria-label="Кошница"
      title="Кошница"
      className={cn(
        "relative inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-primary",
        full && "w-full justify-start",
      )}
    >
      <BasketIcon />
      {full ? <span>Кошница</span> : null}
      {ready && count > 0 ? (
        <span
          className={cn(
            "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground",
            full ? "ml-1" : "absolute -right-1 -top-1",
          )}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export type HeaderUser = {
  name: string;
  slug: string;
  role: string;
  unread: number;
} | null;

function MessagesLink({
  unread,
  onClick,
  full,
}: {
  unread: number;
  onClick?: () => void;
  full?: boolean;
}) {
  return (
    <Link
      href="/sabshteniya"
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        full && "w-full justify-start",
      )}
    >
      Съобщения
      {unread > 0 ? (
        <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
          {unread}
        </span>
      ) : null}
    </Link>
  );
}

const NAV = [
  { href: "/proizvoditeli", label: "Производители" },
  { href: "/katalog", label: "Каталог" },
  { href: "/savmestno", label: "Съвместно" },
  { href: "/forum", label: "Форум" },
  { href: "/blog", label: "Блог" },
  { href: "/novini", label: "Новини" },
];

export function SiteHeader({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <CartLink />
          {user ? (
            <>
              <MessagesLink unread={user.unread} />
              {user.role === "producer" ? (
                <Button href="/tablo" variant="outline" size="sm">
                  Табло
                </Button>
              ) : null}
              <form action={doSignOut}>
                <Button variant="ghost" size="sm" type="submit">
                  Изход
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button href="/vhod" variant="ghost" size="sm">
                Вход
              </Button>
              <Button href="/registraciya" variant="primary" size="sm">
                Регистрирай стопанство
              </Button>
            </>
          )}
        </div>

        {/* Мобилен бутон */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-foreground hover:bg-surface-muted lg:hidden"
          aria-label="Меню"
          aria-expanded={open}
        >
          <span className="relative block h-4 w-5">
            <span
              className={cn(
                "absolute left-0 h-0.5 w-5 bg-current transition-all",
                open ? "top-1.5 rotate-45" : "top-0",
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-1.5 h-0.5 w-5 bg-current transition-opacity",
                open && "opacity-0",
              )}
            />
            <span
              className={cn(
                "absolute left-0 h-0.5 w-5 bg-current transition-all",
                open ? "top-1.5 -rotate-45" : "top-3",
              )}
            />
          </span>
        </button>
      </div>

      {/* Мобилно меню */}
      {open ? (
        <div className="border-t border-border bg-surface lg:hidden">
          <nav className="container-page flex flex-col py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              <CartLink full onClick={() => setOpen(false)} />
              {user ? (
                <>
                  <MessagesLink unread={user.unread} full onClick={() => setOpen(false)} />
                  {user.role === "producer" ? (
                    <Button href="/tablo" variant="outline" onClick={() => setOpen(false)}>
                      Табло
                    </Button>
                  ) : null}
                  <form action={doSignOut}>
                    <Button variant="ghost" type="submit" className="w-full justify-start">
                      Изход
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Button href="/vhod" variant="outline" onClick={() => setOpen(false)}>
                    Вход
                  </Button>
                  <Button href="/registraciya" variant="primary" onClick={() => setOpen(false)}>
                    Регистрирай стопанство
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
