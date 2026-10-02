import assert from "node:assert/strict";
import test from "node:test";
import {
  checkoutPointInputSchema,
  checkoutPointListSchema,
  clientPaymentOutcome,
  clientPaymentSchema,
  isSelfServicePayment,
} from "../src/schemas/client-payment.ts";

test("a payment is paid only when both parts are fulfilled", () => {
  assert.equal(clientPaymentOutcome({ status: "paid", fulfilled: true }), "paid");
  assert.equal(clientPaymentOutcome({ status: "paid", fulfilled: false }), "finishing");
  // Старый ответ без fulfilled — по статусу
  assert.equal(clientPaymentOutcome({ status: "paid" }), "paid");
  assert.equal(clientPaymentOutcome({ status: "pending", fulfilled: false }), "pending");
});

test("an old payment without source is a staff invoice, and null parts stay unknown", () => {
  const old = clientPaymentSchema.parse({ id: "1", amount: 700, status: "pending" });
  assert.equal(isSelfServicePayment(old), false);
  assert.equal(old.bonusAmount, undefined);
  const self = clientPaymentSchema.parse({ id: "2", source: "self_service", amount: 1000, bonusAmount: null, bankAmount: null });
  assert.equal(isSelfServicePayment(self), true);
  assert.equal(self.bonusAmount, null);
});

test("the checkout point list accepts a plain array or { points }", () => {
  const point = { id: "p", name: "Касса 1", coveragePercents: [10, 20], isActive: true, url: "https://payment.octopay.click/s/x" };
  assert.equal(checkoutPointListSchema.parse([point]).length, 1);
  assert.equal(checkoutPointListSchema.parse({ points: [point], branches: [] }).length, 1);
});

test("percents above the merchant ceiling are rejected", () => {
  const schema = checkoutPointInputSchema(20);
  assert.equal(schema.safeParse({ name: "Касса", branchId: "b", coveragePercents: [10, 20] }).success, true);
  assert.equal(schema.safeParse({ name: "Касса", branchId: "b", coveragePercents: [30] }).success, false);
  assert.equal(schema.safeParse({ name: "Касса", branchId: "b", coveragePercents: [] }).success, false);
});
