import assert from "node:assert/strict";
import test from "node:test";
import { createPendingPromoStore, promoFromSearch, promoRegistrationUrl } from "../src/promo-link.ts";
import { editPromoBody, editPromoInitialValues, editPromoFormSchema } from "../src/schemas/promo.ts";

const promo = { id: "test", code: "WELCOME", audience: "client", months: 1, maxUses: 50, uses: 3, expiresAt: "2026-12-31T10:15:00.000Z", active: true, note: "Old note", createdAt: "2026-01-01T00:00:00Z" };
function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

test("registration links normalize codes and round-trip through the login query", () => {
  const link = promoRegistrationUrl("https://client.loal.kg/", " welcome-26 ");
  assert.equal(link, "https://client.loal.kg/register?promo=WELCOME-26");
  assert.equal(promoFromSearch(new URL(link).search), "WELCOME-26");
  assert.throws(() => promoRegistrationUrl("https://client.loal.kg", "<script>"));
});
test("missing or malformed link codes are ignored", () => {
  for (const search of ["", "?promo=", "?promo=abc", "?promo=%3Cscript%3E", "?promo=" + "A".repeat(33)]) assert.equal(promoFromSearch(search), undefined);
});
test("a code survives OTP and a page reload, then is cleared after application", () => {
  const saved = storage();
  const first = createPendingPromoStore(() => saved);
  first.remember("welcome-26");
  const reloaded = createPendingPromoStore(() => saved);
  assert.equal(reloaded.recall(), "WELCOME-26");
  reloaded.clear();
  assert.equal(reloaded.recall(), undefined);
});
test("expired pending links are not applied to a later registration", () => {
  const saved = storage();
  let now = 1000;
  const pending = createPendingPromoStore(() => saved, () => now);
  pending.remember("WELCOME");
  now += 30 * 24 * 60 * 60 * 1000;
  assert.equal(pending.recall(), undefined);
});
test("blocked browser storage does not lose the promo during OTP navigation", () => {
  const pending = createPendingPromoStore(() => { throw new Error("blocked"); });
  pending.remember("welcome");
  assert.equal(pending.recall(), "WELCOME");
  pending.clear();
  assert.equal(pending.recall(), undefined);
});
test("another link replaces the pending code in the same tab", () => {
  const saved = storage();
  const pending = createPendingPromoStore(() => saved);
  pending.remember("FIRST");
  pending.remember("SECOND");
  assert.equal(pending.recall(), "SECOND");
});
test("editing a note preserves the exact expiry timestamp", () => {
  const values = { ...editPromoInitialValues(promo), note: " New note " };
  assert.deepEqual(editPromoBody(values, promo), { active: true, maxUses: 50, note: "New note" });
});
test("clearing optional edit fields sends null, not empty strings", () => {
  assert.deepEqual(editPromoBody({ active: false, maxUses: "", expiresAt: "", note: " " }, promo), { active: false, maxUses: null, expiresAt: null, note: null });
});
test("edited expiration uses the end of the selected local day", () => {
  const body = editPromoBody({ ...editPromoInitialValues(promo), expiresAt: "2027-01-05" }, promo);
  assert.equal(body.expiresAt, new Date("2027-01-05T23:59:59.999").toISOString());
  assert.equal("code" in body, false);
  assert.equal("audience" in body, false);
  assert.equal("months" in body, false);
});
test("edit validates positive whole limits and note length", () => {
  const values = editPromoInitialValues(promo);
  for (const maxUses of ["0", "-1", "1.5", "abc"]) assert.equal(editPromoFormSchema.safeParse({ ...values, maxUses }).success, false);
  assert.equal(editPromoFormSchema.safeParse({ ...values, note: "a".repeat(201) }).success, false);
  // An expired code can still have its note edited or be disabled.
  assert.equal(editPromoFormSchema.safeParse({ ...values, expiresAt: "2020-01-01" }).success, true);
});


test("a link uses the newly issued session and applies only the normalized code", async (t) => {
  const { createApiClient } = await import("../src/http.ts");
  const { authApi } = await import("../src/endpoints/auth.ts");
  const { promoApi } = await import("../src/endpoints/promo.ts");
  let access = null;
  const tokens = { read: () => access, write: (value) => { access = value; }, readRefresh: () => null, writeSession: (value) => { access = value?.accessToken ?? null; } };
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ path: new URL(url).pathname, headers: new Headers(init.headers), body: JSON.parse(init.body) });
    return Response.json(calls.length === 1
      ? { accessToken: "new-client-token", expiresIn: "12h", isNewAccount: true }
      : { code: "WELCOME-26", audience: "client", months: 1, subscription: { status: "active" } });
  });
  const api = createApiClient({ baseUrl: "https://test.invalid", tokens });
  const pending = createPendingPromoStore(storage);
  pending.remember(promoFromSearch("?promo=welcome-26"));
  const signedIn = await authApi(api).loginByOtp({ phone: "996700123456", otp: "123456" });
  tokens.writeSession(signedIn);
  const result = await promoApi(api).redeemForMe({ code: pending.recall() });
  assert.equal(result.subscription.status, "active");
  assert.equal(calls[0].path, "/auth/login");
  assert.equal("promoCode" in calls[0].body, false);
  assert.equal(calls[1].path, "/v1/me/promo-code");
  assert.equal(calls[1].headers.get("Authorization"), "Bearer new-client-token");
  assert.deepEqual(calls[1].body, { code: "WELCOME-26" });
});

test("editing sends a PATCH with mutable fields and preserves server redemption history", async (t) => {
  const { createApiClient } = await import("../src/http.ts");
  const { promoApi } = await import("../src/endpoints/promo.ts");
  let sent;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    sent = { url, method: init.method, body: JSON.parse(init.body) };
    return Response.json({ ...promo, note: "Updated" });
  });
  const tokens = { read: () => "admin-token", write() {}, readRefresh: () => null, writeSession() {} };
  const api = createApiClient({ baseUrl: "https://test.invalid", tokens });
  const result = await promoApi(api).update(promo.id, editPromoBody({ ...editPromoInitialValues(promo), note: "Updated" }, promo));
  assert.equal(sent.method, "PATCH");
  assert.equal(new URL(sent.url).pathname, "/admin/v1/promo-codes/test");
  assert.deepEqual(sent.body, { active: true, maxUses: 50, note: "Updated" });
  assert.equal(result.uses, 3);
  assert.equal(result.months, 1);
});
