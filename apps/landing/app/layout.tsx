import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { JsonLd } from "./_components/json-ld";
import { EMAIL, PHONE, SITE_URL, SOCIAL_LINKS } from "./_data/site";
import { AppBanner } from "./_components/app-banner";

// Шрифты брендбука Loal 2026 хранятся локально: сборке не нужен Google Fonts.
// Полные файлы содержат латиницу, кириллицу и кыргызские буквы Ң, Ө, Ү.
const heading = localFont({
  src: "./fonts/nunito-sans-variable.ttf",
  variable: "--font-heading",
  weight: "600 900",
  display: "swap",
});

const body = localFont({
  src: "./fonts/nunito-variable.ttf",
  variable: "--font-body",
  weight: "400 700",
  display: "swap",
});

const MOTION_PENDING_SCRIPT = `(function(){var d=document.documentElement;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;d.classList.add("motion-pending");setTimeout(function(){d.classList.remove("motion-pending")},4000)})();`;

const DESCRIPTION =
  "Loal — бонусы по подписке. 990 сом за 30 дней: карта в Apple Wallet или Google Wallet и 15 000 бонусов на каждый цикл. Бонусами закрывается часть покупки у партнёров в Бишкеке.";

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
      ...(SOCIAL_LINKS.length ? { sameAs: SOCIAL_LINKS.map((item) => item.url) } : {}),
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
        <AppBanner />
        {children}
      </body>
    </html>
  );
}
