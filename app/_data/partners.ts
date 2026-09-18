// Mock partner catalog. Replace with data from the Loal admin when the API is ready.
// percent — максимальная доля чека, которую партнёр разрешает оплатить бонусами в этом месяце.
// octopay — партнёр из пакета «OctōPAY + лояльность»: бонусы списываются автоматически при оплате.

export type PartnerCategory = "cafe" | "beauty" | "shop" | "sport" | "auto" | "home";

export type Partner = {
  id: string;
  name: string;
  category: PartnerCategory;
  percent: number;
  octopay: boolean;
  address: string;
  district: string;
  hours: string;
  note: string;
  /** [долгота, широта] — порядок как в 2GIS MapGL */
  coords: [number, number];
};

export const categories: { id: PartnerCategory; label: string; one: string }[] = [
  { id: "cafe", label: "Кофейни и рестораны", one: "Кофейня" },
  { id: "beauty", label: "Салоны красоты", one: "Салон красоты" },
  { id: "shop", label: "Магазины одежды", one: "Магазин" },
  { id: "sport", label: "Фитнес и спорт", one: "Фитнес" },
  { id: "auto", label: "Автосервисы", one: "Автосервис" },
  { id: "home", label: "Услуги для дома", one: "Услуги" },
];

export const partners: Partner[] = [
  {
    id: "dolce-vita",
    name: "Dolce Vita",
    category: "cafe",
    percent: 30,
    octopay: true,
    address: "Киевская, 95",
    district: "Центр",
    hours: "08:00 — 23:00",
    note: "Завтраки и десерты, своя обжарка",
    coords: [74.5936, 42.8759],
  },
  {
    id: "kofeinya-na-toktogula",
    name: "Кофейня на Токтогула",
    category: "cafe",
    percent: 20,
    octopay: false,
    address: "Токтогула, 125",
    district: "Центр",
    hours: "07:30 — 22:00",
    note: "Кофе с собой и завтраки весь день",
    coords: [74.6069, 42.8721],
  },
  {
    id: "plov-house",
    name: "Plov House",
    category: "cafe",
    percent: 15,
    octopay: true,
    address: "Ибраимова, 42",
    district: "Восток",
    hours: "10:00 — 22:00",
    note: "Национальная кухня, большие порции",
    coords: [74.6215, 42.8703],
  },
  {
    id: "studio-mira",
    name: "Studio Mira",
    category: "beauty",
    percent: 25,
    octopay: true,
    address: "Манаса, 40",
    district: "Центр",
    hours: "09:00 — 21:00",
    note: "Стрижка, окрашивание, уход",
    coords: [74.5845, 42.8694],
  },
  {
    id: "nail-bar-asel",
    name: "Nail Bar Асель",
    category: "beauty",
    percent: 40,
    octopay: false,
    address: "Ахунбаева, 119",
    district: "Юг",
    hours: "10:00 — 20:00",
    note: "Маникюр и педикюр по записи",
    coords: [74.6131, 42.8492],
  },
  {
    id: "barbershop-kant",
    name: "Barbershop Kant",
    category: "beauty",
    percent: 20,
    octopay: true,
    address: "Жибек Жолу, 310",
    district: "Север",
    hours: "10:00 — 21:00",
    note: "Мужские стрижки и бритьё",
    coords: [74.5997, 42.8846],
  },
  {
    id: "bereg-store",
    name: "Bereg Store",
    category: "shop",
    percent: 15,
    octopay: true,
    address: "Чуй, 155",
    district: "Центр",
    hours: "10:00 — 21:00",
    note: "Локальные бренды одежды",
    coords: [74.5904, 42.8752],
  },
  {
    id: "detsky-mir-ala-too",
    name: "Детский мир «Ала-Тоо»",
    category: "shop",
    percent: 10,
    octopay: false,
    address: "Байтик Баатыра, 51",
    district: "Юг",
    hours: "09:00 — 20:00",
    note: "Одежда и игрушки для детей",
    coords: [74.6224, 42.8551],
  },
  {
    id: "fit-lab",
    name: "Fit Lab",
    category: "sport",
    percent: 35,
    octopay: true,
    address: "Горького, 27",
    district: "Юг",
    hours: "07:00 — 23:00",
    note: "Тренажёрный зал и групповые тренировки",
    coords: [74.5798, 42.8541],
  },
  {
    id: "yoga-space",
    name: "Yoga Space",
    category: "sport",
    percent: 30,
    octopay: false,
    address: "Абдрахманова, 170",
    district: "Центр",
    hours: "08:00 — 21:00",
    note: "Йога и растяжка, абонементы",
    coords: [74.6018, 42.8648],
  },
  {
    id: "avtoservis-motor",
    name: "Автосервис «Мотор»",
    category: "auto",
    percent: 10,
    octopay: true,
    address: "Фучика, 15",
    district: "Запад",
    hours: "09:00 — 19:00",
    note: "Диагностика, ТО, шиномонтаж",
    coords: [74.5556, 42.8709],
  },
  {
    id: "clean-house",
    name: "Clean House",
    category: "home",
    percent: 20,
    octopay: false,
    address: "Панфилова, 178",
    district: "Центр",
    hours: "08:00 — 20:00",
    note: "Уборка квартир и химчистка мебели",
    coords: [74.5972, 42.8781],
  },
];

export const categoryLabel = (id: PartnerCategory) => categories.find((c) => c.id === id)?.label ?? "";
export const categoryOne = (id: PartnerCategory) => categories.find((c) => c.id === id)?.one ?? "";

/** Центр Бишкека — стартовая точка карты */
export const CITY_CENTER: [number, number] = [74.5985, 42.8724];
