"use strict";
// 3zbh: offline-first workspace. No simulated reading is presented as a live sensor.
const KEY = "3zbh-workspace-v3";
let lang =
  location.hash === "#field"
    ? localStorage.getItem("3zbh-field-language") || "ur"
    : localStorage.getItem("3zbh-language") === "ur"
      ? "ur"
      : "ar";
const $ = (s) => document.querySelector(s);
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const tr = (ar, ur) => (lang === "ur" ? ur : ar);
const uid = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(16).slice(2);
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
const date = (d) =>
  new Date(d).toLocaleDateString(lang === "ur" ? "ur-PK" : "ar-AE", {
    day: "numeric",
    month: "short",
  });
const stamp = () => new Date().toISOString();
const paths = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  leaf: "M20 3C9 2 3 7 5 14c2 7 14 8 15-11ZM4 21 15 10",
  sheep:
    "M7 8a3 3 0 0 1 5-3 3 3 0 0 1 5 3c4 0 5 6 2 8H6c-5-2-3-8 1-8ZM7 16v5m9-5v5M19 9l3-1v5h-3M8 8v3",
  drop: "M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13ZM8 15c0 2 1 3 3 4",
  feed: "M4 20h16L18 7H6L4 20ZM8 7V3h8v4M9 12h6m-6 4h6",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  check: "m5 12 4 4L19 6",
  tasks: "M8 5h12v16H4V5h4m0-2h8v5H8zM8 13h8m-8 4h5",
  map: "m3 5 6-3 6 3 6-3v17l-6 3-6-3-6 3V5Zm6-3v17m6-14v17",
  chart: "M4 3v18h17M8 16v-4m5 4V8m5 8V5",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m14-13a4 4 0 1 1 0 8M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2",
  plus: "M12 5v14M5 12h14",
  arrow: "M19 12H5m6-6-6 6 6 6",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4",
  search: "M21 21l-5-5M18 10a8 8 0 1 0-16 0 8 8 0 0 0 16 0",
  close: "M6 6l12 12M6 18 18 6",
  camera: "M3 6h5l2-3h4l2 3h5v15H3V6Zm13 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0",
  warning: "M12 3 2 21h20L12 3Zm0 6v5m0 3v1",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  building: "M4 21V7l8-5 8 5v14H4Zm5 0v-7h6v7M8 8h1m6 0h1",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Zm-5 0a3 3 0 1 0-6 0 3 3 0 0 0 6 0",
  clock: "M12 8v5l3 2M22 12a10 10 0 1 0-20 0 10 10 0 0 0 20 0",
  wallet: "M3 5h17v16H3V5Zm0 0V3h14v2m3 7h-6v5h6",
};
const icon = (n) =>
  '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="' +
  (paths[n] || paths.leaf) +
  '"/></svg>';
const animalsIcon = (k) =>
  ({ sheep: "🐑", chicken: "🐔", camel: "🐪" })[k] || "🐑";
const kind = (k) =>
  ({
    sheep: tr("الغنم", "بھیڑیں"),
    chicken: tr("الدجاج", "مرغیاں"),
    camel: tr("الإبل", "اونٹ"),
  })[k] || k;
const sex = (k) => (k === "male" ? tr("ذكر", "نر") : tr("أنثى", "مادہ"));
const statusName = (s) =>
  ({
    healthy: tr("بصحة جيدة", "صحت مند"),
    watch: tr("تحت الملاحظة", "نگرانی ضروری"),
    treatment: tr("تحت العلاج", "علاج جاری"),
  })[s] || s;
const breedName = (b) =>
  ({
    ardi: tr("عارضي", "عارضی"),
    harri: tr("حري", "حری"),
    local: tr("بلدي", "دیسی"),
    camel: tr("محلي", "مقامی"),
  })[b] || b;
const facilityData = [
  [
    "water",
    "drop",
    "خزانات الماء الرئيسية",
    "مرکزی پانی کے ٹینک",
    "الشمال الغربي، بجانب الحظائر",
    "شمال مغرب، باڑوں کے پاس",
  ],
  [
    "sheep",
    "sheep",
    "حظائر الغنم • ١، ٢، ٣",
    "بھیڑوں کے باڑے • ۱، ۲، ۳",
    "ثلاث حظائر متجاورة حسب خريطتك",
    "آپ کے نقشے کے مطابق تین باڑے",
  ],
  [
    "chicken",
    "building",
    "حظيرة الدجاج",
    "مرغیوں کا باڑا",
    "المبنى الطويل شمال الحظائر",
    "باڑوں کے شمال میں لمبی عمارت",
  ],
  [
    "kitchen",
    "building",
    "المطبخ والكراج",
    "باورچی خانہ اور گیراج",
    "شمال المبنى الرئيسي",
    "مرکزی عمارت کے شمال میں",
  ],
  [
    "trees",
    "leaf",
    "النخل والأشجار",
    "کھجور اور درخت",
    "حزام الأشجار بين الحلال والمبنى",
    "باڑوں اور عمارت کے درمیان",
  ],
  [
    "house",
    "building",
    "المبنى الرئيسي والغرف",
    "مرکزی عمارت اور کمرے",
    "المجلس وغرف الإقامة",
    "مجلس اور رہائشی کمرے",
  ],
  [
    "family",
    "users",
    "جلسة العائلة والألعاب",
    "خاندانی بیٹھک اور کھیل",
    "شرق المبنى الرئيسي",
    "مرکزی عمارت کے مشرق میں",
  ],
  [
    "majlis",
    "building",
    "مجلس الرجال",
    "مردوں کی مجلس",
    "الجهة الغربية من العزبة",
    "باڑے کی مغربی جانب",
  ],
  [
    "cleanwater",
    "drop",
    "خزان الماء النظيف",
    "صاف پانی کا ٹینک",
    "الزاوية الشمالية الشرقية",
    "شمال مشرقی کونا",
  ],
];
function seed() {
  const animals = Array.from({ length: 37 }, (_, i) => ({
    id: uid(),
    tag:
      (i < 24 ? "SH-" : i < 36 ? "CH-" : "CM-") +
      String(i + 1).padStart(3, "0"),
    kind: i < 24 ? "sheep" : i < 36 ? "chicken" : "camel",
    breed: i < 24 ? (i % 3 ? "ardi" : "harri") : i < 36 ? "local" : "camel",
    name:
      { 0: "بركة", 1: "وضحى", 2: "شاهين", 3: "مزون", 36: "الشاهينية" }[i] || "",
    sex: i % 4 === 2 ? "male" : "female",
    birth: new Date(2023 + (i % 3), i % 12, 12).toISOString().slice(0, 10),
    weight: i < 24 ? 35 + (i % 18) : i < 36 ? 1.8 : 430,
    status: i === 3 ? "watch" : i === 8 ? "treatment" : "healthy",
    notes: "",
    createdAt: stamp(),
  }));
  return {
    version: 3,
    demo: true,
    farmName: "عزبة محمد الجابري",
    location: "",
    role: "owner",
    animals,
    tasks: [
      {
        id: uid(),
        ar: "تعبئة المشارب وفحص الماء",
        ur: "پانی پلانے کے برتن بھریں اور چیک کریں",
        time: "07:00",
        done: true,
      },
      {
        id: uid(),
        ar: "توزيع العلف الصباحي",
        ur: "صبح کا چارہ تقسیم کریں",
        time: "07:30",
        done: true,
      },
      {
        id: uid(),
        ar: "جمع البيض وتسجيل العدد",
        ur: "انڈے جمع کریں اور تعداد لکھیں",
        time: "09:00",
        done: true,
      },
      {
        id: uid(),
        ar: "فحص الحلال وتسجيل ملاحظة",
        ur: "جانوروں کو چیک کریں اور رپورٹ لکھیں",
        time: "10:00",
        done: false,
      },
      {
        id: uid(),
        ar: "تنظيف الحظائر",
        ur: "باڑوں کی صفائی کریں",
        time: "16:00",
        done: false,
      },
      {
        id: uid(),
        ar: "ري النخل والأشجار",
        ur: "کھجوروں اور درختوں کو پانی دیں",
        time: "17:00",
        done: false,
      },
    ],
    devices: [
      {
        id: uid(),
        name: "الخزان الرئيسي",
        ur: "مرکزی ٹینک",
        type: "water",
        value: 78,
        threshold: 25,
        unit: "%",
        source: "demo",
        updatedAt: stamp(),
      },
      {
        id: uid(),
        name: "خزان الماء النظيف",
        ur: "صاف پانی کا ٹینک",
        type: "water",
        value: 62,
        threshold: 25,
        unit: "%",
        source: "demo",
        updatedAt: stamp(),
      },
      {
        id: uid(),
        name: "مخزون الشعير",
        ur: "جو کا ذخیرہ",
        type: "feed",
        value: 23,
        threshold: 30,
        unit: "%",
        source: "demo",
        updatedAt: stamp(),
      },
    ],
    stock: [
      { id: uid(), name: "شعير", ur: "جو", qty: 240, unit: "kg", min: 80 },
      { id: uid(), name: "برسيم", ur: "برسیم", qty: 18, unit: "bale", min: 5 },
      {
        id: uid(),
        name: "علف الدجاج",
        ur: "مرغیوں کا دانہ",
        qty: 45,
        unit: "kg",
        min: 50,
      },
    ],
    activity: [
      {
        id: uid(),
        ar: "اكتمل توزيع العلف الصباحي",
        ur: "صبح کا چارہ تقسیم ہو گیا",
        type: "feed",
        at: stamp(),
      },
      {
        id: uid(),
        ar: "تسجيل ٨ بيضات في الجولة الصباحية",
        ur: "صبح کے وقت ۸ انڈے درج ہوئے",
        type: "check",
        at: stamp(),
      },
    ],
    health: [],
    expenses: [],
    taskDay: today(),
  };
}
let state;
let storageWarning = false;
try {
  const raw = localStorage.getItem(KEY);
  state = raw ? JSON.parse(raw) : seed();
  if (state.version !== 3 || !Array.isArray(state.animals)) throw Error();
} catch {
  state = seed();
  storageWarning = true;
}
let route = location.hash.slice(1) || "overview",
  filter = "all",
  search = "";
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    toast(
      tr(
        "المساحة ممتلئة. صدّر نسخة احتياطية قبل المتابعة.",
        "جگہ بھر گئی ہے۔ پہلے بیک اپ محفوظ کریں۔",
      ),
    );
    return false;
  }
}
function addActivity(ar, ur, type = "check", photo = "") {
  state.activity.unshift({ id: uid(), ar, ur, type, photo, at: stamp() });
}
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(
    () => $("#toast").classList.remove("show"),
    3400,
  );
}
function saveAndRender() {
  if (persist()) {
    render();
    toast(tr("تم الحفظ على هذا الجهاز", "اس آلے پر محفوظ ہو گیا"));
  }
}
function age(b) {
  if (!b) return tr("غير مسجل", "درج نہیں");
  const months = Math.max(
    0,
    Math.floor((Date.now() - new Date(b)) / 2629800000),
  );
  return months < 12
    ? months + " " + tr("شهر", "ماہ")
    : (months / 12).toFixed(1) + " " + tr("سنة", "سال");
}
const num = (n) =>
  new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(n);
