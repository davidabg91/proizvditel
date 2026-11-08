import { cn } from "@/lib/utils";

/**
 * Житната линия, която отделя светла секция от зелена — същата като в
 * долния край на началния екран. Слага се в горния край на зелен панел:
 * отгоре е цветът на страницата, по средата житна ивица, отдолу прозира
 * зеленото на панела.
 *
 * Височината на SVG-то е равна на височината на viewBox-а, затова ивицата
 * е с постоянна дебелина и само се разтяга на ширина.
 */
export function WheatEdge({
  id,
  className,
  fill = "var(--color-background)",
}: {
  id: string;
  className?: string;
  /** Цветът на секцията над линията. */
  fill?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 64"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute inset-x-0 -top-px h-[65px] w-full", className)}
    >
      <defs>
        <linearGradient id={`${id}-wheat-edge`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a9752a" />
          <stop offset="0.5" stopColor="#d2a456" />
          <stop offset="1" stopColor="#a9752a" />
        </linearGradient>
      </defs>
      {/* Цветът на горната секция */}
      <path
        d="M0 0H1440V30C1190 52 950 12 710 30S230 56 0 24Z"
        fill={fill}
      />
      {/* Житната ивица */}
      <path
        d="M0 24C230 56 470 48 710 30S1190 52 1440 30V40C1190 62 950 22 710 40S230 66 0 34Z"
        fill={`url(#${id}-wheat-edge)`}
      />
      {/* Тънка светла линия по ръба — като отблясък по житото */}
      <path
        d="M0 24C230 56 470 48 710 30S1190 52 1440 30"
        fill="none"
        stroke="#f0c977"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
