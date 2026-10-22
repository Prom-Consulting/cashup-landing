import assert from "node:assert/strict";
import test from "node:test";
import { tariffPriceInputSchema, publicMerchantTariffSchema } from "../src/schemas/tariffs.ts";
import { businessPrice, getBusinessPricing } from "../../../apps/landing/app/_data/business-pricing.ts";

const tariff = { code: "loal", name: "Больше клиентов", priceKgs: 0, regularPriceKgs: 8750,
  freeMerchantLimit: 10, enrolledMerchants: 9, freePlacesRemaining: 1, freeOfferActive: true, currency: "KGS", period: "month" };

test("tariff settings convert inputs but reject blank or invalid money and limits", () => {
  assert.deepEqual(tariffPriceInputSchema.parse({ priceKgs: "8750", freeMerchantLimit: "10" }), { priceKgs: 8750, freeMerchantLimit: 10 });
  for (const value of ["", " ", -1, 1.5, "abc", null, Infinity]) {
    assert.equal(tariffPriceInputSchema.safeParse({ priceKgs: value, freeMerchantLimit: 10 }).success, false);
    assert.equal(tariffPriceInputSchema.safeParse({ priceKgs: 8750, freeMerchantLimit: value }).success, false);
  }
  assert.equal(tariffPriceInputSchema.safeParse({ priceKgs: 0, freeMerchantLimit: 0 }).success, true);
});

test("landing switches from zero to the API price, with no hard-coded fallback", () => {
  assert.equal(businessPrice("loyalty", [publicMerchantTariffSchema.parse(tariff)]), "0 сом");
  assert.equal(businessPrice("loyalty", [{ ...tariff, priceKgs: 9123 }]).replaceAll(/\s/g, ""), "9123сом");
  assert.equal(businessPrice("loyalty", null), "Уточняем цену");
  assert.equal(businessPrice("bundle", [tariff]), "Уточняем цену");
});

test("landing reads fresh prices and never substitutes free access during an API outage", async (t) => {
  let options;
  const mock = t.mock.method(globalThis, "fetch", async (_url, init) => { options = init; return Response.json([tariff]); });
  assert.equal((await getBusinessPricing())[0].freePlacesRemaining, 1);
  assert.equal(options.cache, "no-store");
  mock.mock.mockImplementation(async () => new Response("Unavailable", { status: 503 }));
  assert.equal(await getBusinessPricing(), null);
  mock.mock.mockImplementation(async () => Response.json([{ priceKgs: 0 }]));
  assert.equal(await getBusinessPricing(), null);
});
