/* ============================================================
   FINANCES & BUSINESS TAB
   ============================================================ */

// ── Google Sheets Integration ─────────────────────────────────────────────────
// After deploying finance-dashboard-setup.gs as a Web App, paste the URL here.
// Deploy: Apps Script editor → Deploy → New deployment → Web App
//         Execute as: Me | Who has access: Anyone with the link
const SHEETS_WEB_APP_URL = '';

function initFinances() {
  renderFinances(document.getElementById('tab-finances'));
}

const INCOME_STREAMS = [
  { id: 'bartending', name: 'Bartending',            status: 'active',      defaultActual: 500 },
  { id: 'tutoring',   name: 'Tutoring (Maths/Sci)',  status: 'active',      defaultActual: 110 },
  { id: 'consulting', name: 'AI Consulting',          status: 'pre-launch',  defaultActual: 0   },
  { id: 'trading',    name: 'Futures Trading',        status: 'building',    defaultActual: 0   },
];

const PIPELINE_STAGES = ['Prospect', 'Contacted', 'Demo Booked', 'Proposal Sent', 'Closed Won', 'Closed Lost'];

const ACTIVE_PROJECTS = [
  { name: 'AI Operating System',     status: 'active',   next: 'Build dashboard ✓ → automate morning brief' },
  { name: 'AI Consulting Portfolio', status: 'active',   next: 'Publish demo video + case study' },
  { name: 'Business Processes',      status: 'planning', next: 'Draft client intake form' },
  { name: 'Landing First Client',    status: 'planning', next: 'Define outreach channel + first message' },
];

const STATUS_BADGE = {
  active:       '<span class="badge badge-green">Active</span>',
  'pre-launch': '<span class="badge badge-amber">Pre-launch</span>',
  building:     '<span class="badge badge-blue">Building</span>',
  planning:     '<span class="badge badge-muted">Planning</span>',
};

const MONTHLY_TARGET = 10000;

function getFinData() { return App.lsGet('jamesOS_finances', { actuals: {}, pipeline: [] }); }
function saveFinData(d) { App.lsSet('jamesOS_finances', d); }

