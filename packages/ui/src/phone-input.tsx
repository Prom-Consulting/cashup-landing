"use client";

import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * Телефон с выбором страны. Значение — как его хранит бэкенд: код страны и номер
 * цифрами, «996700123456». Формат на лету и проверка — по правилам страны
 * (libphonenumber, та же библиотека, что на сервере).
 */

const DEFAULT_COUNTRY: CountryCode = "KG";
/** Сначала страны, откуда к нам чаще всего звонят, дальше — по алфавиту. */
const PRIORITY: CountryCode[] = ["KG", "KZ", "UZ", "RU", "TJ", "TR"];

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(["ru"], { type: "region" });
  } catch {
    return null;
  }
})();

const countryName = (code: CountryCode) => regionNames?.of(code) ?? code;
const flag = (code: CountryCode) => String.fromCodePoint(...[...code].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65));

type Country = { code: CountryCode; dial: string; name: string };

let countriesCache: Country[] | null = null;
function countries(): Country[] {
  if (countriesCache) return countriesCache;
  const rest = getCountries()
    .filter((code) => !PRIORITY.includes(code))
    .sort((a, b) => countryName(a).localeCompare(countryName(b), "ru"));
  countriesCache = [...PRIORITY, ...rest].map((code) => ({
    code,
    dial: getCountryCallingCode(code),
    name: countryName(code),
  }));
  return countriesCache;
}

/** Из сохранённого значения («996700…», «+7 701 …») — страна и номер внутри неё. */
function split(value: string, preferred: CountryCode): { country: CountryCode; national: string } {
  const digits = value.replace(/\D/g, "");
  if (!digits) return { country: preferred, national: "" };
  const preferredDial = getCountryCallingCode(preferred);
  // Код совпадает с выбранной страной — оставляем её (у +7 и России, и Казахстана)
  if (digits.startsWith(preferredDial)) return { country: preferred, national: digits.slice(preferredDial.length) };
  const parsed = parsePhoneNumberFromString(`+${digits}`);
  if (parsed?.country) return { country: parsed.country, national: parsed.nationalNumber };
  const byDial = countries().find((country) => digits.startsWith(country.dial));
  return byDial
    ? { country: byDial.code, national: digits.slice(byDial.dial.length) }
    : { country: preferred, national: digits };
}

/** Номер для отправки: код страны и цифры номера; ведущий «0» или «8» внутри страны отбрасываем. */
function join(country: CountryCode, nationalDigits: string) {
  if (!nationalDigits) return "";
  const dial = getCountryCallingCode(country);
  const parsed = parsePhoneNumberFromString(nationalDigits, country);
  const national = parsed?.nationalNumber ?? nationalDigits.replace(/^0/, "");
  return national ? `${dial}${national}` : "";
}

/**
 * Номер внутри страны, разбитый на группы. Форматируем как международный и убираем
 * код: у части стран (у Кыргызстана тоже) внутренний формат требует ведущий «0»,
 * без него библиотека цифры не группирует. Код страны и так виден на кнопке слева.
 */
function display(country: CountryCode, national: string) {
  if (!national) return "";
  const dial = getCountryCallingCode(country);
  const international = new AsYouType(country).input(`+${dial}${national}`);
  return international.replace(new RegExp(`^\\+${dial}\\s?`), "");
}

const example = (country: CountryCode) => {
  const number = getExampleNumber(country, examples);
  return number ? display(country, number.nationalNumber) : "";
};

/** Сохранённый номер красиво: «+996 700 123 456», «+7 701 123 4567». */
export function formatPhoneNumber(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const parsed = parsePhoneNumberFromString(`+${digits}`);
  return parsed ? parsed.formatInternational() : `+${digits}`;
}

