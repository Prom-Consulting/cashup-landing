import Link from "next/link";
import { JsonLd } from "../_components/json-ld";
import { SITE_URL } from "../_data/site";

export type Crumb = { name: string; href: string };

/** Хлебные крошки: видимые ссылки и BreadcrumbList для поисковиков — из одного списка. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  };
  return (
    <>
      <JsonLd data={ld} />
      <nav aria-label="Навигация по разделам" className="mb-4 text-sm text-slate">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className="text-graphite">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link href={item.href} className="underline-offset-4 hover:text-graphite hover:underline">
                      {item.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
