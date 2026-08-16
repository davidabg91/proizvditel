import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Типографски wordmark на марката „Производител".
 * Съзнателно без иконка — само изчистена типография.
 */
export function Logo({
  className,
  href = "/",
  withTagline = false,
}: {
  className?: string;
  href?: string;
  withTagline?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex flex-col leading-none", className)}
      aria-label="Производител — начало"
    >
      <span className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        производител
        <span className="text-accent">.net</span>
      </span>
      {withTagline ? (
        <span className="mt-0.5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Направо от нивата
        </span>
      ) : null}
    </Link>
  );
}
