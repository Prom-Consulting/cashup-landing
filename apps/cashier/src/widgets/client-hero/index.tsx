import { Card } from "@loal/ui/shadcn";
import { Link } from "react-router";
import { useCashierAbilities } from "../../entities/cashier/api";

const button =
  "inline-flex w-fit items-center rounded-full bg-graphite px-7 py-4 text-lg font-bold text-white transition-colors hover:bg-white hover:text-graphite";

/** «Клиент с картой Loal?» — кнопки по тарифу: списание, кэшбэк или оба. */
export function ClientHero() {
  const abilities = useCashierAbilities();
  return (
    <Card className="brand-gradient flex flex-col gap-4 text-white">
      <h2 className="display text-[clamp(1.8rem,3vw,2.4rem)] leading-tight">Клиент с картой Loal?</h2>
      <p className="max-w-[46ch] text-lg leading-snug text-white/90">
        {abilities.redeem && abilities.cashback
          ? "Отсканируйте QR с его карты: бонусы закроют часть цены, а за покупку деньгами придёт кэшбэк."
          : abilities.cashback
            ? "Отсканируйте QR с его карты и введите сумму покупки — клиент получит кэшбэк бонусами."
            : "Отсканируйте QR с его карты, добавьте покупку — бонусы закроют часть цены."}
      </p>
      <div className="flex flex-wrap gap-3">
        {abilities.cashback && (
          <Link to="/cashback" className={button}>
            Начислить кэшбэк
          </Link>
        )}
        {abilities.redeem && (
          <Link to="/redeem" className={button}>
            Списать бонусы
          </Link>
        )}
      </div>
    </Card>
  );
}
