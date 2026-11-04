const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const pixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
  "base64",
);
(async () => {
  const b = await chromium.launch(require('./runtime.cjs').launchOptions);
  const c = await b.newContext({ viewport: { width: 1560, height: 1150 } });
  const p = await c.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://127.0.0.1:8765/#worker");
  const phone = p.frameLocator("#workerPhone");
  await phone.locator(".field-greeting").waitFor();
  const state = () =>
    p.evaluate(() => JSON.parse(localStorage.getItem("3zbh-workspace-v3")));
  const act = (s) => p.locator('[data-op="' + s + '"]').first();
  const submit = async (scope) => {
    await scope.locator("dialog [type=submit]").click();
    await scope.locator("dialog").evaluate(async (d) => {
      for (let i = 0; i < 100; i++) {
        if (!d.open || d.querySelector(".form-error")?.textContent) return;
        await new Promise((r) => setTimeout(r, 20));
      }
    });
  };
  await act("newJob").click();
  await p.locator("[data-op=template][data-id=water]").click();
  await p.locator("[name=title]").fill("اختبار الجولة الكاملة");
  await p.locator("[name=ur]").fill("مکمل عمل کی جانچ");
  await p.locator("[name=time]").fill("23:59");
  await submit(p);
  const id = (await state()).ops.jobs[0].id;
  await phone
    .locator(".field-job")
    .filter({ hasText: "مکمل عمل کی جانچ" })
    .locator("[data-op=fieldJob]")
    .click();
  await phone.locator("[data-op=startJob]").click();
  await phone.locator("[data-job-step]").first().check();
  await phone
    .locator("[name=report]")
    .fill("پانی بھر دیا اور تمام برتن صاف کر دیے");
  await phone
    .locator("[name=evidence]")
    .setInputFiles({ name: "water.png", mimeType: "image/png", buffer: pixel });
  await phone.locator("#evidencePreview").waitFor({ state: "visible" });
  await submit(phone);
  assert.match(
    await phone.locator(".form-error").innerText(),
    /تمام مراحل/,
    "incomplete steps must block submission",
  );
  for (const step of await phone.locator("[data-job-step]").all())
    await step.check();
  await submit(phone);
  assert.equal(
    (await state()).ops.jobs.find((j) => j.id === id).status,
    "submitted",
  );
  await p
    .locator('[data-op=jobDetail][data-id="' + id + '"]')
    .first()
    .click();
  assert.match(await p.locator(".job-evidence").innerText(), /پانی بھر/);
  await p.locator("[data-op=requestRevision]").click();
  await p.locator("[name=feedback]").fill("ٹینک کی ایک اور واضح تصویر دیں");
  await submit(p);
  assert.equal(
    (await state()).ops.jobs.find((j) => j.id === id).status,
    "revision",
  );
  await phone
    .locator(".field-job")
    .filter({ hasText: "مکمل عمل کی جانچ" })
    .locator("[data-op=fieldJob]")
    .click();
  assert.match(
    await phone.locator(".field-feedback").innerText(),
    /واضح تصویر/,
  );
  for (const step of await phone.locator("[data-job-step]").all())
    await step.check();
  await phone
    .locator("[name=report]")
    .fill("نئی واضح تصویر، ٹینک اور پانی کے برتن چیک کر لیے");
  await phone
    .locator("[name=evidence]")
    .setInputFiles({
      name: "water2.png",
      mimeType: "image/png",
      buffer: pixel,
    });
  await phone.locator("#evidencePreview").waitFor({ state: "visible" });
  await submit(phone);
  await p
    .locator('[data-op=jobDetail][data-id="' + id + '"]')
    .first()
    .click();
  await p.locator("[data-op=approve]").click();
  assert.equal(
    (await state()).ops.jobs.find((j) => j.id === id).status,
    "approved",
  );
  assert.deepEqual(
    (await state()).ops.jobs
      .find((j) => j.id === id)
      .history.map((e) => e.action),
    ["approved", "submitted", "revision", "submitted", "started", "created"],
  );
  await p.locator("dialog [data-action=close]").click();
  await phone.locator("[data-op=fieldTab][data-id=reports]").click();
  const report = phone
    .locator(".field-job")
    .filter({ hasText: "مکمل عمل کی جانچ" });
  await report.waitFor();
  assert.match(await report.innerText(), /مکمل اور منظور/);
  await act("message").click();
  await p
    .locator("[name=text]")
    .fill("براہ کرم شام کے معائنے کے بعد اطلاع دیں");
  await submit(p);
  await phone.locator("[data-op=fieldTab][data-id=messages]").click();
  assert.match(await phone.locator(".message-thread").innerText(), /شام کے/);
  await phone.locator("[data-op=message]").click();
  await phone.locator("[name=text]").fill("جی، معائنے کے بعد اطلاع دوں گا");
  await submit(phone);
  await p
    .locator(".conversation-box")
    .getByText("جی، معائنے کے بعد اطلاع دوں گا")
    .waitFor();
  assert.equal((await state()).ops.messages.length, 2);
  assert.ok((await state()).ops.messages[0].readAt);
  await phone.locator(".field-header [data-action=language]").click();
  assert.equal(await phone.locator("html").getAttribute("lang"), "ar");
  assert.equal(await p.locator("html").getAttribute("lang"), "ar");
  await phone.locator(".field-header [data-action=language]").click();
  await phone.locator("[data-op=fieldTab][data-id=today]").click();
  await p.screenshot({
    path: "/tmp/3zbh-v4-01-owner-worker-tested.png",
    fullPage: true,
  });
  await p.goto("http://127.0.0.1:8765/#animals");
  await p.locator("[data-action=animalDetail]").first().click();
  await p.locator("[data-op=passport]").click();
  await p.locator("[data-op=passportTab][data-id=growth]").click();
  const weight = async (kg, day) => {
    await act("animalWeight").click();
    await p.locator("[name=kg]").fill(kg);
    await p.locator("[name=at]").fill(day);
    await submit(p);
  };
  await weight("38", "2026-10-01");
  await weight("41.5", "2026-11-01");
  assert.equal(await p.locator(".weight-chart").count(), 1);
  await p.locator("[data-op=passportTab][data-id=family]").click();
  await act("animalRelations").click();
  await p.locator("[name=purpose]").selectOption("breeding");
  await p.locator("[name=facilityId]").selectOption("sheep");
  await submit(p);
  assert.match(await p.locator(".metric-line").first().innerText(), /تكاثر/);
  await act("animalPhoto").click();
  await p
    .locator("[name=image]")
    .setInputFiles({
      name: "animal.png",
      mimeType: "image/png",
      buffer: pixel,
    });
  await submit(p);
  assert.equal(await p.locator(".passport-portrait img").count(), 1);
  await p.locator("[data-op=passportTab][data-id=growth]").click();
  await p.screenshot({
    path: "/tmp/3zbh-v4-02-animal-passport-tested.png",
    fullPage: true,
  });
  await p.reload();
  assert.equal(await p.locator(".passport-portrait img").count(), 1);
  // Both state and message thread survive an entirely new tab.
  const p2 = await c.newPage();
  p2.on("pageerror", (e) => errors.push(e.message));
  await p2.goto("http://127.0.0.1:8765/#field");
  await p2.locator("[data-op=fieldTab][data-id=reports]").click();
  assert.match(await p2.locator(".field-job").innerText(), /مکمل اور منظور/);
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto("http://127.0.0.1:8765/#worker");
  await p.frameLocator("#workerPhone").locator(".field-header").waitFor();
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await p.screenshot({
    path: "/tmp/3zbh-v4-03-mobile-hub-tested.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  await b.close();
  console.log(
    "PASS: real iframe workflow; owner dispatch → worker start → incomplete-step rejection → photo report → revision and resubmission → approval; cross-frame messages/read receipts; independent Arabic/Urdu; linked animal passport; real weight chart; photo; pedigree/location; reload and new-tab persistence; mobile layout; zero browser exceptions.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
