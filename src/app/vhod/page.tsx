import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Вход",
  description: "Влезте в профила си в Производител.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/tablo");
  const { next } = await searchParams;

  return (
    <main className="surface-grain">
      <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="eyebrow">Добре дошли отново</p>
            <h1 className="mt-3 text-3xl">Вход в Производител</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Влезте в профила си</CardTitle>
            </CardHeader>
            <CardContent>
              <LoginForm next={next} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
