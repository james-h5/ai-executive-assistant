/* ============================================================
   DAILY FOCUS TAB
   ============================================================ */

function initDaily() {
  renderDaily(document.getElementById('tab-daily'));
}

const CURRENT_PRIORITIES = [
  { n: 1, text: 'Master Claude Code',                        cat: 'learning'  },
  { n: 2, text: 'Build AI OS / Executive Assistant',         cat: 'business'  },
  { n: 3, text: 'Build AI consulting foundations',           cat: 'business'  },
  { n: 4, text: 'Boxing — possible fight end of July',       cat: 'health'    },
  { n: 5, text: 'Futures trading — consistent practice',     cat: 'trading'   },
];

const CAT_COLOR = { learning: 'blue', business: 'purple', health: 'green', trading: 'amber' };

const LS_TEAM    = 'cu_team_id';
const LS_TEAMEXP = 'cu_team_expires';
const LS_CACHE   = 'cu_tasks_cache';

function renderDaily(container) {
  let loading = false;
  let tasks = null;
  let overdue = null;
  let error = null;
  let lastFetched = null;

  async function getTeamId() {
    const cached = App.lsGet(LS_TEAM, null);
    const exp = App.lsGet(LS_TEAMEXP, 0);
    if (cached && Date.now() < exp) return cached;
    const data = await App.apiFetch(`${App.CLICKUP_BASE}/team`);
    if (!data.teams?.length) throw new Error('No ClickUp workspaces found');
    const id = data.teams[0].id;
    App.lsSet(LS_TEAM, id);
    App.lsSet(LS_TEAMEXP, Date.now() + 86400000);
    return id;
  }

  async function fetchTasks(teamId, gt, lt) {
    let url = `${App.CLICKUP_BASE}/team/${teamId}/task?include_closed=false&subtasks=true&order_by=due_date&page=0`;
    if (gt !== null) url += `&due_date_gt=${gt}`;
    if (lt !== null) url += `&due_date_lt=${lt}`;
    const data = await App.apiFetch(url);
    return data.tasks || [];
  }

  async function load() {
    loading = true; error = null;
    render();
    try {
      const teamId = await getTeamId();
      const today = new Date();
      const gt = App.startOfDay(today);
      const lt = App.endOfDay(today);
      const [todayTasks, overdueTasks] = await Promise.all([
        fetchTasks(teamId, gt, lt),
        fetchTasks(teamId, null, gt),
      ]);
      tasks = todayTasks;
      overdue = overdueTasks;
      lastFetched = new Date();
      App.lsSet(LS_CACHE, { tasks, overdue, at: lastFetched.getTime() });
    } catch (e) {
      error = e.message;
      const cache = App.lsGet(LS_CACHE, null);
      if (cache) { tasks = cache.tasks; overdue = cache.overdue; lastFetched = new Date(cache.at); }
    }
    loading = false;
    render();
  }

  function taskCard(task, showOverdueDays = false) {
    const closed = task.status?.type === 'closed';
    const list = task.list?.name || '';
    const folder = !task.folder?.hidden ? (task.folder?.name || '') : '';
    const crumb = [folder, list].filter(Boolean).join(' › ');
    const dueTime = task.due_date ? new Date(parseInt(task.due_date)).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : '';
    const pri = task.priority?.id;
    const priBadge = pri === '1' ? '<span class="badge badge-red" style="font-size:10px">Urgent</span>'
                   : pri === '2' ? '<span class="badge badge-amber" style="font-size:10px">High</span>' : '';
    const overdueDays = showOverdueDays && task.due_date
      ? Math.ceil((Date.now() - parseInt(task.due_date)) / 86400000) : 0;

    return `<div class="task-item${closed ? ' completed' : ''}">
      <label class="checkbox-label items-start" style="width:100%">
        <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${closed ? 'checked' : ''} style="margin-top:2px;flex-shrink:0">
        <div style="flex:1;min-width:0">
          <div class="task-name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${App.esc(task.name)}">${App.esc(task.name)}</div>
          <div class="task-meta">
            ${crumb ? `<span>${App.esc(crumb)}</span>` : ''}
            ${dueTime ? `<span class="mono">${dueTime}</span>` : ''}
            ${priBadge}
            ${overdueDays > 0 ? `<span class="text-red">${overdueDays}d overdue</span>` : ''}
          </div>
        </div>
      </label>
    </div>`;
  }

  function render() {
    const dateStr = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    let html = `<div class="flex items-center justify-between mb-16">
      <div>
        <div class="text-xs text-secondary font-600 mb-4" style="letter-spacing:.1em;text-transform:uppercase">Daily Focus</div>
        <div style="font-size:22px;font-weight:700">${dateStr}</div>
      </div>
      <button class="btn btn-ghost" id="daily-refresh" ${loading ? 'disabled' : ''}>
        ${loading ? '<span style="opacity:.6">Loading…</span>' : '↻ Refresh'}
      </button>
    </div>`;

    if (error) {
      html += `<div class="alert alert-error">⚠ ${App.esc(error)}${tasks ? ' — showing cached data' : ''}</div>`;
    }

    if (loading) {
      html += `<div class="stats-bar mb-16">` + Array(4).fill('<div class="stat-item"><div class="skeleton" style="height:12px;width:60%;margin-bottom:8px"></div><div class="skeleton" style="height:22px;width:40%"></div></div>').join('') + `</div>`;
      html += `<div class="grid-2 gap-16">` + Array(2).fill('<div class="card skeleton" style="height:200px"></div>').join('') + `</div>`;
    } else {
      const todayTasks = tasks || [];
      const overdueTasks = overdue || [];
      const completed = todayTasks.filter(t => t.status?.type === 'closed');
      const remaining = todayTasks.length - completed.length;

      html += `<div class="stats-bar mb-16">
        <div class="stat-item"><div class="stat-label">Due Today</div><div class="stat-value">${todayTasks.length}</div></div>
        <div class="stat-item"><div class="stat-label">Done</div><div class="stat-value positive">${completed.length}</div></div>
        <div class="stat-item"><div class="stat-label">Remaining</div><div class="stat-value neutral">${remaining}</div></div>
        <div class="stat-item"><div class="stat-label">Overdue</div><div class="stat-value ${overdueTasks.length > 0 ? 'negative' : ''}">${overdueTasks.length}</div></div>
      </div>`;

      html += `<div class="grid-2 gap-16">`;

      // Today's tasks
      html += `<div>
        <div class="section-header mb-8">
          <span class="section-title">Due Today</span>
          ${lastFetched ? `<span class="text-xs text-muted">Updated ${lastFetched.toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit'})}</span>` : ''}
        </div>
        <div class="card">`;
      if (tasks === null) {
        html += `<div class="empty-state"><div class="empty-state-icon">📋</div>Hit Refresh to load your ClickUp tasks.</div>`;
      } else if (!todayTasks.length) {
        html += `<div class="empty-state"><div class="empty-state-icon">✅</div>Nothing due today — clear schedule!</div>`;
      } else {
        todayTasks.forEach(t => { html += taskCard(t, false); });
      }
      html += `</div></div>`;

      // Right column
      html += `<div>`;

      // Overdue
      html += `<div class="section-header mb-8"><span class="section-title">Overdue</span></div>
      <div class="card mb-16">`;
      if (tasks === null) {
        html += `<div class="empty-state">Hit Refresh to load.</div>`;
      } else if (!overdueTasks.length) {
        html += `<div class="empty-state"><div class="empty-state-icon">✨</div>No overdue tasks!</div>`;
      } else {
        overdueTasks.slice(0, 8).forEach(t => { html += taskCard(t, true); });
        if (overdueTasks.length > 8) html += `<div class="text-secondary text-sm mt-8">+ ${overdueTasks.length - 8} more</div>`;
      }
      html += `</div>`;

      // Current priorities
      html += `<div class="section-header mb-8"><span class="section-title">Current Focus</span></div>
      <div class="card">`;
      CURRENT_PRIORITIES.forEach(p => {
        html += `<div class="task-item">
          <span class="mono text-sm text-muted" style="min-width:18px;flex-shrink:0">${p.n}.</span>
          <span class="task-name">${App.esc(p.text)}</span>
          <span class="badge badge-${CAT_COLOR[p.cat]}" style="flex-shrink:0;font-size:10px">${p.cat}</span>
        </div>`;
      });
      html += `</div>`;

      html += `</div>`; // right col
      html += `</div>`; // grid
    }

    container.innerHTML = html;

    container.querySelector('#daily-refresh').onclick = load;

    container.querySelectorAll('.task-checkbox').forEach(cb => {
      cb.onchange = async () => {
        cb.disabled = true;
        try {
          await App.apiFetch(`${App.CLICKUP_BASE}/task/${cb.dataset.id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: cb.checked ? 'complete' : 'in progress' }),
          });
          await load();
        } catch {
          cb.disabled = false;
          cb.checked = !cb.checked;
        }
      };
    });
  }

  render();
}
