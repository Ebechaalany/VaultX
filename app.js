// app.js — router + views. Single-page, no framework, everything local.

const ICONS = {
  dashboard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  trades:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V5m0 14 4-4m-4 4-4-4M20 5v14m0-14-4 4m4-4 4 4"/></svg>',
  calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  analytics:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10m6 10V4m6 16v-7"/></svg>',
  settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  empty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19V5m0 14 4-4m-4 4-4-4M20 5v14m0-14-4 4m4-4 4 4"/></svg>'
};

const state = { trades:[], accounts:[], setups:[], rules:[], activeAccount:'all', route:'dashboard' };

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function fmtMoney(n){
  const sign = n < 0 ? '-' : '';
  return sign + '$' + Math.abs(n).toLocaleString(undefined,{maximumFractionDigits:2, minimumFractionDigits:2});
}
function fmtMoneyShort(n){
  const sign = n < 0 ? '-' : (n>0?'+':'');
  return sign + '$' + Math.abs(Math.round(n)).toLocaleString();
}
function toast(msg){
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> el.classList.remove('show'), 2200);
}

function computeTradePnl(t){
  const dir = t.direction === 'short' ? -1 : 1;
  const gross = (t.exitPrice - t.entryPrice) * dir * t.qty;
  return gross - (t.fees || 0);
}

function filteredTrades(){
  return state.activeAccount === 'all'
    ? state.trades
    : state.trades.filter(t=> t.accountId === state.activeAccount);
}

