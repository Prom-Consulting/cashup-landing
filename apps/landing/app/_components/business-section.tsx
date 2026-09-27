import Image from "next/image";
import Link from "next/link";
import { Logo } from "@loal/ui/logo";
import businessPhone from "@/public/images/landing/business-phone.png";

/**
 * Первый экран страницы «Бизнесу» — тёмная подача Loal Corporate с телефоном.
 * Раньше блок стоял на главной и путал покупателей; там теперь только короткая ссылка.
 */
export function CorporateHero({ formHref }: { formHref: string }) {
  return (
    <section className="overflow-hidden bg-graphite text-white">
      <div className="mx-auto flex max-w-[1512px] flex-col items-center px-5 pt-16 text-center [--pw:min(1014px,118vw)] sm:px-12 sm:pt-24">
        <Logo size="lg" direction="corporate" tone="light" />
        <h1 className="display mt-8 max-w-[1000px] text-[clamp(2.4rem,4.6vw,4.25rem)]">
          Программы лояльности для бизнеса
        </h1>
        <p className="mt-6 max-w-[860px] text-lg leading-snug text-slate-soft sm:text-xl">
          Loal Corporate подключает компанию к бонусной сети Loal. Подписчики приходят к вам с бонусами, а вы сами
          решаете, какую долю покупки они закроют, даёте доступ сотрудникам и видите каждую операцию.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <Link
            href={formHref}
            className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-[1.1875rem] font-bold text-graphite transition-colors hover:bg-flame hover:text-white"
          >
            Оставить заявку
          </Link>
          <Link
            href="/partners"
            className="font-medium underline decoration-amber decoration-2 underline-offset-6 hover:decoration-flame"
          >
            Посмотреть каталог
          </Link>
        </div>
        {/* Верх картинки прозрачный: телефон «выходит» из-под текста, низ срезает край секции */}
        <div
          className="pointer-events-none relative mt-[calc(var(--pw)*-0.1)] -mb-[calc(var(--pw)*0.12)] lg:mt-[calc(var(--pw)*-0.2)]"
          style={{ width: "var(--pw)" }}
        >
          <Image
            src={businessPhone}
            alt="Телефон с картой Loal в Wallet"
            priority
            placeholder="blur"
            sizes="(min-width: 1024px) 1014px, 118vw"
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}

/** На главной — только короткий вход для бизнеса, чтобы не путать покупателей. */
export function BusinessLink({ href }: { href: string }) {
  return (
    <section id="business" className="scroll-mt-6 px-5 sm:px-12">
      <Link
        href={href}
        className="group mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 rounded-[32px] bg-graphite px-7 py-6 text-white transition-colors hover:bg-coal sm:px-10 sm:py-8"
      >
        <span className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-5">
          <Logo direction="corporate" tone="light" />
          <span className="text-lg text-slate-soft sm:text-xl">Для бизнеса: подключите заведение к Loal</span>
        </span>
        <span className="inline-flex items-center rounded-full bg-white px-6 py-3 text-base font-bold text-graphite transition-colors group-hover:bg-flame group-hover:text-white">
          Подключить заведение
        </span>
      </Link>
    </section>
  );
}
