const { chromium } = require("playwright");
const { default: AxeBuilder } = require(
  process.env.AXE_MODULE_PATH || "@axe-core/playwright",
);
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch(require('./runtime.cjs').launchOptions);
  const c = await b.newContext();
  const p = await c.newPage();
  for (const route of ["overview", "worker", "sensors", "field"]) {
    await p.goto(
      (process.env.APP_URL || "http://127.0.0.1:8765/") + "#" + route,
    );
    await p.evaluate(() => document.fonts.ready);
    if (route === "worker")
      await p.frameLocator("#workerPhone").locator(".field-greeting").waitFor();
    const result = await new AxeBuilder({ page: p })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      result.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
      [],
      route,
    );
    console.log("PASS automated accessibility checks:", route);
  }
  await b.close();
  console.log(
    "This checks the sampled states only; it is not a full accessibility certification.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
