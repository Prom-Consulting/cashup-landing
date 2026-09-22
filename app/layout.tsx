import type { Metadata } from "next";
import { Google_Sans, Jost } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Loal — 100 000 сом бонусами каждый месяц",
  description:
    "Подписка Loal за 5–10 $ в месяц: карта в Apple Wallet с балансом 100 000 сом бонусами, который обновляется каждый оплаченный месяц. Платите бонусами у партнёров.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${googleSans.variable} ${jost.variable} h-full antialiased`}
    >
      <head>
        {/* Hide hero content only while the GSAP intro is expected, with a failsafe if scripts never run. */}
        <script dangerouslySetInnerHTML={{ __html: MOTION_PENDING_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
