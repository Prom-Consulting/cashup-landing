import { createPendingPromoStore } from "@loal/api";

// Per tab: opening a second promotion does not replace another tab's OTP flow.
export const pendingPromo = createPendingPromoStore(() => sessionStorage);
