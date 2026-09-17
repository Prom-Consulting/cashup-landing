import type { Metadata } from "next";
import { Onest, Sofia_Sans_Extra_Condensed } from "next/font/google";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
});

const sofiaCondensed = Sofia_Sans_Extra_Condensed({
  variable: "--font-sofia-condensed",
  subsets: ["latin", "cyrillic"],
  weight: ["900"],
});

const MOTION_PENDING_SCRIPT = `(function(){var d=document.documentElement;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;d.classList.add("motion-pending");setTimeout(function(){d.classList.remove("motion-pending")},4000)})();`;

export const metadata: Metadata = {
  title: "CashUp — 100 000 сом бонусами каждый месяц",
  description:
    "Подписка CashUp за 5–10 $ в месяц: карта в Apple Wallet и Google Wallet с балансом 100 000 сом бонусами, который обновляется каждый оплаченный месяц. Платите бонусами у партнёров.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${onest.variable} ${sofiaCondensed.variable} h-full antialiased`}
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
