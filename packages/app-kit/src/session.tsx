import {
  ApiError,
  ApiShapeError,
  authApi,
  createApiClient,
  createTokenStore,
  type ApiClient,
  type Session,
} from "@loal/api";
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, use, useMemo, useRef, useState, type ReactNode } from "react";

/**
 * Один источник правды о том, кто вошёл. Сессия — это ответ GET /auth/me,
 * а не содержимое токена: права проверяет сервер, фронт только рисует по ним экраны.
 */

type SessionState = {
  api: ApiClient;
  session: Session | null;
  /** loading — токен есть, профиль ещё тянем; anonymous — токена нет или он протух. */
  status: "loading" | "authenticated" | "anonymous";
  error: unknown;
  /** Почему сессия закончилась: например, вход с другого устройства. */
  endedReason: string | null;
  /** Сохранить токен после входа и сразу перечитать профиль. */
  signIn: (accessToken: string) => Promise<void>;
  logout: () => void;
};

const SessionContext = createContext<SessionState | null>(null);

export function useSession(): SessionState {
  const value = use(SessionContext);
  if (!value) throw new Error("useSession вызван вне <AppProviders>");
  return value;
}

export function useApi(): ApiClient {
  return useSession().api;
}

function SessionProvider({
  api,
  endedReason,
  clearEndedReason,
  children,
}: {
  api: ApiClient;
  endedReason: string | null;
  clearEndedReason: () => void;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(() => Boolean(api.tokens.read()));

  const query = useQuery({
    queryKey: ["session"],
    queryFn: () => authApi(api).me(),
    enabled: hasToken,
    retry: (count, error) => !(error instanceof ApiError && (error.isUnauthorized || error.isForbidden)) && count < 2,
    staleTime: 5 * 60 * 1000,
  });

  const value = useMemo<SessionState>(() => {
    const signIn = async (accessToken: string) => {
      clearEndedReason();
      api.tokens.write(accessToken);
      setHasToken(true);
      await queryClient.refetchQueries({ queryKey: ["session"] });
    };
    const logout = () => {
      clearEndedReason();
      api.tokens.write(null);
      setHasToken(false);
      queryClient.clear();
    };
    const unauthorized = query.error instanceof ApiError && query.error.isUnauthorized;
    // Токен уже недействителен — держать его в хранилище незачем
    if (unauthorized && api.tokens.read()) api.tokens.write(null);
    const status: SessionState["status"] =
      !hasToken || unauthorized ? "anonymous" : query.data ? "authenticated" : "loading";
    return { api, session: query.data ?? null, status, error: query.error, endedReason, signIn, logout };
  }, [api, clearEndedReason, endedReason, hasToken, query.data, query.error, queryClient]);

  return <SessionContext value={value}>{children}</SessionContext>;
}

/**
 * Обёртка приложения: клиент API, кэш запросов и сессия.
 * `storageKey` разный у каждого кабинета — иначе на localhost они делят один токен.
 */
export function AppProviders({
  baseUrl,
  storageKey,
  children,
}: {
  baseUrl: string;
  storageKey: string;
  children: ReactNode;
}) {
  // Сообщение о том, что аккаунт открыли на другом устройстве, показываем на экране входа.
  // Держим в хранилище: 401 часто прилетает до перезагрузки, и иначе причина потеряется.
  const reasonKey = `${storageKey}.ended-reason`;
  const [endedReason, setEndedReasonState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(reasonKey);
    } catch {
      return null;
    }
  });

  const setEndedReason = (reason: string | null) => {
    setEndedReasonState(reason);
    try {
      if (reason === null) localStorage.removeItem(reasonKey);
      else localStorage.setItem(reasonKey, reason);
    } catch {
      /* приватный режим — сообщение покажется только до перезагрузки */
    }
  };

  const queryClient = useRef<QueryClient>(null);
  queryClient.current ??= new QueryClient({
    defaultOptions: {
      queries: {
        // Повторять бессмысленно: 401 без refresh-токена требует входа заново,
        // а разошедшийся контракт сам собой не сойдётся
        retry: (count, error) =>
          !(error instanceof ApiError && error.status < 500) && !(error instanceof ApiShapeError) && count < 2,
        refetchOnWindowFocus: false,
      },
    },
  });

  const api = useRef<ApiClient>(null);
  api.current ??= createApiClient({
    baseUrl,
    tokens: createTokenStore(storageKey),
    onUnauthorized: (error) => {
      // Токен протух или сессию перебили входом с другого устройства
      createTokenStore(storageKey).write(null);
      queryClient.current?.setQueryData(["session"], undefined);
      if (error?.isSessionReplaced) {
        setEndedReason(error.message || "Аккаунт открыт на другом устройстве. Войдите снова.");
      }
    },
  });

  return (
    <QueryClientProvider client={queryClient.current}>
      <SessionProvider api={api.current} endedReason={endedReason} clearEndedReason={() => setEndedReason(null)}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
}

/** Вход по почте и паролю: сохранили токен — сразу подтянули профиль. */
export function useLogin() {
  const { api, signIn } = useSession();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) => authApi(api).login(input),
    onSuccess: (tokens) => signIn(tokens.accessToken),
  });
}

/** Запрос кода в WhatsApp. Повтор раньше минуты — 429 с текстом, сколько ждать. */
export function useRequestOtp() {
  const { api } = useSession();
  return useMutation({ mutationFn: (input: { phone: string }) => authApi(api).requestOtp(input) });
}

/** Регистрация клиента по телефону и коду: сразу выдаёт токен. */
export function useRegisterByPhone() {
  const { api, signIn } = useSession();
  return useMutation({
    mutationFn: (input: { phone: string; otp: string }) => authApi(api).registerByPhone(input),
    onSuccess: (tokens) => signIn(tokens.accessToken),
  });
}

export function useLoginByOtp() {
  const { api, signIn } = useSession();
  return useMutation({
    mutationFn: (input: { phone: string; otp: string }) => authApi(api).loginByOtp(input),
    onSuccess: (tokens) => signIn(tokens.accessToken),
  });
}
