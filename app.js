const initialData = {
  animals: { sheep: 86, chicken: 32, camel: 1, trees: 24, male: 18, female: 55, young: 13 },
  registry: [{ icon:'🐑', name:'غنم عارضي', detail:'٥٥ أنثى · ١٨ ذكر' }, { icon:'🐑', name:'غنم حري', detail:'١٣ صغير' }, { icon:'🐔', name:'دجاج', detail:'٣٢ طير' }, { icon:'🐪', name:'الناقة', detail:'ناقة واحدة' }],
  tasks: [
    { text: 'تعبئة الماء للحلال والدجاج', time: '٧:٠٠ ص', done: true },
    { text: 'تقديم العلف الصباحي', time: '٧:١٥ ص', done: true },
    { text: 'تصوير الحلال والتحديث اليومي', time: '٨:٠٠ ص', done: true },
    { text: 'جمع البيض وتسجيل الكمية', time: '١٠:٠٠ ص', done: true },
    { text: 'تنظيف حظيرة الغنم', time: '١١:٣٠ ص', done: true },
    { text: 'رش الحظيرة وفحص الناقة', time: '٤:٠٠ م', done: false },
    { text: 'ري النخل والأشجار', time: '٥:٠٠ م', done: false }
  ],
  stock: [{ name: 'شعير', amount: '٤ أكياس', percent: 72 }, { name: 'علف دجاج', amount: 'كيسان', percent: 42 }, { name: 'ماء الخزان', amount: '٨٠٪', percent: 80 }],
  activity: [{ icon: '📷', text: 'تم رفع صور التحديث اليومي', time: 'منذ ساعة' }, { icon: '🥚', text: 'تم تسجيل ١٨ بيضة', time: 'منذ ساعتين' }, { icon: '💧', text: 'تم تعبئة خزان الماء', time: 'منذ ٣ ساعات' }]
};
const saved = JSON.parse(localStorage.getItem('azbti-data') || 'null');
const data = saved || initialData;
data.registry = data.registry || initialData.registry;
data.stock = data.stock || initialData.stock;
data.activity = data.activity || [];
const save = () => localStorage.setItem('azbti-data', JSON.stringify(data));
let language = localStorage.getItem('azbti-language') || 'ar';
const translations = { ar:{ lang:'اردو', login:'تسجيل الدخول', update:'+ تسجيل تحديث اليوم', addStock:'+ تسجيل مخزون', clear:'مسح' }, ur:{ lang:'عربي', login:'لاگ اِن', update:'+ آج کی رپورٹ', addStock:'+ ذخیرہ درج کریں', clear:'صاف کریں' } };
function applyLanguage() { const t = translations[language]; document.documentElement.lang = language === 'ur' ? 'ur' : 'ar'; document.querySelector('#languageButton').textContent = t.lang; document.querySelector('#loginButton').textContent = t.login; document.querySelector('#dailyUpdateButton').textContent = t.update; document.querySelector('#addStockButton').textContent = t.addStock; document.querySelector('#clearActivity').textContent = t.clear; }
const cloudSettings = window.AZBTI_SUPABASE || {};
const cloud = cloudSettings.url && cloudSettings.anonKey && window.supabase ? window.supabase.createClient(cloudSettings.url, cloudSettings.anonKey) : null;
let cloudUser = null;
const kindNames = { sheep:'الغنم', chicken:'الدجاج', camel:'النوق', trees:'الأشجار' };

async function recordActivity(icon, message) {
  data.activity.unshift({ icon, text:message, time:'الآن' });
  if (cloud && cloudUser) await cloud.from('activity').insert({ icon, message, created_by:cloudUser.id });
}
async function loadCloudData() {
  if (!cloud || !cloudUser) return;
  const [animals, tasks, stock, activity] = await Promise.all([
    cloud.from('animals').select('*').order('created_at', { ascending:false }),
    cloud.from('daily_tasks').select('*').order('created_at'),
    cloud.from('stock_items').select('*').order('updated_at', { ascending:false }),
    cloud.from('activity').select('*').order('created_at', { ascending:false }).limit(20)
  ]);
  if (animals.error || tasks.error || stock.error || activity.error) return;
  if (animals.data.length) {
    data.animals = { sheep:0, chicken:0, camel:0, trees:data.animals.trees || 0, male:0, female:0, young:0 };
    data.registry = animals.data.map(a => ({ icon:{ sheep:'🐑', chicken:'🐔', camel:'🐪' }[a.kind], name:a.name, detail:a.category === 'male' ? 'ذكر' : a.category === 'female' ? 'أنثى' : 'صغير' }));
    animals.data.forEach(a => { data.animals[a.kind]++; data.animals[a.category]++; });
  }
  if (tasks.data.length) data.tasks = tasks.data.map(t => ({ id:t.id, text:t.title, time:t.task_time, done:t.is_done }));
  if (stock.data.length) data.stock = stock.data.map(s => ({ id:s.id, name:s.name, amount:s.amount, percent:s.remaining_percent }));
  if (activity.data.length) data.activity = activity.data.map(a => ({ icon:a.icon, text:a.message, time:new Date(a.created_at).toLocaleDateString('ar-SA') }));
  save(); render();
}
function updateLoginButton() { document.querySelector('#loginButton').textContent = cloudUser ? (language === 'ur' ? 'لاگ آؤٹ' : 'تسجيل الخروج') : translations[language].login; }

