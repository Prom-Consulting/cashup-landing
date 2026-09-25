import type { PublicPassInfo } from "@loal/api";
import { useEffect, useState } from "react";
import { CardQr } from "../card-qr";

const money = new Intl.NumberFormat("ru-RU");

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

        <div className="px-3 pb-3">
          <CardQr value={pass.barcodeValue} caption={pass.barcodeAltText} />
        </div>
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
