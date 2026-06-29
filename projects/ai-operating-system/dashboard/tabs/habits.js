/* ============================================================
   HABITS TAB
   ============================================================ */

function initHabits() {
  renderHabits(document.getElementById('tab-habits'));
}

const DEFAULT_HABITS = [
  { id: 'boxing',        name: 'Boxing Training',           icon: '🥊', category: 'health',    targetDays: ['mon','tue','wed','thu','fri'] },
  { id: 'trading-rev',   name: 'Trading Review',            icon: '📈', category: 'business',  targetDays: ['mon','tue','wed','thu','fri'] },
  { id: 'ai-work',       name: 'Work on AI / Consulting',   icon: '🤖', category: 'business',  targetDays: ['mon','tue','wed','thu','fri'] },
  { id: 'read-learn',    name: 'Read / Learn',              icon: '📚', category: 'learning',  targetDays: ['mon','tue','wed','thu','fri','sat','sun'] },
  { id: 'morning',       name: 'Morning Routine',           icon: '🌅', category: 'health',    targetDays: ['mon','tue','wed','thu','fri','sat','sun'] },
];

const DAY_KEYS   = ['sun','mon','tue','wed','thu','fri','sat'];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getHabitsData() {
  const data = App.lsGet('jamesOS_habits', null);
  if (!data) {
    const fresh = { habits: DEFAULT_HABITS, completions: {} };
    App.lsSet('jamesOS_habits', fresh);
    return fresh;
  }
  return data;
}

function saveHabitsData(data) { App.lsSet('jamesOS_habits', data); }

function getStreak(habitId, completions) {
  const today    = new Date();
  const todayKey = App.formatDateKey(today);
  const todayDone = !!(completions[todayKey]?.includes(habitId));
  let streak = 0;
  const d = new Date(today);
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const key = App.formatDateKey(d);
    if (completions[key]?.includes(habitId)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak + (todayDone ? 1 : 0);
}

function buildDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (n - 1 - i));
    return { key: App.formatDateKey(d), dayIdx: d.getDay(), label: n === 7 ? DAY_LABELS[d.getDay()] : d.getDate(), isToday: i === n - 1 };
  });
}

