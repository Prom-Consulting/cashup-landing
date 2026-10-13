import type { AuditLog } from "@loal/api";

/**
 * Запись журнала по-русски: что произошло и подробности из `diff`. Действие, которого здесь
 * ещё нет, показываем как есть — лучше код, чем пустая строка.
 */
const ACTION_LABELS: Record<string, string> = {
  "merchant.created": "Заведение создано",
  "merchant.onboarded": "Заведение зарегистрировано по анкете",
  "merchant.activated": "Заведение подтверждено",
  "merchant.suspended": "Заведение приостановлено",
  "merchant.rejected": "Заявка заведения отклонена",
  "merchant.deleted": "Заведение удалено",
  "merchant.restored": "Заведение восстановлено",
  "merchant.anonymized": "Данные удалённого заведения обезличены",
  "merchant.profile_updated": "Витрина заведения изменена",
  "merchant.coverage_limit_updated": "Изменён потолок оплаты бонусами",
  "merchant.subscription_granted": "Подписка выдана вручную",
  "merchant.member_phone_replaced": "Сменён номер сотрудника",
  "merchant.octopay_transferred": "Аккаунт OctōPAY перенесён",
  "store.created": "Заведение создано",
  "promo_code.created": "Промокод создан",
  "promo_code.updated": "Промокод изменён",
  "promo_code.deleted": "Промокод удалён",
  "promo_code.redeemed": "Промокод применён",
  "tariff.price_updated": "Изменена цена тарифа",
  "platform.prices_updated": "Изменены цены платформы",
  "customer.deleted": "Клиент удалён",
  "certificate.csr_requested": "Запрошен сертификат Apple Wallet",
  "certificate.issued": "Сертификат Apple Wallet загружен",
  "invoice.created": "Счёт выставлен",
  "invoice.paid": "Счёт оплачен",
  "invoice.cancelled": "Счёт отменён",
  "payment.received": "Оплата получена",
};

const PLAN_LABELS: Record<string, string> = {
  loyalty: "только лояльность",
  bundle: "OctōPAY + лояльность",
  octopay: "только OctōPAY",
};

const TARIFF_CODES: Record<string, string> = { loal: "«Только Loal»", loal_octopay: "«OctōPAY + Loal»" };

const months = (n: unknown) => (typeof n === "number" ? `${n} мес.` : null);
const som = (n: unknown) => (typeof n === "number" ? `${n.toLocaleString("ru-RU")} сом` : null);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);

function details(entry: AuditLog): string[] {
  const diff = entry.diff ?? {};
  switch (entry.action) {
    case "promo_code.created":
    case "promo_code.redeemed":
      return [str(diff.code), months(diff.months) && `+${months(diff.months)}`].filter(Boolean) as string[];
    case "promo_code.updated":
      return [diff.active === false ? "выключен" : null].filter(Boolean) as string[];
    case "merchant.onboarded": {
      const plan = str(diff.plan);
      return plan ? [`тариф: ${PLAN_LABELS[plan] ?? plan}`] : [];
    }
    case "merchant.coverage_limit_updated":
      return [`${diff.from == null ? "без потолка" : `${diff.from}%`} → ${diff.to == null ? "без потолка" : `${diff.to}%`}`];
    case "tariff.price_updated": {
      const code = str(diff.code);
      return [code ? (TARIFF_CODES[code] ?? code) : null, `${som(diff.before) ?? "—"} → ${som(diff.after) ?? "—"}`].filter(
        Boolean,
      ) as string[];
    }
    case "merchant.subscription_granted":
      return [months(diff.months)].filter(Boolean) as string[];
    case "certificate.csr_requested":
      return [str(diff.name)].filter(Boolean) as string[];
    default:
      return [];
  }
}

export function auditText(entry: AuditLog): { title: string; subject: string | null; details: string } {
  const action = entry.action ?? "";
  const diff = entry.diff ?? {};
  // Название берём у сервера; у созданного или удалённого оно ещё/уже лежит в самой записи
  const subject = entry.merchantName ?? str(diff.name) ?? null;
  return {
    title: ACTION_LABELS[action] ?? (action || "Действие"),
    subject,
    details: details(entry).join(", "),
  };
}
