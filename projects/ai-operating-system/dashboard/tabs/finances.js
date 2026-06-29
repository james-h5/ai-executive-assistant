/* ============================================================
   FINANCES & BUSINESS TAB
   ============================================================ */

// ── Google Sheets Integration ─────────────────────────────────────────────────
// After deploying finance-dashboard-setup.gs as a Web App, paste the URL here.
// Deploy: Apps Script editor → Deploy → New deployment → Web App
//         Execute as: Me | Who has access: Anyone with the link
const SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbw_foTZTcKu6Bz3Iu7hpfsmc4bRMwr2fYfVxT_twzZLDve2_E6zJ5jUvEI3js2oZKk/exec';

function initFinances() {
  renderFinances(document.getElementById('tab-finances'));
}

const PIPELINE_STAGES = ['Prospect', 'Contacted', 'Demo Booked', 'Proposal Sent', 'Closed Won', 'Closed Lost'];

const MONTHLY_TARGET = 10000;

// Expense categories in preferred display order
const EXP_CATEGORIES = [
  'Food & Groceries',
  'Eating Out',
  'Rent / Board',
  'Transport',
  'Gym / Boxing',
  'Subscriptions',
  'Entertainment',
  'Clothing',
  'Health',
  'Education',
  'Business',
  'Other',
];

function getFinData() { return App.lsGet('jamesOS_finances', { pipeline: [] }); }
function saveFinData(d) { App.lsSet('jamesOS_finances', d); }

