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
function renderActivity() { document.querySelector('#activity').innerHTML = data.activity.length ? data.activity.map(a => `<div class="activity-item"><span class="activity-icon">${a.icon}</span><span class="activity-text">${a.text}</span><small class="activity-time">${a.time}</small></div>`).join('') : '<p class="muted">لا توجد تحديثات مسجلة.</p>'; }
function render() { renderStats(); renderTasks(); renderStock(); renderRegistry(); renderActivity(); }

document.querySelector('#addAnimalButton').addEventListener('click', () => document.querySelector('#addAnimalDialog').showModal());
document.querySelector('#animalForm').addEventListener('submit', e => { const type = document.querySelector('#animalType').value; const category = document.querySelector('#animalCategory').value; const name = document.querySelector('#animalName').value.trim() || 'حيوان جديد'; data.animals[type]++; data.animals[category]++; const icons = { sheep:'🐑', chicken:'🐔', camel:'🐪' }; data.registry.unshift({ icon:icons[type], name, detail:`${category === 'male' ? 'ذكر' : category === 'female' ? 'أنثى' : 'صغير'} · أضيف الآن` }); data.activity.unshift({ icon:'➕', text:`تمت إضافة ${name} للسجل`, time:'الآن' }); document.querySelector('#animalName').value = ''; save(); render(); });
document.querySelector('#clearActivity').addEventListener('click', () => { data.activity = []; save(); renderActivity(); });
document.querySelector('#addStockButton').addEventListener('click', () => document.querySelector('#stockDialog').showModal());
document.querySelector('#stockForm').addEventListener('submit', () => { const name = document.querySelector('#stockName').value.trim(); const amount = document.querySelector('#stockAmount').value.trim(); const percent = Math.max(0, Math.min(100, Number(document.querySelector('#stockPercent').value) || 0)); data.stock.unshift({ name, amount, percent }); data.activity.unshift({ icon:'📦', text:`تم تسجيل مخزون ${name}`, time:'الآن' }); document.querySelector('#stockForm').reset(); save(); render(); });
document.querySelector('#showAllAnimals').addEventListener('click', () => alert(`يوجد في السجل ${data.animals.sheep} من الغنم، ${data.animals.chicken} من الدجاج، و${data.animals.camel} من النوق.`));
render();
