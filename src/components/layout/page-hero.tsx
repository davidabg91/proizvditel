import Link from "next/link";
import { FieldBackdrop } from "@/components/brand/field-backdrop";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

/**
 * Банерът в началото на вътрешните страници — същият зелен фон с ниви като
 * началния екран, само по-нисък. Така каталогът, блогът, форумът и правните
 * страници изглеждат като част от едно цяло.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  align = "left",
  children,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: Crumb[];
  align?: "left" | "center";
  /** Бутони, търсачка или друго под описанието. */
  children?: React.ReactNode;
  className?: string;
}) {
  const centered = align === "center";

  return (
    <section className={cn("relative isolate overflow-hidden text-white", className)}>
      <FieldBackdrop id="page-hero" fieldsClassName="h-[clamp(3.5rem,9vw,6.5rem)]" />

      <div
        className={cn(
          "container-page relative z-10 pb-[clamp(4.5rem,10vw,7.5rem)] pt-10 sm:pt-14",
          centered && "flex flex-col items-center text-center",
        )}
      >
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Пътечка" className="mb-5 text-sm text-white/65">
            <ol className={cn("flex flex-wrap items-center gap-1.5", centered && "justify-center")}>
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Начало
                </Link>
              </li>
              {breadcrumbs.map((c) => (
                <li key={c.label} className="flex items-center gap-1.5">
                  <span aria-hidden className="text-white/35">
                    /
                  </span>
                  {c.href ? (
                    <Link href={c.href} className="transition-colors hover:text-white">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-white/90">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        {eyebrow ? (
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#f1d9a6] backdrop-blur-sm sm:text-xs">
            <Icon name="sprout" size={13} />
            {eyebrow}
          </p>
        ) : null}

        <h1
          className={cn(
            "max-w-3xl text-[2rem] leading-[1.1] text-white sm:text-5xl",
            eyebrow ? "mt-4" : "",
          )}
        >
          {title}
        </h1>

        {description ? (
          <div className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            {description}
          </div>
        ) : null}

        {children ? <div className="mt-7 w-full">{children}</div> : null}
      </div>
    </section>
  );
}

/** Заглавие на секция: малък етикет, заглавие и връзка вдясно. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className={cn("text-2xl sm:text-3xl", eyebrow && "mt-2")}>{title}</h2>
        {description ? (
          <p className="mt-2 leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="group inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {action.label}
          <Icon
            name="arrow-right"
            size={16}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      ) : null}
    </div>
  );
}
