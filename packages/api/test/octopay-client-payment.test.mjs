import assert from "node:assert/strict";
import test from "node:test";
import {
  isOctopayIntegrationReady,
  octopayIntegrationSchema,
} from "../src/schemas/billing.ts";
import { clientPaymentInputSchema } from "../src/schemas/client-payment.ts";

const baseIntegration = {
  connected: true,
  octopayBusinessName: "MirVostoka",
  connectedAt: "2026-10-01T00:00:00.000Z",
};

test("Octopay schema accepts a non-payable KGS account with payable count", () => {
  const status = octopayIntegrationSchema.parse({
    ...baseIntegration,
    isEnabled: true,
    invoiceReady: false,
    invoiceNotReadyReason: "KGS_BANK_ACCOUNT_NOT_PAYABLE",
    activeKgsBankAccountCount: 1,
    payableKgsBankAccountCount: 0,
    ready: false,
  });

  assert.equal(status.invoiceNotReadyReason, "KGS_BANK_ACCOUNT_NOT_PAYABLE");
  assert.equal(status.payableKgsBankAccountCount, 0);
  assert.equal(isOctopayIntegrationReady(status), false);
});

test("Octopay readiness fails closed for an old response without readiness fields", () => {
  const status = octopayIntegrationSchema.parse(baseIntegration);
  assert.equal(isOctopayIntegrationReady(status), false);
});

test("Octopay readiness accepts either the aggregate flag or complete component flags", () => {
  assert.equal(isOctopayIntegrationReady({ ...baseIntegration, ready: true }), true);
  assert.equal(isOctopayIntegrationReady({
    ...baseIntegration,
    isEnabled: true,
    invoiceReady: true,
  }), true);
});

test("Octopay readiness accepts a selected account when several KGS accounts are active", () => {
  const status = octopayIntegrationSchema.parse({
    ...baseIntegration,
    isEnabled: true,
    invoiceReady: true,
    invoiceNotReadyReason: null,
    activeKgsBankAccountCount: 2,
    payableKgsBankAccountCount: 2,
  });

  assert.equal(isOctopayIntegrationReady(status), true);
});

test("client invoice amount supports kopecks but rejects fractions smaller than one kopeck", () => {
  const requestId = "11111111-1111-4111-8111-111111111111";
  assert.deepEqual(clientPaymentInputSchema.parse({ requestId, amount: "10.01" }), { requestId, amount: 10.01 });
  assert.throws(() => clientPaymentInputSchema.parse({ requestId, amount: "1.005" }));
  assert.throws(() => clientPaymentInputSchema.parse({ requestId, amount: "10.001" }));
  assert.throws(() => clientPaymentInputSchema.parse({ requestId: "not-a-uuid", amount: "10.01" }));
  assert.throws(() => clientPaymentInputSchema.parse({ amount: "10.01" }));
});
