"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";

export type PaymentState = "paid" | "cod" | "unpaid" | "unknown";

export function SuccessView({
  state,
  producer,
  orderId,
}: {
  state: PaymentState;
  producer: string | null;
  orderId: string | null;
}) {
  const isCod = state === "cod";
  const { removeByProducer, ready } = useCart();
  const done = useRef(false);

  // Продуктите на производителя махаме от кошницата само при потвърдена
  // поръчка — иначе клиент с прекъснато плащане би загубил кошницата си.
  useEffect(() => {
    if ((state === "paid" || state === "cod") && ready && producer && !done.current) {
      done.current = true;
      removeByProducer(producer);
    }
  }, [state, ready, producer, removeByProducer]);

  if (state === "unpaid" || state === "unknown") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft">
          <span className="text-3xl text-accent">!</span>
        </div>
        <h1 className="mt-6 text-3xl font-semibold">
          {state === "unpaid" ? "Плащането не е завършено" : "Няма информация за поръчка"}
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {state === "unpaid"
            ? "Не получихме потвърждение за плащането. Продуктите са все още в кошницата ви — можете да опитате отново."
            : "Тази страница се показва след поръчка. Ако току-що сте платили и виждате това съобщение, проверете имейла си за разписка от Stripe или ни пишете."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button href="/koshnitsa">Към кошницата</Button>
          <Button href="/katalog" variant="outline">
            Каталог
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
        <span className="text-3xl text-success">✓</span>
      </div>
      <h1 className="mt-6 text-3xl font-semibold">
        {isCod ? "Поръчката е приета успешно!" : "Благодарим за поръчката!"}
      </h1>
      {orderId ? (
        <p className="mt-2 text-sm font-semibold text-primary">
          Номер на поръчка: #{orderId.slice(-6).toUpperCase()}
        </p>
      ) : null}
      <p className="mt-3 text-muted-foreground leading-relaxed">
        {isCod
          ? "Вашата поръчка с наложен платеж е изпратена към производителя. Той ще подготви пратката и ще се свърже с вас за потвърждение и доставка."
          : "Плащането с карта е успешно. Производителят ще получи поръчката и ще се свърже с вас за доставката. Разписка ще получите по имейл от Stripe."}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button href="/katalog">Продължи пазаруването</Button>
        <Button href="/sabshteniya" variant="outline">
          Съобщения
        </Button>
      </div>
    </div>
  );
}
