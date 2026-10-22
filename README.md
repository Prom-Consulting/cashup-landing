# Loal — фронтенды

Подписка на бонусы: 990 сом за 30 дней — карта в Apple Wallet или Google Wallet и 15 000 бонусов на каждый цикл.
Монорепозиторий на pnpm workspaces: публичный лендинг и четыре приложения на поддоменах.

| Приложение | Домен | Рендеринг | Кто пользуется |
| --- | --- | --- | --- |
| `apps/landing` | loal.kg | SSG/SSR — для SEO | все посетители |
| `apps/admin` | admin.loal.kg | CSR, `noindex` | платформа (`super_admin`) |
| `apps/partner` | partner.loal.kg | CSR, `noindex` | заведения: витрина, списания, оплата, 1С |
| `apps/client` | client.loal.kg | CSR, `noindex` | держатели карт, по ссылке |
| `apps/cashier` | cashier.loal.kg | CSR, `noindex` | кассиры филиала партнёра |

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
pnpm dev:cashier    # кабинет кассира,    http://localhost:5177
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

**Кабинет кассира:** вход только по телефону с кодом, обзор филиала и подписки заведения, списание
бонусов (та же касса, что у партнёра, — `RedeemForm` из `@loal/app-kit`) и своя история с поиском,
сортировкой и страницами. Кассиров заводит партнёр в разделе «Я партнёр» по имени и телефону.

**Кабинет клиента:** вход по телефону с кодом из WhatsApp, своя карта с балансом и QR, история
начислений и трат, добавление в Apple Wallet и Google Wallet, оплата и продление подписки. Публичная страница карты
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
bash scripts/check-edge-ready.sh  # обновлённый gateway backend должен быть уже запущен
docker compose -f infra/docker-compose.yml up -d
```

После первой настройки деплой автоматический: пуш в `main` → GitHub Actions `CI` (типы и
сборка всех приложений) → при зелёном CI `CD` заходит на сервер по SSH, ставит тот коммит
(`git reset --hard`), собирает образы, поднимает их и проверяет, что все пять сайтов отвечают 200.
Секреты репозитория: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` (открытый ключ — в
`~/.ssh/authorized_keys` на сервере), необязательные `DEPLOY_PORT` и `FRONT_PATH`
(по умолчанию `/var/www/cashup-landing`). Перезапустить вручную: Actions → CD → Run workflow.
Правки, сделанные прямо на сервере в отслеживаемых файлах, деплой затирает; `infra/.env` не трогает.

Имя сети Traefik проверяется так:

```bash
docker inspect traefik -f '{{range $n,$_ := .NetworkSettings.Networks}}{{$n}} {{end}}'
```

### Ограничение запросов и бан IP

Traefik проверяет IP **перед всеми пятью frontend-приложениями**: `loal.kg`,
`www.loal.kg`, `admin`, `partner`, `client` и `cashier`. Учитываются страницы,
JS/CSS, изображения, `/_next/*`, API лендинга, `OPTIONS` и неизвестные пути.
Проверка стоит перед редиректом с `www`, поэтому смена домена или пути её не обходит.

Лимит **общий с API платформы: 100 запросов от IP за скользящую секунду**.
101-й запрос включает бан на **15 минут** сразу на всех этих доменах и API.
Traefik возвращает `429` с `Retry-After`, не отправляя запрос в Next.js/nginx.
Повторные запросы не продлевают бан. Счётчик и срок хранятся в Redis backend;
настройки `GATEWAY_RATE_LIMIT_RPS` и `GATEWAY_IP_BAN_SECONDS` меняются в
`cashup_platform/infra/.env` (при CI/CD — также в его GitHub secret `ENV`).

Используется [Traefik ForwardAuth](https://doc.traefik.io/traefik/reference/routing-configuration/http/middlewares/forwardauth/):
проверка обращается к `http://gateway:8080/_edge/rate-limit` по общей Docker-сети.
URL задаётся `GATEWAY_RATE_LIMIT_URL` в `infra/.env`; он должен быть внутренним,
без возврата через публичный Traefik, иначе получится цикл. Проверка получает
IP из соединения Traefik; присланным посетителем `X-Forwarded-*` не доверяет.
Cookies, токены и тело запроса в проверку не передаются. Docker-порты приложений
наружу не опубликованы. Доверие рассчитано на прямой вход посетителя в Traefik;
подключение CDN требует отдельной настройки реального IP и доверенных прокси.

**Порядок первого обновления: backend → frontend.** Сначала выкатите gateway
с endpoint `/_edge/rate-limit`, затем frontend. После сборки образов CD и
`scripts/ship.sh` проверяют ответ `204` с `X-Loal-Rate-Limit: v1` из Docker-сети.
Если endpoint ещё не готов, деплой останавливается до изменения работающих
контейнеров frontend. При ручном обновлении выполните `bash scripts/check-edge-ready.sh`
перед `docker compose up`. Gateway без этой версии возвращает `404`, поэтому
пропускать проверку и выкатывать frontend первым нельзя.

После подключения защиты доступность frontend зависит от gateway и Redis:
при их отказе запросы отклоняются с `5xx`, без обхода защиты. Перезапуск gateway
сохраняет баны; перезапуск Redis сбрасывает их, так как его persistence отключена.
Проверка работает в production через Traefik; `pnpm dev` напрямую её не включает.
HTTP-редирект с порта 80 на HTTPS выполняется раньше middleware. Защита от
перегрузки сетевого канала и распределённого потока с множества IP нужна также
на стороне хостинга/CDN.

Посмотреть и снять бан можно в `cashup_platform/infra`:

```bash
docker compose exec -T redis redis-cli --scan --pattern 'gateway:ip:*:ban'
docker compose exec -T redis redis-cli DEL 'gateway:ip:{203.0.113.8}:ban' 'gateway:ip:{203.0.113.8}:requests'
```

Подставьте IP из списка ключей. Проверка конфигурации всех frontend-роутеров,
порядка middleware и готовности деплоя: `python3 scripts/check-edge-config.py`
(также запускается в CI и в локальном `scripts/ship.sh`).

### DNS

Зона `loal.kg` держится на Cloudflare: у домена в реестре `.kg` прописаны её NS-серверы, записи
живут там же. Нужны шесть записей типа `A` на адрес сервера — апекс, `www`, `admin`, `partner`,
`client`, `cashier`; шлюз бэкенда (`loal.promconsult.pro`) к этой зоне не относится.

Записи держим в режиме **DNS only** (серое облако). Проксирование через Cloudflare включать нельзя
просто так: Traefik выпускает сертификаты проверкой по HTTP, а за прокси она не проходит, и режим
SSL у Cloudflare пришлось бы ставить строго `Full (strict)` — иначе запрос уходит на сервер по
HTTP, где для этих имён нет маршрута. Захотим прокси — сначала переводим Traefik на проверку
через DNS с токеном Cloudflare.

Если домен перестал открываться, сначала смотрим на делегирование, а не на записи:

```bash
dig +short NS loal.kg @8.8.8.8      # должны быть серверы Cloudflare
dig +short loal.kg @8.8.8.8         # должен быть адрес сервера
```

Пустой ответ на первую команду или `SERVFAIL` означает, что реестр указывает на серверы, которые
не отвечают, — чинится в карточке домена у регистратора, а не в панели DNS.

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
