import { Delete02Icon, PlayIcon, Video01Icon } from "@hugeicons/core-free-icons";
import {
  ApiError,
  STOREFRONT_VIDEO_ACCEPT,
  STOREFRONT_VIDEO_MAX,
  STOREFRONT_VIDEO_MAX_BYTES,
  isStorefrontVideo,
  merchantCabinetApi,
  uploadStorefrontVideo,
  type MerchantVideo,
} from "@loal/api";
import { Button, Dialog, DialogContent, Icon } from "@loal/ui/shadcn";
import { useRef, useState } from "react";
import { useApi } from "./session";

const megabytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} МБ`;

/** Ждём событие медиа с потолком по времени: битый или неподдерживаемый файл не должен вешать форму. */
function once(target: HTMLVideoElement, event: string, ms = 8000) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("timeout")), ms);
    target.addEventListener(event, () => (window.clearTimeout(timer), resolve()), { once: true });
    target.addEventListener("error", () => (window.clearTimeout(timer), reject(new Error("decode"))), { once: true });
  });
}

/**
 * Кадр-обложка прямо из файла: браузер открывает видео, перематывает на треть секунды (или на
 * треть ролика, если он короче) и рисует кадр в JPEG. null — браузер это видео не раскрыл: скорее
 * всего, кодек HEVC, и у части клиентов оно не заиграет.
 */
async function posterFrom(file: File): Promise<File | null> {
  const source = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = source;
  try {
    await once(video, "loadeddata");
    video.currentTime = Math.min(1, (video.duration || 3) / 3);
    await once(video, "seeked");
    const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context || canvas.width === 0) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    return blob ? new File([blob], "poster.jpg", { type: "image/jpeg" }) : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(source);
    video.removeAttribute("src");
  }
}

type Pending = { name: string; preview: string | null; progress: number; stage: "poster" | "upload" };

/**
 * Видео витрины (MP4 до 60 МБ, до трёх): грузится сразу при выборе — с прогрессом — и попадает
 * в профиль при «Сохранить витрину», как фото. Файл лежит на CDN как есть, без перекодирования.
 */
export function StorefrontVideos({
  merchantId,
  videos,
  onChange,
  onBusyChange,
  disabled,
}: {
  merchantId: string;
  videos: MerchantVideo[];
  /** Принимает функцию от текущего списка: обложка приходит позже видео, и список мог измениться. */
  onChange: (next: (current: MerchantVideo[]) => MerchantVideo[]) => void;
  /** Пока видео грузится, сохранять витрину нельзя — иначе она уйдёт без него. */
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
}) {
  const api = useApi();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [watching, setWatching] = useState<MerchantVideo | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setWarning(null);
    if (!isStorefrontVideo(file)) return setError("Нужен видеофайл MP4. Видео с iPhone (MOV) сохраните как «Самый совместимый» формат.");
    if (file.size > STOREFRONT_VIDEO_MAX_BYTES)
      return setError(`Видео ${megabytes(file.size)} — больше ${megabytes(STOREFRONT_VIDEO_MAX_BYTES)}. Сократите или сожмите его.`);

    setPending({ name: file.name, preview: null, progress: 0, stage: "poster" });
    onBusyChange?.(true);
    let preview: string | null = null;
    try {
      const poster = await posterFrom(file);
      preview = poster ? URL.createObjectURL(poster) : null;
      if (!poster)
        setWarning("Браузер не смог открыть это видео — у части клиентов оно может не заиграть. Лучше всего MP4 с кодеком H.264.");
      setPending({ name: file.name, preview, progress: 0, stage: "upload" });
      const posterUpload = poster ? merchantCabinetApi(api).uploadAsset(merchantId, "merchantPhoto", poster).catch(() => null) : null;
      const video = await uploadStorefrontVideo(api, merchantId, file, (share) =>
        setPending((current) => (current ? { ...current, progress: share } : current)),
      );
      // Видео — в витрину сразу; обложка (грузится параллельно) допишется, когда придёт
      onChange((current) => [...current, { url: video.url, posterUrl: null }].slice(0, STOREFRONT_VIDEO_MAX));
      const posterAsset = await posterUpload;
      if (posterAsset)
        onChange((current) => current.map((item) => (item.url === video.url ? { ...item, posterUrl: posterAsset.url } : item)));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Не удалось загрузить видео. Попробуйте ещё раз.");
    } finally {
      if (preview) URL.revokeObjectURL(preview);
      setPending(null);
      onBusyChange?.(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <span className="text-base font-medium">Видео</span>
      <p className="mt-1 text-base text-muted-foreground">
        До {STOREFRONT_VIDEO_MAX} роликов MP4, каждый до {megabytes(STOREFRONT_VIDEO_MAX_BYTES)}. Лучше короткие — до минуты, со
        звуком или без: в каталоге видео играет без звука, пока клиент сам не включит.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {videos.map((video, index) => (
          <div key={video.url} className="group relative">
            <button
              type="button"
              onClick={() => setWatching(video)}
              aria-label={`Посмотреть видео ${index + 1}`}
              className="absolute inset-0 z-10 cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
            <video
              // Без обложки браузер показывает чёрный прямоугольник — #t просит нарисовать кадр
              src={video.posterUrl ? video.url : `${video.url}#t=0.5`}
              poster={video.posterUrl ?? undefined}
              muted
              loop
              playsInline
              preload="metadata"
              className="h-24 w-40 rounded-2xl border-2 border-border bg-graphite object-cover"
            />
            <span className="pointer-events-none absolute bottom-1.5 left-1.5 grid size-7 place-items-center rounded-full bg-graphite/80 text-white transition-opacity group-hover:opacity-0">
              <Icon icon={PlayIcon} size={14} />
            </span>
            <button
              type="button"
              disabled={disabled || Boolean(pending)}
              onClick={() => onChange((current) => current.filter((item) => item.url !== video.url))}
              className="absolute -top-2 -right-2 z-20 grid h-8 w-8 place-items-center rounded-full bg-surface shadow-md"
              aria-label={`Убрать видео ${index + 1}`}
            >
              <Icon icon={Delete02Icon} size={16} />
            </button>
          </div>
        ))}

        {pending && (
          <div className="relative h-24 w-40 overflow-hidden rounded-2xl border-2 border-border bg-graphite text-white" role="status">
            {pending.preview && <img src={pending.preview} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />}
            <span className="relative flex h-full flex-col justify-end gap-1.5 p-2.5">
              <span className="text-sm font-semibold">
                {pending.stage === "poster" ? "Готовим…" : `Загружаем ${Math.round(pending.progress * 100)}%`}
              </span>
              <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-white/25">
                <span className="block h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.max(4, pending.progress * 100)}%` }} />
              </span>
            </span>
          </div>
        )}

        <input
          ref={input}
          type="file"
          accept={STOREFRONT_VIDEO_ACCEPT}
          hidden
          onChange={(event) => void pick(event.target.files?.[0])}
        />
        {videos.length < STOREFRONT_VIDEO_MAX && !pending && (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => input.current?.click()}
            className="h-24 w-40 flex-col gap-1.5 rounded-2xl border-dashed"
          >
            <Icon icon={Video01Icon} />
            Добавить видео
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-base text-destructive">
          {error}
        </p>
      )}
      {warning && !error && <p className="mt-2 text-base text-muted-foreground">{warning}</p>}
      {videos.length > 0 && !pending && (
        <p className="mt-2 text-sm text-muted-foreground">
          Нажмите на видео, чтобы посмотреть. В каталоге оно появится после «Сохранить витрину».
        </p>
      )}

      <Dialog open={watching !== null} onOpenChange={(open) => !open && setWatching(null)}>
        <DialogContent title="Видео витрины" className="w-[min(860px,calc(100vw-2rem))]">
          {watching && (
            <video
              key={watching.url}
              src={watching.url}
              poster={watching.posterUrl ?? undefined}
              controls
              autoPlay
              playsInline
              className="mt-4 max-h-[70vh] w-full rounded-2xl bg-graphite"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
