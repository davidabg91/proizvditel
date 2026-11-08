"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { WeatherIcon } from "./weather-icon";

export type DailyForecast = {
  date: string;
  dayName: string;
  code: number;
  tMin: number;
  tMax: number;
  rainProb: number;
  rainSum: number;
  windMax: number;
  gustsMax: number;
  uv: number;
  warning?: {
    severity: "danger" | "warning" | "notice";
    title: string;
    description: string;
    advice: string;
    icon: string;
  };
};

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
  forecast: DailyForecast[];
  highestAlert?: {
    severity: "danger" | "warning" | "notice";
    title: string;
    description: string;
    dayName: string;
    icon: string;
  };
};

const WMO: Record<number, string> = {
  0: "Ясно",
  1: "Предимно ясно",
  2: "Променлива облачност",
  3: "Облачно",
  45: "Мъгла",
  48: "Мъгла със скреж",
  51: "Слаб ръмеж",
  53: "Ръмеж",
  55: "Силен ръмеж",
  61: "Слаб дъжд",
  63: "Дъжд",
  65: "Силен дъжд",
  66: "Леден дъжд",
  67: "Леден дъжд",
  71: "Слаб сняг",
  73: "Сняг",
  75: "Силен сняг",
  77: "Снежни зърна",
  80: "Превалявания",
  81: "Превалявания",
  82: "Силни валежи",
  85: "Снеговалеж",
  86: "Силни снеговалежи",
  95: "Гръмотевична буря",
  96: "Буря с градушка",
  99: "Силна буря с градушка",
};

const BG_DAYS = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"];

export const BG_CITIES: Array<{ id: string; label: string; lat: number; lon: number }> = [
  { id: "sofia", label: "София", lat: 42.6977, lon: 23.3219 },
  { id: "plovdiv", label: "Пловдив", lat: 42.1354, lon: 24.7453 },
  { id: "varna", label: "Варна", lat: 43.2141, lon: 27.9147 },
  { id: "burgas", label: "Бургас", lat: 42.5048, lon: 27.4626 },
  { id: "ruse", label: "Русе", lat: 43.8356, lon: 25.9657 },
  { id: "stara_zagora", label: "Стара Загора", lat: 42.4258, lon: 25.6345 },
  { id: "pleven", label: "Плевен", lat: 43.417, lon: 24.6067 },
  { id: "veliko_tarnovo", label: "Велико Търново", lat: 43.0757, lon: 25.6172 },
  { id: "dobrich", label: "Добрич", lat: 43.5726, lon: 27.8273 },
  { id: "sliven", label: "Сливен", lat: 42.6817, lon: 26.3229 },
  { id: "pazardzhik", label: "Пазарджик", lat: 42.1928, lon: 24.3336 },
  { id: "blagoevgrad", label: "Благоевград", lat: 42.0209, lon: 23.0943 },
  { id: "haskovo", label: "Хасково", lat: 41.9344, lon: 25.5556 },
  { id: "shumen", label: "Шумен", lat: 43.2712, lon: 26.9361 },
  { id: "vratsa", label: "Враца", lat: 43.2102, lon: 23.5529 },
  { id: "yambol", label: "Ямбол", lat: 42.4842, lon: 26.5035 },
  { id: "gabrovo", label: "Габрово", lat: 42.8742, lon: 25.3187 },
  { id: "vidin", label: "Видин", lat: 43.9962, lon: 22.8779 },
  { id: "montana", label: "Монтана", lat: 43.4125, lon: 23.225 },
  { id: "lovech", label: "Ловеч", lat: 43.137, lon: 24.7142 },
  { id: "kyustendil", label: "Кюстендил", lat: 42.2869, lon: 22.6914 },
  { id: "kardzhali", label: "Кърджали", lat: 41.6435, lon: 25.3689 },
  { id: "smolyan", label: "Смолян", lat: 41.5774, lon: 24.7011 },
  { id: "silistra", label: "Силистра", lat: 44.1147, lon: 27.2606 },
  { id: "razgrad", label: "Разград", lat: 43.5262, lon: 26.5256 },
  { id: "targovishte", label: "Търговище", lat: 43.2512, lon: 26.5722 },
  { id: "pernik", label: "Перник", lat: 42.6052, lon: 23.0378 },
];

