"use client";

import { useId, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type Item = { q: string; a: string };

function FaqItem({ item, open, onToggle }: { item: Item; open: boolean; onToggle: () => void }) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const icon = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const d = first.current || reduce ? 0 : 1;
      first.current = false;

      gsap.to(panel.current, {
        height: open ? "auto" : 0,
        duration: 0.55 * d,
        ease: open ? "power3.out" : "power3.inOut",
        overwrite: true,
      });
      gsap.to(panel.current!.firstElementChild, {
        y: open ? 0 : -16,
        autoAlpha: open ? 1 : 0,
        duration: 0.45 * d,
        delay: open ? 0.1 * d : 0,
        ease: "power2.out",
        overwrite: true,
      });
      gsap.to(icon.current, {
        rotate: open ? 135 : 0,
        backgroundColor: open ? "#ff3300" : "#edf2f4",
        color: open ? "#ffffff" : "#090809",
        duration: 0.5 * d,
        ease: "back.out(2)",
        overwrite: true,
      });
    },
    { dependencies: [open], revertOnUpdate: false },
  );

  return (
    <div className="border-b border-slate-soft/20">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="group flex w-full items-center justify-between gap-6 py-7 text-left text-xl font-medium sm:py-[28px] sm:text-2xl"
        >
          <span className="transition-colors group-hover:text-flame">{item.q}</span>
          <span
            ref={icon}
            aria-hidden="true"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-cream transition-[scale] group-hover:scale-110 group-active:scale-95 sm:h-16 sm:w-16"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7">
              <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          </span>
        </button>
      </h3>
      <div
        ref={panel}
        id={`${id}-panel`}
        role="region"
        className={`overflow-hidden ${open ? "" : "h-0"}`}
        inert={!open}
      >
        <p className={`max-w-[556px] pb-8 text-lg leading-[1.6] sm:pr-20 ${open ? "" : "invisible opacity-0"}`}>
          {item.a}
        </p>
      </div>
    </div>
  );
}

export function Faq({ items }: { items: Item[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div>
      {items.map((item, i) => (
        <FaqItem
          key={item.q}
          item={item}
          open={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </div>
  );
}
