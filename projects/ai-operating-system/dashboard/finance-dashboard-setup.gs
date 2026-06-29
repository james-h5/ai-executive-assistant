/**
 * James Heathcote — Finance Dashboard
 * =====================================
 * Paste this entire file into Google Apps Script (Extensions > Apps Script
 * in a blank Google Sheet), then run setupFinanceDashboard().
 *
 * Yellow cells  = enter your data manually
 * Blue-grey cells = auto-calculated formulas — don't edit
 *
 * AI OS Integration
 * -----------------
 * Run exportToJSON() at any time to get a JSON snapshot compatible with
 * the jamesOS_finances localStorage schema in finances.js.
 * Future step: publish this script as a Web App so the AI OS dashboard
 * can fetch live data from it.
 */

// ── COLOURS ──────────────────────────────────────────────────────────────────

const COLORS = {
  header:   { bg: '#1e3a5f', fg: '#ffffff' },
  section:  { bg: '#2d6a9f', fg: '#ffffff' },
  input:    { bg: '#fff9c4', fg: '#333333' },  // yellow — cells James fills in
  calc:     { bg: '#eaf2fb', fg: '#333333' },  // blue-grey — formula cells
  total:    { bg: '#d0e8f1', fg: '#0c4a6e' },
  neutral:  { bg: '#f8f9fa', fg: '#495057' },
  white:    { bg: '#ffffff', fg: '#333333' },
};

const MONTHLY_TARGET = 10000;

// ── MENU ──────────────────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Finance Tools')
    .addItem('Import Bank Statement (Westpac)', 'importBankStatement')
    .addSeparator()
    .addItem('Export to AI OS (JSON)', 'exportToJSON')
    .addToUi();
}

// ── BANK IMPORT ───────────────────────────────────────────────────────────────