type PhoneInputProps = {
  id: string;
  describedBy?: string;
  invalid: boolean;
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  name?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  defaultCountry?: CountryCode;
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  {
    id,
    describedBy,
    invalid,
    value,
    onValueChange,
    onBlur,
    name,
    autoFocus,
    disabled,
    defaultCountry = DEFAULT_COUNTRY,
  },
  ref,
) {
  const [country, setCountry] = useState<CountryCode>(() => split(value, defaultCountry).country);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const listId = useId();

  // Значение поменяли снаружи (сброс формы, подстановка номера) — подстраиваем страну
  useEffect(() => {
    const next = split(value, country).country;
    if (next !== country) setCountry(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const { national } = split(value, country);
  const shown = display(country, national);
  const valid = Boolean(value) && isValidPhoneNumber(`+${value.replace(/\D/g, "")}`);
  const dial = getCountryCallingCode(country);

  const matching = useMemo(() => {
    const needle = filter.trim().toLowerCase().replace(/^\+/, "");
    if (!needle) return countries();
    return countries().filter(
      (item) =>
        item.name.toLowerCase().includes(needle) || item.dial.startsWith(needle) || item.code.toLowerCase() === needle,
    );
  }, [filter]);

  // Клик мимо списка — закрываем
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const choose = (code: CountryCode) => {
    setCountry(code);
    setOpen(false);
    setFilter("");
    onValueChange(join(code, national));
    requestAnimationFrame(() => input.current?.focus());
  };

  const onType = (raw: string) => {
    // Вставили или набрали номер с «+» — страну берём из самого номера
    if (raw.trim().startsWith("+")) {
      const typed = new AsYouType();
      typed.input(raw);
      const detected = typed.getCountry() ?? (typed.getCallingCode() ? split(raw, country).country : undefined);
      if (detected) {
        const nationalDigits = typed.getNationalNumber();
        setCountry(detected);
        onValueChange(nationalDigits ? `${getCountryCallingCode(detected)}${nationalDigits}` : "");
        return;
      }
    }
    // Номер внутри страны: не длиннее, чем бывает (15 цифр вместе с кодом)
    const digits = raw.replace(/\D/g, "").slice(0, 15 - dial.length + 1);
    onValueChange(join(country, digits));
  };

  return (
    <div ref={root} className="relative">
      <div
        className={[
          "flex h-12 w-full items-center rounded-2xl border-2 bg-surface text-lg text-foreground transition-colors",
          "focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-ring",
          invalid ? "border-destructive" : "border-border focus-within:border-foreground",
          disabled ? "opacity-60" : "",
        ].join(" ")}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setOpen(!open);
            setActive(0);
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Страна: ${countryName(country)}, +${dial}. Выбрать другую`}
          // Фокус показывает рамка всего поля; своя обводка темы тут была бы второй
          style={{ outline: "none" }}
          className="flex h-full shrink-0 items-center gap-1.5 rounded-l-2xl border-r-2 border-border pr-2.5 pl-3.5 outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            {flag(country)}
          </span>
          <span className="text-base font-medium tabular-nums">+{dial}</span>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={`h-4 w-4 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              d="m6 9 6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <input
          ref={(element) => {
            input.current = element;
            if (typeof ref === "function") ref(element);
            else if (ref) ref.current = element;
          }}
          id={id}
          name={name}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={example(country)}
          value={shown}
          onChange={(event) => onType(event.target.value)}
          onBlur={onBlur}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          style={{ outline: "none" }}
          className="h-full w-0 min-w-0 flex-1 bg-transparent px-3 tabular-nums placeholder:text-muted-foreground"
        />
        {/* Номер верный по правилам страны — тихая галочка, без слов */}
        <span
          aria-hidden="true"
          className={`mr-3 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-white transition-all duration-200 ${
            valid ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
            <path
              d="m5 12.5 4.5 4.5L19 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border-2 border-border bg-surface shadow-[0_18px_48px_rgb(22_21_21/0.18)]">
          <input
            autoFocus
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const step = event.key === "ArrowDown" ? 1 : -1;
                setActive((current) => (matching.length ? (current + step + matching.length) % matching.length : 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                const item = matching[active];
                if (item) choose(item.code);
              } else if (event.key === "Escape") {
                setOpen(false);
                input.current?.focus();
              }
            }}
            placeholder="Страна или код"
            aria-label="Найти страну"
            aria-controls={listId}
            aria-activedescendant={matching[active] ? `${listId}-${matching[active]!.code}` : undefined}
            className="h-11 w-full border-b-2 border-border bg-transparent px-4 text-base outline-none placeholder:text-muted-foreground"
          />
          <ul id={listId} role="listbox" aria-label="Страна" className="max-h-64 overflow-y-auto py-1">
            {matching.map((item, index) => (
              <li
                key={item.code}
                id={`${listId}-${item.code}`}
                role="option"
                aria-selected={item.code === country}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(item.code);
                }}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2 text-base ${
                  index === active ? "bg-muted" : ""
                } ${item.code === country ? "font-bold" : ""}`}
              >
                <span aria-hidden="true" className="text-xl leading-none">
                  {flag(item.code)}
                </span>
                <span className="min-w-0 flex-1 truncate">{item.name}</span>
                <span className="text-muted-foreground tabular-nums">+{item.dial}</span>
              </li>
            ))}
            {matching.length === 0 && <li className="px-4 py-3 text-base text-muted-foreground">Такой страны нет</li>}
          </ul>
        </div>
      )}
    </div>
  );
});
