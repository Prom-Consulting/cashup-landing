import type { ReactNode } from "react";
import { ScrollTopOnNav } from "./scroll-top";

/** Общий каркас раздела /legal: держит докрутку наверх при переходе между документами. */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollTopOnNav />
      {children}
    </>
  );
}
