import assert from "node:assert/strict";
import test from "node:test";
import { createApiClient } from "../src/http.ts";
import { promoApi, promoErrorText } from "../src/endpoints/promo.ts";
import { myCardSchema } from "../src/schemas/me.ts";
import {
  createPromoBody,
  createPromoFormSchema,
  editPromoBody,
  editPromoInitialValues,
  promoCodeSchema,
  promoRedemptionSchema,
  promoRedeemResultSchema,
  promoSuccessText,
  promoRewardText,
} from "../src/schemas/promo.ts";

const form = {
  code: "START-10000", audience: "client", kind: "subscription_cycle",
  months: 1, cycleBalance: 10000, clientEligibility: "without_subscription",
  maxUses: "", expiresAt: "", note: "",
};
const promo = {
  ...createPromoBody(form), id: "cycle", active: true, uses: 0,
  createdAt: "2026-10-22T00:00:00Z",
};
const tokens = { read: () => "test-token", write() {}, readRefresh: () => null, writeSession() {} };
const api = () => createApiClient({ baseUrl: "https://test.invalid", tokens });

test("cycle creation posts the new contract and preserves optional settings", async (t) => {
  let sent;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    sent = { path: new URL(url).pathname, method: init.method, body: JSON.parse(init.body) };
    return Response.json({ ...promo, cycleBalance: 7200, maxUses: 20 });
  });
  const result = await promoApi(api()).create({
    ...form, code: " start-10000 ", cycleBalance: "7200", maxUses: "20",
    expiresAt: "2099-12-31", note: " Campaign ",
  });
  assert.equal(sent.path, "/admin/v1/promo-codes");
  assert.equal(sent.method, "POST");
  assert.deepEqual(sent.body, {
    code: "START-10000", audience: "client", kind: "subscription_cycle", months: 1,
    cycleBalance: 7200, clientEligibility: "without_subscription", maxUses: 20,
    expiresAt: new Date("2099-12-31T23:59:59").toISOString(), note: "Campaign",
  });
  assert.equal(result.kind, "subscription_cycle");
  assert.equal(result.cycleBalance, 7200);
});

test("an empty code is omitted for server generation", () => {
  const body = createPromoBody({ ...form, code: "" });
  assert.equal("code" in body, false);
  assert.equal(body.cycleBalance, 10000);
  assert.equal(body.maxUses, null);
  assert.equal(body.expiresAt, null);
  assert.equal(body.note, null);
});

test("cycle balance must be a positive whole number", () => {
  for (const cycleBalance of ["", " ", "0", "-1", "1.5", "abc", 0, -10, 1.5, Infinity, undefined]) {
    const result = createPromoFormSchema.safeParse({ ...form, cycleBalance });
    assert.equal(result.success, false, `accepted ${String(cycleBalance)}`);
    assert.ok(result.error.issues.some((issue) => issue.path[0] === "cycleBalance"));
  }
  for (const cycleBalance of [1, "1", "10000", 7300]) {
    assert.equal(createPromoBody({ ...form, cycleBalance }).cycleBalance, Number(cycleBalance));
  }
});

test("a cycle cannot target merchants, last several months, or allow previous subscribers", () => {
  for (const change of [{ audience: "merchant" }, { months: 2 }, { clientEligibility: "all" }]) {
    assert.equal(createPromoFormSchema.safeParse({ ...form, ...change }).success, false);
  }
});

test("switching back to months drops the hidden cycle balance from the request", () => {
  for (const audience of ["client", "merchant"]) {
    const body = createPromoBody({ ...form, audience, kind: "months", months: "6", cycleBalance: "", clientEligibility: "all" });
    assert.equal(body.months, 6);
    assert.equal(body.kind, "months");
    assert.equal("cycleBalance" in body, false);
    assert.equal(body.clientEligibility, audience === "client" ? "all" : undefined);
  }
});

test("list and redemption history retain kind and balance, including legacy defaults", async (t) => {
  const legacy = { ...promo, id: "old", kind: "months", cycleBalance: null };
  const history = { id: "redemption", userId: "client", months: 1, createdAt: promo.createdAt, kind: "subscription_cycle", cycleBalance: 10000 };
  t.mock.method(globalThis, "fetch", async (url) => Response.json(
    new URL(url).pathname.endsWith("/redemptions") ? [history, { ...history, id: "old", kind: "months", cycleBalance: null }] : [promo, legacy],
  ));
  const codes = await promoApi(api()).list();
  const rows = await promoApi(api()).redemptions("cycle");
  for (const items of [codes, rows]) {
    assert.equal(items[0].kind, "subscription_cycle");
    assert.equal(items[0].cycleBalance, 10000);
    assert.equal(items[1].kind, "months");
    assert.equal(items[1].cycleBalance, null);
  }
  const { kind, cycleBalance, ...oldCode } = legacy;
  const { kind: historyKind, cycleBalance: historyBalance, ...oldHistory } = history;
  for (const parsed of [promoCodeSchema.parse(oldCode), promoRedemptionSchema.parse(oldHistory)]) {
    assert.equal(parsed.kind, "months");
    assert.equal(parsed.cycleBalance, null);
  }
});

