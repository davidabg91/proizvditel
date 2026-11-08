import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Марката „Производител.net" — икона (logo.png) + wordmark.
 */
export function Logo({
  className,
  href = "/",
  withTagline = false,
  tone = "default",
}: {
  className?: string;
  href?: string;
  withTagline?: boolean;
  /** "light" — за тъмен фон (футъра). */
  tone?: "default" | "light";
}) {
  const light = tone === "light";
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Производител.net — начало"
    >
      <Image
        src="/logo.png"
        alt=""
        width={40}
        height={40}
        className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
        priority
      />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-serif text-xl font-semibold tracking-tight sm:text-2xl",
            light ? "text-white" : "text-foreground",
          )}
        >
          Производител
          <span className={light ? "text-[#f0c977]" : "text-accent"}>.net</span>
        </span>
        {withTagline ? (
          <span
            className={cn(
              "mt-1 text-[0.7rem] font-medium uppercase tracking-[0.16em]",
              light ? "text-white/55" : "text-muted-foreground",
            )}
          >
            Направо от нивата
          </span>
        ) : null}
      </span>
    </Link>
  );
}
