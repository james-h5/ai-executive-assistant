/* ============================================================
   CALENDAR TAB
   ============================================================ */

// ── Globals (referenced by overview.js — loaded before it) ───
const CAL_CATEGORY_COLORS = {
  boxing: 'red', business: 'blue', trading: 'purple',
  health: 'green', personal: 'amber', work: 'amber', uni: 'blue', other: 'muted',
};

function getCalendarData() { return App.lsGet('jamesOS_calendar', { events: [] }); }
function saveCalendarData(d) { App.lsSet('jamesOS_calendar', d); }

function initCalendar() {
  renderCalendar(document.getElementById('tab-calendar'));
}

function renderCalendar(container) {
  let viewYear    = new Date().getFullYear();
  let viewMonth   = new Date().getMonth(); // 0-indexed
  let showForm    = false;
  let editId      = null;
  let prefillDate = '';

  function render() {
    const data = getCalendarData();

    // Build byDate map for the grid
    const byDate = {};
    data.events.forEach(ev => {
      if (!byDate[ev.date]) byDate[ev.date] = [];
      byDate[ev.date].push(ev);
    });

    const monthName = new Date(viewYear, viewMonth, 1)
      .toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });

    // ── Header ─────────────────────────────────────────────────
    let html = `<div class="section-header mb-16">
      <div class="flex items-center gap-8">
        <button class="btn btn-ghost btn-sm" id="cal-prev">&lt;</button>
        <span style="min-width:160px;text-align:center;font-size:15px;font-weight:600">${monthName}</span>
        <button class="btn btn-ghost btn-sm" id="cal-next">&gt;</button>
      </div>
      <button class="btn btn-primary btn-sm" id="cal-add">+ Add Event</button>
    </div>`;

    // ── Form ───────────────────────────────────────────────────
    if (showForm) {
      const ed  = editId ? data.events.find(e => e.id === editId) : null;
      const v   = k => App.esc(ed?.[k] ?? (k === 'date' ? prefillDate : k === 'category' ? 'boxing' : ''));
      const sel = (k, val) => ed?.[k] === val ? ' selected' : '';
      const defCat = val => (!ed && val === 'boxing') ? ' selected' : '';

      html += `<div class="inline-form mb-16">
        <div class="form-row">
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">Title *</label>
            <input class="form-input" id="cal-f-title" value="${v('title')}" placeholder="e.g. Boxing Fight">
          </div>
          <div class="form-group">
            <label class="form-label">Date *</label>
            <input class="form-input" id="cal-f-date" type="date" value="${v('date')}">
          </div>
          <div class="form-group">
            <label class="form-label">Start Time</label>
            <input class="form-input" id="cal-f-time" type="time" value="${v('time')}">
          </div>
          <div class="form-group">
            <label class="form-label">End Time</label>
            <input class="form-input" id="cal-f-endtime" type="time" value="${v('endTime')}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">End Date</label>
            <input class="form-input" id="cal-f-enddate" type="date" value="${v('endDate')}">
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-input" id="cal-f-category">
              <option value="boxing"${sel('category','boxing')||defCat('boxing')}>Boxing</option>
              <option value="business"${sel('category','business')}>Business</option>
              <option value="trading"${sel('category','trading')}>Trading</option>
              <option value="health"${sel('category','health')}>Health</option>
              <option value="personal"${sel('category','personal')}>Personal</option>
              <option value="work"${sel('category','work')}>Work</option>
              <option value="uni"${sel('category','uni')}>Uni</option>
              <option value="other"${sel('category','other')}>Other</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">Notes</label>
            <input class="form-input" id="cal-f-notes" value="${v('notes')}" placeholder="Optional">
          </div>
        </div>
        <div class="form-actions">
          ${ed ? '<button class="btn btn-danger btn-sm" id="cal-f-del">Delete</button>' : ''}
          <button class="btn btn-ghost btn-sm" id="cal-f-cancel">Cancel</button>
          <button class="btn btn-primary btn-sm" id="cal-f-save">${ed ? 'Update' : 'Add Event'}</button>
        </div>
      </div>`;
    }

    // ── Monthly grid ───────────────────────────────────────────
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startPad     = firstOfMonth.getDay(); // 0=Sun
    const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayStr     = App.todayKey();

    const cells = [];

    // Prev-month padding
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startPad - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = viewMonth === 0 ? 12 : viewMonth;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({ dateKey: `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`, dayNum: d, isCurrentMonth: false, isToday: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      cells.push({ dateKey, dayNum: d, isCurrentMonth: true, isToday: dateKey === todayStr });
    }

    // Next-month fill to complete the last row
    let nextDay = 1;
    while (cells.length % 7 !== 0) {
      const m = viewMonth === 11 ? 1 : viewMonth + 2;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({ dateKey: `${y}-${String(m).padStart(2,'0')}-${String(nextDay).padStart(2,'0')}`, dayNum: nextDay++, isCurrentMonth: false, isToday: false });
    }

    // Day-of-week header
    html += `<div class="cal-grid mb-4">`;
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
      html += `<div class="cal-header-cell">${d}</div>`;
    });
    html += `</div>`;

    // Grid cells
    html += `<div class="cal-grid mb-24">`;
    cells.forEach(cell => {
      let cls = 'cal-day-cell';
      if (!cell.isCurrentMonth) cls += ' other-month';
      if (cell.isToday) cls += ' today';
      const eventsOnDay = byDate[cell.dateKey] || [];

      html += `<div class="${cls}" data-date="${cell.dateKey}">`;
      html += `<div class="cal-day-num">${cell.dayNum}</div>`;
      eventsOnDay.slice(0, 2).forEach(ev => {
        const color = CAL_CATEGORY_COLORS[ev.category] || 'muted';
        html += `<span class="cal-event-pill ${color}" data-event-id="${ev.id}">${App.esc(ev.title)}</span>`;
      });
      if (eventsOnDay.length > 2) {
        html += `<span class="cal-event-pill muted">+${eventsOnDay.length - 2} more</span>`;
      }
      html += `</div>`;
    });
    html += `</div>`;

    // ── Upcoming events ────────────────────────────────────────
    const today  = App.todayKey();
    const cutoff = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return App.formatDateKey(d); })();

    const upcoming = data.events
      .filter(ev => ev.date >= today && ev.date <= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

    html += `<div class="section-header mb-12"><span class="section-title">Upcoming Events</span></div>`;

    if (!upcoming.length) {
      html += `<div class="card"><div class="empty-state"><div class="empty-state-icon">📅</div>No upcoming events. Add one above.</div></div>`;
    } else {
      html += `<div class="card" style="padding:0;overflow:hidden">`;
      let lastMonth = '';
      upcoming.forEach(ev => {
        const evDate     = new Date(ev.date + 'T00:00:00');
        const monthKey   = `${evDate.getFullYear()}-${String(evDate.getMonth()+1).padStart(2,'0')}`;
        const monthLabel = evDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
        const dayLabel   = evDate.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
        const color      = CAL_CATEGORY_COLORS[ev.category] || 'muted';
        const catLabel   = ev.category ? ev.category.charAt(0).toUpperCase() + ev.category.slice(1) : '';

        if (monthKey !== lastMonth) {
          html += `<div class="text-xs font-600 text-muted" style="padding:10px 16px 4px;letter-spacing:.08em;text-transform:uppercase;border-bottom:1px solid var(--border)">${monthLabel}</div>`;
          lastMonth = monthKey;
        }

        html += `<div class="task-item" style="padding:10px 16px;align-items:center">
          <span class="badge badge-muted mono text-xs" style="flex-shrink:0;min-width:96px">${dayLabel}</span>
          ${ev.time ? `<span class="mono text-xs text-muted" style="flex-shrink:0;margin-right:4px">${ev.time}${ev.endTime ? '–' + ev.endTime : ''}</span>` : ''}
          <span class="task-name font-500">${App.esc(ev.title)}</span>
          <span class="badge badge-${color}" style="flex-shrink:0">${catLabel}</span>
          <button class="btn-icon cal-edit-btn" data-id="${ev.id}" title="Edit" style="flex-shrink:0">✎</button>
          <button class="btn-icon cal-del-btn" data-id="${ev.id}" title="Delete" style="flex-shrink:0">✕</button>
        </div>`;
      });
      html += `</div>`;
    }

    container.innerHTML = html;
    attachEvents();
  }

  function attachEvents() {
    // Month navigation
    container.querySelector('#cal-prev').onclick = () => {
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      render();
    };
    container.querySelector('#cal-next').onclick = () => {
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      render();
    };

    // Open blank add form
    container.querySelector('#cal-add').onclick = () => {
      showForm = true; editId = null; prefillDate = '';
      render();
      container.querySelector('#cal-f-title')?.focus();
    };

    // Cancel form
    container.querySelector('#cal-f-cancel')?.addEventListener('click', () => {
      showForm = false; editId = null; prefillDate = '';
      render();
    });

    // Save event (add or update)
    container.querySelector('#cal-f-save')?.addEventListener('click', () => {
      const title = container.querySelector('#cal-f-title').value.trim();
      const date  = container.querySelector('#cal-f-date').value;
      if (!title || !date) { container.querySelector('#cal-f-title').focus(); return; }
      const d = getCalendarData();
      const ev = {
        title,
        date,
        time:     container.querySelector('#cal-f-time').value,
        endTime:  container.querySelector('#cal-f-endtime').value,
        endDate:  container.querySelector('#cal-f-enddate').value,
        category: container.querySelector('#cal-f-category').value,
        notes:    container.querySelector('#cal-f-notes').value,
      };
      if (editId) {
        const idx = d.events.findIndex(e => e.id === editId);
        if (idx > -1) { ev.id = editId; d.events[idx] = ev; }
      } else {
        ev.id = App.uuid();
        d.events.push(ev);
      }
      saveCalendarData(d);
      showForm = false; editId = null; prefillDate = '';
      render();
    });

    // Delete from form
    container.querySelector('#cal-f-del')?.addEventListener('click', () => {
      if (!confirm('Delete this event?')) return;
      const d = getCalendarData();
      d.events = d.events.filter(e => e.id !== editId);
      saveCalendarData(d);
      showForm = false; editId = null;
      render();
    });

    // Click empty day cell → prefill add form with that date
    container.querySelectorAll('.cal-day-cell').forEach(cell => {
      cell.onclick = e => {
        if (e.target.classList.contains('cal-event-pill')) return;
        showForm = true; editId = null;
        prefillDate = cell.dataset.date;
        render();
        container.querySelector('#cal-f-title')?.focus();
      };
    });

    // Click event pill in grid → edit that event
    container.querySelectorAll('.cal-event-pill[data-event-id]').forEach(pill => {
      pill.onclick = e => {
        e.stopPropagation();
        editId = pill.dataset.eventId; showForm = true;
        render();
        container.querySelector('#cal-f-title')?.focus();
      };
    });

    // Edit button in upcoming list
    container.querySelectorAll('.cal-edit-btn').forEach(btn => {
      btn.onclick = () => {
        editId = btn.dataset.id; showForm = true;
        render();
        container.querySelector('#cal-f-title')?.focus();
      };
    });

    // Delete button in upcoming list
    container.querySelectorAll('.cal-del-btn').forEach(btn => {
      btn.onclick = () => {
        if (!confirm('Delete this event?')) return;
        const d = getCalendarData();
        d.events = d.events.filter(e => e.id !== btn.dataset.id);
        saveCalendarData(d);
        render();
      };
    });
  }

  render();
}