function renderFinances(container) {
  let showForm = false;
  let editId = null;
  let sheetsData = null; // cached from Google Sheets Web App

  function render() {
    const data = getFinData();

    const weeklyTotal = INCOME_STREAMS.reduce((sum, s) => {
      return sum + (data.actuals[s.id] !== undefined ? parseFloat(data.actuals[s.id]) : s.defaultActual);
    }, 0);
    const monthly = weeklyTotal * 4.33;
    const gap = Math.max(0, MONTHLY_TARGET - monthly);
    const pct = Math.min(100, (monthly / MONTHLY_TARGET * 100)).toFixed(1);
    const pipelineVal = data.pipeline
      .filter(p => p.stage !== 'Closed Lost')
      .reduce((s, p) => s + (parseFloat(p.estimatedValue) || 0), 0);

    // Net worth panel (populated after Sheets fetch)
    let html = sheetsData ? buildNetWorthPanel(sheetsData) : (SHEETS_WEB_APP_URL ? '<div id="nw-panel" class="card mb-20" style="opacity:0.5;text-align:center;padding:10px;font-size:13px;color:var(--text-secondary)">Loading from Google Sheets...</div>' : '<div id="nw-panel"></div>');

    html += `<div class="stats-bar">
      <div class="stat-item"><div class="stat-label">Weekly Income</div><div class="stat-value">${App.formatCurrency(weeklyTotal)}</div></div>
      <div class="stat-item"><div class="stat-label">Monthly Rate</div><div class="stat-value">${App.formatCurrency(monthly)}</div></div>
      <div class="stat-item"><div class="stat-label">Target</div><div class="stat-value">${App.formatCurrency(MONTHLY_TARGET)}/mo</div></div>
      <div class="stat-item"><div class="stat-label">Gap</div><div class="stat-value ${gap > 0 ? 'negative' : 'positive'}">${gap > 0 ? '−' : ''}${App.formatCurrency(gap)}</div></div>
      <div class="stat-item"><div class="stat-label">Pipeline</div><div class="stat-value neutral">${App.formatCurrency(pipelineVal)}</div></div>
    </div>`;

    // Progress bar
    html += `<div class="card mb-20">
      <div class="flex items-center justify-between mb-6">
        <span class="section-title">Progress to ${App.formatCurrency(MONTHLY_TARGET)}/month</span>
        <span class="mono text-sm text-blue">${pct}%</span>
      </div>
      <div class="progress-bar" style="height:6px"><div class="progress-fill ${parseFloat(pct) >= 100 ? 'green' : 'blue'}" style="width:${pct}%"></div></div>
    </div>`;

    // Income streams
    html += `<div class="section-header"><span class="section-title">Income Streams</span></div>
    <div class="card mb-20" style="padding:0;overflow:hidden">
      <table class="table">
        <thead><tr><th>Stream</th><th>Status</th><th>Actual / week</th></tr></thead>
        <tbody>`;

    INCOME_STREAMS.forEach(s => {
      const actual = data.actuals[s.id] !== undefined ? data.actuals[s.id] : s.defaultActual;
      html += `<tr>
        <td class="font-500">${App.esc(s.name)}</td>
        <td>${STATUS_BADGE[s.status] || s.status}</td>
        <td>
          <div class="flex items-center gap-8">
            <span class="text-muted text-sm">$</span>
            <input class="form-input mono fin-actual" data-id="${s.id}" type="number" value="${actual}" style="width:100px;padding:5px 8px">
          </div>
        </td>
      </tr>`;
    });

    html += `<tr style="background:var(--bg-card-hover)">
        <td class="font-600">Total</td><td></td>
        <td class="mono font-600">${App.formatCurrency(weeklyTotal)}<span class="text-muted text-sm font-400"> /wk · ${App.formatCurrency(monthly)}/mo</span></td>
      </tr>
    </tbody></table></div>`;

    // Pipeline
    html += `<div class="section-header">
      <span class="section-title">Consulting Pipeline</span>
      <button class="btn btn-primary btn-sm" id="pl-add">+ Add Lead</button>
    </div>`;

    if (showForm) {
      const ed = editId ? data.pipeline.find(p => p.id === editId) : null;
      const v = k => App.esc(ed?.[k] ?? '');
      const sel = (k, val) => ed?.[k] === val ? ' selected' : '';
      html += `<div class="inline-form mb-16">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Business Name</label><input class="form-input" id="pl-biz" value="${v('businessName')}" placeholder="e.g. Brisbane Electrical Co."></div>
          <div class="form-group"><label class="form-label">Contact Name</label><input class="form-input" id="pl-contact" value="${v('contactName')}"></div>
          <div class="form-group"><label class="form-label">Stage</label>
            <select class="form-input" id="pl-stage">
              ${PIPELINE_STAGES.map(s => `<option${sel('stage', s) || (!ed && s === 'Prospect' ? ' selected' : '')}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Est. Value ($)</label><input class="form-input" id="pl-val" type="number" value="${ed?.estimatedValue ?? 2000}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Contact Method</label>
            <select class="form-input" id="pl-method">
              <option value="instagram"${sel('contactMethod','instagram')}>Instagram</option>
              <option value="referral"${sel('contactMethod','referral')}>Referral</option>
              <option value="cold-email"${sel('contactMethod','cold-email')}>Cold Email</option>
              <option value="other"${sel('contactMethod','other')}>Other</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Last Contact</label><input class="form-input" id="pl-last" type="date" value="${ed?.lastContact ?? App.todayKey()}"></div>
          <div class="form-group" style="grid-column:span 2"><label class="form-label">Notes</label><input class="form-input" id="pl-notes" value="${v('notes')}"></div>
        </div>
        <div class="form-actions">
          ${ed ? '<button class="btn btn-danger btn-sm" id="pl-del">Delete</button>' : ''}
          <button class="btn btn-ghost btn-sm" id="pl-cancel">Cancel</button>
          <button class="btn btn-primary btn-sm" id="pl-save">${ed ? 'Update' : 'Add Lead'}</button>
        </div>
      </div>`;
    }

    html += `<div class="kanban mb-20">`;
    PIPELINE_STAGES.forEach(stage => {
      const cards = data.pipeline.filter(p => p.stage === stage);
      html += `<div class="kanban-col">
        <div class="kanban-col-header">${stage}<span class="kanban-count">${cards.length}</span></div>`;
      cards.forEach(card => {
        html += `<div class="kanban-card pl-card" data-id="${card.id}">
          <div class="kanban-card-name">${App.esc(card.businessName)}</div>
          <div class="kanban-card-meta">${App.esc(card.contactName || '')}${card.estimatedValue ? ' · ' + App.formatCurrency(card.estimatedValue) : ''}</div>
          ${card.lastContact ? `<div class="kanban-card-meta mt-4">Last: ${card.lastContact}</div>` : ''}
        </div>`;
      });
      html += `</div>`;
    });
    html += `</div>`;

    // Projects
    html += `<div class="section-header"><span class="section-title">Active Projects</span></div>
    <div class="grid-2">`;
    ACTIVE_PROJECTS.forEach(p => {
      html += `<div class="card">
        <div class="flex items-center justify-between mb-6">
          <span class="font-500">${App.esc(p.name)}</span>${STATUS_BADGE[p.status] || ''}
        </div>
        <div class="text-secondary text-sm">Next: ${App.esc(p.next)}</div>
      </div>`;
    });
    html += `</div>`;

    container.innerHTML = html;
    attachEvents();
  }

  function attachEvents() {
    // Income actuals
    container.querySelectorAll('.fin-actual').forEach(input => {
      input.onchange = () => {
        const d = getFinData();
        d.actuals[input.dataset.id] = parseFloat(input.value) || 0;
        saveFinData(d);
        render();
      };
    });

    // Pipeline add
    container.querySelector('#pl-add').onclick = () => { showForm = true; editId = null; render(); container.querySelector('#pl-biz')?.focus(); };
    container.querySelector('#pl-cancel')?.addEventListener('click', () => { showForm = false; editId = null; render(); });

    container.querySelector('#pl-save')?.addEventListener('click', () => {
      const biz = container.querySelector('#pl-biz').value.trim();
      if (!biz) return;
      const d = getFinData();
      const card = {
        businessName:   biz,
        contactName:    container.querySelector('#pl-contact').value,
        stage:          container.querySelector('#pl-stage').value,
        estimatedValue: parseFloat(container.querySelector('#pl-val').value) || 0,
        contactMethod:  container.querySelector('#pl-method').value,
        lastContact:    container.querySelector('#pl-last').value,
        notes:          container.querySelector('#pl-notes').value,
      };
      if (editId) {
        const idx = d.pipeline.findIndex(p => p.id === editId);
        if (idx > -1) { card.id = editId; d.pipeline[idx] = card; }
      } else {
        card.id = App.uuid();
        d.pipeline.push(card);
      }
      saveFinData(d);
      showForm = false; editId = null; render();
    });

    container.querySelector('#pl-del')?.addEventListener('click', () => {
      if (!confirm('Remove this lead?')) return;
      const d = getFinData();
      d.pipeline = d.pipeline.filter(p => p.id !== editId);
      saveFinData(d);
      showForm = false; editId = null; render();
    });

    container.querySelectorAll('.pl-card').forEach(card => {
      card.onclick = () => { editId = card.dataset.id; showForm = true; render(); };
    });
  }

  function buildNetWorthPanel(d) {
    const nw  = d.netWorth  || {};
    const exp = d.expenses  || {};
    const monthlyRate = d.income ? d.income.monthlyRate : 0;
    const netSavings  = monthlyRate - (exp.thisMonth || 0);
    return `<div id="nw-panel" class="card mb-20">
      <div class="flex items-center justify-between mb-12">
        <span class="section-title">Net Worth &amp; Expenses</span>
        <span class="text-sm" style="color:var(--text-muted)">Google Sheets · live</span>
      </div>
      <div class="stats-bar" style="margin-bottom:0">
        <div class="stat-item">
          <div class="stat-label">Net Worth</div>
          <div class="stat-value">${App.formatCurrency(nw.netWorth || 0)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Cash</div>
          <div class="stat-value">${App.formatCurrency(nw.cash || 0)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Investments</div>
          <div class="stat-value">${App.formatCurrency(nw.totalInvestments || 0)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Expenses (this month)</div>
          <div class="stat-value ${exp.thisMonth > 0 ? 'negative' : ''}">${App.formatCurrency(exp.thisMonth || 0)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Net Savings (this month)</div>
          <div class="stat-value ${netSavings >= 0 ? 'positive' : 'negative'}">${App.formatCurrency(netSavings)}</div>
        </div>
      </div>
    </div>`;
  }

  render();

  // Fetch live data from Google Sheets (once on load, non-blocking)
  if (SHEETS_WEB_APP_URL) {
    fetch(SHEETS_WEB_APP_URL)
      .then(r => r.json())
      .then(data => { sheetsData = data; render(); })
      .catch(() => { sheetsData = {}; render(); });
  }
}
