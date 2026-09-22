"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// На телефонах адресная строка постоянно меняет высоту окна: без этого
// ScrollTrigger пересчитывал бы разметку на каждом пикселе прокрутки.
ScrollTrigger.config({ ignoreMobileResize: true });

function heroIntro() {
  const number = SplitText.create("[data-hero-number]", { type: "chars", mask: "chars" });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  tl.from(number.chars, { yPercent: 115, duration: 1.1, stagger: 0.05 })
    .from("[data-hero-sub]", { yPercent: 60, autoAlpha: 0, duration: 0.8 }, 0.4)
    .from("[data-hero-fade]", { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.1 }, 0.65)
    // Карты поднимаются из-под скругления секции веером.
    .from("[data-hero-cards]", { yPercent: 28, scale: 0.92, autoAlpha: 0, duration: 1.4, ease: "expo.out" }, 0.55);

  // Содержимое скрыто CSS, пока таймлайн не выставил стартовые значения.
  gsap.set("[data-hero-item]", { visibility: "visible" });
  document.documentElement.classList.remove("motion-pending");

  // При прокрутке карты уходят вниз медленнее страницы.
  // Сдвигаем обёртку, а не саму картинку: иначе параллакс подхватывал стартовый
  // сдвиг вступления, и на широких экранах карты оставались внизу.
  gsap.fromTo(
    "[data-hero-art]",
    { yPercent: 0 },
    {
      yPercent: 14,
      ease: "none",
      scrollTrigger: { trigger: "[data-hero-art]", start: "top top", end: "bottom top", scrub: true },
    },
  );
}

function headingReveals() {
  gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 105,
          duration: 1,
          stagger: 0.1,
          ease: "power4.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
        }),
    });
  });

  gsap.utils.toArray<HTMLElement>("[data-rise]").forEach((el) => {
    gsap.from(el.children, {
      y: 40,
      autoAlpha: 0,
      duration: 0.9,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  });
}

function calculatorReveal() {
  gsap.from("[data-calc]", {
    y: 80,
    scale: 0.94,
    autoAlpha: 0,
    duration: 1.1,
    ease: "power3.out",
    scrollTrigger: { trigger: "[data-calc]", start: "top 85%", once: true },
  });
}

function categoryRows() {
  gsap.from("[data-category]", {
    xPercent: 12,
    autoAlpha: 0,
    duration: 0.8,
    stagger: 0.07,
    ease: "power3.out",
    scrollTrigger: { trigger: "[data-categories]", start: "top 80%", once: true },
  });
}

function price() {
  const split = SplitText.create("[data-price]", { type: "chars", mask: "chars" });
  gsap.from(split.chars, {
    yPercent: 110,
    duration: 1,
    stagger: 0.04,
    ease: "power4.out",
    scrollTrigger: { trigger: "[data-price]", start: "top 85%", once: true },
  });
}

function business() {
  gsap.from("[data-biz-item]", {
    y: 30,
    autoAlpha: 0,
    duration: 0.8,
    stagger: 0.08,
    ease: "power3.out",
    scrollTrigger: { trigger: "#business", start: "top 75%", once: true },
  });

  // Телефон выезжает снизу и чуть наклоняется, пока блок проходит экран.
  gsap.fromTo(
    "[data-biz-phone]",
    { y: 60, rotateX: 14, transformPerspective: 1200 },
    {
      y: 0,
      rotateX: 0,
      ease: "none",
      scrollTrigger: { trigger: "[data-biz-phone]", start: "top bottom", end: "top 30%", scrub: 0.6 },
    },
  );

  gsap.from("[data-model]", {
    y: 100,
    autoAlpha: 0,
    duration: 1,
    stagger: 0.12,
    ease: "power3.out",
    scrollTrigger: { trigger: "[data-models]", start: "top 80%", once: true },
  });
}

export function PageMotion() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    // Поворот экрана и смена ширины колонки (шрифты, картинки) — повод пересчитать разметку.
    // Следим только за шириной: высота меняется и от самого пересчёта, это зациклило бы наблюдателя.
    let timer = 0;
    const refresh = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    window.addEventListener("orientationchange", refresh);

    const main = document.querySelector("main");
    let lastWidth = main?.getBoundingClientRect().width ?? 0;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (Math.abs(width - lastWidth) < 1) return;
      lastWidth = width;
      refresh();
    });
    if (main) observer.observe(main);

    mm.add({ motion: "(prefers-reduced-motion: no-preference)" }, (ctx) => {
      const { motion } = ctx.conditions as Record<string, boolean>;
      if (!motion) return;

      heroIntro();
      headingReveals();
      calculatorReveal();
      categoryRows();
      price();
      business();
    });
  });

  return null;
}
