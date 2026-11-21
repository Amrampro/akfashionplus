import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import crypto from "node:crypto";
import { accountUploadPath } from "../src/services/accountUploads.service.js";

async function loadModel({ failAt } = {}) {
  const calls = [];
  let committed = false;
  const database = new vm.SyntheticModule(["query", "transaction"], function () {
    this.setExport("query", () => { throw new Error("Must use the transaction"); });
    this.setExport("transaction", async (work) => {
      const result = await work({ execute: async (sql, params) => {
        calls.push({ sql, params });
        if (failAt && sql.includes(failAt)) throw new Error("Database unavailable");
        if (sql.startsWith("SELECT email")) return [[{ email: "customer@example.com", avatar_url: "/uploads/avatars/photo.jpg" }]];
        if (sql.startsWith("SELECT i.image_url")) return [[{ image_url: "/uploads/second-hand-proposals/item.jpg" }]];
        return [{ affectedRows: 1 }];
      } });
      committed = true;
      return result;
    });
  });
  const cryptoModule = new vm.SyntheticModule(["default"], function () { this.setExport("default", crypto); });
  const model = new vm.SourceTextModule(await readFile(new URL("../src/models/user.model.js", import.meta.url), "utf8"));
  await model.link((specifier) => specifier === "node:crypto" ? cryptoModule : database);
  await model.evaluate();
  return { model: model.namespace, calls, committed: () => committed };
}

test("account deletion removes personal data and invalidates access while retaining commercial records", async () => {
  const fixture = await loadModel();
  const uploads = await fixture.model.deleteOwnAccount(42);
  assert.equal(fixture.committed(), true);
  assert.equal(uploads.length, 2);
  for (const table of ["user_addresses", "favorites", "notifications", "product_reviews", "carts", "second_hand_proposals"]) {
    assert.ok(fixture.calls.some(({ sql, params }) => sql === `DELETE FROM ${table} WHERE user_id = :id` && params.id === 42));
  }
  assert.ok(fixture.calls.some(({ sql, params }) => sql.includes("DELETE FROM password_reset_tokens") && params.email === "customer@example.com"));
  const anonymization = fixture.calls.find(({ sql }) => sql.includes("first_name = 'Deleted'"));
  assert.match(anonymization.params.email, /^deleted-.+@deleted\.invalid$/);
  assert.match(anonymization.sql, /status = 'inactive'/);
  assert.match(anonymization.sql, /avatar_url = NULL/);
  assert.equal(anonymization.params.password.length, 128);
  assert.ok(!fixture.calls.some(({ sql }) => /^DELETE FROM (orders|payments|company_resales)\b/.test(sql)));
});

test("a database error prevents the transaction from committing", async () => {
  const fixture = await loadModel({ failAt: "DELETE FROM favorites" });
  await assert.rejects(fixture.model.deleteOwnAccount(42), /Database unavailable/);
  assert.equal(fixture.committed(), false);
  assert.ok(!fixture.calls.some(({ sql }) => sql.includes("first_name = 'Deleted'")));
});

test("upload cleanup cannot target traversal paths or shared product assets", () => {
  assert.ok(accountUploadPath("https://akfashionplus.com/uploads/avatars/123-photo.jpg"));
  for (const value of ["/uploads/products/photo.jpg", "/uploads/avatars/..", "/uploads/avatars/%2e%2e%2fsecret", "/uploads/avatars/%5csecret", "%", "file:///etc/passwd"]) {
    assert.equal(accountUploadPath(value), null);
  }
});
