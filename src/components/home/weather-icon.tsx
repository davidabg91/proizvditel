import { cn } from "@/lib/utils";

type IconKind =
  | "sun"
  | "moon"
  | "cloud-sun"
  | "cloud-moon"
  | "cloud"
  | "fog"
  | "rain"
  | "snow"
  | "thunder";

/** Определя вида икона според WMO код и дали е ден. */
function kindFor(code: number, isDay: boolean): IconKind {
  if (code === 0 || code === 1) return isDay ? "sun" : "moon";
  if (code === 2) return isDay ? "cloud-sun" : "cloud-moon";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if (code >= 71 && code <= 77) return "snow";
  if (code === 85 || code === 86) return "snow";
  if (code >= 95) return "thunder";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  return "cloud";
}

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Cloud() {
  return <path d="M7 18h9a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 7.2 9.5 3.75 3.75 0 0 0 7 18Z" />;
}

export function WeatherIcon({
  code,
  isDay,
  className,
}: {
  code: number;
  isDay: boolean;
  className?: string;
}) {
  const kind = kindFor(code, isDay);
  const warm = kind === "sun" || kind === "thunder" || kind === "cloud-sun";

  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      className={cn("shrink-0", warm ? "text-accent" : "text-muted-foreground", className)}
      aria-hidden
      {...S}
    >
      {kind === "sun" && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
        </>
      )}

      {kind === "moon" && <path d="M20.5 13.2A8 8 0 1 1 10.8 3.5a6.2 6.2 0 0 0 9.7 9.7Z" />}

      {kind === "cloud" && <Cloud />}

      {kind === "cloud-sun" && (
        <>
          <path d="M8 5.5V4M4.7 6.7 3.9 5.9M11.3 6.7l.8-.8M4 10h-.5M8 8.2a3 3 0 0 1 3.8 1.3" />
          <Cloud />
        </>
      )}

      {kind === "cloud-moon" && (
        <>
          <path d="M15 6.2a3.2 3.2 0 0 1-3.4 3.9 3.2 3.2 0 0 0 3.4-3.9Z" />
          <Cloud />
        </>
      )}

      {kind === "fog" && (
        <>
          <path d="M5 9.5a4.5 4.5 0 0 1 8.8-1.3A3.2 3.2 0 0 1 17 8" />
          <path d="M4 13h13M6 16h13M8 19h9" />
        </>
      )}

      {kind === "rain" && (
        <>
          <path d="M7 15h9a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 7.2 6.5 3.75 3.75 0 0 0 7 15Z" />
          <path d="M8.5 18.5 8 20M12 18.5 11.5 20.5M15.5 18.5 15 20" />
        </>
      )}

      {kind === "snow" && (
        <>
          <path d="M7 15h9a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 7.2 6.5 3.75 3.75 0 0 0 7 15Z" />
          <path d="M9 18.5h.01M12 20h.01M15 18.5h.01" />
        </>
      )}

      {kind === "thunder" && (
        <>
          <path d="M7 15h9a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 7.2 6.5 3.75 3.75 0 0 0 7 15Z" />
          <path d="m12 15-2 3.2h2.4L10.5 21" />
        </>
      )}
    </svg>
  );
}