function computeStats(trades){
  const closed = trades.filter(t=> t.exitPrice !== null && t.exitPrice !== undefined && t.exitPrice !== '');
  const wins = closed.filter(t=> t.pnl > 0);
  const losses = closed.filter(t=> t.pnl < 0);
  const netPnl = closed.reduce((s,t)=> s + t.pnl, 0);
  const winRate = closed.length ? (wins.length / closed.length * 100) : 0;
  const grossWin = wins.reduce((s,t)=> s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s,t)=> s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? (grossWin / grossLoss) : (grossWin > 0 ? Infinity : 0);
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? -grossLoss / losses.length : 0;
  const expectancy = closed.length ? netPnl / closed.length : 0;

  // equity curve in chronological order
  const chrono = [...closed].sort((a,b)=> a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  let running = 0; const equity = [0];
  let peak = 0, maxDD = 0;
  chrono.forEach(t=>{
    running += t.pnl;
    equity.push(running);
    peak = Math.max(peak, running);
    maxDD = Math.max(maxDD, peak - running);
  });

  return { closedCount:closed.length, netPnl, winRate, profitFactor, avgWin, avgLoss, expectancy, equity, maxDD };
}

function statsByDayOfWeek(trades){
  const closed = trades.filter(t=> t.pnl !== undefined);
  const buckets = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(l=>({label:l,value:0}));
  closed.forEach(t=>{
    const d = new Date(t.date + 'T00:00:00');
    buckets[d.getDay()].value += t.pnl;
  });
  // reorder Mon-Sun for display
  return [1,2,3,4,5,6,0].map(i=> buckets[i]);
}

function groupBy(trades, keyFn){
  const map = {};
  trades.forEach(t=>{
    const k = keyFn(t) || 'Unspecified';
    map[k] = map[k] || { key:k, pnl:0, count:0 };
    map[k].pnl += t.pnl; map[k].count += 1;
  });
  return Object.values(map).sort((a,b)=> b.pnl - a.pnl);
}

// ============== Rendering shell ==============
function renderShell(){
  const links = [
    ['dashboard','Dashboard'], ['trades','Trade Log'], ['calendar','Calendar'],
    ['analytics','Analytics'], ['settings','Settings']
  ];
  $('#sidebar-nav').innerHTML = links.map(([id,label])=>
    `<a class="nav-link ${state.route===id?'active':''}" data-route="${id}">${ICONS[id]}<span>${label}</span></a>`
  ).join('');
  $('#mobile-nav').innerHTML = links.map(([id,label])=>
    `<a class="${state.route===id?'active':''}" data-route="${id}">${ICONS[id]}<span>${label}</span></a>`
  ).join('');
  $$('[data-route]').forEach(el=> el.addEventListener('click', ()=> navigate(el.dataset.route)));
}

function navigate(route){
  state.route = route;
  location.hash = '#/' + route;
  renderShell();
  renderView();
}

async function refreshData(){
  const [trades, accounts, setups, rules] = await Promise.all([
    DB.trades.all(), DB.accounts.all(), DB.setups.all(), DB.rules.all()
  ]);
  trades.forEach(t=>{ if(t.exitPrice !== null && t.exitPrice !== undefined && t.exitPrice !== ''){ t.pnl = computeTradePnl(t); } });
  state.trades = trades; state.accounts = accounts; state.setups = setups; state.rules = rules;
}

function renderView(){
  const view = $('#view');
  if(state.route === 'dashboard') return renderDashboard(view);
  if(state.route === 'trades') return renderTradeLog(view);
  if(state.route === 'calendar') return renderCalendar(view);
  if(state.route === 'analytics') return renderAnalytics(view);
  if(state.route === 'settings') return renderSettings(view);
}

// ============== Dashboard ==============
function renderDashboard(view){
  const trades = filteredTrades();
  const s = computeStats(trades);
  view.innerHTML = `
    <div class="topbar">
      <div><h1>Dashboard</h1><div class="sub">Your trading edge, at a glance</div></div>
      <button class="btn btn-primary" id="btn-new-trade">${ICONS.plus}New Trade</button>
    </div>
    <div class="stat-grid">
      <div class="card stat"><div class="label">Net P&amp;L</div><div class="value ${s.netPnl>=0?'pos':'neg'} mono">${fmtMoneyShort(s.netPnl)}</div></div>
      <div class="card stat"><div class="label">Win Rate</div><div class="value gold mono">${s.winRate.toFixed(1)}%</div></div>
      <div class="card stat"><div class="label">Profit Factor</div><div class="value gold mono">${isFinite(s.profitFactor)?s.profitFactor.toFixed(2):'∞'}</div></div>
      <div class="card stat"><div class="label">Expectancy</div><div class="value mono">${fmtMoneyShort(s.expectancy)}</div></div>
      <div class="card stat"><div class="label">Trades Logged</div><div class="value mono">${s.closedCount}</div></div>
    </div>
    <div class="grid-2">
      <div class="card bracket">
        <div class="section-title">Equity Curve</div>
        <canvas id="equity-canvas" style="width:100%;height:220px;display:block;"></canvas>
      </div>
      <div class="card">
        <div class="section-title">Recent Trades</div>
        <div id="recent-trades"></div>
      </div>
    </div>
  `;
  requestAnimationFrame(()=> drawEquityCurve($('#equity-canvas'), s.equity));
  const recent = trades.slice(0,5);
  $('#recent-trades').innerHTML = recent.length ? recent.map(tradeRowHtml).join('') :
    `<div class="empty-state" style="padding:30px 10px;">${ICONS.empty}<div>No trades yet</div></div>`;
  $$('#recent-trades .trade-row').forEach(el=> el.addEventListener('click', ()=> openTradeModal(el.dataset.id)));
  $('#btn-new-trade').addEventListener('click', ()=> openTradeModal());
}

function tradeRowHtml(t){
  const stars = '★'.repeat(t.grade||0) + '☆'.repeat(5-(t.grade||0));
  const hasPnl = t.pnl !== undefined;
  return `<div class="trade-row" data-id="${t.id}">
    <div class="dir ${t.direction}">${t.direction === 'short' ? 'SHORT' : 'LONG'}</div>
    <div>
      <div class="sym">${escapeHtml(t.symbol)}</div>
      <div class="meta">${t.date}${t.setup?' · '+escapeHtml(t.setup):''}</div>
    </div>
    <div class="meta mono">${t.qty} qty</div>
    <div class="meta mono">${t.entryPrice} → ${t.exitPrice ?? '—'}</div>
    <div class="pnl mono ${hasPnl ? (t.pnl>=0?'pos':'neg') : ''}" style="${hasPnl ? (t.pnl>=0?'color:var(--green)':'color:var(--red)') : 'color:var(--text2)'}">${hasPnl ? fmtMoneyShort(t.pnl) : 'open'}</div>
    <div class="stars">${stars}</div>
  </div>`;
}

function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ============== Trade Log ==============
let logFilter = { q:'', setup:'', dir:'' };
function getFilteredLogTrades(){
  return filteredTrades().filter(t=>{
    if(logFilter.dir && t.direction !== logFilter.dir) return false;
    if(logFilter.setup && t.setup !== logFilter.setup) return false;
    if(logFilter.q){
      const q = logFilter.q.toLowerCase();
      if(!(t.symbol.toLowerCase().includes(q) || (t.notes||'').toLowerCase().includes(q))) return false;
    }
    return true;
  });
}
function renderTradeLogList(){
  const trades = getFilteredLogTrades();
  const list = $('#trade-list');
  if(!list) return;
  list.innerHTML = trades.length ? trades.map(tradeRowHtml).join('') :
    `<div class="empty-state">${ICONS.empty}<div>No trades match your filters</div></div>`;
  $$('#trade-list .trade-row').forEach(el=> el.addEventListener('click', ()=> openTradeModal(el.dataset.id)));
}
function renderTradeLog(view){
  view.innerHTML = `
    <div class="topbar">
      <div><h1>Trade Log</h1><div class="sub">Every trade, searchable</div></div>
      <button class="btn btn-primary" id="btn-new-trade">${ICONS.plus}New Trade</button>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div class="field-row3">
        <div class="field" style="margin-bottom:0;"><input id="f-q" placeholder="Search symbol or notes…" value="${escapeHtml(logFilter.q)}"></div>
        <div class="field" style="margin-bottom:0;">
          <select id="f-dir"><option value="">Any direction</option><option value="long" ${logFilter.dir==='long'?'selected':''}>Long</option><option value="short" ${logFilter.dir==='short'?'selected':''}>Short</option></select>
        </div>
        <div class="field" style="margin-bottom:0;">
          <select id="f-setup"><option value="">Any setup</option>${state.setups.map(s=>`<option value="${escapeHtml(s.name)}" ${logFilter.setup===s.name?'selected':''}>${escapeHtml(s.name)}</option>`).join('')}</select>
        </div>
      </div>
    </div>
    <div class="card" id="trade-list"></div>
  `;
  renderTradeLogList();
  $('#btn-new-trade').addEventListener('click', ()=> openTradeModal());
  $('#f-q').addEventListener('input', e=>{ logFilter.q = e.target.value; renderTradeLogList(); });
  $('#f-dir').addEventListener('change', e=>{ logFilter.dir = e.target.value; renderTradeLogList(); });
  $('#f-setup').addEventListener('change', e=>{ logFilter.setup = e.target.value; renderTradeLogList(); });
}

// ============== Calendar ==============
let calCursor = new Date();
function renderCalendar(view){
  const y = calCursor.getFullYear(), m = calCursor.getMonth();
  const trades = filteredTrades().filter(t=> t.pnl !== undefined);
  const byDay = {};
  trades.forEach(t=>{ byDay[t.date] = (byDay[t.date]||0) + t.pnl; });

  const monthPnl = Object.entries(byDay).filter(([d])=> d.startsWith(`${y}-${String(m+1).padStart(2,'0')}`)).reduce((s,[,v])=>s+v,0);

  const first = new Date(y, m, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0,10);

  let cells = '';
  for(let i=0;i<startWeekday;i++) cells += `<div class="cal-cell empty"></div>`;
  for(let d=1; d<=daysInMonth; d++){
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const pnl = byDay[dateStr];
    const cls = pnl === undefined ? '' : (pnl >= 0 ? 'pos' : 'neg');
    cells += `<div class="cal-cell ${cls} ${dateStr===todayStr?'today':''}">
      <div class="d">${d}</div>
      ${pnl !== undefined ? `<div class="amt mono">${fmtMoneyShort(pnl)}</div>` : ''}
    </div>`;
  }

  view.innerHTML = `
    <div class="topbar">
      <div><h1>Calendar</h1><div class="sub">Daily P&amp;L</div></div>
      <div style="display:flex;gap:10px;align-items:center;">
        <button class="btn btn-sm" id="cal-prev">&lt;</button>
        <div class="mono" style="min-width:140px;text-align:center;font-weight:700;">${first.toLocaleDateString(undefined,{month:'long', year:'numeric'})}</div>
        <button class="btn btn-sm" id="cal-next">&gt;</button>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div class="stat" style="padding:0;"><div class="label">Month Net P&amp;L</div><div class="value mono ${monthPnl>=0?'pos':'neg'}">${fmtMoneyShort(monthPnl)}</div></div>
    </div>
    <div class="card">
      <div class="cal-grid" style="margin-bottom:8px;">
        ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="cal-dow">${d}</div>`).join('')}
      </div>
      <div class="cal-grid">${cells}</div>
    </div>
  `;
  $('#cal-prev').addEventListener('click', ()=>{ calCursor = new Date(y, m-1, 1); renderCalendar(view); });
  $('#cal-next').addEventListener('click', ()=>{ calCursor = new Date(y, m+1, 1); renderCalendar(view); });
}

// ============== Analytics ==============
function renderAnalytics(view){
  const trades = filteredTrades();
  const s = computeStats(trades);
  const closed = trades.filter(t=> t.pnl !== undefined);
  const byDow = statsByDayOfWeek(closed);
  const bySetup = groupBy(closed, t=> t.setup);
  const byInstrument = groupBy(closed, t=> t.symbol);

  view.innerHTML = `
    <div class="topbar"><div><h1>Analytics</h1><div class="sub">Deep performance breakdown</div></div></div>
    <div class="grid-2" style="margin-bottom:16px;">
      <div class="card bracket">
        <div class="section-title">Equity Curve</div>
        <canvas id="an-equity" style="width:100%;height:200px;display:block;"></canvas>
      </div>
      <div class="grid-3" style="grid-template-columns:1fr 1fr;">
        <div class="card stat"><div class="label">Avg Win</div><div class="value pos mono">${fmtMoneyShort(s.avgWin)}</div></div>
        <div class="card stat"><div class="label">Avg Loss</div><div class="value neg mono">${fmtMoneyShort(s.avgLoss)}</div></div>
        <div class="card stat"><div class="label">Max Drawdown</div><div class="value neg mono">${fmtMoneyShort(-s.maxDD)}</div></div>
        <div class="card stat"><div class="label">Expectancy</div><div class="value gold mono">${fmtMoneyShort(s.expectancy)}</div></div>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div class="section-title">Day of Week Performance</div>
      <canvas id="an-dow" style="width:100%;height:160px;display:block;"></canvas>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="section-title">By Setup</div>
        ${breakdownListHtml(bySetup)}
      </div>
      <div class="card">
        <div class="section-title">By Instrument</div>
        ${breakdownListHtml(byInstrument)}
      </div>
    </div>
  `;
  requestAnimationFrame(()=>{
    drawEquityCurve($('#an-equity'), s.equity);
    drawDayOfWeekBars($('#an-dow'), byDow);
  });
}

function breakdownListHtml(items){
  if(!items.length) return `<div class="empty-state" style="padding:24px 10px;">${ICONS.empty}<div>Not enough data yet</div></div>`;
  return items.map(it=> `
    <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line);">
      <span>${escapeHtml(it.key)} <span style="color:var(--text2);font-size:12px;">(${it.count})</span></span>
      <span class="mono" style="color:${it.pnl>=0?'var(--green)':'var(--red)'};font-weight:700;">${fmtMoneyShort(it.pnl)}</span>
    </div>`).join('');
}

// ============== Settings ==============
function renderSettings(view){
  view.innerHTML = `
    <div class="topbar"><div><h1>Settings</h1><div class="sub">Accounts, setups, rules &amp; backups</div></div></div>

    <div class="card" style="margin-bottom:16px;">
      <div class="section-title">Trading Accounts</div>
      <div id="accounts-list"></div>
      <div class="field-row3">
        <input id="acc-name" placeholder="Account name (e.g. Personal)">
        <select id="acc-type"><option value="personal">Personal</option><option value="demo">Demo</option><option value="funded">Funded</option></select>
        <input id="acc-balance" type="number" step="0.01" placeholder="Starting balance">
      </div>
      <button class="btn btn-sm" id="acc-add" style="margin-top:10px;">${ICONS.plus}Add Account</button>
    </div>

    <div class="grid-2" style="margin-bottom:16px;">
      <div class="card">
        <div class="section-title">Setups</div>
        <div class="list-editor" id="setups-list"></div>
        <div style="display:flex;gap:8px;">
          <input id="setup-name" placeholder="e.g. Breakout, FVG, Liquidity Grab">
          <button class="btn btn-sm" id="setup-add">${ICONS.plus}</button>
        </div>
      </div>
      <div class="card">
        <div class="section-title">Trading Rules</div>
        <div class="list-editor" id="rules-list"></div>
        <div style="display:flex;gap:8px;">
          <input id="rule-text" placeholder="e.g. Risk 1%, no revenge trading">
          <button class="btn btn-sm" id="rule-add">${ICONS.plus}</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Local Backup</div>
      <p style="color:var(--text1);font-size:13px;margin-top:0;">Your data lives only on this device — there's no server. Export a backup file periodically, or to move your journal to a new device.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn" id="btn-export">Export backup (.json)</button>
        <label class="btn" style="cursor:pointer;">Import backup<input type="file" id="btn-import" accept="application/json" style="display:none;"></label>
      </div>
    </div>
  `;

  $('#accounts-list').innerHTML = state.accounts.map(a=> `
    <div class="account-card">
      <div><div class="name">${escapeHtml(a.name)}</div><div class="type">${a.type}</div></div>
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="bal">${fmtMoney(a.balance||0)}</div>
        <button class="btn btn-sm btn-danger" data-del-acc="${a.id}">Remove</button>
      </div>
    </div>`).join('') || `<div style="color:var(--text1);font-size:13px;">No accounts yet.</div>`;

  $('#setups-list').innerHTML = state.setups.map(s=> `
    <div class="list-editor-row"><span>${escapeHtml(s.name)}</span><button class="btn btn-sm btn-danger" data-del-setup="${s.id}">×</button></div>
  `).join('') || `<div style="color:var(--text1);font-size:13px;">No setups yet.</div>`;

  $('#rules-list').innerHTML = state.rules.map(r=> `
    <div class="list-editor-row"><span>${escapeHtml(r.text)}</span><button class="btn btn-sm btn-danger" data-del-rule="${r.id}">×</button></div>
  `).join('') || `<div style="color:var(--text1);font-size:13px;">No rules yet.</div>`;

  $('#acc-add').addEventListener('click', async ()=>{
    const name = $('#acc-name').value.trim();
    if(!name) return toast('Give the account a name');
    await DB.accounts.put({ id: DB.uid(), name, type: $('#acc-type').value, balance: parseFloat($('#acc-balance').value)||0 });
    await refreshData(); renderSettings(view); toast('Account added');
  });
  $$('[data-del-acc]').forEach(b=> b.addEventListener('click', async ()=>{
    await DB.accounts.delete(b.dataset.delAcc); await refreshData(); renderSettings(view);
  }));

  $('#setup-add').addEventListener('click', async ()=>{
    const name = $('#setup-name').value.trim();
    if(!name) return;
    await DB.setups.put({ id: DB.uid(), name });
    await refreshData(); renderSettings(view);
  });
  $$('[data-del-setup]').forEach(b=> b.addEventListener('click', async ()=>{
    await DB.setups.delete(b.dataset.delSetup); await refreshData(); renderSettings(view);
  }));

  $('#rule-add').addEventListener('click', async ()=>{
    const text = $('#rule-text').value.trim();
    if(!text) return;
    await DB.rules.put({ id: DB.uid(), text });
    await refreshData(); renderSettings(view);
  });
  $$('[data-del-rule]').forEach(b=> b.addEventListener('click', async ()=>{
    await DB.rules.delete(b.dataset.delRule); await refreshData(); renderSettings(view);
  }));

  $('#btn-export').addEventListener('click', async ()=>{
    const data = await DB.exportAll();
    const blob = new Blob([JSON.stringify(data,null,2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `vaultx-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast('Backup downloaded');
  });
  $('#btn-import').addEventListener('change', async (e)=>{
    const file = e.target.files[0]; if(!file) return;
    try{
      const text = await file.text();
      await DB.importAll(JSON.parse(text));
      await refreshData(); renderSettings(view);
      toast('Backup imported');
    }catch(err){ toast('That file could not be read as a backup'); }
  });
}

