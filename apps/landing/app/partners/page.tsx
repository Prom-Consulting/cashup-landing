import type { Metadata } from "next";
import { JsonLd } from "../_components/json-ld";
import { SiteFooter } from "../_components/site-footer";
import { SiteHeader } from "../_components/site-header";
import { getPublicPartners } from "../_data/partners-api";
import { PARTNER_CATEGORIES } from "@loal/api";
import Link from "next/link";
import { CATEGORY_SEO, PAGE_SEO, categoryIdOf, categoryPath, openGraph, partnerPath } from "../_data/seo";
import { SITE_URL } from "../_data/site";
import { PartnersExplorer } from "./partners-explorer";

export const metadata: Metadata = {
  title: { absolute: PAGE_SEO.partners.title },
  description: PAGE_SEO.partners.description,
  alternates: { canonical: "/partners" },
  openGraph: openGraph("/partners", PAGE_SEO.partners.title, PAGE_SEO.partners.description),
};

/** Страница статическая, данные живые: раз в минуту и сразу после сохранения витрины. */
export const revalidate = 60;

export default async function PartnersPage() {
  const partners = await getPublicPartners();
  const categories = PARTNER_CATEGORIES.map((item) => ({
    id: item.id,
    count: partners.filter((partner) => categoryIdOf(partner) === item.id).length,
  })).filter((item) => item.count > 0);

  // Поисковикам отдаём список заведений разметкой, а не только текстом
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Заведения, принимающие бонусы Loal",
    numberOfItems: partners.length,
    itemListElement: partners
      .slice(0, 50)
      .map((partner, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "LocalBusiness",
          name: partner.name,
          ...(partner.category ? { additionalType: partner.category } : {}),
          ...(partner.description ? { description: partner.description } : {}),
          ...(partner.logoUrl ? { image: partner.logoUrl } : {}),
          ...(partner.contactPhone ? { telephone: `+${partner.contactPhone.replace(/\D/g, "")}` } : {}),
          ...(partner.address
            ? { address: { "@type": "PostalAddress", streetAddress: partner.address, addressLocality: "Бишкек" } }
            : {}),
          ...(typeof partner.lat === "number" && typeof partner.lng === "number"
            ? { geo: { "@type": "GeoCoordinates", latitude: partner.lat, longitude: partner.lng } }
            : {}),
          areaServed: "Бишкек",
          url: `${SITE_URL}${partnerPath(partner)}`,
        },
      })),
  };

  return (
    <>
      <SiteHeader />
      {partners.length > 0 && <JsonLd data={itemListLd} />}

      <main className="flex-1 bg-cream">
        <PartnersExplorer partners={partners} />
      </main>

      {/* В виде «Карта» на телефоне подвал прячет globals.css — он сливался со шторкой */}
      <div className="partners-footer">
        {/* Под картой — обычные ссылки на категории и заведения: по ним ходят и люди, и поисковики */}
        {partners.length > 0 && (
          <nav aria-labelledby="all-partners" className="bg-cream">
            <div className="mx-auto w-full max-w-[1240px] px-4 py-12 sm:px-6">
              <h2 id="all-partners" className="display text-[1.75rem] leading-tight sm:text-[2.25rem]">
                Все заведения, где принимают бонусы Loal
              </h2>
              <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <div>
                  <h3 className="text-base font-bold text-slate">По категориям</h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {categories.map(({ id, count }) => (
                      <li key={id}>
                        <Link
                          href={categoryPath(id)}
                          className="inline-flex rounded-full border-2 border-smoke bg-paper px-4 py-2 text-sm font-medium transition-colors hover:border-graphite"
                        >
                          {CATEGORY_SEO[id].title}
                          <span className="ml-1.5 text-slate tabular-nums">{count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate">По названию</h3>
                  <ul className="mt-3 columns-2 gap-6 text-base sm:columns-3">
                    {[...partners]
                      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
                      .map((partner) => (
                        <li key={partner.id} className="break-inside-avoid py-1">
                          <Link href={partnerPath(partner)} className="underline-offset-4 hover:text-flame-ink hover:underline">
                            {partner.name}
                          </Link>
                          {partner.maxCoveragePercent ? (
                            <span className="ml-1.5 text-sm text-slate">до {partner.maxCoveragePercent}%</span>
                          ) : null}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </nav>
        )}
        <SiteFooter />
      </div>
    </>
  );
}
