import type { PublicPassInfo } from "@loal/api";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

const money = new Intl.NumberFormat("ru-RU");

/** QR рисуем в браузере из значения штрихкода — картинку сервер не отдаёт. */
function useQrDataUrl(value: string) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { margin: 1, width: 480, color: { dark: "#090809", light: "#ffffff" } })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [value]);
  return src;
}

/**
 * Карта так, как её видит держатель: цвета приходят из шаблона в бэкенде,
 * поэтому подставляем их инлайном, а не классами.
 */
export function CardView({ pass }: { pass: PublicPassInfo }) {
  const qr = useQrDataUrl(pass.barcodeValue);
  const balance = pass.primaryFields[0];

  return (
    <div className="flex flex-col gap-6">
      <div
        className="rounded-[28px] p-7 shadow-[0_1.5rem_3rem_rgb(9_8_9/0.18)]"
        style={{ background: pass.backgroundColor, color: pass.foregroundColor }}
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-lg font-bold">{pass.organizationName}</p>
          {pass.headerFields[0] && (
            <p className="text-right text-base" style={{ color: pass.labelColor }}>
              {pass.headerFields[0].label}:{" "}
              <span style={{ color: pass.foregroundColor }}>{pass.headerFields[0].value}</span>
            </p>
          )}
        </div>

        <p className="mt-8 text-base" style={{ color: pass.labelColor }}>
          {balance?.label ?? "Баланс бонусов"}
        </p>
        <p className="display text-[clamp(2.5rem,12vw,4rem)] leading-none tabular-nums">
          {money.format(pass.pointsBalance)}
        </p>

        {pass.secondaryFields.length > 0 && (
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
            {pass.secondaryFields.map((field) => (
              <div key={field.key}>
                <dt className="text-sm" style={{ color: pass.labelColor }}>
                  {field.label}
                </dt>
                <dd className="text-lg">{field.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-8 flex justify-center rounded-2xl bg-white p-4">
          {qr ? (
            <img src={qr} alt={`QR-код карты ${pass.barcodeValue}`} className="h-44 w-44" />
          ) : (
            <span className="grid h-44 w-44 place-items-center text-base text-slate">Готовим код…</span>
          )}
        </div>
        <p className="mt-3 text-center text-sm tabular-nums" style={{ color: pass.labelColor }}>
          {pass.barcodeAltText ?? pass.barcodeValue}
        </p>
      </div>

      {pass.backFields.length > 0 && (
        <dl className="flex flex-col gap-4 rounded-[24px] bg-paper p-6">
          {pass.backFields.map((field) => (
            <div key={field.key}>
              <dt className="text-base text-slate">{field.label}</dt>
              <dd className="text-lg">{field.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
