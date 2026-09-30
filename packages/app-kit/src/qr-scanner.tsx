import { QrCode01Icon } from "@hugeicons/core-free-icons";
import { Button, Dialog, DialogContent, Icon } from "@loal/ui/shadcn";
import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";

type Detector = { detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]> };
declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => Detector;
  }
}

/** В QR карты — номер карты. Если в коде ссылка на карту, берём номер из её конца. */
function cardNumberFrom(text: string) {
  const value = text.trim();
  if (!/^https?:\/\//i.test(value)) return value;
  try {
    const parts = new URL(value).pathname.split("/").filter(Boolean);
    return decodeURIComponent(parts[parts.length - 1] ?? value);
  } catch {
    return value;
  }
}

function cameraErrorText(error: unknown) {
  const name = (error as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Нет доступа к камере. Разрешите его для этого сайта в настройках браузера и попробуйте снова.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "Камера не найдена. Введите номер карты вручную — он написан под QR-кодом.";
  if (name === "NotReadableError") return "Камера занята другим приложением. Закройте его и попробуйте снова.";
  return "Не удалось включить камеру. Введите номер карты вручную.";
}

/**
 * Камера читает QR с карты клиента — в Wallet или в его кабинете. Встроенный
 * распознаватель браузера (Chrome, Android), а где его нет, как в Safari, — jsQR.
 */
function Scanner({ onResult }: { onResult: (text: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const done = useRef(onResult);
  done.current = onResult;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const detector = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ["qr_code"] }) : null;

    const read = async (): Promise<string | null> => {
      const element = video.current;
      if (!element || element.readyState < 2) return null;
      if (detector) {
        const [code] = await detector.detect(element);
        return code?.rawValue ?? null;
      }
      if (!context) return null;
      // Уменьшаем кадр: jsQR быстрее, а QR на экране телефона крупный
      const scale = Math.min(1, 640 / element.videoWidth);
      canvas.width = Math.round(element.videoWidth * scale);
      canvas.height = Math.round(element.videoHeight * scale);
      context.drawImage(element, 0, 0, canvas.width, canvas.height);
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      return jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
    };

    const loop = async () => {
      if (stopped) return;
      try {
        const text = await read();
        if (text && !stopped) {
          stopped = true;
          navigator.vibrate?.(60);
          return done.current(text);
        }
      } catch {
        // Кадр не прочитался — пробуем следующий
      }
      frame = requestAnimationFrame(loop);
    };

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Этот браузер не даёт доступа к камере. Откройте кабинет в Chrome или Safari по https.");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then(async (media) => {
        if (stopped) return media.getTracks().forEach((track) => track.stop());
        stream = media;
        if (!video.current) return;
        video.current.srcObject = media;
        await video.current.play().catch(() => undefined);
        frame = requestAnimationFrame(loop);
      })
      .catch((cause) => setError(cameraErrorText(cause)));

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  if (error)
    return (
      <p role="alert" className="rounded-2xl bg-muted p-4 text-base">
        {error}
      </p>
    );

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-[24px] bg-graphite">
      <video ref={video} playsInline muted className="h-full w-full object-cover" />
      {/* Рамка прицела: куда поднести QR */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[18%] rounded-[20px] border-4 border-white/90 shadow-[0_0_0_999px_rgb(22_21_21/0.45)]"
      />
      <p className="absolute inset-x-0 bottom-4 text-center text-base font-medium text-white">
        Наведите на QR-код карты клиента
      </p>
    </div>
  );
}

/** Кнопка «Сканировать QR»: камера открывается в окне, номер карты уходит в поле. */
export function QrScanButton({ onScan }: { onScan: (cardNumber: string) => void }) {
  const [open, setOpen] = useState(false);
  const scanned = useRef(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (value) scanned.current = false;
        setOpen(value);
      }}
    >
      <Button
        type="button"
        variant="outline"
        className="h-auto shrink-0"
        onClick={() => {
          scanned.current = false;
          setOpen(true);
        }}
      >
        <Icon icon={QrCode01Icon} />
        Сканировать QR
      </Button>
      <DialogContent
        title="Сканировать карту"
        description="Камера закроется сама, как только прочитает код."
        // После сканирования фокус ставит форма (в «Товар»), а не возвращается на кнопку
        onCloseAutoFocus={(event) => scanned.current && event.preventDefault()}
      >
        {open && (
          <div className="mt-5">
            <Scanner
              onResult={(text) => {
                scanned.current = true;
                setOpen(false);
                onScan(cardNumberFrom(text));
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
