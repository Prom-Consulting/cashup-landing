import Link from "next/link";
import { Logo } from "./logo";

const nav = [
  { label: "Как работает", href: "/#how" },
  { label: "Партнёры", href: "/partners" },
  { label: "Тарифы", href: "/#price" },
  { label: "Бизнесу", href: "/become-partner" },
];

export function SiteHeader({ cta = { label: "Оформить подписку", href: "/#price" } }: {
  cta?: { label: string; href: string };
}) {
  return (
    <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 px-5 py-6 sm:px-10">
      <Link href="/" aria-label="Loal, на главную">
        <Logo />
      </Link>
      <nav aria-label="Разделы" className="hidden md:block">
        <ul className="flex gap-8 font-medium">
          {nav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="underline-offset-4 hover:text-flame-ink hover:underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Link
        href={cta.href}
        className="rounded-full bg-flame-ink px-5 py-2.5 text-sm font-bold text-paper transition-colors hover:bg-graphite"
      >
        {cta.label}
      </Link>
    </header>
  );
}
