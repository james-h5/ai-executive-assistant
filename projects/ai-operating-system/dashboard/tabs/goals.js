/* ============================================================
   GOALS TAB
   ============================================================ */

function initGoals() {
  renderGoals(document.getElementById('tab-goals'));
}

const GOALS_DATA = {
  quarter: 'Q3 2026',
  dateRange: 'July — September 2026',
  quarterEnd: '2026-09-30',

  hardTargets: [
    { id: 'boxing-july',   icon: '🥊', title: 'Boxing Fight',  deadline: '2026-07-31', description: 'Possible fight end of July — 70kg' },
    { id: 'golden-gloves', icon: '🏆', title: 'Golden Gloves', deadline: '2026-08-31', description: 'Golden Gloves — end of August 2026' },
  ],

  buildingToward: [
    { id: 'first-client',  icon: '💼', title: 'Sign first AI consulting client', deadline: '2026-12-31', description: 'Niche: Brisbane trade businesses. Offer: AI Lead Response system ($1,500–$2,000 + $300/mo)' },
    { id: 'trading-payout',icon: '💰', title: 'First trading payout',            deadline: '2026-12-31', description: 'Funded account — hit payout threshold and get first withdrawal' },
  ],

  longTerm: [
    { id: 'ten-k',    icon: '🚀', title: '$10k/month location-independent income', description: 'AI consulting + trading combined' },
    { id: 'hecs',     icon: '🎓', title: 'Pay off HECS debt',                       description: 'University loan' },
    { id: 'pilot',    icon: '✈️',  title: "Pilot's license",                          description: '' },
    { id: 'skydive',  icon: '🪂', title: 'Skydiving license',                        description: '' },
    { id: 'moto',     icon: '🏍️', title: 'Get a motorbike',                          description: '' },
    { id: 'travel',   icon: '🌏', title: 'Extended travel',                          description: 'Japan-style 1–2 month solo trips' },
  ],
};

function getGoalProgress() { return App.lsGet('jamesOS_goals', {}); }
function saveGoalProgress(d) { App.lsSet('jamesOS_goals', d); }

function urgency(days) {
  if (days < 0)   return { color: 'red',   badge: 'Overdue' };
  if (days === 0) return { color: 'amber', badge: 'Today' };
  if (days <= 7)  return { color: 'amber', badge: days + 'd' };
  if (days <= 30) return { color: 'blue',  badge: days + 'd' };
  return                 { color: 'muted', badge: days + 'd' };
}

