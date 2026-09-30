import { Button, Card } from "@loal/ui/shadcn";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { readPendingPayment } from "../../shared/lib/pending-payment";

/** OctōPAY may return the browser before its webhook has finished activating the subscription. */
export function PaymentReturnPage() {
  const navigate = useNavigate();
  const pending = readPendingPayment();

  useEffect(() => {
    if (pending) navigate(`/c/${encodeURIComponent(pending.serial)}?payment=return`, { replace: true });
  }, [navigate, pending]);

  if (!pending) {
    return (
      <Card className="mx-auto max-w-[420px]">
        <h1 className="display text-[2rem]">Не нашли платёж</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Вернитесь в кабинет. Если оплата прошла, карта и баланс появятся там автоматически.
        </p>
        <Button asChild className="mt-6"><Link to="/">Открыть кабинет</Link></Button>
      </Card>
    );
  }

  return null;
}
