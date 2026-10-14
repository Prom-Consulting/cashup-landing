import { authApi } from "@loal/api";
import { Card, FormStatus } from "@loal/ui/shadcn";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useOtpChannels, useProfile, useSession } from "./session";

const tab = (active: boolean) =>
  `rounded-full px-5 py-2.5 text-base font-bold transition-colors disabled:opacity-60 ${
    active ? "bg-graphite text-white" : "text-muted-foreground hover:text-foreground"
  }`;

/**
 * Куда присылать уведомления о событиях (не коды входа): WhatsApp или Telegram. Почта, если она
 * есть у аккаунта, получает их всегда — её каналом не выбирают. Старый шлюз без поля — карточки нет.
 */
export function NotificationChannelCard() {
  const { api } = useSession();
  const queryClient = useQueryClient();
  const profile = useProfile();
  const channels = useOtpChannels();
  const [saved, setSaved] = useState(false);
  const save = useMutation({
    mutationFn: (channel: "whatsapp" | "telegram") => authApi(api).setNotificationChannel(channel),
    onSuccess: () => {
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ["session", "profile"] });
    },
  });
  const settings = profile.data?.notifications;
  if (!settings) return null;
  const channel = save.variables && save.isPending ? save.variables : settings.channel;

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold">Уведомления</h2>
        <p className="mt-1 max-w-[60ch] text-base text-muted-foreground">
          Куда присылать сообщения о событиях — например, что заведение сменило тариф. Коды входа это не меняет.
          {settings.email ? ` Копия всегда уходит на ${settings.email}.` : ""}
        </p>
      </div>
      <div role="radiogroup" aria-label="Канал уведомлений" className="flex w-fit gap-1 rounded-full bg-muted p-1">
        {(["whatsapp", "telegram"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={channel === option}
            disabled={save.isPending || (option === "telegram" && !channels.telegram)}
            onClick={() => {
              setSaved(false);
              save.mutate(option);
            }}
            className={tab(channel === option)}
          >
            {option === "whatsapp" ? "WhatsApp" : "Telegram"}
          </button>
        ))}
      </div>
      <FormStatus message={save.isError ? "Не удалось сохранить — попробуйте ещё раз." : undefined} />
      <FormStatus tone="success" message={saved && !save.isPending ? "Сохранено" : undefined} />
    </Card>
  );
}
