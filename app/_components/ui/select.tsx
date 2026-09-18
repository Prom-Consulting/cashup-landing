"use client";

import { useEffect, useId, useRef, useState } from "react";
import { controlClass } from "./field";

export type SelectOption = { id: string; label: string };

/**
 * Свой выпадающий список вместо системного: кнопка + список (role="listbox").
 * Клавиатура: стрелки, Home/End, Enter/Пробел — выбрать, Esc — закрыть, буквы — быстрый поиск.
 */
export function Select({
  id,
  describedBy,
  invalid,
  value,
  onChange,
  onBlur,
  options,
  placeholder = "Выберите",
}: {
  id: string;
  describedBy?: string;
  invalid: boolean;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, options.findIndex((o) => o.id === value)));
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ query: "", at: 0 });
  // Зеркала состояния: несколько нажатий подряд не должны читать устаревшие значения.
  const openRef = useRef(open);
  const activeRef = useRef(active);
  openRef.current = open;
  activeRef.current = active;
  const setOpenSafe = (v: boolean) => {
    openRef.current = v;
    setOpen(v);
  };
  const setActiveSafe = (updater: (i: number) => number) => {
    activeRef.current = updater(activeRef.current);
    setActive(activeRef.current);
  };

  const selected = options.find((o) => o.id === value) ?? null;

  // Закрытие по клику мимо и по уходу фокуса из компонента.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        setOpenSafe(false);
        onBlur?.();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, onBlur]);

  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.id);
    setOpenSafe(false);
    button.current?.focus();
    onBlur?.();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = (delta: number) => {
      e.preventDefault();
      if (!openRef.current) {
        setOpenSafe(true);
        return;
      }
      setActiveSafe((i) => (i + delta + options.length) % options.length);
    };

    switch (e.key) {
      case "ArrowDown":
        return step(1);
      case "ArrowUp":
        return step(-1);
      case "Home":
        e.preventDefault();
        return setActiveSafe(() => 0);
      case "End":
        e.preventDefault();
        return setActiveSafe(() => options.length - 1);
      case "Enter":
      case " ":
        e.preventDefault();
        return openRef.current ? choose(activeRef.current) : setOpenSafe(true);
      case "Escape":
        if (openRef.current) {
          e.preventDefault();
          setOpenSafe(false);
        }
        return;
      case "Tab":
        if (openRef.current) setOpenSafe(false);
        return;
      default:
        if (e.key.length === 1) {
          const now = Date.now();
          typed.current.query = now - typed.current.at > 900 ? e.key : typed.current.query + e.key;
          typed.current.at = now;
          const found = options.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.query.toLowerCase()));
          if (found >= 0) {
            setActiveSafe(() => found);
            if (!openRef.current) onChange(options[found].id);
          }
        }
    }
  };

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        id={id}
        role="combobox"
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        onClick={() => setOpenSafe(!openRef.current)}
        onKeyDown={onKeyDown}
        onBlur={() => !openRef.current && onBlur?.()}
        className={controlClass(invalid, "flex items-center justify-between gap-3 text-left")}
      >
        <span className={selected ? "" : "opacity-55"}>{selected?.label ?? placeholder}</span>
        <svg
          viewBox="0 0 20 20"
          className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="m5 8 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-activedescendant={`${listId}-${active}`}
          tabIndex={-1}
          className="absolute top-[calc(100%+6px)] right-0 left-0 z-30 max-h-64 overflow-auto rounded-2xl border-2 border-graphite bg-paper p-1.5"
        >
          {options.map((o, i) => {
            const isSelected = o.id === value;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  data-active={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left transition-colors ${
                    i === active ? "bg-cream" : ""
                  } ${isSelected ? "font-bold" : ""}`}
                >
                  {o.label}
                  {isSelected && (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-flame" aria-hidden="true">
                      <path
                        d="m5 12.5 4.5 4.5L19 7.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
