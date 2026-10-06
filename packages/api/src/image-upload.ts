// Mirrors the image decoders supported by card-service. MIME may be empty on phones.
const IMAGE_MIME_TYPES = [
  "image/png", "image/apng", "image/x-png", "image/jpeg", "image/jpg", "image/pjpeg",
  "image/webp", "image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence",
  "image/avif", "image/avif-sequence", "image/gif", "image/tiff", "image/x-tiff",
  "image/bmp", "image/x-bmp", "image/x-ms-bmp", "image/svg+xml",
  "image/x-icon", "image/vnd.microsoft.icon", "image/vnd.adobe.photoshop", "image/x-photoshop",
  "image/jp2", "image/jxl",
];
const IMAGE_EXTENSIONS = ["png", "apng", "jpg", "jpeg", "jpe", "jfif", "webp", "heic", "heif", "avif", "gif", "tif", "tiff", "bmp", "dib", "svg", "ico", "psd", "jp2", "jxl"];
export const STOREFRONT_IMAGE_ACCEPT = [...IMAGE_MIME_TYPES, ...IMAGE_EXTENSIONS.map((ext) => `.${ext}`)].join(",");
export const STOREFRONT_IMAGE_FORMATS = "PNG, JPG, WebP, HEIC/HEIF, AVIF, GIF, TIFF, BMP, SVG, ICO, PSD, JP2 и JXL";

/** A picker hint only: the server validates the actual bytes and decodes the image. */
export function isStorefrontImage(file: Pick<File, "name" | "type">): boolean {
  return IMAGE_MIME_TYPES.includes(file.type.toLowerCase()) || IMAGE_EXTENSIONS.includes(file.name.split(".").pop()?.toLowerCase() ?? "");
}
