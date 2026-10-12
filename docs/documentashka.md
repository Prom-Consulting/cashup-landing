# Telegram OTP: инструкция по использованию

Сервис отправляет одноразовый код через Telegram Gateway и проверяет введённый
пользователем код. Подходит для подтверждения телефона, регистрации и входа
в Loal, Octopay и другие проекты.

## Адреса и доступ

| Назначение | Адрес |
| --- | --- |
| Базовый URL | `https://telegram.octobackend.click` |
| Swagger / описание запросов | <https://telegram.octobackend.click/docs> |
| OpenAPI | <https://telegram.octobackend.click/openapi.json> |
| Проверка работоспособности | <https://telegram.octobackend.click/health> |

Запросы отправляет **backend вашего проекта**. Для двух методов OTP нужны заголовки:

```http
Content-Type: application/json
X-API-Key: <API_KEY_сервиса>
```

Значение `X-API-Key` должно совпадать с `API_KEY` в серверном `.env` OTP-сервиса.
`OTP_PROVIDER_API_KEY` — отдельный токен Telegram Gateway; клиентам API он не нужен.
`OTP_SECRET` тоже остаётся только у OTP-сервиса.

Передавайте ключ вашему backend через закрытые настройки окружения. Не помещайте
его в frontend, мобильное приложение, URL или логи. CORS для браузерных обращений
не включён. `/health`, `/docs` и `/openapi.json` доступны без API-ключа.

