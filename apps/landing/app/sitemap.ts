import { PARTNER_CATEGORIES } from "@loal/api";
import type { MetadataRoute } from "next";
import { getPublicPartners } from "./_data/partners-api";
import { categoryIdOf, categoryPath, partnerPath } from "./_data/seo";
import { SITE_URL } from "./_data/site";

/** Пересобираем вместе с каталогом: новое заведение попадает в карту сайта за минуту. */
export const revalidate = 60;

// Только публичные страницы лендинга. Кабинеты на поддоменах закрыты от индексации.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const partners = await getPublicPartners();
  // Пустые категории закрыты noindex — в карту сайта их не кладём
  const categories = PARTNER_CATEGORIES.filter((item) => partners.some((partner) => categoryIdOf(partner) === item.id));
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/partners`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((item) => ({
      url: `${SITE_URL}${categoryPath(item.id)}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...partners.map((partner) => ({
      url: `${SITE_URL}${partnerPath(partner)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      ...(partner.photos[0] || partner.logoUrl ? { images: [partner.photos[0] ?? partner.logoUrl!] } : {}),
    })),
    { url: `${SITE_URL}/become-partner`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
