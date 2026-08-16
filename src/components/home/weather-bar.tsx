"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { WeatherIcon } from "./weather-icon";

type Weather = {
  temp: number;
  apparent: number;
  humidity: number;
  wind: number;
  gusts: number;
  code: number;
  isDay: boolean;
  tMin: number;
  tMax: number;
  rainProb: number;
  uv: number;
  sunrise: string;
  sunset: string;
  place?: string;
};

const WMO: Record<number, string> = {
  0: "Ясно", 1: "Предимно ясно", 2: "Променлива облачност", 3: "Облачно",
  45: "Мъгла", 48: "Мъгла", 51: "Слаб ръмеж", 53: "Ръмеж", 55: "Силен ръмеж",
  61: "Слаб дъжд", 63: "Дъжд", 65: "Силен дъжд", 66: "Леден дъжд", 67: "Леден дъжд",
  71: "Слаб сняг", 73: "Сняг", 75: "Силен сняг", 77: "Снежни зърна",
  80: "Превалявания", 81: "Превалявания", 82: "Силни превалявания",
  85: "Снеговалеж", 86: "Снеговалеж", 95: "Гръмотевична буря",
  96: "Буря с градушка", 99: "Силна буря с градушка",
};

function advisory(w: Weather): { label: string; tone: "success" | "accent" | "danger" | "info" } {
  if (w.tMin <= 1) return { label: "Опасност от слана нощес", tone: "danger" };
  if (w.wind >= 25 || w.gusts >= 40)
    return { label: "Силен вятър — избягвайте пръскане", tone: "danger" };
  if (w.rainProb >= 60) return { label: `Вероятен дъжд (${w.rainProb}%)`, tone: "info" };
  if (w.uv >= 8) return { label: "Много висок UV — пазете се по обяд", tone: "accent" };
  if (w.isDay && w.wind <= 15 && w.rainProb < 40)
    return { label: "Подходящо за пръскане и полска работа", tone: "success" };
  if (!w.isDay) return { label: "Проверете прогнозата преди утрешната работа", tone: "info" };
  return { label: "Спокойни условия за работа", tone: "success" };
}

function hhmm(iso: string) {
  return new Intl.DateTimeFormat("bg-BG", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

const toneClass: Record<string, string> = {
  success: "bg-success-soft text-success",
  accent: "bg-accent-soft text-accent",
  danger: "bg-danger-soft text-danger",
  info: "bg-primary-soft text-primary",
};

export function WeatherBar() {
  const [state, setState] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const [w, setW] = useState<Weather | null>(null);

  const clipRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [duration, setDuration] = useState(30);

  async function load(lat: number, lon: number) {
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,is_day` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset` +
        `&timezone=auto&forecast_days=1`;
      const res = await fetch(url);
      const j = await res.json();
      const c = j.current;
      const d = j.daily;
      let place: string | undefined;
      try {
        const g = await (
          await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=bg`,
          )
        ).json();
        place = g.city || g.locality || g.principalSubdivision;
      } catch {}
      setW({
        temp: Math.round(c.temperature_2m),
        apparent: Math.round(c.apparent_temperature),
        humidity: c.relative_humidity_2m,
        wind: Math.round(c.wind_speed_10m),
        gusts: Math.round(c.wind_gusts_10m),
        code: c.weather_code,
        isDay: c.is_day === 1,
        tMin: Math.round(d.temperature_2m_min[0]),
        tMax: Math.round(d.temperature_2m_max[0]),
        rainProb: d.precipitation_probability_max?.[0] ?? 0,
        uv: Math.round(d.uv_index_max?.[0] ?? 0),
        sunrise: d.sunrise[0],
        sunset: d.sunset[0],
        place,
      });
      setState("ready");
    } catch {
      setState("error");
    }
  }

  function requestLocation() {
    if (!("geolocation" in navigator)) return setState("error");
    setState("loading");
    navigator.geolocation.getCurrentPosition(
      (p) => load(p.coords.latitude, p.coords.longitude),
      () => setState("denied"),
      { timeout: 10000, maximumAge: 30 * 60 * 1000 },
    );
  }

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Определяме дали съдържанието се събира; ако не — включваме тикер
  useEffect(() => {
    if (state !== "ready") return;
    function measure() {
      const clip = clipRef.current;
      const group = groupRef.current;
      if (!clip || !group) return;
      const groupWidth = group.offsetWidth;
      setOverflow(groupWidth > clip.clientWidth + 4);
      setDuration(Math.max(Math.round(groupWidth / 55), 16));
    }
    const id = window.setTimeout(measure, 50);
    window.addEventListener("resize", measure);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", measure);
    };
  }, [state, w]);

  // Прибрани състояния — слим лента
  if (state !== "ready" || !w) {
    return (
      <div className="border-b border-border bg-surface">
        <div className="flex h-9 w-full items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:px-6">
          <span>
            {state === "loading"
              ? "Зареждаме времето за вашия район…"
              : "Времето и условията за работа във вашия район"}
          </span>
          {state === "denied" || state === "error" ? (
            <button
              onClick={requestLocation}
              className="shrink-0 font-semibold text-primary hover:underline"
            >
              Покажи времето
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const adv = advisory(w);

  const group = (
    ref?: React.Ref<HTMLDivElement>,
    hidden?: boolean,
    spaced = true,
  ) => (
    <div
      ref={ref}
      aria-hidden={hidden}
      className={cn("flex shrink-0 items-center gap-6 text-sm", spaced && "pr-6")}
    >
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <WeatherIcon code={w.code} isDay={w.isDay} />
        <span className="text-muted-foreground">{w.place ?? "Вашият район"}</span>
        <span className="text-border-strong">·</span>
        <span>{WMO[w.code] ?? "—"}</span>
        <span className="font-serif text-base">{w.temp}°</span>
      </div>
      <Metric label="усеща се" value={`${w.apparent}°`} />
      <Metric label="мин / макс" value={`${w.tMin}° / ${w.tMax}°`} />
      <Metric label="влажност" value={`${w.humidity}%`} />
      <Metric label="вятър" value={`${w.wind} км/ч`} />
      <Metric label="дъжд" value={`${w.rainProb}%`} />
      <Metric label="UV" value={`${w.uv}`} />
      <Metric label="изгрев / залез" value={`${hhmm(w.sunrise)} / ${hhmm(w.sunset)}`} />
      <span
        className={cn(
          "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
          toneClass[adv.tone],
        )}
      >
        {adv.label}
      </span>
    </div>
  );

  return (
    <div className="border-b border-border bg-surface">
      <div
        ref={clipRef}
        className="ticker-clip w-full overflow-hidden px-4 py-2 sm:px-6"
      >
        {overflow ? (
          <div
            className="ticker-track flex w-max"
            style={{ animationDuration: `${duration}s` }}
          >
            {group(groupRef, false, true)}
            {group(undefined, true, true)}
          </div>
        ) : (
          <div className="flex justify-center">{group(groupRef, false, false)}</div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
