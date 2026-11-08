import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COMPANY } from "@/lib/company";
import { ForgotPasswordForm } from "../password-forms";

export const metadata: Metadata = {
  title: "Забравена парола",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <main className="surface-grain">
      <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="eyebrow">Вход</p>
            <h1 className="mt-3 text-3xl">Забравена парола</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Ще ви изпратим връзка за нова парола</CardTitle>
            </CardHeader>
            <CardContent>
              <ForgotPasswordForm supportEmail={COMPANY.email} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
