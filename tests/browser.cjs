const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.APP_URL || "http://127.0.0.1:8765");
  const state = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("3zbh-workspace-v3")));
  const action = (name) => page.locator('[data-action="' + name + '"]').first();
  const submit = async () => {
    await page.locator('dialog [type="submit"]').click();
    await page.waitForFunction(
      () =>
        !document.querySelector("dialog").open ||
        Boolean(document.querySelector(".form-error")?.textContent),
    );
  };
  const field = (name, val) =>
    page.locator('dialog [name="' + name + '"]').fill(val);
  await action("update").click();
  await field("note", "Browser test: daily farm inspection");
  await submit();
  assert.equal((await state()).activity[0].ar.includes("Browser test"), true);
  await page.goto("http://127.0.0.1:8765/#animals");
  await action("animal").click();
  await field("name", "Test sheep");
  await field("tag", "QA-001");
  await field("birth", "2025-01-01");
  await field("weight", "42");
  await submit();
  assert.equal((await state()).animals.length, 38);
  await page.locator("#animalSearch").fill("QA-001");
  assert.equal(await page.locator("tbody tr").count(), 1);
  await action("animalDetail").click();
  assert.match(await page.locator("dialog").innerText(), /Test sheep/);
  await page.locator('dialog [data-action="animal"]').click();
  await field("weight", "45");
  await submit();
  assert.equal(
    (await state()).animals.find((x) => x.tag === "QA-001").weight,
    45,
  );
  await action("animal").click();
  await field("tag", "QA-001");
  await submit();
  assert.match(await page.locator(".form-error").innerText(), /مستخدم/);
  await page.locator('dialog [data-action="close"]').first().click();
  assert.equal((await state()).animals.length, 38, "cancel must never submit");
  await page.reload();
  assert.match(await page.locator("tbody").innerText(), /Test sheep/);
  await page.goto("http://127.0.0.1:8765/#sensors");
  await action("reading").click();
  await field("value", "19");
  await field("threshold", "25");
  await submit();
  assert.equal((await state()).devices[0].value, 19);
  assert.equal((await state()).devices[0].source, "manual");
  await action("stock").click();
  await field("name", "Test feed");
  await field("qty", "100");
  await field("min", "20");
  await submit();
  assert.equal((await state()).stock.length, 4);
  await page.goto("http://127.0.0.1:8765/#tasks");
  const check = page.locator("[data-task]").last();
  await check.check();
  assert.equal((await state()).tasks.at(-1).done, true);
  await action("task").click();
  await field("ar", "اختبار مهمة");
  await field("ur", "آزمائشی کام");
  await submit();
  assert.equal((await state()).tasks.length, 7);
  await page.goto("http://127.0.0.1:8765/#health");
  await action("health").click();
  await field("note", "Veterinary follow up test");
  await page.locator('[name="status"]').selectOption("watch");
  await submit();
  assert.equal((await state()).health.length, 1);
  await page.goto("http://127.0.0.1:8765/#reports");
  await action("expense").click();
  await field("amount", "120.50");
  await field("note", "Feed purchase");
  await submit();
  assert.equal((await state()).expenses[0].amount, 120.5);
  await page.goto("http://127.0.0.1:8765/#map");
  await page
    .locator('main [data-action="facility"][data-id="house"]')
    .first()
    .click();
  assert.match(await page.locator("dialog").innerText(), /المبنى الرئيسي/);
  await page.locator('dialog [data-action="close"]').click();
  await action("location").click();
  await field("farmName", "عزبة الاختبار");
  await field("location", "https://maps.app.goo.gl/example");
  await submit();
  assert.equal((await state()).farmName, "عزبة الاختبار");
  await page.goto("http://127.0.0.1:8765/#worker");
  await action("language").click();
  assert.equal(await page.locator("html").getAttribute("lang"), "ur");
  assert.match(await page.locator("h1").innerText(), /مزدور/);
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("lang"), "ur");
  await action("update").click();
  await field("note", '<img src=x onerror="window.xss=1">');
  await page
    .locator('[name="photo"]')
    .setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await page.locator("#preview").waitFor({ state: "visible" });
  await submit();
  assert.match((await state()).activity[0].photo, /^data:image\/jpeg;base64,/);
  assert.equal(await page.evaluate(() => window.xss), undefined);
  await page.goto("http://127.0.0.1:8765/#settings");
  const dl = page.waitForEvent("download");
  await action("export").click();
  const downloaded = await dl;
  const backup = JSON.parse(await fs.readFile(await downloaded.path(), "utf8"));
  assert.equal(backup.animals.length, 38);
  await action("import").click();
  await page
    .locator('[name="file"]')
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(backup)),
    });
  await submit();
  assert.equal((await state()).animals.length, 38);
  await action("import").click();
  await page
    .locator('[name="file"]')
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"version":3}'),
    });
  await submit();
  assert.notEqual(await page.locator(".form-error").innerText(), "");
  await page.locator('dialog [data-action="close"]').first().click();
  for (const route of [
    "overview",
    "animals",
    "sensors",
    "tasks",
    "map",
    "health",
    "reports",
    "worker",
    "settings",
  ]) {
    await page.goto("http://127.0.0.1:8765/#" + route);
    assert.equal(await page.locator("h1").count(), 1, route);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:8765/#overview");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: "/tmp/3zbh-tested-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "PASS: animal CRUD, duplicate validation, cancel, reload, readings, stock, tasks, health, expenses, facilities, location, Urdu, photo compression, XSS escaping, backup import/export, invalid import, 9 routes, mobile layout; zero browser exceptions.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
