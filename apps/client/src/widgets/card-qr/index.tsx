import { QrCode01Icon } from "@hugeicons/core-free-icons";
import { Dialog, DialogContent, DialogTrigger, Icon } from "@loal/ui/shadcn";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

function useQr(value: string) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, {
      margin: 0,
      width: 720,
      errorCorrectionLevel: "M",
      color: { dark: "#161515", light: "#ffffff" },
    })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [value]);
  return src;
}

/**
 * QR для кассы — главное на карте: крупный, на белом, без номера рядом. Номер кассе
 * не нужен, а человеку только мешает. По нажатию — на весь экран.
 */
export function CardQr({ value, caption }: { value: string; caption?: string }) {
  const qr = useQr(value);
  const image = (className: string) =>
    qr ? (
      <img src={qr} alt="QR-код карты для кассы" className={`${className} aspect-square [image-rendering:pixelated]`} />
    ) : (
      <span className={`${className} aspect-square`} />
    );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex w-full flex-col items-center gap-3 rounded-[22px] bg-white px-6 pt-6 pb-5 text-graphite outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {image("w-full max-w-[250px] transition-transform group-hover:scale-[1.02]")}
          <span className="flex items-center gap-2 text-base font-semibold">
            <Icon icon={QrCode01Icon} size={18} />
            {caption || "Покажите код на кассе"}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent title="QR для кассы" description="Поднесите телефон к сканеру. Яркость экрана лучше прибавить.">
        {image("mx-auto w-full max-w-[420px]")}
      </DialogContent>
    </Dialog>
  );
}