test("editing a cycle only sends mutable fields, even if immutable values are injected", async (t) => {
  let sent;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    sent = { path: new URL(url).pathname, method: init.method, body: JSON.parse(init.body) };
    return Response.json({ ...promo, note: "Updated" });
  });
  const input = editPromoBody({
    ...editPromoInitialValues(promo), note: "Updated",
    kind: "months", audience: "merchant", months: 12, cycleBalance: 15000,
  }, promo);
  await promoApi(api()).update(promo.id, input);
  assert.equal(sent.path, "/admin/v1/promo-codes/cycle");
  assert.equal(sent.method, "PATCH");
  assert.deepEqual(sent.body, { active: true, maxUses: null, note: "Updated" });
  assert.throws(() => editPromoBody({ ...editPromoInitialValues(promo), clientEligibility: "all" }, promo));
});

test("months codes can still change client eligibility", () => {
  const monthsPromo = { ...promo, kind: "months", cycleBalance: null, clientEligibility: "all" };
  const input = editPromoBody({ ...editPromoInitialValues(monthsPromo), clientEligibility: "without_subscription" }, monthsPromo);
  assert.equal(input.clientEligibility, "without_subscription");
});

test("client redemption still posts only code and displays the returned cycle balance", async (t) => {
  let sent;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    sent = { path: new URL(url).pathname, method: init.method, body: JSON.parse(init.body) };
    return Response.json({ code: promo.code, audience: "client", kind: "subscription_cycle", months: 1, cycleBalance: 7200, subscription: { status: "active" } });
  });
  const result = await promoApi(api()).redeemForMe({ code: " start-10000 " });
  assert.deepEqual(sent, { path: "/v1/me/promo-code", method: "POST", body: { code: "START-10000" } });
  assert.equal(promoSuccessText(result), "Промокод START-10000 принят: подписка на 30 дней, 7 200 баллов.");
  const card = myCardSchema.parse({
    serialNumber: "card", status: "active", pointsBalance: 7200,
    subscription: { status: "active", cycleStartedAt: "2026-10-22T00:00:00Z", cycleEndsAt: "2026-11-21T00:00:00Z" },
  });
  assert.equal(card.pointsBalance, 7200);
  assert.equal(Date.parse(card.subscription.cycleEndsAt) - Date.parse(card.subscription.cycleStartedAt), 30 * 86400000);
});

test("previous subscription rejection uses the required text and does not retry redemption", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    return Response.json({ error: "PROMO_SUBSCRIPTION_EXISTS", message: "Subscription existed" }, { status: 400 });
  });
  await assert.rejects(() => promoApi(api()).redeemForMe({ code: promo.code }), (error) => {
    assert.equal(error.status, 400);
    assert.equal(promoErrorText(error), "Промокод доступен только клиентам, у которых ещё не было подписки");
    return true;
  });
  assert.equal(calls, 1);
});

test("legacy success messages keep month pluralization", () => {
  for (const [months, expected] of [[1, "месяц"], [2, "месяца"], [5, "месяцев"], [11, "месяцев"], [21, "месяц"]]) {
    const result = promoRedeemResultSchema.parse({ code: "OLD-CODE", audience: "client", months });
    assert.equal(promoSuccessText(result), `Промокод OLD-CODE принят: +${months} ${expected} подписки.`);
  }
});

test("existing bonus codes retain their creation contract and redemption display", () => {
  const body = createPromoBody({ ...form, kind: "months", reward: "bonuses", bonusAmount: "2000", bonusDays: "14", clientEligibility: "all" });
  assert.equal(body.reward, "bonuses");
  assert.equal(body.bonusAmount, 2000);
  assert.equal(body.bonusDays, 14);
  for (const field of ["kind", "months", "cycleBalance"]) assert.equal(field in body, false);
  const result = promoRedeemResultSchema.parse({ code: "GIFT-2000", audience: "client", reward: "bonuses", months: null, bonusAmount: 2000 });
  assert.equal(promoSuccessText(result), "Промокод GIFT-2000 принят: +2 000 бонусов на карте.");
  assert.equal(promoRewardText({ ...result, bonusDays: 14 }), "+2 000 бонусов на 14 дней");
  assert.equal(createPromoFormSchema.safeParse({ ...form, kind: "months", reward: "bonuses", audience: "merchant", bonusAmount: 2000, bonusDays: 14 }).success, false);
});
