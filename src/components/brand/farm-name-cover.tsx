import { cn, cleanFarmName } from "@/lib/utils";

/**
 * Корица по подразбиране за стопанство без собствена снимка: фирменият зелен
 * фон, а върху него името на стопанството, изписано като на ръка — вместо
 * празно зелено поле.
 */
export function FarmNameCover({
  farmName,
  place,
  size = "card",
  className,
}: {
  farmName: string;
  place?: string | null;
  size?: "card" | "profile";
  className?: string;
}) {
  const profile = size === "profile";
  const name = cleanFarmName(farmName);
  const long = name.length > 22;

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-primary px-6 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_82%_0%,rgba(240,201,119,0.4),transparent_55%),linear-gradient(170deg,#123126,#245039)]"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero-pattern.webp"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-[0.07] mix-blend-screen invert"
      />

      <p
        className={cn(
          "font-[family-name:var(--font-hand)]",
          "relative line-clamp-2 font-bold leading-[0.95] text-[#f6dfa6] [text-shadow:0_2px_12px_rgba(0,0,0,0.35)]",
          profile
            ? "max-w-4xl text-[2.9rem] sm:text-7xl lg:text-8xl"
            : cn("mt-5 max-w-full", long ? "text-[1.6rem]" : "text-[2rem]"),
        )}
      >
        {name}
      </p>

      {/* Тънка житна линия под името */}
      <svg
        aria-hidden
        viewBox="0 0 160 12"
        className={cn("relative text-[#f0c977]/70", profile ? "mt-2 w-40 sm:mt-3 sm:w-56" : "mt-1 w-24")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path d="M4 8c30-6 60-6 76-2s46 4 76-2" />
      </svg>

      {profile && place ? (
        <p className="relative mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/65 sm:mt-3 sm:text-sm">
          {place}
        </p>
      ) : null}
    </div>
  );
}
