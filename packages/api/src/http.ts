import type { ZodType } from "zod";

/** Ошибка запроса: статус нужен экранам, чтобы отличить 401 от 422 и от сети. */
export type FieldIssue = { path: (string | number)[]; message: string };

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;
  /** Ошибки проверки полей с сервера: путь до поля и текст (см. docs/API.md). */
  readonly issues: FieldIssue[];

  constructor(status: number, message: string, payload?: unknown, issues: FieldIssue[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.issues = issues;
  }

  /**
   * Стабильный код ошибки из поля `error` (SESSION_REPLACED, CARD_FROZEN, …). Ветвимся по нему,
   * а не по русскому `message`: текст сервер вправе поменять, код — нет.
   */
  get code(): string | null {
    const raw =
      typeof this.payload === "object" && this.payload !== null ? (this.payload as { error?: unknown }).error : null;
    return typeof raw === "string" && /^[A-Z][A-Z0-9_]+$/.test(raw) ? raw : null;
  }

  /** Секунд до повтора — у OTP_RATE_LIMITED; null, если сервер не сказал. */
  get retryAfter(): number | null {
    const raw =
      typeof this.payload === "object" && this.payload !== null
        ? (this.payload as { retryAfter?: unknown }).retryAfter
        : null;
    return typeof raw === "number" && raw > 0 ? Math.ceil(raw) : null;
  }

  /** Refresh-токен истёк или неверный — нужен обычный вход. */
  get isRefreshInvalid() {
    return this.status === 401 && this.code === "INVALID_REFRESH_TOKEN";
  }

  /** Токен протух или его нет — кабинет должен отправить на вход. */
  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  /** Состояние не позволяет: не хватает баллов, карта не активна, подписка уже есть. */
  get isConflict() {
    return this.status === 409;
  }

  /** Слишком часто: у запроса кода подтверждения окно в 60 секунд. */
  get isTooManyRequests() {
    return this.status === 429;
  }

  /**
   * Аккаунт открыли на другом устройстве — сессия этого устройства погашена.
   * Повторять запрос или молча обновлять сессию нельзя: это вернуло бы доступ
   * старому устройству. Нужно очистить токен и показать сообщение (docs/API.md).
   */
  get isSessionReplaced() {
    return this.status === 401 && this.code === "SESSION_REPLACED";
  }
}

/** Ответ пришёл, но не совпал со схемой: контракт бэкенда разошёлся с фронтом. */
export class ApiShapeError extends Error {
  readonly issues: unknown;

  constructor(path: string, issues: unknown) {
    super(`Ответ ${path} не совпадает с ожидаемой схемой`);
    this.name = "ApiShapeError";
    this.issues = issues;
  }
}

export type TokenStore = {
  /** Access token — единственное, что уходит в Authorization. */
  read: () => string | null;
  write: (token: string | null) => void;
  /** Refresh token живёт 30 дней и нужен только для POST /auth/refresh — как Bearer его не шлём. */
  readRefresh: () => string | null;
  /** Пара из ответа входа, регистрации, refresh или смены профиля; null — выйти. */
  writeSession: (tokens: { accessToken: string; refreshToken?: string | null } | null) => void;
};

/**
 * Токены держим в localStorage: httpOnly-cookie у бэкенда нет. Access живёт 12 часов,
 * refresh — 30 дней. Ключ разный у каждого кабинета, чтобы сессии партнёра и админа не
 * перетирали друг друга на одном домене разработки.
 */
export function createTokenStore(key: string): TokenStore {
  const refreshKey = `${key}.refresh`;
  const get = (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  };
  const set = (name: string, value: string | null) => {
    try {
      if (value === null) localStorage.removeItem(name);
      else localStorage.setItem(name, value);
    } catch {
      /* приватный режим — просто живём без запоминания */
    }
  };
  return {
    read: () => get(key),
    write(token) {
      set(key, token);
      if (token === null) set(refreshKey, null);
    },
    readRefresh: () => get(refreshKey),
    writeSession(tokens) {
      set(key, tokens?.accessToken ?? null);
      // Старый ответ без refresh (вход по почте до обновления бэкенда) — прежний refresh не держим
      set(refreshKey, tokens?.refreshToken ?? null);
    },
  };
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Тело отправляем как JSON; FormData уходит как есть. */
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Запрос без токена (публичные ручки). */
  anonymous?: boolean;
  signal?: AbortSignal;
};

