import { liveField, type CardType, type PassDesign, type PassField } from "@loal/api";
import { cn } from "@loal/ui/shadcn";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

/**
 * Живое поле сервер узнаёт по key и подставляет данные карты сами — в превью
 * показываем пример. Остальные поля — статичный текст, как написан.
 */
function fill(field: PassField) {
  return liveField(field.key)?.sample ?? String(field.value);
}

const ALIGN: Record<string, string> = {
  PKTextAlignmentLeft: "text-left",
  PKTextAlignmentCenter: "text-center",
  PKTextAlignmentRight: "text-right",
  PKTextAlignmentNatural: "text-left",
};

function Field({ field, size, labelColor }: { field: PassField; size: "sm" | "lg"; labelColor: string }) {
  return (
    <div className={cn("min-w-0", ALIGN[field.textAlignment ?? ""] ?? "text-left")}>
      {field.label && (
        <p className="truncate text-[0.625rem] font-semibold tracking-wide uppercase" style={{ color: labelColor }}>
          {field.label}
        </p>
      )}
      <p className={cn("truncate", size === "lg" ? "text-[1.75rem] leading-tight font-light" : "text-sm")}>
        {fill(field)}
      </p>
    </div>
  );
}

function useQr(value: string) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { margin: 0, width: 240 })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [value]);
  return src;
}

/** Линейные форматы рисуем полосками: точный штрихкод здесь не нужен, нужна форма. */
function Barcode({ format }: { format: PassDesign["barcodeFormat"] }) {
  const qr = useQr("LOAL-7F3A");
  if (format === "PKBarcodeFormatQR" || format === "PKBarcodeFormatAztec") {
    return qr ? <img src={qr} alt="" className="h-28 w-28" /> : <div className="h-28 w-28" />;
  }
  const bars = Array.from({ length: 48 }, (_, index) => ((index * 7919) % 5) + 1);
  return (
    <div className={cn("flex items-stretch gap-px", format === "PKBarcodeFormatPDF417" ? "h-14 w-56" : "h-16 w-60")}>
      {bars.map((width, index) => (
        <span key={index} className={index % 2 ? "bg-transparent" : "bg-black"} style={{ flex: width }} />
      ))}
    </div>
  );
}

/**
 * Карта так, как её покажет Apple Wallet: шапка с логотипом, баннер, главное поле,
 * ряды второстепенных и штрихкод внизу. Это приближение — окончательный вид решает
 * телефон, — но расположение полей и цвета совпадают.
 */
export function PassPreview({
  design,
  cardType,
  side = "front",
}: {
  design: PassDesign;
  cardType: CardType;
  side?: "front" | "back";
}) {
  const { images } = design;
  const hasStrip = Boolean(images.stripUrl) && cardType !== "boardingPass";
  const labelColor = design.labelColor;

  if (side === "back") {
    return (
      <div className="w-full max-w-[340px] rounded-[1.25rem] bg-white p-5 text-[#1c1c1e] shadow-[0_1.5rem_3rem_rgb(9_8_9/0.18)]">
        <p className="text-sm font-semibold">{design.organizationName}</p>
        {design.backFields.length === 0 ? (
          <p className="mt-4 text-sm text-[#8e8e93]">На обороте пока пусто.</p>
        ) : (
          <dl className="mt-4 flex flex-col divide-y divide-[#e5e5ea]">
            {design.backFields.map((field) => (
              <div key={field.key} className="py-3">
                {field.label && <dt className="text-xs text-[#8e8e93]">{field.label}</dt>}
                <dd className="mt-0.5 text-sm whitespace-pre-line">{fill(field)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative flex w-full max-w-[340px] flex-col overflow-hidden rounded-[1.25rem] shadow-[0_1.5rem_3rem_rgb(9_8_9/0.25)]"
      style={{ background: design.backgroundColor, color: design.foregroundColor }}
    >
      {images.backgroundUrl && cardType === "eventTicket" && (
        <img
          src={images.backgroundUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40 blur-md"
        />
      )}

      <div className="relative flex items-center gap-3 px-4 pt-4 pb-3">
        {images.logoUrl ? (
          <img
            src={images.logoUrl}
            alt=""
            className={cn(
              "max-h-10 max-w-[120px] object-contain",
              design.roundLogo && "h-10 w-10 rounded-full object-cover",
            )}
          />
        ) : null}
        {design.logoText && <p className="min-w-0 flex-1 truncate text-base font-semibold">{design.logoText}</p>}
        <div className="ml-auto flex gap-3">
          {design.headerFields.slice(0, 3).map((field) => (
            <Field key={field.key} field={field} size="sm" labelColor={labelColor} />
          ))}
        </div>
      </div>

      {hasStrip ? (
        <div className="relative">
          <img src={images.stripUrl} alt="" className="aspect-[375/123] w-full object-cover" />
          <div className="absolute inset-x-4 bottom-2 flex gap-4">
            {design.primaryFields.slice(0, 1).map((field) => (
              <Field key={field.key} field={field} size="lg" labelColor={labelColor} />
            ))}
          </div>
        </div>
      ) : (
        <div className="relative flex items-start justify-between gap-3 px-4 pt-2 pb-3">
          <div className="flex min-w-0 flex-1 gap-4">
            {design.primaryFields.slice(0, cardType === "boardingPass" ? 2 : 1).map((field) => (
              <Field key={field.key} field={field} size="lg" labelColor={labelColor} />
            ))}
          </div>
          {images.thumbnailUrl && (
            <img src={images.thumbnailUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
          )}
        </div>
      )}

      {(design.secondaryFields.length > 0 || design.auxiliaryFields.length > 0) && (
        <div className="relative flex flex-col gap-3 px-4 pt-3">
          {[design.secondaryFields, design.auxiliaryFields]
            .filter((row) => row.length > 0)
            .map((row, index) => (
              <div key={index} className="grid grid-flow-col gap-3" style={{ gridAutoColumns: "minmax(0,1fr)" }}>
                {row.slice(0, 4).map((field) => (
                  <Field key={field.key} field={field} size="sm" labelColor={labelColor} />
                ))}
              </div>
            ))}
        </div>
      )}

      {cardType === "punchCard" && design.punchIcons && (
        <div className="relative flex flex-wrap gap-2 px-4 pt-4">
          {Array.from({ length: Math.min(design.punchIcons.target, 12) }, (_, index) => (
            <img
              key={index}
              src={design.punchIcons!.iconUrl}
              alt=""
              className={cn("h-7 w-7 rounded-full object-cover", index >= 3 && "opacity-30")}
            />
          ))}
        </div>
      )}

      <div className="relative mt-auto flex flex-col items-center gap-2 px-4 pt-6 pb-5">
        <div className="rounded-lg bg-white p-2.5">
          <Barcode format={design.barcodeFormat} />
        </div>
        {design.barcodeAltText && (
          <p className="text-center text-xs" style={{ color: labelColor }}>
            {design.barcodeAltText}
          </p>
        )}
      </div>

      {images.footerUrl && cardType === "boardingPass" && (
        <img src={images.footerUrl} alt="" className="relative mx-4 mb-4 h-4 object-contain" />
      )}
    </div>
  );
}
