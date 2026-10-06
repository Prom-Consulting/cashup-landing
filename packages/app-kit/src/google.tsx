import { ApiError, authApi } from "@loal/api";
import { Button, ConfirmDialog, FormStatus, Loading } from "@loal/ui/shadcn";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useProfile, useSession } from "./session";

/**
 * Вход через Google для сотрудников магазинов (docs/API.md, «Вход через Google»). Кнопку рисует
 * Google Identity Services: он отдаёт idToken, его шлём серверу, а тот проверяет подпись и
 * то, что токен выпущен нашему клиенту. Клиент кабинета — Web client ID из GOOGLE_CLIENT_IDS бэкенда.
 */

type GoogleId = {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    ux_mode?: "popup";
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_button?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
  disableAutoSelect: () => void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } };
  }
}

let script: Promise<GoogleId> | null = null;

/** Скрипт Google грузим один раз и только там, где есть кнопка. */
function loadGoogle(): Promise<GoogleId> {
  script ??= new Promise<GoogleId>((resolve, reject) => {
    const ready = () => (window.google?.accounts?.id ? resolve(window.google.accounts.id) : reject(new Error("no gis")));
    if (window.google?.accounts?.id) return ready();
    const tag = document.createElement("script");
    tag.src = "https://accounts.google.com/gsi/client";
    tag.async = true;
    tag.onload = ready;
    tag.onerror = () => reject(new Error("gis blocked"));
    document.head.append(tag);
  }).catch((error: unknown) => {
    script = null; // следующая попытка — заново
    throw error;
  });
  return script;
}

/**
 * GIS держит на странице один обработчик — тот, что передали в initialize. Кабинет — одностраничное
 * приложение: со входа человек переходит в профиль, и если каждая кнопка вызывает initialize,
 * токен из профиля мог уйти в обработчик входа (привязка превращалась во вход и 404).
 * Поэтому initialize — один раз на clientId, а токен получает кнопка, которая сейчас на экране.
 */
let initializedFor: string | null = null;
let activeHandler: ((idToken: string) => void) | null = null;

function ensureInitialized(google: GoogleId, clientId: string) {
  if (initializedFor === clientId) return;
  initializedFor = clientId;
  google.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response.credential) activeHandler?.(response.credential);
    },
    ux_mode: "popup",
    auto_select: false,
    cancel_on_tap_outside: true,
    use_fedcm_for_button: true,
  });
}

/** Официальная кнопка Google. Пока она на экране, токен из Google получает она. */
function GoogleButton({
  clientId,
  text,
  onCredential,
}: {
  clientId: string;
  text: "signin_with" | "continue_with";
  onCredential: (idToken: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const handler = useRef(onCredential);
  handler.current = onCredential;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    // Эта кнопка на экране — токен идёт ей
    const own = (idToken: string) => handler.current(idToken);
    activeHandler = own;
    loadGoogle()
      .then((google) => {
        if (!alive || !box.current) return;
        ensureInitialized(google, clientId);
        google.renderButton(box.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text,
          logo_alignment: "center",
          locale: "ru",
          // Google принимает ширину в пикселях, от 200 до 400
          width: Math.max(200, Math.min(400, Math.round(box.current.clientWidth || 320))),
        });
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      if (activeHandler === own) activeHandler = null;
    };
  }, [clientId, text]);

  if (failed)
    return (
      <p className="text-base text-muted-foreground">
        Кнопка Google не загрузилась — проверьте интернет или блокировщик рекламы и обновите страницу.
      </p>
    );
  return (
<div ref={box} className="flex min-h-11 w-full justify-center" />
  );
}

function googleSignInError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "GOOGLE_NOT_LINKED")
      // Свой текст, а не message сервера: в кабинете раздел называется «Настройки»
      return "Этот Google ещё не привязан. Войдите по номеру и привяжите Google в «Настройках».";
    if (error.code === "NOT_BUSINESS_ACCOUNT")
      return error.message || "Вход через Google — только для сотрудников магазинов.";
    if (error.code === "INVALID_GOOGLE_TOKEN") return "Не удалось войти через Google. Попробуйте ещё раз.";
    if (error.code === "GOOGLE_UNAVAILABLE") return "Google сейчас недоступен. Попробуйте позже или войдите по номеру.";
    if (error.status === 401) return "Аккаунт недоступен";
    return error.message;
  }
  return "Не удалось войти через Google";
}

