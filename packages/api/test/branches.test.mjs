import assert from "node:assert/strict";
import test from "node:test";
import { membershipBranchIds, membershipSchema } from "../src/schemas/auth.ts";
import { cashierOverviewSchema } from "../src/schemas/cashier.ts";
import { createMerchantInputSchema, memberBranchIds, merchantMemberSchema } from "../src/schemas/merchant.ts";
import { addMemberInputSchema } from "../src/schemas/merchant-ops.ts";

const BRANCH_A = "6f1d6a2e-0d5c-4a8a-9b1f-1a2b3c4d5e6f";
const BRANCH_B = "7a2e7b3f-1e6d-4b9b-8c2a-2b3c4d5e6f70";

test("a new token lists several branches, an old one falls back to its single branch", () => {
  const fresh = membershipSchema.parse({ memberId: "m", merchantId: "x", role: "staff", branchIds: [BRANCH_A, BRANCH_B], branchId: null });
  assert.deepEqual(membershipBranchIds(fresh), [BRANCH_A, BRANCH_B]);
  const old = membershipSchema.parse({ memberId: "m", merchantId: "x", role: "staff", branchId: BRANCH_A });
  assert.deepEqual(membershipBranchIds(old), [BRANCH_A]);
  const owner = membershipSchema.parse({ memberId: "m", merchantId: "x", role: "admin", branchIds: [] });
  assert.deepEqual(membershipBranchIds(owner), []);
});

test("a member from an old response still shows its branch", () => {
  const member = merchantMemberSchema.parse({ id: "1", merchantId: "x", role: "staff", branchId: BRANCH_B });
  assert.deepEqual(memberBranchIds(member), [BRANCH_B]);
});

test("a branch admin needs at least one branch, a cashier may start without", () => {
  const base = { fullName: "Айбек", phone: "996700123456" };
  assert.equal(addMemberInputSchema.safeParse({ ...base, role: "branch_admin", branchIds: [] }).success, false);
  assert.equal(addMemberInputSchema.safeParse({ ...base, role: "branch_admin", branchIds: [BRANCH_A, BRANCH_B] }).success, true);
  const cashier = addMemberInputSchema.parse({ ...base, role: "staff" });
  assert.deepEqual(cashier.branchIds, []);
  assert.equal("branchId" in cashier, false);
});

test("the cashier overview without branches parses to an empty list", () => {
  const overview = cashierOverviewSchema.parse({ branch: null });
  assert.deepEqual(overview.branches, []);
});

test("a new merchant cannot be created without the owner's phone", () => {
  assert.equal(createMerchantInputSchema.safeParse({ slug: "cafe", name: "Кафе" }).success, false);
  assert.equal(createMerchantInputSchema.safeParse({ slug: "cafe", name: "Кафе", contactPhone: "996700123456" }).success, true);
});
