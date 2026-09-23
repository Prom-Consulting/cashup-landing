import type { ZodType } from "zod";

/** Ошибка запроса: статус нужен экранам, чтобы отличить 401 от 422 и от сети. */
export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }

  /** Токен протух или его нет — кабинет должен отправить на вход. */
  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
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
  read: () => string | null;
  write: (token: string | null) => void;
};

/**
 * Токен держим в localStorage: у бэкенда нет refresh и нет httpOnly-cookie,
 * выдаётся один access на 12 часов. Ключ разный у каждого кабинета, чтобы
 * сессии партнёра и админа не перетирали друг друга на одном домене разработки.
 */
export function createTokenStore(key: string): TokenStore {
  return {
    read() {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    write(token) {
      try {
        if (token === null) localStorage.removeItem(key);
        else localStorage.setItem(key, token);
      } catch {
        /* приватный режим — просто живём без запоминания */
      }
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
async function readError(response: Response): Promise<{ message: string; payload: unknown }> {
  const text = await response.text().catch(() => "");
  if (!text) return { message: `Ошибка ${response.status}`, payload: undefined };
  try {
    const payload = JSON.parse(text) as Record<string, unknown>;
    const raw = payload.message ?? payload.error ?? payload.detail;
    const message = Array.isArray(raw) ? raw.join(", ") : typeof raw === "string" ? raw : `Ошибка ${response.status}`;
    return { message, payload };
  } catch {
    return { message: text.slice(0, 300), payload: text };
  }
}

export function createApiClient({
  baseUrl,
  tokens,
  onUnauthorized,
}: {
  baseUrl: string;
  tokens: TokenStore;
  /** Вызывается один раз на каждый 401 — кабинет чистит сессию и уводит на вход. */
  onUnauthorized?: () => void;
}): ApiClient {
  async function request<T>(schema: ZodType<T>, path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, query, anonymous, signal } = options;
    const headers = new Headers({ Accept: "application/json" });
    const token = anonymous ? null : tokens.read();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    if (body !== undefined && !isFormData) headers.set("Content-Type", "application/json");

    const response = await fetch(buildUrl(baseUrl, path, query), {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });

    if (!response.ok) {
      const { message, payload } = await readError(response);
      if (response.status === 401) onUnauthorized?.();
      throw new ApiError(response.status, message, payload);
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
