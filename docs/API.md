# API Cashup — справочник для фронтенда

Всё, что доступно снаружи, проходит через шлюз. Прод — `https://loal.promconsult.pro`.

**Этот файл обновляется в том же коммите, что и изменение API.** Поменял адрес, поле в
теле запроса, форму ответа или код ошибки — поправь здесь же. Иначе фронт узнаёт об
изменении от упавшего экрана.

---

## Что изменилось 23 сентября 2026: карта принадлежит платформе

Раньше карту, клиента и программу «держал» магазин — тот самый, который в системе
назывался Cashup. Теперь у них владельца нет вообще: платформа одна, и записывать её
в каждую строку было нечего. Магазин остался магазином — со своими сотрудниками,
филиалами, подпиской и токеном 1С.

Для фронта это значит три вещи.

**1. `stores` стали `merchants`.** В адресах, в полях ответов и в токене.

| Было | Стало |
|---|---|
| `/admin/v1/stores` | `/admin/v1/merchants` |
| `/admin/v1/stores/{id}` | `/admin/v1/merchants/{id}` |
| `/admin/v1/stores/{id}/deductions` | `/admin/v1/merchants/{id}/deductions` |
| `/admin/v1/stores/{id}/subscription` | `/admin/v1/merchants/{id}/subscription` |
| `/admin/v1/stores/{id}/payments` | `/admin/v1/merchants/{id}/payments` |
| `/admin/v1/stores/{id}/onec-integration` | `/admin/v1/merchants/{id}/onec-integration` |
| `/admin/v1/stores/{id}/members` | `/admin/v1/merchants/{id}/members` |
| `/admin/v1/stores/{id}/branches` | `/admin/v1/merchants/{id}/branches` |
| `/admin/v1/stores/{id}/pos-settings` | `/admin/v1/merchants/{id}/pos-settings` |
| `/admin/v1/stores/{id}/sales` | `/admin/v1/merchants/{id}/sales` |
| `/admin/v1/stores/{id}/profile` | `/admin/v1/merchants/{id}/profile` |
| `/admin/v1/stores/{id}/template-assets?slot=storeLogo` | `/admin/v1/merchants/{id}/profile-assets?slot=merchantLogo` |

**2. У платформенного — магазин из адреса исчез совсем.**

| Было | Стало |
|---|---|
| `/admin/v1/stores/{id}/customers` | `/admin/v1/customers` |
| `/admin/v1/stores/{id}/customers/{cid}/cards` | `/admin/v1/customers/{cid}/cards` |
| `/admin/v1/stores/{id}/cards` | `/admin/v1/cards` |
| `/admin/v1/stores/{id}/cards/{serial}/subscription` | `/admin/v1/cards/{serial}/subscription` |
| `/admin/v1/stores/{id}/templates` | `/admin/v1/templates` |
| `/admin/v1/stores/{id}/template-assets` | `/admin/v1/template-assets` |
| `/admin/v1/stores/{id}/loyalty-programs` | `/admin/v1/loyalty-programs` |
| `/admin/v1/stores/{id}/customer-field-settings` | `/admin/v1/customer-field-settings` |
| `/v1/public/enroll/{storeId}/{templateId}` | `/v1/public/enroll/{templateId}` |

Поле `storeId` пропало из ответов по клиенту, карте, шаблону, программе, подписке
клиента и сертификату. В операции вместо пары `storeId` + `merchantStoreId` теперь один
`merchantId` — магазин, где потратили; у начисления подписки он `null`.

**3. Эти адреса доступны только агентству.** Магазину они закрыты целиком — не
отфильтрованы, а именно закрыты, `403`. Магазин видит свой журнал списаний, свою
подписку, своих сотрудников и свои настройки 1С — и больше ничего. Раньше защита
держалась на том, что в адресе стоял его собственный id; id не стало, и защитой стала
роль.

**Токен нужно перевыпустить.** Клеймо `stores[]` в нём переименовано в `merchants[]`, а
`storeId` внутри — в `merchantId`. Старые токены не подойдут: перелогиниться.

Не менялось ничего из того, что знают чужие системы: `/auth/*`, вебхуки 1С и OctōPAY,
протокол Apple Wallet, `/v1/cards/{serial}`, `/v1/redemptions`.

---

## Общее

