"use client";

import { useId, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { categories } from "../_data/partners";

gsap.registerPlugin(useGSAP);

const plans = [
  { id: "loyalty", label: "Только лояльность", note: "30–50 $ в месяц" },
  { id: "bundle", label: "OctōPAY + лояльность", note: "без абонентской платы" },
  { id: "octopay", label: "Только OctōPAY", note: "комиссия с оборота" },
];

type Errors = Partial<Record<"name" | "category" | "contact" | "phone", string>>;

// TODO: send to the Loal admin API when it is ready; for now the form only validates locally.
export function PartnerForm() {
  const formId = useId();
  const [plan, setPlan] = useState("bundle");
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<{ name: string } | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sent || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(root.current!.querySelector("[data-sent]"), {
        y: 24,
        autoAlpha: 0,
        duration: 0.6,
        ease: "power3.out",
      });
    },
    { scope: root, dependencies: [sent], revertOnUpdate: false },
  );

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    const next: Errors = {};

    if (get("name").length < 2) next.name = "Напишите название заведения";
    if (!get("category")) next.category = "Выберите категорию";
    if (get("contact").length < 2) next.contact = "Как к вам обращаться?";
    const phone = get("phone").replace(/[^\d+]/g, "");
    if (phone.replace(/\D/g, "").length < 9) next.phone = "Телефон в формате +996 XXX XXX XXX";

    setErrors(next);
    if (Object.keys(next).length > 0) {
      const first = root.current?.querySelector<HTMLElement>(`[data-invalid="${Object.keys(next)[0]}"]`);
      first?.focus();
      return;
    }
    setSent({ name: get("name") });
  };

  if (sent) {
    return (
      <div ref={root} className="rounded-[32px] border-2 border-forest bg-chalk p-8 sm:p-12">
        <div data-sent>
          <p className="display text-[clamp(2.5rem,5vw,4rem)] text-magenta">Заявка принята</p>
          <p className="mt-4 max-w-[48ch] text-lg leading-relaxed">
            Мы свяжемся с вами в рабочее время, поможем выбрать модель и настроим кабинет. Заведение «{sent.name}»
            появится в каталоге после первой оплаты.
          </p>
          <p className="mt-6 text-sm opacity-70">
            Пока форма ничего не отправляет: она заработает вместе с кабинетом партнёра. Срочные вопросы —
            info@promconsult.pro.
          </p>
          <button
            type="button"
            onClick={() => setSent(null)}
            className="mt-8 rounded-[10px] border-2 border-forest px-6 py-3 font-bold transition-colors hover:bg-forest hover:text-chalk"
          >
            Отправить ещё одну
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={root} className="rounded-[32px] border-2 border-forest bg-chalk p-6 sm:p-10">
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <fieldset>
          <legend className="text-lg font-bold">Что подключаем</legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {plans.map((p) => (
              <label
                key={p.id}
                className="cursor-pointer rounded-2xl border-2 border-blush p-4 transition-colors has-[:checked]:border-magenta has-[:checked]:bg-blush/50 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-magenta"
              >
                <input
                  type="radio"
                  name="plan"
                  value={p.id}
                  checked={plan === p.id}
                  onChange={() => setPlan(p.id)}
                  className="sr-only"
                />
                <span className="block font-bold">{p.label}</span>
                <span className="mt-1 block text-sm opacity-75">{p.note}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field id={`${formId}-name`} name="name" label="Название заведения" error={errors.name} placeholder="Dolce Vita" />
          <div>
            <label htmlFor={`${formId}-category`} className="font-medium">
              Категория
            </label>
            <select
              id={`${formId}-category`}
              name="category"
              data-invalid={errors.category ? "category" : undefined}
              aria-invalid={Boolean(errors.category)}
              defaultValue=""
              className="mt-2 w-full rounded-2xl border-2 border-blush bg-chalk px-5 py-3.5 focus-visible:border-magenta focus-visible:outline-none"
            >
              <option value="" disabled>
                Выберите категорию
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.category && <p className="mt-2 text-sm font-medium text-magenta-ink">{errors.category}</p>}
          </div>
          <Field id={`${formId}-contact`} name="contact" label="Контактное лицо" error={errors.contact} placeholder="Азамат" />
          <Field
            id={`${formId}-phone`}
            name="phone"
            label="Телефон"
            type="tel"
            error={errors.phone}
            placeholder="+996 700 000 000"
          />
        </div>

        <div>
          <label htmlFor={`${formId}-comment`} className="font-medium">
            Комментарий <span className="opacity-60">— необязательно</span>
          </label>
          <textarea
            id={`${formId}-comment`}
            name="comment"
            rows={3}
            placeholder="Сколько точек, какой процент планируете, когда удобно созвониться"
            className="mt-2 w-full rounded-2xl border-2 border-blush px-5 py-3.5 focus-visible:border-magenta focus-visible:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="submit"
            className="rounded-[10px] bg-magenta-ink px-7 py-4 font-bold text-chalk transition-colors hover:bg-forest"
          >
            Отправить заявку
          </button>
          <p className="max-w-[40ch] text-sm opacity-75">
            Перезвоним в рабочее время, поможем выбрать модель и настроить процент.
          </p>
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  error,
  placeholder,
  type = "text",
}: {
  id: string;
  name: string;
  label: string;
  error?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        data-invalid={error ? name : undefined}
        aria-invalid={Boolean(error)}
        className="mt-2 w-full rounded-2xl border-2 border-blush px-5 py-3.5 focus-visible:border-magenta focus-visible:outline-none"
      />
      {error && <p className="mt-2 text-sm font-medium text-magenta-ink">{error}</p>}
    </div>
  );
}
