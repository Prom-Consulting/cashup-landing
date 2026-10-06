import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "../../../_components/json-ld";
import { SiteFooter } from "../../../_components/site-footer";
import { SiteHeader } from "../../../_components/site-header";
import { getPublicPartners } from "../../../_data/partners-api";
import {
  CATEGORY_SEO,
  categoryIdOf,
  categoryPath,
  findByPathSegment,
  openGraph,
  partnerDescription,
  partnerPath,
  partnerTitle,
} from "../../../_data/seo";
import { CLIENT_APP_URL, SITE_URL } from "../../../_data/site";
import { Breadcrumbs } from "../../breadcrumbs";
import { PartnerCard, PartnerCover, PartnerLogo, PercentBadge } from "../../partner-card";

/** Страница на каждое заведение: статическая, обновляется раз в минуту и после сохранения витрины. */
export const revalidate = 60;

export async function generateStaticParams() {
  const partners = await getPublicPartners();
  return partners.map((partner) => {
    const [, , category, segment] = partnerPath(partner).split("/");
    return { category: category!, partner: segment! };
  });
}

async function load(params: PageProps<"/partners/[category]/[partner]">["params"]) {
  const { category, partner: segment } = await params;
  const partners = await getPublicPartners();
  const partner = findByPathSegment(partners, segment);
  return { partner, partners, path: `/partners/${category}/${segment}` };
}

export async function generateMetadata({ params }: PageProps<"/partners/[category]/[partner]">): Promise<Metadata> {
  const { partner } = await load(params);
  if (!partner) return { title: "Заведение не найдено", robots: { index: false } };
  const title = partnerTitle(partner);
  const description = partnerDescription(partner);
  const path = partnerPath(partner);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraph(path, `${title} — Loal`, description, partner.photos[0] ?? partner.logoUrl),
  };
}

function phoneHref(phone: string) {
  return `tel:+${phone.replace(/\D/g, "")}`;
}

