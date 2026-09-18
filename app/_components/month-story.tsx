"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { useGSAP } from "@gsap/react";
import { blobPaths, storyScenes } from "./story-scenes";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin, MorphSVGPlugin);

const steps = [
  {
    short: "Подписка",
    title: "Оформляете подписку",
    text: "5–10 $ в месяц — примерно 440–880 сом. Оплата через OctōPAY, после неё сразу открывается личный кабинет.",
    balance: 0,
  },
  {
    short: "100 000 сом",
    title: "Получаете 100 000 сом бонусами",
    text: "Карта Loal добавляется в Apple Wallet по ссылке или QR-коду. Баланс уже на ней.",
    balance: 100_000,
  },
  {
    short: "Покупки",
    title: "Платите у партнёров",
    text: "Показываете QR карты на кассе. Бонусами закрывается часть чека — не больше процента партнёра, остаток деньгами.",
    balance: 36_800,
  },
  {
    short: "Снова 100 000",
    title: "Первого числа — снова 100 000",
    text: "Перед концом месяца придёт напоминание. Продлили в кабинете — баланс снова полный. Не продлили — бонусы сгорают.",
    balance: 100_000,
  },
];

// Hex values so GSAP can interpolate the blob colour.
// Подложки сцен: светлые оттенки фирменного градиента
const blobColors = ["#ffe0c4", "#f0ebe8", "#ffd2ae", "#f7e7da"];

// Adds a from-tween only when the scene has matching elements (avoids GSAP "target not found").
const fromIf = (tl: gsap.core.Timeline, nodes: NodeListOf<Element>, vars: gsap.TweenVars, position: number) =>
  nodes.length ? tl.from(nodes, vars, position) : tl;

const format = (n: number) => Math.round(n).toLocaleString("ru-RU").replace(/\s/g, " ");

