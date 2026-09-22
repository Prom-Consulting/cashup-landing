"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Field } from "../_components/ui/field";
import { Button, ChoiceCards, PhoneInput, Spinner, Textarea, TextInput } from "../_components/ui/inputs";
import { Select } from "../_components/ui/select";
import { categories } from "../_data/partners";
import { EMAIL } from "../_data/site";

gsap.registerPlugin(useGSAP);

const plans = [
  { id: "loyalty", label: "Только лояльность", note: "40 $ в месяц" },
  { id: "bundle", label: "OctōPAY + лояльность", note: "без абонентской платы" },
  { id: "octopay", label: "Только OctōPAY", note: "комиссия с оборота" },
] as const;

type PlanId = (typeof plans)[number]["id"];
type FieldName = "name" | "category" | "contact" | "phone" | "comment";

const empty = { name: "", category: "", contact: "", phone: "", comment: "" };
type Values = typeof empty;

// Проверки полей. Возвращают текст ошибки или пустую строку.
const rules: Record<FieldName, (v: Values) => string> = {
  name: ({ name }) => {
    const value = name.trim();
    if (!value) return "Напишите название заведения";
    if (value.length < 2) return "Слишком короткое название";
    if (value.length > 60) return "Не длиннее 60 символов";
    return "";
  },
  category: ({ category }) => (category ? "" : "Выберите категорию"),
  contact: ({ contact }) => {
    const value = contact.trim();
    if (!value) return "Как к вам обращаться?";
    if (value.length < 2) return "Слишком короткое имя";
    if (!/^[А-Яа-яЁёA-Za-z\s-]+$/.test(value)) return "Только буквы, пробел и дефис";
    return "";
  },
  phone: ({ phone }) => {
    const digits = phone.replace(/\D/g, "").replace(/^996/, "");
    if (!digits) return "Оставьте телефон для связи";
    if (digits.length < 9) return "В номере 9 цифр после +996";
    if (!/^[2-9]/.test(digits)) return "Проверьте код оператора";
    return "";
  },
  comment: ({ comment }) => (comment.length > 500 ? "Не длиннее 500 символов" : ""),
};

const order: FieldName[] = ["name", "category", "contact", "phone", "comment"];

// TODO: send to the Loal admin API when it is ready; for now the form only validates locally.
export function PartnerForm() {
  const [plan, setPlan] = useState<PlanId>("bundle");
  const [values, setValues] = useState<Values>(empty);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ name: string } | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sent || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(root.current!.querySelector("[data-sent]"), { y: 24, autoAlpha: 0, duration: 0.6, ease: "power3.out" });
    },
    { scope: root, dependencies: [sent], revertOnUpdate: false },
  );

  const set = (field: FieldName) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    // Ошибку убираем сразу, как только человек начал править поле.
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  };

  const check = (field: FieldName) => () => {
    setValues((v) => {
      const message = rules[field](v);
      setErrors((e) => ({ ...e, [field]: message || undefined }));
      return v;
    });
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found: Partial<Record<FieldName, string>> = {};
    for (const field of order) {
      const message = rules[field](values);
      if (message) found[field] = message;
    }
    setErrors(found);

    const firstBad = order.find((f) => found[f]);
    if (firstBad) {
      const el = root.current?.querySelector<HTMLElement>(`[data-field="${firstBad}"] :is(input, textarea, button)`);
      el?.focus();
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setSending(true);
    await new Promise((r) => setTimeout(r, 600)); // заглушка вместо запроса
    setSending(false);
    setSent({ name: values.name.trim() });
  };

  const badCount = order.filter((f) => errors[f]).length;

  if (sent) {
    return (
      <div ref={root} className="rounded-[32px] border-2 border-graphite bg-paper p-8 sm:p-12">
        <div data-sent>
          <p className="display text-[clamp(1.74rem,3.47vw,2.76rem)] text-flame">Заявка принята</p>
          <p className="mt-4 max-w-[48ch] text-lg leading-relaxed">
            Мы свяжемся с вами в рабочее время, поможем выбрать модель и настроим кабинет. Заведение «{sent.name}»
            появится в каталоге после первой оплаты.
          </p>
          <p className="mt-6 text-sm opacity-70">
            Пока форма ничего не отправляет: она заработает вместе с кабинетом партнёра. Срочные вопросы —{" "}
            <a href={`mailto:${EMAIL}`} className="text-flame-ink underline-offset-4 hover:underline">
              {EMAIL}
            </a>
            .
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-8"
            onClick={() => {
              setValues(empty);
              setSent(null);
            }}
          >
            Отправить ещё одну
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={root} className="rounded-[32px] border-2 border-graphite bg-paper p-6 sm:p-10">
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <ChoiceCards name="plan" legend="Что подключаем" value={plan} onChange={setPlan} options={[...plans]} />

        <div className="grid gap-6 sm:grid-cols-2">
          <div data-field="name">
            <Field label="Название заведения" error={errors.name}>
              {(parts) => (
                <TextInput
                  {...parts}
                  name="name"
                  placeholder="Dolce Vita"
                  maxLength={60}
                  value={values.name}
                  onChange={(e) => set("name")(e.target.value)}
                  onBlur={check("name")}
                />
              )}
            </Field>
          </div>

          <div data-field="category">
            <Field label="Категория" error={errors.category}>
              {(parts) => (
                <Select
                  {...parts}
                  value={values.category}
                  onChange={set("category")}
                  onBlur={check("category")}
                  options={categories.map((c) => ({ id: c.id, label: c.label }))}
                  placeholder="Выберите категорию"
                />
              )}
            </Field>
          </div>

          <div data-field="contact">
            <Field label="Контактное лицо" error={errors.contact}>
              {(parts) => (
                <TextInput
                  {...parts}
                  name="contact"
                  placeholder="Азамат"
                  autoComplete="name"
                  value={values.contact}
                  onChange={(e) => set("contact")(e.target.value)}
                  onBlur={check("contact")}
                />
              )}
            </Field>
          </div>

          <div data-field="phone">
            <Field label="Телефон" hint="Позвоним в рабочее время" error={errors.phone}>
              {(parts) => (
                <PhoneInput
                  {...parts}
                  value={values.phone}
                  onValueChange={set("phone")}
                  onBlur={check("phone")}
                />
              )}
            </Field>
          </div>
        </div>

        <div data-field="comment">
          <Field label="Комментарий" optional error={errors.comment}>
            {(parts) => (
              <Textarea
                {...parts}
                value={values.comment}
                onValueChange={set("comment")}
                onBlur={check("comment")}
                placeholder="Сколько точек, какой процент планируете, когда удобно созвониться"
              />
            )}
          </Field>
        </div>

        <p aria-live="polite" className="sr-only">
          {badCount > 0 ? `Не заполнено полей: ${badCount}` : ""}
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button type="submit" disabled={sending} className="gap-3">
            {sending && <Spinner />}
            {sending ? "Отправляем" : "Отправить заявку"}
          </Button>
          <p className="max-w-[40ch] text-sm opacity-75">
            Перезвоним в рабочее время, поможем выбрать модель и настроить процент.
          </p>
        </div>
      </form>
    </div>
  );
}
