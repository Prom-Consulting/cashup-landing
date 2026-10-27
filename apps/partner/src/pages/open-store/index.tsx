import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { OpenStoreForm, useApi } from "@loal/app-kit";
import { merchantCabinetApi, coordsFrom2gis } from "@loal/api";
import { type MapMarker } from "@loal/ui/location-picker";
import { Icon, PageHeader } from "@loal/ui/shadcn";
import { useQueries } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { useCurrentMerchant } from "../../entities/session/model";

/** Координаты уже открытых заведений владельца — для контекста на карте выбора нового. */
function useExistingPoints(): MapMarker[] {
  const api = useApi();
  const { memberships } = useCurrentMerchant();
  const profiles = useQueries({
    queries: memberships.map((m) => ({
      queryKey: ["merchants", m.merchantId, "profile"],
      queryFn: () => merchantCabinetApi(api).profile(m.merchantId),
      staleTime: 60_000,
      retry: false,
    })),
  });
  return memberships.flatMap((m, i) => {
    const profile = profiles[i]?.data;
    if (!profile) return [];
    const geo =
      profile.lat != null && profile.lng != null
        ? { lat: profile.lat, lng: profile.lng }
        : coordsFrom2gis(profile.twogisUrl);
    return geo ? [{ ...geo, label: m.merchantName ?? "Моё заведение" }] : [];
  });
}

/** Открыть ещё одно заведение прямо из кабинета — телефон берётся из сессии, код не нужен. */
export function OpenStorePage() {
  const navigate = useNavigate();
  const existingPoints = useExistingPoints();
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
      <OpenStoreForm existingPoints={existingPoints} onDone={() => navigate("/stores")} />
    </section>
  );
}
