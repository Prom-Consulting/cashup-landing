import { authApi, ApiError, createApiClient, createTokenStore, type ApiClient, type Session } from "@loal/api";
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

function SessionProvider({ api, children }: { api: ApiClient; children: ReactNode }) {
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
      api.tokens.write(accessToken);
      setHasToken(true);
      await queryClient.refetchQueries({ queryKey: ["session"] });
    };
    const logout = () => {
      api.tokens.write(null);
      setHasToken(false);
      queryClient.clear();
    };
    const unauthorized = query.error instanceof ApiError && query.error.isUnauthorized;
    const status: SessionState["status"] =
      !hasToken || unauthorized ? "anonymous" : query.data ? "authenticated" : "loading";
    return { api, session: query.data ?? null, status, error: query.error, signIn, logout };
  }, [api, hasToken, query.data, query.error, queryClient]);

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
  const queryClient = useRef<QueryClient>(null);
  queryClient.current ??= new QueryClient({
    defaultOptions: {
      queries: {
        // 401 повторять бессмысленно: refresh-токена нет, нужен новый вход
        retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
        refetchOnWindowFocus: false,
      },
    },
  });

  const api = useRef<ApiClient>(null);
  api.current ??= createApiClient({
    baseUrl,
    tokens: createTokenStore(storageKey),
    onUnauthorized: () => {
      // Токен протух — чистим и даём экранам увидеть anonymous
      createTokenStore(storageKey).write(null);
      queryClient.current?.setQueryData(["session"], undefined);
    },
  });

  return (
    <QueryClientProvider client={queryClient.current}>
      <SessionProvider api={api.current}>{children}</SessionProvider>
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
  return useMutation({
    mutationFn: (input: { phone: string }) => authApi(api).requestOtp(input),
  });
}

export function useLoginByOtp() {
  const { api, signIn } = useSession();
  return useMutation({
    mutationFn: (input: { phone: string; otp: string }) => authApi(api).loginByOtp(input),
    onSuccess: (tokens) => signIn(tokens.accessToken),
  });
}
