# API Cashup — справочник для фронтенда

Всё, что доступно снаружи, проходит через шлюз. Прод — `https://loal.promconsult.pro`.

**Этот файл обновляется в том же коммите, что и изменение API.** Поменял адрес, поле в
теле запроса, форму ответа или код ошибки — поправь здесь же. Иначе фронт узнаёт об
изменении от упавшего экрана.

---

## Общее

**Формат.** JSON, UTF-8. Даты — ISO 8601 (`2026-09-23T10:15:00.000Z`), даты без времени —
`2026-09-23`. Деньги и баллы — числа, не строки.

**Аутентификация.** Почти везде — заголовок `Authorization: Bearer <accessToken>`.
Исключения перечислены в разделе «Без токена».

**Ошибки** приходят в одной форме:

```json
{ "statusCode": 400, "error": "Bad Request", "message": "что именно не так" }
```

| Код | Что значит |
|---|---|
| `400` | Тело или параметры не прошли проверку. Повтор без изменений бесполезен |
| `401` | Нет токена, истёк или подпись неверна |
| `403` | Токен есть, но доступ к этому магазину или действию запрещён |
| `404` | Объекта нет |
| `409` | Состояние не позволяет: не хватает баллов, карта не активна, подписка уже есть |
| `500` | Наша ошибка, имеет смысл повторить |

**Ошибки валидации** дополнительно несут `issues` — массив с путём до поля:

```json
{ "statusCode": 400, "error": "Bad Request",
  "message": "Validation failed",
  "issues": [{ "path": ["deviceId"], "message": "String must contain at least 8 character(s)" }] }
```

**CORS** открыт для любого origin, так что с `localhost` всё работает.

---

## Аутентификация

### Запросить код

```
POST /auth/otp/request
{ "phone": "996700000001" }
```

Код уходит в WhatsApp, живёт 5 минут. Повторный запрос раньше чем через 60 секунд —
`429` с текстом, через сколько можно.

### Регистрация

```
POST /auth/register
{ "email": "...", "password": "не короче 8", "fullName": "...",
  "phone": "996700000001", "otp": "123456", "deviceId": "не короче 8 символов" }
→ { "accessToken": "...", "expiresIn": "12h" }
```

`POST /auth/register-with-invite` — то же плюс `inviteCode`; создаёт администратора
магазина, для которого код выпущен.

Самостоятельная регистрация всегда создаёт **обычного сотрудника**. Права агентства
выдаются только вручную в базе — по-другому их получить нельзя, и это намеренно.

### Вход

```
POST /auth/login
{ "email": "...", "password": "...", "deviceId": "..." }
   или
{ "phone": "996700000001", "otp": "123456", "deviceId": "..." }
→ { "accessToken": "...", "expiresIn": "12h" }
```

**Одно устройство на аккаунт.** Вход с новым `deviceId` делает его активным, а прежняя
сессия перестаёт считаться действующей. `deviceId` придумывает приложение и хранит у
себя — он должен пережить перезапуск, иначе каждый запуск будет выглядеть как новое
устройство.

### Профиль

| Метод | Адрес | Что делает |
|---|---|---|
| `GET` | `/auth/me` | Разбор токена: `sub`, `email`, `role`, `stores[]`. Отвечает `401`, если сессия перебита входом с другого устройства |
| `GET` | `/auth/me/profile` | Имя, почта, телефон — то, чего нет в токене |
| `PUT` | `/auth/me` | Смена имени и почты; возвращает новый токен |
| `PUT` | `/auth/me/password` | `{ currentPassword, newPassword }` |

В токене лежит `stores[]` — список магазинов, где человек состоит, с ролью и правами.
По нему фронт решает, какие разделы показывать, не спрашивая сервер.

Роли: `super_admin` (агентство, видит всё), `store_admin`, `store_staff`. Внутри
магазина у человека своя роль: `admin`, `staff`, `partner`, `partner_employee`.

---

## Карта клиента

### Посмотреть карту

```
GET /v1/cards/{serial}
→ { serialNumber, storeId, customerId, status, pointsBalance, punchCount,
    barcodeValue, platform, passVersion, createdAt, ... }
```

`status`: `active` | `suspended` | `revoked`. Платить можно только активной.

### Подписка клиента

```
GET    /admin/v1/stores/{storeId}/cards/{serial}/subscription   → подписка или null
POST   /admin/v1/stores/{storeId}/cards/{serial}/subscription   { "months": 3 }
DELETE /admin/v1/stores/{storeId}/cards/{serial}/subscription   отмена
```

