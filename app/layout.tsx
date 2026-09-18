import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "./_components/smooth-scroll";

// Ближайший бесплатный аналог Samsung Sharp Sans и Gilroy из брендбука:
// геометрический гротеск с одноэтажной «a», как в логотипе Loal.
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
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
      className={`${jost.variable} h-full antialiased`}
    >
      <head>
        {/* Hide hero content only while the GSAP intro is expected, with a failsafe if scripts never run. */}
        <script dangerouslySetInnerHTML={{ __html: MOTION_PENDING_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
