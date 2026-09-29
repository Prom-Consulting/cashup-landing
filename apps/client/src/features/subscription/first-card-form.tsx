import { CreditCardIcon, GiftIcon, Store01Icon, Wallet01Icon } from "@hugeicons/core-free-icons";
import {
  ApiError,
  paySubscriptionByPhoneInputSchema,
  type PaySubscriptionByPhoneInput,
  type SubscriptionOffer,
} from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { useProfile } from "@loal/app-kit";
import { PhoneInput } from "@loal/ui/inputs";
import { Button, FormStatus, Icon, Input, Label, Loading } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { useState, type ReactNode } from "react";
import {
  usePayForSubscription,
  usePaySubscriptionByPhone,
  usePublicOffer,
  useSubscriptionOffer,
} from "../../entities/me/api";
import { SUBSCRIPTION_PRICE_KGS } from "../../shared/config/env";
import { rememberPayment } from "../../shared/lib/pending-payment";

const money = new Intl.NumberFormat("ru-RU");

const perks = (balance: number) => [
  {
    icon: GiftIcon,
    title: `${money.format(balance)} бонусов сразу`,
    text: "Приходят на карту, как только пройдёт оплата.",
  },
  {
    icon: Wallet01Icon,
    title: "Карта в Apple и Google Wallet",
    text: "Появится сразу после оплаты — показываете QR на кассе.",
  },
  {
    icon: Store01Icon,
    title: "Тратите у партнёров Loal",
    text: "Бонусами закрываете часть чека, остальное — как обычно.",
  },
];

/** Как будет выглядеть карта: имя держателя подставляется, пока его печатают. */
function CardPreview({ name, balance }: { name: string; balance: number }) {
  return (
    <div
      aria-hidden="true"
      className="relative overflow-hidden rounded-[28px] bg-graphite p-6 text-white shadow-[0_1.5rem_3rem_rgb(22_21_21/0.25)]"
    >
      <div className="brand-gradient pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full opacity-40 blur-3xl" />
      <div className="relative flex items-baseline justify-between">
        <span className="text-2xl font-bold">Loal</span>
        <span className="text-sm text-slate-soft">Бонусы по подписке</span>
      </div>
      <p className="relative mt-8 text-sm text-slate-soft">
        {name.trim() ? `${name.trim()}, ваш баланс` : "Ваш баланс"}
      </p>
      <p className="display relative text-[3.2rem] leading-none text-amber tabular-nums">{money.format(balance)}</p>
      <p className="relative mt-1 text-base text-slate-soft">бонусов сразу после оплаты</p>
    </div>
  );
}