Ответ:

```json
{ "id": "...", "storeId": "...", "cardId": "...",
  "status": "active",
  "pointsPerPeriod": 100000,
  "periodsTotal": 3, "periodsGranted": 1,
  "currentPeriodStart": "...", "currentPeriodEnd": "...", "createdAt": "..." }
```

`status`: `active` | `canceled` | `expired`.

Как это работает: при включении баллы выдаются сразу. В конце каждого месяца остаток
**сгорает целиком**, и если оплаченные месяцы ещё есть — тут же выдаётся новый запас.
Когда они кончились, баланс ноль, а карта остаётся у клиента.

Повторное включение при активной подписке — `400`. Продлевать пока нечем, это в работе.

### Оплатить подписку

```
POST /v1/public/octopay/subscriptions/{serial}
{ "months": 1 }
→ { "id", "providerInvoiceId", "amount", "paymentUrl", "status": "pending", ... }
```

Без токена. Клиента надо отправить на `paymentUrl`; после оплаты OctōPAY присылает нам
колбэк, и подписка включается сама. Проверять результат — карточкой подписки выше.

---

## Касса: списание бонусов

Два пути, и оба присылают одно и то же — что купили, почём и какую долю покрывают баллы.
Сколько это в баллах, считаем мы: по каждой позиции `цена × процент / 100`, округляя
**вниз**.

### Из нашего приложения

```
POST /v1/redemptions                    (нужен токен кассира)
{ "cardSerialNumber": "...",
  "operationId": "чек-123",
  "whatPurchased": [
    { "productName": "Айфон 15", "price": 100000, "deductionPercent": 5 },
    { "productName": "Наушники", "price": 20000,  "deductionPercent": 2 }
  ] }
→ { "ok": true, "deducted": 5400, "balanceAfter": 94600 }
```

Магазин **не передаётся** — сервер определяет его по тому, где работает вошедший кассир.
Если человек работает в нескольких магазинах, надо добавить `"storeId"`, иначе придёт
`400`.

Процент покрытия в приложении — **не больше 30**. У магазина со своей 1С правила свои.

`operationId` — ваш номер операции. Повтор с тем же значением **не спишет второй раз**, а
вернёт тот же ответ с `"duplicate": true`. Это то, что позволяет смело повторять запрос
при обрыве связи.

Отказы: `403` — подписка магазина неактивна; `404` — карты нет; `409` — не хватает баллов
или карта не активна. При любом отказе **ничего не списано**.

### Из 1С магазина

Те же поля, но с токеном магазина в адресе вместо входа. Полностью описано в
[ONEC_INTEGRATION.md](./ONEC_INTEGRATION.md) — этот документ отдают 1С-разработчику.

---

## Кабинет магазина

### Журнал списаний

```
GET /admin/v1/stores/{storeId}/deductions?page=1&pageSize=50&search=&from=&to=
→ { "items": [...], "total": 128, "page": 1, "pageSize": 50 }
```

Строка — **один товар**, а не чек:

```json
{ "id": "...", "operationId": "чек-123", "customerName": "Иван Петров",
  "productName": "Айфон 15", "price": 100000, "coveragePercent": 5, "points": 5000,
  "channel": "onec",
  "createdAt": "..." }
```

`channel`: `onec` — списание пришло из 1С, `scanner` — из нашего приложения.

Один и тот же адрес обслуживает оба кабинета: магазин видит только свой `storeId`,
агентство — любой. `search` ищет по клиенту и названию товара.

### Подписка магазина

```
GET  /admin/v1/stores/{storeId}/subscription
POST /admin/v1/stores/{storeId}/subscription     { "months": 1 }
→ { storeId, plan, status, startedAt, expiresAt, isActive }
```

`isActive` — главное поле: пока оно `false`, магазин **не может принимать бонусы** ни
через приложение, ни через 1С. `POST` — выдача доступа агентством без оплаты; обычный
путь продления идёт через оплату.

### Счета

```
GET  /admin/v1/stores/{storeId}/payments          история счетов
POST /admin/v1/stores/{storeId}/payments          { "amount": 3000, "months": 1 }
```

Счёт отвечает на вопрос «заплатили ли», подписка — «можно ли принимать бонусы». Это
разные вещи и разные адреса.

### Настройки 1С

```
GET  /admin/v1/stores/{storeId}/onec-integration
POST /admin/v1/stores/{storeId}/onec-integration/regenerate-token
→ { storeId, inboundWebhookUrl, createdAt }
```