export default async function PartnerPage({ params }: PageProps<"/partners/[category]/[partner]">) {
  const { partner, partners, path } = await load(params);
  if (!partner) notFound();
  // Сменились название или категория — старая ссылка ведёт на новый адрес по коду
  if (path !== partnerPath(partner)) permanentRedirect(partnerPath(partner));

  const category = categoryIdOf(partner);
  const nearby = partners.filter((item) => item.id !== partner.id && categoryIdOf(item) === category).slice(0, 4);
  const more = nearby.length >= 4 ? nearby : [...nearby, ...partners.filter((item) => item.id !== partner.id && !nearby.includes(item))].slice(0, 4);
  const hasMap = typeof partner.lat === "number" && typeof partner.lng === "number";

  const businessLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}${partnerPath(partner)}#business`,
    name: partner.name,
    url: `${SITE_URL}${partnerPath(partner)}`,
    ...(partner.description ? { description: partner.description } : {}),
    ...(partner.logoUrl || partner.photos.length ? { image: [...(partner.logoUrl ? [partner.logoUrl] : []), ...partner.photos] } : {}),
    ...(partner.contactPhone ? { telephone: `+${partner.contactPhone.replace(/\D/g, "")}` } : {}),
    ...(partner.address
      ? { address: { "@type": "PostalAddress", streetAddress: partner.address, addressLocality: "Бишкек", addressCountry: "KG" } }
      : {}),
    ...(hasMap ? { geo: { "@type": "GeoCoordinates", latitude: partner.lat, longitude: partner.lng } } : {}),
    ...(partner.instagramUrl || partner.twogisUrl ? { sameAs: [partner.instagramUrl, partner.twogisUrl].filter(Boolean) } : {}),
    areaServed: "Бишкек",
  };

  const action =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-base font-bold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-flame";

  return (
    <>
      <SiteHeader />
      <JsonLd data={businessLd} />
      <main className="flex-1 bg-cream">
        <article className="mx-auto w-full max-w-[1240px] px-4 pt-6 pb-16 sm:px-6 md:pt-10">
          <Breadcrumbs
            items={[
              { name: "Главная", href: "/" },
              { name: "Где тратить бонусы", href: "/partners" },
              { name: CATEGORY_SEO[category].title, href: categoryPath(category) },
              { name: partner.name, href: partnerPath(partner) },
            ]}
          />

          <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
            <div className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-[28px]">
                <PartnerCover partner={partner} large className="aspect-[16/10] w-full" />
              </div>
              {partner.photos.length > 1 && (
                <ul className="no-scrollbar flex gap-3 overflow-x-auto">
                  {partner.photos.slice(1).map((photo, index) => (
                    <li key={photo} className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={`${partner.name}, фото ${index + 2}`}
                        loading="lazy"
                        className="h-28 w-40 rounded-2xl object-cover sm:h-32 sm:w-48"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <PartnerLogo partner={partner} size="lg" />
                <div className="min-w-0 flex-1">
                  <h1 className="display text-[2.1rem] leading-[1.02] sm:text-[2.75rem]">{partner.name}</h1>
                  <p className="mt-1 text-lg text-slate">
                    <Link href={categoryPath(category)} className="underline-offset-4 hover:text-graphite hover:underline">
                      {partner.category ?? CATEGORY_SEO[category].title}
                    </Link>
                    {" · Бишкек"}
                  </p>
                </div>
              </div>

              {partner.maxCoveragePercent ? (
                <div className="flex items-center gap-4 rounded-[24px] bg-graphite px-5 py-4 text-paper">
                  <span className="display text-[3rem] leading-none text-amber">{partner.maxCoveragePercent}%</span>
                  <span className="text-base leading-snug text-paper/85">
                    покупки можно оплатить бонусами Loal — остальное деньгами, как обычно
                  </span>
                </div>
              ) : (
                <PercentBadge partner={partner} className="w-fit" />
              )}

              {partner.tariff === "octopay" && (
                <p className="rounded-2xl bg-paper px-4 py-3 text-base leading-snug">
                  Здесь можно платить через OctōPAY: на странице оплаты вы сами решаете, сколько бонусов потратить.
                </p>
              )}

              {partner.description && <p className="text-lg leading-relaxed whitespace-pre-line">{partner.description}</p>}

              {partner.address && (
                <p className="flex gap-2 text-base leading-snug text-slate">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-flame">
                    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="9.5" r="2.5" fill="currentColor" />
                  </svg>
                  <span>
                    <span className="sr-only">Адрес: </span>
                    {partner.address}, Бишкек
                  </span>
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {hasMap && (
                  <Link href={`/partners?focus=${partner.id}`} className={`${action} bg-flame text-white hover:bg-graphite`}>
                    Показать на карте
                  </Link>
                )}
                {partner.twogisUrl && (
                  <a href={partner.twogisUrl} target="_blank" rel="noreferrer" className={`${action} bg-graphite text-paper hover:bg-flame`}>
                    Маршрут в 2ГИС
                  </a>
                )}
                {partner.contactPhone && (
                  <a href={phoneHref(partner.contactPhone)} className={`${action} border-2 border-smoke bg-paper hover:border-graphite`}>
                    Позвонить
                  </a>
                )}
                {partner.instagramUrl && (
                  <a
                    href={partner.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`${action} border-2 border-smoke bg-paper hover:border-graphite`}
                  >
                    Instagram
                  </a>
                )}
              </div>
            </div>
          </div>

          <section aria-labelledby="how-to-pay" className="mt-12 rounded-[28px] bg-paper p-6 sm:p-8">
            <h2 id="how-to-pay" className="display text-[1.6rem] leading-tight sm:text-[2rem]">
              Как оплатить бонусами в {partner.name}
            </h2>
            <ol className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                "Оформите подписку Loal — карта появится в Apple Wallet или Google Wallet.",
                "На кассе покажите QR-код карты или оплатите по ссылке OctōPAY, если заведение её даёт.",
                partner.maxCoveragePercent
                  ? `Бонусами закроется до ${partner.maxCoveragePercent}% покупки, остальное — деньгами.`
                  : "Бонусами закроется часть покупки — процент задаёт заведение.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3 text-base leading-snug">
                  <span className="display grid h-9 w-9 shrink-0 place-items-center rounded-full bg-flame text-white">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <a
              href={CLIENT_APP_URL}
              className="mt-6 inline-flex rounded-full bg-graphite px-6 py-3 text-base font-bold text-paper transition-colors hover:bg-flame"
            >
              Оформить подписку
            </a>
          </section>

          {more.length > 0 && (
            <section aria-labelledby="more" className="mt-12">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 id="more" className="display text-[1.6rem] leading-tight sm:text-[2rem]">
                  {nearby.length > 0 ? `Ещё ${CATEGORY_SEO[category].title.toLowerCase()}` : "Ещё заведения"}
                </h2>
                <Link href={nearby.length > 0 ? categoryPath(category) : "/partners?view=catalog"} className="text-base font-bold text-flame-ink underline-offset-4 hover:underline">
                  Смотреть все
                </Link>
              </div>
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {more.map((item) => (
                  <PartnerCard key={item.id} partner={item} />
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
