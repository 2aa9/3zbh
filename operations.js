/* 3zbh operations: explicit local workflows, not a simulated cloud connection. */
"use strict";
let hubFilter = "all";
let fieldTab = "today";
let fieldSearch = "";
let passportTab = "overview";
const JOB_STATES = ["queued", "active", "submitted", "revision", "approved"];
function jobStatus(s) {
  return (
    {
      queued: tr("بانتظار البدء", "شروع ہونا باقی"),
      active: tr("قيد التنفيذ", "کام جاری"),
      submitted: tr("بانتظار اعتمادك", "منظوری باقی"),
      revision: tr("مطلوب تصحيح", "درست کریں"),
      approved: tr("مكتملة ومعتمدة", "مکمل اور منظور"),
    }[s] || s
  );
}
function priorityLabel(s) {
  return (
    {
      normal: tr("عادية", "معمول"),
      high: tr("مهمة", "اہم"),
      urgent: tr("عاجلة", "فوری"),
    }[s] || s
  );
}
function jobText(j) {
  return lang === "ur" ? j.ur || j.title : j.title;
}
function facilityName(id) {
  const f = facilityData.find((f) => f[0] === id);
  return f ? tr(f[2], f[3]) : tr("العزبة", "باڑا");
}
function ensureOperations() {
  if (state.ops?.version === 1) {
    state.ops.readings ||= [];
    state.ops.movements ||= [];
    return;
  }
  const make = (title, ur, facilityId, priority, requirePhoto, steps) => ({
    id: uid(),
    title,
    ur,
    facilityId,
    priority,
    requirePhoto,
    animalId: "",
    due: today(),
    time: "17:00",
    status: "queued",
    note: "",
    steps: steps.map((s) => ({ ar: s[0], ur: s[1], done: false })),
    history: [],
    createdAt: stamp(),
    report: null,
  });
  state.ops = {
    version: 1,
    jobs: state.demo
      ? [
          make(
            "جولة الماء والمشارب",
            "پانی کے ٹینک اور برتن چیک کریں",
            "water",
            "urgent",
            true,
            [
              ["فحص الخزان الرئيسي", "مرکزی ٹینک چیک کریں"],
              ["تعبئة المشارب", "پانی کے برتن بھریں"],
              ["تصوير المستوى بعد التعبئة", "بھرنے کے بعد سطح کی تصویر لیں"],
            ],
          ),
          make(
            "متابعة مزون في الحظيرة",
            "باڑے میں مزون کی نگرانی",
            "sheep",
            "high",
            true,
            [
              ["ملاحظة الشهية والحركة", "خوراک اور حرکت دیکھیں"],
              ["كتابة الملاحظة دون تشخيص", "تشخیص کے بغیر مشاہدہ لکھیں"],
            ],
          ),
          make(
            "جمع البيض وتنظيف المعالف",
            "انڈے جمع کریں اور دانے کے برتن صاف کریں",
            "chicken",
            "normal",
            false,
            [
              ["جمع البيض السليم", "صحیح انڈے جمع کریں"],
              ["تنظيف المعالف", "دانے کے برتن صاف کریں"],
            ],
          ),
        ]
      : [],
    messages: [],
    readings: [],
    movements: [],
    events: [],
    worker: { name: "العامل", ur: "مزدور" },
  };
  persist();
}
function validateOperations(o) {
  const bad = () => {
    throw Error(
      tr(
        "سجل المهام المشترك داخل النسخة غير صالح",
        "بیک اپ میں کاموں کا ریکارڈ درست نہیں",
      ),
    );
  };
  if (
    o.version !== 1 ||
    !Array.isArray(o.jobs) ||
    !Array.isArray(o.messages) ||
    !Array.isArray(o.events) ||
    o.jobs.length > 5000 ||
    o.messages.length > 10000
  )
    bad();
  const safeId = (id) =>
    typeof id === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(id);
  for (const name of ["readings", "movements"])
    if (
      o[name] !== undefined &&
      (!Array.isArray(o[name]) || o[name].length > 20000)
    )
      bad();
  if (
    (o.readings || []).some(
      (r) =>
        !safeId(r.id) ||
        !safeId(r.deviceId) ||
        !Number.isFinite(r.value) ||
        r.value < 0 ||
        r.value > 100 ||
        !Number.isFinite(new Date(r.at).getTime()),
    )
  )
    bad();
  if (
    (o.movements || []).some(
      (m) =>
        !safeId(m.id) ||
        !safeId(m.stockId) ||
        !["in", "out"].includes(m.direction) ||
        !Number.isFinite(m.qty) ||
        m.qty <= 0 ||
        !Number.isFinite(m.after) ||
        m.after < 0,
    )
  )
    bad();
  if (
    o.jobs.some(
      (j) =>
        !safeId(j.id) ||
        typeof j.title !== "string" ||
        !JOB_STATES.includes(j.status) ||
        !Array.isArray(j.steps) ||
        !Array.isArray(j.history) ||
        j.steps.some(
          (s) => !s || typeof s.ar !== "string" || typeof s.ur !== "string",
        ) ||
        !["normal", "high", "urgent"].includes(j.priority) ||
        (j.report?.photo &&
          !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(j.report.photo)),
    )
  )
    bad();
  if (
    o.messages.some(
      (m) =>
        !safeId(m.id) ||
        typeof m.text !== "string" ||
        !["owner", "worker"].includes(m.from),
    )
  )
    bad();
}
function opButton(text, action, ico = "plus", id = "", cls = "") {
  return (
    '<button type="button" class="btn ' +
    cls +
    '" data-op="' +
    action +
    '"' +
    (id ? ' data-id="' + esc(id) + '"' : "") +
    ">" +
    icon(ico) +
    text +
    "</button>"
  );
}
function opEvent(j, action, ar, ur, actor) {
  const event = {
    id: uid(),
    jobId: j?.id || "",
    action,
    ar,
    ur,
    actor,
    at: stamp(),
  };
  state.ops.events.unshift(event);
  if (j) j.history.unshift(event);
}
function opCommit(change, message) {
  // Merge against the latest local revision when another tab/frame just saved.
  try {
    const latest = JSON.parse(localStorage.getItem(KEY));
    if (latest) {
      validateBackup(latest);
      state = latest;
    }
  } catch {}
  ensureOperations();
  const previous = JSON.stringify(state);
  try {
    change();
    validateOperations(state.ops);
    if (!persist())
      throw Error(
        tr(
          "لم يتم الحفظ. صدّر نسخة لتوفير مساحة.",
          "محفوظ نہیں ہوا۔ جگہ خالی کرنے کے لیے بیک اپ لیں۔",
        ),
      );
    render();
    if (message) toast(message);
    return true;
  } catch (e) {
    state = JSON.parse(previous);
    const inlineError = document.querySelector("#dialog[open] .form-error");
    if (inlineError) inlineError.textContent = e.message;
    toast(e.message);
    return false;
  }
}
function jobLate(j) {
  return (
    !["approved", "submitted"].includes(j.status) &&
    new Date(j.due + "T" + (j.time || "17:00") + ":00+04:00") < new Date()
  );
}
function jobPill(j) {
  return (
    '<span class="job-status ' +
    j.status +
    '">' +
    jobStatus(j.status) +
    "</span>"
  );
}
function jobProgress(j) {
  return Math.round(
    (j.steps.filter((s) => s.done).length / Math.max(1, j.steps.length)) * 100,
  );
}
function commandOverview() {
  const jobs = state.ops.jobs,
    review = jobs.filter((j) => j.status === "submitted").length,
    pending = jobs.filter((j) => !["approved"].includes(j.status)).length;
  const urgent = state.devices.filter(
    (d) => d.value !== null && d.value <= d.threshold,
  ).length;
  const females = state.animals.filter((a) => a.sex === "female").length,
    males = state.animals.length - females;
  return (
    title(
      "صباح الخير يا علي.",
      "صبح بخیر، علی۔",
      tr(
        "كل التفاصيل التي تهمك، وقرارات اليوم في مكان واحد.",
        "ضروری تفصیلات اور آج کے فیصلے ایک جگہ۔",
      ),
      btn(
        tr("إضافة حيوان", "جانور شامل کریں"),
        "animal",
        "plus",
        "",
        "secondary",
      ) +
        opButton(
          tr("إرسال مهمة للعامل", "مزدور کو کام بھیجیں"),
          "newJob",
          "plus",
        ),
    ) +
    '<section class="command-welcome"><div class="welcome-copy"><span class="welcome-kicker"><i></i> ' +
    tr("3ZBH • مساحة تشغيل العزبة", "3ZBH • باڑے کا انتظام") +
    "</span><h2>" +
    tr(
      "عزبتك،<br><em>على عينك.</em>",
      "آپ کا باڑا،<br><em>آپ کی نظر میں۔</em>",
    ) +
    "</h2><p>" +
    tr(
      "من أول جولة للعامل، لآخر قطرة في الخزان.<br>شوف وش صار، وش باقي، ووين تحتاج تتدخل.",
      "مزدور کے پہلے معائنے سے ٹینک کے آخری قطرے تک۔<br>دیکھیں کیا ہوا، کیا باقی ہے، کہاں توجہ چاہیے۔",
    ) +
    '</p><a href="#worker" class="btn lime">' +
    icon("users") +
    tr("افتح مركز المالك والعامل", "مالک اور مزدور کا مرکز") +
    icon("arrow") +
    '</a></div><div class="welcome-map">' +
    farmSvg(true) +
    '<span class="map-compass">' +
    tr(
      "مخطط عزبتكم • اضغط لاستكشاف المرافق",
      "آپ کا نقشہ • جگہوں کی تفصیل دیکھیں",
    ) +
    '</span></div><div class="welcome-summary"><div><span>' +
    tr("مهام مفتوحة", "کھلے کام") +
    "</span><strong>" +
    pending +
    "</strong></div><div><span>" +
    tr("تقارير للمراجعة", "منظوری کی رپورٹس") +
    "</span><strong>" +
    review +
    "</strong></div><div><span>" +
    tr("تنبيهات من السجل", "ریکارڈ کی اطلاعات") +
    "</span><strong>" +
    urgent +
    "</strong></div></div></section>" +
    '<div class="context-bar"><span>' +
    icon("leaf") +
    tr(
      state.demo
        ? "بيانات توضيحية • جرب الرحلة كاملة قبل إدخال سجلات العزبة."
        : "سجلاتك المحلية • صدّر نسخة احتياطية بانتظام.",
      state.demo
        ? "نمونہ ڈیٹا • اصل ریکارڈ سے پہلے مکمل عمل آزمائیں۔"
        : "مقامی ریکارڈ • باقاعدہ بیک اپ لیں۔",
    ) +
    '</span><a href="#settings">' +
    tr("البيانات والإعدادات", "ڈیٹا اور ترتیبات") +
    " ←</a></div>" +
    '<section class="stats command-stats">' +
    stat(
      "sheep",
      num(state.animals.length),
      tr("رأس / طير في السجل", "درج شدہ جانور / پرندے"),
      tr(
        females + " إناث · " + males + " ذكور",
        females + " مادہ · " + males + " نر",
      ),
      tr("حلال العزبة", "جانور"),
    ) +
    stat(
      "tasks",
      jobs.filter((j) => j.status === "approved").length +
        "<small> / " +
        jobs.length +
        "</small>",
      tr("مهام مكتملة ومعتمدة", "مکمل اور منظور کام"),
      tr("من البدء إلى مراجعة المالك", "شروع سے مالک کی منظوری تک"),
      tr("دورة العمل", "کام کا عمل"),
    ) +
    stat(
      "drop",
      state.devices.filter((d) => d.value !== null).length +
        "<small> / " +
        state.devices.length +
        "</small>",
      tr("نقاط لها قراءة مسجلة", "درج شدہ ریڈنگ والی جگہیں"),
      tr("يدوي / تجريبي • لا أجهزة متصلة", "دستی / نمونہ • منسلک آلات نہیں"),
      tr("الماء والعلف", "پانی اور چارہ"),
    ) +
    stat(
      "heart",
      state.animals.filter((a) => a.status !== "healthy").length,
      tr("حالات تحتاج متابعة", "نگرانی والے جانور"),
      tr("حالات مسجلة، وليست تشخيصًا آليًا", "درج شدہ حالت، خودکار تشخیص نہیں"),
      tr("الرعاية", "دیکھ بھال"),
    ) +
    "</section>" +
    '<div class="grid-main command-grid">' +
    panel(
      tr("وش يحتاج انتباهك؟", "آپ کی توجہ کہاں چاہیے؟"),
      tr("مهام ومراجعات مرتبطة بسجل العزبة", "ریکارڈ سے متعلق کام اور رپورٹس"),
      '<div class="panel-body">' +
        jobs
          .slice(0, 3)
          .map(
            (j) =>
              '<button class="attention-item" data-op="jobDetail" data-id="' +
              j.id +
              '"><span class="attention-icon ' +
              j.priority +
              '">' +
              icon(j.status === "submitted" ? "camera" : "tasks") +
              "</span><div><strong>" +
              esc(jobText(j)) +
              "</strong><small>" +
              facilityName(j.facilityId) +
              " · " +
              tr("موعد ", "وقت ") +
              esc(j.time) +
              "</small></div>" +
              jobPill(j) +
              icon("arrow") +
              "</button>",
          )
          .join("") +
        (jobs.length
          ? ""
          : '<div class="empty">' +
            tr(
              "لا توجد مهام؛ أرسل أول مهمة من الزر أعلاه.",
              "کوئی کام نہیں؛ اوپر کے بٹن سے پہلا کام بھیجیں۔",
            ) +
            "</div>") +
        "</div>",
      '<a class="panel-link" href="#worker">' +
        tr("مركز العامل", "مزدور کا مرکز") +
        " ←</a>",
    ) +
    panel(
      tr("الماء والعلف", "پانی اور چارہ"),
      tr("تسجيل واضح للمستوى ومصدر القراءة", "سطح اور ریڈنگ کا ذریعہ واضح"),
      sensorsList(),
      '<a class="panel-link" href="#sensors">' +
        tr("عرض التفاصيل", "تفصیل") +
        " ←</a>",
    ) +
    "</div>" +
    '<div class="grid-main">' +
    panel(
      tr("سجل الحلال", "جانوروں کا ریکارڈ"),
      tr(
        "ملفات مرتبطة بالرعاية والملاحظات",
        "دیکھ بھال اور مشاہدات سے جڑی فائلیں",
      ),
      animalTable(state.animals.slice(0, 4)) +
        '<div class="table-footer"><span>' +
        tr("عرض ", "دکھائے گئے ") +
        Math.min(4, state.animals.length) +
        " / " +
        state.animals.length +
        '</span><a href="#animals">' +
        tr("السجل الكامل", "مکمل ریکارڈ") +
        " ←</a></div>",
    ) +
    panel(
      tr("آخر ما صار في العزبة", "باڑے کی تازہ خبریں"),
      tr("تقارير مصورة وسجل زمني", "تصویری رپورٹس اور واقعات"),
      activities(3),
      btn(tr("تحديث اليوم", "آج کی رپورٹ"), "update", "camera", "", "ghost"),
    ) +
    "</div>" +
    '<section class="quick-strip">' +
    [
      ["animal", "sheep", "سجّل حيوانًا", "جانور شامل کریں"],
      ["health", "heart", "سجّل متابعة صحية", "صحت کی نگرانی"],
      ["stock", "feed", "حدّث المخزون", "ذخیرہ بدلیں"],
      ["expense", "wallet", "أضف مصروفًا", "خرچ شامل کریں"],
    ]
      .map(
        (x) =>
          '<button data-action="' +
          x[0] +
          '">' +
          icon(x[1]) +
          "<span>" +
          tr(x[2], x[3]) +
          "</span>" +
          icon("plus") +
          "</button>",
      )
      .join("") +
    "</section>"
  );
}
function hubCounters() {
  return ["queued", "active", "submitted", "approved"]
    .map(
      (s) =>
        '<button class="hub-counter ' +
        (hubFilter === s ? "selected" : "") +
        '" data-op="hubFilter" data-id="' +
        s +
        '"><span>' +
        jobStatus(s) +
        "</span><b>" +
        state.ops.jobs.filter((j) => j.status === s).length +
        '</b><i class="counter-line ' +
        s +
        '"></i></button>',
    )
    .join("");
}
function jobCards() {
  const list = state.ops.jobs
    .filter((j) => hubFilter === "all" || j.status === hubFilter)
    .sort(
      (a, b) =>
        ["urgent", "high", "normal"].indexOf(a.priority) -
          ["urgent", "high", "normal"].indexOf(b.priority) ||
        new Date(b.createdAt) - new Date(a.createdAt),
    );
  return list.length
    ? list
        .map(
          (j) =>
            '<article class="dispatch-job"><div class="dispatch-job-head"><span class="job-priority ' +
            j.priority +
            '">' +
            priorityLabel(j.priority) +
            "</span>" +
            jobPill(j) +
            '<button class="panel-link" aria-label="' +
            tr("فتح تفاصيل المهمة", "کام کی تفصیل کھولیں") +
            '" data-op="jobDetail" data-id="' +
            j.id +
            '">' +
            icon("arrow") +
            '</button></div><h3><button data-op="jobDetail" data-id="' +
            j.id +
            '">' +
            esc(jobText(j)) +
            "</button></h3><p>" +
            icon("pin") +
            facilityName(j.facilityId) +
            "<span>·</span>" +
            icon("clock") +
            esc(j.time) +
            " " +
            date(j.due) +
            (jobLate(j)
              ? '<span class="late-badge">' + tr("متأخرة", "تاخیر") + "</span>"
              : "") +
            '</p><div class="job-step-progress"><div><i style="width:' +
            jobProgress(j) +
            '%"></i></div><small>' +
            j.steps.filter((s) => s.done).length +
            "/" +
            j.steps.length +
            " " +
            tr("خطوات", "مراحل") +
            "</small></div>" +
            (j.report
              ? '<div class="report-snippet">' +
                (j.report.photo
                  ? '<img src="' +
                    esc(j.report.photo) +
                    '" alt="' +
                    tr("صورة التنفيذ", "کام کی تصویر") +
                    '">'
                  : icon("camera")) +
                "<p>" +
                esc(j.report.note) +
                "</p></div>"
              : "") +
            '<div class="job-card-foot"><span>' +
            icon(j.requirePhoto ? "camera" : "tasks") +
            tr(
              j.requirePhoto ? "صورة مطلوبة للإتمام" : "تقرير تنفيذ مطلوب",
              j.requirePhoto
                ? "مکمل کرنے کے لیے تصویر ضروری"
                : "کام کی رپورٹ ضروری",
            ) +
            "</span>" +
            (j.status === "submitted"
              ? opButton(
                  tr("راجع التنفيذ", "رپورٹ دیکھیں"),
                  "jobDetail",
                  "check",
                  j.id,
                )
              : '<button class="panel-link" data-op="jobDetail" data-id="' +
                j.id +
                '">' +
                tr("تفاصيل المهمة", "کام کی تفصیل") +
                "</button>") +
            "</div></article>",
        )
        .join("")
    : '<div class="empty">' +
        icon("check") +
        "<h3>" +
        tr("كل شيء مرتب هنا", "یہاں سب منظم ہے") +
        "</h3><p>" +
        tr("لا توجد مهام ضمن هذا التصنيف.", "اس حصے میں کوئی کام نہیں۔") +
        "</p></div>";
}
function dispatchContents() {
  return (
    '<div class="hub-section-head"><div><h2>' +
    tr("خطة شغل العامل", "مزدور کے کاموں کا منصوبہ") +
    "</h2><p>" +
    tr(
      "أرسل → تابع التنفيذ → راجع واعتمد",
      "بھیجیں ← کام دیکھیں ← جائزہ اور منظوری",
    ) +
    "</p></div>" +
    opButton(tr("مهمة جديدة", "نیا کام"), "newJob", "plus") +
    '</div><div class="hub-counters">' +
    hubCounters() +
    '</div><div class="hub-toolbar"><div class="filters"><button class="filter ' +
    (hubFilter === "all" ? "active" : "") +
    '" data-op="hubFilter" data-id="all">' +
    tr("كل المهام", "سب کام") +
    '</button><button class="filter ' +
    (hubFilter === "revision" ? "active" : "") +
    '" data-op="hubFilter" data-id="revision">' +
    tr("المعادة للتصحيح", "درست کرنے والے") +
    "</button></div>" +
    opButton(
      tr("رسالة للعامل", "مزدور کو پیغام"),
      "message",
      "users",
      "",
      "secondary",
    ) +
    '</div><div class="dispatch-jobs">' +
    jobCards() +
    '</div><section class="conversation-box"><div class="hub-section-head"><h3>' +
    tr("التواصل مع العامل", "مزدور سے گفتگو") +
    '</h3><span class="tag">' +
    tr("داخل المتصفح", "اسی براؤزر میں") +
    "</span></div>" +
    messageThread("owner", 4) +
    '</section><div class="hub-footnote">' +
    icon("clock") +
    tr(
      "النشاطات مؤرخة ومحفوظة. شاشة الجوال تستخدم السجل نفسه داخل هذا المتصفح.",
      "واقعات وقت کے ساتھ محفوظ ہیں۔ فون کی سکرین اسی براؤزر کا ریکارڈ استعمال کرتی ہے۔",
    ) +
    "</div>"
  );
}
function workerHub() {
  return (
    title(
      "المالك والعامل. على نفس الصفحة.",
      "مالک اور مزدور۔ ایک ہی صفحے پر۔",
      tr(
        "جرّب رحلة العمل كاملة من هنا: أرسل مهمة، نفّذها من الجوال، ثم اعتمد التقرير.",
        "یہیں مکمل عمل آزمائیں: کام بھیجیں، فون سے مکمل کریں، پھر رپورٹ منظور کریں۔",
      ),
      btn(tr("تحديث عام", "عام رپورٹ"), "update", "camera", "", "secondary"),
    ) +
    '<div class="workspace-mode"><span>' +
    icon("users") +
    "<b>" +
    tr("تجربة تفاعلية للمالك والعامل", "مالک اور مزدور کا عملی تجربہ") +
    "</b></span><small>" +
    tr(
      "النافذتان تتشاركان بيانات هذا المتصفح • ليست مزامنة بين جوالين بعد",
      "دونوں سکرینیں اسی براؤزر کا ڈیٹا استعمال کرتی ہیں • دو فون ابھی منسلک نہیں",
    ) +
    '</small></div><div class="dispatch-layout"><section class="dispatch-main" id="dispatchMain">' +
    dispatchContents() +
    '</section><aside class="phone-preview"><div class="phone-preview-label"><span class="preview-dot"></span>' +
    tr(
      "جوال العامل • تقدر تستخدمه فعليًا",
      "مزدور کا فون • ابھی استعمال کریں",
    ) +
    '</div><div class="phone-hardware"><div class="phone-island"></div><iframe id="workerPhone" title="' +
    tr("واجهة جوال العامل التفاعلية", "مزدور کے فون کی سکرین") +
    '" src="./index.html#field"></iframe><div class="phone-home"></div></div><a href="./index.html#field" target="_blank" rel="noopener" class="phone-open">' +
    tr("افتح واجهة العامل بصفحة مستقلة", "مزدور کی سکرین الگ صفحے پر کھولیں") +
    ' ↗</a><p class="phone-caption">' +
    tr(
      "الأوردو مفعّلة للعامل. زر اللغة داخل جواله يبدّل للعربية دون تغيير واجهتك.",
      "مزدور کے لیے اردو ہے۔ فون کے اندر زبان بدلنے سے مالک کی زبان نہیں بدلتی۔",
    ) +
    "</p></aside></div>"
  );
}
function refreshWorkerHub() {
  $("#dispatchMain").innerHTML = dispatchContents();
  const heading = document.querySelector(".page-title h1");
  if (heading)
    heading.textContent = tr(
      "المالك والعامل. على نفس الصفحة.",
      "مالک اور مزدور۔ ایک ہی صفحے پر۔",
    );
}
function messageThread(viewer, limit = 30) {
  const items = state.ops.messages.slice(-limit);
  return (
    '<div class="message-thread">' +
    (items.length
      ? items
          .map(
            (m) =>
              '<div class="message-bubble ' +
              (m.from === viewer ? "sent" : "received") +
              '"><span>' +
              tr(
                m.from === "owner" ? "المالك" : "العامل",
                m.from === "owner" ? "مالک" : "مزدور",
              ) +
              "</span><p>" +
              esc(m.text) +
              "</p><small>" +
              new Date(m.at).toLocaleTimeString(
                lang === "ur" ? "ur-PK" : "ar-AE",
                { hour: "2-digit", minute: "2-digit" },
              ) +
              (m.readAt ? " · " + tr("قُرئت", "پڑھ لیا") : "") +
              "</small></div>",
          )
          .join("")
      : '<div class="empty small">' +
        tr(
          "لا توجد رسائل. ابدأ بتعليمات واضحة للعامل.",
          "کوئی پیغام نہیں۔ واضح ہدایات بھیجیں۔",
        ) +
        "</div>") +
    "</div>"
  );
}
function fieldPage() {
  const unapproved = state.ops.jobs.filter((j) => j.status !== "approved"),
    pending = unapproved.length,
    unread = state.ops.messages.filter(
      (m) => m.from === "owner" && !m.readAt,
    ).length;
  return (
    '<div class="field-app"><header class="field-header"><div><span class="field-brand">3zbh<span>.</span></span><small>' +
    tr("واجهة العامل", "مزدور کی سکرین") +
    '</small></div><button class="field-language" data-action="language">' +
    (lang === "ur" ? "عربي" : "اردو") +
    '</button><span class="field-avatar">' +
    icon("users") +
    '</span></header><div class="field-body"><div class="field-date">' +
    new Date().toLocaleDateString(lang === "ur" ? "ur-PK" : "ar-AE", {
      weekday: "long",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Dubai",
    }) +
    " <span>" +
    tr("سجل محلي", "مقامی ریکارڈ") +
    "</span></div>" +
    (
      {
        today: fieldToday,
        herd: fieldHerd,
        messages: () =>
          '<h1 class="field-page-title">' +
          tr("رسائل المالك", "مالک کے پیغامات") +
          "</h1>" +
          messageThread("worker") +
          opButton(tr("إرسال رد", "جواب بھیجیں"), "message", "users"),
        reports: fieldReports,
      }[fieldTab] || fieldToday
    )() +
    '</div><nav class="field-nav" aria-label="' +
    tr("تنقل العامل", "مزدور کی سکرین کے حصے") +
    '">' +
    [
      ["today", "tasks", "شغلي", "میرے کام"],
      ["herd", "sheep", "الحلال", "جانور"],
      ["messages", "users", "الرسائل", "پیغامات"],
      ["reports", "camera", "تقاريري", "رپورٹس"],
    ]
      .map(
        (x) =>
          '<button data-op="fieldTab" data-id="' +
          x[0] +
          '" class="' +
          (fieldTab === x[0] ? "active" : "") +
          '">' +
          icon(x[1]) +
          "<span>" +
          tr(x[2], x[3]) +
          "</span>" +
          (x[0] === "messages" && unread ? "<b>" + unread + "</b>" : "") +
          "</button>",
      )
      .join("") +
    "</nav></div>"
  );
}
function fieldToday() {
  const jobs = state.ops.jobs
    .filter((j) => j.status !== "approved")
    .sort(
      (a, b) =>
        ["urgent", "high", "normal"].indexOf(a.priority) -
        ["urgent", "high", "normal"].indexOf(b.priority),
    );
  return (
    '<section class="field-greeting"><div class="field-greeting-icon">' +
    icon("leaf") +
    "</div><h1>" +
    tr("هلا فيك.<br>نبدأ شغل اليوم؟", "السلام علیکم۔<br>آج کا کام شروع کریں؟") +
    "</h1><p>" +
    tr(
      "عندك " + jobs.length + " مهام تحتاج متابعة.",
      "آپ کے " + jobs.length + " کام باقی ہیں۔",
    ) +
    '</p><div class="field-today-progress"><span>' +
    tr("معتمد اليوم", "آج منظور") +
    "</span><b>" +
    state.ops.jobs.filter(
      (j) =>
        j.status === "approved" &&
        j.reviewedAt?.slice(0, 10) === stamp().slice(0, 10),
    ).length +
    '</b></div></section><div class="field-quick-actions"><button data-action="reading">' +
    icon("drop") +
    "<span>" +
    tr("الماء والعلف", "پانی اور چارہ") +
    '</span></button><button data-action="update">' +
    icon("camera") +
    "<span>" +
    tr("تحديث بصورة", "تصویری رپورٹ") +
    '</span></button><button data-action="health">' +
    icon("heart") +
    "<span>" +
    tr("بلّغ عن حالة", "صحت کی اطلاع") +
    '</span></button></div><div class="field-section-title"><h2>' +
    tr("مهامك اليوم", "آج کے کام") +
    "</h2><span>" +
    jobs.length +
    "</span></div>" +
    jobs
      .map(
        (j) =>
          '<article class="field-job"><div class="row" style="justify-content:space-between"><span class="job-priority ' +
          j.priority +
          '">' +
          priorityLabel(j.priority) +
          "</span>" +
          jobPill(j) +
          "</div><h3>" +
          esc(jobText(j)) +
          "</h3><p>" +
          icon("pin") +
          facilityName(j.facilityId) +
          '</p><div class="field-job-bottom"><span>' +
          icon("clock") +
          esc(j.time) +
          '</span><button data-op="fieldJob" data-id="' +
          j.id +
          '">' +
          tr(
            j.status === "queued"
              ? "افتح المهمة"
              : j.status === "submitted"
                ? "عرض التقرير"
                : "كمّل المهمة",
            j.status === "queued"
              ? "کام کھولیں"
              : j.status === "submitted"
                ? "رپورٹ دیکھیں"
                : "کام جاری رکھیں",
          ) +
          icon("arrow") +
          "</button></div></article>",
      )
      .join("") +
    (jobs.length
      ? ""
      : '<div class="field-empty">' +
        icon("check") +
        "<h2>" +
        tr("خلصت المهام!", "سب کام مکمل!") +
        "</h2><p>" +
        tr(
          "انتظر تعليمات المالك أو أرسل تحديثًا.",
          "مالک کی ہدایات کا انتظار کریں یا رپورٹ بھیجیں۔",
        ) +
        "</p></div>")
  );
}
function fieldHerd() {
  const q = fieldSearch.toLowerCase(),
    list = state.animals.filter((a) =>
      [a.tag, a.name, breedName(a.breed)].join(" ").toLowerCase().includes(q),
    );
  return (
    '<h1 class="field-page-title">' +
    tr("حلال العزبة", "باڑے کے جانور") +
    '</h1><div class="field-search">' +
    icon("search") +
    '<input id="fieldSearch" placeholder="' +
    tr("ابحث بالاسم أو الرقم", "نام یا نمبر تلاش کریں") +
    '" value="' +
    esc(fieldSearch) +
    '"></div><div class="field-herd-list">' +
    list
      .map(
        (a) =>
          '<button class="field-animal" data-action="animalDetail" data-id="' +
          a.id +
          '"><span class="animal-avatar">' +
          animalsIcon(a.kind) +
          "</span><span><strong>" +
          esc(a.name || a.tag) +
          "</strong><small>" +
          esc(a.tag) +
          " · " +
          esc(breedName(a.breed)) +
          " · " +
          age(a.birth) +
          '</small></span><span class="health-dot ' +
          (a.status !== "healthy" ? "warn" : "") +
          '"></span></button>',
      )
      .join("") +
    "</div>"
  );
}
function fieldReports() {
  const reports = state.ops.jobs.filter((j) => j.report);
  return (
    '<h1 class="field-page-title">' +
    tr("تقاريري", "میری رپورٹس") +
    "</h1>" +
    reports
      .map(
        (j) =>
          '<article class="field-job">' +
          jobPill(j) +
          "<h3>" +
          esc(jobText(j)) +
          "</h3><p>" +
          esc(j.report.note) +
          "</p>" +
          (j.report.photo
            ? '<img class="field-report-photo" src="' +
              esc(j.report.photo) +
              '" alt="' +
              tr("صورة التنفيذ", "کام کی تصویر") +
              '">'
            : "") +
          (j.feedback
            ? '<div class="field-feedback">' +
              icon("users") +
              esc(j.feedback) +
              "</div>"
            : "") +
          '<button class="panel-link" data-op="fieldJob" data-id="' +
          j.id +
          '">' +
          tr("فتح التفاصيل", "تفصیل کھولیں") +
          " ←</button></article>",
      )
      .join("") +
    (reports.length
      ? ""
      : '<div class="field-empty">' +
        icon("camera") +
        "<p>" +
        tr(
          "تقارير تنفيذ المهام تظهر هنا بعد إرسالها.",
          "کام مکمل کرنے کی رپورٹ بھیجنے کے بعد یہاں نظر آئے گی۔",
        ) +
        "</p></div>")
  );
}
function opsForm(id, body, hint = "") {
  return (
    '<form data-opform="' +
    id +
    '"><div class="form-grid">' +
    body +
    "</div>" +
    (hint ? '<p class="hint">' + hint + "</p>" : "") +
    '<p class="form-error" role="alert"></p><div class="dialog-actions">' +
    opButton(tr("إلغاء", "منسوخ"), "close", "close", "", "secondary") +
    '<button type="submit" class="btn">' +
    icon("check") +
    tr("حفظ وإرسال", "محفوظ کریں اور بھیجیں") +
    "</button></div></form>"
  );
}
function newJob(template = "") {
  const templates = {
    water: ["جولة الماء والمشارب", "پانی اور برتن چیک کریں", "water"],
    feed: [
      "توزيع العلف وفحص المخزون",
      "چارہ تقسیم کریں اور ذخیرہ چیک کریں",
      "sheep",
    ],
    health: ["جولة ملاحظة الحلال", "جانوروں کا معائنہ", "sheep"],
    clean: ["تنظيف الحظائر", "باڑوں کی صفائی", "sheep"],
  };
  const t = templates[template] || ["", "", "water"];
  openDialog(
    tr("أرسل مهمة واضحة للعامل", "مزدور کو واضح کام بھیجیں"),
    '<div class="job-templates">' +
      Object.entries(templates)
        .map(([k, t]) =>
          opButton(tr(t[0], t[1]), "template", "tasks", k, "secondary"),
        )
        .join("") +
      "</div>" +
      opsForm(
        "job",
        field(
          tr("عنوان المهمة بالعربية", "کام کا عربی عنوان"),
          input("title", "text", t[0], 'required maxlength="160"'),
          true,
        ) +
          field(
            tr("عنوان بالأوردو للعامل", "مزدور کے لیے اردو عنوان"),
            input("ur", "text", t[1], 'required maxlength="160"'),
            true,
          ) +
          field(
            tr("المكان", "جگہ"),
            select(
              "facilityId",
              facilityData.map((f) => [f[0], tr(f[2], f[3])]),
              t[2],
            ),
          ) +
          field(
            tr("الأولوية", "ترجیح"),
            select(
              "priority",
              ["normal", "high", "urgent"].map((k) => [k, priorityLabel(k)]),
              "normal",
            ),
          ) +
          field(
            tr("اليوم", "تاریخ"),
            input("due", "date", today(), "required"),
          ) +
          field(
            tr("وقت التنفيذ", "کام کا وقت"),
            input("time", "time", "17:00", "required"),
          ) +
          field(
            tr("ربط بحيوان (اختياري)", "جانور سے جوڑیں (اختیاری)"),
            select("animalId", [
              ["", tr("بدون ربط", "بغیر ربط")],
              ...state.animals.map((a) => [
                a.id,
                (a.name || a.tag) + " · " + a.tag,
              ]),
            ]),
            true,
          ) +
          field(
            tr("خطوات بالعربية • كل سطر خطوة", "عربی مراحل • ہر سطر ایک مرحلہ"),
            '<textarea name="steps" required maxlength="2000" placeholder="' +
              tr(
                "مثال: فحص الخزان\nتعبئة المشارب\nتصوير المستوى",
                "مثال: ٹینک چیک کریں",
              ) +
              '"></textarea>',
            true,
          ) +
          field(
            tr(
              "نفس الخطوات بالأوردو • بنفس الترتيب",
              "وہی مراحل اردو میں • اسی ترتیب سے",
            ),
            '<textarea name="stepsUr" required maxlength="2000"></textarea>',
            true,
          ) +
          field(
            tr("تعليمات إضافية للعامل", "مزدور کے لیے اضافی ہدایات"),
            '<textarea name="note" maxlength="2000"></textarea>',
            true,
          ) +
          '<label class="photo-required"><input name="requirePhoto" type="checkbox" checked> ' +
          tr("صورة إلزامية عند الإتمام", "کام مکمل ہونے پر تصویر ضروری ہے") +
          "</label>",
        tr(
          "الرسالة تصل إلى واجهة العامل داخل هذا المتصفح فور الحفظ.",
          "محفوظ کرنے کے بعد کام اسی براؤزر میں مزدور کی سکرین پر نظر آئے گا۔",
        ),
      ),
  );
  if (template) {
    const texts =
      template === "water"
        ? [
            ["فحص الخزان", "ٹینک چیک کریں"],
            ["تعبئة المشارب", "پانی کے برتن بھریں"],
            ["تصوير المستوى", "سطح کی تصویر لیں"],
          ]
        : [
            ["فحص المكان", "جگہ چیک کریں"],
            ["تنفيذ المهمة", "کام مکمل کریں"],
            ["تسجيل النتيجة", "نتیجہ درج کریں"],
          ];
    document.querySelector("[name=steps]").value = texts
      .map((x) => x[0])
      .join("\n");
    document.querySelector("[name=stepsUr]").value = texts
      .map((x) => x[1])
      .join("\n");
  }
}
function jobTimeline(j) {
  return (
    '<div class="job-timeline">' +
    j.history
      .map(
        (e) =>
          "<div><i></i><p>" +
          esc(lang === "ur" ? e.ur : e.ar) +
          "</p><small>" +
          tr(
            e.actor === "worker" ? "العامل" : "المالك",
            e.actor === "worker" ? "مزدور" : "مالک",
          ) +
          " · " +
          date(e.at) +
          " " +
          new Date(e.at).toLocaleTimeString(lang === "ur" ? "ur-PK" : "ar-AE", {
            hour: "2-digit",
            minute: "2-digit",
          }) +
          "</small></div>",
      )
      .join("") +
    "</div>"
  );
}
function jobDetail(id) {
  const j = state.ops.jobs.find((x) => x.id === id);
  if (!j) return;
  openDialog(
    tr("ملف المهمة", "کام کی فائل"),
    '<div class="job-detail-top">' +
      jobPill(j) +
      '<span class="job-priority ' +
      j.priority +
      '">' +
      priorityLabel(j.priority) +
      '</span></div><h2 class="job-detail-title">' +
      esc(jobText(j)) +
      '</h2><p class="hint">' +
      facilityName(j.facilityId) +
      " · " +
      date(j.due) +
      " / " +
      esc(j.time) +
      "</p>" +
      (j.note ? '<p class="job-instructions">' + esc(j.note) + "</p>" : "") +
      '<div class="job-checklist readonly">' +
      j.steps
        .map(
          (s) =>
            "<div>" +
            icon(s.done ? "check" : "tasks") +
            "<span>" +
            esc(lang === "ur" ? s.ur || s.ar : s.ar) +
            "</span></div>",
        )
        .join("") +
      "</div>" +
      (j.report
        ? '<section class="job-evidence"><h3>' +
          tr("تقرير العامل", "مزدور کی رپورٹ") +
          "</h3><p>" +
          esc(j.report.note) +
          "</p>" +
          (j.report.photo
            ? '<img src="' +
              esc(j.report.photo) +
              '" alt="' +
              tr("صورة إنجاز المهمة", "مکمل کام کی تصویر") +
              '">'
            : "") +
          "<small>" +
          date(j.report.at) +
          "</small></section>"
        : '<p class="hint">' +
          tr(
            "بانتظار تقرير التنفيذ من العامل.",
            "مزدور کی رپورٹ کا انتظار ہے۔",
          ) +
          "</p>") +
      (j.feedback
        ? '<div class="field-feedback">' + esc(j.feedback) + "</div>"
        : "") +
      (j.status === "submitted"
        ? '<div class="dialog-actions">' +
          opButton(
            tr("إعادة للتصحيح", "درست کرنے کے لیے واپس"),
            "requestRevision",
            "arrow",
            j.id,
            "secondary",
          ) +
          opButton(
            tr("اعتماد الإنجاز", "کام منظور کریں"),
            "approve",
            "check",
            j.id,
          ) +
          "</div>"
        : "") +
      '<h3 class="timeline-title">' +
      tr("سجل المهمة", "کام کی تاریخ") +
      "</h3>" +
      jobTimeline(j),
  );
}
function fieldJob(id) {
  const j = state.ops.jobs.find((x) => x.id === id);
  if (!j) return;
  openDialog(
    tr("مهمتك", "آپ کا کام"),
    '<div class="job-detail-top">' +
      jobPill(j) +
      '<span class="job-priority ' +
      j.priority +
      '">' +
      priorityLabel(j.priority) +
      '</span></div><h2 class="job-detail-title">' +
      esc(jobText(j)) +
      '</h2><p class="hint">' +
      facilityName(j.facilityId) +
      " · " +
      esc(j.time) +
      "</p>" +
      (j.note ? '<p class="job-instructions">' + esc(j.note) + "</p>" : "") +
      (j.feedback
        ? '<div class="field-feedback">' +
          tr("ملاحظة المالك: ", "مالک کا مشورہ: ") +
          esc(j.feedback) +
          "</div>"
        : "") +
      '<div class="job-checklist">' +
      j.steps
        .map(
          (s, i) =>
            '<label><input type="checkbox" data-job-step="' +
            j.id +
            '" data-step="' +
            i +
            '" ' +
            (s.done ? "checked" : "") +
            " " +
            (!["active", "revision"].includes(j.status) ? "disabled" : "") +
            "><span>" +
            esc(lang === "ur" ? s.ur || s.ar : s.ar) +
            "</span></label>",
        )
        .join("") +
      "</div>" +
      (j.status === "queued"
        ? opButton(
            tr("بدأت تنفيذ المهمة", "میں نے کام شروع کیا"),
            "startJob",
            "check",
            j.id,
          )
        : ["active", "revision"].includes(j.status)
          ? '<div id="submissionArea">' + submissionForm(j) + "</div>"
          : '<section class="job-evidence"><p>' +
            tr(
              j.status === "approved"
                ? "المالك اعتمد شغلك، يعطيك العافية."
                : "تم الإرسال. بانتظار مراجعة المالك.",
              j.status === "approved"
                ? "مالک نے آپ کا کام منظور کر لیا۔ شکریہ۔"
                : "رپورٹ بھیج دی گئی۔ مالک کی منظوری کا انتظار ہے۔",
            ) +
            "</p>" +
            (j.report?.photo
              ? '<img src="' +
                esc(j.report.photo) +
                '" alt="' +
                tr("صورة التنفيذ", "کام کی تصویر") +
                '">'
              : "") +
            "</section>"),
  );
}
function submissionForm(j) {
  return opsForm(
    "submitJob",
    input("jobId", "hidden", j.id) +
      field(
        tr("وش سويت؟ اكتب النتيجة", "آپ نے کیا کیا؟ نتیجہ لکھیں"),
        '<textarea name="report" required maxlength="2000" placeholder="' +
          tr(
            "النتيجة والملاحظات بعد التنفيذ",
            "کام مکمل کرنے کے بعد نتیجہ اور مشاہدات",
          ) +
          '"></textarea>',
        true,
      ) +
      field(
        tr(
          j.requirePhoto ? "صورة مطلوبة" : "صورة اختيارية",
          j.requirePhoto ? "تصویر ضروری" : "تصویر اختیاری",
        ),
        '<span class="photo-upload">' +
          icon("camera") +
          "<span>" +
          tr("اختر صورة أو التقط صورة", "تصویر منتخب کریں یا کھینچیں") +
          '</span><input name="evidence" type="file" accept="image/*" capture="environment" ' +
          (j.requirePhoto ? "required" : "") +
          '></span><img id="evidencePreview" class="file-preview" alt="' +
          tr("معاينة الصورة", "تصویر کا جائزہ") +
          '" hidden>',
        true,
      ),
    tr(
      "أكمل كل الخطوات قبل إرسال التقرير. الصورة تحفظ محليًا مضغوطة.",
      "رپورٹ بھیجنے سے پہلے تمام مراحل مکمل کریں۔ تصویر مقامی طور پر چھوٹی کرکے محفوظ ہوگی۔",
    ),
  );
}
function messageForm() {
  openDialog(
    tr(
      route === "field" ? "رد إلى المالك" : "رسالة للعامل",
      route === "field" ? "مالک کو جواب" : "مزدور کو پیغام",
    ),
    opsForm(
      "message",
      field(
        tr("الرسالة", "پیغام"),
        '<textarea name="text" required maxlength="2000" placeholder="' +
          tr("اكتب تعليمات واضحة…", "واضح ہدایات لکھیں…") +
          '"></textarea>',
        true,
      ),
    ),
  );
}
function revisionForm(id) {
  openDialog(
    tr("ماذا يحتاج تصحيحًا؟", "کیا درست کرنا ہے؟"),
    opsForm(
      "revision",
      input("jobId", "hidden", id) +
        field(
          tr(
            "تعليمات للعامل (يفضل بالأوردو)",
            "مزدور کے لیے ہدایات (اردو بہتر ہے)",
          ),
          '<textarea name="feedback" required maxlength="1000"></textarea>',
          true,
        ),
    ),
  );
}
function findJob(id) {
  const j = state.ops.jobs.find((j) => j.id === id);
  if (!j) throw Error(tr("المهمة غير موجودة", "کام موجود نہیں"));
  return j;
}
const opActions = {
  sensorDetail: (id) => sensorDetail(id),
  sensorConfig: (id) => sensorConfig(id),
  stockMove: (id) => stockMove(id),
  passport: (id) => {
    $("#dialog").close();
    passportTab = "overview";
    location.hash = "animal/" + id;
  },
  passportTab: (id) => {
    passportTab = id;
    render();
  },
  animalPhoto: (id) => animalPhotoForm(id),
  animalWeight: (id) => animalWeightForm(id),
  animalRelations: (id) => animalRelationsForm(id),
  close: () => $("#dialog").close(),
  newJob: () => newJob(),
  template: newJob,
  jobDetail,
  fieldJob,
  message: messageForm,
  requestRevision: revisionForm,
  hubFilter: (id) => {
    hubFilter = id;
    render();
  },
  fieldTab: (id) => {
    fieldTab = id;
    if (id === "messages") {
      opCommit(() =>
        state.ops.messages
          .filter((m) => m.from === "owner" && !m.readAt)
          .forEach((m) => (m.readAt = stamp())),
      );
    } else render();
  },
  startJob: (id) => {
    if (
      opCommit(() => {
        const j = findJob(id);
        if (j.status !== "queued")
          throw Error(
            tr(
              "تغيرت حالة المهمة، افتحها مجددًا",
              "کام کی حالت بدل گئی؛ دوبارہ کھولیں",
            ),
          );
        j.status = "active";
        j.startedAt = stamp();
        opEvent(
          j,
          "started",
          "العامل بدأ التنفيذ",
          "مزدور نے کام شروع کیا",
          "worker",
        );
      })
    ) {
      fieldJob(id);
    }
  },
  approve: (id) => {
    if (
      opCommit(
        () => {
          const j = findJob(id);
          if (j.status !== "submitted")
            throw Error(
              tr("لا يوجد تقرير بانتظار الاعتماد", "منظوری کے لیے رپورٹ نہیں"),
            );
          j.status = "approved";
          j.reviewedAt = stamp();
          opEvent(
            j,
            "approved",
            "المالك اعتمد التنفيذ",
            "مالک نے کام منظور کیا",
            "owner",
          );
          addActivity(
            "اعتماد المهمة: " + j.title,
            "کام منظور: " + (j.ur || j.title),
            "check",
          );
        },
        tr("تم اعتماد التنفيذ", "کام منظور ہو گیا"),
      )
    ) {
      jobDetail(id);
    }
  },
};
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-op]");
  if (el) {
    const fn = opActions[el.dataset.op];
    if (fn) fn(el.dataset.id);
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "fieldSearch") {
    fieldSearch = e.target.value;
    const pos = e.target.selectionStart;
    render();
    $("#fieldSearch").focus();
    $("#fieldSearch").setSelectionRange(pos, pos);
  }
});
document.addEventListener("change", async (e) => {
  if (e.target.dataset.jobStep) {
    const id = e.target.dataset.jobStep,
      index = Number(e.target.dataset.step),
      checked = e.target.checked;
    opCommit(() => {
      const j = findJob(id);
      if (!["active", "revision"].includes(j.status))
        throw Error(tr("ابدأ المهمة أولًا", "پہلے کام شروع کریں"));
      if (!j.steps[index]) throw Error("Invalid step");
      j.steps[index].done = checked;
    });
  }
  if (e.target.name === "evidence") {
    try {
      const data = await photoData(e.target.files[0]);
      $("#evidencePreview").src = data;
      $("#evidencePreview").hidden = !data;
    } catch (err) {
      toast(err.message);
      e.target.value = "";
    }
  }
});
document.addEventListener("submit", async (e) => {
  const f = e.target;
  if (!f.dataset.opform) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const v = Object.fromEntries(new FormData(f)),
    kind = f.dataset.opform;
  const submit = f.querySelector("[type=submit]");
  submit.disabled = true;
  f.querySelector(".form-error").textContent = "";
  try {
    if (kind === "job") {
      const steps = v.steps
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        urSteps = v.stepsUr
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      if (!steps.length || steps.length !== urSteps.length)
        throw Error(
          tr(
            "أدخل نفس عدد الخطوات بالعربية والأوردو.",
            "عربی اور اردو مراحل کی تعداد برابر رکھیں۔",
          ),
        );
      if (!v.title.trim() || !v.ur.trim())
        throw Error(
          tr(
            "أدخل عنوانًا واضحًا باللغتين.",
            "دونوں زبانوں میں واضح عنوان لکھیں۔",
          ),
        );
      if (
        !opCommit(
          () => {
            const j = {
              id: uid(),
              title: v.title.trim(),
              ur: v.ur.trim(),
              facilityId: v.facilityId,
              priority: v.priority,
              animalId: v.animalId,
              due: v.due,
              time: v.time,
              note: v.note,
              requirePhoto: v.requirePhoto === "on",
              status: "queued",
              steps: steps.map((ar, i) => ({
                ar,
                ur: urSteps[i],
                done: false,
              })),
              history: [],
              createdAt: stamp(),
              report: null,
            };
            state.ops.jobs.unshift(j);
            opEvent(
              j,
              "created",
              "المالك أرسل المهمة للعامل",
              "مالک نے مزدور کو کام بھیجا",
              "owner",
            );
          },
          tr(
            "وصلت المهمة لواجهة العامل داخل المتصفح",
            "کام اسی براؤزر میں مزدور کی سکرین پر پہنچ گیا",
          ),
        )
      )
        return;
    } else if (kind === "submitJob") {
      const j = findJob(v.jobId);
      if (!["active", "revision"].includes(j.status))
        throw Error(
          tr(
            "هذه المهمة ليست مفتوحة للتنفيذ.",
            "یہ کام مکمل کرنے کے لیے کھلا نہیں۔",
          ),
        );
      if (j.steps.some((s) => !s.done))
        throw Error(
          tr(
            "أكمل جميع خطوات المهمة أولًا.",
            "پہلے کام کے تمام مراحل مکمل کریں۔",
          ),
        );
      if (!v.report.trim())
        throw Error(tr("اكتب نتيجة التنفيذ.", "کام کا نتیجہ لکھیں۔"));
      const photo = await photoData(v.evidence?.size ? v.evidence : null);
      if (j.requirePhoto && !photo)
        throw Error(
          tr(
            "أضف صورة التنفيذ قبل الإرسال.",
            "بھیجنے سے پہلے کام کی تصویر شامل کریں۔",
          ),
        );
      if (
        !opCommit(
          () => {
            const live = findJob(v.jobId);
            if (!["active", "revision"].includes(live.status))
              throw Error(
                tr(
                  "تغيرت حالة المهمة. أعد فتحها.",
                  "کام کی حالت بدل گئی؛ دوبارہ کھولیں۔",
                ),
              );
            if (live.report) {
              live.previousReports = live.previousReports || [];
              live.previousReports.push(live.report);
            }
            live.report = { note: v.report.trim(), photo, at: stamp() };
            live.status = "submitted";
            opEvent(
              live,
              "submitted",
              "العامل أرسل التقرير والصورة للمراجعة",
              "مزدور نے رپورٹ جائزے کے لیے بھیجی",
              "worker",
            );
            addActivity(
              "تقرير تنفيذ: " + live.title,
              "کام کی رپورٹ: " + (live.ur || live.title),
              "camera",
              photo,
            );
          },
          tr(
            "أُرسل التقرير لمراجعة المالك",
            "رپورٹ مالک کے جائزے کے لیے بھیج دی گئی",
          ),
        )
      )
        return;
    } else if (kind === "revision") {
      if (!v.feedback.trim())
        throw Error(tr("اكتب ما يحتاج تصحيحًا.", "درست کرنے کی ہدایت لکھیں۔"));
      if (
        !opCommit(
          () => {
            const j = findJob(v.jobId);
            if (j.status !== "submitted")
              throw Error(
                tr("لا يوجد تقرير للمراجعة.", "جائزے کی رپورٹ نہیں۔"),
              );
            j.status = "revision";
            j.feedback = v.feedback.trim();
            j.steps.forEach((s) => (s.done = false));
            opEvent(
              j,
              "revision",
              "المالك طلب تصحيح التنفيذ",
              "مالک نے کام درست کرنے کو کہا",
              "owner",
            );
          },
          tr(
            "أعيدت المهمة للعامل مع ملاحظتك",
            "کام آپ کی ہدایت کے ساتھ واپس بھیجا گیا",
          ),
        )
      )
        return;
    } else if (kind === "sensorConfig") {
      if (
        !opCommit(
          () => {
            const d = state.devices.find((d) => d.id === v.deviceId);
            if (!d)
              throw Error(
                tr("نقطة المتابعة غير موجودة", "نگرانی کی جگہ موجود نہیں"),
              );
            d.capacity = v.capacity ? Number(v.capacity) : null;
            d.threshold = Number(v.threshold);
            d.deviceCode = v.deviceCode.trim();
          },
          tr("تم حفظ إعداد المتابعة", "نگرانی کی ترتیب محفوظ ہو گئی"),
        )
      )
        return;
    } else if (kind === "stockMove") {
      const amount = Number(v.qty);
      if (!(amount > 0))
        throw Error(
          tr("أدخل كمية أكبر من صفر.", "صفر سے زیادہ مقدار درج کریں۔"),
        );
      if (
        !opCommit(
          () => {
            const s = state.stock.find((s) => s.id === v.stockId);
            if (!s) throw Error(tr("الصنف غير موجود.", "سامان موجود نہیں۔"));
            if (v.direction === "out" && amount > s.qty)
              throw Error(
                tr(
                  "الكمية المصروفة أكبر من المخزون المتاح.",
                  "استعمال کی مقدار ذخیرے سے زیادہ ہے۔",
                ),
              );
            const before = s.qty;
            s.qty =
              Math.round(
                (s.qty + (v.direction === "in" ? amount : -amount)) * 100,
              ) / 100;
            state.ops.movements.push({
              id: uid(),
              stockId: s.id,
              name: s.name,
              direction: v.direction,
              qty: amount,
              unit: s.unit,
              before,
              after: s.qty,
              note: v.note,
              at: stamp(),
            });
            addActivity(
              (v.direction === "in" ? "توريد " : "صرف ") +
                amount +
                " " +
                unit(s.unit) +
                " • " +
                s.name,
              (v.direction === "in" ? "سامان آیا: " : "استعمال ہوا: ") +
                amount +
                " " +
                unit(s.unit) +
                " • " +
                (s.ur || s.name),
              "feed",
            );
          },
          tr(
            "سُجلت الحركة وتحدث المخزون",
            "ذخیرے کی حرکت درج اور مقدار تبدیل ہو گئی",
          ),
        )
      )
        return;
    } else if (kind === "animalPhoto") {
      const photo = await photoData(v.image?.size ? v.image : null);
      if (!photo)
        throw Error(tr("اختر صورة للحيوان.", "جانور کی تصویر منتخب کریں۔"));
      if (
        !opCommit(
          () => {
            const a = state.animals.find((a) => a.id === v.animalId);
            if (!a) throw Error(tr("الحيوان غير موجود", "جانور موجود نہیں"));
            a.photo = photo;
          },
          tr("تم حفظ صورة الحيوان", "جانور کی تصویر محفوظ ہو گئی"),
        )
      )
        return;
    } else if (kind === "animalWeight") {
      if (!(Number(v.kg) > 0 && Number(v.kg) <= 2000))
        throw Error(tr("أدخل وزنًا صحيحًا.", "درست وزن درج کریں۔"));
      if (
        !opCommit(
          () => {
            const a = state.animals.find((a) => a.id === v.animalId);
            if (!a) throw Error(tr("الحيوان غير موجود", "جانور موجود نہیں"));
            a.weights = a.weights || [];
            a.weights.push({
              id: uid(),
              kg: Number(v.kg),
              at: v.at,
              note: v.note,
            });
            a.weights.sort((x, y) => new Date(x.at) - new Date(y.at));
            a.weight = a.weights.at(-1).kg;
            addActivity(
              "قياس وزن " + (a.name || a.tag) + ": " + v.kg + " كجم",
              "وزن درج: " + (a.name || a.tag) + ": " + v.kg + " کلو",
              "sheep",
            );
          },
          tr("تم تسجيل القياس", "وزن درج ہو گیا"),
        )
      )
        return;
    } else if (kind === "animalRelations") {
      if (v.dam === v.animalId || v.sire === v.animalId)
        throw Error(
          tr(
            "لا يمكن ربط الحيوان بنفسه.",
            "جانور خود اپنا والدین نہیں ہو سکتا۔",
          ),
        );
      if (
        !opCommit(
          () => {
            const a = state.animals.find((a) => a.id === v.animalId);
            if (!a) throw Error(tr("الحيوان غير موجود", "جانور موجود نہیں"));
            Object.assign(a, {
              dam: v.dam,
              sire: v.sire,
              purpose: v.purpose,
              facilityId: v.facilityId,
            });
          },
          tr("تم حفظ الموقع والعلاقات", "مقام اور تعلقات محفوظ ہو گئے"),
        )
      )
        return;
    } else if (kind === "message") {
      if (!v.text.trim())
        throw Error(tr("اكتب رسالة أولًا.", "پہلے پیغام لکھیں۔"));
      if (
        !opCommit(
          () => {
            state.ops.messages.push({
              id: uid(),
              text: v.text.trim(),
              from: route === "field" ? "worker" : "owner",
              at: stamp(),
              readAt: null,
            });
          },
          tr("تم إرسال الرسالة داخل المتصفح", "پیغام اسی براؤزر میں بھیجا گیا"),
        )
      )
        return;
    }
    $("#dialog").close();
  } catch (err) {
    f.querySelector(".form-error").textContent = err.message;
  } finally {
    submit.disabled = false;
  }
});

