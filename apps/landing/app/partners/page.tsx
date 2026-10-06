import type { Metadata } from "next";
import { JsonLd } from "../_components/json-ld";
import { SiteFooter } from "../_components/site-footer";
import { SiteHeader } from "../_components/site-header";
import { getPublicPartners } from "../_data/partners-api";
import { PAGE_SEO, openGraph, partnerPath } from "../_data/seo";
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
        <SiteFooter />
      </div>
    </>
  );
}
