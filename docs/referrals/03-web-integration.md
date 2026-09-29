# 03. Интеграция REF-01 на web

Web реализует публичный маршрут `/ref/{code}`. При открытии он вызывает:

```http
POST /v1/public/referrals/{code}/visit
Content-Type: application/json

{ "deviceId": "..." }
```

После OTP тот же постоянный `deviceId` и код передаются в регистрацию:

```http
POST /auth/register
Content-Type: application/json

{
  "phone": "...",
  "otp": "...",
  "deviceId": "...",
  "referralCode": "..."
}
```

`deviceId` должен быть стабильным для установки или браузерного профиля. `404`
означает недействительный код, `409` — попытку самореферала с устройства реферера.
Авторизованный web-кабинет использует те же enroll/dashboard endpoint, что и mobile.
