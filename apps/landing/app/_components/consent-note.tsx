import Link from "next/link";
import { legalPath } from "../legal/docs";

/**
 * Строка-уведомление о согласии под кнопкой регистрации. Мы не выпускаем карту и
 * не создаём кабинет без принятия условий, поэтому отправка формы и есть акцепт —
 * здесь просто показываем, с чем человек соглашается, со ссылками на документы.
 * `action` — текст на кнопке («Получить код», «Зарегистрироваться»).
 */
export function ConsentNote({ action, className = "" }: { action: string; className?: string }) {
  const doc = "font-medium text-flame-ink underline-offset-4 hover:underline";
  return (
    <p className={`max-w-[52ch] text-sm leading-relaxed text-slate ${className}`}>
      Нажимая «{action}», вы принимаете{" "}
      <Link href={legalPath("user-agreement")} className={doc}>
        Пользовательское соглашение
      </Link>{" "}
      и{" "}
      <Link href={legalPath("privacy")} className={doc}>
        Политику конфиденциальности
      </Link>{" "}
      и даёте{" "}
      <Link href={legalPath("data-consent")} className={doc}>
        Согласие на обработку персональных данных
      </Link>
      .
    </p>
  );
}