/** Левая колонка: что человек получит. Одинакова для обеих оплат. */
function Intro({ name, balance }: { name: string; balance: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div>
        <h1 className="display text-[clamp(2rem,7vw,3rem)] leading-[1.05]">Ваша карта Loal ждёт</h1>
        <p className="mt-3 max-w-[46ch] text-lg leading-snug text-muted-foreground">
          Оформите подписку — карта появится в Apple Wallet или Google Wallet сразу после оплаты.
        </p>
      </div>
      <CardPreview name={name} balance={balance} />
      <ul className="flex flex-col gap-4">
        {perks(balance).map((perk) => (
          <li key={perk.title} className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary">
              <Icon icon={perk.icon} size={22} />
            </span>
            <span>
              <span className="block text-base font-bold">{perk.title}</span>
              <span className="block text-base leading-snug text-muted-foreground">{perk.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start lg:gap-12">
      {children}
    </div>
  );
}

const panel =
  "flex flex-col gap-5 rounded-[28px] bg-surface p-6 shadow-[0_1rem_2.5rem_rgb(22_21_21/0.08)] sm:p-7 lg:sticky lg:top-12";

function days(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} день`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} дня`;
  return `${n} дней`;
}

/**
 * Первая карта через подписку v2: сервер сам выпустит карту на телефон аккаунта при оплате,
 * поэтому полей нет — только условия с сервера и одна кнопка.
 */
function FirstCardV2({ offer, onOfferChanged }: { offer: SubscriptionOffer; onOfferChanged: () => Promise<unknown> }) {
  const pay = usePayForSubscription();
  const [problem, setProblem] = useState<string>();

  const start = async () => {
    setProblem(undefined);
    try {
      const payment = await pay.mutateAsync(offer.planId);
      if (!payment.paymentUrl) return setProblem("Счёт создан, но ссылка на оплату не пришла. Напишите нам.");
      rememberPayment(payment.id);
      window.location.assign(payment.paymentUrl);
    } catch (error) {
      if (error instanceof ApiError && error.code === "SUBSCRIPTION_OFFER_CHANGED") {
        await onOfferChanged();
        return setProblem("Условия подписки только что обновились — проверьте их и оплатите снова.");
      }
      if (error instanceof ApiError && error.code === "PHONE_REQUIRED")
        return setProblem("К аккаунту не привязан телефон, а карта выпускается на него. Выйдите и войдите по номеру.");
      setProblem(error instanceof Error ? error.message : "Не удалось создать счёт. Попробуйте ещё раз.");
    }
  };

  return (
    <Layout>
      <Intro name="" balance={offer.cycleBalance} />
      <div className={panel}>
        <h2 className="text-xl font-bold">Оформить подписку</h2>
        <div className="rounded-[24px] bg-graphite p-6 text-white">
          <p className="display text-[2.6rem] leading-none tabular-nums">
            {money.format(offer.price)} <span className="text-2xl">сом</span>
          </p>
          <p className="mt-2 text-lg text-slate-soft">за {days(offer.cycleDays)}</p>
          <p className="mt-5 text-2xl font-bold text-amber tabular-nums">{money.format(offer.cycleBalance)} бонусов</p>
          <p className="text-base text-slate-soft">на карту сразу после оплаты</p>
        </div>
        <p className="text-base leading-snug text-muted-foreground">
          Карта выпустится на номер, с которым вы вошли. Когда цикл закончится, карта заморозится до продления.
        </p>
        <FormStatus message={problem} />
        <Button size="lg" disabled={pay.isPending} onClick={start}>
          <Icon icon={CreditCardIcon} />
          {pay.isPending ? "Готовим счёт…" : `Оплатить ${money.format(offer.price)} сом`}
        </Button>
        <p className="-mt-1 text-center text-sm text-muted-foreground">
          Оплата через OctōPAY. Продлить потом можно прямо с карты.
        </p>
      </div>
    </Layout>
  );
}

/**
 * Первая карта: у человека её ещё нет. Если шлюз умеет v2 (offer с intent: "initial"),
 * карту выпускает сама оплата цикла; старый шлюз отвечает на offer 404 — тогда старая
 * оплата по телефону.
 */
export function FirstCardForm({ phone }: { phone?: string | null }) {
  const offer = useSubscriptionOffer();
  // Телефон аккаунта отдаёт профиль; номер, запомненный при входе, — запасной (старый шлюз)
  const profile = useProfile();
  if (offer.isPending || profile.isPending) return <Loading rows={3} />;
  if (offer.data?.intent === "initial" && offer.data.available)
    return <FirstCardV2 offer={offer.data} onOfferChanged={() => offer.refetch()} />;
  return <LegacyFirstCardForm phone={profile.data?.phone || phone} />;
}

/**
 * Старая оплата первой карты (шлюз без v2): карта заводится вместе со счётом, поэтому
 * достаточно имени и телефона. Телефон подставлен — тот, с которым человек вошёл.
 */
function LegacyFirstCardForm({ phone }: { phone?: string | null }) {
  const pay = usePaySubscriptionByPhone();
  const publicOffer = usePublicOffer();
  const price = publicOffer.data?.price ?? SUBSCRIPTION_PRICE_KGS;
  const initialValues = { phone: phone ?? "", firstName: "", months: 1 } as PaySubscriptionByPhoneInput;

  return (
    <Formik
      initialValues={initialValues}
      validate={zodValidate(paySubscriptionByPhoneInputSchema)}
      onSubmit={async (values, helpers) => {
        helpers.setStatus(undefined);
        try {
          const invoice = await pay.mutateAsync(values);
          if (invoice.paymentUrl) {
            window.location.assign(invoice.paymentUrl);
            return;
          }
          helpers.setStatus("Счёт создан, но ссылка на оплату не пришла. Напишите нам.");
        } catch (error) {
          applyServerIssues(error, helpers, "Не удалось создать счёт. Попробуйте ещё раз.");
        } finally {
          helpers.setSubmitting(false);
        }
      }}
    >
      {(form) => {
        return (
          <Layout>
            <Intro name={form.values.firstName} balance={15_000} />

            <Form noValidate className={panel}>
              <FocusFirstError form={form} />
              <h2 className="text-xl font-bold">Оформить подписку</h2>

              <div>
                <Label htmlFor="firstName">Как вас зовут</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  autoComplete="given-name"
                  className="mt-2"
                  value={form.values.firstName}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  invalid={Boolean(fieldError(form, "firstName"))}
                />
                {fieldError(form, "firstName") && (
                  <p className="mt-2 text-base text-destructive">{fieldError(form, "firstName")}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Телефон</Label>
                <div className="mt-2">
                  <PhoneInput
                    id="phone"
                    name="phone"
                    value={form.values.phone}
                    onValueChange={(value) => form.setFieldValue("phone", value)}
                    onBlur={() => form.setFieldTouched("phone", true)}
                    invalid={Boolean(fieldError(form, "phone"))}
                  />
                </div>
                {fieldError(form, "phone") ? (
                  <p className="mt-2 text-base text-destructive">{fieldError(form, "phone")}</p>
                ) : phone && form.values.phone === phone ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Номер, с которым вы вошли. К нему привяжется карта.
                  </p>
                ) : null}
              </div>

              {/* Первая карта — одна покупка. Продлевают потом с карты, по условиям сервера */}
              <div className="flex items-baseline justify-between gap-3 rounded-2xl bg-muted px-4 py-3">
                <span className="text-base">Подписка Loal</span>
                <span className="text-lg font-bold tabular-nums">{money.format(price)} сом</span>
              </div>

              {formError(form) && (
                <p role="alert" className="text-base font-medium text-destructive">
                  {formError(form)}
                </p>
              )}

              <Button type="submit" size="lg" disabled={form.isSubmitting}>
                <Icon icon={CreditCardIcon} />
                {form.isSubmitting ? "Готовим счёт…" : `Оплатить ${money.format(price)} сом`}
              </Button>
              <p className="-mt-1 text-center text-sm text-muted-foreground">
                Оплата через OctōPAY. Продлить потом можно прямо с карты.
              </p>
            </Form>
          </Layout>
        );
      }}
    </Formik>
  );
}
