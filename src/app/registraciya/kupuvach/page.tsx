import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerForm } from "./customer-form";

export const metadata: Metadata = {
  title: "Регистрация на купувач",
  description: "Създайте акаунт, за да пишете на производители и да поръчвате директно.",
};

export default async function CustomerRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/katalog");
  const { next } = await searchParams;

  return (
    <main className="surface-grain">
      <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="eyebrow">Купувач</p>
            <h1 className="mt-3 text-3xl">Създайте акаунт</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              За да се свързвате с производители и да поръчвате директно.
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Регистрация</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerForm next={next} />
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Вие сте производител?{" "}
            <Link href="/registraciya" className="font-medium text-primary hover:underline">
              Регистрирайте стопанство
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
