/* ============================================================
   APP.JS — Router, clock, shared utilities
   ============================================================ */

const App = (() => {
  const CLICKUP_BASE = 'https://api.clickup.com/api/v2';

  // ── Config check ─────────────────────────────────────────

  function checkConfig() {
    if (!CONFIG || !CONFIG.clickup || !CONFIG.clickup.apiKey) {
      document.getElementById('setup-banner').classList.remove('hidden');
    }
  }

  // ── Tab router ────────────────────────────────────────────

  const tabInited = {};

  function initRouter() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => activateTab(btn.dataset.tab));
    });
  }

  function activateTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tab));
    if (!tabInited[tab]) {
      tabInited[tab] = true;
      const fn = window['init' + tab.charAt(0).toUpperCase() + tab.slice(1)];
      if (typeof fn === 'function') fn();
    }
  }

  // ── Clock ─────────────────────────────────────────────────

  function initClock() {
    const el = document.getElementById('header-clock');
    const tick = () => {
      const now = new Date();
      el.textContent = now.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
        + '  ·  ' + now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    tick();
    setInterval(tick, 1000);
  }

  // ── ClickUp fetch ─────────────────────────────────────────

  async function apiFetch(url, opts = {}) {
    if (!CONFIG || !CONFIG.clickup?.apiKey) throw new Error('ClickUp API key not configured');
    const res = await fetch(url, {
      ...opts,
      headers: { 'Authorization': CONFIG.clickup.apiKey, 'Content-Type': 'application/json', ...(opts.headers || {}) }
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 120)}`);
    }
    return res.json();
  }

  // ── localStorage ──────────────────────────────────────────

  function lsGet(key, fallback) {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  }

  function lsSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  // ── Date helpers ──────────────────────────────────────────

  function formatDateKey(d) {
    return d.getFullYear() + '-'
      + String(d.getMonth() + 1).padStart(2, '0') + '-'
      + String(d.getDate()).padStart(2, '0');
  }

  function todayKey() { return formatDateKey(new Date()); }

  function daysUntil(dateStr) {
    const target = new Date(dateStr);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / 86400000);
  }

  function startOfDay(d) { const c = new Date(d); c.setHours(0, 0, 0, 0); return c.getTime(); }
  function endOfDay(d)   { const c = new Date(d); c.setHours(23, 59, 59, 999); return c.getTime(); }

  // ── Formatting ────────────────────────────────────────────

  const fmtAUD = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtAUD2 = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function formatCurrency(n) { return fmtAUD.format(n); }
  function formatCurrencyDecimals(n) { return fmtAUD2.format(n); }

  // ── UUID & HTML escape ────────────────────────────────────

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Boot ──────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {
    checkConfig();
    initClock();
    initRouter();
    tabInited['daily'] = true;
    if (typeof initDaily === 'function') initDaily();
  });

  return { apiFetch, lsGet, lsSet, formatDateKey, todayKey, daysUntil, startOfDay, endOfDay, formatCurrency, formatCurrencyDecimals, uuid, esc, CLICKUP_BASE };
})();
