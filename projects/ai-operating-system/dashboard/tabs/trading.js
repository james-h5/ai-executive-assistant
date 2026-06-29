/* ============================================================
   TRADING JOURNAL TAB
   ============================================================ */

function initTrading() {
  renderTrading(document.getElementById('tab-trading'));
}

const TICK_VALUES = { MES: 5, MNQ: 2, ES: 50, NQ: 20, CL: 1000, GC: 100, RTY: 50, YM: 5, OTHER: 1 };
const INSTRUMENTS = Object.keys(TICK_VALUES);
const SETUPS = ['Breakout', 'Pullback', 'Reversal', 'Range Break', 'Trend Follow', 'Opening Range', 'VWAP', 'Other'];

function getTradesData() { return App.lsGet('jamesOS_trades', { trades: [] }); }
function saveTradesData(d) { App.lsSet('jamesOS_trades', d); }

function pnl(trade) {
  if (!trade.exitPrice || !trade.entryPrice) return { gross: null, net: null };
  const tv = TICK_VALUES[trade.instrument] || 1;
  const dir = trade.direction === 'long' ? 1 : -1;
  const gross = dir * (parseFloat(trade.exitPrice) - parseFloat(trade.entryPrice)) * parseFloat(trade.size || 1) * tv;
  return { gross, net: gross - parseFloat(trade.fees || 0) };
}

function stats(trades) {
  const done = trades.filter(t => t.exitPrice);
  const nets = done.map(t => pnl(t).net);
  const wins = nets.filter(n => n > 0);
  const losses = nets.filter(n => n <= 0);
  const grossWin = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
  return {
    total: done.length,
    winRate: done.length ? (wins.length / done.length * 100).toFixed(1) : '0.0',
    totalNet: nets.reduce((a, b) => a + b, 0),
    avgWin: wins.length ? (grossWin / wins.length) : 0,
    avgLoss: losses.length ? (grossLoss / losses.length) : 0,
    pf: grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : (grossWin > 0 ? '∞' : '—'),
  };
}

