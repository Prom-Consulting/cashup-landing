import Link from "next/link";
import { getPublicPartners, monogram } from "../_data/partners-api";

/** Сколько плиток показываем на главной: остальных смотрят в каталоге. */
const LIMIT = 24;

function plural(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/**
 * Стена партнёров — первое, что видит человек: не обещание, а живой список мест,
 * где бонусы уже принимают. Данные приходят из публичной витрины бэкенда.
 */
export async function PartnerWall() {
  const partners = await getPublicPartners();
  if (partners.length === 0) return null;

  const shown = partners.slice(0, LIMIT);
  const rest = partners.length - shown.length;

  return (
    <section id="partners" className="bg-graphite py-14 text-white sm:py-20">
      <div className="mx-auto max-w-[1512px] px-5 sm:px-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 className="display text-[clamp(1.9rem,4.4vw,3.25rem)] leading-[1.05]">
              Бонусы принимают
              <br />
              {partners.length} {plural(partners.length, "заведение", "заведения", "заведений")} Бишкека
            </h2>
            <p className="mt-4 max-w-[56ch] text-lg leading-snug text-slate-soft sm:text-xl">
              100 000 сом бонусами каждый оплаченный месяц — тратьте их здесь. Список пополняется, и каждое заведение
              само задаёт, какую часть чека закроют бонусы.
            </p>
          </div>

          <Link
            href="/partners"
            className="inline-flex items-center rounded-full border border-white px-5 py-4 text-lg transition-colors hover:bg-white hover:text-graphite"
          >
            Все партнёры на карте
          </Link>
        </div>

        <ul className="mt-12 grid grid-cols-3 gap-x-4 gap-y-9 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {shown.map((partner) => (
            <li key={partner.id}>
              <Link
                href="/partners"
                className="group flex flex-col items-center text-center outline-none"
                aria-label={`${partner.name}${partner.category ? `, ${partner.category}` : ""} — смотреть в каталоге`}
              >
                <span className="grid h-[76px] w-[76px] place-items-center overflow-hidden rounded-full bg-cream ring-0 ring-flame transition-[box-shadow] group-hover:ring-4 group-focus-visible:ring-4 sm:h-[92px] sm:w-[92px]">
                  {partner.logoUrl ? (
                    // Логотипы лежат в нашем же хранилище, поэтому обычный img без оптимизации
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={partner.logoUrl} alt="" className="h-full w-full object-contain p-2.5" loading="lazy" />
                  ) : (
                    // Логотип есть далеко не у всех — монограмма выглядит намеренно, а не пусто
                    <span className="display text-[1.5rem] text-flame-ink sm:text-[1.75rem]">
                      {monogram(partner.name)}
                    </span>
                  )}
                </span>
                {/* Фиксированная высота подписи — иначе ряды разъезжаются от длинных названий */}
                <span className="mt-3 line-clamp-2 min-h-[2.5em] text-base leading-tight font-medium">
                  {partner.name}
                </span>
                {partner.category && <span className="text-sm text-slate-soft">{partner.category}</span>}
              </Link>
            </li>
          ))}
        </ul>

        {rest > 0 && (
          <p className="mt-10 text-lg text-slate-soft">
            И ещё {rest} {plural(rest, "заведение", "заведения", "заведений")} —{" "}
            <Link href="/partners" className="text-white underline underline-offset-4">
              смотреть каталог
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
