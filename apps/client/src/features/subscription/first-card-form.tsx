import { CreditCardIcon, GiftIcon, Store01Icon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { paySubscriptionByPhoneInputSchema, type PaySubscriptionByPhoneInput } from "@loal/api";
import { FocusFirstError, applyServerIssues, fieldError, formError, zodValidate } from "@loal/forms";
import { PhoneInput } from "@loal/ui/inputs";
import { Button, Icon, Input, Label } from "@loal/ui/shadcn";
import { Form, Formik } from "formik";
import { usePaySubscriptionByPhone } from "../../entities/me/api";
import { SUBSCRIPTION_PRICE_KGS } from "../../shared/config/env";

const money = new Intl.NumberFormat("ru-RU");

const perks = [
  { icon: GiftIcon, title: "15 000 бонусов сразу", text: "Приходят на карту, как только пройдёт оплата." },
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
function CardPreview({ name }: { name: string }) {
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
      <p className="display relative text-[3.2rem] leading-none text-amber tabular-nums">15 000</p>
      <p className="relative mt-1 text-base text-slate-soft">бонусов сразу после оплаты</p>
    </div>
  );
}

/**
 * Первая карта: у человека её ещё нет. Карта заводится вместе со счётом, поэтому
 * достаточно имени и телефона — после оплаты она появится в Wallet. Телефон
 * подставлен: тот, с которым человек вошёл.
 */
export function FirstCardForm({ phone }: { phone?: string | null }) {
  const pay = usePaySubscriptionByPhone();
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
        const total = SUBSCRIPTION_PRICE_KGS;
        return (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start lg:gap-12">
            <div className="flex min-w-0 flex-col gap-6">
              <div>
                <h1 className="display text-[clamp(2rem,7vw,3rem)] leading-[1.05]">Ваша карта Loal ждёт</h1>
                <p className="mt-3 max-w-[46ch] text-lg leading-snug text-muted-foreground">
                  Оформите подписку — карта появится в Apple Wallet или Google Wallet сразу после оплаты.
                </p>
              </div>
              <CardPreview name={form.values.firstName} />
              <ul className="flex flex-col gap-4">
                {perks.map((perk) => (
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

            <Form
              noValidate
              className="flex flex-col gap-5 rounded-[28px] bg-surface p-6 shadow-[0_1rem_2.5rem_rgb(22_21_21/0.08)] sm:p-7 lg:sticky lg:top-12"
            >
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
                <span className="text-lg font-bold tabular-nums">{money.format(SUBSCRIPTION_PRICE_KGS)} сом</span>
              </div>

              {formError(form) && (
                <p role="alert" className="text-base font-medium text-destructive">
                  {formError(form)}
                </p>
              )}

              <Button type="submit" size="lg" disabled={form.isSubmitting}>
                <Icon icon={CreditCardIcon} />
                {form.isSubmitting ? "Готовим счёт…" : `Оплатить ${money.format(total)} сом`}
              </Button>
              <p className="-mt-1 text-center text-sm text-muted-foreground">
                Оплата через OctōPAY. Продлить потом можно прямо с карты.
              </p>
            </Form>
          </div>
        );
      }}
    </Formik>
  );
}