**Формат.** JSON, UTF-8. Даты — ISO 8601 (`2026-09-23T10:15:00.000Z`), даты без времени —
`2026-09-23`. Деньги и баллы — числа, не строки.

**Аутентификация.** Почти везде — заголовок `Authorization: Bearer <accessToken>`.
Исключения перечислены в разделе «Без токена».

**Ошибки** обычно приходят в форме:

```json
{ "statusCode": 400, "error": "Bad Request", "message": "что именно не так" }
```

| Код | Что значит |
|---|---|
| `400` | Тело или параметры не прошли проверку. Повтор без изменений бесполезен |
| `401` | Неверные данные входа/OTP, нет токена, токен истёк либо сессия заменена другим устройством |
| `403` | Токен есть, но доступ к этому магазину или действию запрещён |
| `404` | Объекта нет |
| `409` | Состояние не позволяет: не хватает баллов, карта не активна, подписка уже есть |
| `429` | Слишком рано запрошен повторный OTP либо исчерпан лимит попыток |
| `502` / `503` | WhatsApp-сервис временно недоступен или не настроен |
| `500` | Наша ошибка, имеет смысл повторить позже |

**Ошибки валидации** дополнительно несут `issues` — массив с путём до поля:

```json
{ "statusCode": 400, "error": "Bad Request",
  "message": "Validation failed",
  "issues": [{ "path": ["deviceId"], "message": "String must contain at least 8 character(s)" }] }
```

**CORS** открыт для любого origin: gateway отражает присланный `Origin`, разрешает
`GET, POST, PUT, PATCH, DELETE, OPTIONS` и заголовки `Content-Type, Authorization`.
Cookies не используются, `credentials: "include"` ставить не надо.

---

## Аутентификация

### Что frontend должен хранить

Frontend хранит два значения:

1. `deviceId` — постоянный ID конкретной установки приложения. Создаётся **один раз**,
   не меняется при обычном запуске и отправляется при регистрации и каждом входе.
2. `accessToken` — JWT текущей сессии. Отправляется как
   `Authorization: Bearer <accessToken>` на всех закрытых endpoint’ах.

Для web/PWA минимальная реализация `deviceId`:

```ts
export function getDeviceId(): string {
  const key = "cashup.deviceId";
  let value = localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(key, value);
  }
  return value;
}
```

В iOS/Android его надо положить в постоянное хранилище приложения (Keychain,
Keystore/SecureStore или AsyncStorage). Нельзя использовать случайное значение на каждый
запуск, номер телефона, push token или browser fingerprint. Допустимая длина — от 8 до
200 символов.

JWT живёт по умолчанию 12 часов. После `401` токен нельзя продолжать отправлять: очистить
его и перевести пользователя на экран входа.

### Запросить код

```
POST /auth/otp/request
Content-Type: application/json

{ "phone": "+996700000001" }
→ 201 { "ok": true, "expiresInSeconds": 300 }
```

Сервер удаляет пробелы, `+`, скобки и дефисы; после нормализации должно остаться от 10
до 15 цифр в международном формате. Код состоит из 6 цифр, уходит в WhatsApp и живёт
5 минут. Повторный запрос раньше чем через 60 секунд — `429` с текстом, через сколько
можно повторить. На один код даётся 5 попыток.

Этот endpoint используется и перед регистрацией, и перед входом по телефону. Код
одноразовый: успешная регистрация или вход его поглощает.

Краткий `503` WhatsApp-сервиса во время переподключения аккаунта backend повторяет сам
до трёх раз. `502` frontend получит только если все попытки закончились неудачно; в этом
случае код не сохранён и запрос можно безопасно повторить позже.

### Регистрация

```
POST /auth/register
Content-Type: application/json

{
  "email": "client@example.com",
  "password": "не короче 8 символов",
  "fullName": "Иван Петров",
  "phone": "+996700000001",
  "otp": "123456",
  "deviceId": "7ce8e4d2-4621-43f4-a57c-b85b1d26d124"
}
→ { "accessToken": "...", "expiresIn": "12h" }
```

Все поля, кроме `fullName`, обязательны. Перед регистрацией frontend обязательно
вызывает `/auth/otp/request` для того же телефона. После успеха надо сохранить
`accessToken`; отдельный вызов `/auth/login` не нужен.

