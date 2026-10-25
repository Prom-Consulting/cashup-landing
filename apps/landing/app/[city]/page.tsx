import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PARTNER_CATEGORIES } from "@loal/api";
import { JsonLd } from "../_components/json-ld";
import { SiteFooter } from "../_components/site-footer";
import { SiteHeader } from "../_components/site-header";
import { Breadcrumbs } from "../partners/breadcrumbs";
import { getPublicPartners } from "../_data/partners-api";
import { ACTIVE_CITIES, cityBySlug, cityPath } from "../_data/cities";
import {
  CATEGORY_SEO,
  categoryIdOf,
  categoryPath,
  cityDescription,
  cityTitle,
  openGraph,
  partnerPath,
  plural,
} from "../_data/seo";
import { SITE_URL } from "../_data/site";

// Город один сегмент верхнего уровня (/bishkek). Статика — только для активных
// городов; неизвестный slug сюда не попадёт (статические маршруты важнее
// динамического, остальное — 404).
export const dynamicParams = false;
export const revalidate = 60;

export function generateStaticParams() {
  return ACTIVE_CITIES.map((city) => ({ city: city.slug }));
}

type Params = { params: Promise<{ city: string }> };

function present(partners: Awaited<ReturnType<typeof getPublicPartners>>) {
  return PARTNER_CATEGORIES.map((item) => ({
    id: item.id,
    count: partners.filter((partner) => categoryIdOf(partner) === item.id).length,
  })).filter((item) => item.count > 0);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { city: slug } = await params;
  const city = cityBySlug(slug);
  if (!city) return {};
  const partners = await getPublicPartners();
  const title = cityTitle(city);
  const description = cityDescription(city, partners.length, present(partners).length);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: cityPath(city.slug) },
    openGraph: openGraph(cityPath(city.slug), title, description),
  };
}

const faq = (cityIn: string) => [
  {
    q: `Как платить бонусами Loal ${cityIn}?`,
    a: "Оформите подписку Loal, получите карту в Apple Wallet или Google Wallet и 15 000 бонусов на 30 дней. У партнёра на кассе показываете карту — часть покупки закрывается бонусами в пределах процента, который задало заведение.",
  },
  {
    q: "Сколько стоит подписка?",
    a: "990 сом за 30 дней. В начале каждого цикла на карту начисляется 15 000 бонусов; неиспользованный остаток в новый цикл не переносится.",
  },
  {
    q: `В каких заведениях ${cityIn} принимают бонусы?`,
    a: "В каталоге собраны кофейни, рестораны, магазины, салоны и сервисы. Выберите категорию ниже или откройте карту — процент оплаты бонусами указан на карточке каждого заведения.",
  },
];

export default async function CityPage({ params }: Params) {
  const { city: slug } = await params;
  const city = cityBySlug(slug);
  if (!city) notFound();

  const partners = await getPublicPartners();
  const categories = present(partners);
  const featured = (partners.filter((p) => p.logoUrl || p.photos?.length).slice(0, 8).length
    ? partners.filter((p) => p.logoUrl || p.photos?.length)
    : partners
  ).slice(0, 8);
  const questions = faq(city.nameIn);

  const categoriesLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Категории заведений ${city.nameOf} с бонусами Loal`,
    numberOfItems: categories.length,
    itemListElement: categories.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: CATEGORY_SEO[item.id].title,
      url: `${SITE_URL}${categoryPath(item.id)}`,
    })),
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <SiteHeader />
      <JsonLd data={categoriesLd} />
      <JsonLd data={faqLd} />

      <main className="flex-1">
        <section className="mx-auto max-w-[1440px] px-5 pt-10 pb-6 sm:px-10 sm:pt-14">
          <Breadcrumbs
            items={[
              { name: "Главная", href: "/" },
              { name: city.name, href: cityPath(city.slug) },
            ]}
          />
          <h1 className="display max-w-[18ch] text-[clamp(2.08rem,4.86vw,4.14rem)] brand-gradient-text">
            Бонусы Loal {city.nameIn}
          </h1>
          <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-graphite/90">
            Подписка Loal — 990 сом за 30 дней: карта в Apple Wallet или Google Wallet и 15 000 бонусов. Ими
            закрывается часть покупки у партнёров {city.nameOf} — процент задаёт само заведение.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/partners"
              className="rounded-full bg-flame px-6 py-3.5 font-bold text-white transition-colors hover:bg-graphite"
            >
              Смотреть каталог
            </Link>
            <Link
              href="/partners?view=map"
              className="rounded-full border-2 border-graphite px-6 py-3.5 font-bold text-graphite transition-colors hover:bg-graphite hover:text-white"
            >
              Открыть карту
            </Link>
          </div>
        </section>

        <section className="bg-cream/50">
          <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-10 sm:py-20">
            <h2 className="display text-[clamp(1.8rem,4vw,3rem)] brand-gradient-text">Категории {city.nameOf}</h2>
            <p className="mt-4 max-w-[60ch] leading-relaxed text-graphite/85">
              Куда пойти с бонусами Loal — выберите, что интересно, и смотрите заведения с процентом оплаты на карточке.
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((item) => (
                <li key={item.id}>
                  <Link
                    href={categoryPath(item.id)}
                    className="group flex items-center justify-between gap-4 rounded-2xl bg-paper p-5 transition-colors hover:bg-white"
                  >
                    <span className="font-bold leading-snug group-hover:text-flame">{CATEGORY_SEO[item.id].title}</span>
                    <span className="shrink-0 rounded-full bg-cream px-3 py-1 text-sm font-medium text-slate">
                      {item.count} {plural(item.count, "место", "места", "мест")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {featured.length > 0 && (
          <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-10 sm:py-20">
            <div className="flex items-end justify-between gap-4">
              <h2 className="display text-[clamp(1.8rem,4vw,3rem)] brand-gradient-text">Заведения {city.nameOf}</h2>
              <Link href="/partners" className="shrink-0 font-medium text-flame-ink underline-offset-4 hover:underline">
                Весь каталог →
              </Link>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((partner) => (
                <li key={partner.id}>
                  <Link
                    href={partnerPath(partner)}
                    className="group flex h-full flex-col rounded-2xl border border-cream bg-paper p-5 transition-colors hover:border-flame/30"
                  >
                    <span className="font-bold leading-snug group-hover:text-flame">{partner.name}</span>
                    {partner.category && <span className="mt-1 text-sm text-slate">{partner.category}</span>}
                    {typeof partner.maxCoveragePercent === "number" && partner.acceptsBonuses !== false && (
                      <span className="mt-4 text-sm font-medium text-flame-ink">
                        до {partner.maxCoveragePercent}% бонусами
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-10 sm:pb-24">
          <h2 className="display text-[clamp(1.6rem,3.6vw,2.6rem)] brand-gradient-text">Частые вопросы</h2>
          <dl className="mt-8 max-w-[70ch]">
            {questions.map((item) => (
              <div key={item.q} className="border-b border-cream py-6">
                <dt className="text-lg font-medium">{item.q}</dt>
                <dd className="mt-3 leading-relaxed text-graphite/90">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
