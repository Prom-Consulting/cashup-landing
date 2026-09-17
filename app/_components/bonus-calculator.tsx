"use client";

import { useId, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const PERCENTS = [10, 20, 30, 50];
const MIN = 200;
const MAX = 20000;
const BALANCE = 100_000;

// The check bar never collapses: 30% at the minimum purchase, full at the maximum.
const checkWidth = (amount: number) => `${30 + ((amount - MIN) / (MAX - MIN)) * 70}%`;

const format = (n: number) => Math.round(n).toLocaleString("ru-RU").replace(/\s/g, " ");

export function BonusCalculator() {
  const [amount, setAmount] = useState(2000);
  const [percent, setPercent] = useState(20);
  const amountId = useId();

  const bonuses = Math.round((amount * percent) / 100);
  const cash = amount - bonuses;
  const left = BALANCE - bonuses;

  const root = useRef<HTMLDivElement>(null);
  const shown = useRef({ bonuses, cash, amount, left });
  // Stable initial text: GSAP owns these nodes after mount, React must not rewrite them.
  const [initial] = useState(() => ({
    bonuses: format(bonuses),
    cash: format(cash),
    amount: format(amount),
    left: format(left),
    checkWidth: checkWidth(amount),
    bonusWidth: `${percent}%`,
    leftWidth: `${(left / BALANCE) * 100}%`,
  }));

  // Numbers roll to their new values; the bars follow amount, percent and balance.
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const d = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1;
      const write = () => {
        const v = shown.current;
        q("[data-out-bonus]").forEach((el) => (el.textContent = format(v.bonuses)));
        q("[data-out-cash]").forEach((el) => (el.textContent = format(v.cash)));
        q("[data-out-amount]").forEach((el) => (el.textContent = format(v.amount)));
        q("[data-out-left]").forEach((el) => (el.textContent = format(v.left)));
      };
      const ease = "power3.out";
      gsap.to(shown.current, {
        bonuses,
        cash,
        amount,
        left,
        duration: 0.5 * d,
        ease,
        overwrite: true,
        onUpdate: write,
      });
      gsap.to(q("[data-bar-check]"), { width: checkWidth(amount), duration: 0.5 * d, ease, overwrite: true });
      gsap.to(q("[data-bar-bonus]"), { width: `${percent}%`, duration: 0.6 * d, ease, overwrite: true });
      gsap.to(q("[data-bar-left]"), { width: `${(left / BALANCE) * 100}%`, duration: 0.6 * d, ease, overwrite: true });
    },
    { scope: root, dependencies: [bonuses, cash, amount, left, percent], revertOnUpdate: false },
  );

  // The stamp thumps whenever the partner percent changes.
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        root.current!.querySelector("[data-stamp]"),
        { scale: 1.6, rotate: -40, autoAlpha: 0 },
        { scale: 1, rotate: -12, autoAlpha: 1, duration: 0.5, ease: "back.out(3)" },
      );
    },
    { scope: root, dependencies: [percent], revertOnUpdate: false },
  );

  const fill = ((amount - MIN) / (MAX - MIN)) * 100;

  return (
    <div ref={root} className="grid overflow-hidden rounded-[36px] bg-forest text-chalk lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-10 p-7 sm:p-12">
        <div>
          <label htmlFor={amountId} className="text-lg font-medium">
            Сумма покупки
          </label>
          <p className="display mt-3 text-[clamp(4rem,9vw,7rem)] whitespace-nowrap tabular-nums">
            <span data-out-amount>{initial.amount}</span>
            <span className="text-bubblegum"> сом</span>
          </p>
          <input
            id={amountId}
            type="range"
            min={MIN}
            max={MAX}
            step={100}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="calc-range mt-6 w-full"
            style={{ "--fill": `${fill}%` } as React.CSSProperties}
          />
          <div className="mt-2 flex justify-between text-sm opacity-70">
            <span>200 сом</span>
            <span>20 000 сом</span>
          </div>
        </div>

        <fieldset>
          <legend className="text-lg font-medium">Процент партнёра</legend>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {PERCENTS.map((p) => (
              <label
                key={p}
                className="display grid h-20 cursor-pointer place-items-center rounded-2xl border-2 border-chalk/25 text-4xl transition-[background-color,border-color,scale] duration-200 hover:border-bubblegum active:scale-95 has-[:checked]:border-magenta has-[:checked]:bg-magenta-ink has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bubblegum sm:h-24 sm:text-5xl"
              >
                <input
                  type="radio"
                  name="percent"
                  value={p}
                  checked={percent === p}
                  onChange={() => setPercent(p)}
                  className="sr-only"
                />
                {p}%
              </label>
            ))}
          </div>
          <p className="mt-4 max-w-[46ch] text-sm opacity-80">
            Каждый партнёр сам задаёт, какую часть чека можно оплатить бонусами в этом месяце. Процент виден в каталоге.
            1 бонус = 1 сом.
          </p>
        </fieldset>
      </div>

      <div className="relative bg-chalk/5 px-7 pt-12 pb-14 sm:p-12">
        <div className="relative mx-auto max-w-[420px] rotate-[1.5deg]">
          <div className="receipt bg-chalk px-7 pt-8 pb-12 text-forest">
            <p className="display text-4xl">Чек</p>
            <p className="mt-1 text-sm opacity-70">Кофейня, партнёр CashUp</p>

            <dl aria-live="polite" className="mt-6 flex flex-col gap-3 border-b-2 border-dashed border-lilac pb-5">
              <div className="flex justify-between gap-4">
                <dt>Покупка</dt>
                <dd className="font-medium tabular-nums">
                  <span data-out-amount>{initial.amount}</span> сом
                </dd>
              </div>
              <div className="flex justify-between gap-4 text-magenta-ink">
                <dt>Бонусами, {percent}%</dt>
                <dd className="font-bold tabular-nums">
                  −<span data-out-bonus>{initial.bonuses}</span> сом
                </dd>
              </div>
            </dl>

            <p className="mt-5 font-medium">К оплате деньгами</p>
            <p className="display mt-1 text-[clamp(3.5rem,7vw,5.5rem)] whitespace-nowrap tabular-nums">
              <span data-out-cash>{initial.cash}</span> сом
            </p>

            <div className="mt-6" aria-hidden="true">
              <div className="h-5 overflow-hidden rounded-full bg-lilac/50">
                <div
                  data-bar-check
                  className="flex h-full overflow-hidden rounded-full"
                  style={{ width: initial.checkWidth }}
                >
                  <div data-bar-bonus className="h-full bg-magenta" style={{ width: initial.bonusWidth }} />
                  <div className="h-full flex-1 bg-forest" />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
                <span className="flex items-center gap-2 text-magenta-ink">
                  <span className="h-2.5 w-2.5 rounded-full bg-magenta" />
                  Бонусы
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-forest" />
                  Деньги
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-blush px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium">Останется на карте</span>
                <span className="display text-2xl tabular-nums">
                  <span data-out-left>{initial.left}</span> сом
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-chalk" aria-hidden="true">
                <div
                  data-bar-left
                  className="h-full rounded-full bg-magenta-ink"
                  style={{ width: initial.leftWidth }}
                />
              </div>
            </div>
          </div>

          <div
            data-stamp
            aria-hidden="true"
            style={{ transform: "rotate(-12deg)" }}
            className="absolute -top-12 -right-8 grid h-28 w-28 place-items-center rounded-full border-4 border-magenta bg-chalk text-center text-magenta-ink"
          >
            <span className="display text-3xl leading-none">
              −<span data-out-bonus>{initial.bonuses}</span>
              <span className="block text-base">сом бонусами</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