function animalPassport(id) {
  const a = state.animals.find((a) => a.id === id);
  if (!a)
    return (
      title(
        "الملف غير موجود",
        "فائل موجود نہیں",
        tr(
          "قد يكون الحيوان أُزيل من السجل.",
          "جانور ریکارڈ سے ہٹایا جا چکا ہے۔",
        ),
      ) +
      '<a class="btn" href="#animals">' +
      tr("العودة للسجل", "ریکارڈ پر واپس") +
      "</a>"
    );
  const health = state.health.filter((h) => h.animalId === id),
    jobs = state.ops.jobs.filter((j) => j.animalId === id),
    weights = a.weights || [];
  const due = health
    .filter((h) => h.due && new Date(h.due) >= new Date(today()))
    .sort((x, y) => new Date(x.due) - new Date(y.due))[0];
  return (
    '<div class="passport-back"><a href="#animals">' +
    icon("arrow") +
    tr("سجل الحلال", "جانوروں کا ریکارڈ") +
    '</a><span>3ZBH / ANIMAL PASSPORT</span></div><section class="passport-header"><div class="passport-portrait">' +
    (a.photo
      ? '<img src="' + esc(a.photo) + '" alt="' + esc(a.name || a.tag) + '">'
      : icon("sheep")) +
    '<button data-op="animalPhoto" data-id="' +
    a.id +
    '" aria-label="' +
    tr("إضافة صورة الحيوان", "جانور کی تصویر شامل کریں") +
    '">' +
    icon("camera") +
    '</button></div><div class="passport-identity"><div class="row"><span class="passport-tag">' +
    esc(a.tag) +
    '</span><span class="tag ' +
    (a.status !== "healthy" ? "amber" : "") +
    '">' +
    statusName(a.status) +
    "</span></div><h1>" +
    esc(a.name || tr("بدون اسم", "بے نام")) +
    "</h1><p>" +
    kind(a.kind) +
    " · " +
    breedName(a.breed) +
    " · " +
    sex(a.sex) +
    " · " +
    age(a.birth) +
    "</p><small>" +
    icon("pin") +
    facilityName(a.facilityId || "sheep") +
    '</small></div><div class="passport-actions">' +
    btn(
      tr("تعديل الملف", "فائل بدلیں"),
      "animal",
      "plus",
      'data-id="' + a.id + '"',
      "secondary",
    ) +
    btn(
      tr("متابعة صحية", "صحت کی نگرانی"),
      "health",
      "heart",
      'data-id="' + a.id + '"',
    ) +
    '</div></section><div class="passport-tabs">' +
    [
      ["overview", "نظرة عامة", "جائزہ"],
      ["health", "الصحة والرعاية", "صحت"],
      ["growth", "الوزن والنمو", "وزن"],
      ["family", "الأصل والعلاقات", "نسب اور تعلقات"],
      ["timeline", "السجل الزمني", "واقعات"],
    ]
      .map(
        (x) =>
          '<button data-op="passportTab" data-id="' +
          x[0] +
          '" class="' +
          (passportTab === x[0] ? "active" : "") +
          '">' +
          tr(x[1], x[2]) +
          "</button>",
      )
      .join("") +
    "</div>" +
    (
      {
        overview: () =>
          '<div class="stats">' +
          stat(
            "sheep",
            a.weight ? num(a.weight) + "<small> kg</small>" : "—",
            tr("آخر وزن مسجل", "آخری درج شدہ وزن"),
            weights.length
              ? date(weights.at(-1).at)
              : tr("من ملف الحيوان", "جانور کی فائل سے"),
            tr("قياس", "پیمائش"),
          ) +
          stat(
            "heart",
            health.length,
            tr("متابعات صحية", "صحت کے واقعات"),
            tr("من السجل الفعلي", "اصل درج شدہ ریکارڈ"),
            tr("الرعاية", "دیکھ بھال"),
          ) +
          stat(
            "tasks",
            jobs.length,
            tr("مهام مرتبطة", "متعلقہ کام"),
            tr(
              "يمكن ربط الحيوان عند إنشاء مهمة",
              "نیا کام بناتے وقت جانور جوڑیں",
            ),
            tr("العامل", "مزدور"),
          ) +
          stat(
            "clock",
            due ? date(due.due) : "—",
            tr("المتابعة القادمة", "اگلی جانچ"),
            tr("حسب آخر موعد أدخلته", "درج شدہ موعد کے مطابق"),
            tr("المواعيد", "موعد"),
          ) +
          '</div><div class="health-grid">' +
          panel(
            tr("بطاقة الحيوان", "جانور کی معلومات"),
            tr(
              "بيانات قابلة للتعديل من ملف الحيوان",
              "فائل سے معلومات بدل سکتے ہیں",
            ),
            '<div class="panel-body">' +
              [
                [
                  tr("تاريخ الميلاد", "تاریخ پیدائش"),
                  a.birth ? date(a.birth) : "—",
                ],
                [tr("الجنس", "جنس"), sex(a.sex)],
                [tr("السلالة", "نسل"), breedName(a.breed)],
                [tr("رقم العلامة", "شناختی نمبر"), a.tag],
                [tr("الغاية", "مقصد"), purposeName(a.purpose)],
              ]
                .map(
                  ([l, v]) =>
                    '<div class="metric-line"><span>' +
                    l +
                    "</span><b>" +
                    esc(v) +
                    "</b></div>",
                )
                .join("") +
              "</div>",
          ) +
          panel(
            tr("ملاحظات ورعاية", "مشاہدات اور دیکھ بھال"),
            tr("تعليماتك الخاصة بهذا الحيوان", "اس جانور کے لیے آپ کی ہدایات"),
            '<div class="panel-body"><p class="passport-notes">' +
              esc(
                a.notes ||
                  tr(
                    "لا توجد ملاحظات مسجلة بعد.",
                    "ابھی کوئی مشاہدہ درج نہیں۔",
                  ),
              ) +
              "</p>" +
              jobs
                .slice(0, 3)
                .map(
                  (j) =>
                    '<button class="attention-item" data-op="jobDetail" data-id="' +
                    j.id +
                    '"><span>' +
                    esc(jobText(j)) +
                    "</span>" +
                    jobPill(j) +
                    "</button>",
                )
                .join("") +
              "</div>",
          ) +
          "</div>",
        health: () =>
          panel(
            tr("الرعاية الصحية", "صحت کی دیکھ بھال"),
            tr(
              "فحوص وتطعيمات وعلاجات وولادات",
              "جانچ، ویکسین، علاج اور پیدائش",
            ),
            '<div class="panel-body">' +
              (health.length
                ? health
                    .map(
                      (h) =>
                        '<div class="passport-event">' +
                        icon("heart") +
                        "<div><strong>" +
                        healthType(h.type) +
                        "</strong><p>" +
                        esc(h.note) +
                        "</p><small>" +
                        date(h.at) +
                        (h.due
                          ? " · " +
                            tr("المتابعة: ", "اگلی جانچ: ") +
                            date(h.due)
                          : "") +
                        "</small></div></div>",
                    )
                    .join("")
                : '<div class="empty">' +
                  tr(
                    "لا يوجد سجل صحي لهذا الحيوان بعد.",
                    "اس جانور کا صحت کا ریکارڈ ابھی نہیں۔",
                  ) +
                  "</div>") +
              "</div>",
            btn(
              tr("حدث صحي", "صحت کا واقعہ"),
              "health",
              "plus",
              'data-id="' + a.id + '"',
              "secondary",
            ),
          ),
        growth: () =>
          panel(
            tr("سجل الوزن والنمو", "وزن کا ریکارڈ"),
            tr(
              "المنحنى يعتمد على قياساتك المسجلة فقط.",
              "منحنی صرف آپ کی درج کردہ پیمائش سے ہے۔",
            ),
            '<div class="panel-body">' +
              weightChart(weights) +
              (weights.length
                ? '<div class="weight-records">' +
                  weights
                    .slice()
                    .reverse()
                    .map(
                      (w) =>
                        '<div class="metric-line"><span>' +
                        date(w.at) +
                        (w.note ? " · " + esc(w.note) : "") +
                        "</span><b>" +
                        w.kg +
                        " kg</b></div>",
                    )
                    .join("") +
                  "</div>"
                : '<div class="empty">' +
                  tr(
                    "سجّل قياسين في تاريخين مختلفين لعرض اتجاه الوزن.",
                    "وزن کا رجحان دیکھنے کے لیے دو تاریخوں پر پیمائش درج کریں۔",
                  ) +
                  "</div>") +
              "</div>",
            opButton(
              tr("قياس جديد", "نئی پیمائش"),
              "animalWeight",
              "plus",
              a.id,
            ),
          ),
        family: () =>
          '<section class="settings-card"><div class="hub-section-head"><h2>' +
          tr("الأصل والعلاقات", "نسب اور تعلقات") +
          "</h2>" +
          opButton(
            tr("تعديل العلاقات والموقع", "تعلقات اور مقام بدلیں"),
            "animalRelations",
            "users",
            a.id,
          ) +
          '</div><div class="pedigree-grid">' +
          [
            ["sire", tr("الأب", "والد")],
            ["dam", tr("الأم", "والدہ")],
          ]
            .map(([k, label]) => {
              const p = state.animals.find((x) => x.id === a[k]);
              return (
                '<div class="pedigree-card">' +
                icon("sheep") +
                "<small>" +
                label +
                "</small><strong>" +
                esc(p?.name || p?.tag || tr("غير مسجل", "درج نہیں")) +
                "</strong>" +
                (p
                  ? opButton(
                      tr("فتح الملف", "فائل کھولیں"),
                      "passport",
                      "arrow",
                      p.id,
                      "ghost",
                    )
                  : "") +
                "</div>"
              );
            })
            .join("") +
          '</div><div class="metric-line"><span>' +
          tr("الغرض من التربية", "پالنے کا مقصد") +
          "</span><b>" +
          purposeName(a.purpose) +
          '</b></div><div class="metric-line"><span>' +
          tr("الموقع", "جگہ") +
          "</span><b>" +
          facilityName(a.facilityId || "sheep") +
          "</b></div></section>",
        timeline: () =>
          panel(
            tr("كل ما يخص هذا الحيوان", "اس جانور کے واقعات"),
            tr("تواريخ محفوظة من إدخالاتك", "آپ کے اندراج کی محفوظ تاریخیں"),
            '<div class="panel-body">' +
              [
                ...health.map((h) => ({
                  at: h.at,
                  title: healthType(h.type),
                  note: h.note,
                  ico: "heart",
                })),
                ...weights.map((w) => ({
                  at: w.at,
                  title: tr("قياس وزن: ", "وزن: ") + w.kg + " kg",
                  note: w.note,
                  ico: "chart",
                })),
                {
                  at: a.createdAt,
                  title: tr(
                    "أُضيف إلى سجل الحلال",
                    "جانور ریکارڈ میں شامل ہوا",
                  ),
                  note: a.tag,
                  ico: "sheep",
                },
              ]
                .sort((x, y) => new Date(y.at) - new Date(x.at))
                .map(
                  (e) =>
                    '<div class="passport-event">' +
                    icon(e.ico) +
                    "<div><strong>" +
                    esc(e.title) +
                    "</strong><p>" +
                    esc(e.note || "") +
                    "</p><small>" +
                    date(e.at) +
                    "</small></div></div>",
                )
                .join("") +
              "</div>",
          ),
      }[passportTab] || (() => "")
    )()
  );
}
function purposeName(p) {
  return (
    {
      breeding: tr("تكاثر", "افزائش"),
      production: tr("إنتاج", "پیداوار"),
      young: tr("تربية صغار", "بچوں کی پرورش"),
    }[p] || tr("غير محدد", "متعین نہیں")
  );
}
function healthType(p) {
  return (
    {
      check: tr("فحص وملاحظة", "جانچ"),
      treatment: tr("علاج", "علاج"),
      vaccination: tr("تطعيم", "ویکسین"),
      birth: tr("ولادة", "پیدائش"),
    }[p] || p
  );
}
function weightChart(records) {
  if (records.length < 2) return "";
  const values = records.map((r) => r.kg),
    min = Math.min(...values) * 0.95,
    max = Math.max(...values) * 1.05,
    first = new Date(records[0].at).getTime(),
    last = new Date(records.at(-1).at).getTime();
  const points = records.map((r) => ({
    x: 35 + ((new Date(r.at) - first) / Math.max(1, last - first)) * 630,
    y: 170 - ((r.kg - min) / Math.max(1, max - min)) * 140,
    kg: r.kg,
  }));
  return (
    '<svg class="weight-chart" viewBox="0 0 700 220" role="img" aria-label="' +
    tr("منحنى قياسات الوزن المسجلة", "درج شدہ وزن کا منحنی") +
    '"><path d="M35 170H665M35 100H665M35 30H665" stroke="#e8ecdf" stroke-dasharray="4 6"/><polygon points="35,190 ' +
    points.map((p) => p.x + "," + p.y).join(" ") +
    ' 665,190" fill="#edf3e2"/><polyline points="' +
    points.map((p) => p.x + "," + p.y).join(" ") +
    '" fill="none" stroke="#769b5c" stroke-width="3"/>' +
    points
      .map(
        (p) =>
          '<circle cx="' +
          p.x +
          '" cy="' +
          p.y +
          '" r="5" fill="#547d44"/><text x="' +
          p.x +
          '" y="' +
          (p.y - 13) +
          '" text-anchor="middle" font-family="Arial" font-size="12" fill="#5f7755">' +
          p.kg +
          "</text>",
      )
      .join("") +
    '<text x="35" y="213" font-size="11" fill="#9ca68d">' +
    date(records[0].at) +
    '</text><text x="665" y="213" text-anchor="end" font-size="11" fill="#9ca68d">' +
    date(records.at(-1).at) +
    "</text></svg>"
  );
}
function animalPhotoForm(id) {
  openDialog(
    tr("صورة الحيوان", "جانور کی تصویر"),
    opsForm(
      "animalPhoto",
      input("animalId", "hidden", id) +
        field(
          tr("اختر صورة واضحة", "واضح تصویر منتخب کریں"),
          '<input type="file" name="image" accept="image/*" required>',
          true,
        ),
    ),
  );
}
function animalWeightForm(id) {
  openDialog(
    tr("قياس وزن جديد", "نئی وزن پیمائش"),
    opsForm(
      "animalWeight",
      input("animalId", "hidden", id) +
        field(
          tr("الوزن بالكيلو", "وزن کلو"),
          input("kg", "number", "", 'required min="0.1" max="2000" step="0.1"'),
        ) +
        field(
          tr("تاريخ القياس", "پیمائش کی تاریخ"),
          input("at", "date", today(), 'required max="' + today() + '"'),
        ) +
        field(
          tr("ملاحظة", "مشاہدہ"),
          input("note", "text", "", 'maxlength="200"'),
          true,
        ),
    ),
  );
}
function animalRelationsForm(id) {
  const a = state.animals.find((a) => a.id === id);
  if (!a) return;
  const peers = state.animals.filter((p) => p.kind === a.kind && p.id !== a.id);
  openDialog(
    tr("الموقع والأصل", "مقام اور نسب"),
    opsForm(
      "animalRelations",
      input("animalId", "hidden", id) +
        field(
          tr("الموقع", "جگہ"),
          select(
            "facilityId",
            facilityData.map((f) => [f[0], tr(f[2], f[3])]),
            a.facilityId || "sheep",
          ),
          true,
        ) +
        field(
          tr("الأب", "والد"),
          select(
            "sire",
            [
              ["", tr("غير مسجل", "درج نہیں")],
              ...peers
                .filter((p) => p.sex === "male")
                .map((p) => [p.id, p.name || p.tag]),
            ],
            a.sire || "",
          ),
        ) +
        field(
          tr("الأم", "والدہ"),
          select(
            "dam",
            [
              ["", tr("غير مسجل", "درج نہیں")],
              ...peers
                .filter((p) => p.sex === "female")
                .map((p) => [p.id, p.name || p.tag]),
            ],
            a.dam || "",
          ),
        ) +
        field(
          tr("الغرض من التربية", "پالنے کا مقصد"),
          select(
            "purpose",
            [
              ["", tr("غير محدد", "متعین نہیں")],
              ...["breeding", "production", "young"].map((p) => [
                p,
                purposeName(p),
              ]),
            ],
            a.purpose || "",
          ),
          true,
        ),
    ),
  );
}

