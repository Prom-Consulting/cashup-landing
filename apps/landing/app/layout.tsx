import type { Metadata } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { JsonLd } from "./_components/json-ld";
import { EMAIL, PHONE, SITE_URL } from "./_data/site";

// Шрифты брендбука Loal 2026: Nunito Sans — заголовки, Nunito — основной текст.
// cyrillic-ext нужен кыргызскому: Ң, Ө, Ү.
const heading = Nunito_Sans({
  variable: "--font-heading",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["600", "700", "800", "900"],
});

const body = Nunito({
  variable: "--font-body",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600", "700"],
});

const MOTION_PENDING_SCRIPT = `(function(){var d=document.documentElement;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;d.classList.add("motion-pending");setTimeout(function(){d.classList.remove("motion-pending")},4000)})();`;

const DESCRIPTION =
  "Loal — бонусы по подписке. 17 $ в месяц: карта в Apple Wallet и 15 000 бонусов на каждый оплаченный период. Бонусами закрывается часть покупки у партнёров в Бишкеке.";

// Картинка превью (opengraph-image.png) и иконки лежат в app/ и подключаются по соглашению Next.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Loal — бонусы по подписке", template: "%s — Loal" },
  description: DESCRIPTION,
  applicationName: "Loal",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Loal",
    url: "/",
    title: "Loal — бонусы по подписке",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: "Loal — бонусы по подписке", description: DESCRIPTION },
};

const organizationLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Loal",
      url: SITE_URL,
      logo: `${SITE_URL}/apple-icon.png`,
      email: EMAIL,
      telephone: PHONE,
      areaServed: { "@type": "City", name: "Бишкек" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Loal",
      inLanguage: "ru",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" suppressHydrationWarning className={`${heading.variable} ${body.variable} h-full antialiased`}>
      <head>
        {/* Hide hero content only while the GSAP intro is expected, with a failsafe if scripts never run. */}
        <script dangerouslySetInnerHTML={{ __html: MOTION_PENDING_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <JsonLd data={organizationLd} />
        {children}
      </body>
    </html>
  );
}
