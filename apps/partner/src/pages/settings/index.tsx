import { Loading } from "@loal/ui/shadcn";
import { Navigate } from "react-router";
import { useTariff } from "../../entities/merchant/api";
import { useCurrentMerchant } from "../../entities/session/model";
import { visibleSections } from "../../shared/config/settings-sections";

/** «Настройки» сами по себе — первый доступный раздел: список разделов уже в боковом меню. */
export function SettingsPage() {
  const { merchantId, canManage, canRunBranch } = useCurrentMerchant();
  const { tariff, abilities, isPending } = useTariff(merchantId ?? "");
  if (isPending) return <Loading rows={3} />;
  const first = visibleSections({ canManage, canRunBranch, tariff, abilities })[0];
  return <Navigate to={first?.to ?? "/profile"} replace />;
}