Все номера, коды, идентификаторы и имена каналов ниже — вымышленные примеры.
Примеры запросов иллюстрируют формат; реальная отправка расходует баланс Gateway
по [правилам Telegram](https://core.telegram.org/gateway/api#sendverificationmessage).
Для интеграции используйте собственный номер и действительный
канал проекта.

## Сценарий интеграции

1. Пользователь вводит телефон на сайте и выбирает получение кода в Telegram.
2. Backend вызывает `POST /api/otp/request`.
3. Backend сохраняет `request_id` вместе с телефоном, проектом и текущей попыткой
   входа в серверной сессии. Frontend получает время ожидания и срок действия кода.
4. Пользователь вводит код из Telegram. Frontend передаёт его backend.
5. Backend берёт сохранённый `request_id` и вызывает `POST /api/otp/verify`.
6. После успешного ответа backend сопоставляет возвращённый телефон с сохранённой
   попыткой входа и создаёт собственную пользовательскую сессию.

В режиме Gateway пользователю не нужно запускать отдельного бота через `/start`
или делиться контактом. Номер должен быть зарегистрирован в Telegram.
Подробности доставки: [официальный Telegram Gateway API](https://core.telegram.org/gateway/api).

Сервис подтверждает телефон. Создание аккаунта, JWT, cookie и сессии сайта
выполняет ваш backend. Не принимайте от frontend произвольный `request_id`
вместо сохранённого и не доверяйте присланному им флагу `verified`.

## Отправка кода

**`POST /api/otp/request`**

| Поле JSON | Обязательное | Описание |
| --- | --- | --- |
| `phone` | Да | Строка с действительным номером в международном формате, включая `+` и код страны |
| `sender_username` | Нет | Username канала отправителя; строка с `@` или без, либо `null` |

Минимальный запрос:

```json
{
  "phone": "+12025550123"
}
```

Запрос от определённого проекта:

```json
{
  "phone": "+12025550123",
  "sender_username": "@your_project_channel"
}
```

Пробелы, круглые скобки и дефисы в номере допустимы: например,
`+1 (202) 555-0123` нормализуется в `+12025550123`. Номер без кода страны
или личный `@username` получателя не принимаются.

Username отправителя после удаления `@` содержит от 1 до 32 латинских букв,
цифр или символов `_`. Пустая строка и ссылка вида `https://t.me/...` не подходят.
Для стандартного отправителя не передавайте поле или задайте `null`.

Успешный ответ — **HTTP 200**:

```json
{
  "status": "sent",
  "request_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "expires_in": 300,
  "resend_after": 60
}
```

| Поле ответа | Значение |
| --- | --- |
| `status` | `sent`: Gateway принял запрос; это не подтверждение прочтения сообщения |
| `request_id` | Непрозрачный локальный идентификатор для проверки кода, 43 символа |
| `expires_in` | Оставшееся время действия кода в секундах |
| `resend_after` | Оставшееся время до повторной отправки в секундах |

Код в ответе API отсутствует. Сохраняйте идентификатор из фактического ответа,
а не из примера. Он не совпадает с идентификатором запроса Telegram Gateway.
Используйте полученные таймеры: из-за времени доставки они могут быть меньше
настроенных по умолчанию 300 и 60 секунд.

## Отправитель для Loal, Octopay и других проектов

Передавайте нужный `sender_username` в каждом запросе. Например, backend Loal
передаёт `your_loal_channel`, а backend Octopay — `your_octopay_channel`.
Это условные имена: замените их каналами ваших проектов.

Канал должен быть верифицирован Telegram и принадлежать владельцу Gateway-аккаунта.
Это требование [параметра `sender_username` в Telegram API](https://core.telegram.org/gateway/api#sendverificationmessage).

Произвольное название бренда и текст сообщения задать нельзя. Поля `brand`,
`project`, `text`, `ttl` и другие дополнительные поля этот API не принимает:
ответ будет `422 invalid_input`. `APP_NAME` не меняет сообщение Gateway.

Сейчас проекты используют общий `API_KEY`, баланс Gateway и лимиты на телефон.
`sender_username` выбирает отправителя, но не создаёт отдельный аккаунт проекта
или изоляцию его запросов. Соответствие проекта и канала задавайте на своём backend.

## Проверка кода

**`POST /api/otp/verify`**

| Поле JSON | Обязательное | Описание |
| --- | --- | --- |
| `request_id` | Да | Идентификатор из `/api/otp/request`: 43 символа из `A–Z`, `a–z`, `0–9`, `_`, `-` |
| `code` | Да | Строка из ровно 6 цифр `0–9` |

```json
{
  "request_id": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "code": "012345"
}
```

Передавайте код строкой: число `12345` потеряет ведущий ноль и не пройдёт проверку.
В этой операции `phone` и `sender_username` повторно передавать не нужно.

Успешный ответ — **HTTP 200**:

```json
{
  "verified": true,
  "phone": "+12025550123"
}
```

Код сразу становится использованным. Повторный вызов с тем же `request_id`
вернёт `400 invalid_request`, даже если код совпадает. Если успешный ответ
потерялся из-за сетевого сбоя, повторная проверка не восстановит результат.

## Пример клиента на Python

Пример рассчитан на backend с установленным `httpx`. В его закрытом окружении
задайте `TELEGRAM_OTP_API_KEY`, равный `API_KEY` OTP-сервиса.

```python
import os

import httpx


class OTPAPIError(Exception):
    def __init__(self, code, status, retry_after=None):
        super().__init__(code)
        self.code = code
        self.status = status
        self.retry_after = retry_after


async def call_otp(path, payload):
    async with httpx.AsyncClient(
        base_url="https://telegram.octobackend.click",
        headers={"X-API-Key": os.environ["TELEGRAM_OTP_API_KEY"]},
        timeout=20.0,
        follow_redirects=False,
        trust_env=False,
    ) as client:
        try:
            response = await client.post(path, json=payload)
        except httpx.RequestError:
            raise OTPAPIError("transport_error", None) from None

    try:
        body = response.json()
    except ValueError:
        raise OTPAPIError("unexpected_response", response.status_code) from None
    if not isinstance(body, dict):
        raise OTPAPIError("unexpected_response", response.status_code)
    if response.status_code != 200:
        error = body.get("error")
        if not isinstance(error, dict):
            raise OTPAPIError("unexpected_response", response.status_code)
        raise OTPAPIError(
            error.get("code", "unknown_error"),
            response.status_code,
            error.get("retry_after"),
        )
    return body


async def send_otp(phone, sender_username=None):
    payload = {"phone": phone}
    if sender_username is not None:
        payload["sender_username"] = sender_username
    return await call_otp("/api/otp/request", payload)


async def verify_otp(request_id, code):
    return await call_otp(
        "/api/otp/verify", {"request_id": request_id, "code": code}
    )
```

В обработчике отправки вызовите `await send_otp(phone, channel)` и сохраните
возвращённый `request_id` в серверной сессии. В обработчике подтверждения вызовите
`await verify_otp(saved_request_id, entered_code)`. Создавайте сессию входа только
после `verified: true` и совпадения телефона с сохранённой попыткой.

Обрабатывайте `OTPAPIError.code` по таблице ниже. `transport_error` означает,
что результат запроса неизвестен; `unexpected_response` — что пришёл ответ
другого формата, например от прокси. Пример не выполняет автоматических повторов.

## Ошибки и повторы

Ошибки API возвращаются в JSON:

```json
{
  "error": {
    "code": "resend_too_soon",
    "message": "Подождите перед повторной отправкой.",
    "retry_after": 42
  }
}
```

| HTTP | `error.code` | Действие клиента |
| --- | --- | --- |
| 401 | `unauthorized` | Проверить `X-API-Key` на backend |
| 422 | `invalid_input` | Проверить поля, формат телефона, шестизначную строку кода и `request_id` |
| 422 | `sender_not_supported` | Выбор канала доступен только в режиме Gateway |
| 429 | `resend_too_soon` | Разрешить повторную отправку через `retry_after` секунд |
| 429 | `hourly_limit` | Выждать `retry_after` секунд до освобождения лимита |
| 400 | `invalid_code` | Предложить пользователю исправить код |
| 400 | `attempts_exceeded` | Запросить новый код с учётом лимита отправки |
| 400 | `code_expired` | Запросить новый код |
| 400 | `invalid_request` | Использованный, отменённый или неизвестный запрос; нужен новый код |
| 409 | `request_cancelled` | Запрос отменён до завершения отправки; нужен новый код |
| 409 | `phone_not_linked` | Только режим `bot`: открыть `error.bot_url` и поделиться своим контактом |
| 502 | `delivery_failed` | Отправка не подтверждена; проверить настройки Gateway, канал, баланс и сеть |

У `429` и `502 delivery_failed` есть `error.retry_after` и HTTP-заголовок
`Retry-After`, оба в секундах. Для логики используйте `error.code`, а не текст
`error.message`. Прокси может вернуть ошибку другого формата — предусмотрите это.

При тайм-ауте или ошибке доставки не запускайте автоматический цикл отправок:
Telegram мог принять сообщение, а ответ мог потеряться. Подождите срок повтора
и предложите пользователю запросить новый код. При успешной повторной отправке
замените сохранённый `request_id` новым.

## Лимиты и поведение

| Параметр | По умолчанию | Настройка OTP-сервиса |
| --- | --- | --- |
| Длина кода | 6 цифр | Фиксирована в этой версии API |
| Срок действия | 300 секунд | `OTP_TTL_SECONDS` |
| Пауза между отправками на один номер | 60 секунд | `OTP_RESEND_SECONDS` |
| Запросы на один номер за скользящий час | 5 | `OTP_MAX_PER_HOUR` |
| Неверные попытки проверки одного кода | 5 | `OTP_MAX_ATTEMPTS` |

- Лимиты на номер общие для всех проектов и отправителей.
- Новый принятый запрос отменяет предыдущий активный код для этого номера.
  Это происходит до обращения к Gateway, даже если новая доставка затем завершится ошибкой.
- Попытки отправки с ошибкой тоже учитываются в лимитах.
- На пятой неверной проверке возвращается `attempts_exceeded`; далее этот запрос недействителен.
- Коды и лимиты сохраняются в SQLite и переживают перезапуск контейнера.
- Идемпотентность отправки по клиентскому ключу, отправка получателю по `@username`,
  произвольный текст и отчёты о доставке через API в этой версии не реализованы.
- Backend проекта должен отдельно ограничивать запросы публичной формы по IP
  и сессии: лимит на телефон не ограничивает перебор разных номеров.

## Проверка работоспособности и диагностика

```bash
curl --fail --silent --show-error https://telegram.octobackend.click/health
```

Ожидаемый ответ — HTTP 200:

```json
{
  "status": "ok"
}
```

`/health` проверяет состояние приложения и его соединения с базой. Он не отправляет
OTP, не проверяет баланс и не подтверждает доступность Telegram Gateway.

При `delivery_failed` проверьте на сервере `OTP_DELIVERY_MODE=telegram_gateway`,
наличие действительного `OTP_PROVIDER_API_KEY`, баланс Gateway и соответствие
канала требованиям Telegram. Настройки и их значения не нужно включать в логи.

В текущем деплое контейнер называется `TelegramBot`, а HTTPS обслуживает
существующий Traefik. Внешний клиент обращается к домену; порт 8000 на хосте
не опубликован. Настройка сервера и CI/CD описана в [README](../README.md#cicd-в-github-actions).
