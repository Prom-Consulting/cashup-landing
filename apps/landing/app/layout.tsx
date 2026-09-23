import type { Metadata } from "next";
import { Google_Sans, Jost } from "next/font/google";
import "./globals.css";
import { JsonLd } from "./_components/json-ld";
import { EMAIL, PHONE, SITE_URL } from "./_data/site";

// Шрифт макета главной (Figma «loal»): весь текст — Google Sans.
const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "700"],
});

// Jost остаётся только в логотипе и метке OctōPAY, как в макете.
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["700"],
});

const MOTION_PENDING_SCRIPT = `(function(){var d=document.documentElement;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;d.classList.add("motion-pending");setTimeout(function(){d.classList.remove("motion-pending")},4000)})();`;

const DESCRIPTION =
  "Подписка Loal за 10 $ в месяц: карта в Apple Wallet с балансом 100 000 сом бонусами, который обновляется каждый оплаченный месяц. Платите бонусами у партнёров.";

// Картинка превью (opengraph-image.png) и иконки лежат в app/ и подключаются по соглашению Next.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Loal — 100 000 сом бонусами каждый месяц",
    template: "%s — Loal",
  },
  description: DESCRIPTION,
  applicationName: "Loal",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Loal",
    url: "/",
    title: "Loal — 100 000 сом бонусами каждый месяц",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Loal — 100 000 сом бонусами каждый месяц",
    description: DESCRIPTION,
  },
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
    <html lang="ru" suppressHydrationWarning className={`${googleSans.variable} ${jost.variable} h-full antialiased`}>
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
