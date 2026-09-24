# Loal — фронтенды

Подписка на бонусы: 100 000 сом на карте в Apple Wallet каждый оплаченный месяц.
Монорепозиторий на pnpm workspaces: публичный лендинг и три приложения на поддоменах.

| Приложение | Домен | Рендеринг | Кто пользуется |
| --- | --- | --- | --- |
| `apps/landing` | loal.kg | SSG/SSR — для SEO | все посетители |
| `apps/admin` | admin.loal.kg | CSR, `noindex` | платформа (`super_admin`) |
| `apps/partner` | partner.loal.kg | CSR, `noindex` | заведения: витрина, списания, оплата, 1С |
| `apps/client` | client.loal.kg | CSR, `noindex` | держатели карт, по ссылке |

Общее — в `packages/`:

- `@loal/ui` — бренд: токены цветов и шрифтов (`theme.css`), логотип, поля форм, каркас кабинета;
  плюс `@loal/ui/shadcn` — компоненты на Radix и CVA с иконками HugeIcons;
- `@loal/api` — схемы Zod и типизированный клиент шлюза;
- `@loal/forms` — мост Zod ↔ Formik (`zodValidate`, `fieldError`, `formError`);
- `@loal/app-kit` — сессия, охрана маршрутов, форма входа;
- `@loal/tsconfig` — базовый tsconfig.

## Команды

```bash
pnpm install
pnpm dev            # лендинг,            http://localhost:3000
pnpm dev:partner    # кабинет партнёра,   http://localhost:5174
pnpm dev:client     # карта клиента,      http://localhost:5175
pnpm dev:admin      # админка,            http://localhost:5176
pnpm build          # собрать все приложения
pnpm typecheck      # проверить типы везде
```

## Бэкенд

Шлюз платформы — `https://loal.promconsult.pro` (репозиторий `cashup_platform`). Переопределяется
через `VITE_API_URL` в кабинетах и `NEXT_PUBLIC_API_URL` на лендинге. Справочник — [docs/API.md](./docs/API.md).

- вход общий для админки и кабинета магазина: почта с паролем или телефон с кодом из WhatsApp;
  в обоих случаях уходит `deviceId` — у аккаунта одна активная сессия;
- refresh-токена нет: на 401 кабинет разлогинивается и просит войти заново;
- заявки с лендинга уходят в `POST /v1/public/leads` и разбираются в админке;
- карта клиента открывается по публичной ручке `/v1/public/passes/{serial}/info`, а подписку он
  оплачивает через `POST /v1/public/octopay/subscriptions/{serial}` — входа держателю карты не нужно.

### Что умеет каждый кабинет

**Админка:** заведения (список, создание, карточка, приостановка), выдача доступа без оплаты,
журнал списаний, коды приглашения владельца, клиенты платформы с выпуском карт, программы с
уровнями и шаблоны карт, сертификаты подписи, настройки платформы и журнал действий, заявки с
лендинга, профиль.

**Кабинет заведения:** регистрация по коду приглашения, обзор с состоянием подписки, витрина для
каталога, журнал списаний с поиском, счета на продление, команда (точки и сотрудники), настройки
кассы, вебхуки с историей доставок, адрес вебхука для 1С с перевыпуском токена, профиль. Если человек работает в нескольких
заведениях, вверху появляется выбор.

**Кабинет клиента:** вход по телефону с кодом из WhatsApp, своя карта с балансом и QR, история
начислений и трат, добавление в Apple Wallet, оплата и продление подписки. Публичная страница карты
по ссылке `/c/<номер>` осталась для тех, кому карту выдали в заведении.

## Архитектура кабинетов (FSD)

Слои сверху вниз, импорт разрешён только вниз:

```
src/app/        точка входа, провайдеры, роутер
src/pages/      экраны
src/widgets/    крупные блоки (каркас, таблицы)
src/features/   действия пользователя (вход, смена статуса заявки)
src/entities/   домены: запросы и модель (store, lead, partner, card, session)
src/shared/     конфигурация, утилиты, обёртки над пакетами
```

Формы — Formik, правила — Zod из `@loal/api`: одна схема проверяет поле и описывает тело запроса.

## Деплой

Один сервер, Docker Compose, Traefik с TLS от Let's Encrypt. Traefik поднимается бэкендом
(`cashup_platform/infra/docker-compose.prod.yml`) и находит контейнеры по меткам, поэтому фронтенд
подключается к его сети как к внешней.

```bash
# на сервере, в папке фронтенда (НЕ внутри /var/www/cashup_platform —
# деплой бэкенда стирает свою папку целиком)
cp infra/.env.example infra/.env   # проверить домены, API_URL и TRAEFIK_NETWORK
docker compose -f infra/docker-compose.yml build
docker compose -f infra/docker-compose.yml up -d
```

Имя сети Traefik проверяется так:

```bash
docker inspect traefik -f '{{range $n,$_ := .NetworkSettings.Networks}}{{$n}} {{end}}'
```

Образы: `infra/Dockerfile.landing` — Next.js в standalone-режиме на порту 3000;
`infra/Dockerfile.spa` — сборка Vite и раздача через nginx (`infra/nginx/spa.conf`), который отдаёт
`index.html` на любой путь и ставит заголовок `noindex`.

## Лендинг

Все страницы собираются статикой, тексты лежат в HTML. SEO:

- `metadataBase`, canonical и Open Graph — в `layout.tsx` и `metadata` страниц; домен — `SITE_URL` в `app/_data/site.ts`;
- `app/sitemap.ts`, `app/robots.ts`;
- JSON-LD: Organization и WebSite в `layout.tsx`, FAQPage и подписка с ценой на главной;
- картинка превью — `app/opengraph-image.png`, иконки — `app/icon.svg`, `app/apple-icon.png`, `app/favicon.ico`.

### Каталог партнёров

`/partners` показывает заведения из публичной витрины бэкенда (`GET /v1/public/partners`): логотип,
категорию, описание, фотографии и ссылки, которые заведение само заполнило в кабинете. Страница
статическая и обновляется раз в пять минут.

Карты на странице сейчас нет: витрина не отдаёт координаты. Код карты (2GIS и OpenStreetMap) удалён
вместе с моковым каталогом — вернуть его можно из истории (`git log -- apps/landing/app/_components/partner-map.tsx`),
когда в профиле заведения появятся широта и долгота.