function getDayName(isoDate: string, index: number): string {
  if (index === 0) return "Днес";
  if (index === 1) return "Утре";
  const d = new Date(isoDate);
  return BG_DAYS[d.getDay()] || "Ден";
}

function evaluateDayWarning(
  code: number,
  tMin: number,
  tMax: number,
  rainProb: number,
  rainSum: number,
  windMax: number,
  gustsMax: number,
  uv: number,
  dayName: string,
): DailyForecast["warning"] {
  // 🔴 КРИТИЧНО (Червено) — Градушка, екстремни бури, ураганен вятър, силен мраз
  if (code === 96 || code === 99) {
    return {
      severity: "danger",
      title: "Опасност от градушка и буря",
      description: `Гръмотевична буря с риск от градушка (${dayName}).`,
      advice: "Приберете селскостопанска техника, автомобили и защитете оранжериите и чувствителната реколта.",
      icon: "⛈️",
    };
  }

  if (gustsMax >= 70 || windMax >= 45) {
    return {
      severity: "danger",
      title: `Опасни пориви на вятъра (до ${gustsMax} км/ч)`,
      description: `Много силен ураганен вятър (${dayName}).`,
      advice: "Укрепете оранжерийни конструкции, не пръскайте и укрепете младите насаждения.",
      icon: "🌪️",
    };
  }

  if (tMin <= -2) {
    return {
      severity: "danger",
      title: `Опасен студ / замръзване (${tMin}°C)`,
      description: `Отрицателни минимални температури (${dayName}).`,
      advice: "Защитете трайните насаждения от измръзване.",
      icon: "❄️",
    };
  }

  if (rainSum >= 40) {
    return {
      severity: "danger",
      title: `Проливни валежи (${rainSum} л/кв.м)`,
      description: `Риск от локални преовлажнявания и наводнения (${dayName}).`,
      advice: "Проверете отводнителните канали и канавки около стопанството.",
      icon: "🌊",
    };
  }

  // 🟠 ПРЕДУПРЕЖДЕНИЕ (Оранжево) — Слана, силен вятър, гръмотевици, висок UV
  if (tMin <= 1) {
    return {
      severity: "warning",
      title: `Риск от слана нощес (${tMin}°C)`,
      description: `Критично ниски температури за цъфтеж и ранни култури (${dayName}).`,
      advice: "Приложете задимяване, дъждуване или покриване на чувствителните площи.",
      icon: "❄️",
    };
  }

  if (code === 95) {
    return {
      severity: "warning",
      title: "Гръмотевична буря с валежи",
      description: `Очаква се развиване на гръмотевична облачност (${dayName}).`,
      advice: "Избягвайте полска работа на открито по време на гръмотевици.",
      icon: "⚡",
    };
  }

  if (gustsMax >= 45 || windMax >= 25) {
    return {
      severity: "warning",
      title: `Силен вятър (${gustsMax} км/ч)`,
      description: `Неподходящо за пръскане на култури (${dayName}).`,
      advice: "Отложете растителнозащитните пръскания заради голямо отнасяне на препарата.",
      icon: "💨",
    };
  }

  if (rainProb >= 75 && rainSum >= 15) {
    return {
      severity: "warning",
      title: `Обилни валежи (${rainSum} мм, ${rainProb}%)`,
      description: `Висока влажност и мокра почва (${dayName}).`,
      advice: "Не влизайте с тежка техника в кални ниви, за да избегнете утъпкване.",
      icon: "🌧️",
    };
  }

  if (uv >= 8) {
    return {
      severity: "warning",
      title: `Много висок UV индекс (${uv})`,
      description: `Силно слънчево греене в обедните часове (${dayName}).`,
      advice: "Избягвайте тежък физически труд на слънце между 12:00 и 16:00 ч.",
      icon: "☀️",
    };
  }

  // 🟡 ВНИМАНИЕ (Жълто) — Превалявания или умерени условия
  if (rainProb >= 60) {
    return {
      severity: "notice",
      title: `Вероятност за дъжд (${rainProb}%)`,
      description: `Очаквани превалявания (${dayName}).`,
      advice: "Планирайте прибирането на реколтата и обработката съобразно валежите.",
      icon: "🌦️",
    };
  }

  return undefined;
}

