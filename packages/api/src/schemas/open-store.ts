import { z } from "zod";
import { PARTNER_CATEGORIES } from "./categories";
import { merchantProfileFormSchema } from "./merchant";

const categoryIds = PARTNER_CATEGORIES.map((item) => item.id) as readonly string[];

/**
 * Поля формы «ещё одно заведение» в кабинете партнёра (филиализация). Пределы — те же, что у
 * серверного онбординга (`registrationSchema`): название 2–60, имя 2–120, адрес и ссылка 2ГИС
 * обязательны, остальное необязательно. Тариф и аудитории — отдельным состоянием, не здесь.
 */
export const openStoreFormSchema = z.object({
  name: z.string().trim().min(2, "Слишком короткое название").max(60, "Не длиннее 60 символов"),
  contactName: z
    .string()
    .trim()
    .min(2, "Слишком короткое имя")
    .max(120, "Не длиннее 120 символов")
    .regex(/^[\p{L}\s-]+$/u, "Только буквы, пробел и дефис"),
  category: z.string().refine((value) => categoryIds.includes(value), "Выберите категорию"),
  description: z.string().trim().max(2000, "Не длиннее 2000 символов").default(""),
  address: z.string().trim().min(1, "Укажите адрес — улицу и дом").max(200, "Не длиннее 200 символов"),
  // Локацию можно задать точкой на карте или ссылкой 2ГИС — поэтому поле необязательное,
  // а «хотя бы одно» проверяет сама форма (у карты нет поля Formik).
  twogisUrl: merchantProfileFormSchema.shape.twogisUrl,
  instagramUrl: merchantProfileFormSchema.shape.instagramUrl,
  comment: z.string().trim().max(500, "Не длиннее 500 символов").default(""),
});
export type OpenStoreFormValues = z.infer<typeof openStoreFormSchema>;
