import { z } from "zod";
import { ApiError, type ApiClient } from "./http";

/** Видео витрины: MP4 до 60 МБ, не больше трёх. Сервер проверяет сам файл, а не расширение. */
export const STOREFRONT_VIDEO_MAX_BYTES = 60 * 1024 * 1024;
export const STOREFRONT_VIDEO_MAX = 3;
export const STOREFRONT_VIDEO_ACCEPT = "video/mp4,.mp4,.m4v";

/** Подсказка выбора файла; MOV с iPhone сервер отклонит с объяснением. */
export function isStorefrontVideo(file: Pick<File, "name" | "type">): boolean {
  return file.type === "video/mp4" || /\.(mp4|m4v)$/i.test(file.name);
}

const uploadedVideoSchema = z.looseObject({ url: z.string() });

/**
 * Загрузка видео с прогрессом (`onProgress` — доля 0…1). Обычный fetch прогресс отправки не
 * отдаёт, поэтому здесь XHR. Истёк access-токен — один обычный запрос через клиент обновит
 * пару, и загрузка повторится.
 */
export function uploadStorefrontVideo(
  api: ApiClient,
  merchantId: string,
  file: File,
  onProgress?: (share: number) => void,
  signal?: AbortSignal,
): Promise<{ url: string }> {
  const url = new URL(`admin/v1/merchants/${encodeURIComponent(merchantId)}/profile-videos`, api.baseUrl.endsWith("/") ? api.baseUrl : `${api.baseUrl}/`);
  const send = () =>
    new Promise<{ status: number; body: unknown }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url.toString());
      const token = api.tokens.read();
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress?.(event.loaded / event.total);
      };
      xhr.onload = () => {
        let body: unknown = null;
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          body = null;
        }
        resolve({ status: xhr.status, body });
      };
      xhr.onerror = () => reject(new ApiError(0, "Нет связи с сервером — проверьте интернет и попробуйте снова"));
      xhr.onabort = () => reject(new DOMException("Загрузка отменена", "AbortError"));
      signal?.addEventListener("abort", () => xhr.abort(), { once: true });
      const body = new FormData();
      body.append("file", file);
      xhr.send(body);
    });

  return (async () => {
    let result = await send();
    if (result.status === 401) {
      // Обычный запрос сам обновит токены (общий refresh клиента) — потом повторяем
      await api.request(z.unknown(), "/auth/me/profile").catch(() => undefined);
      onProgress?.(0);
      result = await send();
    }
    if (result.status >= 200 && result.status < 300) return uploadedVideoSchema.parse(result.body);
    const payload = result.body as { message?: unknown } | null;
    const message =
      result.status === 413
        ? "Видео больше 60 МБ — сократите или сожмите его"
        : typeof payload?.message === "string"
          ? payload.message
          : "Не удалось загрузить видео";
    throw new ApiError(result.status, message, result.body);
  })();
}