function sensorWorkbench() {
  const valid = state.devices.filter((d) => d.value !== null),
    low = valid.filter((d) => d.value <= d.threshold);
  return (
    title(
      "الماء والعلف. تحت المتابعة.",
      "پانی اور چارہ۔ آپ کی نگرانی میں۔",
      tr(
        "المستويات، تاريخ القراءات، وحركة المخزون في شاشة واحدة.",
        "سطحیں، ریڈنگ کی تاریخ اور ذخیرے کی حرکت ایک سکرین پر۔",
      ),
      btn(tr("تسجيل قراءة", "ریڈنگ درج کریں"), "reading", "drop"),
    ) +
    '<div class="telemetry-status"><span><i></i>' +
    tr("لا توجد أجهزة متصلة الآن", "ابھی کوئی آلہ منسلک نہیں") +
    "</span><p>" +
    tr(
      "القراءات أدناه يدوية أو توضيحية. ربط أجهزة حقيقية يحتاج تركيبًا وخدمة استقبال بيانات.",
      "نیچے دستی یا نمونہ ریڈنگ ہے۔ اصل رابطے کے لیے آلات اور ڈیٹا وصول کرنے کی سروس درکار ہے۔",
    ) +
    '</p></div><div class="telemetry-cards">' +
    state.devices
      .map((d) => {
        const readings = state.ops.readings.filter((r) => r.deviceId === d.id),
          late =
            d.source === "manual" &&
            Date.now() - new Date(d.updatedAt) > 86400000;
        return (
          '<article class="tank-card"><div class="tank-card-head"><div><p>' +
          tr(
            d.type === "water" ? "متابعة الماء" : "متابعة العلف",
            d.type === "water" ? "پانی کی نگرانی" : "چارے کی نگرانی",
          ) +
          "</p><h2>" +
          esc(deviceText(d)) +
          '</h2></div><button class="icon-btn" data-op="sensorConfig" data-id="' +
          d.id +
          '" aria-label="' +
          tr("إعداد المتابعة", "نگرانی کی ترتیب") +
          '">' +
          icon("settings") +
          '</button></div><div class="tank-display"><div class="tank-visual ' +
          (d.type === "feed" ? "feed-tank" : "") +
          '"><div class="tank-fill" style="height:' +
          (d.value || 0) +
          '%"></div><div class="tank-lines"></div><strong>' +
          (d.value === null ? "—" : d.value + "<small>%</small>") +
          '</strong></div><div class="tank-facts"><span class="pill offline">' +
          tr(
            d.source === "demo" ? "توضيحي" : "يدوي",
            d.source === "demo" ? "نمونہ" : "دستی",
          ) +
          "</span><p>" +
          tr("السعة المسجلة", "درج شدہ گنجائش") +
          "</p><b>" +
          (d.capacity && d.type === "water" ? num(d.capacity) + " L" : "—") +
          "</b><p>" +
          tr("الكمية التقديرية", "تخمینی مقدار") +
          "</p><b>" +
          (d.capacity && d.value !== null && d.type === "water"
            ? num((d.capacity * d.value) / 100) + " L"
            : "—") +
          '</b></div></div><div class="tank-alert ' +
          (d.value !== null && d.value <= d.threshold ? "low" : "") +
          '">' +
          icon(
            d.value !== null && d.value <= d.threshold ? "warning" : "check",
          ) +
          tr(
            d.value === null
              ? "بانتظار أول قراءة"
              : d.value <= d.threshold
                ? "أقل من حد التنبيه " + d.threshold + "%"
                : "أعلى من حد التنبيه " + d.threshold + "%",
            d.value === null
              ? "پہلی ریڈنگ کا انتظار"
              : d.value <= d.threshold
                ? "اطلاع کی حد " + d.threshold + "% سے کم"
                : "اطلاع کی حد " + d.threshold + "% سے زیادہ",
          ) +
          '</div><div class="tank-last"><span>' +
          tr("آخر قراءة: ", "آخری ریڈنگ: ") +
          (d.value === null ? "—" : date(d.updatedAt)) +
          "</span><span>" +
          tr(
            readings.length + " قراءات محفوظة",
            readings.length + " محفوظ ریڈنگ",
          ) +
          "</span></div>" +
          (late
            ? '<p class="stale-reading">' +
              tr(
                "مر أكثر من ٢٤ ساعة على آخر فحص يدوي.",
                "آخری دستی جانچ کو ۲۴ گھنٹے سے زیادہ ہو گئے۔",
              ) +
              "</p>"
            : "") +
          '<div class="tank-buttons">' +
          btn(
            tr("تحديث المستوى", "سطح بدلیں"),
            "reading",
            "plus",
            'data-id="' + d.id + '"',
          ) +
          opButton(
            tr("السجل", "تاریخ"),
            "sensorDetail",
            "chart",
            d.id,
            "secondary",
          ) +
          "</div></article>"
        );
      })
      .join("") +
    '</div><section class="panel" style="margin-top:25px"><div class="panel-head"><div><h2>' +
    tr("مخزون العلف", "چارے کا ذخیرہ") +
    "</h2><p>" +
    tr(
      "كل توريد وصرف يترك أثرًا في السجل.",
      "ہر آمد اور استعمال ریکارڈ میں محفوظ ہوتا ہے۔",
    ) +
    "</p></div>" +
    btn(tr("صنف جديد", "نیا سامان"), "stock", "plus", "", "secondary") +
    '</div><div class="table-wrap"><table><thead><tr>' +
    [
      tr("الصنف", "سامان"),
      tr("المتاح", "موجود"),
      tr("حد التنبيه", "اطلاع کی حد"),
      tr("الحالة", "حالت"),
      tr("الإجراء", "عمل"),
    ]
      .map((x) => "<th>" + x + "</th>")
      .join("") +
    "</tr></thead><tbody>" +
    state.stock
      .map(
        (s) =>
          '<tr><td><div class="animal-cell"><span class="stat-icon">' +
          icon("feed") +
          "</span>" +
          esc(deviceText(s)) +
          '</div></td><td class="num">' +
          num(s.qty) +
          " " +
          unit(s.unit) +
          "</td><td>" +
          s.min +
          " " +
          unit(s.unit) +
          '</td><td><span class="tag ' +
          (s.qty <= s.min ? "amber" : "") +
          '">' +
          tr(
            s.qty <= s.min ? "يحتاج توريد" : "متوفر",
            s.qty <= s.min ? "مزید سامان چاہیے" : "موجود",
          ) +
          "</span></td><td>" +
          opButton(
            tr("توريد / صرف", "آمد / استعمال"),
            "stockMove",
            "plus",
            s.id,
            "secondary",
          ) +
          "</td></tr>",
      )
      .join("") +
    "</tbody></table></div>" +
    (state.stock.length
      ? ""
      : '<div class="empty">' +
        tr("ابدأ بإضافة الأصناف والكميات.", "سامان اور مقدار درج کریں۔") +
        "</div>") +
    "</section>" +
    panel(
      tr("آخر حركات المخزون", "ذخیرے کی تازہ حرکت"),
      tr("الكميات مشتقة من حركاتك المسجلة", "مقدار آپ کے درج شدہ عمل سے"),
      '<div class="panel-body">' +
        (state.ops.movements.length
          ? state.ops.movements
              .slice(-8)
              .reverse()
              .map(
                (m) =>
                  '<div class="metric-line"><span><span class="tag ' +
                  (m.direction === "out" ? "amber" : "") +
                  '">' +
                  tr(
                    m.direction === "in" ? "توريد" : "صرف",
                    m.direction === "in" ? "آمد" : "استعمال",
                  ) +
                  "</span> " +
                  esc(m.name) +
                  '<small class="muted"> · ' +
                  date(m.at) +
                  "</small></span><b>" +
                  (m.direction === "out" ? "−" : "+") +
                  m.qty +
                  " " +
                  unit(m.unit) +
                  "</b></div>",
              )
              .join("")
          : '<div class="empty">' +
            tr(
              "ستظهر هنا حركات التوريد والصرف بعد تسجيلها.",
              "آمد اور استعمال درج کرنے کے بعد یہاں نظر آئے گا۔",
            ) +
            "</div>") +
        "</div>",
    )
  );
}
function sensorDetail(id) {
  const d = state.devices.find((d) => d.id === id);
  if (!d) return;
  const records = state.ops.readings.filter((r) => r.deviceId === id);
  openDialog(
    esc(deviceText(d)),
    '<div class="telemetry-status"><span>' +
      tr(
        "قراءات يدوية محفوظة • ليست بثًا مباشرًا",
        "محفوظ دستی ریڈنگ • لائیو ڈیٹا نہیں",
      ) +
      "</span></div>" +
      (records.length > 1
        ? weightChart(records.map((r) => ({ at: r.at, kg: r.value })))
        : '<p class="hint">' +
          tr(
            "سجّل قراءتين لعرض منحنى التغير.",
            "تبدیلی کا منحنی دیکھنے کے لیے دو ریڈنگ درج کریں۔",
          ) +
          "</p>") +
      '<div class="reading-list">' +
      records
        .slice()
        .reverse()
        .map(
          (r) =>
            '<div class="metric-line"><span>' +
            date(r.at) +
            ' <small class="muted">' +
            new Date(r.at).toLocaleTimeString(
              lang === "ur" ? "ur-PK" : "ar-AE",
              { hour: "2-digit", minute: "2-digit" },
            ) +
            "</small></span><b>" +
            r.value +
            "%</b></div>",
        )
        .join("") +
      '</div><p class="hint">' +
      tr(
        "لا يُستنتج استهلاك يومي من نقطتين دون ضبط أوقات التعبئة والتفريغ.",
        "بھرنے اور خالی کرنے کا وقت معلوم کیے بغیر صرف دو ریڈنگ سے روزانہ استعمال نہیں نکالا جاتا۔",
      ) +
      "</p>",
  );
}
function sensorConfig(id) {
  const d = state.devices.find((d) => d.id === id);
  if (!d) return;
  openDialog(
    tr("إعداد نقطة المتابعة", "نگرانی کی جگہ کی ترتیب"),
    opsForm(
      "sensorConfig",
      input("deviceId", "hidden", id) +
        field(
          tr("رقم الجهاز / العلامة (اختياري)", "آلے کا نمبر (اختیاری)"),
          input("deviceCode", "text", d.deviceCode || "", 'maxlength="80"'),
          true,
        ) +
        field(
          tr("تنبيه أقل من %", "اطلاع کی حد %"),
          input(
            "threshold",
            "number",
            d.threshold,
            'required min="0" max="100"',
          ),
        ) +
        field(
          tr("سعة الخزان باللتر (للماء فقط)", "ٹینک کی گنجائش لیٹر (صرف پانی)"),
          input(
            "capacity",
            "number",
            d.capacity || "",
            'min="1" max="10000000"',
          ),
        ),
      tr(
        "السعة تحوّل النسبة إلى كمية تقديرية فقط. تسجيل رقم الجهاز لا يوصله تلقائيًا.",
        "گنجائش سے فیصد کو تخمینی مقدار میں بدلا جاتا ہے۔ نمبر درج کرنے سے آلہ خودکار منسلک نہیں ہوتا۔",
      ),
    ),
  );
}
function stockMove(id) {
  const s = state.stock.find((s) => s.id === id);
  if (!s) return;
  openDialog(
    tr("حركة مخزون • ", "ذخیرے کی حرکت • ") + esc(deviceText(s)),
    opsForm(
      "stockMove",
      input("stockId", "hidden", id) +
        field(
          tr("نوع الحركة", "عمل کی قسم"),
          select("direction", [
            ["in", tr("توريد / إضافة", "آمد / اضافہ")],
            ["out", tr("صرف / استهلاك", "استعمال")],
          ]),
        ) +
        field(
          tr("الكمية • " + unit(s.unit), "مقدار • " + unit(s.unit)),
          input("qty", "number", "", 'required min="0.1" step="0.1"'),
        ) +
        field(
          tr("سبب الحركة أو ملاحظتها", "وجہ یا مشاہدہ"),
          input("note", "text", "", 'required maxlength="200"'),
          true,
        ),
      tr("المتوفر حاليًا: ", "اس وقت موجود: ") + s.qty + " " + unit(s.unit),
    ),
  );
}
