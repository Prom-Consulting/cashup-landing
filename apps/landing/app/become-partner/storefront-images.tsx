"use client";

import { useEffect, useState } from "react";
import { controlClass } from "@loal/ui/field";

function Preview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => { const value = URL.createObjectURL(file); setUrl(value); return () => URL.revokeObjectURL(value); }, [file]);
  // Local, temporary preview; uploaded images are normalized by the server.
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="Выбранное изображение" className="h-20 w-20 rounded-xl object-cover" /> : null;
}

function FilePicker({ id, selection, multiple, disabled, onPick }: {
  id: string; selection: string; multiple?: boolean; disabled: boolean; onPick: (files: File[]) => void;
}) {
  return <div className={controlClass(false, `relative flex min-w-0 items-center gap-3 focus-within:border-foreground focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ring ${disabled ? "opacity-60" : "hover:border-foreground/40"}`)}>
    <span aria-hidden="true" className="shrink-0 rounded-lg bg-cream px-3 py-1 text-sm font-medium text-flame-ink">Выбрать</span>
    <span aria-hidden="true" className="min-w-0 truncate text-sm text-muted-foreground">{selection}</span>
    <input id={id} type="file" multiple={multiple} accept="image/png,image/jpeg" disabled={disabled}
      title={selection} aria-describedby="storefront-upload-hint"
      className="absolute inset-0 h-full w-full cursor-pointer rounded-2xl opacity-0 disabled:cursor-not-allowed"
      onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ""; if (files.length) onPick(files); }} />
  </div>;
}

export function StorefrontImages({ logo, photos, onLogo, onPhotos, disabled }: {
  logo: File | null; photos: File[]; onLogo: (file: File | null) => void; onPhotos: (files: File[]) => void; disabled: boolean;
}) {
  const [error, setError] = useState("");
  const valid = (files: File[]) => files.every(file => ["image/png", "image/jpeg"].includes(file.type) && file.size > 0 && file.size <= 5 * 1024 * 1024);
  return <div className="space-y-5">
    <p id="storefront-upload-hint" className="text-sm opacity-75">Логотип и до 10 фотографий. PNG или JPG, до 5 МБ каждый. Загрузим после подтверждения телефона.</p>
    <div className="space-y-2">
      <label className="block font-medium" htmlFor="storefront-logo">Логотип <span className="text-sm font-normal opacity-60">необязательно</span></label>
      <FilePicker id="storefront-logo" selection={logo?.name ?? "Логотип не выбран"} disabled={disabled} onPick={files => {
        const file = files[0];
        if (!valid([file])) return setError("Выберите PNG или JPG до 5 МБ.");
        setError(""); onLogo(file);
      }} />
      {logo && <div className="flex items-center gap-3"><Preview file={logo} /><button type="button" disabled={disabled} onClick={() => onLogo(null)} className="text-sm underline">Убрать логотип</button></div>}
    </div>
    <div className="space-y-2">
      <label className="block font-medium" htmlFor="storefront-photos">Фотографии заведения <span className="text-sm font-normal opacity-60">необязательно</span></label>
      <FilePicker id="storefront-photos" multiple selection={photos.length ? `Выбрано фото: ${photos.length} из 10` : "Фотографии не выбраны"} disabled={disabled || photos.length >= 10} onPick={files => {
        if (!valid(files)) return setError("Выберите PNG или JPG до 5 МБ каждый.");
        if (photos.length + files.length > 10) return setError("Можно добавить не больше 10 фотографий.");
        setError(""); onPhotos([...photos, ...files]);
      }} />
      <div className="flex flex-wrap gap-3">{photos.map((file, index) => <div key={`${file.name}-${index}`} className="space-y-1"><Preview file={file} /><button type="button" disabled={disabled} onClick={() => onPhotos(photos.filter((_, i) => i !== index))} className="text-sm underline">Убрать фото {index + 1}</button></div>)}</div>
    </div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
}