function equitySVG(trades) {
  const done = [...trades].filter(t => t.exitPrice && t.date).sort((a, b) => a.date.localeCompare(b.date) || (a.entryTime||'').localeCompare(b.entryTime||''));
  if (done.length < 2) return `<text x="50%" y="50%" fill="var(--text-muted)" text-anchor="middle" font-size="12" font-family="Inter,sans-serif">Log more trades to see your curve</text>`;

  let cum = 0;
  const pts = [0, ...done.map(t => { cum += pnl(t).net; return cum; })];
  const W = 600, H = 140, pad = 12;
  const minY = Math.min(...pts), maxY = Math.max(...pts);
  const rangeY = maxY - minY || 1;
  const toX = i => pad + (i / (pts.length - 1)) * (W - pad * 2);
  const toY = v => pad + (H - pad * 2) * (1 - (v - minY) / rangeY);
  const pathD = pts.map((v, i) => `${i ? 'L' : 'M'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  const fillD = pathD + ` L${toX(pts.length-1).toFixed(1)},${(H-pad).toFixed(1)} L${pad},${(H-pad).toFixed(1)} Z`;
  const color = cum >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
  const zeroY = toY(0).toFixed(1);
  const showZero = minY < 0 && maxY > 0;

  return `<defs>
    <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
    </linearGradient>
  </defs>
  ${showZero ? `<line x1="${pad}" y1="${zeroY}" x2="${W-pad}" y2="${zeroY}" stroke="var(--border-accent)" stroke-dasharray="4,3" stroke-width="1"/>` : ''}
  <path d="${fillD}" fill="url(#eq)"/>
  <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
}

function tradeForm(editing) {
  const v = k => App.esc(editing?.[k] ?? '');
  const sel = (k, val) => editing?.[k] === val ? ' selected' : '';
  return `<div class="inline-form mb-16">
    <div class="font-600 mb-12">${editing ? 'Edit Trade' : 'Log Trade'}</div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Date</label><input class="form-input" id="tf-date" type="date" value="${editing ? v('date') : App.todayKey()}"></div>
      <div class="form-group"><label class="form-label">Instrument</label>
        <select class="form-input" id="tf-inst">
          <option value="">Select…</option>
          ${INSTRUMENTS.map(k => `<option value="${k}"${sel('instrument', k)}>${k}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Direction</label>
        <select class="form-input" id="tf-dir">
          <option value="long"${sel('direction','long')}>Long</option>
          <option value="short"${sel('direction','short')}>Short</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Contracts</label><input class="form-input" id="tf-size" type="number" min="1" value="${editing?.size ?? 1}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Entry Price</label><input class="form-input" id="tf-entry" type="number" step="0.01" value="${v('entryPrice')}"></div>
      <div class="form-group"><label class="form-label">Exit Price</label><input class="form-input" id="tf-exit" type="number" step="0.01" value="${v('exitPrice')}"></div>
      <div class="form-group"><label class="form-label">Entry Time</label><input class="form-input" id="tf-etime" type="time" value="${v('entryTime')}"></div>
      <div class="form-group"><label class="form-label">Exit Time</label><input class="form-input" id="tf-xtime" type="time" value="${v('exitTime')}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Setup</label>
        <select class="form-input" id="tf-setup">
          <option value="">—</option>
          ${SETUPS.map(s => `<option${sel('setup', s)}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label">Fees ($)</label><input class="form-input" id="tf-fees" type="number" step="0.01" value="${editing?.fees ?? 0}"></div>
      <div class="form-group" style="grid-column:span 2">
        <label class="form-label">Notes</label>
        <input class="form-input" id="tf-notes" placeholder="Setup, reasoning, lessons…" value="${v('notes')}">
      </div>
    </div>
    <div class="form-actions">
      ${editing ? '<button class="btn btn-danger btn-sm" id="tf-delete">Delete</button>' : ''}
      <button class="btn btn-ghost btn-sm" id="tf-cancel">Cancel</button>
      <button class="btn btn-primary btn-sm" id="tf-save">${editing ? 'Update' : 'Save Trade'}</button>
    </div>
  </div>`;
}

function readForm(container) {
  return {
    date:       container.querySelector('#tf-date').value,
    instrument: container.querySelector('#tf-inst').value,
    direction:  container.querySelector('#tf-dir').value,
    size:       parseFloat(container.querySelector('#tf-size').value) || 1,
    entryPrice: parseFloat(container.querySelector('#tf-entry').value) || null,
    exitPrice:  parseFloat(container.querySelector('#tf-exit').value)  || null,
    entryTime:  container.querySelector('#tf-etime').value,
    exitTime:   container.querySelector('#tf-xtime').value,
    setup:      container.querySelector('#tf-setup').value,
    fees:       parseFloat(container.querySelector('#tf-fees').value) || 0,
    notes:      container.querySelector('#tf-notes').value,
  };
}

function renderTrading(container) {
  let showForm = false;
  let editId = null;
  let expandedId = null;
  let filterInst = '';
  let filterDir = '';

  function render() {
    const data = getTradesData();
    const s = stats(data.trades);
    const nc = s.totalNet >= 0 ? 'positive' : 'negative';
    const pfCls = parseFloat(s.pf) >= 1 ? 'positive' : 'negative';

    let html = `<div class="stats-bar">
      <div class="stat-item"><div class="stat-label">Trades</div><div class="stat-value">${s.total}</div></div>
      <div class="stat-item"><div class="stat-label">Win Rate</div><div class="stat-value neutral">${s.winRate}%</div></div>
      <div class="stat-item"><div class="stat-label">Net P&amp;L</div><div class="stat-value ${nc}">${App.formatCurrencyDecimals(s.totalNet)}</div></div>
      <div class="stat-item"><div class="stat-label">Avg Winner</div><div class="stat-value positive">+${App.formatCurrencyDecimals(s.avgWin)}</div></div>
      <div class="stat-item"><div class="stat-label">Avg Loser</div><div class="stat-value negative">−${App.formatCurrencyDecimals(s.avgLoss)}</div></div>
      <div class="stat-item"><div class="stat-label">Profit Factor</div><div class="stat-value ${pfCls}">${s.pf}</div></div>
    </div>`;

    // Chart + log button
    const doneCount = data.trades.filter(t => t.exitPrice && t.date).length;
    const chartInner = doneCount < 2
      ? `<div class="empty-state" style="height:160px"><div class="empty-state-icon">📈</div>Log at least 2 completed trades to see your equity curve</div>`
      : `<svg viewBox="0 0 600 140" preserveAspectRatio="none">${equitySVG(data.trades)}</svg>`;
    html += `<div class="flex gap-16 mb-16 items-start">
      <div class="chart-container" style="flex:1">
        <div class="section-header mb-8"><span class="section-title">Equity Curve</span></div>
        ${chartInner}
      </div>
      <div class="flex flex-col gap-8 mt-20">
        <button class="btn btn-primary" id="tr-log">+ Log Trade</button>
        <button class="btn btn-ghost btn-sm" id="tr-export">Export CSV</button>
      </div>
    </div>`;

    if (showForm) {
      const editing = editId ? data.trades.find(t => t.id === editId) : null;
      html += tradeForm(editing);
    }

    // Filters
    html += `<div class="flex gap-8 mb-12 items-center">
      <select class="form-input" id="tr-fi" style="width:130px">
        <option value="">All instruments</option>
        ${INSTRUMENTS.map(k => `<option value="${k}"${filterInst===k?' selected':''}>${k}</option>`).join('')}
      </select>
      <select class="form-input" id="tr-fd" style="width:120px">
        <option value="">All directions</option>
        <option value="long"${filterDir==='long'?' selected':''}>Long</option>
        <option value="short"${filterDir==='short'?' selected':''}>Short</option>
      </select>
    </div>`;

    // Table
    const filtered = data.trades
      .filter(t => (!filterInst || t.instrument === filterInst) && (!filterDir || t.direction === filterDir))
      .sort((a, b) => b.date.localeCompare(a.date) || (b.entryTime||'').localeCompare(a.entryTime||''));

    html += `<div class="card" style="padding:0;overflow:hidden">`;
    if (!filtered.length) {
      html += `<div class="empty-state"><div class="empty-state-icon">📊</div>No trades logged yet — hit "Log Trade" to start.</div>`;
    } else {
      html += `<table class="table"><thead><tr>
        <th>Date</th><th>Instrument</th><th>Direction</th>
        <th>Entry</th><th>Exit</th><th>Contracts</th>
        <th>Setup</th><th>Gross</th><th>Net P&amp;L</th>
      </tr></thead><tbody>`;

      filtered.forEach(trade => {
        const p = pnl(trade);
        const gc = p.gross === null ? '' : p.gross >= 0 ? 'text-green' : 'text-red';
        const nc2 = p.net === null ? '' : p.net >= 0 ? 'text-green' : 'text-red';
        const db = trade.direction === 'long'
          ? '<span class="badge badge-green">Long</span>'
          : '<span class="badge badge-red">Short</span>';
        const isExp = expandedId === trade.id;
        const fmt = n => n >= 0 ? `+${App.formatCurrencyDecimals(n)}` : App.formatCurrencyDecimals(n);

        html += `<tr class="trade-row${isExp ? ' expanded' : ''}" data-id="${trade.id}" style="cursor:pointer">
          <td class="mono text-sm">${trade.date}</td>
          <td class="mono font-600">${App.esc(trade.instrument||'—')}</td>
          <td>${db}</td>
          <td class="mono text-sm">${trade.entryPrice ?? '—'}</td>
          <td class="mono text-sm">${trade.exitPrice ?? '—'}</td>
          <td class="mono text-sm">${trade.size ?? '—'}</td>
          <td>${trade.setup ? `<span class="badge badge-muted">${App.esc(trade.setup)}</span>` : '—'}</td>
          <td class="mono ${gc}">${p.gross === null ? '—' : fmt(p.gross)}</td>
          <td class="mono font-600 ${nc2}">${p.net === null ? '—' : fmt(p.net)}</td>
        </tr>`;

        if (isExp) {
          html += `<tr class="expanded"><td colspan="9" style="padding:14px 16px">
            <div class="flex gap-20 items-start flex-wrap">
              <div><div class="text-xs text-secondary mb-4">Entry</div><div class="mono text-sm">${trade.entryTime||'—'}</div></div>
              <div><div class="text-xs text-secondary mb-4">Exit</div><div class="mono text-sm">${trade.exitTime||'—'}</div></div>
              <div><div class="text-xs text-secondary mb-4">Fees</div><div class="mono text-sm">${App.formatCurrencyDecimals(trade.fees||0)}</div></div>
              <div style="flex:1"><div class="text-xs text-secondary mb-4">Notes</div><div class="text-sm">${App.esc(trade.notes||'—')}</div></div>
              <button class="btn btn-ghost btn-sm tr-edit" data-id="${trade.id}">Edit</button>
            </div>
          </td></tr>`;
        }
      });
      html += `</tbody></table>`;
    }
    html += `</div>`;

    container.innerHTML = html;
    attachEvents();
  }

  function attachEvents() {
    const data = getTradesData();

    container.querySelector('#tr-log').onclick = () => { showForm = true; editId = null; render(); container.querySelector('#tf-date')?.focus(); };

    container.querySelector('#tr-export').onclick = () => {
      const rows = getTradesData().trades.map(t => {
        const p = pnl(t);
        return [t.date, t.instrument, t.direction, t.entryPrice, t.exitPrice, t.size, t.entryTime, t.exitTime, t.setup, t.fees, p.gross?.toFixed(2) ?? '', p.net?.toFixed(2) ?? '', `"${(t.notes||'').replace(/"/g,'""')}"`].join(',');
      });
      const csv = ['Date,Instrument,Direction,Entry,Exit,Contracts,EntryTime,ExitTime,Setup,Fees,GrossPnL,NetPnL,Notes', ...rows].join('\n');
      const a = document.createElement('a');
      a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
      a.download = `trades-${App.todayKey()}.csv`;
      a.click();
    };

    container.querySelector('#tf-cancel')?.addEventListener('click', () => { showForm = false; editId = null; render(); });

    container.querySelector('#tf-save')?.addEventListener('click', () => {
      const d = getTradesData();
      const trade = readForm(container);
      if (!trade.date || !trade.instrument) return;
      if (editId) {
        const idx = d.trades.findIndex(t => t.id === editId);
        if (idx > -1) { trade.id = editId; d.trades[idx] = trade; }
      } else {
        trade.id = App.uuid();
        d.trades.push(trade);
      }
      saveTradesData(d);
      showForm = false; editId = null; render();
    });

    container.querySelector('#tf-delete')?.addEventListener('click', () => {
      if (!confirm('Delete this trade?')) return;
      const d = getTradesData();
      d.trades = d.trades.filter(t => t.id !== editId);
      saveTradesData(d);
      showForm = false; editId = null; render();
    });

    container.querySelectorAll('.trade-row').forEach(row => {
      row.onclick = () => { expandedId = expandedId === row.dataset.id ? null : row.dataset.id; render(); };
    });

    container.querySelectorAll('.tr-edit').forEach(btn => {
      btn.onclick = e => { e.stopPropagation(); editId = btn.dataset.id; showForm = true; render(); };
    });

    container.querySelector('#tr-fi').onchange = e => { filterInst = e.target.value; render(); };
    container.querySelector('#tr-fd').onchange = e => { filterDir = e.target.value; render(); };
  }

  render();
}
