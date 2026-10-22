"use client";

import { useEffect, useState } from "react";

const pad = (value: number) => String(value).padStart(2, "0");

function left(until: number) {
  const total = Math.max(0, Math.floor((until - Date.now()) / 1000));
  return {
    total,
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function plural(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/**
 * Сколько ещё действует акционная цена — тикает каждую секунду. До загрузки скрипта (и для
 * поисковиков) — просто дата; срок вышел — таймер исчезает.
 */
export function PriceCountdown({ until, label, className = "" }: { until: string; label: string; className?: string }) {
  const deadline = new Date(until).getTime();
  const [time, setTime] = useState<ReturnType<typeof left> | null>(null);

  useEffect(() => {
    setTime(left(deadline));
    const timer = window.setInterval(() => setTime(left(deadline)), 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  const date = new Date(until).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bishkek" });
  if (time && time.total === 0) return null;

  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}>
      <span className="font-medium">{label}</span>
      {time ? (
        // Экранный диктор прочтёт дату, а не тиканье каждую секунду
        <>
          <span className="sr-only">до {date}</span>
          <span aria-hidden="true" className="inline-flex items-baseline gap-1 font-bold tabular-nums">
            {time.days > 0 && (
              <span>
                {time.days} {plural(time.days, "день", "дня", "дней")}
              </span>
            )}
            <span className="rounded-lg bg-graphite px-2 py-0.5 text-paper">
              {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
            </span>
          </span>
        </>
      ) : (
        <span className="font-bold">до {date}</span>
      )}
    </p>
  );
}
