import type { Metadata } from "next";
import Link from "next/link";
import { FieldBackdrop } from "@/components/brand/field-backdrop";
import { Icon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Страницата не е намерена",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-[70vh] flex-col overflow-hidden text-white">
      <FieldBackdrop id="not-found" />
      <div className="container-page relative z-10 flex flex-1 flex-col items-center justify-center pb-40 pt-16 text-center">
        <p className="font-serif text-7xl font-semibold text-[#f0c977] sm:text-8xl">404</p>
        <h1 className="mt-4 text-3xl text-white sm:text-4xl">Тази нива е празна</h1>
        <p className="mt-3 max-w-md text-white/75">
          Страницата, която търсите, не съществува или е преместена. Може би
          обявата вече е изтекла.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/katalog"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#f0c977] px-6 text-sm font-semibold text-[#1a3a2c] hover:bg-[#f5d792]"
          >
            <Icon name="basket" size={17} />
            Към каталога
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-full border border-white/30 bg-white/10 px-6 text-sm font-semibold text-white hover:bg-white/20"
          >
            Начална страница
          </Link>
        </div>
      </div>
    </main>
  );
}