function renderStats() {
  const stats = [{ key:'sheep', icon:'🐑', label:'الغنم', value:data.animals.sheep }, { key:'chicken', icon:'🐔', label:'الدجاج', value:data.animals.chicken }, { key:'camel', icon:'🐪', label:'النوق', value:data.animals.camel }, { key:'trees', icon:'🌴', label:'النخل والأشجار', value:data.animals.trees }, { icon:'👥', label:'الذكور والإناث', value:`${data.animals.male} / ${data.animals.female}` }];
  document.querySelector('#stats').innerHTML = stats.map(s => `<article class="stat-card"><div class="stat-top"><span class="stat-icon">${s.icon}</span>${s.key ? `<div class="quick-controls"><button data-adjust="${s.key}" data-step="-1" aria-label="إنقاص">−</button><button data-adjust="${s.key}" data-step="1" aria-label="زيادة">+</button></div>` : ''}</div><h3>${s.value}</h3><p>${s.label}</p></article>`).join('');
  document.querySelectorAll('[data-adjust]').forEach(button => button.addEventListener('click', () => { const key = button.dataset.adjust; data.animals[key] = Math.max(0, (data.animals[key] || 0) + Number(button.dataset.step)); data.activity.unshift({ icon: Number(button.dataset.step) > 0 ? '➕' : '➖', text: `${Number(button.dataset.step) > 0 ? 'تمت زيادة' : 'تم إنقاص'} عدد ${key === 'sheep' ? 'الغنم' : key === 'chicken' ? 'الدجاج' : key === 'camel' ? 'النوق' : 'الأشجار'}`, time: 'الآن' }); save(); render(); }));
}
function renderTasks() {
  const done = data.tasks.filter(t => t.done).length;
  document.querySelector('#taskCounter').textContent = `${done} من ${data.tasks.length}`;
  document.querySelector('#tasks').innerHTML = data.tasks.map((task, i) => `<label class="task-item ${task.done ? 'done' : ''}"><input type="checkbox" data-task="${i}" ${task.done ? 'checked' : ''}><span>${task.text}</span><small class="task-time">${task.time}</small></label>`).join('');
  document.querySelectorAll('[data-task]').forEach(input => input.addEventListener('change', e => { data.tasks[e.target.dataset.task].done = e.target.checked; save(); renderTasks(); }));
}
function renderStock() { document.querySelector('#feedStock').innerHTML = data.stock.map(item => `<div class="feed-item"><div><div class="feed-name">${item.name}</div><div class="feed-bar"><i style="width:${item.percent}%"></i></div></div><div class="feed-amount">${item.amount}</div></div>`).join(''); }
function renderRegistry() { document.querySelector('#animalRegistry').innerHTML = data.registry.map(item => `<div class="animal-card"><span class="animal-card-icon">${item.icon}</span><div><strong>${item.name}</strong><small>${item.detail}</small></div></div>`).join(''); }
function renderActivity() { document.querySelector('#activity').innerHTML = data.activity.length ? data.activity.map(a => `<div class="activity-item"><span class="activity-icon">${a.icon}</span><span class="activity-text">${a.text}${a.photo ? `<br><img class="photo-preview" src="${a.photo}" alt="صورة التحديث">` : ''}</span><small class="activity-time">${a.time}</small></div>`).join('') : '<p class="muted">لا توجد تحديثات مسجلة.</p>'; }
function render() { renderStats(); renderTasks(); renderStock(); renderRegistry(); renderActivity(); }

