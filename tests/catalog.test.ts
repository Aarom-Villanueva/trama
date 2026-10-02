import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { products } from "../data/products";
import { featuredProductSlugs } from "../data/catalog-presentation";
import { availabilityOf } from "../features/products/types";
import { buildCatalogFixture, fixtureCounts, toMinorUnits } from "../scripts/lib/catalog-fixture";
import { validateLocalUrl } from "../scripts/lib/local-db";

test("fixture derives counts, order, featured products, sizes and files from the current catalog", () => {
  const fixture = buildCatalogFixture();
  const counts = fixtureCounts(fixture);
  assert.equal(counts.products, products.length);
  assert.equal(counts.categories, new Set(products.map((p) => p.category)).size);
  assert.equal(counts.variants, products.reduce((n, p) => n + p.sizes.length, 0));
  assert.equal(counts.images, products.reduce((n, p) => n + Object.keys(p.images).length, 0));
  assert.equal(counts.featured, featuredProductSlugs.length);
  assert.deepEqual(fixture, buildCatalogFixture());
  assert.equal(new Set(fixture.entries.flatMap((e) => e.variants.map((v) => v.sku))).size, counts.variants);
  assert.deepEqual(fixture.entries.filter((p) => p.product.featuredPosition !== null)
    .sort((a, b) => a.product.featuredPosition! - b.product.featuredPosition!).map((p) => p.product.slug), [...featuredProductSlugs]);
  for (const [index, entry] of fixture.entries.entries()) {
    const source = products[index];
    assert.equal(entry.product.slug, source.slug);
    assert.equal(entry.product.position, index);
    assert.equal(entry.product.priceMinor, toMinorUnits(String(source.price)));
    assert.deepEqual(entry.variants.map((v) => v.sizeCode), source.sizes);
    assert.deepEqual(entry.images.map((i) => i.url), [source.images.front, source.images.back]);
    assert.ok(entry.variants.every((v) => v.stock === null));
    for (const image of entry.images) assert.ok(existsSync(join("public", image.url)));
  }
});

test("money conversion is exact and rejects rounding or overflow", () => {
  assert.equal(toMinorUnits("0.29"), 29);
  assert.equal(toMinorUnits("49.90"), 4990);
  assert.equal(toMinorUnits("119"), 11900);
  assert.equal(toMinorUnits("21474836.47"), 2147483647);
  for (const invalid of ["1.009", "-1", "NaN", "Infinity", "1e2", "21474836.48"]) {
    assert.throws(() => toMinorUnits(invalid));
  }
});

test("unknown stock has its own state, never unlimited/available", () => {
  assert.equal(availabilityOf(null), "to_confirm");
  assert.equal(availabilityOf(0), "out_of_stock");
  assert.equal(availabilityOf(1), "available");
  assert.throws(() => availabilityOf(-1));
});

test("local database tools reject remote or unrelated targets without exposing credentials", () => {
  const local = "postgresql://trama_local:fictional@127.0.0.1:55432/trama_local";
  assert.equal(validateLocalUrl(local), local);
  for (const invalid of [undefined, "not-a-url", local.replace("127.0.0.1", "remote.example"), local.replace("55432", "5432"), local.replace("/trama_local", "/other_project"), local + "?host=remote.example", local.replace("trama_local:", "postgres:")]) {
    assert.throws(() => validateLocalUrl(invalid), (error: unknown) => error instanceof Error && !error.message.includes("fictional"));
  }
});

test("data access cannot be imported without the server-only condition", () => {
  const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", "import './db/index.ts'"], { encoding: "utf8", env: { ...process.env, NODE_OPTIONS: "" } });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Server Component/);
});
