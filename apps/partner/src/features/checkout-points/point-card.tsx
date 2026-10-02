import { Copy01Icon, Download04Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { CheckoutPoint } from "@loal/api";
import { Badge, Button, ConfirmDialog, FormStatus, Icon } from "@loal/ui/shadcn";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useSetCheckoutPointActive } from "../../entities/merchant/api";

/** QR той же ссылки, что пишется на NFC-метку: крупный, с полями — для печати на кассе. */
function useQr(url: string | null | undefined) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!url) return setSrc(null);
    let active = true;
    QRCode.toDataURL(url, { margin: 2, width: 720, errorCorrectionLevel: "M", color: { dark: "#161515", light: "#FFFFFF" } })
      .then((data) => active && setSrc(data))
      .catch(() => active && setSrc(null));
    return () => {
      active = false;
    };
  }, [url]);
  return src;
}

/**
 * Касса: ссылка для NFC-метки и QR для печати. Ссылка постоянная — индивидуальный счёт
 * создаётся, когда покупатель подтвердит телефон. Отключение запрещает новые оплаты,
 * но не отменяет уже принятые; включить обратно нельзя — создают новую кассу.
 */
export function PointCard({
  merchantId,
  point,
  branchName,
}: {
  merchantId: string;
  point: CheckoutPoint;
  branchName?: string;
}) {
  const qr = useQr(point.isActive ? point.url : null);
  const toggle = useSetCheckoutPointActive(merchantId);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!point.url) return;
    try {
      await navigator.clipboard.writeText(point.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Буфер обмена недоступен — ссылка видна и выделяется
    }
  };

  return (
    <li
      className={`flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-background p-4 sm:flex-row sm:items-start sm:p-5 ${
        point.isActive ? "" : "opacity-60"
      }`}
    >
      {point.isActive && (
        <div className="grid h-36 w-36 shrink-0 place-items-center self-center overflow-hidden rounded-2xl border border-border bg-white sm:self-start">
          {qr ? (
            <img src={qr} alt={`QR-код кассы «${point.name}»`} className="h-full w-full" />
          ) : (
            <span className="text-sm text-muted-foreground">QR…</span>
          )}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold">{point.name}</h3>
          <Badge tone={point.isActive ? "good" : "quiet"}>{point.isActive ? "работает" : "отключена"}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {[branchName ?? "Филиал", `баллами: ${point.coveragePercents.map((value) => `${value}%`).join(", ")}`].join(" · ")}
        </p>
        {point.isActive && point.url && (
          <p className="min-w-0 break-all rounded-xl bg-muted px-3 py-2 font-mono text-sm select-all">{point.url}</p>
        )}
        {point.isActive && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={copy} disabled={!point.url}>
              <Icon icon={copied ? Tick02Icon : Copy01Icon} />
              {copied ? "Скопировано" : "Ссылка для NFC"}
            </Button>
            {qr && (
              <Button variant="outline" size="sm" asChild>
                <a href={qr} download={`qr-${point.name.replace(/[^\p{L}\d]+/gu, "-")}.png`}>
                  <Icon icon={Download04Icon} />
                  Скачать QR
                </a>
              </Button>
            )}
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm">
                  Отключить
                </Button>
              }
              title={`Отключить «${point.name}»?`}
              description="Новые оплаты по этой метке и QR перестанут проходить. Уже принятые платежи не отменятся. Включить кассу обратно нельзя — понадобится создать новую и заменить метку."
              confirmLabel="Отключить"
              onConfirm={() => toggle.mutateAsync({ pointId: point.id, isActive: false })}
            />
          </div>
        )}
        <FormStatus message={toggle.isError ? toggle.error.message : undefined} />
      </div>
    </li>
  );
}