function hhmm(iso: string) {
  return new Intl.DateTimeFormat("bg-BG", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

const BG_DEFAULT = { lat: 42.73, lon: 25.4, label: "България" };

export function WeatherBar() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [w, setW] = useState<Weather | null>(null);
  const [showForecastModal, setShowForecastModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);
  const [locating, setLocating] = useState(false);

  async function load(lat: number, lon: number, forcedPlace?: string) {
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,is_day` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max,sunrise,sunset` +
        `&timezone=auto&forecast_days=5`;

      const res = await fetch(url);
      const j = await res.json();
      const c = j.current;
      const d = j.daily;

      let place: string | undefined = forcedPlace;
      if (!forcedPlace) {
        try {
          const g = await (
            await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=bg`,
            )
          ).json();
          place = g.city || g.locality || g.principalSubdivision;
        } catch {}
      }

      // Изчисляване на 5-дневна прогноза и предупреждения
      const forecast: DailyForecast[] = [];
      let highestAlert: Weather["highestAlert"] = undefined;

      const dates = d.time as string[];
      for (let i = 0; i < dates.length; i++) {
        const dayName = getDayName(dates[i], i);
        const code = d.weather_code[i];
        const tMin = Math.round(d.temperature_2m_min[i]);
        const tMax = Math.round(d.temperature_2m_max[i]);
        const rainProb = d.precipitation_probability_max?.[i] ?? 0;
        const rainSum = Math.round((d.precipitation_sum?.[i] ?? 0) * 10) / 10;
        const windMax = Math.round(d.wind_speed_10m_max?.[i] ?? 0);
        const gustsMax = Math.round(d.wind_gusts_10m_max?.[i] ?? 0);
        const uv = Math.round(d.uv_index_max?.[i] ?? 0);

        const warning = evaluateDayWarning(
          code,
          tMin,
          tMax,
          rainProb,
          rainSum,
          windMax,
          gustsMax,
          uv,
          dayName,
        );

        forecast.push({
          date: dates[i],
          dayName,
          code,
          tMin,
          tMax,
          rainProb,
          rainSum,
          windMax,
          gustsMax,
          uv,
          warning,
        });

        if (warning) {
          if (!highestAlert) {
            highestAlert = {
              severity: warning.severity,
              title: warning.title,
              description: warning.description,
              dayName,
              icon: warning.icon,
            };
          } else if (
            warning.severity === "danger" ||
            (warning.severity === "warning" && highestAlert.severity === "notice")
          ) {
            highestAlert = {
              severity: warning.severity,
              title: warning.title,
              description: warning.description,
              dayName,
              icon: warning.icon,
            };
          }
        }
      }

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
        forecast,
        highestAlert,
      });

      setState("ready");
    } catch {
      setState("error");
    }
  }

  function loadDefault() {
    load(BG_DEFAULT.lat, BG_DEFAULT.lon, BG_DEFAULT.label);
  }

  function selectCity(city: (typeof BG_CITIES)[0]) {
    try {
      localStorage.setItem("proizvoditel_weather_city", JSON.stringify(city));
    } catch {}
    setShowLocationModal(false);
    load(city.lat, city.lon, city.label);
  }

  /** Първоначално зареждане: запазен град → локация на устройството → България. */
  function loadInitial() {
    try {
      const saved = localStorage.getItem("proizvoditel_weather_city");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.lat && parsed?.lon) {
          load(parsed.lat, parsed.lon, parsed.label);
          return;
        }
      }
    } catch {}

    if (!("geolocation" in navigator)) return loadDefault();

    navigator.geolocation.getCurrentPosition(
      (p) => load(p.coords.latitude, p.coords.longitude),
      () => loadDefault(),
      { timeout: 10000, maximumAge: 30 * 60 * 1000 },
    );
  }

  /** Бутонът „Моето местоположение“ в избора на район. */
  function locateMe() {
    if (!("geolocation" in navigator)) {
      setGeoDenied(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        setGeoDenied(false);
        setShowLocationModal(false);
        try {
          localStorage.removeItem("proizvoditel_weather_city");
        } catch {}
        load(p.coords.latitude, p.coords.longitude);
      },
      () => {
        setLocating(false);
        setGeoDenied(true);
      },
      { timeout: 10000, maximumAge: 30 * 60 * 1000 },
    );
  }

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state !== "ready" || !w) {
    return (
      <div className="w-full border-b border-border bg-surface">
        <div className="flex h-10 items-center gap-3 px-4 text-xs text-muted-foreground sm:px-6">
          {state === "loading" ? (
            <>
              <span className="sr-only">Зареждаме прогнозата за времето…</span>
              <span aria-hidden className="h-5 w-5 animate-pulse rounded-full bg-surface-muted" />
              <span aria-hidden className="h-3 w-28 animate-pulse rounded-full bg-surface-muted" />
              <span aria-hidden className="hidden h-3 w-20 animate-pulse rounded-full bg-surface-muted sm:block" />
              <span aria-hidden className="hidden h-3 w-24 animate-pulse rounded-full bg-surface-muted md:block" />
            </>
          ) : (
            <>
              <span className="truncate">Времето не може да бъде заредено.</span>
              <button
                type="button"
                onClick={() => {
                  setState("loading");
                  loadInitial();
                }}
                className="shrink-0 font-semibold text-primary hover:underline"
              >
                Опитай отново
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const alert = w.highestAlert;

  return (
    <>
      <div className="w-full border-b border-border bg-surface">
        <div className="flex h-10 items-center gap-2 px-3 text-[13px] text-foreground sm:gap-4 sm:px-6">
          {/* Район */}
          <button
            type="button"
            onClick={() => setShowLocationModal(true)}
            title="Смени района"
            className="group inline-flex min-w-0 max-w-[9rem] shrink-0 items-center gap-1.5 rounded-full py-1 pl-1 pr-2 font-semibold transition-colors hover:bg-surface-muted sm:max-w-[14rem]"
          >
            <span className="text-accent">
              <BarIcon kind="pin" />
            </span>
            <span className="truncate">{w.place ?? "Вашият район"}</span>
            <span className="text-muted-foreground transition-transform group-hover:translate-y-px">
              <BarIcon kind="chevron" size={12} />
            </span>
          </button>

          <Divider />

          {/* Сега */}
          <div className="flex shrink-0 items-center gap-2">
            <WeatherIcon code={w.code} isDay={w.isDay} className="h-5 w-5 text-accent" />
            <span className="font-serif text-base font-semibold leading-none">{w.temp}°</span>
            <span className="hidden text-muted-foreground lg:inline">{WMO[w.code] ?? "—"}</span>
          </div>

          {/* Показатели — повече при по-широк екран */}
          <div className="hidden min-w-0 items-center gap-4 md:flex">
            <Divider />
            <Metric icon="wind" label="Вятър" value={`${w.wind} км/ч`} />
            <Metric icon="drop" label="Вероятност за дъжд" value={`${w.rainProb}%`} />
            <Metric
              icon="thermo"
              label="Мин / макс днес"
              value={`${w.tMin}° / ${w.tMax}°`}
              className="hidden lg:flex"
            />
            <Metric
              icon="humidity"
              label="Влажност"
              value={`${w.humidity}%`}
              className="hidden xl:flex"
            />
            <Metric icon="uv" label="UV индекс" value={`UV ${w.uv}`} className="hidden xl:flex" />
            <Metric
              icon="sunrise"
              label="Изгрев / залез"
              value={`${hhmm(w.sunrise)} – ${hhmm(w.sunset)}`}
              className="hidden 2xl:flex"
            />
          </div>

          <div className="flex-1" />

          {/* Най-важното предупреждение за следващите дни */}
          {alert ? (
            <button
              type="button"
              onClick={() => setShowForecastModal(true)}
              title={`${alert.dayName}: ${alert.title}`}
              className={cn(
                "inline-flex min-w-0 shrink items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition-colors",
                ALERT_STYLES[alert.severity],
              )}
            >
              <span
                aria-hidden
                className={cn("h-1.5 w-1.5 shrink-0 rounded-full", ALERT_DOT[alert.severity])}
              />
              <span className="sm:hidden">
                {alert.severity === "danger" ? "Опасност" : "Внимание"}
              </span>
              <span className="hidden truncate sm:inline">
                {alert.dayName}: {alert.title}
              </span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setShowForecastModal(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary-soft sm:px-3"
          >
            <BarIcon kind="calendar" />
            <span className="hidden sm:inline">Прогноза за 5 дни</span>
            <span className="sr-only sm:hidden">Прогноза за 5 дни</span>
          </button>
        </div>
      </div>

      {/* Избор на район */}
      {showLocationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setShowLocationModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="weather-location-title"
            className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 id="weather-location-title" className="text-lg font-semibold text-foreground">
                  Изберете район
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Прогнозата и агро съветите се смятат за избраното място.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                aria-label="Затвори"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <BarIcon kind="close" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-5">
              <button
                type="button"
                onClick={locateMe}
                disabled={locating}
                className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-primary/25 bg-primary-soft/60 px-4 py-3 text-left text-sm font-semibold text-primary transition-colors hover:bg-primary-soft disabled:opacity-60"
              >
                <BarIcon kind="locate" size={18} />
                {locating ? "Определяме местоположението…" : "Използвай моето местоположение"}
              </button>

              {geoDenied ? (
                <div className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900">
                  <p className="font-semibold">Браузърът не дава достъп до местоположението.</p>
                  <p className="mt-1">
                    Натиснете катинарчето в адресната лента, разрешете „Местоположение“ за
                    Производител.net и опитайте отново — или изберете град по-долу.
                  </p>
                </div>
              ) : null}

              <div>
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Или изберете град
                </p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {BG_CITIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCity(c)}
                      className={cn(
                        "truncate rounded-[var(--radius-sm)] border px-3 py-2 text-left text-[13px] font-medium transition-colors",
                        w.place === c.label
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface text-foreground hover:border-primary/40 hover:bg-primary-soft hover:text-primary",
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5-дневна детайлна агро прогноза (Modal) */}
      {showForecastModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowForecastModal(false)}
        >
          <div
            className="relative flex flex-col w-full max-w-4xl max-h-[92vh] rounded-[var(--radius-xl)] bg-surface border border-border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заглавна лента */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-surface-muted/50">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🌾</span>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">
                    5-дневна Агрометеорологична прогноза
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Район: <strong>{w.place ?? "България"}</strong> · Данни от Open-Meteo за земеделски производители
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowForecastModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors font-bold text-base"
              >
                ✕
              </button>
            </div>

            {/* Съдържание по дни */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
                {w.forecast.map((day, idx) => {
                  const isToday = idx === 0;
                  const dayWarning = day.warning;

                  const cardStyle = dayWarning?.severity === "danger"
                    ? "border-red-500/40 bg-red-500/10"
                    : dayWarning?.severity === "warning"
                      ? "border-amber-500/40 bg-amber-500/10"
                      : isToday
                        ? "border-primary/40 bg-primary-soft/30"
                        : "border-border bg-surface";

                  return (
                    <div
                      key={day.date}
                      className={cn(
                        "rounded-[var(--radius-lg)] border p-4 flex flex-col justify-between transition-all",
                        cardStyle,
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-3">
                          <span className="font-semibold text-sm text-foreground">
                            {day.dayName}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Intl.DateTimeFormat("bg-BG", { day: "numeric", month: "short" }).format(new Date(day.date))}
                          </span>
                        </div>

                        <div className="flex items-center justify-center py-2">
                          <WeatherIcon code={day.code} isDay={true} className="h-10 w-10" />
                        </div>

                        <p className="text-center text-xs font-medium text-muted-foreground mt-1">
                          {WMO[day.code] ?? "—"}
                        </p>

                        <div className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold">
                          <span className="text-danger">{day.tMax}°</span>
                          <span className="text-muted-foreground font-normal">/</span>
                          <span className="text-primary">{day.tMin}°</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Дъжд:</span>
                          <span className="font-semibold text-foreground">{day.rainProb}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Вятър до:</span>
                          <span className="font-semibold text-foreground">{day.gustsMax} км/ч</span>
                        </div>
                        <div className="flex justify-between">
                          <span>UV индекс:</span>
                          <span className="font-semibold text-foreground">{day.uv}</span>
                        </div>

                        {dayWarning ? (
                          <div
                            className={cn(
                              "mt-2.5 rounded p-2 text-[11px] font-medium leading-tight shadow-xs text-white",
                              dayWarning.severity === "danger"
                                ? "bg-red-600 text-white"
                                : dayWarning.severity === "warning"
                                  ? "bg-amber-600 text-white"
                                  : "bg-amber-700 text-white",
                            )}
                          >
                            <p className="font-bold flex items-center gap-1">
                              <span>{dayWarning.icon}</span>
                              <span>{dayWarning.title}</span>
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Съвети за земеделска работа */}
              <div className="rounded-[var(--radius-lg)] border border-primary/20 bg-primary-soft/30 p-4">
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <span>💡 Препоръки за стопанството</span>
                </h4>
                <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                  <li>• <strong>Пръскане:</strong> Избягвайте третиране при вятър над 15-20 км/ч или вероятност за дъжд над 40%.</li>
                  <li>• <strong>Слана и мразове:</strong> При нощни температури под 2°C подгответе мерки за защита на цъфналите овошки и разсади.</li>
                  <li>• <strong>Градушки:</strong> При прогноза за бури с градушка приберете мобилната техника и покрийте уязвимите площи с мрежи.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


const ALERT_STYLES: Record<"danger" | "warning" | "notice", string> = {
  danger: "bg-danger-soft text-danger ring-danger/25 hover:bg-danger/10",
  warning: "bg-amber-50 text-amber-800 ring-amber-400/40 hover:bg-amber-100",
  notice: "bg-accent-soft text-accent-hover ring-accent/25 hover:bg-accent/15",
};

const ALERT_DOT: Record<"danger" | "warning" | "notice", string> = {
  danger: "bg-danger",
  warning: "bg-amber-500",
  notice: "bg-accent",
};

function Divider() {
  return <span aria-hidden className="h-4 w-px shrink-0 bg-border" />;
}

function Metric({
  icon,
  label,
  value,
  className,
}: {
  icon: BarIconKind;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      title={label}
      className={cn("flex shrink-0 items-center gap-1.5 whitespace-nowrap", className)}
    >
      <span className="text-muted-foreground">
        <BarIcon kind={icon} />
      </span>
      <span className="sr-only">{label}:</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

type BarIconKind =
  | "pin"
  | "chevron"
  | "calendar"
  | "wind"
  | "drop"
  | "thermo"
  | "humidity"
  | "uv"
  | "sunrise"
  | "close"
  | "locate";

function BarIcon({ kind, size = 15 }: { kind: BarIconKind; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      {kind === "pin" ? (
        <>
          <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </>
      ) : kind === "chevron" ? (
        <path d="m6 9 6 6 6-6" />
      ) : kind === "calendar" ? (
        <>
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </>
      ) : kind === "wind" ? (
        <path d="M3 8h10a2.5 2.5 0 1 0-2.5-2.5M3 12h15a2.5 2.5 0 1 1-2.5 2.5M3 16h7" />
      ) : kind === "drop" ? (
        <path d="M12 3.5s-6 6.6-6 11a6 6 0 0 0 12 0c0-4.4-6-11-6-11Z" />
      ) : kind === "thermo" ? (
        <>
          <path d="M14 14.5V5a2 2 0 0 0-4 0v9.5a4 4 0 1 0 4 0Z" />
          <path d="M12 17v-4" />
        </>
      ) : kind === "humidity" ? (
        <>
          <path d="M12 3.5s-6 6.6-6 11a6 6 0 0 0 12 0c0-4.4-6-11-6-11Z" />
          <path d="m9.5 17 5-5M9.8 12.3h.01M14.2 16.7h.01" />
        </>
      ) : kind === "uv" ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
        </>
      ) : kind === "sunrise" ? (
        <>
          <path d="M5 17a7 7 0 0 1 14 0M3 20h18M12 3v5M9 6l3-3 3 3" />
        </>
      ) : kind === "close" ? (
        <path d="M6 6l12 12M18 6 6 18" />
      ) : (
        <>
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </>
      )}
    </svg>
  );
}
