import { Button } from "@/components/ui/button";

type Payment = {
  acceptsBankTransfer: boolean;
  bankName: string | null;
  bankIban: string | null;
  bankHolder: string | null;
  acceptsRevolut: boolean;
  revolutLink: string | null;
  acceptsCod: boolean;
  codNote: string | null;
} | null;

export function PaymentMethodsDisplay({ payment }: { payment: Payment }) {
  const hasAny =
    payment &&
    (payment.acceptsBankTransfer ||
      payment.acceptsRevolut ||
      payment.acceptsCod);

  if (!hasAny) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <h3 className="font-semibold">Плащане</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Свържете се с производителя за начините на плащане.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <h3 className="font-semibold">Начини на плащане</h3>
      <div className="mt-4 flex flex-col gap-4 text-sm">
        {payment!.acceptsRevolut ? (
          <div>
            <p className="font-medium text-foreground">Revolut</p>
            {payment!.revolutLink ? (
              <Button
                href={payment!.revolutLink}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
              >
                Плати с Revolut
              </Button>
            ) : (
              <p className="mt-1 text-muted-foreground">Приема плащания с Revolut.</p>
            )}
          </div>
        ) : null}

        {payment!.acceptsBankTransfer ? (
          <div className="border-t border-border pt-4 first:border-0 first:pt-0">
            <p className="font-medium text-foreground">Банков превод</p>
            <dl className="mt-1.5 flex flex-col gap-1 text-muted-foreground">
              {payment!.bankHolder ? (
                <div className="flex justify-between gap-3">
                  <dt>Титуляр</dt>
                  <dd className="text-right font-medium text-foreground">
                    {payment!.bankHolder}
                  </dd>
                </div>
              ) : null}
              {payment!.bankName ? (
                <div className="flex justify-between gap-3">
                  <dt>Банка</dt>
                  <dd className="text-right font-medium text-foreground">
                    {payment!.bankName}
                  </dd>
                </div>
              ) : null}
              {payment!.bankIban ? (
                <div className="flex justify-between gap-3">
                  <dt>IBAN</dt>
                  <dd className="text-right font-medium text-foreground break-all">
                    {payment!.bankIban}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}

        {payment!.acceptsCod ? (
          <div className="border-t border-border pt-4">
            <p className="font-medium text-foreground">Наложен платеж</p>
            <p className="mt-1 text-muted-foreground">
              {payment!.codNote || "Плащане при доставка."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