document.querySelector('#addAnimalButton').addEventListener('click', () => document.querySelector('#addAnimalDialog').showModal());
document.querySelector('#animalForm').addEventListener('submit', async () => { const type = document.querySelector('#animalType').value; const category = document.querySelector('#animalCategory').value; const name = document.querySelector('#animalName').value.trim() || 'حيوان جديد'; if (cloud && cloudUser) await cloud.from('animals').insert({ kind:type, category, name, created_by:cloudUser.id }); data.animals[type]++; data.animals[category]++; const icons = { sheep:'🐑', chicken:'🐔', camel:'🐪' }; data.registry.unshift({ icon:icons[type], name, detail:`${category === 'male' ? 'ذكر' : category === 'female' ? 'أنثى' : 'صغير'} · أضيف الآن` }); await recordActivity('➕', `تمت إضافة ${name} للسجل`); document.querySelector('#animalName').value = ''; save(); render(); });
document.querySelector('#clearActivity').addEventListener('click', async () => { data.activity = []; if (cloud && cloudUser) await cloud.from('activity').delete().not('id', 'is', null); save(); renderActivity(); });
document.querySelector('#addStockButton').addEventListener('click', () => document.querySelector('#stockDialog').showModal());
document.querySelector('#stockForm').addEventListener('submit', async () => { const name = document.querySelector('#stockName').value.trim(); const amount = document.querySelector('#stockAmount').value.trim(); const percent = Math.max(0, Math.min(100, Number(document.querySelector('#stockPercent').value) || 0)); if (cloud && cloudUser) await cloud.from('stock_items').insert({ name, amount, remaining_percent:percent, updated_by:cloudUser.id }); data.stock.unshift({ name, amount, percent }); await recordActivity('📦', `تم تسجيل مخزون ${name}`); document.querySelector('#stockForm').reset(); save(); render(); });
document.querySelector('#showAllAnimals').addEventListener('click', () => alert(`يوجد في السجل ${data.animals.sheep} من الغنم، ${data.animals.chicken} من الدجاج، و${data.animals.camel} من النوق.`));
document.querySelector('#dailyUpdateButton').addEventListener('click', () => document.querySelector('#dailyUpdateDialog').showModal());
document.querySelector('#dailyPhoto').addEventListener('change', event => { const file = event.target.files[0]; const preview = document.querySelector('#photoPreview'); if (!file) { preview.hidden = true; return; } const reader = new FileReader(); reader.onload = () => { preview.src = reader.result; preview.hidden = false; }; reader.readAsDataURL(file); });
document.querySelector('#dailyUpdateForm').addEventListener('submit', async () => { const status = document.querySelector('#dailyStatus').value; const note = document.querySelector('#dailyNote').value.trim(); const preview = document.querySelector('#photoPreview'); const message = note ? `${status}: ${note}` : status; await recordActivity('📷', message); if (preview.src && !preview.hidden) data.activity[0].photo = preview.src; document.querySelector('#dailyUpdateForm').reset(); preview.hidden = true; save(); renderActivity(); });
document.querySelector('#loginButton').addEventListener('click', async () => { if (cloudUser && cloud) { await cloud.auth.signOut(); cloudUser = null; updateLoginButton(); return; } document.querySelector('#loginError').textContent = cloud ? '' : 'إعدادات الربط لم تصل بعد. حدّث الصفحة بعد اكتمال النشر.'; document.querySelector('#loginDialog').showModal(); });
document.querySelector('#loginForm').addEventListener('submit', async () => { if (!cloud) { document.querySelector('#loginError').textContent = 'لم يتم ربط الموقع بقاعدة البيانات بعد.'; return; } const email = document.querySelector('#loginEmail').value; const password = document.querySelector('#loginPassword').value; const result = await cloud.auth.signInWithPassword({ email, password }); if (result.error) { document.querySelector('#loginError').textContent = 'تعذر الدخول. تأكد من البريد وكلمة المرور.'; return; } cloudUser = result.data.user; updateLoginButton(); await loadCloudData(); });
document.querySelector('#languageButton').addEventListener('click', () => { language = language === 'ar' ? 'ur' : 'ar'; localStorage.setItem('azbti-language', language); applyLanguage(); });
if (cloud) cloud.auth.getSession().then(async ({ data:session }) => { cloudUser = session.session?.user || null; updateLoginButton(); if (cloudUser) await loadCloudData(); });
else updateLoginButton();
applyLanguage();
render();