function importBankStatement() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; margin: 0; font-size: 13px; }
      h3 { margin: 0 0 8px; color: #1e3a5f; }
      p { color: #555; line-height: 1.5; margin: 0 0 10px; }
      textarea { width: 100%; height: 260px; font-family: monospace; font-size: 11px; border: 1px solid #ccc; border-radius: 4px; padding: 8px; box-sizing: border-box; }
      .btn { margin-top: 10px; padding: 10px 20px; background: #1e3a5f; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
      .btn:disabled { opacity: 0.5; cursor: default; }
      .steps { background: #f0f4f8; border-radius: 4px; padding: 10px 12px; margin-bottom: 10px; }
    </style>
    <h3>Import Westpac Transactions</h3>
    <div class="steps">
      1. Westpac Online Banking → My Accounts → select account<br>
      2. Transaction History → Export → CSV → Download<br>
      3. Open the file, Ctrl+A to select all, Ctrl+C to copy<br>
      4. Paste below and click Import
    </div>
    <textarea id="csv" placeholder="Paste Westpac CSV here..."></textarea>
    <br>
    <button class="btn" id="btn" onclick="submit()">Import Transactions</button>
    <script>
      function submit() {
        const csv = document.getElementById('csv').value.trim();
        if (!csv) { alert('Please paste your CSV data first.'); return; }
        const btn = document.getElementById('btn');
        btn.textContent = 'Importing...';
        btn.disabled = true;
        google.script.run
          .withSuccessHandler(function(msg) { alert(msg); google.script.host.close(); })
          .withFailureHandler(function(err) {
            alert('Error: ' + err.message);
            btn.textContent = 'Import Transactions';
            btn.disabled = false;
          })
          .processImportedCSV(csv);
      }
    </script>
  `).setWidth(620).setHeight(460);

  SpreadsheetApp.getUi().showModalDialog(html, 'Import Bank Statement');
}

function processImportedCSV(csvText) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const expSheet = ss.getSheetByName('Expenses');
  if (!expSheet) throw new Error('Expenses tab not found. Run setupFinanceDashboard() first.');

  const rows = parseWestpacCSV(csvText);
  if (rows.length === 0) return 'No expense transactions found. Make sure you pasted a Westpac CSV with debit (money out) transactions.';

  const insertRow = Math.max(expSheet.getLastRow(), 3) + 1;
  const values = rows.map(r => [r.date, r.category, r.description, r.amount, 'imported']);

  expSheet.getRange(insertRow, 1, values.length, 5).setValues(values);
  expSheet.getRange(insertRow, 1, values.length, 1).setNumberFormat('dd/mm/yyyy');
  expSheet.getRange(insertRow, 4, values.length, 1).setNumberFormat('$#,##0.00');

  // Highlight unrecognised rows amber so James can fix the category manually
  const reviewRows = rows
    .map((r, i) => r.needsReview ? `A${insertRow + i}:E${insertRow + i}` : null)
    .filter(Boolean);
  if (reviewRows.length > 0) expSheet.getRangeList(reviewRows).setBackground('#fff3cd');

  const reviewed = reviewRows.length;
  return `Imported ${rows.length} transactions.\n${rows.length - reviewed} auto-categorised, ${reviewed} set to "Other" and highlighted amber — update the category column for those rows.`;
}

function parseWestpacCSV(csvText) {
  const lines = csvText.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];

  // ── Auto-detect column positions from header row ──────────────────────────
  let dateCol = -1, descCol = -1, debitCol = -1;
  let startRow = 0;

  const headerCols = splitCSVLine(lines[0]);
  const isHeader = headerCols.some(c => /date|narrative|narration|debit|bsb|bank/i.test(c));

  if (isHeader) {
    startRow = 1;
    headerCols.forEach((h, i) => {
      const hl = h.toLowerCase().trim();
      if (hl === 'date' || hl === 'transaction date')                              dateCol  = i;
      if (hl === 'narrative' || hl === 'narration' || hl === 'description')        descCol  = i;
      if (hl === 'debit amount' || hl === 'debit')                                 debitCol = i;
    });
  }

  // Fallback: detect by which column contains a date value
  if (dateCol === -1) {
    const sample = splitCSVLine(lines[0]);
    if (/\d{2}\/\d{2}\/\d{4}/.test(sample[1])) {
      // Format: Bank Account | Date | Narrative | Debit Amount | ...
      dateCol = 1; descCol = 2; debitCol = 3;
    } else if (/\d{2}\/\d{2}\/\d{4}/.test(sample[2])) {
      // Format: BSB | Account | Date | Narration | Cheque | Debit | ...
      dateCol = 2; descCol = 3; debitCol = 5;
    } else {
      throw new Error('Could not detect CSV format. Make sure you exported a Westpac transaction CSV (not a PDF or statement).');
    }
  }

  const results = [];

  for (let i = startRow; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.length <= Math.max(dateCol, descCol, debitCol)) continue;

    const dateStr  = cols[dateCol].trim();
    const desc     = cols[descCol].trim();
    const debitStr = cols[debitCol].trim();

    // Skip internal transfers (savings/offset account transfers — not real expenses)
    if (/TFR Westpac Lif/i.test(desc) || /TRANSFER TO OWN/i.test(desc)) continue;

    // Only import debits (money out = expenses)
    const debit = parseFloat(debitStr);
    if (!debitStr || isNaN(debit) || debit <= 0) continue;

    // Parse DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length !== 3) continue;
    const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    if (isNaN(date.getTime())) continue;

      const cat = categorizeTransaction(desc);
    results.push({ date, description: desc, amount: debit, category: cat === '❓ Review' ? 'Other' : cat, needsReview: cat === '❓ Review' });
  }

  return results;
}

function splitCSVLine(line) {
  const result = [];
  let cur = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQuotes = !inQuotes; }
    else if (line[i] === ',' && !inQuotes) { result.push(cur); cur = ''; }
    else { cur += line[i]; }
  }
  result.push(cur);
  return result;
}

function categorizeTransaction(description) {
  const d = description.toUpperCase();
  const rules = [
    { cat: 'Food & Groceries', kw: ['WOOLWORTHS', 'WW ', 'COLES', 'ALDI', ' IGA ', 'HARRIS FARM', 'GROCERY', 'BUTCHER', 'BAKERY', 'BLACKBUTT BAKERY', 'QUT GUILD'] },
    { cat: 'Eating Out',       kw: ['MCDONALD', 'MCDONALDS', 'HJS ', 'HJ\'S', 'HUNGRY JACK', 'KFC', 'NANDOS', "GRILL'D", 'UBEREATS', 'UBER EATS', 'DELIVEROO', 'MENULOG', 'DOORDASH', 'CAFE', 'COFFEE', 'STARBUCKS', 'RESTAURANT', 'SUSHI', 'THAI', 'PIZZA', 'SUBWAY', 'DOMINO', 'KEBAB', 'GUZMAN', 'RED ROOSTER', 'YO-CHI', 'PAELLA', 'LUCKY BOWL', 'DER WURST', 'GRIND CAFE', 'BOATHOUSE', 'WURST', 'SQ *'] },
    { cat: 'Transport',        kw: ['TRANSLINK', 'GO CARD', 'GOCARD', 'QUEENSLAND RAIL', 'UBER', 'OLA ', 'DIDI', 'TAXI', ' BP ', 'CALTEX', 'AMPOL', 'SHELL ', '7-ELEVEN', 'PETROL', 'PARKING', 'QUT PARKING', 'LIME*RIDE', 'LIME RIDE'] },
    { cat: 'Gym / Boxing',     kw: ['NEONBOXING', 'BOXING', 'GOODLIFE', ' GYM ', 'FITNESS', 'PLANET FITNESS', 'ANYTIME FITNESS', 'F45', 'CROSSFIT', 'PAYRIX*NEON'] },
    { cat: 'Subscriptions',    kw: ['NETFLIX', 'SPOTIFY', 'CLAUDE', 'ANTHROPIC', 'APPLE.COM', 'APPLE STORE', 'GOOGLE', 'AMAZON PRIME', 'DISNEY', 'CHATGPT', 'OPENAI', 'MICROSOFT', 'ADOBE', 'TRADINGVIEW', 'PLAYSTATION', 'FANBASIS'] },
    { cat: 'Entertainment',    kw: ['EVENT CINEMA', 'HOYTS', 'VILLAGE CINEMA', 'CINEPLEX', 'VRTP', 'TIMEZONE', 'BOWLING', 'PROHIBITION', 'NIGHTCLUB', 'ALH VENUES', 'ALHGROUP', 'HOTEL', 'FINN MCCOOL', 'FINNMCCOOL', 'BEACH BAR', 'GRAND VIEW', 'SLSSC', 'DOCK ', 'BEACH HOTEL', 'MOOLOOLABA', 'NOOSA', 'STRADDR'] },
    { cat: 'Clothing',         kw: ['KMART', 'COTTON ON', 'H&M', 'UNIQLO', 'MYER', 'DAVID JONES', 'TARGET', 'BIG W', 'FACTORIE', 'SUPRE', 'JD SPORT', 'REBEL SPORT', 'FOOT LOCKER', 'HIDDEN IDENTITY'] },
    { cat: 'Health',           kw: ['PHARMACY', 'CHEMIST', 'PRICELINE', 'DOCTOR', 'MEDICAL', 'DENTAL', 'HOSPITAL', 'MEDICARE', 'OPTICAL'] },
    { cat: 'Rent / Board',     kw: ['RENT', 'BOARD PAYMENT', 'REAL ESTATE', 'LEASE'] },
    { cat: 'Education',        kw: ['QUT PARKING', 'QUT ', 'GRIFFITH UNI', 'UNIVERSITY', 'TAFE', 'UDEMY', 'COURSERA'] },
    { cat: 'Business',         kw: ['OFFICEWORKS', 'BUNNINGS', 'HARVEY NORMAN', 'JB HI-FI', 'API CREDIT', 'WWW.ALHGROUP'] },
  ];

  // Note: 'SQ *' catches Square POS payments (cafes, bars etc.) → Eating Out
  // WITHDRAWAL-OSKO to people (bill splits) → left as ❓ Review for manual categorisation

  for (const rule of rules) {
    if (rule.kw.some(kw => d.includes(kw))) return rule.cat;
  }
  return '❓ Review';
}

// ── WEB APP ENDPOINT (for AI OS integration) ──────────────────────────────────
//
// Deploy this script as a Web App:
//   Apps Script editor → Deploy → New deployment → Web App
//   Execute as: Me | Who has access: Anyone
// Then paste the URL into finances.js SHEETS_WEB_APP_URL.

function doGet(e) {
  const data = buildExportData();
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function buildExportData() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const inv  = ss.getSheetByName('Investments');
  const dash = ss.getSheetByName('Dashboard');
  const log  = ss.getSheetByName('Income Log');
  const exp  = ss.getSheetByName('Expenses');

  // Investments rows 4-6
  const investments = [];
  for (let r = 4; r <= 6; r++) {
    const name = inv.getRange(r, 1).getValue();
    if (!name || name === '') continue;
    investments.push({
      asset:     String(name),
      value:     inv.getRange(r, 5).getValue() || 0,
      gainLoss:  inv.getRange(r, 6).getValue() || 0,
      returnPct: inv.getRange(r, 7).getValue() || 0,
    });
  }

  // Latest weekly income
  const lastLogRow = log.getLastRow();
  const latestWeekly = lastLogRow >= 4 ? (log.getRange(lastLogRow, 7).getValue() || 0) : 0;

  // This month's expenses — total + by category
  const today = new Date();
  const expLastRow = exp.getLastRow();
  let thisMonthExpenses = 0;
  const byCategory = {};
  if (expLastRow >= 4) {
    const expData = exp.getRange(4, 1, expLastRow - 3, 4).getValues();
    expData.forEach(row => {
      const d = row[0];
      if (!(d instanceof Date) || d.getMonth() !== today.getMonth() || d.getFullYear() !== today.getFullYear()) return;
      const amount = parseFloat(row[3]) || 0;
      const cat    = String(row[1] || 'Other');
      thisMonthExpenses += amount;
      byCategory[cat] = (byCategory[cat] || 0) + amount;
    });
  }
  // Round all category values
  Object.keys(byCategory).forEach(k => { byCategory[k] = +byCategory[k].toFixed(2); });

  return {
    timestamp: new Date().toISOString(),
    netWorth: {
      cash:             dash.getRange(5, 2).getValue() || 0,
      totalInvestments: dash.getRange(6, 2).getValue() || 0,
      liabilities:      dash.getRange(7, 2).getValue() || 0,
      netWorth:         dash.getRange(8, 2).getValue() || 0,
    },
    income: {
      latestWeekly:  latestWeekly,
      monthlyRate:   +(latestWeekly * 4.33).toFixed(2),
      targetMonthly: MONTHLY_TARGET,
      gapToTarget:   +Math.max(0, MONTHLY_TARGET - latestWeekly * 4.33).toFixed(2),
    },
    expenses: {
      thisMonth:  +thisMonthExpenses.toFixed(2),
      byCategory,
    },
    investments,
  };
}

// ── MAIN SETUP ────────────────────────────────────────────────────────────────

function setupFinanceDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const TABS = ['Dashboard', 'Investments', 'Income Log', 'Expenses', 'Net Worth History'];

  // Create any missing tabs
  TABS.forEach(name => {
    if (!ss.getSheetByName(name)) ss.insertSheet(name);
  });

  // Delete any tabs not in our list
  ss.getSheets()
    .filter(s => !TABS.includes(s.getName()))
    .forEach(s => ss.deleteSheet(s));

  // Reorder tabs
  TABS.forEach((name, i) => {
    ss.setActiveSheet(ss.getSheetByName(name));
    ss.moveActiveSheet(i + 1);
  });

  // Build data tabs first so Dashboard formulas resolve correctly
  buildInvestments(ss);
  buildIncomeLog(ss);
  buildExpenses(ss);
  buildNetWorthHistory(ss);
  buildDashboard(ss);

  ss.setActiveSheet(ss.getSheetByName('Dashboard'));

  SpreadsheetApp.getUi().alert(
    'Finance Dashboard ready!\n\n' +
    'Yellow = enter your data\n' +
    'Blue-grey = auto-calculated\n\n' +
    'Start by filling in the Investments tab and this week\'s Income Log row.'
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
//
// Layout (2 columns, left = Net Worth, right = Income):
//
//  Row 1  | Title (merged)
//  Row 2  | Last updated
//  Row 3  | (spacer)
//  Row 4  | [NET WORTH header]      | [INCOME header]
//  Row 5  | Cash                B5  | Latest weekly      E5
//  Row 6  | Total investments   B6  | Monthly rate       E6
//  Row 7  | Liabilities         B7  | Gap to $10k        E7
//  Row 8  | NET WORTH           B8  | Progress to $10k   E8
//  Row 9  | (spacer)
//  Row 10 | [INVESTMENTS SUMMARY header]
//  Row 11 | Column sub-headers
//  Row 12 | S&P 500 (pulls from Investments row 4)
//  Row 13 | XRP     (pulls from Investments row 5)
//  Row 14 | Futures (pulls from Investments row 6)
//  Row 15 | TOTAL

function buildDashboard(ss) {
  const sh = ss.getSheetByName('Dashboard');
  sh.clear();
  sh.setColumnWidth(1, 220);
  sh.setColumnWidth(2, 160);
  sh.setColumnWidth(3, 30);   // visual gap
  sh.setColumnWidth(4, 220);
  sh.setColumnWidth(5, 160);

  // Row 1 — Title
  sh.getRange(1, 1, 1, 5).merge()
    .setValue('FINANCE DASHBOARD')
    .setBackground(COLORS.header.bg).setFontColor(COLORS.header.fg)
    .setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center');

  // Row 2 — Last updated
  sh.getRange(2, 1, 1, 5).merge()
    .setFormula('="Last updated: "&TEXT(NOW(),"dd mmm yyyy")')
    .setBackground(COLORS.neutral.bg).setFontColor('#888888')
    .setFontSize(9).setFontStyle('italic').setHorizontalAlignment('center');

  // Row 3 — spacer
  sh.getRange(3, 1, 1, 5).setBackground('#ffffff');

  // Row 4 — Section headers
  sectionHeader(sh, 4, 1, 'NET WORTH', 2);
  sectionHeader(sh, 4, 4, 'INCOME', 2);

  // Row 5 — Cash | Latest weekly income
  rowLabel(sh, 5, 1, 'Cash (bank balance)');
  inputCell(sh, 5, 2, 0, '$#,##0.00');
  rowLabel(sh, 5, 4, 'Latest weekly income');
  // Find the last non-empty Total value in Income Log
  calcCell(sh, 5, 5, "=IFERROR(LOOKUP(2,1/(('Income Log'!G4:G500<>\"\")*('Income Log'!G4:G500<>0)),'Income Log'!G4:G500),0)", '$#,##0.00');

  // Row 6 — Total investments | Monthly rate
  rowLabel(sh, 6, 1, 'Total investments');
  calcCell(sh, 6, 2, '=IFERROR(SUM(Investments!E4:E6),0)', '$#,##0.00');
  rowLabel(sh, 6, 4, 'Monthly rate (x4.33)');
  calcCell(sh, 6, 5, '=E5*4.33', '$#,##0.00');

  // Row 7 — Liabilities | Gap to $10k
  rowLabel(sh, 7, 1, 'Liabilities');
  inputCell(sh, 7, 2, 0, '$#,##0.00');
  rowLabel(sh, 7, 4, 'Gap to $10,000/month');
  calcCell(sh, 7, 5, '=MAX(0,10000-E6)', '$#,##0.00');

  // Row 8 — Net Worth | Progress
  rowLabel(sh, 8, 1, 'NET WORTH', true);
  calcCell(sh, 8, 2, '=B5+B6-B7', '$#,##0.00', true);
  sh.getRange(8, 2).setFontSize(13);
  rowLabel(sh, 8, 4, 'Progress to $10k/mo', true);
  calcCell(sh, 8, 5, '=IFERROR(MIN(1,E6/10000),0)', '0.0%', true);

  // Progress bar using SPARKLINE
  sh.getRange(9, 4, 1, 2).merge()
    .setFormula('=SPARKLINE({E8,1-E8},{\"charttype\",\"bar\";\"color1\",IF(E8>=1,\"#28a745\",\"#007bff\");\"color2\",\"#dee2e6\";\"max\",1})')
    .setBackground('#ffffff');

  // Row 10 — spacer above investments summary
  sh.getRange(10, 1, 1, 5).setBackground('#ffffff');

  // Row 11 — Investments Summary header
  sectionHeader(sh, 11, 1, 'INVESTMENTS SUMMARY', 5);

  // Row 12 — column sub-headers
  ['Asset', 'Value', '', 'Units / Balance', 'Return %'].forEach((h, i) => {
    sh.getRange(12, i + 1).setValue(h)
      .setFontWeight('bold').setBackground('#dce8f5')
      .setFontColor('#1a3a5c').setHorizontalAlignment('center');
  });

  // Rows 13-15 — pull from Investments rows 4, 5, 6
  [4, 5, 6].forEach((invRow, i) => {
    const r = 13 + i;
    const bg = i % 2 === 0 ? COLORS.white.bg : COLORS.neutral.bg;
    sh.getRange(r, 1).setFormula(`=IFERROR(Investments!A${invRow},"")`).setBackground(bg);
    sh.getRange(r, 2).setFormula(`=IFERROR(Investments!E${invRow},0)`).setNumberFormat('$#,##0.00').setBackground(bg);
    sh.getRange(r, 3).setBackground(bg);
    sh.getRange(r, 4).setFormula(`=IFERROR(IF(Investments!B${invRow}="N/A","(balance)",TEXT(Investments!B${invRow},"#,##0.######")),"")`).setBackground(bg).setHorizontalAlignment('center');
    sh.getRange(r, 5).setFormula(`=IFERROR(Investments!G${invRow},0)`).setNumberFormat('0.00%').setBackground(bg);
  });

  // Row 16 — Total
  sh.getRange(16, 1).setValue('TOTAL').setFontWeight('bold').setBackground(COLORS.total.bg).setFontColor(COLORS.total.fg);
  sh.getRange(16, 2).setFormula('=IFERROR(SUM(Investments!E4:E6),0)').setNumberFormat('$#,##0.00')
    .setBackground(COLORS.total.bg).setFontColor(COLORS.total.fg).setFontWeight('bold');
  sh.getRange(16, 3, 1, 3).setBackground(COLORS.total.bg);

  // ── EXPENSES THIS MONTH ───────────────────────────────────────────────────────
  // Rows 17-30 — expense breakdown by category + savings metrics

  // Row 17 spacer
  sh.getRange(17, 1, 1, 5).setBackground('#ffffff');

  // Row 18 section header
  sectionHeader(sh, 18, 1, 'EXPENSES — THIS MONTH', 5);

  // Row 19 column sub-headers
  sh.getRange(19, 1).setValue('Category').setFontWeight('bold').setBackground('#dce8f5').setFontColor('#1a3a5c');
  sh.getRange(19, 2).setValue('Amount').setFontWeight('bold').setBackground('#dce8f5').setFontColor('#1a3a5c').setHorizontalAlignment('right');
  sh.getRange(19, 3).setBackground('#dce8f5');
  sh.getRange(19, 4).setValue('Savings').setFontWeight('bold').setBackground('#dce8f5').setFontColor('#1a3a5c');
  sh.getRange(19, 5).setValue('Amount').setFontWeight('bold').setBackground('#dce8f5').setFontColor('#1a3a5c').setHorizontalAlignment('right');

  // Expense categories with SUMPRODUCT formulas — rows 20-27
  const expCategories = [
    'Food & Groceries',
    'Eating Out',
    'Transport',
    'Gym / Boxing',
    'Subscriptions',
    'Rent / Board',
    'Clothing',
    'Other',
  ];

  // Helper: SUMPRODUCT for a category in current month
  function expFormula(cat) {
    const base = "(MONTH(Expenses!$A$4:$A$500)=MONTH(TODAY()))*(YEAR(Expenses!$A$4:$A$500)=YEAR(TODAY()))";
    if (cat === 'Other') {
      // Other = anything not in the known categories (includes ❓ Review)
      const known = expCategories.slice(0, -1).map(c => `(Expenses!$B$4:$B$500<>"${c}")`).join('*');
      return `=SUMPRODUCT(${base}*${known}*Expenses!$D$4:$D$500)`;
    }
    return `=SUMPRODUCT(${base}*(Expenses!$B$4:$B$500="${cat}")*Expenses!$D$4:$D$500)`;
  }

  // Total expenses formula
  const totalExpFormula = '=SUMPRODUCT((MONTH(Expenses!$A$4:$A$500)=MONTH(TODAY()))*(YEAR(Expenses!$A$4:$A$500)=YEAR(TODAY()))*Expenses!$D$4:$D$500)';

  expCategories.forEach((cat, i) => {
    const r = 20 + i;
    const bg = i % 2 === 0 ? COLORS.white.bg : COLORS.neutral.bg;
    rowLabel(sh, r, 1, cat);
    sh.getRange(r, 1).setBackground(bg);
    sh.getRange(r, 2).setFormula(expFormula(cat)).setNumberFormat('$#,##0.00').setBackground(bg).setHorizontalAlignment('right');
    sh.getRange(r, 3).setBackground(bg);

    // Right column — savings metrics in first 3 rows
    if (i === 0) {
      rowLabel(sh, r, 4, 'Total Expenses', true);
      sh.getRange(r, 5).setFormula(totalExpFormula).setNumberFormat('$#,##0.00').setBackground(COLORS.calc.bg).setFontWeight('bold');
    } else if (i === 1) {
      rowLabel(sh, r, 4, 'Net Savings');
      sh.getRange(r, 5).setFormula(`=E6-E${r-1}`).setNumberFormat('$#,##0.00').setBackground(COLORS.calc.bg);
    } else if (i === 2) {
      rowLabel(sh, r, 4, 'Savings Rate');
      sh.getRange(r, 5).setFormula(`=IFERROR(E${r-1}/E6,0)`).setNumberFormat('0.0%').setBackground(COLORS.calc.bg);
    } else {
      sh.getRange(r, 4, 1, 2).setBackground(COLORS.neutral.bg);
    }
  });

  // Row 28 — Total
  const totalExpRow = 20 + expCategories.length;
  sh.getRange(totalExpRow, 1).setValue('TOTAL').setFontWeight('bold').setBackground(COLORS.total.bg).setFontColor(COLORS.total.fg);
  sh.getRange(totalExpRow, 2).setFormula(totalExpFormula).setNumberFormat('$#,##0.00')
    .setBackground(COLORS.total.bg).setFontColor(COLORS.total.fg).setFontWeight('bold').setHorizontalAlignment('right');
  sh.getRange(totalExpRow, 3, 1, 3).setBackground(COLORS.total.bg);

  // Conditional formatting: Savings Rate red if negative, green if > 20%
  const savingsRateCell = sh.getRange(22, 5);
  const srGreenRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThanOrEqualTo(0.2)
    .setBackground('#d4edda').setFontColor('#155724')
    .setRanges([savingsRateCell]).build();
  const srRedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0)
    .setBackground('#f8d7da').setFontColor('#721c24')
    .setRanges([savingsRateCell]).build();

  // ── CONDITIONAL FORMATTING (applied all at once) ──────────────────────────
  // Conditional formatting: Net Worth cell green if positive
  const nwRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0)
    .setBackground('#d4edda').setFontColor('#155724')
    .setRanges([sh.getRange(8, 2)]).build();
  const gapRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0)
    .setBackground('#fff3cd').setFontColor('#856404')
    .setRanges([sh.getRange(7, 5)]).build();
  sh.setConditionalFormatRules([nwRule, gapRule, srGreenRule, srRedRule]);
}

// ── INVESTMENTS ───────────────────────────────────────────────────────────────
//
// Columns: A=Asset | B=Units | C=Avg Buy Price | D=Current Price | E=Total Value | F=Gain/Loss $ | G=Gain/Loss % | H=Notes
//
// Rows:
//   1  Title
//   2  Instructions
//   3  Headers
//   4  S&P 500 (VOO/SPX)
//   5  XRP
//   6  Futures Trading Account  (B="N/A", C=Total Deposits, D="N/A", E=Account Balance)
//   7  (spacer)
//   8  TOTALS

function buildInvestments(ss) {
  const sh = ss.getSheetByName('Investments');
  sh.clear();
  sh.setColumnWidth(1, 200);
  sh.setColumnWidth(2, 120);
  sh.setColumnWidth(3, 140);
  sh.setColumnWidth(4, 140);
  sh.setColumnWidth(5, 140);
  sh.setColumnWidth(6, 140);
  sh.setColumnWidth(7, 120);
  sh.setColumnWidth(8, 260);

  // Title
  sh.getRange(1, 1, 1, 8).merge()
    .setValue('INVESTMENTS')
    .setBackground(COLORS.header.bg).setFontColor(COLORS.header.fg)
    .setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center');

  // Instructions
  sh.getRange(2, 1, 1, 8).merge()
    .setValue('Yellow = enter your data. Update "Current Price" weekly. Futures Account: Col C = total deposits, Col E = current account balance.')
    .setBackground(COLORS.neutral.bg).setFontColor('#666666')
    .setFontSize(9).setFontStyle('italic').setHorizontalAlignment('center');

  // Headers (row 3) — one batch write
  sh.getRange(3, 1, 1, 8)
    .setValues([['Asset', 'Units', 'Avg Buy Price', 'Current Price', 'Total Value', 'Gain / Loss $', 'Return %', 'Notes']])
    .setBackground(COLORS.section.bg).setFontColor(COLORS.section.fg)
    .setFontWeight('bold').setHorizontalAlignment('center');

  // Row 4 — Nasdaq (NDQ)
  sh.getRange(4, 1).setValue('Nasdaq (NDQ)').setFontWeight('bold').setBackground(COLORS.white.bg);
  inputCell(sh, 4, 2, 0, '#,##0.000000');  // units (e.g. 3.456789 shares)
  inputCell(sh, 4, 3, 0, '$#,##0.00');     // avg buy price
  inputCell(sh, 4, 4, 0, '$#,##0.00');     // current price — update regularly
  calcCell(sh, 4, 5, '=B4*D4', '$#,##0.00');             // total value
  calcCell(sh, 4, 6, '=(D4-C4)*B4', '$#,##0.00');        // gain/loss $
  calcCell(sh, 4, 7, '=IF(C4>0,(D4-C4)/C4,0)', '0.00%'); // return %
  sh.getRange(4, 8).setValue('Update current price weekly from TradingView / broker')
    .setBackground(COLORS.white.bg).setFontColor('#888888').setFontSize(9);

  // Row 5 — XRP
  sh.getRange(5, 1).setValue('XRP').setFontWeight('bold').setBackground(COLORS.neutral.bg);
  inputCell(sh, 5, 2, 0, '#,##0.000000');  // units
  inputCell(sh, 5, 3, 0, '$#,##0.0000');   // avg buy price
  inputCell(sh, 5, 4, 0, '$#,##0.0000');   // current price
  calcCell(sh, 5, 5, '=B5*D5', '$#,##0.00');
  calcCell(sh, 5, 6, '=(D5-C5)*B5', '$#,##0.00');
  calcCell(sh, 5, 7, '=IF(C5>0,(D5-C5)/C5,0)', '0.00%');
  sh.getRange(5, 8).setValue('Update current price weekly — CoinGecko / exchange')
    .setBackground(COLORS.neutral.bg).setFontColor('#888888').setFontSize(9);

  // Row 6 — Futures Trading Account
  // Col B = "N/A" (no units), Col C = total deposits, Col D = "N/A", Col E = account balance
  sh.getRange(6, 1).setValue('Futures Trading Account').setFontWeight('bold').setBackground(COLORS.white.bg);
  sh.getRange(6, 2).setValue('N/A').setHorizontalAlignment('center')
    .setFontColor('#aaaaaa').setBackground(COLORS.white.bg);
  inputCell(sh, 6, 3, 0, '$#,##0.00');  // total deposits
  sh.getRange(6, 4).setValue('N/A').setHorizontalAlignment('center')
    .setFontColor('#aaaaaa').setBackground(COLORS.input.bg);
  inputCell(sh, 6, 5, 0, '$#,##0.00'); // account balance
  calcCell(sh, 6, 6, '=E6-C6', '$#,##0.00');             // net P&L
  calcCell(sh, 6, 7, '=IF(C6>0,(E6-C6)/C6,0)', '0.00%'); // return %
  sh.getRange(6, 8).setValue('Col C = total deposits made | Col E = current account balance')
    .setBackground(COLORS.white.bg).setFontColor('#888888').setFontSize(9);

  // Row 7 — spacer
  sh.getRange(7, 1, 1, 8).setBackground('#ffffff');

  // Row 8 — Totals
  sh.getRange(8, 1, 1, 8).setBackground(COLORS.total.bg);
  sh.getRange(8, 1).setValue('TOTAL PORTFOLIO')
    .setFontWeight('bold').setFontColor(COLORS.total.fg).setBackground(COLORS.total.bg);
  calcCell(sh, 8, 5, '=SUM(E4:E6)', '$#,##0.00', true);
  sh.getRange(8, 5).setFontColor(COLORS.total.fg);
  calcCell(sh, 8, 6, '=SUM(F4:F6)', '$#,##0.00', true);
  sh.getRange(8, 6).setFontColor(COLORS.total.fg);
  sh.getRange(8, 2, 1, 3).setBackground(COLORS.total.bg);
  sh.getRange(8, 7, 1, 2).setBackground(COLORS.total.bg);

  // Conditional formatting: Gain/Loss columns green if positive, red if negative
  const gainRange = sh.getRange(4, 6, 3, 2);
  const posRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0)
    .setBackground('#d4edda').setFontColor('#155724')
    .setRanges([gainRange]).build();
  const negRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0)
    .setBackground('#f8d7da').setFontColor('#721c24')
    .setRanges([gainRange]).build();
  sh.setConditionalFormatRules([posRule, negRule]);

  sh.setFrozenRows(3);
}

// ── INCOME LOG ────────────────────────────────────────────────────────────────
//
// Columns: A=Week Ending | B=Bartending | C=Tutoring | D=AI Consulting | E=Trading | F=Other | G=Total

function buildIncomeLog(ss) {
  const sh = ss.getSheetByName('Income Log');
  sh.clear();
  sh.setColumnWidth(1, 130);
  sh.setColumnWidth(2, 120);
  sh.setColumnWidth(3, 120);
  sh.setColumnWidth(4, 140);
  sh.setColumnWidth(5, 120);
  sh.setColumnWidth(6, 120);
  sh.setColumnWidth(7, 120);

  // Title
  sh.getRange(1, 1, 1, 7).merge()
    .setValue('INCOME LOG — Weekly')
    .setBackground(COLORS.header.bg).setFontColor(COLORS.header.fg)
    .setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center');

  sh.getRange(2, 1, 1, 7).merge()
    .setValue('"Week Ending" = last day of that working week. Pre-filled with your known defaults. Add a new row each week.')
    .setBackground(COLORS.neutral.bg).setFontColor('#666666')
    .setFontSize(9).setFontStyle('italic').setHorizontalAlignment('center');

  // Headers (row 3) — one batch write
  sh.getRange(3, 1, 1, 7)
    .setValues([['Week Ending', 'Bartending', 'Tutoring', 'AI Consulting', 'Trading', 'Other', 'Total']])
    .setBackground(COLORS.section.bg).setFontColor(COLORS.section.fg)
    .setFontWeight('bold').setHorizontalAlignment('center');

  // Row 4 — pre-fill this week with known defaults
  const today = new Date();
  const daysToSunday = (7 - today.getDay()) % 7;
  const sunday = new Date(today);
  sunday.setDate(today.getDate() + daysToSunday);

  inputCell(sh, 4, 1, sunday, 'dd/mm/yyyy');
  sh.getRange(4, 2, 1, 5).setValues([[500, 110, 0, 0, 0]]).setNumberFormat('$#,##0.00').setBackground(COLORS.input.bg);
  calcCell(sh, 4, 7, '=SUM(B4:F4)', '$#,##0.00', true);

  // ── Batch format 50 empty rows (rows 5–54) ──────────────────────────────────
  const ROWS = 50;
  const START = 5;

  // 1. Entire block white
  sh.getRange(START, 1, ROWS, 7).setBackground(COLORS.white.bg);

  // 2. Alternating rows neutral — single getRangeList call
  const altRanges = [];
  for (let i = 1; i < ROWS; i += 2) altRanges.push(`A${START + i}:G${START + i}`);
  sh.getRangeList(altRanges).setBackground(COLORS.neutral.bg);

  // 3. Column formats — one call per column group
  sh.getRange(START, 1, ROWS, 1).setNumberFormat('dd/mm/yyyy');
  sh.getRange(START, 2, ROWS, 5).setNumberFormat('$#,##0.00');

  // 4. Total column — build array then write all formulas at once
  const totalFormulas = [];
  for (let i = 0; i < ROWS; i++) {
    const r = START + i;
    totalFormulas.push([`=IF(COUNTA(B${r}:F${r})>0,SUM(B${r}:F${r}),"")`]);
  }
  sh.getRange(START, 7, ROWS, 1)
    .setFormulas(totalFormulas)
    .setNumberFormat('$#,##0.00')
    .setFontWeight('bold')
    .setBackground(COLORS.calc.bg);

  sh.setFrozenRows(3);
}

// ── EXPENSES ──────────────────────────────────────────────────────────────────
//
// Columns: A=Date | B=Category | C=Description | D=Amount | E=Notes

function buildExpenses(ss) {
  const sh = ss.getSheetByName('Expenses');
  sh.clear();
  sh.setColumnWidth(1, 110);
  sh.setColumnWidth(2, 170);
  sh.setColumnWidth(3, 280);
  sh.setColumnWidth(4, 120);
  sh.setColumnWidth(5, 220);

  // Title
  sh.getRange(1, 1, 1, 5).merge()
    .setValue('EXPENSES')
    .setBackground(COLORS.header.bg).setFontColor(COLORS.header.fg)
    .setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center');

  sh.getRange(2, 1, 1, 5).merge()
    .setValue('Log expenses as they happen, or paste from a bank CSV export monthly. Category dropdown provided.')
    .setBackground(COLORS.neutral.bg).setFontColor('#666666')
    .setFontSize(9).setFontStyle('italic').setHorizontalAlignment('center');

  // Headers (row 3)
  ['Date', 'Category', 'Description', 'Amount', 'Notes'].forEach((h, i) => {
    sh.getRange(3, i + 1)
      .setValue(h)
      .setBackground(COLORS.section.bg).setFontColor(COLORS.section.fg)
      .setFontWeight('bold').setHorizontalAlignment('center');
  });

  // Category dropdown
  const categories = [
    'Food & Groceries', 'Eating Out', 'Transport', 'Rent / Board',
    'Gym / Boxing', 'Subscriptions', 'Clothing', 'Entertainment',
    'Health', 'Education', 'Business', 'Other',
  ];
  const catRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(categories, true)
    .setAllowInvalid(false)
    .build();
  sh.getRange(4, 2, 200, 1).setDataValidation(catRule);

  // Sample rows — write all values in one batch
  const today = new Date();
  const sampleValues = [
    [today, 'Food & Groceries', 'Woolworths weekly shop', 80, ''],
    [today, 'Gym / Boxing',     'Boxing gym membership',  60, 'Monthly fee'],
    [today, 'Subscriptions',    'Claude Pro',              20, 'Monthly'],
    [today, 'Transport',        'Petrol / Uber',           40, ''],
  ];
  sh.getRange(4, 1, sampleValues.length, 5).setValues(sampleValues);
  sh.getRange(4, 1, sampleValues.length, 1).setNumberFormat('dd/mm/yyyy');
  sh.getRange(4, 4, sampleValues.length, 1).setNumberFormat('$#,##0.00');

  // ── Batch format 100 empty rows after samples ────────────────────────────────
  const ROWS = 100;
  const START = 4 + sampleValues.length;

  // 1. Entire block white
  sh.getRange(START, 1, ROWS, 5).setBackground(COLORS.white.bg);

  // 2. Alternating rows neutral — single getRangeList call
  const altRanges = [];
  for (let i = 1; i < ROWS; i += 2) altRanges.push(`A${START + i}:E${START + i}`);
  sh.getRangeList(altRanges).setBackground(COLORS.neutral.bg);

  // 3. Column formats — one call each
  sh.getRange(START, 1, ROWS, 1).setNumberFormat('dd/mm/yyyy');
  sh.getRange(START, 4, ROWS, 1).setNumberFormat('$#,##0.00');

  sh.setFrozenRows(3);
}

// ── NET WORTH HISTORY ─────────────────────────────────────────────────────────
//
// Columns: A=Date | B=Cash | C=Total Investments | D=Liabilities | E=Net Worth | F=vs Last Month
//
// Row 4 pulls live from Dashboard. Subsequent rows are manual monthly snapshots.
// At end of each month: copy row 4 values → paste as values into a new row below.

function buildNetWorthHistory(ss) {
  const sh = ss.getSheetByName('Net Worth History');
  sh.clear();
  sh.setColumnWidth(1, 120);
  sh.setColumnWidth(2, 140);
  sh.setColumnWidth(3, 160);
  sh.setColumnWidth(4, 130);
  sh.setColumnWidth(5, 140);
  sh.setColumnWidth(6, 150);

  // Title
  sh.getRange(1, 1, 1, 6).merge()
    .setValue('NET WORTH HISTORY')
    .setBackground(COLORS.header.bg).setFontColor(COLORS.header.fg)
    .setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center');

  sh.getRange(2, 1, 1, 6).merge()
    .setValue('Row 4 = live values from Dashboard. At month end: copy row 4 → Paste Special → Values Only → into a new row below to lock in the snapshot.')
    .setBackground(COLORS.neutral.bg).setFontColor('#666666')
    .setFontSize(9).setFontStyle('italic').setHorizontalAlignment('center');

  // Headers (row 3)
  ['Month', 'Cash', 'Total Investments', 'Liabilities', 'Net Worth', 'vs Last Month'].forEach((h, i) => {
    sh.getRange(3, i + 1)
      .setValue(h)
      .setBackground(COLORS.section.bg).setFontColor(COLORS.section.fg)
      .setFontWeight('bold').setHorizontalAlignment('center');
  });

  // Row 4 — live / current snapshot (pulls from Dashboard)
  sh.getRange(4, 1).setValue(new Date()).setNumberFormat('mmm yyyy')
    .setBackground(COLORS.input.bg).setFontWeight('bold');
  sh.getRange(4, 2).setFormula('=Dashboard!B5').setNumberFormat('$#,##0.00').setBackground(COLORS.calc.bg);
  sh.getRange(4, 3).setFormula('=Dashboard!B6').setNumberFormat('$#,##0.00').setBackground(COLORS.calc.bg);
  sh.getRange(4, 4).setFormula('=Dashboard!B7').setNumberFormat('$#,##0.00').setBackground(COLORS.calc.bg);
  sh.getRange(4, 5).setFormula('=B4+C4-D4').setNumberFormat('$#,##0.00')
    .setBackground(COLORS.calc.bg).setFontWeight('bold');
  sh.getRange(4, 6).setValue('(live)').setFontColor('#aaaaaa')
    .setHorizontalAlignment('center').setBackground(COLORS.calc.bg).setFontStyle('italic');

  // ── Batch format 24 historical rows (rows 5–28) ─────────────────────────────
  const HIST_ROWS = 24;
  const HIST_START = 5;

  // 1. Entire block white
  sh.getRange(HIST_START, 1, HIST_ROWS, 6).setBackground(COLORS.white.bg);

  // 2. Alternating rows neutral — single getRangeList call
  const altRanges = [];
  for (let i = 1; i < HIST_ROWS; i += 2) altRanges.push(`A${HIST_START + i}:F${HIST_START + i}`);
  sh.getRangeList(altRanges).setBackground(COLORS.neutral.bg);

  // 3. Column formats — one call each
  sh.getRange(HIST_START, 1, HIST_ROWS, 1).setNumberFormat('mmm yyyy');
  sh.getRange(HIST_START, 2, HIST_ROWS, 3).setNumberFormat('$#,##0.00');

  // 4. Net Worth (col E) and vs Last Month (col F) — build arrays, write at once
  const nwFormulas = [];
  const vsFormulas = [];
  for (let i = 0; i < HIST_ROWS; i++) {
    const r = HIST_START + i;
    nwFormulas.push([`=IF(COUNTA(B${r}:D${r})=3,B${r}+C${r}-D${r},"")`]);
    vsFormulas.push([i === 0 ? '""' : `=IF(E${r}<>"",E${r}-E${r-1},"")`]);
  }
  sh.getRange(HIST_START, 5, HIST_ROWS, 1)
    .setFormulas(nwFormulas)
    .setNumberFormat('$#,##0.00')
    .setFontWeight('bold');
  sh.getRange(HIST_START, 6, HIST_ROWS, 1)
    .setFormulas(vsFormulas)
    .setNumberFormat('$#,##0.00');

  // Conditional formatting: "vs Last Month" green if up, red if down
  const vsRange = sh.getRange(5, 6, 24, 1);
  const posRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0)
    .setBackground('#d4edda').setFontColor('#155724')
    .setRanges([vsRange]).build();
  const negRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0)
    .setBackground('#f8d7da').setFontColor('#721c24')
    .setRanges([vsRange]).build();
  sh.setConditionalFormatRules([posRule, negRule]);

  sh.setFrozenRows(3);
}

// ── AI OS INTEGRATION ─────────────────────────────────────────────────────────

/**
 * Exports a JSON snapshot compatible with the jamesOS_finances localStorage
 * schema used by the AI OS dashboard (finances.js).
 *
 * Future integration path:
 *   1. Run this to confirm the shape looks right
 *   2. Deploy this Apps Script as a Web App (Execute as: Me, Access: Anyone)
 *   3. In finances.js, fetch from the published URL and merge into localStorage
 *      to show live net worth + investments alongside income/pipeline data
 */
function exportToJSON() {
  const data = buildExportData();
  const json = JSON.stringify(data, null, 2);
  const dash = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Dashboard');
  const outputRow = 35;
  dash.getRange(outputRow, 1).setValue('JSON Export (for AI OS):').setFontWeight('bold');
  dash.getRange(outputRow + 1, 1, 1, 5).merge()
    .setValue(json).setFontFamily('Courier New').setFontSize(8)
    .setWrap(true).setVerticalAlignment('top');
  dash.setRowHeight(outputRow + 1, 220);
  SpreadsheetApp.getUi().alert('JSON written to Dashboard row ' + (outputRow + 1) + '.\nCopy it and paste into the AI OS integration when ready.');
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function sectionHeader(sh, row, col, label, span) {
  sh.getRange(row, col, 1, span).merge()
    .setValue(label)
    .setBackground(COLORS.section.bg).setFontColor(COLORS.section.fg)
    .setFontWeight('bold').setFontSize(10).setHorizontalAlignment('left');
}

function rowLabel(sh, row, col, label, bold) {
  const cell = sh.getRange(row, col)
    .setValue(label)
    .setBackground(COLORS.neutral.bg)
    .setFontColor(COLORS.neutral.fg);
  if (bold) cell.setFontWeight('bold');
}

function inputCell(sh, row, col, value, format) {
  const cell = sh.getRange(row, col)
    .setValue(value)
    .setBackground(COLORS.input.bg)
    .setFontColor(COLORS.input.fg);
  if (format) cell.setNumberFormat(format);
}

function calcCell(sh, row, col, formula, format, bold) {
  const cell = sh.getRange(row, col)
    .setFormula(formula)
    .setBackground(COLORS.calc.bg)
    .setFontColor(COLORS.calc.fg);
  if (format) cell.setNumberFormat(format);
  if (bold) cell.setFontWeight('bold');
}