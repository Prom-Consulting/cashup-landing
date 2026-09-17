"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

const formatBalance = (n: number) => Math.round(n).toLocaleString("ru-RU").replace(/\s/g, " ");

function heroIntro() {
  const number = SplitText.create("[data-hero-number]", { type: "chars", mask: "chars" });
  const balance = document.querySelector<HTMLElement>("[data-balance]");
  const counter = { v: 0 };

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  tl.from(number.chars, { yPercent: 115, duration: 1.1, stagger: 0.06 })
    .from("[data-hero-sub]", { yPercent: 60, autoAlpha: 0, duration: 0.8 }, 0.45)
    .from("[data-hero-fade]", { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.1 }, 0.7)
    // Photo opens like a curtain from the bottom while the image settles.
    .from("[data-hero-photo]", { clipPath: "inset(100% 0% 0% 0% round 48px)", duration: 1.4, ease: "expo.inOut" }, 0.1)
    .from("[data-hero-img]", { scale: 1.35, duration: 1.8, ease: "expo.out" }, 0.3)
    .from("[data-hero-card]", { y: 120, rotate: -20, autoAlpha: 0, duration: 1.1, ease: "back.out(1.4)" }, 0.9)
    .from("[data-hero-toast]", { x: 60, scale: 0.6, autoAlpha: 0, duration: 0.8, ease: "back.out(2)" }, 1.25)
    .from("[data-coin]", { scale: 0, rotate: -90, stagger: 0.08, duration: 0.8, ease: "back.out(2.2)" }, 1.1)
    .to(
      counter,
      {
        v: 100_000,
        duration: 1.6,
        ease: "power2.out",
        onUpdate: () => {
          if (balance) balance.textContent = formatBalance(Math.round(counter.v / 100) * 100);
        },
      },
      1,
    );

  // Content is hidden by CSS until the timeline has applied its start values.
  gsap.set("[data-hero-item]", { visibility: "visible" });
  document.documentElement.classList.remove("motion-pending");

  gsap.utils.toArray<HTMLElement>("[data-coin]").forEach((coin, i) => {
    gsap.to(coin, {
      y: i % 2 ? 14 : -14,
      rotate: i % 2 ? 10 : -10,
      duration: 2.4 + i * 0.35,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 2,
    });
  });

  // Photo drifts slower than the page on scroll.
  gsap.to("[data-hero-img]", {
    yPercent: 12,
    ease: "none",
    scrollTrigger: { trigger: "[data-hero-visual]", start: "top top", end: "bottom top", scrub: true },
  });
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

function marquee() {
  gsap.utils.toArray<HTMLElement>("[data-marquee]").forEach((row) => {
    const track = row.querySelector<HTMLElement>("[data-marquee-track]");
    if (!track) return;
    // Start deep into the repeat so a negative timeScale never hits time 0.
    const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: "none", repeat: -1 }).totalTime(28 * 1000);
    ScrollTrigger.create({
      trigger: row,
      onUpdate: (self) => {
        // Scroll direction steers the ribbon; speed follows scroll velocity.
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 400, 4);
        gsap.to(loop, { timeScale: self.direction * boost, duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: self.direction, duration: 1.2, delay: 0.2 });
      },
    });
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
    stagger: 0.05,
    ease: "power4.out",
    scrollTrigger: { trigger: "[data-price]", start: "top 85%", once: true },
  });
  gsap.to("[data-price-coin]", {
    rotate: 360,
    ease: "none",
    scrollTrigger: { trigger: "#price", start: "top bottom", end: "bottom top", scrub: true },
  });
}

function business() {
  gsap
    .timeline({ scrollTrigger: { trigger: "[data-biz-visual]", start: "top 80%", once: true } })
    .from("[data-biz-photo]", { clipPath: "inset(0% 0% 0% 100% round 40px)", duration: 1.3, ease: "expo.inOut" })
    .from("[data-biz-img]", { scale: 1.3, duration: 1.6, ease: "expo.out" }, 0.2)
    .from("[data-biz-chip]", { scale: 0, rotate: -40, duration: 0.7, ease: "back.out(3)" }, 0.8)
    .from("[data-biz-widget]", { y: 80, autoAlpha: 0, duration: 0.9, ease: "back.out(1.6)" }, 0.9)
    .from("[data-biz-meter]", { width: 0, duration: 0.9, ease: "power3.out" }, 1.3)
    .from("[data-biz-coin]", { scale: 0, duration: 0.8, ease: "back.out(2.4)" }, 1.1);

  gsap.to("[data-biz-coin]", { y: -16, duration: 2.4, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 2.2 });

  gsap.from("[data-model]", {
    y: 120,
    rotate: (i) => (i - 1) * 6,
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

    mm.add({ motion: "(prefers-reduced-motion: no-preference)" }, (ctx) => {
      const { motion } = ctx.conditions as Record<string, boolean>;
      if (!motion) return;

      heroIntro();
      headingReveals();
      calculatorReveal();
      marquee();
      categoryRows();
      price();
      business();
    });
  });

  return null;
}
