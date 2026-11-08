import { Icon, type IconName } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

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

type Method = { icon: IconName; title: string; text: string };

/**
 * Начините, по които се плаща на стопанството — същите като в кошницата:
 * карта (само при свързан Stripe) и наложен платеж (включен по подразбиране,
 * докато производителят не го изключи).
 */
export function paymentMethods(payment: Payment, cardEnabled: boolean): Method[] {
  const methods: Method[] = [];
  if (cardEnabled) {
    methods.push({
      icon: "wallet",
      title: "С карта онлайн",
      text: "Visa или Mastercard през защитеното плащане на Stripe. Сумата стига до производителя след като отбележи поръчката като доставена.",
    });
  }
  if (payment?.acceptsCod !== false) {
    methods.push({
      icon: "truck",
      title: "Наложен платеж",
      text: payment?.codNote?.trim() || "Плащате в брой на куриера, когато получите пратката.",
    });
  }
  return methods;
}

export function PaymentMethodsDisplay({
  payment,
  cardEnabled = false,
  variant = "card",
  className,
}: {
  payment: Payment;
  cardEnabled?: boolean;
  /** "card" — самостоятелна карта; "plain" — само списъкът, за вграждане. */
  variant?: "card" | "plain";
  className?: string;
}) {
  const methods = paymentMethods(payment, cardEnabled);

  const list =
    methods.length > 0 ? (
      <ul className="flex flex-col gap-3">
        {methods.map((m) => (
          <li key={m.title} className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Icon name={m.icon} size={17} />
            </span>
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-foreground">{m.title}</p>
              <p className="mt-0.5 leading-relaxed text-muted-foreground">{m.text}</p>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-muted-foreground">
        Уговорете начина на плащане с производителя в съобщение.
      </p>
    );

  if (variant === "plain") return <div className={className}>{list}</div>;

  return (
    <div
      className={cn(
        "rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-xs",
        className,
      )}
    >
      <h3 className="flex items-center gap-2 font-semibold">
        <Icon name="wallet" size={18} className="text-accent" />
        Начини на плащане
      </h3>
      <div className="mt-4">{list}</div>
    </div>
  );
}
