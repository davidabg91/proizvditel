import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewPasswordForm } from "../password-forms";

export const metadata: Metadata = {
  title: "Нова парола",
  robots: { index: false },
  // Токенът е в адреса — не го изпращаме на външни сайтове като referrer.
  referrer: "no-referrer",
};

export default async function NewPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="surface-grain">
      <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="eyebrow">Вход</p>
            <h1 className="mt-3 text-3xl">Нова парола</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Изберете нова парола</CardTitle>
            </CardHeader>
            <CardContent>
              {token ? (
                <NewPasswordForm token={token} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Връзката е непълна.{" "}
                  <Link href="/vhod/zabravena-parola" className="font-medium text-primary underline">
                    Поискайте нова
                  </Link>
                  .
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
