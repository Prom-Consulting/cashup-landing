import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "../../_components/site-footer";
import { SiteHeader } from "../../_components/site-header";
import { LegalArticle } from "../../_components/legal-article";
import { LEGAL_SEO, openGraph } from "../../_data/seo";
import { LEGAL_DOCS, LEGAL_UPDATED, legalDoc, legalPath, type LegalSlug } from "../docs";

// Типизированные маршруты Next генерируются при сборке, поэтому params описываем явно.
type Params = { params: Promise<{ doc: string }> };

export function generateStaticParams() {
  return LEGAL_DOCS.map((item) => ({ doc: item.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { doc } = await params;
  const seo = LEGAL_SEO[doc as keyof typeof LEGAL_SEO];
  if (!seo) return {};
  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical: legalPath(doc as LegalSlug) },
    openGraph: openGraph(legalPath(doc as LegalSlug), seo.title, seo.description),
  };
}

export default async function LegalDocPage({ params }: Params) {
  const { doc } = await params;
  const item = legalDoc(doc);
  if (!item) notFound();

  const others = LEGAL_DOCS.filter((other) => other.slug !== item.slug);

  return (
    <>
      <SiteHeader />

      <main className="flex-1 overflow-x-clip">
        <article className="mx-auto max-w-[1440px] px-5 py-14 sm:px-10 sm:py-20">
          <Link href="/legal" className="text-base font-medium text-slate underline-offset-4 hover:text-flame hover:underline">
            ← Все документы
          </Link>
          <h1 className="display mt-6 max-w-[22ch] text-[clamp(1.9rem,4vw,3.25rem)] brand-gradient-text">{item.h1}</h1>
          <p className="mt-4 text-base text-slate">Действующая редакция от {LEGAL_UPDATED}.</p>

          <LegalArticle text={item.text} />

          <nav aria-label="Другие документы" className="mt-16 border-t border-slate-soft/40 pt-8">
            <p className="text-base text-slate">Ещё документы</p>
            <ul className="mt-4 flex flex-col gap-3 text-lg">
              {others.map((other) => (
                <li key={other.slug}>
                  <Link href={legalPath(other.slug)} className="font-medium underline-offset-4 hover:text-flame hover:underline">
                    {other.nav}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
