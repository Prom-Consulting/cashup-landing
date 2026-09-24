import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../_components/json-ld";
import { SiteFooter } from "../_components/site-footer";
import { SiteHeader } from "../_components/site-header";
import { getPublicPartners } from "../_data/partners-api";
import { SITE_URL } from "../_data/site";
import { PartnersCatalog } from "./partners-catalog";

export const metadata: Metadata = {
  title: "Где тратить бонусы в Бишкеке",
  description:
    "Заведения, которые принимают бонусы Loal: кофейни, салоны красоты, магазины, фитнес и сервисы Бишкека. Список пополняется.",
  alternates: { canonical: "/partners" },
  openGraph: {
    url: "/partners",
    type: "website",
    locale: "ru_RU",
    siteName: "Loal",
    images: { url: "/opengraph-image.png", width: 1200, height: 630, alt: "Loal — 100 000 сом бонусами каждый месяц" },
    title: "Где тратить бонусы Loal — Loal",
    description: "Заведения Бишкека, которые принимают бонусы Loal.",
  },
};

/** Список обновляется раз в пять минут: страница статическая, данные живые. */
export const revalidate = 300;

export default async function PartnersPage() {
  const partners = await getPublicPartners();

  // Поисковикам отдаём список заведений разметкой, а не только текстом
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Заведения, принимающие бонусы Loal",
    numberOfItems: partners.length,
    itemListElement: partners.slice(0, 50).map((partner, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "LocalBusiness",
        name: partner.name,
        ...(partner.category ? { additionalType: partner.category } : {}),
        ...(partner.description ? { description: partner.description } : {}),
        ...(partner.logoUrl ? { image: partner.logoUrl } : {}),
        ...(partner.contactPhone ? { telephone: `+${partner.contactPhone.replace(/\D/g, "")}` } : {}),
        areaServed: "Бишкек",
        url: `${SITE_URL}/partners`,
      },
    })),
  };

  return (
    <>
      <SiteHeader />
      {partners.length > 0 && <JsonLd data={itemListLd} />}

      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-[1512px] px-5 pt-8 pb-16 sm:px-12 sm:pt-14">
          <div className="grid items-end gap-8 pb-10 lg:grid-cols-[1.25fr_1fr]">
            <div>
              <h1 className="display text-[clamp(2.4rem,6vw,5.2rem)] leading-[1.02] text-flame">
                Где тратить
                <br />
                бонусы
              </h1>
              <p className="mt-6 max-w-[52ch] text-lg leading-snug sm:text-xl">
                {partners.length > 0
                  ? "Эти заведения принимают бонусы Loal. Каждое само решает, какую часть чека можно закрыть бонусами — процент видно на кассе."
                  : "Скоро здесь появятся заведения Бишкека: подключение идёт прямо сейчас."}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 lg:justify-end">
              <Link
                href="/become-partner"
                className="inline-flex items-center rounded-full bg-flame px-6 py-4 text-lg font-medium text-white transition-colors hover:bg-graphite"
              >
                Подключить заведение
              </Link>
              <Link
                href="/#price"
                className="inline-flex items-center rounded-full border-2 border-graphite px-6 py-4 text-lg font-medium transition-colors hover:bg-graphite hover:text-paper"
              >
                Оформить карту
              </Link>
            </div>
          </div>

          {partners.length === 0 ? (
            <div className="rounded-[32px] bg-paper px-6 py-16 text-center">
              <p className="display text-[clamp(1.5rem,3vw,2.25rem)]">Каталог скоро наполнится</p>
              <p className="mx-auto mt-4 max-w-[52ch] text-lg leading-snug text-slate">
                Заведение появляется здесь, когда оплатило доступ и заполнило витрину в своём кабинете. Хотите быть
                первым — оставьте заявку, поможем настроить.
              </p>
              <Link
                href="/become-partner"
                className="mt-8 inline-flex items-center rounded-full bg-flame px-6 py-4 text-lg font-medium text-white transition-colors hover:bg-graphite"
              >
                Оставить заявку
              </Link>
            </div>
          ) : (
            <PartnersCatalog partners={partners} />
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
