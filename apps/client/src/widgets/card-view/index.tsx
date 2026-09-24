import type { PublicPassInfo } from "@loal/api";
import { Copy01Icon, QrCode01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Dialog, DialogContent, DialogTrigger, Icon } from "@loal/ui/shadcn";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

const money = new Intl.NumberFormat("ru-RU");

/** QR рисуем в браузере из значения штрихкода — картинку сервер не отдаёт. */
function useQrDataUrl(value: string, width = 480) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, {
      margin: 0,
      width,
      errorCorrectionLevel: "M",
      color: { dark: "#161515", light: "#ffffff" },
    })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [value, width]);
  return src;
}

/**
 * Баланс дощёлкивает один раз при открытии — это единственное движение на странице,
 * и оно показывает главное: сколько бонусов сейчас на карте.
 */
function useCountUp(target: number) {
  const [value, setValue] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? target : 0,
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const duration = 900;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // Замедление к концу: цифра «приезжает», а не обрывается
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}

function CopySerial({ serial }: { serial: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(serial);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex min-w-0 items-center gap-2 rounded-full px-3 py-2 font-mono text-sm transition-colors hover:bg-muted"
    >
      <span className="truncate">{serial}</span>
      <Icon icon={copied ? Tick02Icon : Copy01Icon} size={18} />
      <span className="sr-only">{copied ? "Номер скопирован" : "Скопировать номер карты"}</span>
    </button>
  );
}

const fieldValue = (value: string | number) => (typeof value === "number" ? money.format(value) : value);

/**
 * Карта так, как её видит держатель: шапка, баланс, второстепенные поля и QR на
 * белой панели — как у пропуска в Wallet. Цвета и поля приходят из шаблона, сервер
 * уже подставил в них данные карты.
 *
 * QR — главное на экране: его показывают кассиру. Поэтому он крупный, на белом, с
 * полями по краям и рисуется без сглаживания — иначе плотный код расплывается.
 */
export function CardView({ pass }: { pass: PublicPassInfo }) {
  const qr = useQrDataUrl(pass.barcodeValue, 720);
  const balance = useCountUp(pass.pointsBalance);
  // Баланс показываем крупно сами — из полей шаблона его не дублируем
  const rowFields = [...pass.secondaryFields, ...pass.auxiliaryFields].filter((field) => field.key !== "balance");
  const headerFields = pass.headerFields.filter((field) => field.key !== "balance").slice(0, 2);

  return (
    <div className="flex flex-col gap-5">
      <div
        className="relative overflow-hidden rounded-[28px] shadow-[0_1.5rem_3rem_rgb(22_21_21/0.18)]"
        style={{ background: pass.backgroundColor, color: pass.foregroundColor }}
      >
        <div className="px-6 pt-6 pb-6">
          <div className="flex items-start justify-between gap-4">
            <p className="font-brand text-2xl leading-tight font-extrabold">{pass.logoText || pass.organizationName}</p>
            {headerFields.length > 0 && (
              <dl className="flex gap-4 text-right">
                {headerFields.map((field) => (
                  <div key={field.key} className="min-w-0">
                    {field.label && (
                      <dt className="text-[0.6875rem] font-bold tracking-wide" style={{ color: pass.labelColor }}>
                        {field.label}
                      </dt>
                    )}
                    <dd className="truncate text-base font-semibold">{fieldValue(field.value)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          <p className="mt-8 text-sm font-bold tracking-wide" style={{ color: pass.labelColor }}>
            Баланс бонусов
          </p>
          <p className="display mt-1 text-[clamp(3rem,16vw,4.25rem)] leading-none tabular-nums">
            {money.format(balance)}
          </p>

          {rowFields.length > 0 && (
            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3">
              {rowFields.slice(0, 4).map((field) => (
                <div key={field.key} className="min-w-0">
                  {field.label && (
                    <dt
                      className="truncate text-[0.6875rem] font-bold tracking-wide"
                      style={{ color: pass.labelColor }}
                    >
                      {field.label}
                    </dt>
                  )}
                  <dd className="truncate text-base font-semibold">{fieldValue(field.value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="group mx-3 mb-3 flex w-[calc(100%-1.5rem)] flex-col items-center gap-3 rounded-[22px] bg-white px-6 pt-6 pb-4 text-graphite outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {qr ? (
                <img
                  src={qr}
                  alt=""
                  className="aspect-square w-full max-w-[240px] [image-rendering:pixelated] transition-transform group-hover:scale-[1.02]"
                />
              ) : (
                <span className="grid aspect-square w-full max-w-[240px] place-items-center text-sm text-slate">…</span>
              )}
              <span className="flex items-center gap-2 text-base font-semibold">
                <Icon icon={QrCode01Icon} size={18} />
                {pass.barcodeAltText || "Покажите код на кассе"}
              </span>
              <span className="text-xs text-slate">Нажмите, чтобы открыть на весь экран</span>
            </button>
          </DialogTrigger>
          <DialogContent
            title="QR для кассы"
            description="Поднесите телефон к сканеру. Яркость экрана лучше прибавить."
          >
            {qr && (
              <img src={qr} alt="" className="mx-auto aspect-square w-full max-w-[420px] [image-rendering:pixelated]" />
            )}
            <p className="mt-4 text-center font-mono text-sm break-all text-slate">{pass.barcodeValue}</p>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between gap-3 px-1">
        <span className="shrink-0 text-sm whitespace-nowrap text-muted-foreground">Номер карты</span>
        <CopySerial serial={pass.barcodeValue} />
      </div>

      {pass.backFields.length > 0 && (
        <dl className="flex flex-col divide-y divide-border rounded-[24px] bg-surface px-5">
          {pass.backFields.map((field) => (
            <div key={field.key} className="py-4">
              {field.label && <dt className="text-sm text-muted-foreground">{field.label}</dt>}
              <dd className="mt-0.5 text-lg whitespace-pre-line">{fieldValue(field.value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
