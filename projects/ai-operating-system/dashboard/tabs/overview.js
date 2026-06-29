/* ============================================================
   OVERVIEW TAB — Cockpit view
   ============================================================ */

function initOverview() {
  renderOverview(document.getElementById('tab-overview'));
}

const OV_TICK_VALUES = { MES: 5, MNQ: 2, ES: 50, NQ: 20, CL: 1000, GC: 100, RTY: 50, YM: 5, OTHER: 1 };

const OV_EVENTS = [
  { label: 'Boxing Fight',  date: '2026-07-31', icon: '🥊' },
  { label: 'Golden Gloves', date: '2026-08-31', icon: '🏆' },
];

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

    const nextEvent = OV_EVENTS
      .map(e => ({ ...e, days: App.daysUntil(e.date) }))
      .filter(e => e.days >= 0)
      .sort((a, b) => a.days - b.days)[0] || null;

    const now         = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthPnL    = tradeData.trades
      .filter(t => t.date?.startsWith(monthPrefix) && t.exitPrice)
      .reduce((sum, t) => sum + (ovPnl(t) ?? 0), 0);
    const hasTrades   = tradeData.trades.some(t => t.exitPrice);

    const monthlyRate = sheetsCache?.income?.monthlyRate || 0;
    const incomePct   = monthlyRate > 0 ? Math.round((monthlyRate / MONTHLY_TARGET) * 100) : null;

    // ── Today's habits ────────────────────────────────────────
    const todayKey     = App.todayKey();
    const todayDayKey  = ['sun','mon','tue','wed','thu','fri','sat'][now.getDay()];
    const todayHabits  = habitsData.habits.filter(h => h.targetDays.includes(todayDayKey));
    const todayDone    = habitsData.completions[todayKey] || [];

    // ── Recent trades ─────────────────────────────────────────
    const recentTrades = [...tradeData.trades]
      .filter(t => t.exitPrice)
      .sort((a, b) => b.date.localeCompare(a.date) || (b.entryTime || '').localeCompare(a.entryTime || ''))
      .slice(0, 3);

    // ── Greeting ──────────────────────────────────────────────
    const hour     = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const dateStr  = now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });

    // ── Render ────────────────────────────────────────────────
    const taskCount    = tasks ? tasks.filter(t => t.status?.type !== 'closed').length : null;
    const pnlColor     = monthPnL >= 0 ? 'positive' : 'negative';
    const pnlDisplay   = hasTrades
      ? (monthPnL >= 0 ? `+${App.formatCurrencyDecimals(monthPnL)}` : App.formatCurrencyDecimals(monthPnL))
      : '—';
    const eventColor   = nextEvent && nextEvent.days <= 14 ? 'negative' : 'neutral';

    let html = `<div class="flex items-center justify-between mb-16">
      <div>
        <div style="font-size:20px;font-weight:700">${greeting}, James</div>
        <div class="text-sm text-secondary mt-4">${dateStr}</div>
      </div>
    </div>
    <div class="stats-bar mb-20">
      <div class="stat-item">
        <div class="stat-label">Tasks Remaining</div>
        <div class="stat-value neutral">${taskCount !== null ? taskCount : (tasksLoading ? '…' : '—')}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Best Streak</div>
        <div class="stat-value">${bestStreak > 0 ? '🔥 ' + bestStreak + 'd' : '—'}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">${nextEvent ? nextEvent.label : 'Next Event'}</div>
        <div class="stat-value ${eventColor}">${nextEvent ? nextEvent.icon + ' ' + nextEvent.days + 'd' : '—'}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">P&amp;L This Month</div>
        <div class="stat-value ${hasTrades ? pnlColor : ''}">${pnlDisplay}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Income vs $10k</div>
        <div class="stat-value ${incomePct !== null && incomePct >= 100 ? 'positive' : 'neutral'}">${incomePct !== null ? incomePct + '%' : '—'}</div>
      </div>
    </div>`;

    html += `<div class="overview-2col">`;

    // ── LEFT: Habits + Goals ──────────────────────────────────
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
            <span class="task-name">${App.esc(h.icon)} ${App.esc(h.name)}</span>
          </label>
          ${done ? '<span class="badge badge-green">Done</span>' : ''}
        </div>`;
      });
    }
    html += `</div>`;

    html += `<div class="section-header mb-8"><span class="section-title">Goal Progress</span></div>
    <div class="card">`;
    GOALS_DATA.buildingToward.forEach(goal => {
      const p = goalProg[goal.id] || { progress: 0, notes: '' };
      html += `<div class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <span class="text-sm font-500">${goal.icon} ${App.esc(goal.title)}</span>
          <span class="mono text-xs text-blue">${p.progress}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill blue" style="width:${p.progress}%"></div></div>
        ${p.notes ? `<div class="text-xs text-secondary mt-4">${App.esc(p.notes)}</div>` : ''}
      </div>`;
    });
    html += `</div>`;

    html += `</div>`; // end left col

    // ── RIGHT: Tasks + Trades ─────────────────────────────────
    html += `<div>`;

    html += `<div class="section-header mb-8">
      <span class="section-title">Today's Tasks</span>
      <button class="btn btn-ghost btn-sm" id="ov-refresh" ${tasksLoading ? 'disabled' : ''}>${tasksLoading ? '…' : '↻ Refresh'}</button>
    </div>
    <div class="card mb-20">`;

    if (tasksLoading) {
      html += Array(3).fill('<div class="skeleton" style="height:36px;margin-bottom:8px;border-radius:4px"></div>').join('');
    } else if (tasksError && !tasks) {
      html += `<div class="empty-state"><div class="empty-state-icon">⚠</div>${App.esc(tasksError)}</div>`;
    } else if (!tasks) {
      html += `<div class="empty-state">Hit Refresh to load tasks.</div>`;
    } else {
      const remaining = tasks.filter(t => t.status?.type !== 'closed');
      if (!remaining.length) {
        html += `<div class="empty-state"><div class="empty-state-icon">✅</div>Clear schedule today!</div>`;
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

    html += `<div class="section-header mb-8"><span class="section-title">Recent Trades</span></div>
    <div class="card">`;
    if (!recentTrades.length) {
      html += `<div class="empty-state">No completed trades yet.</div>`;
    } else {
      recentTrades.forEach(t => {
        const net   = ovPnl(t);
        const isWin = net !== null && net > 0;
        const isLoss = net !== null && net <= 0;
        const fmtNet = net === null ? '—'
          : net >= 0 ? `+${App.formatCurrencyDecimals(net)}`
          : App.formatCurrencyDecimals(net);
        const dirBadge = t.direction === 'long'
          ? '<span class="badge badge-green" style="font-size:10px">L</span>'
          : '<span class="badge badge-red" style="font-size:10px">S</span>';
        html += `<div class="task-item">
          <span class="mono text-xs text-muted" style="min-width:74px;flex-shrink:0">${t.date}</span>
          <span class="mono text-sm font-600">${App.esc(t.instrument || '—')}</span>
          ${dirBadge}
          <span class="mono text-sm ${isWin ? 'text-green' : isLoss ? 'text-red' : ''}" style="margin-left:auto">${fmtNet}</span>
        </div>`;
      });
    }
    html += `</div>`;

    html += `</div>`; // end right col
    html += `</div>`; // end 2col

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
