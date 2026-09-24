/** Сохранить текст файлом: запрос на сертификат приходит строкой, Apple ждёт файл. */
export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/pkcs10" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const csrFilename = (name: string) => `${name.replace(/[^\p{L}\p{N}_-]+/gu, "-") || "loal"}.certSigningRequest`;
