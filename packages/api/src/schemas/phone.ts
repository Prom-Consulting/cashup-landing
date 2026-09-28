import { parsePhoneNumberFromString } from "libphonenumber-js";
import { z } from "zod";

/** Страна по умолчанию: номер без кода страны считаем кыргызским. */
export const DEFAULT_PHONE_COUNTRY = "KG";

/**
 * Номер в том виде, в каком его хранит и сравнивает бэкенд: код страны и номер,
 * одними цифрами — «996700123456». Та же библиотека (libphonenumber), что и на
 * сервере, поэтому «принял фронт» значит «примет сервер».
 *
 * Международный номер («+7 701 …», «996700…») проверяется как есть. Номер без кода
 * («0700 123 456», «700123456») — кыргызский: поле по умолчанию стоит на +996.
 * Несуществующий номер — null: мы его отклоняем, а не «чиним» до чужого.
 */
export function toPhoneDigits(raw: string): string | null {
  const text = raw.trim();
  const digits = text.replace(/\D/g, "");
  if (!digits) return null;
  const international = parsePhoneNumberFromString(text.startsWith("+") ? text : `+${digits}`);
  if (international?.isValid()) return international.number.slice(1);
  const local = parsePhoneNumberFromString(digits, DEFAULT_PHONE_COUNTRY);
  return local?.isValid() ? local.number.slice(1) : null;
}

/** Телефон человека для любого запроса: вход, клиент, выдача карты, оплата. */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Введите номер телефона")
  .transform((value, ctx) => {
    const phone = toPhoneDigits(value);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "Проверьте номер: не хватает цифр или неверный код страны" });
      return z.NEVER;
    }
    return phone;
  });

/** Необязательный телефон: пусто — телефона нет, иначе те же правила и тот же текст ошибки. */
export const optionalPhoneSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (value === "") return "";
    const phone = toPhoneDigits(value);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "Проверьте номер: не хватает цифр или неверный код страны" });
      return z.NEVER;
    }
    return phone;
  });
