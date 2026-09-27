import type { ReactNode } from "react";
import { Link, Outlet } from "react-router";
import { Logo } from "@loal/ui/logo";

/** Рисунок карты для панели бренда: графитовая карта с балансом и узором QR. Чистое оформление. */
function CardArt() {
  // Узор QR — фиксированный, чтобы рисунок не менялся от сборки к сборке
  const cells = "1110101110100101011101011010110101001011101011101010011010110101110100110101011101010110";
  return (
    <div
      aria-hidden="true"
      className="ml-2 w-[min(340px,38vh)] rotate-[-6deg] rounded-[28px] bg-graphite p-6 text-white shadow-[0_2.5rem_5rem_rgb(22_21_21/0.35)] [@media(max-height:700px)]:hidden"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold">Loal</span>
        <span className="text-sm text-slate-soft">Бонусы по подписке</span>
      </div>
      <p className="mt-6 text-sm text-slate-soft">Баланс бонусов</p>
      <p className="display text-[min(3.4rem,6vh)] leading-none text-amber tabular-nums">15 000</p>
      <div className="mt-5 grid w-[min(8rem,14vh)] grid-cols-9 gap-[3px] rounded-xl bg-white p-2.5">
        {cells.split("").map((cell, index) => (
          <span key={index} className={`aspect-square rounded-[2px] ${cell === "1" ? "bg-graphite" : ""}`} />
        ))}
      </div>
    </div>
  );
}

/**
 * Рамка публичных страниц: вход, страница карты по ссылке, самостоятельная выдача.
 * На телефоне — одна колонка. На компьютере экран делится: слева панель бренда,
 * справа форма — узкая колонка посреди пустого экрана выглядит сломанной.
 */
export function PageFrame({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(520px,1fr)]">
      <aside className="brand-gradient sticky top-0 hidden h-dvh flex-col gap-[4vh] overflow-hidden px-12 py-[6vh] text-white lg:flex xl:px-16">
        <Link to="/" aria-label="Карта Loal" className="inline-flex w-fit">
          <Logo descriptor="Бонусы по подписке" tone="light" mark="white" />
        </Link>

        <div className="my-auto flex flex-col gap-[5vh]">
          <div>
            <p className="display max-w-[12ch] text-[min(4rem,4.2vw,7vh)] leading-[1.02]">
              15 000 бонусов на каждый месяц
            </p>
            <p className="mt-4 max-w-[40ch] text-xl leading-snug text-white/90">
              Карта в Apple Wallet и Google Wallet, баланс и история — в одном кабинете. Бонусами закрывается часть покупки у партнёров
              в Бишкеке.
            </p>
          </div>
          <CardArt />
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="mx-auto w-full max-w-[420px] px-5 py-6 lg:hidden">
          <Link to="/" aria-label="Карта Loal" className="inline-flex">
            <Logo descriptor="Бонусы по подписке" />
          </Link>
        </header>
        <main className="mx-auto w-full max-w-[420px] flex-1 px-5 pb-12 lg:flex lg:max-w-[460px] lg:flex-col lg:justify-center lg:py-16">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
