"use client";

import { useId, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const PERCENTS = [10, 20, 30, 50];
const MIN = 200;
const MAX = 23000;
const BALANCE = 100_000;

// Полоса чека не схлопывается: 30% ширины на минимальной покупке, вся ширина — на максимальной.
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
  // Стартовый текст фиксирован: после монтирования эти узлы обновляет GSAP, React их не трогает.
  const [initial] = useState(() => ({
    bonuses: format(bonuses),
    cash: format(cash),
    amount: format(amount),
    left: format(left),
    checkWidth: checkWidth(amount),
    bonusWidth: `${percent}%`,
  }));

  // Цифры докручиваются до новых значений, полосы следуют за суммой и процентом.
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
    },
    { scope: root, dependencies: [bonuses, cash, amount, left, percent], revertOnUpdate: false },
  );

  // Печать подпрыгивает при каждой смене процента.
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        root.current!.querySelector("[data-stamp]"),
        { scale: 1.35, rotate: -8 },
        { scale: 1, rotate: 0, duration: 0.5, ease: "back.out(3)" },
      );
    },
    { scope: root, dependencies: [percent], revertOnUpdate: false },
  );

  const fill = ((amount - MIN) / (MAX - MIN)) * 100;

  return (
    <div
      ref={root}
      className="grid overflow-hidden rounded-[32px] bg-graphite text-white sm:rounded-[48px] lg:grid-cols-2"
    >
      <div className="flex flex-col gap-10 p-6 sm:gap-12 sm:p-11">
        <div>
          <label htmlFor={amountId} className="text-xl sm:text-[26px]">
            Сумма покупки
          </label>
          <p className="display mt-4 text-[clamp(2.75rem,5vw,4.7rem)] whitespace-nowrap tabular-nums">
            <span data-out-amount>{initial.amount}</span> сом
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
          <div className="mt-3 flex justify-between text-base text-slate-soft sm:text-lg">
            <span>200 сом</span>
            <span>23 000 сом</span>
          </div>
        </div>

        <fieldset>
          <legend className="text-xl sm:text-[26px]">Процент партнёра</legend>
          <div className="mt-5 grid grid-cols-4 gap-2.5 sm:gap-4">
            {PERCENTS.map((p) => (
              <label
                key={p}
                className="display grid h-16 cursor-pointer place-items-center rounded-2xl bg-coal text-2xl transition-[background-color,scale] duration-200 hover:bg-[#333133] active:scale-95 has-[:checked]:bg-flame has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-white sm:h-[106px] sm:rounded-[20px] sm:text-[46px]"
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
          <p className="mt-5 max-w-[52ch] text-base leading-snug text-slate-soft sm:text-lg">
            Каждый партнёр сам задаёт, какую часть чека можно оплатить бонусами в этом месяце. Процент виден в каталоге.
            1 бонус = 1 сом.
          </p>
        </fieldset>
      </div>

      <div className="flex justify-center rounded-[32px] bg-coal px-6 pt-14 pb-10 sm:rounded-[48px] sm:px-12 sm:pt-12 sm:pb-12">
        <div className="relative w-full max-w-[369px]">
          <div className="receipt bg-white px-5 pt-5 pb-8 text-graphite">
            <p className="display text-[42px] leading-none">Чек</p>
            <p className="mt-3 text-base text-slate">Кофейня, партнёр Loal</p>

            <dl aria-live="polite" className="mt-6 flex flex-col gap-3 text-lg">
              <div className="flex justify-between gap-4">
                <dt>Покупка</dt>
                <dd className="tabular-nums">
                  <span data-out-amount>{initial.amount}</span> сом
                </dd>
              </div>
              <div className="flex justify-between gap-4 text-flame-ink">
                <dt>Бонусами, {percent}%</dt>
                <dd className="tabular-nums">
                  −<span data-out-bonus>{initial.bonuses}</span> сом
                </dd>
              </div>
            </dl>
            <div className="mt-3 border-t border-slate-soft/50" />

            <p className="mt-3 text-lg">К оплате деньгами</p>
            <p className="display mt-1 text-[30px] whitespace-nowrap tabular-nums">
              <span data-out-cash>{initial.cash}</span> сом
            </p>

            <div className="mt-3" aria-hidden="true">
              <div className="h-[11px] overflow-hidden rounded-full bg-cream">
                <div
                  data-bar-check
                  className="flex h-full overflow-hidden rounded-full bg-graphite"
                  style={{ width: initial.checkWidth }}
                >
                  <div data-bar-bonus className="h-full rounded-full bg-flame" style={{ width: initial.bonusWidth }} />
                </div>
              </div>
              <div className="mt-3 flex gap-5 text-base">
                <span className="flex items-center gap-2 text-flame-ink">
                  <span className="h-2 w-2 rounded-full bg-flame" />
                  Бонусы
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-graphite" />
                  Деньги
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-2 rounded-xl bg-cream px-4 py-3.5 text-center">
              <span className="text-base">Останется на карте</span>
              <span className="display text-[30px] whitespace-nowrap tabular-nums">
                <span data-out-left>{initial.left}</span> бонусов
              </span>
            </div>
          </div>

          <div
            data-stamp
            aria-hidden="true"
            className="absolute -top-6 -right-3 rounded-full bg-flame px-5 py-3 text-center text-base leading-tight font-bold text-graphite sm:-right-[72px]"
          >
            <span className="block whitespace-nowrap tabular-nums">
              −<span data-out-bonus>{initial.bonuses}</span>
            </span>
            <span className="block whitespace-nowrap">бонусов</span>
          </div>
        </div>
      </div>
    </div>
  );
}
