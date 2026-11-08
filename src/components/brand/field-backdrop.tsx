import { cn } from "@/lib/utils";

/**
 * Фирменият фон на сайта: зелено небе по зазоряване, ниско слънце и ниви.
 * Ползва се от началния екран, от банерите на вътрешните страници и от
 * футъра, за да изглежда всичко като едно цяло.
 *
 * `id` трябва да е уникален в страницата — от него се правят имената на
 * SVG градиентите, а два фона с едни и същи имена си пречат.
 */
export function FieldBackdrop({
  id,
  fields = "bottom",
  fieldsClassName,
  fadeTo = "var(--color-background)",
}: {
  id: string;
  /** Къде са нивите: долу (с преход към страницата) или никъде. */
  fields?: "bottom" | "none";
  fieldsClassName?: string;
  /** Цветът, в който нивите преминават — обикновено фонът на страницата. */
  fadeTo?: string;
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#123126_0%,#1a4031_45%,#245039_100%)]" />
      {/* Ниско слънце горе вдясно */}
      <div className="absolute -right-24 -top-32 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(240,201,119,0.42)_0%,rgba(240,201,119,0.12)_40%,transparent_70%)] sm:right-[8%]" />
      <div className="absolute -left-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(120,170,130,0.18)_0%,transparent_70%)]" />
      {/* Фините земеделски мотиви — обърнати в светли линии */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero-pattern.webp"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.07] mix-blend-screen invert"
      />
      {fields === "bottom" ? (
        <Fields id={id} fadeTo={fadeTo} className={fieldsClassName} />
      ) : null}
    </div>
  );
}

/** Хълмове с редове посеви; последният слой е в цвета на страницата. */
function Fields({
  id,
  fadeTo,
  className,
}: {
  id: string;
  fadeTo: string;
  className?: string;
}) {
  return (
    <svg
      className={cn(
        "absolute inset-x-0 bottom-0 h-[clamp(5.5rem,16vh,10rem)] w-full",
        className,
      )}
      viewBox="0 0 1440 260"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`${id}-far`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f5f47" />
          <stop offset="1" stopColor="#264f3b" />
        </linearGradient>
        <linearGradient id={`${id}-wheat`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c99a4b" />
          <stop offset="1" stopColor="#a9752a" />
        </linearGradient>
        <linearGradient id={`${id}-green`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a7d57" />
          <stop offset="1" stopColor="#3a6a49" />
        </linearGradient>
      </defs>

      {/* Далечни хълмове */}
      <path
        d="M0 120 C 180 70 340 80 520 108 S 860 150 1040 104 S 1320 60 1440 92 V260 H0Z"
        fill={`url(#${id}-far)`}
        opacity="0.9"
      />
      {/* Житна нива */}
      <path
        d="M0 168 C 220 120 420 132 640 160 S 1020 196 1220 150 S 1400 130 1440 138 V260 H0Z"
        fill={`url(#${id}-wheat)`}
        opacity="0.92"
      />
      <g stroke="#e9c27a" strokeOpacity="0.35" strokeWidth="1.2" fill="none">
        <path d="M60 186 C 260 150 440 160 660 184 S 1020 214 1240 176" />
        <path d="M120 204 C 300 176 470 182 680 202 S 1010 226 1260 196" />
      </g>
      {/* Зелена нива отпред вляво */}
      <path
        d="M0 200 C 160 176 300 182 470 206 S 780 236 980 244 S 1180 256 1260 260 H0Z"
        fill={`url(#${id}-green)`}
      />
      {/* Преход към страницата */}
      <path
        d="M0 236 C 260 218 520 222 760 238 S 1220 252 1440 228 V260 H0Z"
        fill={fadeTo}
      />
    </svg>
  );
}
