import { useCashierSession } from "../../entities/cashier/api";
import { BranchOverview } from "./branch";
import { MerchantOverview } from "./merchant";

export function OverviewPage() {
  const { kind } = useCashierSession();
  return kind === "branch" ? <BranchOverview /> : <MerchantOverview />;
}
