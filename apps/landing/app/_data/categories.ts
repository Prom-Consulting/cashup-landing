/**
 * Категории заведений. Сам бэкенд хранит категорию строкой и списка не навязывает,
 * поэтому здесь — те, что предлагаем в форме заявки и по которым фильтруем каталог.
 */
export const categories = [
  { id: "cafe", label: "Кофейни и рестораны", one: "Кофейня" },
  { id: "beauty", label: "Салоны красоты", one: "Салон красоты" },
  { id: "shop", label: "Магазины одежды", one: "Магазин" },
  { id: "sport", label: "Фитнес и спорт", one: "Фитнес" },
  { id: "auto", label: "Автосервисы", one: "Автосервис" },
  { id: "home", label: "Услуги для дома", one: "Услуги" },
] as const;

export type PartnerCategory = (typeof categories)[number]["id"];
