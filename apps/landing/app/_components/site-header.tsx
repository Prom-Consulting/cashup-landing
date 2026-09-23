import Link from "next/link";
import { Logo } from "@loal/ui/logo";
import { MobileMenu } from "./mobile-menu";

const nav = [
  { label: "Как работает", href: "/#how" },
  { label: "Партнёры", href: "/partners" },
  { label: "Тарифы", href: "/#price" },
  { label: "Бизнесу", href: "/become-partner" },
];

export function SiteHeader({
  cta = { label: "Оформить подписку", href: "/#price" },
}: {
  cta?: { label: string; href: string };
}) {
  return (
    <header className="relative z-50 mx-auto flex w-full max-w-[1512px] items-center justify-between gap-6 px-5 py-5 sm:px-12">
      <Link href="/" aria-label="Loal, на главную" className="relative z-50">
        <Logo />
      </Link>
      <nav aria-label="Разделы" className="hidden lg:block">
        <ul className="flex gap-6 text-lg font-medium">
          {nav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="whitespace-nowrap transition-colors hover:text-flame">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Link
        href={cta.href}
        className="hidden rounded-full bg-flame px-5 py-4 text-lg font-medium whitespace-nowrap text-cream transition-colors hover:bg-graphite lg:inline-flex"
      >
        {cta.label}
      </Link>
      <MobileMenu nav={nav} cta={cta} />
    </header>
  );
}
