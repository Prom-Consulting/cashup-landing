import { ApiError, promoErrorText } from "@loal/api";
import { Button, FormStatus } from "@loal/ui/shadcn";
import { useEffect, useRef, useState } from "react";
import { useRedeemPromo } from "../../entities/me/api";
import { pendingPromo } from "../../shared/lib/promo-link";

/** Runs after authentication, when registration has already issued the card. */
export function LinkedPromoNotice() {
  const [code] = useState(() => pendingPromo.recall());
  const [done, setDone] = useState(false);
  const [error, setError] = useState<unknown>();
  const [retryable, setRetryable] = useState(false);
  const started = useRef(false);
  const redeem = useRedeemPromo();

  const forget = () => { if (pendingPromo.recall() === code) pendingPromo.clear(); };
  const apply = async () => {
    if (!code) return;
    setError(undefined);
    try {
      await redeem.mutateAsync({ code });
      forget();
      setDone(true);
    } catch (failure) {
      // Reloading an already completed link must not look like a failed signup.
      if (failure instanceof ApiError && failure.code === "PROMO_ALREADY_USED") {
        forget();
        setDone(true);
        return;
      }
      const permanent = failure instanceof ApiError && ["PROMO_NOT_FOUND", "PROMO_WRONG_AUDIENCE", "PROMO_EXPIRED", "PROMO_EXHAUSTED"].includes(failure.code ?? "");
      if (permanent) forget();
      setRetryable(!permanent);
      setError(failure);
    }
  };

  useEffect(() => {
    // React StrictMode repeats effects; a link must make only one request.
    if (started.current || !code) return;
    started.current = true;
    void apply();
  }, [code]);

  if (!code) return null;
  return (
    <div className="mb-6 rounded-2xl border border-border bg-surface p-4">
      {done ? <FormStatus tone="success" message={`Промокод ${code} применён.`} />
        : error ? <>
          <p role="alert" className="text-base">{promoErrorText(error)}. Вы вошли в аккаунт.</p>
          {retryable && <Button className="mt-3" variant="outline" disabled={redeem.isPending} onClick={() => void apply()}>Повторить применение</Button>}
        </> : <p role="status" className="text-base">Применяем промокод {code}…</p>}
    </div>
  );
}