function renderHabits(container) {
  let showForm    = false;
  let editHabitId = null;
  let days = buildDays(7);

  function render() {
    const data = getHabitsData();
    const is30 = days.length === 30;

    let html = `<div class="section-header">
      <span class="section-title">Habits Tracker</span>
      <div class="flex gap-8">
        <button class="btn btn-ghost btn-sm" id="hbt-toggle">${is30 ? '7-day view' : '30-day view'}</button>
        <button class="btn btn-primary btn-sm" id="hbt-add">+ Add Habit</button>
      </div>
    </div>`;

    if (showForm) {
      html += `<div class="inline-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input class="form-input" id="hf-name" placeholder="e.g. Cold shower">
          </div>
          <div class="form-group" style="max-width:80px">
            <label class="form-label">Icon</label>
            <input class="form-input" id="hf-icon" placeholder="🌊">
          </div>
        </div>
        <div class="form-group mb-12">
          <label class="form-label">Target Days</label>
          <div class="flex gap-8 mt-4">
            ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i) =>
              `<label class="checkbox-label text-xs"><input type="checkbox" class="hf-day" value="${['mon','tue','wed','thu','fri','sat','sun'][i]}" checked>${d}</label>`
            ).join('')}
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-ghost btn-sm" id="hf-cancel">Cancel</button>
          <button class="btn btn-primary btn-sm" id="hf-save">Save</button>
        </div>
      </div>`;
    }

    html += `<div class="card" style="padding:16px;overflow:hidden"><div class="habit-grid-wrap">
      <table class="habit-grid-table"><thead><tr>
        <th style="text-align:left;padding-right:16px">Habit</th>
        ${days.map(d => `<th style="${d.isToday ? 'color:var(--accent-blue)' : ''}">${d.label}</th>`).join('')}
        <th>Streak</th><th></th>
      </tr></thead><tbody>`;

    data.habits.forEach(habit => {
      if (editHabitId === habit.id) {
        html += `<tr>
          <td colspan="${days.length + 3}" style="padding:6px 0">
            <div class="flex gap-8 items-center" style="padding:0 2px">
              <input class="form-input" id="he-icon" value="${App.esc(habit.icon || '')}" style="width:60px;flex-shrink:0" placeholder="🌟">
              <input class="form-input" id="he-name" value="${App.esc(habit.name)}" style="flex:1">
              <button class="btn btn-primary btn-sm" id="he-save" data-habit="${habit.id}">Save</button>
              <button class="btn btn-ghost btn-sm" id="he-cancel">Cancel</button>
            </div>
          </td>
        </tr>`;
        return;
      }
      const streak = getStreak(habit.id, data.completions);
      html += `<tr>
        <td class="habit-row-name">${App.esc(habit.icon || '')} ${App.esc(habit.name)}</td>`;
      days.forEach(d => {
        const done = data.completions[d.key]?.includes(habit.id);
        const isTarget = habit.targetDays.includes(DAY_KEYS[d.dayIdx]);
        let cls = done ? 'done' : (isTarget ? 'missed' : 'no-target');
        if (d.isToday && isTarget) cls += ' today';
        html += `<td><button class="habit-dot ${cls}" data-habit="${habit.id}" data-key="${d.key}" ${!isTarget ? 'disabled' : ''}>${done ? '✓' : ''}</button></td>`;
      });
      html += `<td class="mono text-sm" style="white-space:nowrap;padding:0 8px">${streak > 0 ? '🔥 ' + streak : '<span class="text-muted">—</span>'}</td>`;
      html += `<td style="white-space:nowrap">
        <button class="btn-icon hbt-edit" data-habit="${habit.id}" title="Edit" style="margin-right:2px">✎</button>
        <button class="btn-icon hbt-del" data-habit="${habit.id}" title="Delete">✕</button>
      </td>`;
      html += `</tr>`;
    });

    html += `</tbody></table></div></div>`;
    container.innerHTML = html;

    // Events
    container.querySelector('#hbt-toggle').onclick = () => {
      days = buildDays(days.length === 7 ? 30 : 7);
      render();
    };

    container.querySelector('#hbt-add').onclick = () => { showForm = true; render(); container.querySelector('#hf-name')?.focus(); };

    container.querySelector('#hf-cancel')?.addEventListener('click', () => { showForm = false; render(); });

    container.querySelector('#hf-save')?.addEventListener('click', () => {
      const name = container.querySelector('#hf-name').value.trim();
      if (!name) return;
      const icon = container.querySelector('#hf-icon').value.trim() || '✓';
      const targetDays = [...container.querySelectorAll('.hf-day:checked')].map(cb => cb.value);
      const d = getHabitsData();
      d.habits.push({ id: 'h-' + Date.now(), name, icon, category: 'custom', targetDays });
      saveHabitsData(d);
      showForm = false;
      render();
    });

    container.querySelectorAll('.habit-dot:not([disabled])').forEach(btn => {
      btn.onclick = () => {
        const d = getHabitsData();
        if (!d.completions[btn.dataset.key]) d.completions[btn.dataset.key] = [];
        const idx = d.completions[btn.dataset.key].indexOf(btn.dataset.habit);
        if (idx > -1) d.completions[btn.dataset.key].splice(idx, 1);
        else d.completions[btn.dataset.key].push(btn.dataset.habit);
        saveHabitsData(d);
        render();
      };
    });

    container.querySelectorAll('.hbt-edit').forEach(btn => {
      btn.onclick = () => { editHabitId = btn.dataset.habit; render(); setTimeout(() => container.querySelector('#he-name')?.focus(), 0); };
    });

    container.querySelector('#he-cancel')?.addEventListener('click', () => { editHabitId = null; render(); });

    container.querySelector('#he-save')?.addEventListener('click', () => {
      const id   = container.querySelector('#he-save').dataset.habit;
      const name = container.querySelector('#he-name').value.trim();
      if (!name) return;
      const icon = container.querySelector('#he-icon').value.trim() || '✓';
      const d = getHabitsData();
      const habit = d.habits.find(h => h.id === id);
      if (habit) { habit.name = name; habit.icon = icon; }
      saveHabitsData(d);
      editHabitId = null;
      render();
    });

    container.querySelectorAll('.hbt-del').forEach(btn => {
      btn.onclick = () => {
        if (!confirm('Delete this habit?')) return;
        const d = getHabitsData();
        d.habits = d.habits.filter(h => h.id !== btn.dataset.habit);
        saveHabitsData(d);
        render();
      };
    });
  }

  render();
}