/**
 * «Войти через Google» под формой входа. Без clientId (не задан при сборке) и после
 * 503 GOOGLE_SIGN_IN_DISABLED кнопки нет — вход по номеру остаётся основным.
 */
export function GoogleSignIn({ clientId, onDone }: { clientId?: string; onDone?: () => void }) {
  const { api, signIn } = useSession();
  const [error, setError] = useState<string>();
  const [disabled, setDisabled] = useState(false);
  const login = useMutation({
    mutationFn: (idToken: string) => authApi(api).loginWithGoogle(idToken),
    onSuccess: (tokens) => signIn(tokens),
  });

  if (!clientId || disabled) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-base text-muted-foreground" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        или
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton
        clientId={clientId}
        text="signin_with"
        onCredential={async (idToken) => {
          setError(undefined);
          try {
            await login.mutateAsync(idToken);
            onDone?.();
          } catch (reason) {
            if (reason instanceof ApiError && reason.code === "GOOGLE_SIGN_IN_DISABLED") return setDisabled(true);
            setError(googleSignInError(reason));
          }
        }}
      />
      {login.isPending && <p className="text-center text-base text-muted-foreground">Входим…</p>}
      <FormStatus message={error} />
      <p className="text-center text-sm text-muted-foreground">
        Google работает после привязки в «Настройках». Первый вход — по номеру.
      </p>
    </div>
  );
}

function googleLinkError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "IDENTITY_TAKEN")
      return "Этот Google уже привязан к другому человеку — или у вас привязан другой. Сначала отвяжите прежний.";
    if (error.code === "NOT_BUSINESS_ACCOUNT") return "Google можно привязать только сотруднику магазина.";
    if (error.code === "INVALID_GOOGLE_TOKEN") return "Google не подтвердил вход. Попробуйте ещё раз.";
    if (error.code === "GOOGLE_SIGN_IN_DISABLED") return "Вход через Google пока не включён.";
    if (error.code === "GOOGLE_UNAVAILABLE") return "Google сейчас недоступен. Попробуйте позже.";
    return error.message;
  }
  return "Не удалось привязать Google";
}

/**
 * Карточка «Вход через Google» в настройках: привязать свой Google, увидеть, какой привязан, отвязать.
 * Состояние — поле `google` в `GET /auth/me/profile`.
 */
export function GoogleLink({ clientId }: { clientId?: string }) {
  const { api } = useSession();
  const profile = useProfile();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState<string>();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["session", "profile"] });
  const link = useMutation({ mutationFn: (idToken: string) => authApi(api).linkGoogle(idToken), onSuccess: refresh });
  const unlink = useMutation({ mutationFn: () => authApi(api).unlinkGoogle(), onSuccess: refresh });

  if (profile.isPending) return <Loading rows={1} />;
  const linked = profile.data?.google ?? null;

  if (linked)
    return (
      <div className="mt-3 flex flex-col gap-4">
        <p className="text-lg">
          Привязан <span className="font-bold break-all">{linked.email ?? "аккаунт Google"}</span>. На экране входа
          нажмите «Войти через Google».
        </p>
        <FormStatus tone="success" message={saved} />
        <ConfirmDialog
          trigger={
            <Button variant="outline" className="self-start">
              Отвязать Google
            </Button>
          }
          title="Отвязать Google?"
          description="Войти через этот Google больше не получится — только по номеру и коду. Привязать можно снова в любой момент."
          confirmLabel="Отвязать"
          onConfirm={async () => {
            setSaved(undefined);
            await unlink.mutateAsync();
          }}
        />
      </div>
    );

  return (
    <div className="mt-3 flex flex-col gap-4">
      <p className="text-lg text-muted-foreground">
        Привяжите свой Google — и входите одной кнопкой, без кода из WhatsApp. Номер телефона остаётся рабочим входом.
      </p>
      {clientId ? (
        <div className="max-w-[360px]">
          <GoogleButton
            clientId={clientId}
            text="continue_with"
            onCredential={async (idToken) => {
              setError(undefined);
              try {
                const result = await link.mutateAsync(idToken);
                setSaved(result.google.email ? `Google ${result.google.email} привязан` : "Google привязан");
              } catch (reason) {
                setError(googleLinkError(reason));
              }
            }}
          />
        </div>
      ) : (
        <p className="text-base text-muted-foreground">Вход через Google пока не включён.</p>
      )}
      {link.isPending && <p className="text-base text-muted-foreground">Привязываем…</p>}
      <FormStatus message={error} />
    </div>
  );
}
