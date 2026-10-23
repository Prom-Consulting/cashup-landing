import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "../_components/site-footer";
import { SiteHeader } from "../_components/site-header";
import { PAGE_SEO, openGraph } from "../_data/seo";
import { LEGAL_DOCS, LEGAL_UPDATED, legalPath } from "./docs";

export const metadata: Metadata = {
  title: { absolute: PAGE_SEO.legal.title },
  description: PAGE_SEO.legal.description,
  alternates: { canonical: "/legal" },
  openGraph: openGraph("/legal", PAGE_SEO.legal.title, PAGE_SEO.legal.description),
};

export default function LegalHubPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1 overflow-x-clip">
        <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-10 sm:py-20 xl:py-24">
          <h1 className="display max-w-[20ch] text-[clamp(2.08rem,4.86vw,4.14rem)] brand-gradient-text">
            Правовые документы
          </h1>
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-graphite/90">
            Условия, на которых работает программа лояльности Loal. Действующая редакция от {LEGAL_UPDATED}.
          </p>

          <ul className="mt-12 grid gap-5 md:grid-cols-2">
            {LEGAL_DOCS.map((doc) => (
              <li key={doc.slug}>
                <Link
                  href={legalPath(doc.slug)}
                  className="group flex h-full flex-col rounded-[28px] bg-paper p-8 transition-colors hover:bg-cream/70"
                >
                  <h2 className="text-xl font-bold leading-snug group-hover:text-flame">{doc.nav}</h2>
                  <p className="mt-3 max-w-[46ch] leading-relaxed text-graphite/85">{doc.summary}</p>
                  <span className="mt-6 text-base font-medium text-flame-ink underline-offset-4 group-hover:underline">
                    Открыть документ →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
