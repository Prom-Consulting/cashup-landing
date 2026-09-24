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
    QRCode.toDataURL(value, { margin: 0, width, color: { dark: "#090809", light: "#ffffff" } })
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
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-base tabular-nums transition-colors hover:bg-white/10"
    >
      <span>{serial}</span>
      <Icon icon={copied ? Tick02Icon : Copy01Icon} size={18} />
      <span className="sr-only">{copied ? "Номер скопирован" : "Скопировать номер карты"}</span>
    </button>
  );
}

/**
 * Карта так, как её видит держатель. Цвета приходят из шаблона в бэкенде, поэтому
 * подставляем их инлайном. Нижний край — перфорация, как у чека: та же деталь, что
 * в калькуляторе на сайте.
 */
export function CardView({ pass }: { pass: PublicPassInfo }) {
  const qr = useQrDataUrl(pass.barcodeValue);
  const bigQr = useQrDataUrl(pass.barcodeValue, 900);
  const balance = useCountUp(pass.pointsBalance);
  const validUntil = pass.secondaryFields.find((field) => field.label)?.value;

  return (
    <div className="flex flex-col gap-5">
      <div
        className="receipt relative overflow-hidden px-6 pt-6 pb-9 text-white"
        style={{ background: pass.backgroundColor, color: pass.foregroundColor }}
      >
        {/* Тёплый отсвет — единственное украшение, остальное держим тихим */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full opacity-25 blur-3xl"
          style={{ background: "var(--amber)" }}
        />

        <div className="relative flex items-baseline justify-between gap-3">
          <p className="font-brand text-2xl font-bold">{pass.organizationName}</p>
          {validUntil && (
            <p className="text-base" style={{ color: pass.labelColor }}>
              до {validUntil}
            </p>
          )}
        </div>

        <p className="relative mt-8 text-base" style={{ color: pass.labelColor }}>
          Баланс бонусов
        </p>
        <p
          className="display relative text-[clamp(3rem,17vw,4.5rem)] leading-none tabular-nums"
          style={{ color: pass.foregroundColor }}
        >
          {money.format(balance)}
        </p>
        <p className="relative mt-2 text-lg" style={{ color: pass.labelColor }}>
          бонусов — тратьте у партнёров
        </p>

        <div className="relative mt-7 flex items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="rounded-2xl bg-white p-3 transition-transform hover:scale-[1.03] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                {qr ? (
                  <img src={qr} alt="" className="h-28 w-28" />
                ) : (
                  <span className="grid h-28 w-28 place-items-center text-sm text-slate">…</span>
                )}
                <span className="sr-only">Показать QR во весь экран</span>
              </button>
            </DialogTrigger>
            <DialogContent title="QR для кассы" description="Поднесите к сканеру. Экран лучше сделать поярче.">
              {bigQr && <img src={bigQr} alt="" className="mx-auto aspect-square w-full max-w-[420px]" />}
              <p className="mt-4 text-center text-lg tabular-nums">{pass.barcodeValue}</p>
            </DialogContent>
          </Dialog>

          <div className="min-w-0">
            <p className="flex items-center gap-2 text-base" style={{ color: pass.labelColor }}>
              <Icon icon={QrCode01Icon} size={18} />
              Покажите на кассе
            </p>
            <div className="mt-1 -ml-3">
              <CopySerial serial={pass.barcodeValue} />
            </div>
          </div>
        </div>
      </div>

      {pass.backFields.length > 0 && (
        <dl className="flex flex-col gap-4 px-1">
          {pass.backFields.map((field) => (
            <div key={field.key}>
              <dt className="text-base text-muted-foreground">{field.label}</dt>
              <dd className="text-lg">{field.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
