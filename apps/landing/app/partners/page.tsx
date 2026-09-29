import type { Metadata } from "next";
import { JsonLd } from "../_components/json-ld";
import { SiteFooter } from "../_components/site-footer";
import { SiteHeader } from "../_components/site-header";
import { getPublicPartners } from "../_data/partners-api";
import { SITE_URL } from "../_data/site";
import { PartnersExplorer } from "./partners-explorer";

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
    images: { url: "/opengraph-image.png", width: 1200, height: 630, alt: "Loal — бонусы по подписке" },
    title: "Где тратить бонусы Loal — Loal",
    description: "Заведения Бишкека, которые принимают бонусы Loal.",
  },
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
          url: `${SITE_URL}/partners`,
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

      <SiteFooter />
    </>
  );
}
