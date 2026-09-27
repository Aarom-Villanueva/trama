import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import type { TestContext } from "node:test";
import { eq } from "drizzle-orm";
import { makeSignature } from "better-auth/crypto";
import type { Database } from "../db/client";
import { adminAccess, user } from "../db/schema/auth";
import { createAuth } from "../lib/auth";
import { AccessError, authorizeSession } from "../lib/admin-policy";
import { productService } from "../features/products/service";
import { productInput, priceToMinor, type ProductInput } from "../features/products/validation";
import { listPublishedProducts } from "../features/products/repository";
import { imageLibrary } from "../data/image-library";
import { reconcileSelection } from "../features/bag/selection";
import { toStoreProduct } from "../features/catalog/model";

// Synthetic identities/cookies exist only inside the disposable test database.
// This exercises Better Auth sessions and hooks, not a Google OAuth exchange.
export async function adminScenarios(t: TestContext, db: Database) {
  const config = { baseURL: "http://localhost:3000", secret: randomBytes(32).toString("hex"), adminEmail: "admin@example.test", clientId: "fixture", clientSecret: "fixture" };
  const auth = createAuth(db, config);
  const context = await auth.$context;
  let headers = new Headers();
  const authorize = async () => authorizeSession(db, await auth.api.getSession({ headers }), config.adminEmail);
  const service = productService(db, authorize);
  const denied = (status: number) => (error: unknown) => error instanceof AccessError && error.status === status;
  await t.test("no session rejects every administrative read and mutation", async () => {
    for (const operation of [() => service.list(), () => service.categoryOptions(), () => service.get("not-an-id"), () => service.save({}), () => service.changeStatus("not-an-id", 1, "published")]) await assert.rejects(operation, denied(401));
  });
  await t.test("identity hooks refuse unverified or non-allowlisted users", async () => {
    await assert.rejects(() => context.internalAdapter.createUser({ name: "Test", email: config.adminEmail, emailVerified: false }, { method: "oauth" }));
    await assert.rejects(() => context.internalAdapter.createUser({ name: "Test", email: "other@example.test", emailVerified: true }, { method: "oauth" }));
    assert.equal((await db.select().from(user)).length, 0);
  });
  const identity = await context.internalAdapter.createUser({ name: "Local fixture", email: config.adminEmail, emailVerified: true }, { method: "oauth" });
  await context.internalAdapter.createAccount({ userId: identity.id, providerId: "google", accountId: "fixture-google-id" });
  const session = await context.internalAdapter.createSession(identity.id);
  assert.ok(session);
  const cookie = `${context.authCookies.sessionToken.name}=${encodeURIComponent(session.token + "." + await makeSignature(session.token, config.secret))}`;
  headers = new Headers({ cookie });
  await t.test("Better Auth validates cookie; active allowlisted Google administrator is authorized", async () => {
    assert.equal((await auth.api.getSession({ headers }))?.user.id, identity.id);
    assert.ok((await service.categoryOptions()).length > 0);
    const badCookie = new Headers({ cookie: cookie.replace(/.$/, "X") });
    assert.equal(await auth.api.getSession({ headers: badCookie }), null);
    assert.equal(await auth.api.getSession({ headers: new Headers() }), null);
  });
  await t.test("a valid session cannot bypass missing/revoked permission or changed allowlist", async () => {
    await db.delete(adminAccess).where(eq(adminAccess.userId, identity.id));
    await assert.rejects(() => service.list(), denied(403));
    await db.insert(adminAccess).values({ userId: identity.id, active: false });
    await assert.rejects(() => service.save({}), denied(403));
    await assert.rejects(() => context.internalAdapter.createSession(identity.id));
    await db.update(adminAccess).set({ active: true }).where(eq(adminAccess.userId, identity.id));
    await assert.rejects(() => authorizeSession(db, { user: identity }, "other@example.test"), denied(403));
  });
  const category = (await service.categoryOptions())[0];
  const draft: ProductInput = {
    name: "Prenda temporal", slug: "test-admin-prenda", description: "Solo en base temporal", categoryId: category.id, collection: "mujer", fit: "Regular", price: "49.90", status: "draft", position: 999, featuredPosition: null,
    colors: [{ code: "negro", name: "Negro", hex: "#000000" }],
    variants: [{ colorCode: "negro", sizeCode: "M", sku: "TEST-ADMIN-M", stock: null }],
    images: [{ url: imageLibrary[0].url, alt: "Prenda de prueba", colorCode: "negro" }],
  };
  let id = "";
  await t.test("create draft stays private; publishing requires explicit stock for new variants", async () => {
    id = (await service.save(draft)).id;
    assert.equal((await listPublishedProducts(db)).some((p) => p.id === id), false);
    const saved = (await service.get(id))!;
    await assert.rejects(() => service.save({ ...saved, status: "published" }), /stock explícito/);
    await service.save({ ...saved, status: "published", variants: saved.variants.map((v) => ({ ...v, stock: 2 })) });
    const published = (await listPublishedProducts(db)).find((p) => p.id === id)!;
    assert.equal(published.priceMinor, 4990);
    assert.equal(published.variants[0].availability, "available");
    assert.equal(published.images[0].url, draft.images[0].url);
    assert.ok(!("sku" in published.variants[0]));
    assert.ok(!("version" in published));
  });
  await t.test("invalid prices, SKU, combinations, stock, categories and image URLs are rejected atomically", async () => {
    const saved = (await service.get(id))!;
    for (const price of ["-1", "0.001", "NaN", "1e2", "21474836.48"]) await assert.rejects(() => service.save({ ...saved, price }));
    for (const patch of [
      { variants: [...saved.variants, saved.variants[0]] },
      { variants: [{ ...saved.variants[0], stock: -1 }] },
      { variants: [{ ...saved.variants[0], colorCode: "inexistente" }] },
      { variants: [{ ...saved.variants[0], sku: "bad sku" }] },
      { categoryId: "00000000-0000-4000-8000-000000000000" },
      { images: [{ ...saved.images[0], url: "https://example.test/file.jpg" }] },
      { slug: "changed-existing-url" },
    ]) await assert.rejects(() => service.save({ ...saved, ...patch }));
    assert.deepEqual(await service.get(id), saved);
    assert.equal(priceToMinor("0.29"), 29);
    assert.equal(productInput.safeParse({ ...draft, status: "published" }).success, false);
  });
  await t.test("edit preserves variant identity, rejects stale edits and leaves bag quantities safe", async () => {
    const before = (await service.get(id))!;
    await service.save({ ...before, price: "59.99", name: "Prenda editada" });
    await assert.rejects(() => service.save(before), /cambió/);
    const after = (await service.get(id))!;
    assert.equal(after.variants[0].id, before.variants[0].id);
    const catalog = (await listPublishedProducts(db)).map(toStoreProduct);
    assert.equal(catalog.find((p) => p.id === id)?.priceMinor, 5999);
    assert.deepEqual(reconcileSelection([{ slug: after.slug, size: "M", quantity: 8 }], catalog), [{ variantId: after.variants[0].id, quantity: 2 }]);
    assert.deepEqual(reconcileSelection([{ variantId: "removed", quantity: 1 }, { variantId: after.variants[0].id, quantity: -1 }], catalog), []);
    await service.changeStatus(id, after.version!, "draft");
    assert.deepEqual(reconcileSelection([{ variantId: after.variants[0].id, quantity: 1 }], (await listPublishedProducts(db)).map(toStoreProduct)), []);
    const unpublished = (await service.get(id))!;
    await service.changeStatus(id, unpublished.version!, "archived");
    assert.equal((await service.get(id))!.status, "archived");
  });
  await t.test("imported demo NULL remains unknown when edited and republished", async () => {
    const demo = (await listPublishedProducts(db))[0];
    const saved = (await service.get(demo.id))!;
    assert.ok(saved.variants.every((v) => v.stock === null));
    await service.save({ ...saved, description: saved.description + " Edición de prueba." });
    const reread = (await listPublishedProducts(db)).find((p) => p.id === demo.id)!;
    assert.ok(reread.variants.every((v) => v.availability === "to_confirm"));
    const next = (await service.get(demo.id))!;
    await assert.rejects(() => service.save({ ...next, variants: [...next.variants, { colorCode: next.colors[0].code, sizeCode: "TEST", sku: "TEST-DEMO-NEW", stock: null }] }), /stock explícito/);
  });
}
