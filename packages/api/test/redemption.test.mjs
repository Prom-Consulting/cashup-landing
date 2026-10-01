import assert from "node:assert/strict";
import test from "node:test";
import { purchasedItemInputSchema } from "../src/schemas/redemption.ts";

const item = { price: 100, deductionPercent: 5 };

test("a blank product name is stored as a generic purchase", () => {
  assert.equal(purchasedItemInputSchema.parse({ ...item, productName: "" }).productName, "Покупка");
  assert.equal(purchasedItemInputSchema.parse({ ...item, productName: "   " }).productName, "Покупка");
});

test("a supplied product name is trimmed and remains limited to 200 characters", () => {
  assert.equal(purchasedItemInputSchema.parse({ ...item, productName: "  Кофе  " }).productName, "Кофе");
  assert.throws(() => purchasedItemInputSchema.parse({ ...item, productName: "x".repeat(201) }));
});