export type ApiClient = {
  request: <T>(schema: ZodType<T>, path: string, options?: RequestOptions) => Promise<T>;
  tokens: TokenStore;
  baseUrl: string;
};

function buildUrl(baseUrl: string, path: string, query: RequestOptions["query"]) {
  const url = new URL(path.replace(/^\//, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** Бэкенд отдаёт ошибки по-разному: {message} у Nest, {error} у шлюза, иногда просто текст. */
async function readError(response: Response): Promise<{ message: string; payload: unknown; issues: FieldIssue[] }> {
  const text = await response.text().catch(() => "");
  if (!text) return { message: `Ошибка ${response.status}`, payload: undefined, issues: [] };
  try {
    const payload = JSON.parse(text) as Record<string, unknown>;
    const raw = payload.message ?? payload.error ?? payload.detail;
    const message = Array.isArray(raw) ? raw.join(", ") : typeof raw === "string" ? raw : `Ошибка ${response.status}`;
    const issues = Array.isArray(payload.issues) ? (payload.issues as FieldIssue[]) : [];
    return { message, payload, issues };
  } catch {
    return { message: text.slice(0, 300), payload: text, issues: [] };
  }
}

export function createApiClient({
  baseUrl,
  tokens,
  onUnauthorized,
}: {
  baseUrl: string;
  tokens: TokenStore;
  /**
   * Сессию уже не спасти: refresh не помог (INVALID_REFRESH_TOKEN), аккаунт открыли на
   * другом устройстве (SESSION_REPLACED) или refresh-токена нет. Кабинет чистит сессию.
   */
  onUnauthorized?: (error: ApiError) => void;
}): ApiClient {
  // Один refresh на всех: десять запросов, получивших 401 разом, ждут один и тот же ответ
  let refreshing: Promise<boolean> | null = null;

  async function refreshSession(): Promise<boolean> {
    const refreshToken = tokens.readRefresh();
    if (!refreshToken) return false;
    refreshing ??= (async () => {
      try {
        const response = await fetch(buildUrl(baseUrl, "/auth/refresh", undefined), {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) {
          const { message, payload, issues } = await readError(response);
          const error = new ApiError(response.status, message, payload, issues);
          // Сеть или 5xx — сессию не трогаем: это не значит, что человек вышел
          if (response.status === 401 || response.status === 400) {
            tokens.writeSession(null);
            onUnauthorized?.(error);
          }
          return false;
        }
        const pair = (await response.json()) as { accessToken?: string; refreshToken?: string };
        if (!pair.accessToken) return false;
        tokens.writeSession({ accessToken: pair.accessToken, refreshToken: pair.refreshToken ?? refreshToken });
        return true;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
    return refreshing;
  }

  async function send(path: string, options: RequestOptions) {
    const { method = "GET", body, query, anonymous, signal } = options;
    const headers = new Headers({ Accept: "application/json" });
    const token = anonymous ? null : tokens.read();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    if (body !== undefined && !isFormData) headers.set("Content-Type", "application/json");

    return fetch(buildUrl(baseUrl, path, query), {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });
  }

  async function request<T>(schema: ZodType<T>, path: string, options: RequestOptions = {}): Promise<T> {
    let response = await send(path, options);

    // Обычный 401 — access истёк: один refresh и один повтор. SESSION_REPLACED не обновляем
    if (response.status === 401 && !options.anonymous) {
      const { message, payload, issues } = await readError(response);
      const error = new ApiError(response.status, message, payload, issues);
      // Входом на другом устройстве сессия погашена, а без refresh-токена её нечем продлить
      if (error.isSessionReplaced || !tokens.readRefresh()) {
        tokens.writeSession(null);
        onUnauthorized?.(error);
        throw error;
      }
      // Неудачный refresh сам решает: погасить сессию (401) или оставить (сеть, 5xx)
      if (!(await refreshSession())) throw error;
      response = await send(path, options);
    }

    if (!response.ok) {
      const { message, payload, issues } = await readError(response);
      const error = new ApiError(response.status, message, payload, issues);
      if (response.status === 401 && !options.anonymous) {
        tokens.writeSession(null);
        onUnauthorized?.(error);
      }
      throw error;
    }

    if (response.status === 204) return schema.parse(undefined);

    const text = await response.text();
    const data = text ? (JSON.parse(text) as unknown) : undefined;
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new ApiShapeError(path, parsed.error.issues);
    return parsed.data;
  }

  return { request, tokens, baseUrl };
}