export function MonthStory() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(q("[data-scan]"), { y: 70, duration: 1.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
        // Relative y: SVG groups keep their own translate().
        q("[data-float]").forEach((el, i) =>
          gsap.to(el, {
            y: i % 2 ? "+=8" : "-=8",
            duration: 1.8 + (i % 3) * 0.4,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          }),
        );
      });

      // Desktop: pinned stage, art and text swap sides on every step.
      mm.add("(min-width: 1280px) and (prefers-reduced-motion: no-preference)", () => {
        const stage = q("[data-stage]")[0];
        const slides = q<HTMLElement>("[data-slide]");
        const blobSvg = q("[data-blob-svg]")[0];
        const blob = q("[data-blob]")[0];
        const line = q("[data-rail-line]")[0];
        const fills = q("[data-rail-fill]");
        const nums = q("[data-rail-num]");
        const rings = q("[data-rail-ring]");
        const labels = q("[data-rail-label]");

        // Absolute slides and the stepper only exist while the stage is pinned.
        stage.setAttribute("data-pinned", "true");

        const arts = slides.map((sl) => sl.querySelector("[data-slide-art]")!);
        const texts = slides.map((sl) => sl.querySelector("[data-slide-text]")!);
        const blobLeft = (i: number) => (i % 2 ? "50%" : "4%");
        const white = "#fcf9f9";
        const ink = "#161515";

        // Start from a clean, explicit state: a previous mobile context may have left inline styles.
        gsap.set([...arts, ...texts], { clearProps: "all" });
        gsap.set(slides, { autoAlpha: (i) => (i === 0 ? 1 : 0) });
        gsap.set(blob, { attr: { d: blobPaths[0] }, fill: blobColors[0] });
        gsap.set(blobSvg, { left: blobLeft(0), rotate: 0 });
        gsap.set(line, { scaleX: 0 });
        gsap.set(fills, { scale: (i) => (i === 0 ? 1 : 0) });
        gsap.set(nums, { color: (i) => (i === 0 ? white : ink) });
        gsap.set(rings, { autoAlpha: (i) => (i === 0 ? 1 : 0) });
        gsap.set(labels, { opacity: (i) => (i === 0 ? 1 : 0.45) });
        gsap.to(q("[data-rail-pulse]"), {
          scale: 1.5,
          opacity: 0,
          duration: 1.4,
          repeat: -1,
          ease: "power2.out",
        });

        // Every tween states both ends, so the scene is identical however often ScrollTrigger refreshes.
        const transition = (i: number) => {
          const prev = slides[i - 1];
          const next = slides[i];
          const dir = i % 2 === 1 ? 1 : -1; // odd steps put the art on the right
          const chip = next.querySelector("[data-slide-balance]");
          const counter = { v: steps[i - 1].balance };
          const lazy = { immediateRender: false };

          const tl = gsap.timeline();
          // Outgoing art and text fade in their own columns; incoming ones appear in theirs.
          // Nothing crosses the page, so a paused scroll never shows art over text.
          tl.fromTo(
            arts[i - 1],
            { y: 0, scale: 1, rotate: 0, autoAlpha: 1 },
            { y: -30, scale: 0.9, rotate: dir * 5, autoAlpha: 0, duration: 0.42, ease: "power1.in", ...lazy },
            0,
          )
            .fromTo(
              texts[i - 1],
              { y: 0, autoAlpha: 1 },
              { y: -24, autoAlpha: 0, duration: 0.32, ease: "power1.in", ...lazy },
              0,
            )
            .fromTo(
              blob,
              { morphSVG: blobPaths[i - 1], fill: blobColors[i - 1] },
              { morphSVG: blobPaths[i], fill: blobColors[i], duration: 0.9, ease: "power2.inOut", ...lazy },
              0,
            )
            .fromTo(
              blobSvg,
              { left: blobLeft(i - 1), rotate: (i - 1) * 40 },
              { left: blobLeft(i), rotate: i * 40, duration: 0.9, ease: "power2.inOut", ...lazy },
              0,
            )
            .fromTo(
              line,
              { scaleX: (i - 1) / (steps.length - 1) },
              { scaleX: i / (steps.length - 1), duration: 0.8, ease: "power1.inOut", ...lazy },
              0,
            )
            .fromTo(rings[i - 1], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, ...lazy }, 0.1)
            .fromTo(prev, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.01, ...lazy }, 0.44)
            .fromTo(next, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01, ...lazy }, 0.33)
            .fromTo(
              arts[i],
              { y: 50, scale: 0.85, rotate: -dir * 6, autoAlpha: 0 },
              { y: 0, scale: 1, rotate: 0, autoAlpha: 1, duration: 0.6, ease: "power2.out" },
              0.34,
            )
            .fromTo(texts[i], { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "power2.out" }, 0.44)
            .fromTo(
              next.querySelectorAll("[data-pop]"),
              { scale: 0, transformOrigin: "50% 50%" },
              { scale: 1, stagger: 0.04, duration: 0.4, ease: "back.out(2.4)" },
              0.45,
            )
            .fromTo(fills[i], { scale: 0 }, { scale: 1, duration: 0.4, ease: "back.out(2.5)", ...lazy }, 0.6)
            .fromTo(labels[i], { opacity: 0.45 }, { opacity: 1, duration: 0.3, ...lazy }, 0.6)
            .fromTo(nums[i], { color: ink }, { color: white, duration: 0.2, ...lazy }, 0.65)
            .fromTo(rings[i], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ...lazy }, 0.75)
            .fromTo(
              counter,
              { v: steps[i - 1].balance },
              {
                v: steps[i].balance,
                duration: 0.7,
                ease: "power2.out",
                onUpdate: () => {
                  if (chip) chip.textContent = format(Math.round(counter.v / 100) * 100);
                },
              },
              0.5,
            );
          const draws = next.querySelectorAll("[data-draw]");
          if (draws.length) {
            tl.fromTo(draws, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.6, ease: "power1.inOut" }, 0.45);
          }
          return tl;
        };

        const master = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: () => `+=${window.innerHeight * 4}`,
            pin: true,
            scrub: 0.6,
          },
        });

        master.addLabel("step0", 0);
        for (let i = 1; i < steps.length; i++) {
          master.add(transition(i), ">+1").addLabel(`step${i}`);
        }
        master.to({}, { duration: 1 });

        return () => {
          stage.removeAttribute("data-pinned");
          gsap.set([...arts, ...texts], { clearProps: "all" });
        };
      });

      // Mobile and tablet: each scene assembles as it scrolls in.
      mm.add("(max-width: 1279px) and (prefers-reduced-motion: no-preference)", () => {
        q<HTMLElement>("[data-slide]").forEach((slide) => {
          const tl = gsap
            .timeline({ scrollTrigger: { trigger: slide, start: "top 75%", once: true } })
            .from(slide.querySelectorAll("[data-pop]"), {
              scale: 0,
              transformOrigin: "50% 50%",
              stagger: 0.05,
              duration: 0.45,
              ease: "back.out(2.4)",
            })
            .from(slide.querySelector("[data-slide-text]"), { y: 30, autoAlpha: 0, duration: 0.6 }, 0.1);
          fromIf(tl, slide.querySelectorAll("[data-draw]"), { drawSVG: "0%", duration: 0.7 }, 0.2);
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      <div data-stage className="group relative data-[pinned=true]:h-screen data-[pinned=true]:overflow-hidden">
        <svg
          data-blob-svg
          viewBox="0 0 600 600"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-[4%] hidden w-[min(44vw,640px)] -translate-y-1/2 group-data-[pinned=true]:block"
        >
          <path data-blob d={blobPaths[0]} fill={blobColors[0]} opacity="0.5" />
        </svg>

        <ol>
          {steps.map((step, i) => {
            const Scene = storyScenes[i];
            return (
              <li
                key={step.title}
                data-slide
                className={`mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-10 sm:px-10 xl:items-center xl:justify-between xl:gap-16 xl:py-14 group-data-[pinned=true]:absolute group-data-[pinned=true]:inset-0 group-data-[pinned=true]:py-0 group-data-[pinned=true]:pb-28 ${
                  i % 2 ? "xl:flex-row-reverse" : "xl:flex-row"
                }`}
              >
                <div data-slide-art className="relative mx-auto w-full max-w-[560px] xl:mx-0 xl:w-[44%]">
                  <svg
                    viewBox="0 0 600 600"
                    aria-hidden="true"
                    className="absolute inset-[-6%] group-data-[pinned=true]:hidden"
                  >
                    <path d={blobPaths[i]} fill={blobColors[i]} opacity="0.45" />
                  </svg>
                  <Scene className="relative h-auto w-full" />
                </div>

                <div data-slide-text className="xl:w-[44%]">
                  <p className="font-medium">Шаг {i + 1} из 4</p>
                  <h3 className="display mt-3 text-[clamp(2.26rem,4.51vw,4.48rem)] text-flame">{step.title}</h3>
                  <p className="mt-6 max-w-[40ch] text-lg leading-relaxed sm:text-xl">{step.text}</p>
                  <p className="mt-8 inline-flex items-baseline gap-3 rounded-full bg-paper px-6 py-3">
                    <span className="font-medium">Бонусов на карте</span>
                    <span className="display text-4xl whitespace-nowrap tabular-nums">
                      <span data-slide-balance>{format(step.balance)}</span> сом
                    </span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div
          aria-hidden="true"
          className="absolute bottom-6 left-1/2 hidden w-[min(90%,760px)] -translate-x-1/2 group-data-[pinned=true]:block"
        >
          <div className="relative grid grid-cols-4">
            <div className="absolute top-5 right-[12.5%] left-[12.5%] h-1 -translate-y-1/2 rounded-full bg-graphite/15">
              <div data-rail-line className="h-full origin-left rounded-full bg-flame-ink" />
            </div>
            {steps.map((step, i) => (
              <div key={step.short} className="relative flex flex-col items-center gap-2.5">
                <span className="relative grid h-10 w-10 place-items-center rounded-full border-2 border-graphite/20 bg-paper">
                  <span data-rail-ring className="absolute -inset-1.5">
                    <span className="absolute inset-0 rounded-full border-2 border-flame" />
                    <span data-rail-pulse className="absolute inset-0 rounded-full border-2 border-flame" />
                  </span>
                  <span data-rail-fill className="absolute -inset-0.5 rounded-full bg-flame-ink" />
                  <span data-rail-num className="display relative text-2xl leading-none">
                    {i + 1}
                  </span>
                </span>
                <span data-rail-label className="text-sm font-medium whitespace-nowrap">
                  {step.short}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
