import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterWizard } from "./register-wizard";

export const metadata: Metadata = {
  title: "Регистрация на стопанство",
  description:
    "Регистрирайте вашето земеделско стопанство в платформата Производител и започнете да продавате директно на клиентите.",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/tablo");

  return (
    <main className="surface-grain">
      <div className="container-page py-16 sm:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="eyebrow">Присъединете се</p>
          <h1 className="mt-3 text-3xl sm:text-4xl">
            Регистрирайте вашето стопанство
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Няколко кратки стъпки и профилът ви е готов. Представете продукцията
            си пред хора, които търсят прясна, местна храна.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Искате да купувате?{" "}
            <a
              href="/registraciya/kupuvach"
              className="font-medium text-primary hover:underline"
            >
              Регистрирайте се като купувач
            </a>
          </p>
        </div>
        <RegisterWizard />
      </div>
    </main>
  );
}
