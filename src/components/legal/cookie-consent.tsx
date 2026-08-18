"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

const STORAGE_KEY = "proizvoditel_cookie_consent_v1";

/** Стойност, с която маркираме, че още сме на сървъра и не знаем избора. */
const UNKNOWN = "__ssr__";

export type CookieChoice = "all" | "necessary";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

/**
 * Прочита избора без setState в ефект — така няма нито мигане при
 * зареждане, нито несъответствие между сървърния и клиентския рендер.
 */
function useStoredChoice(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    },
    () => UNKNOWN,
  );
}

/** Дали потребителят е приел незадължителните бисквитки. */
export function hasFullCookieConsent(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "all";
  } catch {
    return false;
  }
}

export function CookieConsent() {
  const stored = useStoredChoice();
  const [justChosen, setJustChosen] = useState(false);

  // На сървъра не знаем избора — не рисуваме нищо.
  if (stored === UNKNOWN) return null;
  if (stored !== null || justChosen) return null;

  function choose(choice: CookieChoice) {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Ако хранилището е блокирано, просто скриваме съобщението.
    }
    setJustChosen(true);
  }

  return (
    <div
      role="dialog"
      aria-label="Съобщение за бисквитки"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-surface/98 shadow-lg backdrop-blur"
    >
      <div className="container-page flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-foreground/85">
          Използваме само бисквитки, необходими за работата на сайта — вход в профила и
          кошница. <strong>Няма реклами и проследяване.</strong>{" "}
          <Link href="/biskvitki" className="font-medium text-primary underline underline-offset-2">
            Научете повече
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("necessary")}
            className="rounded-[var(--radius-sm)] border border-border-strong px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted"
          >
            Само необходимите
          </button>
          <button
            type="button"
            onClick={() => choose("all")}
            className="rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Разбрах
          </button>
        </div>
      </div>
    </div>
  );
}
