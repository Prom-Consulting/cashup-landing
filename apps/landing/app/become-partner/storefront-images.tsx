"use client";

import { useEffect, useId, useRef, useState, type DragEvent, type ReactNode } from "react";

const TYPES = ["image/png", "image/jpeg"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 10;

function usePreview(file: File) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const value = URL.createObjectURL(file);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [file]);
  return url;
}

function Thumb({ file, className }: { file: File; className: string }) {
  const url = usePreview(file);
  // Локальное превью до загрузки; на сервере картинки нормализуются
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="" className={className} /> : <span className={`${className} bg-smoke`} />;
}

function RemoveButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="absolute -top-2 -right-2 grid h-8 w-8 place-items-center rounded-full bg-graphite text-paper shadow-md transition-transform hover:scale-105 disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/**
 * Зона выбора файлов: клик открывает выбор, файлы можно перетащить. Подсвечивается, когда
 * над ней тащат картинку, — понятно, куда бросать.
 */
function DropZone({
  id,
  multiple,
  disabled,
  onFiles,
  className,
  children,
}: {
  id: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  className: string;
  children: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const drop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    if (disabled) return;
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };
  return (
    <label
      htmlFor={id}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
      className={`${className} cursor-pointer border-2 border-dashed transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-flame ${
        over ? "border-flame bg-flame/5" : "border-smoke bg-cream/60 hover:border-graphite/40"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <input
        ref={input}
        id={id}
        type="file"
        accept={TYPES.join(",")}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
      {children}
    </label>
  );
}

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

/**
 * Логотип и фотографии витрины: крупные зоны загрузки с превью. Логотип — круг, как в каталоге;
 * первое фото — обложка карточки. PNG или JPG до 5 МБ, загрузка после подтверждения телефона.
 */
export function StorefrontImages({
  logo,
  photos,
  onLogo,
  onPhotos,
  disabled,
}: {
  logo: File | null;
  photos: File[];
  onLogo: (file: File | null) => void;
  onPhotos: (files: File[]) => void;
  disabled: boolean;
}) {
  const [error, setError] = useState("");
  const logoId = useId();
  const photosId = useId();
  const invalid = (files: File[]) =>
    files.find((file) => !TYPES.includes(file.type) || file.size === 0 || file.size > MAX_BYTES);

  const addLogo = (files: File[]) => {
    const bad = invalid(files);
    if (bad) return setError(`«${bad.name}»: нужен PNG или JPG до 5 МБ.`);
    setError("");
    onLogo(files[0]!);
  };
  const addPhotos = (files: File[]) => {
    const bad = invalid(files);
    if (bad) return setError(`«${bad.name}»: нужен PNG или JPG до 5 МБ.`);
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) setError(`Можно не больше ${MAX_PHOTOS} фотографий — добавили первые ${room}.`);
    else setError("");
    onPhotos([...photos, ...files.slice(0, Math.max(0, room))]);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
        <div className="space-y-2">
          <p className="font-medium">
            Логотип <span className="text-sm font-normal opacity-60">необязательно</span>
          </p>
          {logo ? (
            <div className="relative h-32 w-32">
              <Thumb file={logo} className="h-32 w-32 rounded-full border-4 border-paper object-cover shadow-[0_0_0_2px_var(--flame)]" />
              <RemoveButton label="Убрать логотип" onClick={() => onLogo(null)} disabled={disabled} />
            </div>
          ) : (
            <DropZone id={logoId} disabled={disabled} onFiles={addLogo} className="grid h-32 w-32 place-items-center rounded-full text-center">
              <span className="flex flex-col items-center gap-1 px-3 text-sm font-medium">
                <PlusIcon />
                Логотип
              </span>
            </DropZone>
          )}
          <p className="max-w-[16ch] text-xs opacity-60">В каталоге — в круге</p>
        </div>

        <div className="min-w-0 space-y-2">
          <p className="flex items-baseline justify-between gap-3 font-medium">
            <span>
              Фотографии <span className="text-sm font-normal opacity-60">необязательно</span>
            </span>
            <span className="text-sm font-normal tabular-nums opacity-60">
              {photos.length} / {MAX_PHOTOS}
            </span>
          </p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {photos.map((file, index) => (
              <li key={`${file.name}-${file.size}-${index}`} className="relative aspect-square">
                <Thumb file={file} className="h-full w-full rounded-2xl object-cover" />
                {index === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-graphite/85 px-2 py-0.5 text-[11px] font-bold text-paper">
                    Обложка
                  </span>
                )}
                <RemoveButton label={`Убрать фото ${index + 1}`} onClick={() => onPhotos(photos.filter((_, i) => i !== index))} disabled={disabled} />
              </li>
            ))}
            {photos.length < MAX_PHOTOS && (
              <li className="aspect-square">
                <DropZone
                  id={photosId}
                  multiple
                  disabled={disabled}
                  onFiles={addPhotos}
                  className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl text-center"
                >
                  <PlusIcon />
                  <span className="px-2 text-xs font-medium sm:text-sm">{photos.length ? "Ещё фото" : "Добавить фото"}</span>
                </DropZone>
              </li>
            )}
          </ul>
          <p className="text-xs opacity-60">Зал, витрина, товары. Можно перетащить сюда сразу несколько. Первое фото — обложка.</p>
        </div>
      </div>

      <p className="rounded-2xl bg-cream px-4 py-3 text-sm">
        PNG или JPG, до 5 МБ каждый. Картинки загрузятся после подтверждения телефона.
      </p>
      {error && (
        <p role="alert" className="text-sm font-medium text-flame-ink">
          {error}
        </p>
      )}
    </div>
  );
}
