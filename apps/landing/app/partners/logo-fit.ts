import type { PublicPartner } from "@loal/api";

/** В кружке заведения — логотип; фото только если логотипа нет. */
export function partnerAvatar(partner: PublicPartner) {
  return partner.logoUrl ?? partner.photos[0] ?? null;
}

const SAMPLE = 64;
const OUTPUT = 192;
const fitted = new Map<string, string | null>();

function distance(data: Uint8ClampedArray, i: number, j: number) {
  return Math.abs(data[i]! - data[j]!) + Math.abs(data[i + 1]! - data[j + 1]!) + Math.abs(data[i + 2]! - data[j + 2]!);
}

/**
 * Логотипы часто приходят квадратом с полями: белая рамка вокруг цветной плашки или пустой
 * прозрачный край. В круге такие поля выглядят «слетевшими» — видно рамку и углы квадрата.
 * Находим, где кончается фон (цвет углов или прозрачность), и перерисовываем картинку уже
 * обрезанной по содержимому. Плашку (на белом или на прозрачном) растягиваем на весь круг, прозрачный знак — с воздухом.
 */
function fit(image: HTMLImageElement): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SAMPLE;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || !image.naturalWidth) return null;
  context.drawImage(image, 0, 0, SAMPLE, SAMPLE);
  const { data } = context.getImageData(0, 0, SAMPLE, SAMPLE);
  const at = (x: number, y: number) => (y * SAMPLE + x) * 4;
  const corners = [at(0, 0), at(SAMPLE - 1, 0), at(0, SAMPLE - 1), at(SAMPLE - 1, SAMPLE - 1)];
  const transparent = corners.every((i) => data[i + 3]! < 16);
  // Фон — только если все четыре угла одного цвета; иначе это фото или рисунок до края
  if (!transparent && corners.some((i) => data[i + 3]! < 200 || distance(data, i, corners[0]!) > 36)) return null;

  let left = SAMPLE, top = SAMPLE, right = -1, bottom = -1;
  for (let y = 0; y < SAMPLE; y++)
    for (let x = 0; x < SAMPLE; x++) {
      const i = at(x, y);
      const content = transparent ? data[i + 3]! >= 16 : data[i + 3]! >= 16 && distance(data, i, corners[0]!) > 36;
      if (!content) continue;
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  if (right < 0) return null;
  const side = Math.max(right - left + 1, bottom - top + 1);
  // Полей почти нет — оставляем как есть
  if (side >= SAMPLE - 3) return null;

  // Внутри прозрачных полей бывает сплошная плашка (квадрат с логотипом) — её, как и плашку
  // на белом, растягиваем на весь круг. Узнаём по непрозрачным углам найденной рамки.
  const inset = 2;
  const plate =
    !transparent ||
    [at(left + inset, top + inset), at(right - inset, top + inset), at(left + inset, bottom - inset), at(right - inset, bottom - inset)].every(
      (i) => data[i + 3]! >= 200,
    );
  const scale = image.naturalWidth / SAMPLE;
  const centerX = ((left + right + 1) / 2) * scale;
  const centerY = ((top + bottom + 1) / 2) * (image.naturalHeight / SAMPLE);
  // Плашка заполняет круг целиком (углы срежет сам круг), прозрачный знак занимает ~78%
  const crop = side * scale * (plate ? 0.98 : 1.28);
  canvas.width = canvas.height = OUTPUT;
  const output = canvas.getContext("2d");
  if (!output) return null;
  // Фон под краями: цвет полей, а у плашки на прозрачном — цвет её угла
  const fill = transparent ? (plate ? at(left + inset, top + inset) : -1) : corners[0]!;
  if (fill < 0) output.clearRect(0, 0, OUTPUT, OUTPUT);
  else {
    output.fillStyle = `rgb(${data[fill]}, ${data[fill + 1]}, ${data[fill + 2]})`;
    output.fillRect(0, 0, OUTPUT, OUTPUT);
  }
  output.drawImage(image, centerX - crop / 2, centerY - crop / 2, crop, crop, 0, 0, OUTPUT, OUTPUT);
  return canvas.toDataURL("image/png");
}

/** Подрезать поля у уже загруженной картинки. Картинка должна грузиться с crossOrigin="anonymous". */
export function fitLogo(image: HTMLImageElement | null) {
  if (!image || image.dataset.fitted) return;
  const run = () => {
    if (image.dataset.fitted) return;
    image.dataset.fitted = "1";
    const source = image.currentSrc || image.src;
    let result = fitted.get(source);
    if (result === undefined) {
      try {
        result = fit(image);
      } catch {
        // Сервер картинок не дал CORS — показываем как есть
        result = null;
      }
      fitted.set(source, result);
    }
    if (result) image.src = result;
  };
  if (image.complete && image.naturalWidth) run();
  else image.addEventListener("load", run, { once: true });
  // Браузер мог закэшировать картинку без CORS — тогда загрузка с crossOrigin падает. Показываем
  // логотип как есть, без подрезки, а не битую иконку
  image.addEventListener(
    "error",
    () => {
      if (!image.crossOrigin) return;
      image.dataset.fitted = "1";
      image.removeAttribute("crossorigin");
      const source = image.src;
      image.src = `${source}${source.includes("?") ? "&" : "?"}plain=1`;
    },
    { once: true },
  );
}