`POST /auth/register-with-invite` — то же плюс `inviteCode`; создаёт администратора
магазина, для которого код выпущен.

Самостоятельная регистрация всегда создаёт **обычного сотрудника** (`store_staff`) без
членства в магазине. Права агентства выдаются отдельно — передать роль в теле нельзя.

Основные отказы: `400` — поле отсутствует/неверного формата; `401` — OTP неверный или
истёк; `409` — email или телефон уже зарегистрирован; `502/503` — проблема WhatsApp.

### Вход

```
POST /auth/login
Content-Type: application/json

{ "email": "client@example.com", "password": "password123", "deviceId": "..." }
   или
{ "phone": "+996700000001", "otp": "123456", "deviceId": "..." }
→ { "accessToken": "...", "expiresIn": "12h" }
```

Нельзя смешивать две формы. Для входа по email нужны `email + password + deviceId`.
Для входа по телефону нужны `phone + otp + deviceId`, причём сначала надо вызвать
`/auth/otp/request`. `GET /auth/login` не существует — метод только `POST`.

**Одно устройство на аккаунт.** Вход с новым `deviceId` делает его активным, а прежняя
сессия перестаёт считаться действующей. `deviceId` придумывает приложение и хранит у
себя. Повторный вход с тем же `deviceId` сохраняет текущую сессию; вход с другим
заменяет её.

На первом устройстве любой следующий закрытый запрос вернёт:

```http
HTTP/1.1 401 Unauthorized
```

```json
{
  "error": "SESSION_REPLACED",
  "message": "Аккаунт открыт на другом устройстве. Войдите снова."
}
```

Frontend обязан отдельно обработать `error === "SESSION_REPLACED"`: очистить токен,
закрыть приватные экраны и показать `message`. Автоматически повторять такой запрос или
молча обновлять сессию нельзя — это вернуло бы доступ старому устройству.

### Рекомендуемая последовательность экранов

**Регистрация:**

1. Получить/создать постоянный `deviceId`.
2. Пользователь вводит телефон → `POST /auth/otp/request`.
3. Показать ввод 6 цифр и таймер повторной отправки 60 секунд.
4. Собрать email, пароль, имя → один `POST /auth/register` с телефоном, OTP и `deviceId`.
5. Сохранить `accessToken` и открыть приложение.

**Вход по телефону:**

1. Телефон → `POST /auth/otp/request`.
2. OTP → `POST /auth/login` с телефоном, OTP и сохранённым `deviceId`.
3. Сохранить новый `accessToken`. Если это новое устройство, старое будет отключено.

**Запуск уже авторизованного приложения:**

1. Прочитать сохранённый токен.
2. Вызвать `GET /auth/me`.
3. `200` — открыть приложение; обычный `401` — показать вход;
   `401 + SESSION_REPLACED` — показать сообщение о входе на другом устройстве.

### Профиль

| Метод | Адрес | Что делает |
|---|---|---|
| `GET` | `/auth/me` | Разбор токена: `sub`, `email`, `role`, `merchants[]`, `sessionId`. Отвечает `401`, если сессия заменена |
| `GET` | `/auth/me/profile` | `{ id, email, fullName, role }` |
| `PUT` | `/auth/me` | Смена имени и почты; возвращает новый токен |
| `PUT` | `/auth/me/password` | `{ currentPassword, newPassword }` |

В токене лежит `merchants[]` — список магазинов, где человек работает, с ролью и
правами: `{ memberId, merchantId, role, permissions }`. По нему фронт решает, какие
разделы показывать, не спрашивая сервер.

Роли аккаунта: `super_admin` (агентство, видит всё), `store_admin`, `store_staff`, `api`.
Внутри магазина у человека своя роль: `admin`, `staff`, `partner`, `partner_employee`.
Названия ролей аккаунта остались прежними: переименование тронуло бы выданные токены
ради одной только вывески.

Пример общей обёртки запросов:

