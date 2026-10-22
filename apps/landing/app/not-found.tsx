import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "./_components/site-footer";
import { SiteHeader } from "./_components/site-header";
import { getPublicPartners } from "./_data/partners-api";
import { categoryIdOf, categoryLabel, categoryPath } from "./_data/seo";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: true },
};

/**
 * 404 сайта: не тупик, а дорога дальше — в каталог, на главную или в категорию, где уже есть
 * заведения (список живой, из того же каталога).
 */
export default async function NotFound() {
  const partners = await getPublicPartners();
  const counts = new Map<ReturnType<typeof categoryIdOf>, number>();
  for (const partner of partners) {
    const id = categoryIdOf(partner);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const categories = [...counts.entries()]
    .filter(([id]) => id !== "other")
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 overflow-x-clip">
        <section className="relative mx-auto max-w-[1440px] px-5 pt-10 pb-20 sm:px-10 sm:pt-16 lg:pb-28">
          {/* Код ошибки — крупный фон, а не заголовок: читают фразу, а не цифры */}
          <p
            aria-hidden="true"
            className="display pointer-events-none absolute -top-4 right-2 select-none text-[clamp(8rem,26vw,22rem)] leading-none text-flame/10 sm:right-10"
          >
            404
          </p>
          <div className="relative max-w-[640px]">
            <h1 className="display text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02] brand-gradient-text">
              Здесь бонусы не тратят
            </h1>
            <p className="mt-6 max-w-[48ch] text-xl leading-relaxed">
              Страницы по этому адресу нет: ссылка устарела или в ней опечатка. Заведения сети — в каталоге.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/partners"
                className="rounded-full bg-flame-ink px-7 py-4 text-lg font-bold text-white transition-colors hover:bg-graphite"
              >
                Где тратить бонусы
              </Link>
              <Link
                href="/"
                className="rounded-full border-2 border-graphite px-7 py-[14px] text-lg font-bold transition-colors hover:bg-graphite hover:text-paper"
              >
                На главную
              </Link>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="relative mt-16 max-w-[900px]">
              <h2 className="text-xl font-bold">Или сразу в категорию</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {categories.map(([id, count]) => (
                  <li key={id}>
                    <Link
                      href={categoryPath(id)}
                      className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2.5 text-base shadow-[0_0.25rem_1rem_rgb(22_21_21/0.06)] transition-colors hover:bg-cream"
                    >
                      {categoryLabel(id)}
                      <span className="text-slate tabular-nums">{count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