const taskText = (x) => (lang === "ur" ? x.ur || x.ar : x.ar);
const deviceText = (x) => (lang === "ur" ? x.ur || x.name : x.name);
function panel(title, sub, body, link = "") {
  return (
    '<section class="panel"><div class="panel-head"><div><h2>' +
    title +
    "</h2><p>" +
    sub +
    "</p></div>" +
    link +
    "</div>" +
    body +
    "</section>"
  );
}
function btn(text, action, ico = "plus", extra = "", cls = "") {
  return (
    '<button type="button" class="btn ' +
    cls +
    '" data-action="' +
    action +
    '" ' +
    extra +
    ">" +
    icon(ico) +
    text +
    "</button>"
  );
}
function navLink(page, ar, ur, ico) {
  return (
    '<a href="#' +
    page +
    '" class="' +
    (route === page ? "active" : "") +
    '">' +
    icon(ico) +
    "<span>" +
    tr(ar, ur) +
    "</span>" +
    (page === "animals"
      ? '<span class="count">' + state.animals.length + "</span>"
      : "") +
    "</a>"
  );
}
function title(ar, ur, sub, actions = "") {
  return (
    '<div class="page-title"><div><div class="eyebrow">3ZBH / YOUR FARM, IN FOCUS</div><h1>' +
    tr(ar, ur) +
    '</h1><p class="subtitle">' +
    sub +
    '</p></div><div class="title-actions">' +
    actions +
    "</div></div>"
  );
}
function shell() {
  document.documentElement.lang = lang;
  document.title = "3zbh — " + tr("عزبتك، قدامك", "آپ کا باڑا، آپ کے سامنے");
  $("#sidebar").innerHTML =
    '<div class="brand"><div class="brand-mark">' +
    icon("leaf") +
    '</div><div><div class="brand-name">3zbh<span style="color:#b9d38d">.</span></div><small>' +
    tr("عزبتك، قدامك", "آپ کا باڑا، آپ کے سامنے") +
    '</small></div></div><div class="farm-switch">' +
    icon("building") +
    "<div><b>" +
    esc(state.farmName) +
    "</b><small>" +
    tr("مساحة العزبة الخاصة", "باڑے کی اپنی جگہ") +
    '</small></div></div><p class="nav-label">' +
    tr("مساحة العمل", "کام کی جگہ") +
    '</p><nav class="nav">' +
    navLink("overview", "نظرة عامة", "جائزہ", "grid") +
    navLink("animals", "سجل الحلال", "جانور", "sheep") +
    navLink("sensors", "الماء والعلف", "پانی اور چارہ", "drop") +
    navLink("tasks", "المهام والتحديثات", "کام اور رپورٹس", "tasks") +
    navLink("map", "خريطة العزبة", "نقشہ", "map") +
    navLink("health", "الصحة والرعاية", "صحت اور دیکھ بھال", "heart") +
    navLink("reports", "التقارير والمصاريف", "رپورٹس اور اخراجات", "chart") +
    navLink("worker", "مركز العامل", "مزدور کا مرکز", "users") +
    navLink("settings", "الإعدادات", "ترتیبات", "settings") +
    '</nav><div class="sidebar-bottom"><button class="switch-role" data-action="worker">' +
    icon("users") +
    "<span>" +
    tr("افتح واجهة العامل", "مزدور کی سکرین کھولیں") +
    "</span>" +
    icon("arrow") +
    '</button><p class="sidebar-note">' +
    tr(
      "كل التفاصيل في مكان واحد.<br>مصمّم للعزبة وأهلها.",
      "سب تفصیلات ایک جگہ۔<br>باڑے اور اس کے لوگوں کے لیے۔",
    ) +
    "</p></div>";
  $("#topbar").innerHTML =
    '<span class="mobile-logo">3zbh.</span><div class="crumb">' +
    tr("مساحة العمل", "کام کی جگہ") +
    " &nbsp; / &nbsp; <strong>" +
    tr("عزبتنا", "ہمارا باڑا") +
    '</strong></div><div class="top-actions"><span class="top-date">' +
    new Date().toLocaleDateString(lang === "ur" ? "ur-PK" : "ar-AE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Asia/Dubai",
    }) +
    '</span><button class="language" data-action="language" aria-label="تغيير اللغة / زبان بدلیں">' +
    (lang === "ar" ? "اردو" : "العربية") +
    '</button><button class="icon-btn" data-action="notifications" aria-label="' +
    tr("التنبيهات", "اطلاعات") +
    '">' +
    icon("bell") +
    '</button><button class="icon-btn" data-action="settings" aria-label="' +
    tr("الإعدادات", "ترتیبات") +
    '">' +
    icon("settings") +
    '</button><span class="avatar">' +
    tr("ع", "ع") +
    "</span></div>";
  $("#footer").innerHTML =
    "<span>3zbh © " +
    new Date().getFullYear() +
    " · " +
    tr("صُنعت للعزبة", "باڑے کے لیے بنایا گیا") +
    "</span><span>" +
    tr("حفظ محلي • آخر حفظ", "مقامی محفوظ • آخری محفوظ") +
    " " +
    new Date().toLocaleTimeString(lang === "ur" ? "ur-PK" : "ar-AE", {
      hour: "2-digit",
      minute: "2-digit",
    }) +
    "</span>";
}
function banner() {
  return (
    '<div class="demo-banner">' +
    icon("leaf") +
    "<span>" +
    tr(
      state.demo
        ? "مساحة تجريبية ببيانات توضيحية. تغييراتك محفوظة على هذا المتصفح فقط."
        : "مساحة محلية. بياناتك محفوظة على هذا المتصفح فقط؛ الأجهزة الأخرى لا تتزامن بعد.",
      state.demo
        ? "نمونہ ڈیٹا۔ آپ کی تبدیلیاں صرف اس براؤزر میں محفوظ ہیں۔"
        : "مقامی جگہ۔ ڈیٹا اسی براؤزر میں محفوظ ہے؛ دوسرے آلات سے ابھی منسلک نہیں۔",
    ) +
    '</span><button data-action="settings">' +
    tr("إدارة البيانات", "ڈیٹا کا انتظام") +
    "</button></div>"
  );
}
function stat(ico, value, label, foot, tag) {
  return (
    '<article class="stat" role="link" tabindex="0" data-action="navigate" data-id="' +
    ({ sheep: "animals", tasks: "tasks", drop: "sensors", heart: "health" }[
      ico
    ] || "overview") +
    '"><div class="stat-head"><span class="stat-icon">' +
    icon(ico) +
    '</span><span class="tag">' +
    tag +
    '</span></div><div class="stat-value">' +
    value +
    '</div><p class="stat-label">' +
    label +
    '</p><p class="stat-foot">' +
    foot +
    "</p></article>"
  );
}
function farmSvg(hero = false) {
  const trees = Array.from(
    { length: 14 },
    (_, i) =>
      '<g transform="translate(' +
      (105 + i * 29) +
      ',225)"><circle r="10" fill="#77985a"/><circle cx="-4" cy="-3" r="6" fill="#8ba568"/><path d="M0 4v10" stroke="#6f7951" stroke-width="2"/></g>',
  ).join("");
  const spots = [
    ["water", 65, 72, 55, 70, "water"],
    ["sheep", 150, 125, 195, 65, "sheep"],
    ["chicken", 142, 60, 210, 48, "chicken"],
    ["kitchen", 415, 105, 85, 55, "building"],
    ["trees", 105, 211, 415, 35, "leaf"],
    ["house", 410, 285, 105, 90, "building"],
    ["family", 535, 276, 85, 73, "users"],
    ["majlis", 80, 330, 86, 65, "building"],
    ["cleanwater", 620, 45, 45, 65, "drop"],
  ];
  const names = {
    water: tr("الماء الرئيسي", "پانی"),
    sheep: tr("حظائر الغنم", "بھیڑیں"),
    chicken: tr("الدجاج", "مرغیاں"),
    kitchen: tr("مطبخ / كراج", "باورچی خانہ"),
    trees: tr("النخل والأشجار", "درخت"),
    house: tr("المبنى الرئيسي", "مرکزی عمارت"),
    family: tr("جلسة العائلة", "خاندانی بیٹھک"),
    majlis: tr("المجلس", "مجلس"),
    cleanwater: tr("ماء نظيف", "صاف پانی"),
  };
  return (
    '<svg class="farm-map" viewBox="0 0 750 480" role="group" aria-label="' +
    tr(
      "مخطط العزبة حسب الصورة المرفقة",
      "فراہم کردہ تصویر کے مطابق باڑے کا نقشہ",
    ) +
    '"><defs><pattern id="dots' +
    (hero ? "H" : "M") +
    '" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="' +
    (hero ? "#afc08120" : "#a7b29238") +
    '"/></pattern></defs><rect width="750" height="480" fill="' +
    (hero ? "#325c40" : "#eeefdf") +
    '"/><rect width="750" height="480" fill="url(#dots' +
    (hero ? "H" : "M") +
    ')"/><path d="M40 40 690 20 710 430 55 455Z" fill="none" stroke="' +
    (hero ? "#a2b37a" : "#bac7a1") +
    '" stroke-width="3"/><path d="M70 275Q240 280 380 255L570 230M380 255 380 420" fill="none" stroke="' +
    (hero ? "#8ca16c" : "#d4d9bf") +
    '" stroke-width="22"/>' +
    spots
      .filter((s) => s[0] !== "trees")
      .map(
        ([id, x, y, w, h]) =>
          '<g class="map-point" data-action="facility" data-id="' +
          id +
          '" tabindex="0" role="button" aria-label="' +
          names[id] +
          '"><rect x="' +
          x +
          '" y="' +
          y +
          '" width="' +
          w +
          '" height="' +
          h +
          '" rx="7" fill="' +
          (hero ? "#b5c297" : "#fffdf2") +
          '" stroke="' +
          (hero ? "#ced5b5" : "#b8c4a1") +
          '" stroke-width="2"/>' +
          (id === "sheep"
            ? '<path d="M215 128v60m65-60v60" stroke="#bbc69c" stroke-width="2"/>'
            : "") +
          '<text x="' +
          (x + w / 2) +
          '" y="' +
          (y + h + 17) +
          '" fill="' +
          (hero ? "#d5dfbd" : "#66775b") +
          '" text-anchor="middle" font-size="11">' +
          names[id] +
          "</text></g>",
      )
      .join("") +
    trees +
    '<g transform="translate(674 370)" fill="none" stroke="' +
    (hero ? "#c3d3ad" : "#819474") +
    '" stroke-width="1.4"><path d="M0 27V0l-6 12M0 0l6 12"/><text x="0" y="44" fill="' +
    (hero ? "#c3d3ad" : "#819474") +
    '" stroke="none" font-family="Inter" font-size="10" text-anchor="middle">N</text></g><path d="M290 447h50" stroke="' +
    (hero ? "#325c40" : "#eeefdf") +
    '" stroke-width="6"/><text x="315" y="468" text-anchor="middle" fill="' +
    (hero ? "#bccda4" : "#819474") +
    '" font-size="11">' +
    tr("المدخل", "داخلی راستہ") +
    "</text></svg>"
  );
}
function taskList() {
  return (
    '<div class="panel-body">' +
    state.tasks
      .map(
        (t) =>
          '<label class="task ' +
          (t.done ? "done" : "") +
          '"><input type="checkbox" data-task="' +
          t.id +
          '" ' +
          (t.done ? "checked" : "") +
          '><span class="task-text">' +
          esc(taskText(t)) +
          '</span><small class="num">' +
          esc(t.time) +
          "</small></label>",
      )
      .join("") +
    "</div>"
  );
}
function sensorsList() {
  return (
    '<div class="panel-body">' +
    state.devices
      .map(
        (d) =>
          '<div class="sensor-row"><div class="sensor-circle ' +
          (d.type === "feed" ? "feed" : "") +
          '">' +
          icon(d.type === "feed" ? "feed" : "drop") +
          '</div><div class="sensor-name">' +
          esc(deviceText(d)) +
          "<small>" +
          (d.value === null
            ? tr("لم تُسجّل قراءة بعد", "ابھی ریڈنگ درج نہیں")
            : tr(
                d.source === "demo"
                  ? "قراءة توضيحية • جهاز غير مربوط"
                  : "إدخال يدوي • " + date(d.updatedAt),
                d.source === "demo"
                  ? "نمونہ • آلہ منسلک نہیں"
                  : "دستی اندراج • " + date(d.updatedAt),
              )) +
          '</small></div><div class="sensor-meter"><strong>' +
          (d.value === null ? "—" : num(d.value)) +
          '<small>%</small></strong><div class="meter ' +
          (d.value <= d.threshold ? "warn" : "") +
          '"><i style="width:' +
          (d.value ?? 0) +
          '%"></i></div></div></div>',
      )
      .join("") +
    "</div>"
  );
}
function animalTable(list) {
  return (
    '<div class="table-wrap"><table><thead><tr>' +
    [
      tr("الحيوان", "جانور"),
      tr("النوع / السلالة", "قسم / نسل"),
      tr("الجنس", "جنس"),
      tr("العمر", "عمر"),
      tr("الحالة الصحية", "صحت"),
      tr("الملف", "فائل"),
    ]
      .map((h) => "<th>" + h + "</th>")
      .join("") +
    "</tr></thead><tbody>" +
    list
      .map(
        (a) =>
          '<tr><td><div class="animal-cell"><span class="animal-avatar">' +
          animalsIcon(a.kind) +
          "</span><div>" +
          esc(a.name || tr("بدون اسم", "بے نام")) +
          "<small>" +
          esc(a.tag) +
          "</small></div></div></td><td>" +
          kind(a.kind) +
          " · " +
          esc(breedName(a.breed)) +
          "</td><td>" +
          sex(a.sex) +
          "</td><td>" +
          age(a.birth) +
          '</td><td><span class="tag ' +
          (a.status !== "healthy" ? "amber" : "") +
          '"><span class="health-dot ' +
          (a.status !== "healthy" ? "warn" : "") +
          '"></span>' +
          statusName(a.status) +
          '</span></td><td><button class="panel-link" data-action="animalDetail" data-id="' +
          a.id +
          '">' +
          tr("عرض الملف", "فائل دیکھیں") +
          " ←</button></td></tr>",
      )
      .join("") +
    "</tbody></table></div>" +
    (list.length
      ? ""
      : '<div class="empty">' +
        tr(
          "لا توجد نتائج. جرّب البحث أو أضف أول حيوان.",
          "کوئی نتیجہ نہیں۔ تلاش کریں یا پہلا جانور شامل کریں۔",
        ) +
        "</div>")
  );
}
function activities(limit = 5) {
  return (
    '<div class="panel-body">' +
    (state.activity.length
      ? state.activity
          .slice(0, limit)
          .map(
            (a) =>
              '<div class="activity-item"><span class="activity-icon">' +
              icon(a.type) +
              "</span><div><p>" +
              esc(lang === "ur" ? a.ur || a.ar : a.ar) +
              "</p><small>" +
              date(a.at) +
              " · " +
              new Date(a.at).toLocaleTimeString(
                lang === "ur" ? "ur-PK" : "ar-AE",
                { hour: "2-digit", minute: "2-digit" },
              ) +
              "</small>" +
              (a.photo
                ? '<img class="activity-photo" src="' +
                  esc(a.photo) +
                  '" alt="' +
                  tr("صورة تقرير العامل", "مزدور کی رپورٹ کی تصویر") +
                  '">'
                : "") +
              "</div></div>",
          )
          .join("")
      : '<p class="empty">' +
        tr("بانتظار أول تحديث منك", "آپ کی پہلی رپورٹ کا انتظار ہے") +
        "</p>") +
    "</div>"
  );
}
function overview() {
  const done = state.tasks.filter((t) => t.done).length,
    watch = state.animals.filter((a) => a.status !== "healthy").length;
  return (
    title(
      "كل العزبة، بنظرة واحدة.",
      "پورا باڑا، ایک نظر میں۔",
      tr(
        "أهلًا علي، تابع الحلال والعامل وتفاصيل يومك من مكان واحد.",
        "علی، جانوروں، مزدور اور آج کے کاموں کو ایک جگہ دیکھیں۔",
      ),
      btn(
        tr("تصدير التقرير", "رپورٹ محفوظ کریں"),
        "report",
        "download",
        "",
        "secondary",
      ) + btn(tr("تحديث اليوم", "آج کی رپورٹ"), "update", "plus"),
    ) +
    banner() +
    '<section class="hero"><div class="hero-copy"><div class="eyebrow">A LITTLE CLOSER TO YOUR FARM</div><h2>' +
    tr(
      "أقرب لعزبتك.<br>حتى وأنت بعيد.",
      "اپنے باڑے کے قریب۔<br>چاہے آپ دور ہوں۔",
    ) +
    "</h2><p>" +
    tr(
      "الحلال، الماء، العلف، وكل شغل اليوم.<br>تفاصيل واضحة تساعدك تعرف وين تحتاج تتدخل.",
      "جانور، پانی، چارہ اور روز کے کام۔<br>واضح تفصیلات، تاکہ ضروری کام فوراً نظر آئیں۔",
    ) +
    '</p><div class="hero-foot"><a class="btn lime" href="#map">' +
    tr("استكشف العزبة", "باڑے کا نقشہ دیکھیں") +
    icon("arrow") +
    "</a><small>" +
    tr("مخطط مبني على عزبتكم", "آپ کے باڑے پر مبنی نقشہ") +
    '</small></div></div><div class="hero-art">' +
    farmSvg(true) +
    '<span class="map-caption">3ZBH / FARM LAYOUT</span></div></section>' +
    '<section class="stats">' +
    stat(
      "sheep",
      num(state.animals.length),
      tr("إجمالي الحلال", "کل جانور"),
      num(state.animals.filter((a) => a.kind === "sheep").length) +
        " " +
        kind("sheep") +
        " · " +
        num(state.animals.filter((a) => a.kind === "chicken").length) +
        " " +
        kind("chicken"),
      tr("سجل العزبة", "ریکارڈ"),
    ) +
    stat(
      "tasks",
      done + "<small> / " + state.tasks.length + "</small>",
      tr("مهام اليوم المنجزة", "آج کے مکمل کام"),
      tr(
        "باقي " + (state.tasks.length - done) + " مهام في الجولة",
        "باقی " + (state.tasks.length - done) + " کام",
      ),
      tr("متابعة يومية", "روزانہ"),
    ) +
    stat(
      "drop",
      state.devices.length,
      tr("نقاط متابعة الماء والعلف", "پانی اور چارے کی نگرانی"),
      tr(
        "٠ أجهزة متصلة • قراءات يدوية / تجريبية",
        "۰ منسلک آلات • دستی / نمونہ ریڈنگ",
      ),
      tr("تجهيز الحساسات", "سینسر کی تیاری"),
    ) +
    stat(
      "heart",
      watch,
      tr("حالات تحتاج متابعة", "نگرانی والے جانور"),
      tr(
        "حسب السجل • ليس تشخيصًا آليًا",
        "ریکارڈ کے مطابق • خودکار تشخیص نہیں",
      ),
      tr("الرعاية الصحية", "صحت"),
    ) +
    "</section>" +
    '<div class="grid-main">' +
    panel(
      tr("الماء والعلف", "پانی اور چارہ"),
      tr(
        "مستويات مسجلة، مع تنبيه عند انخفاض المخزون",
        "درج شدہ سطحیں، کم ذخیرے کی اطلاع",
      ),
      sensorsList(),
      '<a class="panel-link" href="#sensors">' +
        tr("كل التفاصيل", "تفصیل") +
        " ←</a>",
    ) +
    panel(
      tr("شغل اليوم", "آج کے کام"),
      tr("قائمة واضحة للعامل، ومتابعة أسهل لك", "مزدور کے کام، آپ کی نگرانی"),
      taskList(),
      '<div class="progress"><i style="width:' +
        ((done / state.tasks.length) * 100 || 0) +
        '%"></i></div>',
    ) +
    "</div>" +
    '<div class="grid-main">' +
    panel(
      tr("الحلال في العزبة", "باڑے کے جانور"),
      tr(
        "لكل حيوان اسم، رقم وملف رعاية",
        "ہر جانور کا نام، نمبر اور دیکھ بھال کا ریکارڈ",
      ),
      animalTable(state.animals.slice(0, 4)) +
        '<div class="table-footer"><span>' +
        tr("عرض ٤ من ", "۴ میں سے ") +
        state.animals.length +
        '</span><a href="#animals">' +
        tr("فتح سجل الحلال", "جانوروں کا ریکارڈ کھولیں") +
        " ←</a></div>",
    ) +
    panel(
      tr("من قلب العزبة", "باڑے کی خبریں"),
      tr("آخر التقارير والتحديثات", "تازہ رپورٹس"),
      activities(4),
      '<a class="panel-link" href="#tasks">' + tr("الكل", "سب") + " ←</a>",
    ) +
    "</div>"
  );
}
function animalsPage() {
  return (
    title(
      "الحلال، واحد واحد.",
      "ہر جانور، اپنی پہچان۔",
      tr(
        "سجل موحّد للأسماء والسلالات والأعمار والرعاية.",
        "نام، نسل، عمر اور دیکھ بھال کا مکمل ریکارڈ۔",
      ),
      btn(tr("إضافة حيوان", "جانور شامل کریں"), "animal"),
    ) +
    banner() +
    '<div class="toolbar"><div class="search">' +
    icon("search") +
    '<input id="animalSearch" placeholder="' +
    tr("ابحث بالاسم أو الرقم أو السلالة…", "نام، نمبر یا نسل تلاش کریں…") +
    '" value="' +
    esc(search) +
    '" aria-label="' +
    tr("البحث في الحلال", "جانور تلاش کریں") +
    '"></div><div class="filters">' +
    ["all", "sheep", "chicken", "camel"]
      .map(
        (k) =>
          '<button class="filter ' +
          (filter === k ? "active" : "") +
          '" data-action="filter" data-id="' +
          k +
          '">' +
          (k === "all" ? tr("الكل", "سب") : kind(k)) +
          "</button>",
      )
      .join("") +
    '</div></div><section class="panel"><div id="animalResults">' +
    filteredAnimals() +
    "</div></section>"
  );
}
function filteredAnimals() {
  const q = search.toLowerCase();
  return animalTable(
    state.animals.filter(
      (a) =>
        (filter === "all" || a.kind === filter) &&
        [a.name, a.tag, breedName(a.breed), kind(a.kind)]
          .join(" ")
          .toLowerCase()
          .includes(q),
    ),
  );
}
function sensorsPage() {
  return (
    title(
      "كل قطرة، وكل وجبة.",
      "ہر قطرہ، ہر خوراک۔",
      tr(
        "المتابعة اليدوية متاحة الآن. الربط الآلي يحتاج أجهزة وبوابة اتصال فعلية.",
        "دستی اندراج دستیاب ہے۔ خودکار رابطے کے لیے اصل آلات اور گیٹ وے درکار ہیں۔",
      ),
      btn(tr("تسجيل قراءة", "ریڈنگ درج کریں"), "reading", "drop"),
    ) +
    banner() +
    '<div class="sensor-cards">' +
    state.devices
      .map(
        (d) =>
          '<article class="device-card"><div class="row" style="justify-content:space-between"><span class="stat-icon">' +
          icon(d.type === "feed" ? "feed" : "drop") +
          '</span><span class="pill offline">' +
          tr(
            d.source === "demo" ? "تجريبي" : "يدوي",
            d.source === "demo" ? "نمونہ" : "دستی",
          ) +
          "</span></div><h3>" +
          esc(deviceText(d)) +
          '</h3><div class="device-value">' +
          (d.value === null ? "—" : d.value) +
          '<small>%</small></div><div class="meter ' +
          (d.value <= d.threshold ? "warn" : "") +
          '"><i style="width:' +
          (d.value ?? 0) +
          '%"></i></div><p>' +
          tr("حد التنبيه: ", "اطلاع کی حد: ") +
          d.threshold +
          "% · " +
          tr("آخر قراءة: ", "آخری ریڈنگ: ") +
          (d.value === null ? tr("غير مسجلة", "درج نہیں") : date(d.updatedAt)) +
          "</p>" +
          btn(
            tr("تحديث القراءة", "ریڈنگ بدلیں"),
            "reading",
            "plus",
            'data-id="' + d.id + '"',
            "secondary",
          ) +
          "</article>",
      )
      .join("") +
    '</div><div style="height:22px"></div>' +
    panel(
      tr("مخزون الأعلاف", "چارے کا ذخیرہ"),
      tr(
        "سجّل الشراء والاستهلاك لتبقى الكميات واضحة",
        "خرید اور استعمال درج کریں تاکہ مقدار واضح رہے",
      ),
      '<div class="panel-body">' +
        state.stock
          .map(
            (s) =>
              '<div class="sensor-row"><span class="sensor-circle feed">' +
              icon("feed") +
              '</span><div class="sensor-name">' +
              esc(deviceText(s)) +
              "<small>" +
              tr("تنبيه أقل من ", "اطلاع کی حد ") +
              s.min +
              " " +
              unit(s.unit) +
              '</small></div><span class="num" style="margin-inline-start:auto">' +
              s.qty +
              " " +
              unit(s.unit) +
              '</span><button class="panel-link" data-action="stock" data-id="' +
              s.id +
              '">' +
              tr("تعديل", "تبدیل") +
              "</button></div>",
          )
          .join("") +
        "</div>",
      btn(tr("صنف جديد", "نیا سامان"), "stock", "plus", "", "secondary"),
    ) +
    '<div class="hint">' +
    tr(
      "للتجهيز الفعلي: قياس مستوى الخزان، وزن أو مستوى العلف، وحرارة / رطوبة الحظائر. الحساس لا يشخّص مرض الحيوان؛ سجّل الملاحظات واستعن بالبيطري.",
      "اصل نظام: ٹینک کی سطح، چارے کا وزن یا سطح، اور باڑے کا درجہ حرارت / نمی۔ سینسر بیماری کی تشخیص نہیں کرتا؛ مشاہدات درج کریں اور ویٹرنری ڈاکٹر سے رجوع کریں۔",
    ) +
    "</div>"
  );
}
function unit(u) {
  return (
    { kg: tr("كجم", "کلو"), bale: tr("ربطة", "گٹھا"), bag: tr("كيس", "بوری") }[
      u
    ] || u
  );
}
function tasksPage() {
  return (
    title(
      "يوم مرتب. عزبة مرتاحة.",
      "منظم دن، بہتر باڑا۔",
      tr(
        "المهام تتجدد كل يوم؛ التقارير تبقى في السجل.",
        "روز کے کام دوبارہ شروع ہوتے ہیں؛ رپورٹس ریکارڈ میں رہتی ہیں۔",
      ),
      btn(tr("مهمة جديدة", "نیا کام"), "task") +
        btn(tr("تقرير مصوّر", "تصویری رپورٹ"), "update", "camera"),
    ) +
    banner() +
    '<div class="grid-main">' +
    panel(tr("قائمة اليوم", "آج کی فہرست"), today(), taskList()) +
    panel(
      tr("تقارير العامل", "مزدور کی رپورٹس"),
      tr(
        "الملاحظة والصورة والتوقيت في سجل واحد",
        "مشاہدہ، تصویر اور وقت ایک ریکارڈ میں",
      ),
      activities(30),
    ) +
    "</div>"
  );
}
function mapPage() {
  return (
    title(
      "عزبتكم، على الخريطة.",
      "آپ کا باڑا، نقشے پر۔",
      tr(
        "توزيع تقريبي للمرافق مستند إلى الصورة التي أرسلتها. اضغط على أي مبنى.",
        "آپ کی تصویر کے مطابق سہولتوں کا تخمینی نقشہ۔ کسی عمارت پر کلک کریں۔",
      ),
      btn(tr("تحديد الموقع", "مقام درج کریں"), "location", "pin"),
    ) +
    '<div class="panel" style="margin-bottom:22px"><div class="map-frame">' +
    farmSvg() +
    '<span class="map-note">' +
    tr(
      "مخطط توضيحي • ليس قياسًا مساحيًا أو موقع GPS",
      "خاکہ • پیمائش یا GPS مقام نہیں",
    ) +
    '</span></div><div class="map-legend"><span>● ' +
    tr("الحلال والحظائر", "جانوروں کے باڑے") +
    "</span><span>● " +
    tr("المرافق والمباني", "عمارتیں") +
    "</span><span>● " +
    tr("الماء والأشجار", "پانی اور درخت") +
    '</span></div></div><div class="facility-grid">' +
    facilityData
      .map(
        (f) =>
          '<article class="facility">' +
          icon(f[1]) +
          "<h3>" +
          tr(f[2], f[3]) +
          "</h3><p>" +
          tr(f[4], f[5]) +
          '</p><button class="panel-link" data-action="facility" data-id="' +
          f[0] +
          '">' +
          tr("فتح التفاصيل", "تفصیل کھولیں") +
          " ←</button></article>",
      )
      .join("") +
    "</div>"
  );
}
function healthPage() {
  const watch = state.animals.filter((a) => a.status !== "healthy");
  return (
    title(
      "الرعاية تبدأ بالملاحظة.",
      "دیکھ بھال مشاہدے سے شروع ہوتی ہے۔",
      tr(
        "سجل العلاجات والمواعيد والولادات، بدون تخمين الحالة الصحية.",
        "علاج، موعد اور پیدائش کا ریکارڈ؛ صحت کے بارے میں اندازہ نہیں۔",
      ),
      btn(tr("تسجيل حدث صحي", "صحت کا واقعہ درج کریں"), "health", "heart"),
    ) +
    banner() +
    '<div class="alert">' +
    icon("heart") +
    "<div><p>" +
    tr(
      "السجل يساعدك تتابع، والطبيب البيطري يشخّص ويحدد العلاج.",
      "ریکارڈ نگرانی کے لیے ہے؛ تشخیص اور علاج ویٹرنری ڈاکٹر کرتا ہے۔",
    ) +
    "</p><small>" +
    tr(
      "لا توجد مراقبة صحية آلية أو أجهزة متصلة في هذه النسخة.",
      "اس ورژن میں صحت کی خودکار نگرانی یا منسلک آلات نہیں ہیں۔",
    ) +
    "</small></div></div>" +
    panel(
      tr("تحتاج اهتمامك", "آپ کی توجہ ضروری ہے"),
      tr("حالات مسجلة للملاحظة أو العلاج", "نگرانی یا علاج کے لیے درج جانور"),
      animalTable(watch),
    ) +
    '<div style="height:20px"></div>' +
    panel(
      tr("سجل الرعاية", "دیکھ بھال کا ریکارڈ"),
      tr(
        "العلاجات والولادات والتطعيمات والمواعيد",
        "علاج، پیدائش، ویکسین اور موعد",
      ),
      '<div class="panel-body">' +
        (state.health.length
          ? state.health
              .map(
                (h) =>
                  '<div class="activity-item"><span class="activity-icon">' +
                  icon("heart") +
                  "</span><div><p>" +
                  esc(
                    {
                      check: tr("فحص", "جانچ"),
                      treatment: tr("علاج", "علاج"),
                      vaccination: tr("تطعيم", "ویکسین"),
                      birth: tr("ولادة", "پیدائش"),
                    }[h.type] || h.type,
                  ) +
                  " · " +
                  esc(
                    state.animals.find((a) => a.id === h.animalId)?.name ||
                      state.animals.find((a) => a.id === h.animalId)?.tag ||
                      "—",
                  ) +
                  "</p><p>" +
                  esc(h.note) +
                  "</p><small>" +
                  date(h.at) +
                  (h.due
                    ? " · " + tr("موعد المتابعة: ", "اگلی جانچ: ") + date(h.due)
                    : "") +
                  "</small></div></div>",
              )
              .join("")
          : '<p class="empty">' +
            tr(
              "سجّل أول متابعة صحية من الزر أعلاه.",
              "اوپر کے بٹن سے صحت کا پہلا واقعہ درج کریں۔",
            ) +
            "</p>") +
        "</div>",
    )
  );
}
function reportsPage() {
  let total = state.expenses.reduce((s, e) => s + e.amount, 0);
  const cats = ["feed", "vet", "maintenance", "other"];
  return (
    title(
      "اعرف وين تصرف.",
      "اخراجات واضح دیکھیں۔",
      tr(
        "تقرير من سجلاتك الفعلية، قابل للطباعة والتصدير.",
        "آپ کے درج کردہ ریکارڈ کی رپورٹ، پرنٹ اور محفوظ کریں۔",
      ),
      btn(
        tr("تصدير البيانات", "ڈیٹا محفوظ کریں"),
        "export",
        "download",
        "",
        "secondary",
      ) + btn(tr("تسجيل مصروف", "خرچ درج کریں"), "expense", "wallet"),
    ) +
    banner() +
    '<div class="health-grid">' +
    panel(
      tr("المصروفات المسجلة", "درج شدہ اخراجات"),
      tr("درهم إماراتي • كل الفترات", "اماراتی درہم • تمام مدت"),
      '<div class="expenses-total">' +
        num(total) +
        ' <small style="font-size:13px">AED</small></div><div class="panel-body">' +
        cats
          .map(
            (c) =>
              '<div class="metric-line"><span>' +
              expenseLabel(c) +
              "</span><b>" +
              num(
                state.expenses
                  .filter((e) => e.category === c)
                  .reduce((s, e) => s + e.amount, 0),
              ) +
              "</b></div>",
          )
          .join("") +
        "</div>",
    ) +
    panel(
      tr("توزيع الحلال", "جانوروں کی تقسیم"),
      tr("مستخرج من سجل الحيوانات", "جانوروں کے ریکارڈ سے"),
      '<div class="panel-body"><div class="report-bars">' +
        ["sheep", "chicken", "camel"]
          .map((k) => {
            const n = state.animals.filter((a) => a.kind === k).length;
            return (
              '<div style="height:' +
              Math.max(5, (n / Math.max(1, state.animals.length)) * 130) +
              'px"><b>' +
              n +
              "</b><span>" +
              kind(k) +
              "</span></div>"
            );
          })
          .join("") +
        '</div><div style="height:30px"></div><div class="metric-line"><span>' +
        tr("الإناث / الذكور", "مادہ / نر") +
        "</span><b>" +
        state.animals.filter((a) => a.sex === "female").length +
        " / " +
        state.animals.filter((a) => a.sex === "male").length +
        "</b></div></div>",
    ) +
    '</div><div style="height:20px"></div>' +
    panel(
      tr("تفاصيل المصروفات", "اخراجات کی تفصیل"),
      tr(
        "يمكن تصدير التقرير كنسخة احتياطية",
        "رپورٹ کا بیک اپ محفوظ کیا جا سکتا ہے",
      ),
      '<div class="panel-body">' +
        (state.expenses.length
          ? state.expenses
              .map(
                (e) =>
                  '<div class="metric-line"><span>' +
                  esc(e.note) +
                  '<small class="muted"> · ' +
                  date(e.at) +
                  "</small></span><b>" +
                  num(e.amount) +
                  " AED</b></div>",
              )
              .join("")
          : '<div class="empty">' +
            tr(
              "لا توجد مصاريف مسجلة حتى الآن.",
              "ابھی کوئی خرچ درج نہیں ہوا۔",
            ) +
            "</div>") +
        "</div>",
    )
  );
}
function expenseLabel(c) {
  return {
    feed: tr("الأعلاف", "چارہ"),
    vet: tr("البيطري والأدوية", "ڈاکٹر اور دوائی"),
    maintenance: tr("الصيانة والمرافق", "مرمت"),
    other: tr("أخرى", "دیگر"),
  }[c];
}
function workerPage() {
  return (
    title(
      "مركز العامل",
      "مزدور کی سکرین",
      tr(
        "أزرار واضحة، خطوات أقل، وتقرير يصل لسجل العزبة.",
        "واضح بٹن، آسان مراحل، رپورٹ باڑے کے ریکارڈ میں۔",
      ),
      btn(
        tr("العربية / اردو", "اردو / العربية"),
        "language",
        "users",
        "",
        "secondary",
      ),
    ) +
    banner() +
    '<div class="worker-welcome"><h2>' +
    tr("هلا فيك، نبدأ جولة اليوم؟", "آج کے کام شروع کریں؟") +
    "</h2><p>" +
    tr(
      "صوّر، سجّل، وعلّم على المهام المنجزة.",
      "تصویر لیں، ریکارڈ لکھیں، اور مکمل کام پر نشان لگائیں۔",
    ) +
    '</p></div><div class="worker-grid"><div>' +
    [
      [
        "update",
        "camera",
        "تحديث بصورة",
        "تصویر کے ساتھ رپورٹ",
        "حالة الحلال وملاحظة الجولة",
        "جانوروں کی حالت اور مشاہدات",
      ],
      [
        "animal",
        "sheep",
        "أضف حيوانًا",
        "جانور شامل کریں",
        "الاسم والرقم والنوع والعمر",
        "نام، نمبر، قسم اور عمر",
      ],
      [
        "reading",
        "drop",
        "سجّل الماء والعلف",
        "پانی اور چارہ درج کریں",
        "تحديث المستوى بعد الفحص",
        "جانچ کے بعد سطح درج کریں",
      ],
      [
        "health",
        "heart",
        "بلّغ عن حالة صحية",
        "صحت کا مسئلہ بتائیں",
        "الملاحظة والموعد القادم",
        "مشاہدہ اور اگلی جانچ",
      ],
    ]
      .map(
        (x) =>
          '<button class="worker-action" data-action="' +
          x[0] +
          '">' +
          icon(x[1]) +
          "<span><strong>" +
          tr(x[2], x[3]) +
          "</strong><small>" +
          tr(x[4], x[5]) +
          "</small></span>" +
          icon("arrow") +
          "</button>",
      )
      .join("") +
    "</div>" +
    panel(
      tr("مهامك اليوم", "آج کے کام"),
      tr("اضغط عند إتمام كل مهمة", "کام مکمل ہونے پر نشان لگائیں"),
      taskList(),
    ) +
    "</div>"
  );
}
function settingsPage() {
  return (
    title(
      "مساحة على مقاس عزبتك.",
      "آپ کے باڑے کے مطابق۔",
      tr("البيانات والموقع والنسخ الاحتياطي.", "ڈیٹا، مقام اور بیک اپ۔"),
    ) +
    '<div class="filters" style="margin-bottom:20px">' +
    [
      ["health", "الصحة", "صحت"],
      ["reports", "المصاريف والتقارير", "اخراجات اور رپورٹس"],
      ["worker", "واجهة العامل", "مزدور کی سکرین"],
    ]
      .map(
        (x) =>
          '<a class="filter" href="#' + x[0] + '">' + tr(x[1], x[2]) + "</a>",
      )
      .join("") +
    '</div><section class="settings-card"><h2>' +
    tr("بيانات العزبة", "باڑے کی معلومات") +
    "</h2><p>" +
    esc(state.farmName) +
    "<br>" +
    tr("الموقع: ", "مقام: ") +
    esc(
      state.location ||
        tr(
          "لم تُضف إحداثيات بعد. المخطط مأخوذ من صورتك.",
          "ابھی GPS مقام درج نہیں۔ نقشہ آپ کی تصویر پر مبنی ہے۔",
        ),
    ) +
    "</p>" +
    btn(
      tr("تعديل البيانات والموقع", "معلومات اور مقام بدلیں"),
      "location",
      "pin",
      "",
      "secondary",
    ) +
    '</section><section class="settings-card"><h2>' +
    tr("بياناتك تحت يدك", "آپ کا ڈیٹا، آپ کے پاس") +
    "</h2><p>" +
    tr(
      "هذه النسخة تعمل دون حساب. البيانات والصور محفوظة في المتصفح، ولا تنتقل تلقائيًا بين الجوالات. صدّر نسخة قبل تغيير الجهاز أو مسح بيانات المتصفح.",
      "یہ ورژن اکاؤنٹ کے بغیر کام کرتا ہے۔ ڈیٹا اور تصاویر اسی براؤزر میں ہیں، دوسرے فون سے خودکار رابطہ نہیں۔ آلہ بدلنے یا براؤزر صاف کرنے سے پہلے بیک اپ لیں۔",
    ) +
    '</p><div class="row" style="flex-wrap:wrap">' +
    btn(tr("تنزيل نسخة احتياطية", "بیک اپ ڈاؤن لوڈ"), "export", "download") +
    btn(
      tr("استيراد نسخة", "بیک اپ بحال کریں"),
      "import",
      "download",
      "",
      "secondary",
    ) +
    btn(
      tr("بدء سجل فارغ", "خالی ریکارڈ شروع کریں"),
      "fresh",
      "plus",
      "",
      "danger",
    ) +
    '</div></section><section class="settings-card"><h2>' +
    tr("الحساسات والربط المشترك", "سینسر اور مشترکہ رابطہ") +
    "</h2><p>" +
    tr(
      "المتاح: تسجيل القراءات وحدود التنبيه، تقارير مصوّرة وسجل صحي. الربط الحقيقي يحتاج حساسات وخدمة استقبال بيانات، ومشاركة الجوالات تحتاج قاعدة بيانات بصلاحيات عضوية. لن تظهر قراءة على أنها مباشرة قبل ربط جهاز فعلي.",
      "دستی ریڈنگ، اطلاع کی حد، تصویری رپورٹ اور صحت کا ریکارڈ دستیاب ہے۔ اصل سینسر کے لیے آلات اور ڈیٹا سروس، جبکہ فون ملانے کے لیے محفوظ ڈیٹا بیس درکار ہے۔ اصل آلے کے بغیر کوئی ریڈنگ لائیو نہیں کہلائے گی۔",
    ) +
    '</p><a href="#worker" class="btn secondary">' +
    tr("جرب واجهة العامل", "مزدور کی سکرین آزمائیں") +
    "</a></section>"
  );
}
function render() {
  ensureOperations();
  document.body.classList.toggle("field-mode", route === "field");
  if (state.taskDay !== today()) {
    state.tasks.forEach((t) => (t.done = false));
    state.taskDay = today();
    persist();
  }
  shell();
  if (route.startsWith("animal/")) {
    document.querySelector("#main").innerHTML = animalPassport(route.slice(7));
    return;
  }
  if (route === "worker" && document.querySelector("#workerPhone")) {
    refreshWorkerHub();
    return;
  }
  const pages = {
    overview: commandOverview,
    animals: animalsPage,
    sensors: sensorWorkbench,
    tasks: tasksPage,
    map: mapPage,
    health: healthPage,
    reports: reportsPage,
    worker: workerHub,
    field: fieldPage,
    settings: settingsPage,
  };
  if (!pages[route]) route = "overview";
  $("#main").innerHTML = pages[route]();
}
function openDialog(title, body) {
  $("#dialogContent").innerHTML =
    '<div class="dialog-head"><h2>' +
    title +
    '</h2><button class="icon-btn" data-action="close" aria-label="' +
    tr("إغلاق", "بند کریں") +
    '">' +
    icon("close") +
    '</button></div><div class="dialog-body">' +
    body +
    "</div>";
  if (!$("#dialog").open) $("#dialog").showModal();
}
function options(list, sel) {
  return list
    .map(
      ([v, l]) =>
        '<option value="' +
        esc(v) +
        '" ' +
        (v === sel ? "selected" : "") +
        ">" +
        esc(l) +
        "</option>",
    )
    .join("");
}
function field(label, control, full = false) {
  return (
    '<label class="field ' +
    (full ? "full" : "") +
    '">' +
    label +
    control +
    "</label>"
  );
}
function input(name, type = "text", value = "", attrs = "") {
  return (
    '<input name="' +
    name +
    '" type="' +
    type +
    '" value="' +
    esc(value) +
    '" ' +
    attrs +
    ">"
  );
}
function select(name, list, val) {
  return '<select name="' + name + '">' + options(list, val) + "</select>";
}
function form(id, fields, hint = "") {
  return (
    '<form id="' +
    id +
    '"><div class="form-grid">' +
    fields +
    "</div>" +
    (hint ? '<p class="hint">' + hint + "</p>" : "") +
    '<p class="form-error" role="alert"></p><div class="dialog-actions">' +
    btn(tr("إلغاء", "منسوخ"), "close", "close", "", "secondary") +
    '<button class="btn" type="submit">' +
    icon("check") +
    tr("حفظ", "محفوظ کریں") +
    "</button></div></form>"
  );
}
function animalForm(id) {
  const a = state.animals.find((a) => a.id === id) || {};
  openDialog(
    tr(
      a.id ? "تعديل ملف الحيوان" : "إضافة حيوان",
      a.id ? "جانور کی فائل بدلیں" : "جانور شامل کریں",
    ),
    form(
      "animalForm",
      input("id", "hidden", a.id || "") +
        field(
          tr("الاسم (اختياري)", "نام (اختیاری)"),
          input("name", "text", a.name, 'maxlength="80"'),
        ) +
        field(
          tr("رقم العلامة", "شناختی نمبر"),
          input("tag", "text", a.tag || "", 'required maxlength="40"'),
        ) +
        field(
          tr("النوع", "قسم"),
          select(
            "kind",
            ["sheep", "chicken", "camel"].map((k) => [k, kind(k)]),
            a.kind || "sheep",
          ),
        ) +
        field(
          tr("السلالة", "نسل"),
          select(
            "breed",
            ["ardi", "harri", "local", "camel"].map((k) => [k, breedName(k)]),
            a.breed || "ardi",
          ),
        ) +
        field(
          tr("الجنس", "جنس"),
          select(
            "sex",
            [
              ["female", sex("female")],
              ["male", sex("male")],
            ],
            a.sex || "female",
          ),
        ) +
        field(
          tr("تاريخ الميلاد التقريبي", "تخمینی تاریخ پیدائش"),
          input("birth", "date", a.birth || "", 'max="' + today() + '"'),
        ) +
        field(
          tr("الوزن بالكيلو (اختياري)", "وزن کلو (اختیاری)"),
          input(
            "weight",
            "number",
            a.weight ?? "",
            'min="0" max="2000" step="0.1"',
          ),
        ) +
        field(
          tr("الحالة الصحية", "صحت"),
          select(
            "status",
            ["healthy", "watch", "treatment"].map((k) => [k, statusName(k)]),
            a.status || "healthy",
          ),
        ) +
        field(
          tr("ملاحظات", "مشاہدات"),
          '<textarea name="notes" maxlength="2000">' +
            esc(a.notes || "") +
            "</textarea>",
          true,
        ),
    ),
  );
}
function animalDetail(id) {
  const a = state.animals.find((a) => a.id === id);
  if (!a) return;
  openDialog(
    tr("ملف الحيوان", "جانور کی فائل"),
    '<div class="detail-hero"><span class="animal-avatar">' +
      animalsIcon(a.kind) +
      "</span><div><h2>" +
      esc(a.name || a.tag) +
      '</h2><p class="subtitle">' +
      esc(a.tag) +
      " · " +
      kind(a.kind) +
      " / " +
      breedName(a.breed) +
      '</p></div></div><div class="detail-grid">' +
      [
        [tr("العمر", "عمر"), age(a.birth)],
        [tr("الجنس", "جنس"), sex(a.sex)],
        [tr("الصحة", "صحت"), statusName(a.status)],
        [tr("الوزن", "وزن"), a.weight ? a.weight + " kg" : "—"],
      ]
        .map(([l, v]) => "<div><small>" + l + "</small>" + esc(v) + "</div>")
        .join("") +
      '</div><p class="hint">' +
      esc(a.notes || tr("لا توجد ملاحظات إضافية", "کوئی اضافی مشاہدہ نہیں")) +
      '</p><div class="row">' +
      opButton(
        tr("الملف الكامل", "مکمل فائل"),
        "passport",
        "sheep",
        id,
        "secondary",
      ) +
      btn(
        tr("تعديل الملف", "فائل بدلیں"),
        "animal",
        "plus",
        'data-id="' + id + '"',
      ) +
      btn(
        tr("حدث صحي", "صحت کا واقعہ"),
        "health",
        "heart",
        'data-id="' + id + '"',
        "secondary",
      ) +
      btn(
        tr("إزالة من السجل", "ریکارڈ سے ہٹائیں"),
        "remove",
        "close",
        'data-id="' + id + '"',
        "danger",
      ) +
      "</div>",
  );
}
function updateForm() {
  openDialog(
    tr("تحديث من قلب العزبة", "باڑے کی رپورٹ"),
    form(
      "updateForm",
      field(
        tr("حالة الجولة", "معائنے کی حالت"),
        select("condition", [
          [tr("كل شيء بخير", "سب ٹھیک ہے"), tr("كل شيء بخير", "سب ٹھیک ہے")],
          [
            tr("يحتاج متابعة", "نگرانی ضروری"),
            tr("يحتاج متابعة", "نگرانی ضروری"),
          ],
          [
            tr("نقص الماء أو العلف", "پانی یا چارہ کم ہے"),
            tr("نقص الماء أو العلف", "پانی یا چارہ کم ہے"),
          ],
        ]),
        true,
      ) +
        field(
          tr("الملاحظة", "مشاہدہ"),
          '<textarea name="note" required maxlength="2000" placeholder="' +
            tr("وش لاحظت في الجولة؟", "آپ نے کیا دیکھا؟") +
            '"></textarea>',
          true,
        ) +
        field(
          tr(
            "صورة (اختيارية، حتى ١٠ ميجابايت)",
            "تصویر (اختیاری، ۱۰ ایم بی تک)",
          ),
          '<input name="photo" type="file" accept="image/*"><img id="preview" class="file-preview" alt="' +
            tr("معاينة الصورة", "تصویر کا جائزہ") +
            '" hidden>',
          true,
        ),
      tr(
        "تُصغّر الصورة وتحفظ محليًا مع التقرير.",
        "تصویر چھوٹی کرکے رپورٹ کے ساتھ مقامی طور پر محفوظ ہوتی ہے۔",
      ),
    ),
  );
}
function readingForm(id) {
  openDialog(
    tr("تسجيل مستوى الماء أو العلف", "پانی یا چارے کی سطح درج کریں"),
    form(
      "readingForm",
      field(
        tr("نقطة المتابعة", "نگرانی کی جگہ"),
        select(
          "id",
          state.devices.map((d) => [d.id, deviceText(d)]),
          id,
        ),
        true,
      ) +
        field(
          tr("المستوى المتبقي %", "باقی سطح %"),
          input("value", "number", "", 'required min="0" max="100" step="1"'),
        ) +
        field(
          tr("تنبيه تحت %", "اطلاع کی حد %"),
          input(
            "threshold",
            "number",
            state.devices.find((d) => d.id === id)?.threshold ?? 25,
            'required min="0" max="100"',
          ),
        ),
      tr(
        "هذه قراءة يدوية بعد فحص الخزان أو المخزون.",
        "ٹینک یا ذخیرہ چیک کرنے کے بعد دستی ریڈنگ ہے۔",
      ),
    ),
  );
}
function stockForm(id) {
  const s = state.stock.find((s) => s.id === id) || {};
  openDialog(
    tr("تسجيل مخزون", "ذخیرہ درج کریں"),
    form(
      "stockForm",
      input("id", "hidden", s.id || "") +
        field(
          tr("الصنف", "سامان"),
          input("name", "text", s.name, 'required maxlength="80"'),
        ) +
        field(
          tr("الاسم بالأوردو (اختياري)", "اردو نام (اختیاری)"),
          input("ur", "text", s.ur, 'maxlength="80"'),
        ) +
        field(
          tr("الكمية", "مقدار"),
          input("qty", "number", s.qty ?? "", 'required min="0" step="0.1"'),
        ) +
        field(
          tr("الوحدة", "اکائی"),
          select(
            "unit",
            ["kg", "bale", "bag"].map((k) => [k, unit(k)]),
            s.unit || "kg",
          ),
        ) +
        field(
          tr("الحد الأدنى للتنبيه", "کم ذخیرے کی اطلاع"),
          input("min", "number", s.min ?? 10, 'min="0" step="0.1"'),
          true,
        ),
    ),
  );
}
function healthForm(id) {
  if (!state.animals.length) {
    toast(tr("أضف حيوانًا أولًا", "پہلے جانور شامل کریں"));
    return;
  }
  openDialog(
    tr("حدث صحي / ولادة", "صحت کا واقعہ / پیدائش"),
    form(
      "healthForm",
      field(
        tr("الحيوان", "جانور"),
        select(
          "animalId",
          state.animals.map((a) => [a.id, (a.name || a.tag) + " · " + a.tag]),
          id,
        ),
        true,
      ) +
        field(
          tr("نوع الحدث", "واقعے کی قسم"),
          select("type", [
            ["check", tr("فحص وملاحظة", "جانچ اور مشاہدہ")],
            ["treatment", tr("علاج / دواء", "علاج / دوائی")],
            ["vaccination", tr("تطعيم", "ویکسین")],
            ["birth", tr("ولادة", "پیدائش")],
          ]),
        ) +
        field(
          tr("الحالة الحالية", "موجودہ صحت"),
          select(
            "status",
            ["healthy", "watch", "treatment"].map((k) => [k, statusName(k)]),
          ),
        ) +
        field(
          tr("الملاحظات / تعليمات الطبيب", "مشاہدہ / ڈاکٹر کی ہدایات"),
          '<textarea name="note" required maxlength="2000"></textarea>',
          true,
        ) +
        field(
          tr("موعد المتابعة (اختياري)", "اگلی جانچ (اختیاری)"),
          input("due", "date", "", 'min="' + today() + '"'),
          true,
        ),
      tr(
        "تسجيل الولادة هنا لا يضيف مولودًا تلقائيًا؛ أضفه بملف مستقل.",
        "پیدائش کا واقعہ نیا جانور خود شامل نہیں کرتا؛ الگ فائل بنائیں۔",
      ),
    ),
  );
}
function taskForm() {
  openDialog(
    tr("مهمة جديدة", "نیا کام"),
    form(
      "taskForm",
      field(
        tr("وصف المهمة", "کام کی تفصیل"),
        input("ar", "text", "", 'required maxlength="200"'),
        true,
      ) +
        field(
          tr("الوصف بالأوردو", "اردو تفصیل"),
          input("ur", "text", "", 'maxlength="200"'),
          true,
        ) +
        field(tr("الوقت", "وقت"), input("time", "time", "08:00"), true),
    ),
  );
}
function expenseForm() {
  openDialog(
    tr("تسجيل مصروف", "خرچ درج کریں"),
    form(
      "expenseForm",
      field(
        tr("التصنيف", "قسم"),
        select(
          "category",
          ["feed", "vet", "maintenance", "other"].map((c) => [
            c,
            expenseLabel(c),
          ]),
        ),
      ) +
        field(
          tr("المبلغ بالدرهم", "رقم درہم"),
          input(
            "amount",
            "number",
            "",
            'required min="0.01" max="10000000" step="0.01"',
          ),
        ) +
        field(
          tr("الوصف", "تفصیل"),
          input("note", "text", "", 'required maxlength="200"'),
          true,
        ),
    ),
  );
}
function locationForm() {
  openDialog(
    tr("بيانات العزبة والموقع", "باڑے کا نام اور مقام"),
    form(
      "locationForm",
      field(
        tr("اسم العزبة", "باڑے کا نام"),
        input("farmName", "text", state.farmName, 'required maxlength="100"'),
        true,
      ) +
        field(
          tr("رابط Google Maps (اختياري)", "Google Maps لنک (اختیاری)"),
          input(
            "location",
            "url",
            state.location,
            'placeholder="https://maps.google.com/..."',
          ),
          true,
        ),
      tr(
        "الصورة لا تحتوي إحداثيات موثوقة؛ المخطط لا يحدد موقعًا جغرافيًا.",
        "تصویر سے درست GPS مقام معلوم نہیں ہوتا؛ خاکہ جغرافیائی مقام نہیں ہے۔",
      ),
    ),
  );
}
function facility(id) {
  const f = facilityData.find((f) => f[0] === id);
  if (!f) return;
  const locLink = state.location
    ? '<a class="btn secondary" target="_blank" rel="noopener noreferrer" href="' +
      esc(state.location) +
      '">' +
      tr("الموقع المحفوظ", "محفوظ مقام") +
      "</a>"
    : "";
  openDialog(
    tr(f[2], f[3]),
    '<div class="detail-hero"><span class="stat-icon">' +
      icon(f[1]) +
      "</span><p>" +
      tr(f[4], f[5]) +
      '</p></div><p class="hint">' +
      tr(
        "الموضع مستند إلى الصورة التي زودتنا بها، وليس إحداثيات ميدانية.",
        "مقام آپ کی فراہم کردہ تصویر پر مبنی ہے، GPS پیمائش نہیں۔",
      ) +
      '</p><div class="row">' +
      btn(tr("إضافة تقرير للمرفق", "جگہ کی رپورٹ"), "update", "camera") +
      locLink +
      "</div>",
  );
}
function notifications() {
  const low = state.devices.filter(
    (d) => d.value !== null && d.value <= d.threshold,
  );
  openDialog(
    tr("تحتاج انتباهك", "آپ کی توجہ ضروری ہے"),
    low
      .map(
        (d) =>
          '<div class="alert">' +
          icon("drop") +
          "<div><p>" +
          esc(deviceText(d)) +
          " • " +
          d.value +
          "%</p><small>" +
          tr("أقل من الحد المسجل. القراءة ", "درج کردہ حد سے کم۔ ریڈنگ ") +
          tr(
            d.source === "demo" ? "توضيحية." : "يدوية.",
            d.source === "demo" ? "نمونہ ہے۔" : "دستی ہے۔",
          ) +
          "</small></div></div>",
      )
      .join("") +
      state.stock
        .filter((s) => s.qty <= s.min)
        .map(
          (s) =>
            '<div class="alert">' +
            icon("feed") +
            "<p>" +
            esc(deviceText(s)) +
            " · " +
            s.qty +
            " " +
            unit(s.unit) +
            "</p></div>",
        )
        .join("") +
      '<p class="hint">' +
      tr(
        "هذه تنبيهات داخل التطبيق من سجلك؛ لا توجد إشعارات جوال خارج التطبيق بعد.",
        "یہ ریکارڈ کی ایپ کے اندر اطلاعات ہیں؛ فون کی باہر کی اطلاع ابھی نہیں۔",
      ) +
      "</p>",
  );
}
function download(content, name, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportData() {
  download(
    JSON.stringify(state, null, 2),
    "3zbh-backup-" + today() + ".json",
    "application/json",
  );
  toast(tr("تم تنزيل النسخة الاحتياطية", "بیک اپ ڈاؤن لوڈ ہو گیا"));
}
function exportReport() {
  const rows = state.animals
    .map(
      (a) =>
        "<tr><td>" +
        esc(a.tag) +
        "</td><td>" +
        esc(a.name || "—") +
        "</td><td>" +
        esc(kind(a.kind)) +
        "</td><td>" +
        esc(breedName(a.breed)) +
        "</td><td>" +
        esc(sex(a.sex)) +
        "</td><td>" +
        esc(age(a.birth)) +
        "</td><td>" +
        esc(statusName(a.status)) +
        "</td></tr>",
    )
    .join("");
  const html =
    '<!doctype html><html lang="' +
    lang +
    '" dir="rtl"><meta charset="utf-8"><title>3zbh — ' +
    esc(state.farmName) +
    "</title><style>body{font:14px Arial,sans-serif;color:#143e32;max-width:1000px;margin:40px auto;padding:24px}h1{font-size:32px}p{line-height:2;color:#68776b}table{width:100%;border-collapse:collapse;margin:25px 0}th,td{text-align:right;padding:12px;border-bottom:1px solid #e6eae2}th{background:#f1f5e8}small{color:#7b8980}@media print{body{margin:0;padding:0}}</style><h1>3zbh / " +
    esc(state.farmName) +
    "</h1><p>" +
    esc(date(stamp())) +
    " · " +
    tr("الحلال: ", "جانور: ") +
    state.animals.length +
    " · " +
    tr("مصروفات مسجلة: ", "درج شدہ اخراجات: ") +
    num(state.expenses.reduce((n, e) => n + e.amount, 0)) +
    " AED</p><small>" +
    tr(
      state.demo ? "تقرير بيانات تجريبية" : "تقرير السجل المحلي",
      state.demo ? "نمونہ ڈیٹا رپورٹ" : "مقامی ریکارڈ رپورٹ",
    ) +
    "</small><table><thead><tr>" +
    [
      tr("الرقم", "نمبر"),
      tr("الاسم", "نام"),
      tr("النوع", "قسم"),
      tr("السلالة", "نسل"),
      tr("الجنس", "جنس"),
      tr("العمر", "عمر"),
      tr("الصحة", "صحت"),
    ]
      .map((h) => "<th>" + h + "</th>")
      .join("") +
    "</tr></thead><tbody>" +
    rows +
    "</tbody></table><h2>" +
    tr("مصروفات العزبة", "باڑے کے اخراجات") +
    "</h2>" +
    state.expenses
      .map(
        (e) =>
          "<p>" +
          esc(e.note) +
          " · " +
          num(e.amount) +
          " AED · " +
          esc(date(e.at)) +
          "</p>",
      )
      .join("") +
    "<small>" +
    tr(
      "يمكن طباعة هذا الملف أو حفظه PDF من المتصفح.",
      "اس فائل کو براؤزر سے پرنٹ یا PDF محفوظ کر سکتے ہیں۔",
    ) +
    "</small></html>";
  download(html, "3zbh-report-" + today() + ".html", "text/html;charset=utf-8");
  toast(
    tr(
      "تم تنزيل تقرير قابل للفتح والطباعة",
      "کھولنے اور پرنٹ کرنے والی رپورٹ ڈاؤن لوڈ ہو گئی",
    ),
  );
}
function importForm() {
  openDialog(
    tr("استيراد نسخة احتياطية", "بیک اپ بحال کریں"),
    form(
      "importForm",
      field(
        tr("ملف نسخة 3zbh", "3zbh بیک اپ فائل"),
        '<input name="file" type="file" accept=".json,application/json" required>',
        true,
      ),
      tr(
        "سيتم استبدال السجل الحالي بعد التحقق من الملف. صدّر نسخة أولًا إن احتجتها.",
        "فائل کی جانچ کے بعد موجودہ ریکارڈ بدلے گا۔ ضرورت ہو تو پہلے بیک اپ لیں۔",
      ),
    ),
  );
}
function freshForm() {
  openDialog(
    tr("ابدأ بسجلات العزبة الحقيقية", "باڑے کا اصل ریکارڈ شروع کریں"),
    '<p class="hint">' +
      tr(
        "سيتم تنزيل نسخة احتياطية من سجلك الحالي أولًا، ثم تفريغ الحيوانات والتقارير والمصاريف. تبقى المرافق والمهام، وتصبح قراءات المتابعة صفرية يدوية إلى أن تدخلها.",
        "موجودہ ریکارڈ کا بیک اپ پہلے ڈاؤن لوڈ ہوگا۔ پھر جانور، رپورٹس اور اخراجات خالی ہوں گے۔ جگہیں اور کام رہیں گے، سطحیں صفر اور دستی ہو جائیں گی۔",
      ) +
      "</p>" +
      btn(
        tr("تنزيل نسخة وبدء سجل فارغ", "بیک اپ اور خالی ریکارڈ"),
        "confirmFresh",
        "download",
        "",
        "danger",
      ),
  );
}
async function photoData(file) {
  if (!file) return "";
  if (!file.type.startsWith("image/"))
    throw Error(tr("اختر ملف صورة", "تصویر کی فائل منتخب کریں"));
  if (file.size > 10 * 1024 * 1024)
    throw Error(tr("الصورة أكبر من ١٠ ميجابايت", "تصویر ۱۰ ایم بی سے بڑی ہے"));
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.72);
  } finally {
    URL.revokeObjectURL(url);
  }
}
const actions = {
  report: exportReport,
  navigate: (id) => {
    location.hash = id;
  },
  animal: animalForm,
  animalDetail,
  update: updateForm,
  reading: readingForm,
  stock: stockForm,
  health: healthForm,
  task: taskForm,
  expense: expenseForm,
  location: locationForm,
  facility,
  notifications,
  export: exportData,
  import: importForm,
  fresh: freshForm,
  close: () => $("#dialog").close(),
  language: () => {
    lang = lang === "ar" ? "ur" : "ar";
    localStorage.setItem(
      route === "field" ? "3zbh-field-language" : "3zbh-language",
      lang,
    );
    render();
  },
  worker: () => (location.hash = "worker"),
  settings: () => (location.hash = "settings"),
  filter: (id) => {
    filter = id;
    render();
  },
  remove: (id) => {
    const a = state.animals.find((a) => a.id === id);
    openDialog(
      tr("إزالة الحيوان", "جانور ہٹائیں"),
      '<p class="hint">' +
        tr("إزالة ", "ہٹائیں ") +
        esc(a?.name || a?.tag) +
        tr(
          " من السجل؟ يبقى سجل الرعاية محفوظًا.",
          "؟ دیکھ بھال کا ریکارڈ محفوظ رہے گا۔",
        ) +
        "</p>" +
        btn(
          tr("تأكيد الإزالة", "ہٹانے کی تصدیق"),
          "confirmRemove",
          "close",
          'data-id="' + id + '"',
          "danger",
        ),
    );
  },
  confirmRemove: (id) => {
    state.animals = state.animals.filter((a) => a.id !== id);
    addActivity(
      "تمت إزالة حيوان من السجل",
      "ریکارڈ سے جانور ہٹایا گیا",
      "sheep",
    );
    $("#dialog").close();
    saveAndRender();
  },
  confirmFresh: () => {
    exportData();
    state.demo = false;
    state.animals = [];
    state.activity = [];
    state.health = [];
    state.expenses = [];
    state.stock = [];
    state.ops = {
      version: 1,
      jobs: [],
      messages: [],
      events: [],
      worker: { name: "العامل", ur: "مزدور" },
    };
    state.devices.forEach((d) => {
      d.value = null;
      d.source = "manual";
      d.updatedAt = stamp();
    });
    state.tasks.forEach((t) => (t.done = false));
    $("#dialog").close();
    saveAndRender();
  },
};
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const fn = actions[el.dataset.action];
  if (fn) fn(el.dataset.id);
});
document.addEventListener("keydown", (e) => {
  if (
    (e.key === "Enter" || e.key === " ") &&
    e.target.matches(".map-point,.stat[data-action]")
  ) {
    e.preventDefault();
    actions[e.target.dataset.action](e.target.dataset.id);
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "animalSearch") {
    search = e.target.value;
    $("#animalResults").innerHTML = filteredAnimals();
  }
});
document.addEventListener("change", async (e) => {
  if (e.target.dataset.task) {
    const t = state.tasks.find((t) => t.id === e.target.dataset.task);
    if (t) {
      t.done = e.target.checked;
      addActivity(
        (t.done ? "اكتملت المهمة: " : "أُعيد فتح المهمة: ") + t.ar,
        (t.done ? "کام مکمل: " : "کام دوبارہ کھلا: ") + (t.ur || t.ar),
        "tasks",
      );
      saveAndRender();
    }
  }
  if (e.target.name === "photo" && $("#preview")) {
    try {
      const data = await photoData(e.target.files[0]);
      $("#preview").src = data;
      $("#preview").hidden = !data;
    } catch (err) {
      toast(err.message);
      e.target.value = "";
    }
  }
});
document.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const v = Object.fromEntries(new FormData(f));
  const before = JSON.stringify(state);
  const submit = f.querySelector("[type=submit]");
  if (submit) submit.disabled = true;
  if (f.querySelector(".form-error"))
    f.querySelector(".form-error").textContent = "";
  try {
    if (f.getAttribute("id") === "animalForm") {
      if (state.animals.some((a) => a.tag === v.tag.trim() && a.id !== v.id))
        throw Error(
          tr(
            "رقم العلامة مستخدم. اختر رقمًا مختلفًا.",
            "شناختی نمبر پہلے موجود ہے۔ دوسرا نمبر لکھیں۔",
          ),
        );
      const existingAnimal = state.animals.find((a) => a.id === v.id);
      const a = {
        ...existingAnimal,
        ...v,
        id: v.id || uid(),
        tag: v.tag.trim(),
        name: v.name.trim(),
        weight: v.weight ? Number(v.weight) : null,
        createdAt: existingAnimal?.createdAt || stamp(),
      };
      if (!a.tag) throw Error(tr("أدخل رقم العلامة", "شناختی نمبر درج کریں"));
      const i = state.animals.findIndex((x) => x.id === v.id);
      if (i >= 0) state.animals[i] = a;
      else state.animals.unshift(a);
      addActivity(
        (i >= 0 ? "تم تعديل ملف " : "تمت إضافة ") + (a.name || a.tag),
        (i >= 0 ? "فائل بدلی: " : "جانور شامل: ") + (a.name || a.tag),
        "sheep",
      );
    } else if (f.getAttribute("id") === "updateForm") {
      const photo = await photoData(v.photo?.size ? v.photo : null);
      addActivity(
        v.condition + " • " + v.note,
        v.condition + " • " + v.note,
        "camera",
        photo,
      );
    } else if (f.getAttribute("id") === "readingForm") {
      const d = state.devices.find((x) => x.id === v.id);
      d.value = Number(v.value);
      d.threshold = Number(v.threshold);
      d.updatedAt = stamp();
      d.source = "manual";
      addActivity(
        "تحديث قراءة " + d.name + ": " + d.value + "%",
        "ریڈنگ بدلی " + deviceText(d) + ": " + d.value + "%",
        "drop",
      );
      state.ops.readings = state.ops.readings || [];
      state.ops.readings.push({
        id: uid(),
        deviceId: d.id,
        value: d.value,
        source: "manual",
        at: stamp(),
      });
    } else if (f.getAttribute("id") === "stockForm") {
      const s = {
        ...v,
        id: v.id || uid(),
        qty: Number(v.qty),
        min: Number(v.min),
        name: v.name.trim(),
      };
      if (!s.name) throw Error(tr("أدخل اسم الصنف", "سامان کا نام درج کریں"));
      const i = state.stock.findIndex((x) => x.id === v.id);
      if (i >= 0) state.stock[i] = s;
      else state.stock.push(s);
      addActivity("تحديث مخزون " + s.name, "ذخیرہ بدلا: " + s.name, "feed");
    } else if (f.getAttribute("id") === "healthForm") {
      state.health.unshift({ ...v, id: uid(), at: stamp() });
      state.animals.find((a) => a.id === v.animalId).status = v.status;
      addActivity(
        "تسجيل متابعة صحية جديدة",
        "صحت کا نیا واقعہ درج ہوا",
        "heart",
      );
    } else if (f.getAttribute("id") === "taskForm") {
      state.tasks.push({ ...v, id: uid(), done: false });
    } else if (f.getAttribute("id") === "expenseForm") {
      state.expenses.unshift({
        ...v,
        id: uid(),
        amount: Number(v.amount),
        at: stamp(),
      });
      addActivity(
        "تسجيل مصروف " + v.amount + " درهم",
        "خرچ درج: " + v.amount + " درہم",
        "wallet",
      );
    } else if (f.getAttribute("id") === "locationForm") {
      if (
        v.location &&
        !/^https:\/\/(maps\.app\.goo\.gl|maps\.google\.[a-z.]+|www\.google\.[a-z.]+|google\.[a-z.]+)\//i.test(
          v.location,
        )
      )
        throw Error(
          tr(
            "استخدم رابط Google Maps يبدأ بـ https://",
            "https:// سے شروع ہونے والا Google Maps لنک درج کریں",
          ),
        );
      state.farmName = v.farmName.trim();
      state.location = v.location;
    } else if (f.getAttribute("id") === "importForm") {
      if (v.file.size > 8 * 1024 * 1024)
        throw Error(tr("الملف كبير جدًا", "فائل بہت بڑی ہے"));
      const next = JSON.parse(await v.file.text());
      validateBackup(next);
      state = next;
    } else return;
    if (!persist()) {
      state = JSON.parse(before);
      throw Error(
        tr(
          "لم يُحفظ التغيير. صدّر نسخة وقلل حجم الصور.",
          "تبدیلی محفوظ نہیں ہوئی۔ بیک اپ لیں اور تصاویر کم کریں۔",
        ),
      );
    }
    $("#dialog").close();
    render();
    toast(tr("تم الحفظ على هذا الجهاز", "اس آلے پر محفوظ ہو گیا"));
  } catch (err) {
    state = JSON.parse(before);
    f.querySelector(".form-error").textContent =
      err.message ||
      tr("تعذر الحفظ. تحقق من البيانات.", "محفوظ نہیں ہوا۔ ڈیٹا چیک کریں۔");
  } finally {
    if (submit) submit.disabled = false;
  }
});
function validateBackup(s) {
  const fail = () => {
    throw Error(
      tr("الملف ليس نسخة 3zbh سليمة.", "یہ درست 3zbh بیک اپ نہیں ہے۔"),
    );
  };
  if (
    !s ||
    s.version !== 3 ||
    typeof s.farmName !== "string" ||
    ![
      "animals",
      "tasks",
      "devices",
      "stock",
      "activity",
      "health",
      "expenses",
    ].every((k) => Array.isArray(s[k]) && s[k].length < 10000)
  )
    fail();
  if (
    [
      "animals",
      "tasks",
      "devices",
      "stock",
      "activity",
      "health",
      "expenses",
    ].some((k) =>
      s[k].some(
        (x) =>
          !x || typeof x.id !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(x.id),
      ),
    )
  )
    fail();
  if (new Set(s.animals.map((a) => a.tag)).size !== s.animals.length) fail();
  if (
    s.animals.some(
      (a) =>
        !a.id ||
        !a.tag ||
        !["sheep", "chicken", "camel"].includes(a.kind) ||
        !["female", "male"].includes(a.sex) ||
        !["healthy", "watch", "treatment"].includes(a.status),
    )
  )
    fail();
  if (
    s.animals.some(
      (a) =>
        (a.photo &&
          !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(a.photo)) ||
        (a.weights &&
          (!Array.isArray(a.weights) ||
            a.weights.some(
              (w) =>
                !Number.isFinite(w.kg) ||
                w.kg <= 0 ||
                w.kg > 2000 ||
                !Number.isFinite(new Date(w.at).getTime()),
            ))),
    )
  )
    fail();
  if (
    s.devices.some(
      (d) =>
        !d.id ||
        (d.value !== null && !Number.isFinite(d.value)) ||
        d.value < 0 ||
        d.value > 100 ||
        !Number.isFinite(d.threshold) ||
        d.threshold < 0 ||
        d.threshold > 100,
    )
  )
    fail();
  if (
    s.tasks.some((t) => !t.id || typeof t.ar !== "string") ||
    s.stock.some((x) => !x.id || !Number.isFinite(x.qty) || x.qty < 0) ||
    s.expenses.some((x) => !Number.isFinite(x.amount) || x.amount < 0)
  )
    fail();
  if (
    s.activity.some(
      (a) =>
        typeof a.ar !== "string" ||
        (a.photo && !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(a.photo)),
    )
  )
    fail();
  if (
    s.location &&
    !/^https:\/\/(maps\.app\.goo\.gl|maps\.google\.[a-z.]+|www\.google\.[a-z.]+|google\.[a-z.]+)\//i.test(
      s.location,
    )
  )
    fail();
  if (s.ops) validateOperations(s.ops);
}
window.addEventListener("hashchange", () => {
  const wasField = route === "field";
  route = location.hash.slice(1) || "overview";
  if (wasField !== (route === "field"))
    lang =
      localStorage.getItem(
        route === "field" ? "3zbh-field-language" : "3zbh-language",
      ) || (route === "field" ? "ur" : "ar");
  render();
  window.scrollTo(0, 0);
});
window.addEventListener("storage", (e) => {
  if (e.key === KEY && e.newValue) {
    try {
      const next = JSON.parse(e.newValue);
      validateBackup(next);
      state = next;
      render();
    } catch {}
  }
});
render();
if (storageWarning)
  toast(
    tr(
      "تعذر قراءة نسخة سابقة؛ افتُتحت مساحة تجريبية.",
      "پچھلا ریکارڈ نہیں پڑھا جا سکا؛ نمونہ کھولا گیا۔",
    ),
  );
if ("serviceWorker" in navigator)
  navigator.serviceWorker
    .register("./sw.js", { updateViaCache: "none" })
    .then((registration) => registration.update())
    .catch(() => {});
