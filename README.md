# Loal

Лендинг Loal: подписка на бонусы, каталог партнёров и страница подключения бизнеса.

## Карта партнёров

`/partners` показывает партнёров на карте. Пока ключ 2GIS не задан, рисуется стилизованная схема
города в фирменных цветах — на моковых данных из `app/_data/partners.ts`.

Чтобы включить настоящую карту 2GIS, скопируйте `.env.example` в `.env.local` и заполните:

- `NEXT_PUBLIC_2GIS_KEY` — ключ доступа из Platform Manager 2GIS (обязателен: без него карта не отдаёт тайлы);
- `NEXT_PUBLIC_2GIS_STYLE` — id стиля из редактора стилей 2GIS, если нужны фирменные цвета карты.

Логотип 2GIS остаётся на карте: по условиям лицензии его нельзя скрывать.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