```ts
export async function api(path: string, init: RequestInit = {}) {
  const token = localStorage.getItem("cashup.accessToken");
  const response = await fetch(`https://loal.promconsult.pro${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const body = await response.json().catch(() => null);
  if (response.status === 401) {
    localStorage.removeItem("cashup.accessToken");
    if (body?.error === "SESSION_REPLACED") {
      // Показать body.message перед переходом на вход.
    }
  }
  if (!response.ok) throw Object.assign(new Error(body?.message ?? "Ошибка API"), { status: response.status, body });
  return body;
}
```

---

## Карта клиента

### Посмотреть карту

```
GET /v1/cards/{serial}
→ { serialNumber, customerId, status, pointsBalance, punchCount,
    barcodeValue, platform, passVersion, createdAt, ... }
```

`status`: `active` | `suspended` | `revoked`. Платить можно только активной.

### Подписка клиента

```
GET    /admin/v1/cards/{serial}/subscription   → подписка или null
POST   /admin/v1/cards/{serial}/subscription   { "months": 3 }
DELETE /admin/v1/cards/{serial}/subscription   отмена
```

Ответ:

```json
{ "id": "...", "cardId": "...",
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
Если человек работает в нескольких магазинах, надо добавить `"merchantId"`, иначе придёт
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
GET /admin/v1/merchants/{merchantId}/deductions?page=1&pageSize=50&search=&from=&to=
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

Один и тот же адрес обслуживает оба кабинета: магазин видит только свой `merchantId`,
агентство — любой. `search` ищет по клиенту и названию товара.

### Подписка магазина

```
GET  /admin/v1/merchants/{merchantId}/subscription
POST /admin/v1/merchants/{merchantId}/subscription     { "months": 1 }
→ { merchantId, plan, status, startedAt, expiresAt, isActive }
```

`isActive` — главное поле: пока оно `false`, магазин **не может принимать бонусы** ни
через приложение, ни через 1С. `POST` — выдача доступа агентством без оплаты; обычный
путь продления идёт через оплату.

### Счета

```
GET  /admin/v1/merchants/{merchantId}/payments          история счетов
POST /admin/v1/merchants/{merchantId}/payments          { "amount": 3000, "months": 1 }
```

Счёт отвечает на вопрос «заплатили ли», подписка — «можно ли принимать бонусы». Это
разные вещи и разные адреса.

### Профиль для витрины

То, что клиент видит в каталоге приложения и на лендинге.

```
GET /admin/v1/merchants/{merchantId}/profile
PUT /admin/v1/merchants/{merchantId}/profile
{
  "category": "Кофейня",
  "description": "Свежая обжарка и выпечка каждый день",
  "logoUrl": "https://loal.promconsult.pro/v1/public/template-assets/….png",
  "photos": ["https://…/1.png", "https://…/2.png"],
  "instagramUrl": "https://instagram.com/coffee",
  "twogisUrl": "https://2gis.kg/bishkek/firm/…"
}
→ тот же объект
```

`PUT` **заменяет профиль целиком**: присылать надо все шесть полей. Чтобы очистить поле,
отправьте `null`, для фотографий — `[]`. Если поле пропустить, придёт `400`.

| Поле | Ограничения |
|---|---|
| `category` | строка 1–60 символов или `null`; список категорий пока свободный |
| `description` | 1–2000 символов или `null` |
| `logoUrl`, `instagramUrl`, `twogisUrl` | адрес `http(s)://`, до 500 символов, или `null` |
| `photos` | массив адресов, до 10 штук; порядок сохраняется как прислан |

Читать может любой сотрудник магазина. Менять — только администратор магазина
(`admin`), партнёр (`partner`) или агентство; остальным `403`.

**Картинки загружаются отдельно**, до сохранения профиля:

```
POST /admin/v1/merchants/{merchantId}/profile-assets?slot=merchantLogo   multipart, поле file
POST /admin/v1/merchants/{merchantId}/profile-assets?slot=merchantPhoto
→ { "url": "https://…/v1/public/template-assets/<id>.png" }
```

Принимаются PNG, JPG и SVG до 25 МБ. На выходе всегда PNG. `merchantLogo` вписывается в
квадрат 512×512 с прозрачными полями, `merchantPhoto` уменьшается до 1600 px по большей
стороне без обрезки. Полученный `url` кладётся в `logoUrl` или `photos`. Файл без
профиля ни на что не влияет.

Адрес свой, а не общий `/admin/v1/template-assets`: тот принадлежит платформе и открыт
только агентству, а профиль заполняет сам магазин. Отдаются картинки по прежнему
публичному адресу — хранилище одно и то же.

### Настройки 1С

```
GET  /admin/v1/merchants/{merchantId}/onec-integration
POST /admin/v1/merchants/{merchantId}/onec-integration/regenerate-token
→ { merchantId, inboundWebhookUrl, createdAt }
```

`inboundWebhookUrl` — готовый адрес, его копируют в настройки 1С магазина. Перевыпуск
токена немедленно ломает старый адрес.

---

## Кабинет агентства

Всё под `/admin/v1`. Доступ к `/admin/v1/merchants/{id}/...` есть у сотрудников этого
магазина и у `super_admin`; ко всему остальному — только у `super_admin`.

### Магазины

| Метод | Адрес | Комментарий |
|---|---|---|
| `GET` | `/admin/v1/merchants` | Список. Только агентство |
| `POST` | `/admin/v1/merchants` | `{ slug, name, contactEmail?, contactPhone? }`. Только агентство |
| `GET` | `/admin/v1/merchants/{id}` | Виден и самому магазину |
| `PATCH` | `/admin/v1/merchants/{id}` | Название, контакты, этап подключения |
| `POST` | `/admin/v1/merchants/{id}/suspend` | |
| `DELETE` | `/admin/v1/merchants/{id}` | Убирает магазин. Клиенты, карты и баланс остаются — они не его |

### Клиенты и карты

Платформенные, магазину закрыты.

| Метод | Адрес |
|---|---|
| `GET` / `POST` | `/admin/v1/customers` |
| `GET` | `/admin/v1/customers/table?page=&pageSize=&search=` |
| `POST` | `/admin/v1/customers/{id}/archive` |
| `POST` | `/admin/v1/cards` — `{ customerId, templateId, programId }` |
| `GET` | `/admin/v1/customers/{customerId}/cards` |
| `POST` | `/admin/v1/cards/{serial}/revoke` |

### Программы лояльности

```
GET|POST          /admin/v1/loyalty-programs
GET|PATCH|DELETE  /admin/v1/loyalty-programs/{id}
```

Программа Cashup — тип `onec`, в её настройках одно поле:
`config: { "pointsPerPeriod": 100000 }` — сколько баллов даёт подписка за месяц.

### Шаблоны карт

```
GET  /admin/v1/templates
POST /admin/v1/templates/custom
PUT  /admin/v1/templates/{id}
POST /admin/v1/templates/{id}/publish
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
| `GET` | `/v1/public/partners` | Витрина: магазины-участники с действующей подпиской, см. ниже |
| `GET` | `/v1/public/card-examples` | Примеры карт для лендинга |
| `GET` | `/v1/public/enroll/{templateId}` | Данные для страницы самостоятельной выдачи |
| `POST` | `/v1/public/enroll/{templateId}/{programId}` | Клиент заводит себе карту |
| `POST` | `/v1/public/leads` | Заявка с лендинга |
| `GET` | `/v1/public/passes/{serial}` | Страница карты и ссылка на добавление в Wallet |
| `GET` | `/v1/public/onec-card/{token}/{serial}` | Для 1С: что на карте |
| `POST` | `/v1/public/onec-webhook/{token}` | Для 1С: списание |
| `POST` | `/v1/public/octopay/webhook` | Колбэк OctōPAY |

Ответ витрины — массив магазинов по алфавиту, у каждого профиль целиком:

```json
[{ "id": "...", "name": "Кофе Хаус", "contactPhone": "996700000000",
   "category": "Кофейня", "description": "...", "logoUrl": "https://...",
   "photos": ["https://..."], "instagramUrl": null, "twogisUrl": "https://..." }]
```

Магазин с незаполненным профилем в списке тоже есть, у него поля `null`, а `photos` пустой.

Адреса `/v1/devices/*`, `/v1/passes/*`, `/v1/log` — протокол Apple Wallet, их вызывают
телефоны, а не фронт.

---

## Наследие

`/v1/scan/preview`, `/v1/cards/{serial}/scan-confirm*`, `/v1/pos-settings`,
`/admin/v1/merchants/{id}/sales` — начисление и списание баллов из продукта, из которого
вырос Cashup. Работают, но к Cashup отношения не имеют: здесь баллы выдаёт подписка, а
списывает касса через `/v1/redemptions`. Новый код на них лучше не завязывать.
