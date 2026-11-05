import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createApp } from "../src/app.js";

test("all 106 original HTTP routes have native Node handlers", () => {
  const original = JSON.parse(
    fs.readFileSync(new URL("./original-routes.json", import.meta.url)),
  );
  const app = createApp({ db: {}, client: {} });
  const actual = [
    ...app.locals.routes,
    ...["/api/v1/health", "/api/v1/readiness", "/api/v1/health/readiness"].map(
      (path) => ({ method: "GET", path }),
    ),
  ];
  const missing = original.filter(
    (route) =>
      !actual.some(
        (item) => item.method === route.method && item.path === route.path,
      ),
  );
  assert.equal(original.length, 106);
  assert.deepEqual(missing, []);
});
