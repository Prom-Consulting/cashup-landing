import type { MetadataRoute } from "next";
import { SITE_URL } from "./_data/site";

// Только публичные страницы лендинга. Кабинеты на поддоменах закрыты от индексации.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/partners`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/become-partner`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
