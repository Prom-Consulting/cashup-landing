"use client";

import Image, { type StaticImageData } from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import stepPay from "@/public/images/landing/step-pay.png";
import stepRefill from "@/public/images/landing/step-refill.png";
import stepSubscribe from "@/public/images/landing/step-subscribe.png";
import stepWallet from "@/public/images/landing/step-wallet.png";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type Step = {
  title: string;
  text: string;
  balance: number;
  image: StaticImageData;
  alt: string;
  /** ширина картинки в макете, px при ширине страницы 1512 */
  imageWidth: number;
  /** сдвиг к центру в одну колонку, если прозрачные поля картинки несимметричны */
  centerFix?: string;
};

const steps: Step[] = [
  {
    title: "Оформление\nподписки",
    text: "5–10 $ в месяц — примерно 440–880 сом. Оплата через OctōPAY, после неё сразу открывается личный кабинет.",
    balance: 0,
    image: stepSubscribe,
    alt: "Телефон с картой Loal и переключателем «Active»",
    imageWidth: 591,
  },
  {
    title: "Получаете 100 000\nсом бонусами",
    text: "Карта Loal добавляется в Apple Wallet по ссылке или QR-коду. Баланс уже на ней.",
    balance: 100_000,
    image: stepWallet,
    alt: "Карта Loal с балансом 100 000 поверх других карт",
    imageWidth: 447,
  },
  {
    title: "Платите\nу партнёров",
    text: "Показываете QR карты на кассе. Бонусами закрывается часть чека — не больше процента партнёра, остаток деньгами.",
    balance: 36_800,
    image: stepPay,
    alt: "Платёжный терминал и бумажные пакеты с покупками",
    imageWidth: 593,
    // слева 16% пустого поля, справа 3%
    centerFix: "-translate-x-[6.5%] lg:translate-x-0",
  },
  {
    title: "Первого числа —\nснова 100 000",
    text: "Перед концом месяца придёт напоминание. Продлили в кабинете — баланс снова полный. Не продлили — бонусы сгорают.",
    balance: 100_000,
    image: stepRefill,
    alt: "Настольный календарь, первое число отмечено",
    imageWidth: 434,
  },
];

const format = (n: number) => Math.round(n).toLocaleString("ru-RU").replace(/\s/g, " ");

export function MonthSteps() {
  const root = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-step]", root.current).forEach((row, i) => {
          const fromLeft = i % 2 === 0; // картинка слева на нечётных шагах
          const art = row.querySelector("[data-step-art]");
          const text = row.querySelectorAll("[data-step-text] > *");
          const badge = row.querySelector("[data-step-badge]");
          const value = row.querySelector<HTMLElement>("[data-step-value]");
          const counter = { v: i === 0 ? 0 : steps[i - 1].balance };

          const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 78%", once: true } });
          tl.from(art, { xPercent: fromLeft ? -12 : 12, y: 40, autoAlpha: 0, duration: 1, ease: "power3.out" }).from(
            text,
            { y: 32, autoAlpha: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" },
            0.15,
          );
          if (badge) {
            tl.from(badge, { scale: 0, rotate: 30, duration: 0.7, ease: "back.out(2.4)" }, 0.55);
          }
          if (value) {
            tl.fromTo(
              counter,
              { v: counter.v },
              {
                v: steps[i].balance,
                duration: 1,
                ease: "power2.out",
                onUpdate: () => (value.textContent = format(Math.round(counter.v / 100) * 100)),
              },
              0.5,
            );
          }
          // Предмет слегка плывёт вместе со скроллом — даёт глубину без закрепления сцены.
          gsap.to(art, {
            y: -40,
            ease: "none",
            scrollTrigger: { trigger: row, start: "top bottom", end: "bottom top", scrub: true },
          });
        });
      });
    },
    { scope: root },
  );

  return (
    <ol ref={root} className="mt-12 flex flex-col gap-16 sm:mt-20 lg:gap-24">
      {steps.map((step, i) => {
        const imageLeft = i % 2 === 0;
        return (
          <li
            key={step.title}
            data-step
            className={`flex flex-col items-center gap-8 lg:gap-12 ${imageLeft ? "lg:flex-row" : "lg:flex-row-reverse"}`}
          >
            <div data-step-art className="relative flex w-full justify-center lg:w-1/2">
              <div className={`relative ${step.centerFix ?? ""}`} style={{ width: `min(100%, ${step.imageWidth}px)` }}>
                <Image
                  src={step.image}
                  alt={step.alt}
                  placeholder="blur"
                  sizes={`(min-width: 1024px) ${step.imageWidth}px, 90vw`}
                  className="h-auto w-full"
                />
                {i === 1 && (
                  <span
                    data-step-badge
                    aria-hidden="true"
                    className="brand-gradient display absolute top-[6%] right-0 -rotate-[15deg] lg:-right-[8%] rounded-full px-[4.5%] py-[3%] text-[clamp(1.5rem,5.5vw,2.56rem)] whitespace-nowrap text-white"
                  >
                    +100 000
                  </span>
                )}
              </div>
            </div>

            <div
              className={`flex w-full justify-center lg:w-1/2 lg:justify-start ${imageLeft ? "lg:pl-[1%]" : "lg:pl-[5%] xl:pl-[17%]"}`}
            >
              <div data-step-text className="w-full max-w-[530px]">
                <p className="text-lg sm:text-xl">
                  Шаг {i + 1} из {steps.length}
                </p>
                <h3 className="display mt-4 text-[clamp(2.25rem,4.5vw,3.2rem)] leading-[0.98] whitespace-pre-line sm:mt-6">
                  {step.title}
                </h3>
                <p className="mt-4 text-lg leading-snug text-slate sm:mt-6 sm:text-xl">{step.text}</p>
                <p className="mt-6 inline-flex rounded-full bg-cream px-5 py-4 text-base whitespace-nowrap sm:text-lg">
                  Бонусов на карте&nbsp;
                  <b className="font-bold whitespace-nowrap tabular-nums">
                    <span data-step-value>{format(step.balance)}</span> сом
                  </b>
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
