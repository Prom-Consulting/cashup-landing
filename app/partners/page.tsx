import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../_components/site-footer";
import { SiteHeader } from "../_components/site-header";
import { partners } from "../_data/partners";
import { PartnersView } from "./partners-view";

export const metadata: Metadata = {
  title: "Партнёры Loal на карте Бишкека",
  description:
    "Где принимают бонусы Loal: кофейни, салоны красоты, магазины, фитнес и сервисы Бишкека с их процентом оплаты бонусами.",
};

const maxPercent = Math.max(...partners.map((p) => p.percent));
const octopayCount = partners.filter((p) => p.octopay).length;

export default function PartnersPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-[1440px] px-5 pt-6 pb-10 sm:px-10 lg:pt-10">
          <div className="grid items-end gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <h1 className="display text-[clamp(2.43rem,6.25vw,5.52rem)] text-flame">Где тратить бонусы</h1>
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed sm:text-xl">
                Партнёры Loal в Бишкеке и процент, который каждый из них разрешает оплатить бонусами в этом месяце.
                Наведите на заведение — увидите его на карте.
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-3 sm:gap-4 lg:pb-3">
              <Stat value={partners.length} label="партнёров" />
              <Stat value={`${maxPercent}%`} label="максимум бонусами" />
              <Stat value={octopayCount} label="списывают автоматически" />
            </dl>
          </div>
        </section>

        <PartnersView />

        <section className="mx-auto max-w-[1440px] px-5 pb-24 sm:px-10 lg:pb-32">
          <div className="grid gap-6 rounded-[32px] bg-graphite p-8 text-paper sm:p-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <h2 className="display text-[clamp(1.74rem,3.47vw,3.1rem)]">Вашего заведения тут нет?</h2>
              <p className="mt-4 max-w-[52ch] text-lg leading-relaxed">
                Подключите Loal — и в каталог придут клиенты, у которых на карте уже лежат 100 000 сом бонусами.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 lg:justify-end">
              <Link
                href="/become-partner"
                className="inline-flex items-center justify-center rounded-[10px] bg-paper px-7 py-4 font-bold text-graphite transition-colors hover:bg-amber"
              >
                Стать партнёром
              </Link>
              <Link
                href="/#price"
                className="inline-flex items-center justify-center rounded-[10px] border-2 border-paper px-7 py-4 font-bold transition-colors hover:bg-paper hover:text-graphite"
              >
                Тарифы
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-[20px] bg-cream/60 p-3 sm:p-4">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="display block text-[clamp(1.57rem,2.78vw,2.42rem)] text-graphite">{value}</span>
        <span className="mt-1 block text-xs font-medium sm:text-sm">{label}</span>
      </dd>
    </div>
  );
}