function renderFinances(container) {
  let showForm = false;
  let editId = null;
  let sheetsData = null;

  function render() {
    const data = getFinData();

    // ── Derive key numbers from Sheets (or zeros while loading) ───────────────
    const inc       = sheetsData?.income    || {};
    const nw        = sheetsData?.netWorth  || {};
    const exp       = sheetsData?.expenses  || {};
    const invList   = sheetsData?.investments || [];

    const monthly   = inc.monthlyRate  || 0;
    const gap       = inc.gapToTarget  != null ? inc.gapToTarget : Math.max(0, MONTHLY_TARGET - monthly);
    const pct       = Math.min(100, (monthly / MONTHLY_TARGET * 100)).toFixed(1);
    const pipelineVal = data.pipeline
      .filter(p => p.stage !== 'Closed Lost')
      .reduce((s, p) => s + (parseFloat(p.estimatedValue) || 0), 0);
    const netSavings = monthly - (exp.thisMonth || 0);
    const loading   = sheetsData === null && SHEETS_WEB_APP_URL;

    // ── Net Worth panel ───────────────────────────────────────────────────────
    let html = '';
    if (loading) {
      html += `<div class="card mb-20" style="opacity:0.5;text-align:center;padding:10px;font-size:13px;color:var(--text-secondary)">Loading from Google Sheets…</div>`;
    } else if (sheetsData) {
      html += buildNetWorthPanel(nw, exp, monthly);
    }

    // ── Stats bar ─────────────────────────────────────────────────────────────
    const dash = v => loading ? '<span class="text-muted">—</span>' : App.formatCurrency(v);
    html += `<div class="stats-bar">
      <div class="stat-item"><div class="stat-label">Weekly Income</div><div class="stat-value">${dash(inc.latestWeekly || 0)}</div></div>
      <div class="stat-item"><div class="stat-label">Monthly Rate</div><div class="stat-value">${dash(monthly)}</div></div>
      <div class="stat-item"><div class="stat-label">Target</div><div class="stat-value">${App.formatCurrency(MONTHLY_TARGET)}/mo</div></div>
      <div class="stat-item"><div class="stat-label">Gap</div><div class="stat-value ${gap > 0 ? 'negative' : 'positive'}">${gap > 0 ? '−' : ''}${dash(gap)}</div></div>
      <div class="stat-item"><div class="stat-label">Pipeline</div><div class="stat-value neutral">${App.formatCurrency(pipelineVal)}</div></div>
    </div>`;

    // ── Progress bar ──────────────────────────────────────────────────────────
    html += `<div class="card mb-20">
      <div class="flex items-center justify-between mb-6">
        <span class="section-title">Progress to ${App.formatCurrency(MONTHLY_TARGET)}/month</span>
        <span class="mono text-sm text-blue">${loading ? '—' : pct + '%'}</span>
      </div>
      <div class="progress-bar" style="height:6px"><div class="progress-fill ${parseFloat(pct) >= 100 ? 'green' : 'blue'}" style="width:${loading ? 0 : pct}%"></div></div>
    </div>`;

    // ── Investments ───────────────────────────────────────────────────────────
    html += `<div class="section-header"><span class="section-title">Investments</span></div>`;
    if (loading) {
      html += `<div class="card mb-20" style="opacity:0.5;font-size:13px;color:var(--text-secondary);text-align:center;padding:12px">Loading…</div>`;
    } else if (invList.length === 0) {
      html += `<div class="card mb-20" style="font-size:13px;color:var(--text-secondary);text-align:center;padding:12px">No investment data yet — fill in the Investments tab in Google Sheets.</div>`;
    } else {
      html += `<div class="card mb-20" style="padding:0;overflow:hidden"><table class="table">
        <thead><tr><th>Asset</th><th>Value</th><th>Gain / Loss</th><th>Return</th></tr></thead>
        <tbody>`;
      invList.forEach(inv => {
        const isFutures = /futures/i.test(inv.asset);
        const glClass   = inv.gainLoss > 0 ? 'positive' : inv.gainLoss < 0 ? 'negative' : '';
        const sign      = inv.gainLoss > 0 ? '+' : '';
        html += `<tr${isFutures ? ' style="background:var(--bg-card-hover)"' : ''}>
          <td class="font-500">${App.esc(inv.asset)}${isFutures ? ' <span class="badge badge-blue">Trading</span>' : ''}</td>
          <td class="mono">${App.formatCurrency(inv.value)}</td>
          <td class="mono ${glClass}">${sign}${App.formatCurrency(inv.gainLoss)}</td>
          <td class="mono ${glClass}">${sign}${(inv.returnPct * 100).toFixed(1)}%</td>
        </tr>`;
      });
      const totalVal = invList.reduce((s, i) => s + (i.value || 0), 0);
      const totalGL  = invList.reduce((s, i) => s + (i.gainLoss || 0), 0);
      const totalGLClass = totalGL > 0 ? 'positive' : totalGL < 0 ? 'negative' : '';
      const totalSign    = totalGL > 0 ? '+' : '';
      html += `<tr style="background:var(--bg-card-hover)">
        <td class="font-600">Total Portfolio</td>
        <td class="mono font-600">${App.formatCurrency(totalVal)}</td>
        <td class="mono font-600 ${totalGLClass}">${totalSign}${App.formatCurrency(totalGL)}</td>
        <td></td>
      </tr></tbody></table></div>`;
    }

    // ── Expenses this month ───────────────────────────────────────────────────
    html += `<div class="section-header"><span class="section-title">Expenses — This Month</span></div>`;
    if (loading) {
      html += `<div class="card mb-20" style="opacity:0.5;font-size:13px;color:var(--text-secondary);text-align:center;padding:12px">Loading…</div>`;
    } else {
      const byCat  = exp.byCategory || {};
      const total  = exp.thisMonth  || 0;
      const hasCats = Object.keys(byCat).length > 0;

      html += `<div class="card mb-20">`;

      // Summary row
      html += `<div class="flex items-center justify-between mb-12">
        <span class="text-secondary text-sm">Total spent</span>
        <span class="mono font-600 ${total > 0 ? 'negative' : ''}">${App.formatCurrency(total)}</span>
      </div>
      <div class="flex items-center justify-between mb-16">
        <span class="text-secondary text-sm">Net savings</span>
        <span class="mono font-600 ${netSavings >= 0 ? 'positive' : 'negative'}">${netSavings >= 0 ? '+' : ''}${App.formatCurrency(netSavings)}</span>
      </div>`;

      if (hasCats && total > 0) {
        // Sort categories by amount descending, only show ones with spend
        const catEntries = EXP_CATEGORIES
          .map(c => [c, byCat[c] || 0])
          .filter(([, v]) => v > 0)
          .sort((a, b) => b[1] - a[1]);

        catEntries.forEach(([cat, amount]) => {
          const barPct = Math.min(100, (amount / total * 100)).toFixed(1);
          html += `<div class="mb-10">
            <div class="flex items-center justify-between mb-4">
              <span class="text-sm">${App.esc(cat)}</span>
              <span class="mono text-sm">${App.formatCurrency(amount)}</span>
            </div>
            <div class="progress-bar" style="height:4px">
              <div class="progress-fill" style="width:${barPct}%;background:var(--accent-amber,#f59e0b)"></div>
            </div>
          </div>`;
        });
      } else if (total > 0 && !hasCats) {
        html += `<div class="text-secondary text-sm" style="text-align:center;padding:8px 0">Category breakdown unavailable — redeploy the Sheets Web App to see the breakdown.</div>`;
      } else {
        html += `<div class="text-secondary text-sm" style="text-align:center;padding:8px 0">No expenses logged yet this month — import from Westpac to see the breakdown.</div>`;
      }

      html += `</div>`;
    }

    // ── Consulting Pipeline ───────────────────────────────────────────────────
    html += `<div class="section-header">
      <span class="section-title">Consulting Pipeline</span>
      <button class="btn btn-primary btn-sm" id="pl-add">+ Add Lead</button>
    </div>`;

    if (showForm) {
      const ed  = editId ? data.pipeline.find(p => p.id === editId) : null;
      const v   = k => App.esc(ed?.[k] ?? '');
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

    container.innerHTML = html;
    attachEvents();
  }

  function attachEvents() {
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

  function buildNetWorthPanel(nw, exp, monthlyRate) {
    const netSavings = monthlyRate - (exp.thisMonth || 0);
    const cash       = nw.cash || 0;
    const monthly    = exp.thisMonth || 0;
    const runway     = monthly > 0 ? (cash / monthly).toFixed(1) : '∞';
    return `<div class="card mb-20">
      <div class="flex items-center justify-between mb-12">
        <span class="section-title">Net Worth</span>
        <span class="text-sm" style="color:var(--text-muted)">Google Sheets · live</span>
      </div>
      <div class="stats-bar" style="margin-bottom:0">
        <div class="stat-item">
          <div class="stat-label">Net Worth</div>
          <div class="stat-value">${App.formatCurrency(nw.netWorth || 0)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Cash</div>
          <div class="stat-value">${App.formatCurrency(cash)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Investments</div>
          <div class="stat-value">${App.formatCurrency(nw.totalInvestments || 0)}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Runway</div>
          <div class="stat-value">${runway} mo</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Net Savings</div>
          <div class="stat-value ${netSavings >= 0 ? 'positive' : 'negative'}">${netSavings >= 0 ? '+' : ''}${App.formatCurrency(netSavings)}</div>
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
