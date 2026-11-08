"use client";

import { useEffect } from "react";
import Link from "next/link";

/** Грешка при зареждане на страница — вместо празния английски екран. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-3xl font-semibold text-accent">
        !
      </div>
      <h1 className="mt-6 text-3xl">Нещо се обърка</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Страницата не успя да се зареди. Опитайте отново след малко — ако
        проблемът остане, пишете ни.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">Код: {error.digest}</p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Опитай отново
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-full border border-border-strong bg-surface px-6 text-sm font-semibold hover:border-primary hover:text-primary"
        >
          Начална страница
        </Link>
      </div>
    </main>
  );
}
