import { revalidatePath, revalidateTag } from "next/cache";
import { PARTNERS_TAG } from "../../_data/partners-api";

/**
 * Кабинеты зовут это после сохранения витрины: каталог и стена партнёров на главной
 * перерисуются при следующем заходе, а не через пять минут. Секрета нет намеренно —
 * данные публичные, а худшее, что можно сделать вызовом, — лишний раз перечитать витрину.
 * Частые вызовы схлопываем, чтобы не гонять шлюз.
 */
let last = 0;

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" };

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}

export function POST() {
  const now = Date.now();
  if (now - last > 3000) {
    last = now;
    revalidateTag(PARTNERS_TAG, { expire: 0 });
    revalidatePath("/partners");
    revalidatePath("/");
  }
  return Response.json({ revalidated: true }, { headers: cors });
}
