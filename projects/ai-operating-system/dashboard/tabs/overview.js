/* ============================================================
   OVERVIEW TAB — Cockpit view
   ============================================================ */

function initOverview() {
  renderOverview(document.getElementById('tab-overview'));
}

const OV_TICK_VALUES = { MES: 5, MNQ: 2, ES: 50, NQ: 20, CL: 1000, GC: 100, RTY: 50, YM: 5, OTHER: 1 };

const OV_EVENTS = [
  { label: 'Boxing Fight',  date: '2026-07-31' },
  { label: 'Golden Gloves', date: '2026-08-31' },
];

function miniEquitySVG(trades) {
  const done = [...trades]
    .filter(t => t.exitPrice && t.entryPrice && t.date)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.entryTime || '').localeCompare(b.entryTime || ''));
  if (done.length < 2) return '<p class="text-muted text-xs" style="text-align:center;padding:16px 8px">Not enough trades to plot</p>';
  let cum = 0;
  const pts = [0, ...done.map(t => {
    const tv  = OV_TICK_VALUES[t.instrument] || 1;
    const dir = t.direction === 'long' ? 1 : -1;
    const gross = dir * (parseFloat(t.exitPrice) - parseFloat(t.entryPrice)) * parseFloat(t.size || 1) * tv;
    cum += gross - parseFloat(t.fees || 0);
    return cum;
  })];
  const W = 400, H = 100, pad = 8;
  const minY = Math.min(...pts), maxY = Math.max(...pts);
  const rng  = maxY - minY || 1;
  const toX  = i => pad + (i / (pts.length - 1)) * (W - pad * 2);
  const toY  = v => pad + (H - pad * 2) * (1 - (v - minY) / rng);
  const pathD = pts.map((v, i) => `${i ? 'L' : 'M'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  const fillD = pathD + ` L${toX(pts.length - 1).toFixed(1)},${(H - pad).toFixed(1)} L${pad},${(H - pad).toFixed(1)} Z`;
  const color    = cum >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
  const showZero = minY < 0 && maxY > 0;
  const zeroY    = toY(0).toFixed(1);
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:100%;display:block">
    <defs><linearGradient id="mini-eq" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
    </linearGradient></defs>
    ${showZero ? `<line x1="${pad}" y1="${zeroY}" x2="${W - pad}" y2="${zeroY}" stroke="var(--border)" stroke-dasharray="4,3" stroke-width="1"/>` : ''}
    <path d="${fillD}" fill="url(#mini-eq)"/>
    <path d="${pathD}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
}

function renderOverview(container) {
  let tasks        = null;
  let tasksLoading = false;
  let tasksError   = null;

  function ovPnl(trade) {
    if (!trade.exitPrice || !trade.entryPrice) return null;
    const tv  = OV_TICK_VALUES[trade.instrument] || 1;
    const dir = trade.direction === 'long' ? 1 : -1;
    const gross = dir * (parseFloat(trade.exitPrice) - parseFloat(trade.entryPrice)) * parseFloat(trade.size || 1) * tv;
    return gross - parseFloat(trade.fees || 0);
  }

  function habitStreak(habitId, completions) {
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

  function render() {
    const habitsData  = getHabitsData();
    const goalProg    = getGoalProgress();
    const tradeData   = App.lsGet('jamesOS_trades', { trades: [] });
    const sheetsCache = App.lsGet('jamesOS_sheets_cache', null);

    // ── Stats ─────────────────────────────────────────────────
    const bestStreak = habitsData.habits.length
      ? Math.max(0, ...habitsData.habits.map(h => habitStreak(h.id, habitsData.completions)))
      : 0;

    const now         = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthPnL    = tradeData.trades
      .filter(t => t.date?.startsWith(monthPrefix) && t.exitPrice)
      .reduce((sum, t) => sum + (ovPnl(t) ?? 0), 0);
    const hasTrades   = tradeData.trades.some(t => t.exitPrice);

    const monthlyRate = sheetsCache?.income?.monthlyRate || 0;
    const incomePct   = monthlyRate > 0 ? Math.round((monthlyRate / MONTHLY_TARGET) * 100) : null;

    // ── Today's habits ────────────────────────────────────────
    const todayKey    = App.todayKey();
    const todayDayKey = ['sun','mon','tue','wed','thu','fri','sat'][now.getDay()];
    const todayHabits = habitsData.habits.filter(h => h.targetDays.includes(todayDayKey));
    const todayDone   = habitsData.completions[todayKey] || [];

    // ── This week's events ────────────────────────────────────
    const calData   = App.lsGet('jamesOS_calendar', { events: [] });
    const weekStart = App.todayKey();
    const weekEnd   = (() => { const d = new Date(); d.setDate(d.getDate() + 6); return App.formatDateKey(d); })();
    const weekEvents = calData.events
      .filter(ev => ev.date >= weekStart && ev.date <= weekEnd)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

    // ── Greeting ──────────────────────────────────────────────
    const hour     = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const dateStr  = now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });

    // ── Render ────────────────────────────────────────────────
    const taskCount  = tasks ? tasks.filter(t => t.status?.type !== 'closed').length : null;
    const pnlColor   = monthPnL >= 0 ? 'positive' : 'negative';
    const pnlDisplay = hasTrades
      ? (monthPnL >= 0 ? `+${App.formatCurrencyDecimals(monthPnL)}` : App.formatCurrencyDecimals(monthPnL))
      : '—';

    const incomeStatColor = incomePct === null ? '' : incomePct >= 100 ? 'positive' : incomePct >= 30 ? 'neutral' : 'negative';

    const progPct   = monthlyRate > 0 ? Math.min(100, Math.round((monthlyRate / MONTHLY_TARGET) * 100)) : 0;
    const progColor = progPct < 30 ? 'red' : progPct < 70 ? 'amber' : 'green';

    let html = `<div class="flex items-center justify-between mb-12">
      <div>
        <div style="font-size:18px;font-weight:700">${greeting}, James</div>
        <div class="text-sm text-secondary mt-4">${dateStr}</div>
      </div>
    </div>
    <div class="stats-bar mb-20">
      <div class="stat-item">
        <div class="stat-label">Best Streak</div>
        <div class="stat-value">${bestStreak > 0 ? bestStreak + 'd' : '—'}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Monthly Rate</div>
        <div class="stat-value neutral">${monthlyRate > 0 ? App.formatCurrency(monthlyRate) : '—'}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Income vs $10k</div>
        <div class="stat-value ${incomeStatColor}">${incomePct !== null ? incomePct + '%' : '—'}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">P&amp;L This Month</div>
        <div class="stat-value ${hasTrades ? pnlColor : ''}">${pnlDisplay}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Tasks Remaining</div>
        <div class="stat-value neutral">${taskCount !== null ? taskCount : (tasksLoading ? '…' : '—')}</div>
      </div>
    </div>`;

    html += `<div class="overview-3col">`;

    // ── COL 1: Goals (dark navy) ──────────────────────────────
    html += `<div class="goals-card-ov">`;
    html += `<div class="section-header mb-12"><span class="section-title" style="color:#4a9eff">Goals</span></div>`;

    html += `<div class="goals-section-header">Hard Targets</div>`;
    GOALS_DATA.hardTargets.forEach(goal => {
      const days = App.daysUntil(goal.deadline);
      const { color, badge } = urgency(days);
      html += `<div class="task-item">
        <span class="task-name font-500">${App.esc(goal.title)}</span>
        <span class="badge badge-${color}">${badge}</span>
      </div>`;
    });

    html += `<div class="goals-section-header">Building Toward</div>`;
    GOALS_DATA.buildingToward.forEach(goal => {
      const p = goalProg[goal.id] || { progress: 0, notes: '' };
      html += `<div class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <span class="text-sm font-500">${App.esc(goal.title)}</span>
          <span class="mono text-xs text-blue">${p.progress}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill blue" style="width:${p.progress}%"></div></div>
        ${p.notes ? `<div class="text-xs text-secondary mt-4">${App.esc(p.notes)}</div>` : ''}
      </div>`;
    });

    html += `<div class="goals-section-header">Long-term</div>`;
    GOALS_DATA.longTerm.forEach(goal => {
      html += `<div class="task-item">
        <span class="task-name text-sm text-secondary">${App.esc(goal.title)}</span>
      </div>`;
    });

    html += `</div>`; // end col 1

    // ── COL 2: Habits + Tasks + Progress bar ──────────────────
    html += `<div>`;

    html += `<div class="section-header mb-8"><span class="section-title">Today's Habits</span></div>
    <div class="card mb-20">`;
    if (!todayHabits.length) {
      html += `<div class="empty-state">No habits targeted for today.</div>`;
    } else {
      todayHabits.forEach(h => {
        const done = todayDone.includes(h.id);
        html += `<div class="habit-check-item${done ? ' done' : ''}">
          <label class="checkbox-label" style="flex:1">
            <input type="checkbox" class="ov-habit-check" data-habit="${h.id}" ${done ? 'checked' : ''}>
            <span class="task-name">${App.esc(h.name)}</span>
          </label>
          ${done ? '<span class="badge badge-green">Done</span>' : ''}
        </div>`;
      });
    }
    html += `</div>`;

    html += `<div class="section-header mb-8">
      <span class="section-title">Today's Tasks</span>
      <button class="btn btn-ghost btn-sm" id="ov-refresh" ${tasksLoading ? 'disabled' : ''}>${tasksLoading ? '…' : '↻ Refresh'}</button>
    </div>
    <div class="card mb-16">`;

    if (tasksLoading) {
      html += Array(3).fill('<div class="skeleton" style="height:36px;margin-bottom:8px;border-radius:4px"></div>').join('');
    } else if (tasksError && !tasks) {
      html += `<div class="empty-state"><div class="empty-state-icon">⚠</div>${App.esc(tasksError)}</div>`;
    } else if (!tasks) {
      html += `<div class="empty-state">Hit Refresh to load tasks.</div>`;
    } else {
      const remaining = tasks.filter(t => t.status?.type !== 'closed');
      if (!remaining.length) {
        html += `<div class="empty-state">Clear schedule today.</div>`;
      } else {
        remaining.slice(0, 5).forEach(t => {
          html += `<div class="task-item">
            <span class="task-name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${App.esc(t.name)}">${App.esc(t.name)}</span>
          </div>`;
        });
        if (remaining.length > 5) {
          html += `<div class="text-xs text-muted mt-8">+${remaining.length - 5} more tasks</div>`;
        }
      }
    }
    html += `</div>`;

    html += `<div class="card">
      <div class="flex items-center justify-between mb-8">
        <span class="text-xs font-600 text-secondary" style="text-transform:uppercase;letter-spacing:.08em">Progress to $10k/mo</span>
        <span class="mono text-xs text-${progColor}">${monthlyRate > 0 ? progPct + '%' : '—'}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill ${progColor}" style="width:${progPct}%"></div></div>
      <div class="text-xs text-secondary mt-6">${monthlyRate > 0 ? `${App.formatCurrency(monthlyRate)} of ${App.formatCurrency(MONTHLY_TARGET)}` : 'No income data — sync Finances tab'}</div>
    </div>`;

    html += `</div>`; // end col 2

    // ── COL 3: Events (compact) + Equity Curve ────────────────
    html += `<div>`;

    html += `<div class="section-header mb-8"><span class="section-title">This Week</span></div>
    <div class="card mb-16" style="padding:10px 14px">`;
    if (!weekEvents.length) {
      html += `<div class="empty-state" style="padding:12px">No events this week.</div>`;
    } else {
      weekEvents.forEach(ev => {
        const evDate   = new Date(ev.date + 'T00:00:00');
        const todayD   = new Date(); todayD.setHours(0, 0, 0, 0);
        const diffDays = Math.round((evDate - todayD) / 86400000);
        const dayLabel = diffDays === 0 ? 'Today'
          : diffDays === 1 ? 'Tomorrow'
          : evDate.toLocaleDateString('en-AU', { weekday: 'short' });
        const colorMap = (typeof CAL_CATEGORY_COLORS !== 'undefined') ? CAL_CATEGORY_COLORS : {};
        const color    = colorMap[ev.category] || 'muted';
        const catLabel = ev.category ? ev.category.charAt(0).toUpperCase() + ev.category.slice(1) : '';
        html += `<div class="task-item" style="padding:7px 0">
          <span class="text-xs text-secondary" style="min-width:64px;flex-shrink:0">${dayLabel}</span>
          <span class="task-name font-500" style="font-size:13px">${App.esc(ev.title)}</span>
          ${catLabel ? `<span class="badge badge-${color}" style="font-size:10px">${catLabel}</span>` : ''}
        </div>`;
      });
    }
    html += `</div>`;

    html += `<div class="section-header mb-8"><span class="section-title">Equity Curve</span></div>
    <div class="mini-equity">${miniEquitySVG(tradeData.trades)}</div>`;

    html += `</div>`; // end col 3

    html += `</div>`; // end 3col

    container.innerHTML = html;

    // ── Events ────────────────────────────────────────────────
    container.querySelector('#ov-refresh').onclick = loadTasks;

    container.querySelectorAll('.ov-habit-check').forEach(cb => {
      cb.onchange = () => {
        const d = getHabitsData();
        if (!d.completions[todayKey]) d.completions[todayKey] = [];
        const idx = d.completions[todayKey].indexOf(cb.dataset.habit);
        if (cb.checked) { if (idx === -1) d.completions[todayKey].push(cb.dataset.habit); }
        else { if (idx > -1) d.completions[todayKey].splice(idx, 1); }
        saveHabitsData(d);
        render();
      };
    });
  }

  async function getOrFetchTeamId() {
    const cached = App.lsGet('cu_team_id', null);
    const exp    = App.lsGet('cu_team_expires', 0);
    if (cached && Date.now() < exp) return cached;
    const data = await App.apiFetch(`${App.CLICKUP_BASE}/team`);
    if (!data.teams?.length) throw new Error('No ClickUp workspace found');
    const id = data.teams[0].id;
    App.lsSet('cu_team_id', id);
    App.lsSet('cu_team_expires', Date.now() + 86400000);
    return id;
  }

  async function loadTasks() {
    tasksLoading = true; tasksError = null;
    render();
    try {
      const teamId = await getOrFetchTeamId();
      const today  = new Date();
      const url    = `${App.CLICKUP_BASE}/team/${teamId}/task?include_closed=false&subtasks=true&order_by=due_date&page=0&due_date_gt=${App.startOfDay(today)}&due_date_lt=${App.endOfDay(today)}`;
      const data   = await App.apiFetch(url);
      tasks = data.tasks || [];
      App.lsSet('cu_tasks_cache', { tasks, overdue: [], at: Date.now() });
    } catch (e) {
      tasksError = e.message;
      const cache = App.lsGet('cu_tasks_cache', null);
      if (cache) tasks = cache.tasks || [];
    }
    tasksLoading = false;
    render();
  }

  render();
}
