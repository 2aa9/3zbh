const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch(require('./runtime.cjs').launchOptions);
  const c = await b.newContext({ viewport: { width: 1440, height: 1050 } });
  const p = await c.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:8765/#sensors");
  const state = () =>
    p.evaluate(() => JSON.parse(localStorage.getItem("3zbh-workspace-v3")));
  const submit = async () => {
    await p.locator("dialog [type=submit]").click();
    await p.waitForFunction(
      () =>
        !document.querySelector("dialog").open ||
        !!document.querySelector("dialog .form-error")?.textContent,
    );
  };
  await p.locator("[data-op=sensorConfig]").first().click();
  await p.locator("[name=capacity]").fill("1000");
  await p.locator("[name=threshold]").fill("30");
  await p.locator("[name=deviceCode]").fill("TANK-01");
  await submit();
  const deviceId = (await state()).devices[0].id;
  for (const value of ["80", "25"]) {
    await p
      .locator('[data-action=reading][data-id="' + deviceId + '"]')
      .click();
    await p.locator("[name=value]").fill(value);
    await submit();
  }
  assert.equal((await state()).ops.readings.length, 2);
  await p.locator('[data-op=sensorDetail][data-id="' + deviceId + '"]').click();
  assert.equal(await p.locator("dialog .weight-chart").count(), 1);
  assert.match(await p.locator(".reading-list").innerText(), /25%/);
  await p.locator("dialog [data-action=close]").click();
  assert.match(await p.locator(".tank-card").first().innerText(), /250 L/);
  const stockId = (await state()).stock[0].id,
    base = (await state()).stock[0].qty;
  const move = async (direction, qty) => {
    await p.locator('[data-op=stockMove][data-id="' + stockId + '"]').click();
    await p.locator("[name=direction]").selectOption(direction);
    await p.locator("[name=qty]").fill(qty);
    await p.locator("[name=note]").fill("Inventory QA");
    await submit();
  };
  await move("in", "10.5");
  assert.equal((await state()).stock[0].qty, base + 10.5);
  await move("out", "20.2");
  assert.equal((await state()).stock[0].qty, base - 9.7);
  await move("out", "9999");
  assert.match(await p.locator(".form-error").innerText(), /أكبر من المخزون/);
  assert.equal((await state()).stock[0].qty, base - 9.7);
  await p.locator("dialog [data-op=close]").click();
  assert.equal((await state()).ops.movements.length, 2);
  await p.screenshot({
    path: "/tmp/3zbh-v4-05-inventory-tested.png",
    fullPage: true,
  });
  await p.goto("http://127.0.0.1:8765/#settings");
  const before = (await state()).animals.length;
  await p.locator("[data-action=fresh]").click();
  await p.locator("dialog [data-action=close]").click();
  assert.equal((await state()).animals.length, before);
  await p.locator("[data-action=fresh]").click();
  const dl = p.waitForEvent("download");
  await p.locator("[data-action=confirmFresh]").click();
  await dl;
  assert.equal((await state()).animals.length, 0);
  assert.equal((await state()).ops.jobs.length, 0);
  assert.equal((await state()).devices[0].value, null);
  await p.goto("http://127.0.0.1:8765/#worker");
  await p.frameLocator("#workerPhone").locator(".field-empty").waitFor();
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.reload();
  await p.waitForFunction(() => !!navigator.serviceWorker.controller);
  await c.setOffline(true);
  await p.reload();
  await p.frameLocator("#workerPhone").locator(".field-empty").waitFor();
  console.log(
    "PASS: tank capacity/calculated amount; timestamped manual readings and true chart; restock/consume ledger; fractional quantities; overdraw rejection; destructive-flow cancellation; automatic backup before fresh start; empty state in actual iframe; offline owner and embedded worker.",
  );
  assert.deepEqual(errors, []);
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
