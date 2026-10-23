/**
 * Правовые документы Loal живут страницами на сайте (loal.kg/legal/*). Кабинеты —
 * это закрытые от индексации SPA, поэтому не дублируют тексты, а ссылаются на сайт.
 * Каждый кабинет передаёт свой `siteUrl` (shared/config/env), чтобы не хардкодить домен.
 */

export type LegalSlug = "user-agreement" | "privacy" | "program-rules" | "data-consent";

export const LEGAL_LINKS: { slug: LegalSlug; label: string }[] = [
  { slug: "user-agreement", label: "Пользовательское соглашение" },
  { slug: "privacy", label: "Политика конфиденциальности" },
  { slug: "program-rules", label: "Правила программы" },
  { slug: "data-consent", label: "Согласие на обработку ПД" },
];

export const legalUrl = (siteUrl: string, slug: LegalSlug) => `${siteUrl.replace(/\/$/, "")}/legal/${slug}`;

function Doc({ siteUrl, slug, children }: { siteUrl: string; slug: LegalSlug; children: string }) {
  return (
    <a
      href={legalUrl(siteUrl, slug)}
      target="_blank"
      rel="noopener"
      className="font-medium text-flame-ink underline-offset-4 hover:underline"
    >
      {children}
    </a>
  );
}

/**
 * Строка-уведомление под кнопкой регистрации: отправка и есть акцепт, здесь только
 * показываем, с чем человек соглашается. `action` — надпись на кнопке.
 */
export function ConsentNote({ siteUrl, action }: { siteUrl: string; action: string }) {
  return (
    <p className="text-sm leading-relaxed text-slate">
      Нажимая «{action}», вы принимаете <Doc siteUrl={siteUrl} slug="user-agreement">Пользовательское соглашение</Doc>{" "}
      и <Doc siteUrl={siteUrl} slug="privacy">Политику конфиденциальности</Doc> и даёте{" "}
      <Doc siteUrl={siteUrl} slug="data-consent">Согласие на обработку персональных данных</Doc>.
    </p>
  );
}

/** Список ссылок на все документы — для подвала или раздела «Настройки» кабинета. */
export function LegalLinks({ siteUrl, className = "" }: { siteUrl: string; className?: string }) {
  return (
    <nav aria-label="Правовые документы" className={`flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate ${className}`}>
      {LEGAL_LINKS.map((item) => (
        <a
          key={item.slug}
          href={legalUrl(siteUrl, item.slug)}
          target="_blank"
          rel="noopener"
          className="underline-offset-4 hover:text-flame-ink hover:underline"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
