import { Icon } from "@/components/ui/icons";

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
  const hasAny = payment && payment.acceptsCod;

  if (!hasAny) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-xs">
        <h3 className="flex items-center gap-2 font-semibold"><Icon name="wallet" size={18} className="text-accent" />Плащане</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Свържете се с производителя за начините на плащане.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-xs">
      <h3 className="flex items-center gap-2 font-semibold"><Icon name="wallet" size={18} className="text-accent" />Начини на плащане</h3>
      <div className="mt-4 flex flex-col gap-4 text-sm">
        {payment!.acceptsCod ? (
          <div>
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
