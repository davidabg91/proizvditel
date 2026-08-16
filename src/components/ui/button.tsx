import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "accent" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center font-semibold whitespace-nowrap select-none transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm focus-visible:outline-primary",
  accent:
    "bg-accent text-accent-foreground hover:bg-accent-hover shadow-sm focus-visible:outline-accent",
  secondary:
    "bg-surface-muted text-foreground hover:bg-border focus-visible:outline-primary",
  outline:
    "border border-border-strong bg-surface text-foreground hover:bg-surface-muted focus-visible:outline-primary",
  ghost:
    "text-foreground hover:bg-surface-muted focus-visible:outline-primary",
  danger:
    "bg-danger text-white hover:opacity-90 shadow-sm focus-visible:outline-danger",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-[var(--radius-sm)] gap-1.5",
  md: "h-11 px-5 text-sm rounded-[var(--radius-md)] gap-2",
  lg: "h-13 px-7 text-base rounded-[var(--radius-md)] gap-2",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

type ButtonAsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<React.ComponentProps<typeof Link>, "className"> & { href: string };

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", className } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in props && props.href !== undefined) {
    const { variant: _v, size: _s, className: _c, href, ...rest } = props;
    return (
      <Link href={href} className={classes} {...rest} />
    );
  }

  const { variant: _v, size: _s, className: _c, href: _h, ...rest } =
    props as ButtonAsButton;
  return <button className={classes} {...rest} />;
}
