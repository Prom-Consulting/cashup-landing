"use client";

import type { PublicPartner } from "@loal/api";
import { useEffect, useRef, useState } from "react";

type Media = { kind: "photo"; src: string } | { kind: "video"; src: string; poster: string | null };

/** Сначала видео — оно живее любой фотографии, потом фото. */
function mediaOf(partner: PublicPartner): Media[] {
  return [
    ...(partner.videos ?? []).map((video): Media => ({ kind: "video", src: video.url, poster: video.posterUrl })),
    ...partner.photos.map((src): Media => ({ kind: "photo", src })),
  ];
}

function PlayBadge({ large = false }: { large?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute grid place-items-center rounded-full bg-paper/90 text-graphite shadow-lg ${
        large ? "top-1/2 left-1/2 size-16 -translate-1/2" : "bottom-2 left-2 size-9"
      }`}
    >
      <svg viewBox="0 0 24 24" className={large ? "ml-1 size-6" : "ml-0.5 size-4"} fill="currentColor">
        <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
      </svg>
    </span>
  );
}

/** Обложка уже играет без звука — значок «play» врал бы, что она на паузе. Зовём смотреть со звуком. */
function SoundHint() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-graphite/60 py-1.5 pr-3 pl-2.5 text-xs sm:bottom-4 sm:left-4 sm:gap-2 sm:py-2 sm:pr-4 sm:pl-3 sm:text-sm font-semibold text-paper backdrop-blur-md"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
        <path d="m16 9 5 6M21 9l-5 6" />
      </svg>
      Смотреть со звуком
    </span>
  );
}

/**
 * Тихий ролик на обложке: горизонтальный блок, ролик увеличен по центру и заполняет его (вертикальный
 * тоже), целиком — по нажатию, в окне просмотра. React не пишет `muted` в HTML страницы, и Safari без него не
 * запускает видео сам — ставим свойство и запускаем вручную.
 */
function CoverVideo({ src, poster, autoPlay }: { src: string; poster: string | null; autoPlay: boolean }) {
  return (
    <video
      ref={(video) => {
        if (!video) return;
        video.muted = true;
        if (autoPlay && video.paused) void video.play().catch(() => undefined);
      }}
      // Без обложки браузер рисует пустой прямоугольник — #t просит показать кадр
      src={poster ? src : `${src}#t=0.1`}
      poster={poster ?? undefined}
      muted
      loop
      playsInline
      autoPlay={autoPlay}
      preload={autoPlay ? "auto" : "metadata"}
      className="block aspect-[16/10] w-full object-cover object-center"
    />
  );
}

/**
 * Фото и видео заведения: обложка горизонтальным блоком и лента миниатюр. Видео на обложке тихо играет по кругу (если
 * человек не просил «меньше движения»), по нажатию всё открывается в модалке поверх страницы —
 * видео со звуком и управлением, листание стрелками и клавишами ← →. Фото и видео остаются в HTML.
 */
export function PartnerGallery({ partner }: { partner: PublicPartner }) {
  const media = mediaOf(partner);
  const dialog = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const [calm, setCalm] = useState(false);

  useEffect(() => setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);

  const open = (index: number) => {
    setCurrent(index);
    dialog.current?.showModal();
  };
  const step = (delta: number) =>
    setCurrent((index) => (index === null ? index : (index + delta + media.length) % media.length));

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

  if (media.length === 0) return null;
  const cover = media[0]!;
  const many = media.length > 1;
  const shown = current === null ? null : media[current];

  return (
    <>
      <button
        type="button"
        onClick={() => open(0)}
        aria-label={cover.kind === "video" ? `Смотреть видео ${partner.name}` : `Открыть фото ${partner.name}`}
        className="relative block w-full cursor-zoom-in overflow-hidden rounded-[28px] bg-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame"
      >
        {cover.kind === "video" ? (
          <>
            <CoverVideo src={cover.src} poster={cover.poster} autoPlay={!calm} />
            {calm ? <PlayBadge large /> : <SoundHint />}
          </>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.src} alt={`${partner.name} — фото`} decoding="async" className="block aspect-[16/10] w-full object-cover object-center" />
        )}
      </button>

      {many && (
        <ul className="no-scrollbar flex gap-3 overflow-x-auto">
          {media.slice(1).map((item, index) => (
            <li key={item.src} className="shrink-0">
              <button
                type="button"
                onClick={() => open(index + 1)}
                aria-label={item.kind === "video" ? `Смотреть видео ${index + 2}` : `Открыть фото ${index + 2}`}
                className="relative block cursor-zoom-in overflow-hidden rounded-2xl bg-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame"
              >
                {item.kind === "video" ? (
                  <>
                    {item.poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.poster} alt="" loading="lazy" className="h-28 w-40 object-cover sm:h-32 sm:w-48" />
                    ) : (
                      <video src={`${item.src}#t=0.5`} muted playsInline preload="metadata" className="h-28 w-40 object-cover sm:h-32 sm:w-48" />
                    )}
                    <PlayBadge />
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.src}
                    alt={`${partner.name}, фото ${index + 2}`}
                    loading="lazy"
                    className="h-28 w-40 object-cover sm:h-32 sm:w-48"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialog}
        aria-label={`Фото и видео ${partner.name}`}
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
        {shown && current !== null && (
          <figure className="relative flex flex-col gap-3">
            {shown.kind === "video" ? (
              <video
                key={shown.src}
                src={shown.src}
                poster={shown.poster ?? undefined}
                controls
                playsInline
                // Со звуком, раз человек сам открыл; браузер не разрешил — пусть играет без звука
                ref={(video) => {
                  if (!video || !video.paused) return;
                  void video.play().catch(() => {
                    video.muted = true;
                    void video.play().catch(() => undefined);
                  });
                }}
                // Своя форма ролика: вертикальный открывается вертикальным, по центру
                className="max-h-[80vh] w-auto max-w-full self-center rounded-[24px] bg-graphite"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shown.src}
                alt={`${partner.name}, фото ${current + 1}`}
                className="aspect-[4/3] max-h-[78vh] w-full rounded-[24px] bg-graphite/40 object-contain"
              />
            )}
            <figcaption className="flex items-center justify-between gap-3 text-base text-paper">
              <span>
                {partner.name}
                {many && <span className="text-paper/70"> — {current + 1} из {media.length}</span>}
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
                  aria-label="Предыдущее"
                  className="absolute top-[calc(50%-1.5rem)] left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-2xl text-graphite shadow transition-colors hover:bg-paper"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Следующее"
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