// ============== Trade modal (add/edit) ==============
function openTradeModal(id){
  const editing = id ? state.trades.find(t=> t.id === id) : null;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-head"><h2>${editing? 'Edit Trade' : 'New Trade'}</h2><button class="close-x" id="modal-close">&times;</button></div>
      <div class="field toggle-row">
        <div class="pill-choice long" data-dir="long">Long</div>
        <div class="pill-choice short" data-dir="short">Short</div>
      </div>
      <div class="field-row">
        <div class="field"><label>Symbol</label><input id="t-symbol" placeholder="e.g. MNQ" value="${editing?escapeHtml(editing.symbol):''}"></div>
        <div class="field"><label>Date</label><input id="t-date" type="date" value="${editing?editing.date:new Date().toISOString().slice(0,10)}"></div>
      </div>
      <div class="field-row3">
        <div class="field"><label>Entry price</label><input id="t-entry" type="number" step="any" value="${editing?editing.entryPrice:''}"></div>
        <div class="field"><label>Exit price</label><input id="t-exit" type="number" step="any" placeholder="leave blank if open" value="${editing&&editing.exitPrice!=null?editing.exitPrice:''}"></div>
        <div class="field"><label>Quantity</label><input id="t-qty" type="number" step="any" value="${editing?editing.qty:'1'}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Fees</label><input id="t-fees" type="number" step="any" value="${editing?(editing.fees||0):'0'}"></div>
        <div class="field"><label>Account</label>
          <select id="t-account">${state.accounts.map(a=>`<option value="${a.id}" ${editing&&editing.accountId===a.id?'selected':''}>${escapeHtml(a.name)}</option>`).join('')}</select>
        </div>
      </div>
      <div class="field"><label>Setup</label>
        <div class="tag-list" id="t-setup-tags">${state.setups.map(s=>`<div class="tag ${editing&&editing.setup===s.name?'on':''}" data-setup="${escapeHtml(s.name)}">${escapeHtml(s.name)}</div>`).join('') || '<span style="color:var(--text1);font-size:12px;">Add setups in Settings</span>'}</div>
      </div>
      <div class="field"><label>Grade</label><div class="star-input" id="t-grade">${[1,2,3,4,5].map(n=>`<span data-star="${n}" class="${editing&&editing.grade>=n?'on':''}">★</span>`).join('')}</div></div>
      <div class="field"><label>Chart screenshot</label>
        <div class="img-drop" id="t-img-drop">Click to attach a screenshot</div>
        <input type="file" id="t-img-input" accept="image/*" style="display:none;">
        <img id="t-img-preview" class="img-preview" style="display:${editing&&editing.screenshot?'block':'none'};" src="${editing&&editing.screenshot?editing.screenshot:''}">
      </div>
      <div class="field"><label>Notes</label><textarea id="t-notes" placeholder="Setup reasoning, execution, emotions…">${editing?escapeHtml(editing.notes||''):''}</textarea></div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;">
        <div>${editing? `<button class="btn btn-danger" id="t-delete">Delete</button>` : ''}</div>
        <div style="display:flex;gap:10px;"><button class="btn btn-ghost" id="t-cancel">Cancel</button><button class="btn btn-primary" id="t-save">Save Trade</button></div>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  let selectedDir = editing? editing.direction : 'long';
  let selectedSetup = editing? editing.setup : '';
  let selectedGrade = editing? (editing.grade||0) : 0;
  let screenshotData = editing? (editing.screenshot||null) : null;

  function syncDir(){ $$('.pill-choice',backdrop).forEach(el=> el.classList.toggle('on', el.dataset.dir===selectedDir)); }
  function syncStars(){ $$('#t-grade span',backdrop).forEach(el=> el.classList.toggle('on', +el.dataset.star <= selectedGrade)); }
  syncDir(); syncStars();

  $$('.pill-choice', backdrop).forEach(el=> el.addEventListener('click', ()=>{ selectedDir = el.dataset.dir; syncDir(); }));
  $$('#t-setup-tags .tag', backdrop).forEach(el=> el.addEventListener('click', ()=>{
    selectedSetup = (selectedSetup === el.dataset.setup) ? '' : el.dataset.setup;
    $$('#t-setup-tags .tag', backdrop).forEach(t=> t.classList.toggle('on', t.dataset.setup===selectedSetup));
  }));
  $$('#t-grade span', backdrop).forEach(el=> el.addEventListener('click', ()=>{
    selectedGrade = (selectedGrade === +el.dataset.star) ? 0 : +el.dataset.star; syncStars();
  }));

  const dropEl = backdrop.querySelector('#t-img-drop');
  const imgInput = backdrop.querySelector('#t-img-input');
  dropEl.addEventListener('click', ()=> imgInput.click());
  imgInput.addEventListener('change', ()=>{
    const file = imgInput.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      screenshotData = reader.result;
      const preview = backdrop.querySelector('#t-img-preview');
      preview.src = screenshotData; preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  function close(){ backdrop.remove(); }
  backdrop.querySelector('#modal-close').addEventListener('click', close);
  backdrop.querySelector('#t-cancel').addEventListener('click', close);
  backdrop.addEventListener('click', e=>{ if(e.target === backdrop) close(); });

  if(editing){
    backdrop.querySelector('#t-delete').addEventListener('click', async ()=>{
      if(!confirm('Delete this trade? This cannot be undone.')) return;
      await DB.trades.delete(editing.id); await refreshData(); renderView(); close(); toast('Trade deleted');
    });
  }

  backdrop.querySelector('#t-save').addEventListener('click', async ()=>{
    const symbol = backdrop.querySelector('#t-symbol').value.trim();
    const date = backdrop.querySelector('#t-date').value;
    const entryPrice = parseFloat(backdrop.querySelector('#t-entry').value);
    const exitRaw = backdrop.querySelector('#t-exit').value;
    const qty = parseFloat(backdrop.querySelector('#t-qty').value);
    if(!symbol || !date || isNaN(entryPrice) || isNaN(qty)){
      toast('Symbol, date, entry price and quantity are required'); return;
    }
    const trade = {
      id: editing? editing.id : DB.uid(),
      createdAt: editing? editing.createdAt : Date.now(),
      symbol, date, direction: selectedDir,
      entryPrice, exitPrice: exitRaw === '' ? null : parseFloat(exitRaw),
      qty, fees: parseFloat(backdrop.querySelector('#t-fees').value)||0,
      accountId: backdrop.querySelector('#t-account').value || (state.accounts[0]&&state.accounts[0].id),
      setup: selectedSetup, grade: selectedGrade,
      screenshot: screenshotData,
      notes: backdrop.querySelector('#t-notes').value.trim()
    };
    await DB.trades.put(trade);
    await refreshData(); renderView(); close(); toast('Trade saved');
  });
}

// ============== Boot ==============
async function boot(){
  await DB.seedIfEmpty();
  await refreshData();
  const initial = (location.hash.replace('#/','') || 'dashboard');
  state.route = ['dashboard','trades','calendar','analytics','settings'].includes(initial) ? initial : 'dashboard';
  renderShell();
  renderView();

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
}
boot();
