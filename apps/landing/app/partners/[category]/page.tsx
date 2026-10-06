import { PARTNER_CATEGORIES, type PartnerCategoryId } from "@loal/api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "../../_components/json-ld";
import { SiteFooter } from "../../_components/site-footer";
import { SiteHeader } from "../../_components/site-header";
import { getPublicPartners } from "../../_data/partners-api";
import {
  CATEGORY_SEO,
  categoryDescription,
  categoryIdOf,
  categoryLabel,
  categoryPath,
  categoryTitle,
  openGraph,
  partnerPath,
} from "../../_data/seo";
import { SITE_URL } from "../../_data/site";
import { Breadcrumbs } from "../breadcrumbs";
import { PartnersCatalog } from "../partners-catalog";

/** Страницы категорий статические, данные живые — как у каталога. */
export const revalidate = 60;
export const dynamicParams = false;

export function generateStaticParams() {
  return PARTNER_CATEGORIES.map((item) => ({ category: item.id }));
}

const isCategory = (value: string): value is PartnerCategoryId => PARTNER_CATEGORIES.some((item) => item.id === value);

export async function generateMetadata({ params }: PageProps<"/partners/[category]">): Promise<Metadata> {
  const { category } = await params;
  if (!isCategory(category)) return {};
  const partners = await getPublicPartners();
  const count = partners.filter((partner) => categoryIdOf(partner) === category).length;
  const title = categoryTitle(category);
  const description = categoryDescription(category, count);
  return {
    // «Loal» уже в шаблоне заголовка — без хвоста из layout
    title: { absolute: title },
    description,
    alternates: { canonical: categoryPath(category) },
    openGraph: openGraph(categoryPath(category), title, description),
    // Пустую категорию не индексируем: тонкая страница без заведений вредит сайту
    ...(count === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CategoryPage({ params }: PageProps<"/partners/[category]">) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const partners = await getPublicPartners();
  const inCategory = partners.filter((partner) => categoryIdOf(partner) === category);
  const label = categoryLabel(category);

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: categoryTitle(category),
    numberOfItems: inCategory.length,
    itemListElement: inCategory.map((partner, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}${partnerPath(partner)}`,
      name: partner.name,
    })),
  };

  return (
    <>
      <SiteHeader />
      {inCategory.length > 0 && <JsonLd data={itemListLd} />}
      <main className="flex-1 bg-cream">
        <PartnersCatalog
          // Чипы показывают все категории, сетка — только эту
          partners={partners.map((partner) => (categoryIdOf(partner) === category ? { ...partner, category: label } : partner))}
          category={label}
          heading={`${CATEGORY_SEO[category].title} в Бишкеке`}
          intro={`${CATEGORY_SEO[category].about.replace(/^./, (char) => char.toUpperCase())}, где часть покупки можно оплатить бонусами Loal. Процент задаёт само заведение — он указан на карточке.`}
          breadcrumbs={
            <Breadcrumbs
              items={[
                { name: "Главная", href: "/" },
                { name: "Где тратить бонусы", href: "/partners" },
                { name: CATEGORY_SEO[category].title, href: categoryPath(category) },
              ]}
            />
          }
        />
      </main>
      <SiteFooter />
    </>
  );
}
