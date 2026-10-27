import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { OpenStoreForm } from "@loal/app-kit";
import { Icon, PageHeader } from "@loal/ui/shadcn";
import { Link, useNavigate } from "react-router";

/** Открыть ещё одно заведение прямо из кабинета — телефон берётся из сессии, код не нужен. */
export function OpenStorePage() {
  const navigate = useNavigate();
  return (
    <section className="flex flex-col gap-6">
      <Link to="/stores" className="inline-flex items-center gap-1.5 text-base text-muted-foreground hover:text-foreground">
        <Icon icon={ArrowLeft01Icon} size={18} />
        Мои заведения
      </Link>
      <PageHeader
        title="Новое заведение"
        description="Заполните данные — мы подтвердим заведение, и оно появится в «Моих заведениях»."
      />
      <OpenStoreForm onDone={() => navigate("/stores")} />
    </section>
  );
}