`inboundWebhookUrl` — готовый адрес, его копируют в настройки 1С магазина. Перевыпуск
токена немедленно ломает старый адрес.

---

## Кабинет агентства

Всё под `/admin/v1`. Доступ к `/admin/v1/stores/{id}/...` есть у сотрудников этого
магазина и у `super_admin`; к остальному — только у `super_admin`.

### Магазины

| Метод | Адрес | Комментарий |
|---|---|---|
| `GET` | `/admin/v1/stores?kind=merchant` | Список; фильтр по роли магазина |
| `POST` | `/admin/v1/stores` | `{ slug, name, kind?, contactEmail?, contactPhone? }` |
| `GET` | `/admin/v1/stores/{id}` | |
| `PATCH` | `/admin/v1/stores/{id}` | Название, контакты, этап производства |
| `POST` | `/admin/v1/stores/{id}/suspend` | |
| `DELETE` | `/admin/v1/stores/{id}` | Стирает магазин во всех схемах |

`kind`: `issuer` — магазин, которому принадлежат карты (в Cashup он один); `merchant` —
участник, принимающий карту. По умолчанию `merchant`. **Выпустить карту может только
`issuer`**, остальным придёт `400`.

### Клиенты и карты

| Метод | Адрес |
|---|---|
| `GET` / `POST` | `/admin/v1/stores/{storeId}/customers` |
| `GET` | `/admin/v1/stores/{storeId}/customers/table?page=&pageSize=&search=` |
| `POST` | `/admin/v1/stores/{storeId}/customers/{id}/archive` |
| `POST` | `/admin/v1/stores/{storeId}/cards` — `{ customerId, templateId, programId }` |
| `GET` | `/admin/v1/stores/{storeId}/customers/{customerId}/cards` |
| `POST` | `/admin/v1/stores/{storeId}/cards/{serial}/revoke` |

### Программы лояльности

```
GET|POST          /admin/v1/stores/{storeId}/loyalty-programs
GET|PATCH|DELETE  /admin/v1/stores/{storeId}/loyalty-programs/{id}
```

Программа Cashup — тип `onec`, в её настройках одно поле:
`config: { "pointsPerPeriod": 100000 }` — сколько баллов даёт подписка за месяц.

### Шаблоны карт

```
GET  /admin/v1/stores/{storeId}/templates
POST /admin/v1/stores/{storeId}/templates/custom
PUT  /admin/v1/stores/{storeId}/templates/{id}
POST /admin/v1/stores/{storeId}/templates/{id}/publish
```

Дизайн карты — объект `design`: цвета, формат штрихкода, наборы полей. Формат штрихкода —
один из `PKBarcodeFormatQR`, `PKBarcodeFormatAztec`, `PKBarcodeFormatPDF417`,
`PKBarcodeFormatCode128`.

### Сертификаты и настройки платформы

`/admin/v1/certificates`, `/admin/v1/platform-settings`, `/admin/v1/audit-logs`,
`/admin/v1/leads` — только `super_admin`.

---

## Без токена

| Метод | Адрес | Зачем |
|---|---|---|
| `GET` | `/health` | Живость шлюза |
| `GET` | `/v1/public/partners` | Витрина: магазины-участники с действующей подпиской |
| `GET` | `/v1/public/card-examples` | Примеры карт для лендинга |
| `GET` | `/v1/public/enroll/{storeId}/{templateId}` | Данные для страницы самостоятельной выдачи |
| `POST` | `/v1/public/enroll/{storeId}/{templateId}/{programId}` | Клиент заводит себе карту |
| `POST` | `/v1/public/leads` | Заявка с лендинга |
| `GET` | `/v1/public/passes/{serial}` | Страница карты и ссылка на добавление в Wallet |
| `GET` | `/v1/public/onec-card/{token}/{serial}` | Для 1С: что на карте |
| `POST` | `/v1/public/onec-webhook/{token}` | Для 1С: списание |
| `POST` | `/v1/public/octopay/webhook` | Колбэк OctōPAY |

Адреса `/v1/devices/*`, `/v1/passes/*`, `/v1/log` — протокол Apple Wallet, их вызывают
телефоны, а не фронт.

---

## Наследие

`/v1/scan/preview`, `/v1/cards/{serial}/scan-confirm*`, `/v1/pos-settings`,
`/admin/v1/stores/{id}/sales` — начисление и списание баллов из продукта, из которого
вырос Cashup. Работают, но к Cashup отношения не имеют: здесь баллы выдаёт подписка, а
списывает касса через `/v1/redemptions`. Новый код на них лучше не завязывать.
