import { AppleIcon, GoogleIcon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { Button, Icon } from "@loal/ui/shadcn";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useGoogleSaveLink } from "../../entities/card/api";

type Device = "ios" | "mac-safari" | "android" | "desktop";

/**
 * Где открыта страница. Файл .pkpass открывает Wallet только на iPhone/iPad и в
 * Safari на Mac; в Chrome на компьютере он просто скачивается — там вместо кнопки
 * показываем QR, чтобы открыть карту на телефоне.
 */
function detectDevice(): Device {
  if (typeof navigator === "undefined") return "ios";
  const ua = navigator.userAgent;
  const iPadOs = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOs) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(ua)) return "mac-safari";
  return "desktop";
}

function PhoneQr({ url }: { url: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(url, {
      margin: 0,
      width: 360,
      errorCorrectionLevel: "M",
      color: { dark: "#161515", light: "#ffffff" },
    })
      .then(setSrc)
      .catch(() => setSrc(null));
  }, [url]);
  return src ? (
    <img src={src} alt="" className="h-36 w-36 shrink-0 [image-rendering:pixelated]" />
  ) : (
    <span className="h-36 w-36" />
  );
}

/** Добавить карту в Wallet — подходящим для этого устройства способом. */
export function WalletButtons({ serial, appleUrl }: { serial: string; appleUrl: string }) {
  const [device, setDevice] = useState<Device>("ios");
  const google = useGoogleSaveLink(serial);
  useEffect(() => setDevice(detectDevice()), []);
  const googleUrl = google.data?.saveUrl ?? null;
  const pageUrl = typeof window !== "undefined" ? `${window.location.origin}/c/${encodeURIComponent(serial)}` : "";

  return (
    <div className="flex flex-col gap-3">
      {device === "desktop" && (
        <div className="flex items-center gap-5 rounded-[24px] bg-surface p-5">
          <div className="shrink-0 rounded-2xl bg-white p-2">
            <PhoneQr url={pageUrl} />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-lg font-bold">
              <Icon icon={SmartPhone01Icon} />
              Откройте на телефоне
            </p>
            <p className="mt-1 text-base leading-snug text-muted-foreground">
              Наведите камеру iPhone или Android — откроется эта страница, и карта добавится в Wallet.
            </p>
            <a href={appleUrl} className="mt-2 inline-block text-sm text-muted-foreground underline underline-offset-4">
              Скачать файл карты (.pkpass)
            </a>
          </div>
        </div>
      )}

      {(device === "ios" || device === "mac-safari") && (
        <Button asChild variant="secondary" size="lg">
          <a href={appleUrl}>
            <Icon icon={AppleIcon} />
            Добавить в Apple Wallet
          </a>
        </Button>
      )}

      {googleUrl && device !== "ios" && (
        <Button asChild variant="outline" size="lg">
          <a href={googleUrl} target="_blank" rel="noreferrer">
            <Icon icon={GoogleIcon} />
            Добавить в Google Wallet
          </a>
        </Button>
      )}

      {device === "android" && !googleUrl && !google.isPending && (
        <p className="rounded-2xl bg-surface px-4 py-3 text-base text-muted-foreground">
          Google Wallet для карты Loal ещё не подключён. Покажите QR с этой страницы на кассе — этого достаточно.
        </p>
      )}
    </div>
  );
}
