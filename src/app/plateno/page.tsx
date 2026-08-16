"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";

function SuccessInner() {
  const params = useSearchParams();
  const producer = params.get("producer");
  const { removeByProducer, ready } = useCart();
  const done = useRef(false);

  // След успешно плащане премахваме продуктите на този производител от кошницата
  useEffect(() => {
    if (ready && producer && !done.current) {
      done.current = true;
      removeByProducer(producer);
    }
  }, [ready, producer, removeByProducer]);

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
        <span className="text-3xl text-success">✓</span>
      </div>
      <h1 className="mt-6 text-3xl">Благодарим за поръчката!</h1>
      <p className="mt-3 text-muted-foreground">
        Плащането е успешно. Производителят ще получи поръчката и ще се свърже с
        вас за доставката. Разписка ще получите по имейл от Stripe.
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

export default function PaymentSuccessPage() {
  return (
    <main className="container-page py-20">
      <Suspense fallback={null}>
        <SuccessInner />
      </Suspense>
    </main>
  );
}
