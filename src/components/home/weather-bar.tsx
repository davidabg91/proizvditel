"use client";

import { useEffect, useRef, useState } from "react";
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
  const [isDefault, setIsDefault] = useState(false);
  const [showWarningView, setShowWarningView] = useState(false);
  const [showForecastModal, setShowForecastModal] = useState(false);

  const clipRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [duration, setDuration] = useState(30);

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
    setIsDefault(true);
    load(BG_DEFAULT.lat, BG_DEFAULT.lon, BG_DEFAULT.label);
  }

  function requestLocation() {
    if (!("geolocation" in navigator)) return loadDefault();
    setState("loading");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setIsDefault(false);
        load(p.coords.latitude, p.coords.longitude);
      },
      () => loadDefault(),
      { timeout: 10000, maximumAge: 30 * 60 * 1000 },
    );
  }

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Автоматично редуване на предупреждението и пълната прогноза на всеки 5.5 секунди
  useEffect(() => {
    if (!w?.highestAlert) {
      setShowWarningView(false);
      return;
    }

    const interval = setInterval(() => {
      setShowWarningView((prev) => !prev);
    }, 5500);

    return () => clearInterval(interval);
  }, [w]);

  // Измерване на ширината за тикера
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
  }, [state, w, showWarningView]);

  if (state !== "ready" || !w) {
    return (
      <div className="w-full max-w-full overflow-hidden border-b border-border bg-surface">
        <div className="flex h-9 w-full max-w-full items-center justify-between gap-2 px-3 text-xs text-muted-foreground sm:px-6">
          <span className="truncate">
            {state === "loading"
              ? "Зареждаме агро прогнозата…"
              : "Времето не може да бъде заредено"}
          </span>
          {state === "error" ? (
            <button
              onClick={requestLocation}
              className="shrink-0 font-semibold text-primary hover:underline"
            >
              Опитай отново
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const alert = w.highestAlert;
  const severity = alert?.severity ?? "none";

  // Светещи стилове на лентата според нивото на опасност (с висок контраст на текста)
  const barContainerStyles = {
    danger: "bg-red-500/15 border-red-500/40 text-foreground shadow-[0_0_20px_rgba(239,68,68,0.20)]",
    warning: "bg-amber-500/15 border-amber-500/40 text-foreground shadow-[0_0_15px_rgba(245,158,11,0.18)]",
    notice: "bg-amber-500/10 border-amber-500/30 text-foreground shadow-[0_0_12px_rgba(245,158,11,0.15)]",
    none: "bg-surface border-border text-foreground",
  }[severity];

  const group = (
    ref?: React.Ref<HTMLDivElement>,
    hidden?: boolean,
    spaced = true,
  ) => (
    <div
      ref={ref}
      aria-hidden={hidden}
      className={cn("flex shrink-0 items-center gap-4 sm:gap-6 text-xs sm:text-sm text-foreground", spaced && "pr-4 sm:pr-6")}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 font-semibold text-foreground">
        <WeatherIcon code={w.code} isDay={w.isDay} />
        <span className="text-muted-foreground">{w.place ?? "Вашият район"}</span>
        <span className="text-border-strong">·</span>
        <span>{WMO[w.code] ?? "—"}</span>
        <span className="font-serif text-sm sm:text-base font-bold">{w.temp}°</span>
      </div>
      <Metric label="усеща се" value={`${w.apparent}°`} />
      <Metric label="мин / макс" value={`${w.tMin}° / ${w.tMax}°`} />
      <Metric label="влажност" value={`${w.humidity}%`} />
      <Metric label="вятър" value={`${w.wind} км/ч`} />
      <Metric label="дъжд" value={`${w.rainProb}%`} />
      <Metric label="UV" value={`${w.uv}`} />
      <Metric label="изгрев / залез" value={`${hhmm(w.sunrise)} / ${hhmm(w.sunset)}`} />

      {alert ? (
        <button
          type="button"
          onClick={() => setShowForecastModal(true)}
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold transition-transform hover:scale-105 flex items-center gap-1.5 shadow-xs text-white",
            severity === "danger"
              ? "bg-red-600 text-white animate-pulse"
              : severity === "warning"
                ? "bg-amber-600 text-white"
                : "bg-amber-700 text-white",
          )}
        >
          <span>{alert.icon}</span>
          <span>{alert.dayName}: {alert.title}</span>
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "w-full max-w-full overflow-hidden border-b transition-colors duration-500 relative",
          barContainerStyles,
        )}
      >
        <div className="flex w-full max-w-full items-center justify-between min-h-[36px] sm:min-h-[38px] py-1">
          {/* Режим 1: Предупредително съобщение за опасност */}
          {alert && showWarningView ? (
            <div className="flex-1 min-w-0 max-w-full overflow-hidden px-2.5 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
              <div
                onClick={() => setShowForecastModal(true)}
                className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer hover:underline text-xs sm:text-sm font-semibold min-w-0 flex-1 overflow-hidden text-foreground"
              >
                <span className="text-base shrink-0 animate-bounce">{alert.icon}</span>
                <span
                  className={cn(
                    "uppercase tracking-wider text-[10px] sm:text-[11px] font-black px-1.5 py-0.5 rounded text-white shadow-xs shrink-0",
                    severity === "danger"
                      ? "bg-red-600"
                      : severity === "warning"
                        ? "bg-amber-600"
                        : "bg-amber-700",
                  )}
                >
                  {severity === "danger" ? "Опасност" : "Внимание"}
                </span>
                <span className="font-bold shrink-0 text-foreground hidden xs:inline">{alert.dayName}:</span>
                <span className="truncate text-foreground font-semibold min-w-0">{alert.description}</span>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowWarningView(false)}
                  className="text-[10px] sm:text-[11px] text-muted-foreground hover:text-foreground font-medium px-1.5 sm:px-2 py-0.5 rounded bg-surface/80 border border-border hover:bg-surface transition-colors shrink-0"
                  title="Покажи температурата и метриките"
                >
                  🌡️ <span className="hidden sm:inline">Метрики</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowForecastModal(true)}
                  className="text-[10px] sm:text-[11px] font-bold text-primary hover:underline px-1 sm:px-2 py-0.5 shrink-0 whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Виж 5-дневна прогноза →</span>
                  <span className="sm:hidden">Прогноза →</span>
                </button>
              </div>
            </div>
          ) : (
            /* Режим 2: Пълна метеорологична лента с тикер */
            <div className="flex-1 min-w-0 max-w-full overflow-hidden flex items-center animate-in fade-in duration-300">
              <div
                ref={clipRef}
                className="ticker-clip min-w-0 flex-1 overflow-hidden pl-2.5 sm:pl-6 max-w-full"
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
                  <div className="flex justify-center min-w-0">{group(groupRef, false, false)}</div>
                )}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 px-2 sm:px-5 text-xs">
                <button
                  type="button"
                  onClick={() => setShowForecastModal(true)}
                  className="font-semibold text-primary hover:underline whitespace-nowrap text-[11px] sm:text-xs"
                >
                  <span className="hidden sm:inline">📅 5-дневна агро прогноза</span>
                  <span className="sm:hidden">📅 Прогноза</span>
                </button>

                {isDefault ? (
                  <button
                    onClick={requestLocation}
                    className="font-semibold text-muted-foreground hover:text-primary hover:underline whitespace-nowrap hidden md:inline-block border-l border-border pl-2"
                    title="Покажи времето за моето точно местоположение"
                  >
                    Моят район 📍
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
