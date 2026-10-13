"use client";

import type { PublicPartner } from "@loal/api";
import { useEffect, useRef, useState } from "react";

/**
 * Фото заведения: обложка и лента миниатюр. Нажатие открывает фото в модалке поверх страницы
 * (не на весь экран), стрелками и клавишами ← → листаются остальные. Картинки остаются в HTML,
 * так что поисковик видит их и без скрипта.
 */
export function PartnerGallery({ partner }: { partner: PublicPartner }) {
  const photos = partner.photos;
  const dialog = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<number | null>(null);

  const open = (index: number) => {
    setCurrent(index);
    dialog.current?.showModal();
  };
  const step = (delta: number) =>
    setCurrent((index) => (index === null ? index : (index + delta + photos.length) % photos.length));

  useEffect(() => {
    if (current === null) return;
    // Страница под модалкой не прокручивается
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [current]);

  const many = photos.length > 1;

  return (
    <>
      <button
        type="button"
        onClick={() => open(0)}
        aria-label={`Открыть фото ${partner.name}`}
        className="block cursor-zoom-in overflow-hidden rounded-[28px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[0]}
          alt={`${partner.name} — фото`}
          decoding="async"
          className="aspect-[16/10] w-full object-cover"
        />
      </button>

      {many && (
        <ul className="no-scrollbar flex gap-3 overflow-x-auto">
          {photos.slice(1).map((photo, index) => (
            <li key={photo} className="shrink-0">
              <button
                type="button"
                onClick={() => open(index + 1)}
                aria-label={`Открыть фото ${index + 2}`}
                className="block cursor-zoom-in rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={`${partner.name}, фото ${index + 2}`}
                  loading="lazy"
                  className="h-28 w-40 rounded-2xl object-cover sm:h-32 sm:w-48"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialog}
        aria-label={`Фото ${partner.name}`}
        onClose={() => setCurrent(null)}
        // Клик по затемнению (мимо окна) закрывает
        onClick={(event) => event.target === event.currentTarget && dialog.current?.close()}
        onKeyDown={(event) => {
          if (!many) return;
          if (event.key === "ArrowRight") step(1);
          if (event.key === "ArrowLeft") step(-1);
        }}
        className="m-auto w-[min(92vw,960px)] overflow-visible bg-transparent p-0 backdrop:bg-graphite/70 backdrop:backdrop-blur-sm"
      >
        {current !== null && (
          <figure className="relative flex flex-col gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[current]}
              alt={`${partner.name}, фото ${current + 1}`}
              className="aspect-[4/3] max-h-[78vh] w-full rounded-[24px] bg-graphite/40 object-contain"
            />
            <figcaption className="flex items-center justify-between gap-3 text-base text-paper">
              <span>
                {partner.name}
                {many && <span className="text-paper/70"> — {current + 1} из {photos.length}</span>}
              </span>
            </figcaption>

            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Закрыть"
              autoFocus
              className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-paper/90 text-xl text-graphite shadow transition-colors hover:bg-paper"
            >
              ×
            </button>
            {many && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Предыдущее фото"
                  className="absolute top-[calc(50%-1.5rem)] left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-2xl text-graphite shadow transition-colors hover:bg-paper"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Следующее фото"
                  className="absolute top-[calc(50%-1.5rem)] right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-2xl text-graphite shadow transition-colors hover:bg-paper"
                >
                  ›
                </button>
              </>
            )}
          </figure>
        )}
      </dialog>
    </>
  );
}