function renderGoals(container) {
  let editingId = null;

  function render() {
    const prog = getGoalProgress();
    const qDays = App.daysUntil(GOALS_DATA.quarterEnd);

    let html = `<div class="card mb-20" style="background:linear-gradient(135deg,#12121a 0%,#1a1226 100%)">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs text-secondary font-600 mb-4" style="letter-spacing:.1em;text-transform:uppercase">Current Quarter</div>
          <div style="font-size:22px;font-weight:700">${GOALS_DATA.quarter}</div>
          <div class="text-secondary text-sm mt-4">${GOALS_DATA.dateRange}</div>
        </div>
        <div class="text-right">
          <div class="countdown text-purple">${qDays}</div>
          <div class="countdown-label">days left in Q3</div>
        </div>
      </div>
    </div>`;

    // Hard Targets
    html += `<div class="section-header"><span class="section-title">Hard Targets</span></div>
    <div class="grid-2 mb-20">`;

    GOALS_DATA.hardTargets.forEach(goal => {
      const days = App.daysUntil(goal.deadline);
      const { color, badge } = urgency(days);
      html += `<div class="card" style="border-top:3px solid var(--accent-${color})">
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-8"><span style="font-size:20px">${goal.icon}</span><span class="font-600">${App.esc(goal.title)}</span></div>
          <span class="badge badge-${color}">${badge}</span>
        </div>
        <div class="text-secondary text-sm mb-8">${App.esc(goal.description)}</div>
        <div class="text-xs text-muted">Deadline: ${goal.deadline}</div>
      </div>`;
    });
    html += `</div>`;

    // Building Toward
    html += `<div class="section-header"><span class="section-title">Building Toward (end of 2026)</span></div>
    <div class="grid-2 mb-20">`;

    GOALS_DATA.buildingToward.forEach(goal => {
      const days = App.daysUntil(goal.deadline);
      const { color, badge } = urgency(days);
      const p = prog[goal.id] || { progress: 0, notes: '' };
      const isEditing = editingId === goal.id;

      html += `<div class="card">
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-8"><span style="font-size:18px">${goal.icon}</span><span class="font-600">${App.esc(goal.title)}</span></div>
          <span class="badge badge-${color}">${badge}</span>
        </div>
        <div class="text-secondary text-sm mb-12">${App.esc(goal.description)}</div>`;

      if (isEditing) {
        html += `<div class="form-group mb-8">
            <label class="form-label">Progress — <span class="mono text-blue" id="gp-lbl-${goal.id}">${p.progress}%</span></label>
            <input class="form-input" id="gp-range-${goal.id}" type="range" min="0" max="100" value="${p.progress}">
          </div>
          <div class="form-group mb-12">
            <label class="form-label">Status note</label>
            <input class="form-input" id="gp-notes-${goal.id}" value="${App.esc(p.notes)}" placeholder="What's the current status?">
          </div>
          <div class="flex gap-8 justify-between">
            <button class="btn btn-ghost btn-sm gp-cancel" data-id="${goal.id}">Cancel</button>
            <button class="btn btn-primary btn-sm gp-save" data-id="${goal.id}">Save</button>
          </div>`;
      } else {
        html += `<div class="flex items-center justify-between mb-6">
            <span class="text-xs text-secondary">${p.progress}% complete</span>
            <button class="btn btn-ghost btn-sm gp-edit" data-id="${goal.id}">Update</button>
          </div>
          <div class="progress-bar"><div class="progress-fill blue" style="width:${p.progress}%"></div></div>
          ${p.notes ? `<div class="text-secondary text-sm mt-8">${App.esc(p.notes)}</div>` : ''}`;
      }

      html += `</div>`;
    });
    html += `</div>`;

    // Long-term
    html += `<div class="section-header"><span class="section-title">Long-term</span></div>
    <div class="grid-3">`;
    GOALS_DATA.longTerm.forEach(goal => {
      html += `<div class="card">
        <div class="flex items-center gap-8 mb-4">
          <span style="font-size:18px">${goal.icon}</span>
          <span class="font-500">${App.esc(goal.title)}</span>
        </div>
        ${goal.description ? `<div class="text-secondary text-sm">${App.esc(goal.description)}</div>` : ''}
      </div>`;
    });
    html += `</div>`;

    container.innerHTML = html;

    // Range live label
    GOALS_DATA.buildingToward.forEach(goal => {
      const range = container.querySelector(`#gp-range-${goal.id}`);
      const lbl = container.querySelector(`#gp-lbl-${goal.id}`);
      if (range && lbl) range.oninput = () => { lbl.textContent = range.value + '%'; };
    });

    container.querySelectorAll('.gp-edit').forEach(btn => {
      btn.onclick = () => { editingId = btn.dataset.id; render(); };
    });
    container.querySelectorAll('.gp-cancel').forEach(btn => {
      btn.onclick = () => { editingId = null; render(); };
    });
    container.querySelectorAll('.gp-save').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const p = getGoalProgress();
        p[id] = {
          progress: parseInt(container.querySelector(`#gp-range-${id}`)?.value) || 0,
          notes: container.querySelector(`#gp-notes-${id}`)?.value || '',
        };
        saveGoalProgress(p);
        editingId = null;
        render();
      };
    });
  }

  render();
}
