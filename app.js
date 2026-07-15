// app.js — router + views. Single-page, no framework, everything local.

const ICONS = {
  dashboard:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  trades:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V5m0 14 4-4m-4 4-4-4M20 5v14m0-14-4 4m4-4 4 4"/></svg>',
  archive:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7l1.5-3h15L21 7"/><rect x="3" y="7" width="18" height="13" rx="1.5"/><path d="M9.5 12h5"/></svg>',
  calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  analytics:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10m6 10V4m6 16v-7"/></svg>',
  streaks:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2c1 4-3 5-3 8.5A3.5 3.5 0 0 0 12 14a3.5 3.5 0 0 0 3-1.7c.3 2-1 3.5-1 3.5 3-1 5-3.8 5-6.8 0-4-3-6-3-8 0 2-1 3-2 3 0-2-1-4-2-4Z"/><path d="M9 18a3 3 0 0 0 6 0"/></svg>',
  settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  empty:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19V5m0 14 4-4m-4 4-4-4M20 5v14m0-14-4 4m4-4 4 4"/></svg>',
  folder:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2.5h9A1.5 1.5 0 0 1 21 9v9.5A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5Z"/></svg>',
  image:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5-9 9"/></svg>'
};

const GRADES = [
  { id:'A', label:'A', desc:'Flawless execution', color:'#34d67a' },
  { id:'B', label:'B', desc:'Good, minor slippage', color:'#9fd634' },
  { id:'C', label:'C', desc:'Average, some plan drift', color:'#f4c430' },
  { id:'D', label:'D', desc:'Poor discipline', color:'#f2914a' },
  { id:'F', label:'F', desc:'Broke the rules', color:'#f2555a' }
];
const SESSIONS = ['NY AM','NY PM','Asia','London'];

const DEFAULT_FIELD_VISIBILITY = { emotionsBefore:true, emotionsDuring:true, mistakes:true, lessons:true };

const state = {
  trades:[], accounts:[], setups:[], rules:[], checklist:[], goals:[],
  activeAccount:'all', route:'dashboard',
  archive: { year:null, month:null },
  fieldVisibility: { ...DEFAULT_FIELD_VISIBILITY },
  showWeeklyPnl: false
};

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function pnlColor(pnl){
  if(pnl === undefined) return 'var(--text2)';
  if(pnl === 0) return 'var(--grey)';
  return pnl > 0 ? 'var(--green)' : 'var(--red)';
}

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
  // P&L comes directly from what the user enters — not derived from entry/exit price.
  return t.pnlInput || 0;
}

function filteredTrades(){
  return state.activeAccount === 'all'
    ? state.trades
    : state.trades.filter(t=> tradeAccountIds(t).includes(state.activeAccount));
}

function computeStats(trades){
  const closed = trades.filter(t=> t.exitPrice !== null && t.exitPrice !== undefined && t.exitPrice !== '');
  const wins = closed.filter(t=> t.pnl > 0);
  const losses = closed.filter(t=> t.pnl < 0);
  const breakEven = closed.filter(t=> t.pnl === 0);
  const netPnl = closed.reduce((s,t)=> s + t.pnl, 0);
  // Win rate is wins vs. (wins + losses) — breakeven trades are excluded so they can't drag it down.
  const decisive = wins.length + losses.length;
  const winRate = decisive ? (wins.length / decisive * 100) : 0;
  const grossWin = wins.reduce((s,t)=> s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s,t)=> s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? (grossWin / grossLoss) : (grossWin > 0 ? Infinity : 0);
  const avgWin = wins.length ? grossWin / wins.length : 0;
  const avgLoss = losses.length ? -grossLoss / losses.length : 0;
  const expectancy = closed.length ? netPnl / closed.length : 0;

  // equity curve in chronological order
  const chrono = [...closed].sort((a,b)=> a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  let running = 0; const equity = [0];
  let peak = 0, maxDD = 0, trough = 0, maxRunup = 0;
  chrono.forEach(t=>{
    running += t.pnl;
    equity.push(running);
    peak = Math.max(peak, running);
    maxDD = Math.max(maxDD, peak - running);
    trough = Math.min(trough, running);
    maxRunup = Math.max(maxRunup, running - trough);
  });

  // day-level stats: only days with at least one journaled trade count.
  // a breakeven DAY (net $0 for that day) does lower the day win rate, unlike a breakeven trade.
  const byDay = {};
  closed.forEach(t=>{ byDay[t.date] = (byDay[t.date]||0) + t.pnl; });
  const dayValues = Object.values(byDay);
  const winDays = dayValues.filter(v=> v > 0).length;
  const lossDays = dayValues.filter(v=> v < 0).length;
  const breakEvenDays = dayValues.filter(v=> v === 0).length;
  const dayWinRate = dayValues.length ? (winDays / dayValues.length * 100) : 0;

  return {
    closedCount:closed.length, netPnl, winRate, profitFactor, avgWin, avgLoss, expectancy, equity, maxDD, maxRunup,
    breakEvenCount: breakEven.length, winDays, lossDays, breakEvenDays, dayWinRate
  };
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

function gradeInfo(id){ return GRADES.find(g=> g.id === id); }

function tradeImages(t){
  if(Array.isArray(t.images) && t.images.length) return t.images;
  if(t.screenshot) return [{ id:'legacy', name:'Chart', data:t.screenshot }];
  return [];
}

function tradeAccountIds(t){
  if(Array.isArray(t.accountIds) && t.accountIds.length) return t.accountIds;
  if(t.accountId) return [t.accountId];
  return [];
}

function computeStreaks(trades){
  const closed = trades.filter(t=> t.pnl !== undefined);
  const chrono = [...closed].sort((a,b)=> a.date.localeCompare(b.date) || a.createdAt - b.createdAt);

  // win / loss streaks (trade by trade)
  let winBest=0, lossBest=0, winCur=0, lossCur=0;
  chrono.forEach(t=>{
    if(t.pnl > 0){ winCur += 1; lossCur = 0; winBest = Math.max(winBest, winCur); }
    else if(t.pnl < 0){ lossCur += 1; winCur = 0; lossBest = Math.max(lossBest, lossCur); }
    else { winCur = 0; lossCur = 0; }
  });

  // profit-day streak (by distinct trading day, in chronological order of days that have trades)
  const byDay = {};
  chrono.forEach(t=>{ byDay[t.date] = (byDay[t.date]||0) + t.pnl; });
  const days = Object.keys(byDay).sort();
  let dayBest=0, dayCur=0;
  days.forEach(d=>{
    if(byDay[d] > 0){ dayCur += 1; dayBest = Math.max(dayBest, dayCur); }
    else { dayCur = 0; }
  });

  return {
    winStreakCurrent: winCur, winStreakBest: winBest,
    lossStreakCurrent: lossCur, lossStreakBest: lossBest,
    profitDayStreakCurrent: dayCur, profitDayStreakBest: dayBest,
    journalDays: days.length
  };
}

function computeXP(trades){
  const withNotes = trades.filter(t=> t.notes && t.notes.trim()).length;
  const withShot = trades.filter(t=> tradeImages(t).length).length;
  const withReflection = trades.filter(t=> (t.mistakes&&t.mistakes.trim()) || (t.lessons&&t.lessons.trim())).length;
  const xp = trades.length*20 + withNotes*5 + withShot*5 + withReflection*5;
  const perLevel = 150;
  const level = Math.floor(xp / perLevel) + 1;
  const xpIntoLevel = xp % perLevel;
  return { xp, level, xpIntoLevel, xpForNext: perLevel };
}

const ACHIEVEMENTS = [
  { id:'first', title:'First Entry', desc:'Log your first trade', emoji:'📝', check:(trades)=> trades.length >= 1 },
  { id:'onfire', title:'On Fire', desc:'3 winning trades in a row', emoji:'🔥', check:(trades,streaks)=> streaks.winStreakBest >= 3 },
  { id:'disciplined', title:'Disciplined', desc:'3 profitable days in a row', emoji:'💎', check:(trades,streaks)=> streaks.profitDayStreakBest >= 3 },
  { id:'consistent', title:'Consistent', desc:'Journal 5 different days', emoji:'📅', check:(trades,streaks)=> streaks.journalDays >= 5 },
  { id:'century', title:'Century', desc:'Log 100 trades', emoji:'🏆', check:(trades)=> trades.length >= 100 },
  { id:'aplus', title:'A+ Trader', desc:'Grade a trade A', emoji:'⭐', check:(trades)=> trades.some(t=> t.grade === 'A') }
];

// ============== Rendering shell ==============
function renderShell(){
  const links = [
    ['dashboard','Dashboard'], ['trades','Trade History'], ['archive','Archive'], ['calendar','Calendar'],
    ['analytics','Analytics'], ['streaks','Streaks'], ['settings','Settings']
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
  const [trades, accounts, setups, rules, checklist, goals, fieldVisibility, showWeeklyPnl] = await Promise.all([
    DB.trades.all(), DB.accounts.all(), DB.setups.all(), DB.rules.all(), DB.checklist.all(), DB.goals.all(),
    DB.meta.get('fieldVisibility'), DB.meta.get('showWeeklyPnl')
  ]);
  trades.forEach(t=>{ if(t.exitPrice !== null && t.exitPrice !== undefined && t.exitPrice !== ''){ t.pnl = computeTradePnl(t); } });
  state.trades = trades; state.accounts = accounts; state.setups = setups; state.rules = rules;
  state.checklist = checklist; state.goals = goals;
  state.fieldVisibility = fieldVisibility ? { ...DEFAULT_FIELD_VISIBILITY, ...fieldVisibility } : { ...DEFAULT_FIELD_VISIBILITY };
  state.showWeeklyPnl = !!showWeeklyPnl;
}

function renderView(){
  const view = $('#view');
  if(state.route === 'dashboard') return renderDashboard(view);
  if(state.route === 'trades') return renderTradeHistory(view);
  if(state.route === 'archive') return renderArchive(view);
  if(state.route === 'calendar') return renderCalendar(view);
  if(state.route === 'analytics') return renderAnalytics(view);
  if(state.route === 'streaks') return renderStreaks(view);
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
    <div class="card" style="margin-top:16px;">
      <div class="checklist-card-head">
        <div class="section-title" style="margin:0;">Pre-Trade Checklist</div>
        <button class="btn btn-sm btn-ghost" id="checklist-reset">Reset all</button>
      </div>
      <div class="checklist" id="dash-checklist"></div>
      <div class="checklist-add">
        <input id="checklist-text" placeholder="Add a checklist item, e.g. Checked higher timeframe bias">
        <button class="btn btn-sm" id="checklist-add-btn">${ICONS.plus}</button>
      </div>
    </div>
  `;
  requestAnimationFrame(()=> drawEquityCurve($('#equity-canvas'), s.equity));
  const recent = trades.slice(0,5);
  $('#recent-trades').innerHTML = recent.length ? recent.map(tradeRowHtml).join('') :
    `<div class="empty-state" style="padding:30px 10px;">${ICONS.empty}<div>No trades yet</div></div>`;
  $$('#recent-trades .trade-row').forEach(el=> el.addEventListener('click', ()=> openTradeModal(el.dataset.id)));
  $('#btn-new-trade').addEventListener('click', ()=> openTradeModal());

  renderDashChecklist();
  $('#checklist-add-btn').addEventListener('click', async ()=>{
    const text = $('#checklist-text').value.trim();
    if(!text) return;
    await DB.checklist.put({ id: DB.uid(), text, checked:false });
    await refreshData(); renderDashChecklist(); $('#checklist-text').value='';
  });
  $('#checklist-reset').addEventListener('click', async ()=>{
    for(const item of state.checklist){ item.checked = false; await DB.checklist.put(item); }
    await refreshData(); renderDashChecklist(); toast('Checklist reset');
  });
}

function renderDashChecklist(){
  const el = $('#dash-checklist');
  if(!el) return;
  el.innerHTML = state.checklist.length ? state.checklist.map(c=> `
    <div class="checklist-item ${c.checked?'done':''}">
      <input type="checkbox" data-cl-toggle="${c.id}" ${c.checked?'checked':''}>
      <span>${escapeHtml(c.text)}</span>
      <button class="del" data-cl-del="${c.id}">×</button>
    </div>`).join('') : `<div style="color:var(--text1);font-size:13px;padding:6px 0;">No checklist items yet — add your pre-trade routine below.</div>`;
  $$('[data-cl-toggle]', el).forEach(cb=> cb.addEventListener('change', async ()=>{
    const item = state.checklist.find(x=> x.id === cb.dataset.clToggle);
    item.checked = cb.checked;
    await DB.checklist.put(item); await refreshData(); renderDashChecklist();
  }));
  $$('[data-cl-del]', el).forEach(b=> b.addEventListener('click', async ()=>{
    await DB.checklist.delete(b.dataset.clDel); await refreshData(); renderDashChecklist();
  }));
}

function tradeRowHtml(t){
  const g = gradeInfo(t.grade);
  const hasPnl = t.pnl !== undefined;
  return `<div class="trade-row" data-id="${t.id}">
    <div class="dir ${t.direction}">${t.direction === 'short' ? 'SHORT' : 'LONG'}</div>
    <div>
      <div class="sym">${escapeHtml(t.symbol)}</div>
      <div class="meta">${t.date}${t.setup?' · '+escapeHtml(t.setup):''}</div>
    </div>
    <div class="meta mono">${t.qty} size</div>
    <div class="meta mono">${t.entryPrice} → ${t.exitPrice ?? '—'}</div>
    <div class="pnl mono" style="${'color:'+pnlColor(hasPnl?t.pnl:undefined)}">${hasPnl ? fmtMoneyShort(t.pnl) : 'open'}</div>
    <div class="stars" style="color:${g?g.color:'var(--text2)'};font-weight:800;">${g?g.label:'—'}</div>
  </div>`;
}

function tradeCardHtml(t){
  const g = gradeInfo(t.grade);
  const hasPnl = t.pnl !== undefined;
  return `<div class="trade-card" data-id="${t.id}">
    <div class="thumb-wrap">
      ${tradeImages(t).length ? `<img src="${tradeImages(t)[0].data}" alt="">` : `<div class="thumb-placeholder">${ICONS.image}</div>`}
      ${tradeImages(t).length > 1 ? `<div class="badge-count">+${tradeImages(t).length - 1}</div>` : ''}
      <div class="badge-dir ${t.direction}">${t.direction === 'short' ? 'SHORT' : 'LONG'}</div>
      ${g ? `<div class="badge-grade" style="background:${g.color};color:#04120e;">${g.label}</div>` : ''}
    </div>
    <div class="body">
      <div class="sym-row"><span class="sym">${escapeHtml(t.symbol)}</span><span class="date">${t.date}</span></div>
      <div class="prices mono">${t.entryPrice} → ${t.exitPrice ?? '—'}</div>
      <div class="foot">
        <span class="qty mono">${t.qty} size</span>
        <span class="pnl-tag mono" style="${'color:'+pnlColor(hasPnl?t.pnl:undefined)}">${hasPnl ? fmtMoneyShort(t.pnl) : 'open'}</span>
      </div>
    </div>
  </div>`;
}

function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ============== Trade History ==============
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
function renderTradeHistoryList(){
  const trades = getFilteredLogTrades();
  const list = $('#trade-list');
  if(!list) return;
  list.innerHTML = trades.length ? `<div class="trade-card-grid">${trades.map(tradeCardHtml).join('')}</div>` :
    `<div class="empty-state">${ICONS.empty}<div>No trades match your filters</div></div>`;
  $$('#trade-list .trade-card').forEach(el=> el.addEventListener('click', ()=> openTradeDetailModal(el.dataset.id)));
}
function renderTradeHistory(view){
  view.innerHTML = `
    <div class="topbar">
      <div><h1>Trade History</h1><div class="sub">Every trade, at a glance</div></div>
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
    <div id="trade-list"></div>
  `;
  renderTradeHistoryList();
  $('#btn-new-trade').addEventListener('click', ()=> openTradeModal());
  $('#f-q').addEventListener('input', e=>{ logFilter.q = e.target.value; renderTradeHistoryList(); });
  $('#f-dir').addEventListener('change', e=>{ logFilter.dir = e.target.value; renderTradeHistoryList(); });
  $('#f-setup').addEventListener('change', e=>{ logFilter.setup = e.target.value; renderTradeHistoryList(); });
}

// ============== Archive (folder browser: year → month → trades) ==============
function renderArchive(view){
  const trades = filteredTrades().filter(t=> t.pnl !== undefined);
  const { year, month } = state.archive;

  const crumbs = [`<span data-crumb="root" class="${!year?'current':''}">Archive</span>`];
  if(year){ crumbs.push(`<span class="sep">/</span><span data-crumb="year" class="${!month&&month!==0?'current':''}">${year}</span>`); }
  if(month !== null && month !== undefined && year){
    crumbs.push(`<span class="sep">/</span><span class="current">${new Date(year, month, 1).toLocaleDateString(undefined,{month:'long'})}</span>`);
  }

  let body = '';
  if(!year){
    // level 0: years
    const byYear = {};
    trades.forEach(t=>{ const y = t.date.slice(0,4); byYear[y] = byYear[y] || { count:0, pnl:0 }; byYear[y].count++; byYear[y].pnl += t.pnl; });
    const years = Object.keys(byYear).sort((a,b)=> b-a);
    body = years.length ? `<div class="folder-grid">${years.map(y=> `
      <div class="folder-card" data-year="${y}">
        ${ICONS.folder}
        <div class="f-title">${y}</div>
        <div class="f-meta">${byYear[y].count} trade${byYear[y].count===1?'':'s'} · <span style="color:${byYear[y].pnl>=0?'var(--green)':'var(--red)'}">${fmtMoneyShort(byYear[y].pnl)}</span></div>
      </div>`).join('')}</div>` : `<div class="empty-state">${ICONS.empty}<div>No journaled trades yet</div></div>`;
  } else if(month === null || month === undefined){
    // level 1: months within year
    const byMonth = {};
    trades.filter(t=> t.date.slice(0,4) === String(year)).forEach(t=>{
      const m = +t.date.slice(5,7) - 1;
      byMonth[m] = byMonth[m] || { count:0, pnl:0 };
      byMonth[m].count++; byMonth[m].pnl += t.pnl;
    });
    const months = Object.keys(byMonth).map(Number).sort((a,b)=> b-a);
    body = months.length ? `<div class="folder-grid">${months.map(m=> `
      <div class="folder-card" data-month="${m}">
        ${ICONS.folder}
        <div class="f-title">${new Date(year, m, 1).toLocaleDateString(undefined,{month:'long'})}</div>
        <div class="f-meta">${byMonth[m].count} trade${byMonth[m].count===1?'':'s'} · <span style="color:${byMonth[m].pnl>=0?'var(--green)':'var(--red)'}">${fmtMoneyShort(byMonth[m].pnl)}</span></div>
      </div>`).join('')}</div>` : `<div class="empty-state">${ICONS.empty}<div>No trades in ${year}</div></div>`;
  } else {
    // level 2: trades in that month
    const monthTrades = trades.filter(t=> t.date.slice(0,4) === String(year) && (+t.date.slice(5,7)-1) === month);
    body = monthTrades.length ? `<div class="trade-card-grid">${monthTrades.map(tradeCardHtml).join('')}</div>` :
      `<div class="empty-state">${ICONS.empty}<div>No trades that month</div></div>`;
  }

  view.innerHTML = `
    <div class="topbar"><div><h1>Archive</h1><div class="sub">Organized by year and month</div></div></div>
    <div class="breadcrumb">${crumbs.join('')}</div>
    <div id="archive-body">${body}</div>
  `;

  $$('[data-crumb="root"]', view).forEach(el=> el.addEventListener('click', ()=>{ state.archive = { year:null, month:null }; renderArchive(view); }));
  $$('[data-crumb="year"]', view).forEach(el=> el.addEventListener('click', ()=>{ state.archive.month = null; renderArchive(view); }));
  $$('[data-year]', view).forEach(el=> el.addEventListener('click', ()=>{ state.archive.year = el.dataset.year; renderArchive(view); }));
  $$('[data-month]', view).forEach(el=> el.addEventListener('click', ()=>{ state.archive.month = +el.dataset.month; renderArchive(view); }));
  $$('.trade-card', view).forEach(el=> el.addEventListener('click', ()=> openTradeDetailModal(el.dataset.id)));
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

  const cellsArr = [];
  for(let i=0;i<startWeekday;i++) cellsArr.push(null);
  for(let d=1; d<=daysInMonth; d++){
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cellsArr.push({ d, dateStr, pnl: byDay[dateStr] });
  }
  while(cellsArr.length % 7 !== 0) cellsArr.push(null);
  const weeks = [];
  for(let i=0;i<cellsArr.length;i+=7) weeks.push(cellsArr.slice(i,i+7));

  const weeksHtml = weeks.map(week=>{
    const hasAny = week.some(c=> c && c.pnl !== undefined);
    const weekTotal = week.reduce((s,c)=> s + (c && c.pnl!==undefined? c.pnl : 0), 0);
    const dayCells = week.map(c=>{
      if(!c) return `<div class="cal-cell empty"></div>`;
      const cls = c.pnl===undefined ? '' : (c.pnl===0 ? 'be' : (c.pnl>0?'pos':'neg'));
      return `<div class="cal-cell ${cls} ${c.dateStr===todayStr?'today':''}" ${c.pnl!==undefined?`data-date="${c.dateStr}"`:''}>
        <div class="d">${c.d}</div>
        ${c.pnl !== undefined ? `<div class="amt mono" style="color:${pnlColor(c.pnl)}">${fmtMoneyShort(c.pnl)}</div>` : ''}
      </div>`;
    }).join('');
    const totalCell = state.showWeeklyPnl
      ? `<div class="cal-week-total mono" style="color:${hasAny?pnlColor(weekTotal):'var(--text2)'}">${hasAny?fmtMoneyShort(weekTotal):'—'}</div>`
      : '';
    return `<div class="cal-week-row"><div class="cal-week-days">${dayCells}</div>${totalCell}</div>`;
  }).join('');

  const dowHeader = `<div class="cal-week-row" style="margin-bottom:8px;">
    <div class="cal-week-days">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="cal-dow">${d}</div>`).join('')}</div>
    ${state.showWeeklyPnl ? `<div class="cal-week-total-label">Week</div>` : ''}
  </div>`;

  view.innerHTML = `
    <div class="topbar">
      <div><h1>Calendar</h1><div class="sub">Daily P&amp;L</div></div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-sm ${state.showWeeklyPnl?'btn-primary':''}" id="cal-weekly-toggle">Weekly P&amp;L: ${state.showWeeklyPnl?'On':'Off'}</button>
        <button class="btn btn-sm" id="cal-prev">&lt;</button>
        <div class="mono" style="min-width:140px;text-align:center;font-weight:700;">${first.toLocaleDateString(undefined,{month:'long', year:'numeric'})}</div>
        <button class="btn btn-sm" id="cal-next">&gt;</button>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div class="stat" style="padding:0;"><div class="label">Month Net P&amp;L</div><div class="value mono" style="color:${pnlColor(monthPnl)}">${fmtMoneyShort(monthPnl)}</div></div>
    </div>
    <div class="card">
      ${dowHeader}
      ${weeksHtml}
    </div>
  `;
  $('#cal-prev').addEventListener('click', ()=>{ calCursor = new Date(y, m-1, 1); renderCalendar(view); });
  $('#cal-next').addEventListener('click', ()=>{ calCursor = new Date(y, m+1, 1); renderCalendar(view); });
  $('#cal-weekly-toggle').addEventListener('click', async ()=>{
    await DB.meta.put('showWeeklyPnl', !state.showWeeklyPnl);
    await refreshData(); renderCalendar(view);
  });
  $$('.cal-cell[data-date]', view).forEach(el=> el.addEventListener('click', ()=> openDayTradesModal(el.dataset.date)));
}

function openDayTradesModal(dateStr){
  const trades = filteredTrades().filter(t=> t.date === dateStr && t.pnl !== undefined);
  const dayPnl = trades.reduce((s,t)=> s+t.pnl, 0);
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h2>${new Date(dateStr+'T00:00:00').toLocaleDateString(undefined,{weekday:'long', month:'long', day:'numeric'})}</h2>
        <button class="close-x" id="modal-close">&times;</button>
      </div>
      <div class="stat" style="padding:0 0 14px;"><div class="label">Day Net P&amp;L</div><div class="value mono" style="color:${pnlColor(dayPnl)}">${fmtMoneyShort(dayPnl)}</div></div>
      ${trades.length ? `<div class="trade-card-grid">${trades.map(tradeCardHtml).join('')}</div>` : `<div class="empty-state">${ICONS.empty}<div>No trades that day</div></div>`}
    </div>
  `;
  document.body.appendChild(backdrop);
  function close(){ backdrop.remove(); }
  backdrop.querySelector('#modal-close').addEventListener('click', close);
  backdrop.addEventListener('click', e=>{ if(e.target === backdrop) close(); });
  $$('.trade-card', backdrop).forEach(el=> el.addEventListener('click', ()=>{ close(); openTradeDetailModal(el.dataset.id); }));
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
      <div class="grid-3" style="grid-template-columns:repeat(3,1fr);">
        <div class="card stat"><div class="label">Avg Win</div><div class="value pos mono">${fmtMoneyShort(s.avgWin)}</div></div>
        <div class="card stat"><div class="label">Avg Loss</div><div class="value neg mono">${fmtMoneyShort(s.avgLoss)}</div></div>
        <div class="card stat"><div class="label">Max Drawdown</div><div class="value neg mono">${fmtMoneyShort(-s.maxDD)}</div></div>
        <div class="card stat"><div class="label">Max Run-up</div><div class="value pos mono">${fmtMoneyShort(s.maxRunup)}</div></div>
        <div class="card stat"><div class="label">Expectancy</div><div class="value gold mono">${fmtMoneyShort(s.expectancy)}</div></div>
        <div class="card stat"><div class="label">Day Win Rate</div><div class="value gold mono">${s.dayWinRate.toFixed(1)}%</div></div>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div class="section-title">Days Breakdown</div>
      <div class="grid-3">
        <div class="card stat" style="background:var(--bg-2);"><div class="label">Winning Days</div><div class="value pos mono">${s.winDays}</div></div>
        <div class="card stat" style="background:var(--bg-2);"><div class="label">Losing Days</div><div class="value neg mono">${s.lossDays}</div></div>
        <div class="card stat" style="background:var(--bg-2);"><div class="label">Breakeven Days</div><div class="value mono" style="color:var(--grey);">${s.breakEvenDays}</div></div>
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

// ============== Streaks ==============
function renderStreaks(view){
  const trades = filteredTrades();
  const closed = trades.filter(t=> t.pnl !== undefined);
  const streaks = computeStreaks(trades);
  const xpInfo = computeXP(closed);

  view.innerHTML = `
    <div class="topbar"><div><h1>Streaks</h1><div class="sub">Build discipline, not just profit</div></div></div>

    <div class="card xp-card" style="margin-bottom:16px;">
      <div class="xp-level-badge"><div class="lvl-num">${xpInfo.level}</div><div class="lvl-lbl">Level</div></div>
      <div class="xp-bar-track">
        <div class="xp-bar-bg"><div class="xp-bar-fill" style="width:${(xpInfo.xpIntoLevel/xpInfo.xpForNext*100).toFixed(0)}%"></div></div>
        <div class="xp-bar-label"><span>${xpInfo.xpIntoLevel} XP</span><span>${xpInfo.xpForNext - xpInfo.xpIntoLevel} XP to level ${xpInfo.level+1}</span></div>
      </div>
    </div>

    <div class="streak-grid" style="margin-bottom:16px;">
      <div class="card streak-stat"><div class="label">Win Streak</div><div class="num" style="color:var(--green);">${streaks.winStreakCurrent}</div><div class="best">Best: ${streaks.winStreakBest}</div></div>
      <div class="card streak-stat"><div class="label">Loss Streak</div><div class="num" style="color:var(--red);">${streaks.lossStreakCurrent}</div><div class="best">Worst: ${streaks.lossStreakBest}</div></div>
      <div class="card streak-stat"><div class="label">Profit Day Streak</div><div class="num" style="color:var(--gold);">${streaks.profitDayStreakCurrent}</div><div class="best">Best: ${streaks.profitDayStreakBest}</div></div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="checklist-card-head"><div class="section-title" style="margin:0;">Your Goals</div></div>
      <div class="checklist" id="goals-list"></div>
      <div class="checklist-add">
        <input id="goal-text" placeholder="Add a goal, e.g. Journal every trade this week">
        <button class="btn btn-sm" id="goal-add">${ICONS.plus}</button>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Achievements</div>
      <div class="badge-grid">
        ${ACHIEVEMENTS.map(a=>{
          const unlocked = a.check(closed, streaks);
          return `<div class="achievement ${unlocked?'':'locked'}">
            <div class="emoji">${a.emoji}</div>
            <div class="a-title">${a.title}</div>
            <div class="a-desc">${a.desc}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;

  renderGoalsList();
  $('#goal-add').addEventListener('click', async ()=>{
    const text = $('#goal-text').value.trim();
    if(!text) return;
    await DB.goals.put({ id: DB.uid(), text, done:false });
    await refreshData(); renderGoalsList(); $('#goal-text').value='';
  });
}

function renderGoalsList(){
  const el = $('#goals-list');
  if(!el) return;
  el.innerHTML = state.goals.length ? state.goals.map(g=> `
    <div class="checklist-item ${g.done?'done':''}">
      <input type="checkbox" data-goal-toggle="${g.id}" ${g.done?'checked':''}>
      <span>${escapeHtml(g.text)}</span>
      <button class="del" data-goal-del="${g.id}">×</button>
    </div>`).join('') : `<div style="color:var(--text1);font-size:13px;padding:6px 0;">No goals yet — add one below.</div>`;
  $$('[data-goal-toggle]', el).forEach(cb=> cb.addEventListener('change', async ()=>{
    const g = state.goals.find(x=> x.id === cb.dataset.goalToggle);
    g.done = cb.checked;
    await DB.goals.put(g); await refreshData(); renderGoalsList();
  }));
  $$('[data-goal-del]', el).forEach(b=> b.addEventListener('click', async ()=>{
    await DB.goals.delete(b.dataset.goalDel); await refreshData(); renderGoalsList();
  }));
}
async function recomputeAccountMinBalance(accountId){
  const acc = state.accounts.find(a=> a.id === accountId);
  if(!acc) return;
  const trades = state.trades
    .filter(t=> tradeAccountIds(t).includes(accountId) && t.pnl !== undefined)
    .sort((a,b)=> a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  let running = acc.balance || 0;
  let minSeen = running;
  trades.forEach(t=>{ running += t.pnl; minSeen = Math.min(minSeen, running); });
  acc.minBalance = minSeen;
  await DB.accounts.put(acc);
}

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

    <div class="card" style="margin-bottom:16px;">
      <div class="section-title">Trade Journal Fields</div>
      <p style="color:var(--text1);font-size:13px;margin-top:0;">Turn off any of these and they won't appear on the New Trade form.</p>
      <div class="checklist" id="field-toggles">
        ${[
          ['emotionsBefore','Emotions Before'], ['emotionsDuring','Emotions During'],
          ['mistakes','Mistakes'], ['lessons','Lessons']
        ].map(([key,label])=> `
          <div class="checklist-item">
            <input type="checkbox" data-field-toggle="${key}" ${state.fieldVisibility[key]?'checked':''}>
            <span>${label}</span>
          </div>`).join('')}
      </div>
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
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="text-align:right;">
          <div class="bal">${fmtMoney(a.balance||0)}</div>
          <div style="font-size:11px;color:var(--text2);">Min reached: ${fmtMoney(a.minBalance!=null?a.minBalance:(a.balance||0))}</div>
        </div>
        <button class="btn btn-sm btn-danger" data-del-acc="${a.id}">Remove</button>
      </div>
    </div>`).join('') || `<div style="color:var(--text1);font-size:13px;">No accounts yet.</div>`;

  $$('[data-field-toggle]').forEach(cb=> cb.addEventListener('change', async ()=>{
    const updated = { ...state.fieldVisibility, [cb.dataset.fieldToggle]: cb.checked };
    await DB.meta.put('fieldVisibility', updated);
    await refreshData();
  }));

  $('#setups-list').innerHTML = state.setups.map(s=> `
    <div class="list-editor-row"><span>${escapeHtml(s.name)}</span><button class="btn btn-sm btn-danger" data-del-setup="${s.id}">×</button></div>
  `).join('') || `<div style="color:var(--text1);font-size:13px;">No setups yet.</div>`;

  $('#rules-list').innerHTML = state.rules.map(r=> `
    <div class="list-editor-row"><span>${escapeHtml(r.text)}</span><button class="btn btn-sm btn-danger" data-del-rule="${r.id}">×</button></div>
  `).join('') || `<div style="color:var(--text1);font-size:13px;">No rules yet.</div>`;

  $('#acc-add').addEventListener('click', async ()=>{
    const name = $('#acc-name').value.trim();
    if(!name) return toast('Give the account a name');
    const balance = parseFloat($('#acc-balance').value)||0;
    await DB.accounts.put({ id: DB.uid(), name, type: $('#acc-type').value, balance, minBalance: balance });
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

// ============== Trade detail (view) modal ==============
function detailSection(title, text){
  if(!text || !String(text).trim()) return '';
  return `<div class="detail-block"><div class="section-title" style="margin-bottom:6px;">${title}</div><p class="detail-text">${escapeHtml(text)}</p></div>`;
}

function galleryHtml(t){
  const imgs = tradeImages(t);
  if(!imgs.length) return '';
  return `<div class="detail-gallery">${imgs.map((img,i)=> `
    <div class="detail-gallery-item" data-zoom-idx="${i}">
      <img src="${img.data}" alt="${escapeHtml(img.name||'')}">
      ${img.name ? `<div class="detail-gallery-caption">${escapeHtml(img.name)}</div>` : ''}
    </div>`).join('')}</div>`;
}

function openImageLightbox(src, name){
  let scale = 1;
  const lb = document.createElement('div');
  lb.className = 'lightbox-backdrop';
  lb.innerHTML = `
    <button class="close-x lightbox-close" id="lb-close">&times;</button>
    <div class="lightbox-zoom-controls">
      <button id="lb-out">−</button>
      <button id="lb-reset">Reset</button>
      <button id="lb-in">+</button>
    </div>
    <div class="lightbox-imgwrap"><img src="${src}" id="lb-img" alt=""></div>
    ${name ? `<div class="lightbox-caption">${escapeHtml(name)}</div>` : ''}
  `;
  document.body.appendChild(lb);
  const img = lb.querySelector('#lb-img');
  function applyScale(){ img.style.transform = `scale(${scale})`; img.style.cursor = scale > 1 ? 'zoom-out' : 'zoom-in'; }
  img.addEventListener('click', e=>{ e.stopPropagation(); scale = scale > 1 ? 1 : 2.2; applyScale(); });
  lb.querySelector('#lb-in').addEventListener('click', ()=>{ scale = Math.min(4, scale + 0.5); applyScale(); });
  lb.querySelector('#lb-out').addEventListener('click', ()=>{ scale = Math.max(1, scale - 0.5); applyScale(); });
  lb.querySelector('#lb-reset').addEventListener('click', ()=>{ scale = 1; applyScale(); });
  function close(){ lb.remove(); document.removeEventListener('keydown', onKey); }
  function onKey(e){ if(e.key === 'Escape') close(); }
  lb.addEventListener('click', e=>{ if(e.target === lb) close(); });
  lb.querySelector('#lb-close').addEventListener('click', close);
  document.addEventListener('keydown', onKey);
}

function openTradeDetailModal(id){
  const t = state.trades.find(x=> x.id === id);
  if(!t) return;
  const g = gradeInfo(t.grade);
  const hasPnl = t.pnl !== undefined;
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <div class="modal-head">
        <h2>${escapeHtml(t.symbol)} <span class="dir ${t.direction}" style="display:inline-flex;margin-left:8px;vertical-align:middle;">${t.direction==='short'?'SHORT':'LONG'}</span></h2>
        <button class="close-x" id="modal-close">&times;</button>
      </div>
      ${galleryHtml(t)}
      <div class="detail-stats">
        <div><div class="dl">Date</div><div class="dv">${t.date}</div></div>
        <div><div class="dl">Session</div><div class="dv">${t.session ? escapeHtml(t.session) : '—'}</div></div>
        <div><div class="dl">Size</div><div class="dv mono">${t.qty}</div></div>
        <div><div class="dl">Entry</div><div class="dv mono">${t.entryPrice}</div></div>
        <div><div class="dl">Exit</div><div class="dv mono">${t.exitPrice ?? '—'}</div></div>
        <div><div class="dl">P&amp;L</div><div class="dv mono" style="${'color:'+pnlColor(hasPnl?t.pnl:undefined)}">${hasPnl ? fmtMoneyShort(t.pnl) : 'open'}</div></div>
        <div><div class="dl">Grade</div><div class="dv" style="color:${g?g.color:'var(--text2)'};">${g?g.label:'—'}</div></div>
        <div><div class="dl">Setup</div><div class="dv">${t.setup ? escapeHtml(t.setup) : '—'}</div></div>
      </div>
      ${detailSection('Emotions Before', t.emotionsBefore)}
      ${detailSection('Emotions During', t.emotionsDuring)}
      ${detailSection('Notes', t.notes)}
      ${detailSection('Mistakes', t.mistakes)}
      ${detailSection('Lessons', t.lessons)}
      <div style="display:flex;justify-content:space-between;margin-top:6px;">
        <button class="btn btn-danger" id="d-delete">Delete</button>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-ghost" id="d-close">Close</button>
          <button class="btn btn-primary" id="d-edit">Edit</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  function close(){ backdrop.remove(); }
  backdrop.querySelector('#modal-close').addEventListener('click', close);
  backdrop.querySelector('#d-close').addEventListener('click', close);
  backdrop.addEventListener('click', e=>{ if(e.target === backdrop) close(); });
  backdrop.querySelector('#d-edit').addEventListener('click', ()=>{ close(); openTradeModal(id); });
  backdrop.querySelector('#d-delete').addEventListener('click', async ()=>{
    if(!confirm('Delete this trade? This cannot be undone.')) return;
    const accIds = tradeAccountIds(t);
    await DB.trades.delete(id); await refreshData();
    for(const accId of accIds) await recomputeAccountMinBalance(accId);
    await refreshData(); renderView(); close(); toast('Trade deleted');
  });
  const imgs = tradeImages(t);
  $$('.detail-gallery-item', backdrop).forEach(el=> el.addEventListener('click', ()=>{
    const img = imgs[+el.dataset.zoomIdx];
    openImageLightbox(img.data, img.name);
  }));
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
        <div class="field"><label>Exit price</label><input id="t-exit" type="number" step="any" value="${editing&&editing.exitPrice!=null?editing.exitPrice:''}"></div>
        <div class="field"><label>Size</label><input id="t-qty" type="number" step="any" value="${editing?editing.qty:'1'}"></div>
      </div>
      <div class="field-row-pnl">
        <div class="field"><label>P&amp;L($)</label><input id="t-pnl" type="number" step="any" value="${editing?(editing.pnlInput||0):'0'}"></div>
        <div class="field"><label>Account(s)</label>
          <div class="tag-list" id="t-account-tags">${state.accounts.map(a=>`<div class="tag ${editing? (tradeAccountIds(editing).includes(a.id)?'on':'') : (state.accounts[0]&&state.accounts[0].id===a.id?'on':'')}" data-account="${a.id}">${escapeHtml(a.name)}</div>`).join('') || '<span style="color:var(--text1);font-size:12px;">Add accounts in Settings</span>'}</div>
        </div>
        <div class="field"><label>Session</label>
          <select id="t-session"><option value="">Select session</option>${SESSIONS.map(s=>`<option value="${s}" ${editing&&editing.session===s?'selected':''}>${s}</option>`).join('')}</select>
        </div>
      </div>
      <div class="field"><label>Setup</label>
        <div class="tag-list" id="t-setup-tags">${state.setups.map(s=>`<div class="tag ${editing&&editing.setup===s.name?'on':''}" data-setup="${escapeHtml(s.name)}">${escapeHtml(s.name)}</div>`).join('') || '<span style="color:var(--text1);font-size:12px;">Add setups in Settings</span>'}</div>
      </div>
      <div class="field"><label>Grade</label>
        <div class="grade-row" id="t-grade">${GRADES.map(g=> `
          <div class="grade-box" data-grade="${g.id}">
            <span class="letter">${g.label}</span><span class="desc">${g.desc}</span>
          </div>`).join('')}</div>
      </div>
      ${state.fieldVisibility.emotionsBefore ? `<div class="field"><label>Emotions Before</label><textarea id="t-emo-before" placeholder="How did you feel going into this trade?">${editing?escapeHtml(editing.emotionsBefore||''):''}</textarea></div>` : ''}
      ${state.fieldVisibility.emotionsDuring ? `<div class="field"><label>Emotions During</label><textarea id="t-emo-during" placeholder="How did you feel while it played out?">${editing?escapeHtml(editing.emotionsDuring||''):''}</textarea></div>` : ''}
      <div class="field"><label>Notes</label><textarea id="t-notes" placeholder="Setup reasoning, execution…">${editing?escapeHtml(editing.notes||''):''}</textarea></div>
      ${state.fieldVisibility.mistakes ? `<div class="field"><label>Mistakes</label><textarea id="t-mistakes" placeholder="What went wrong?">${editing?escapeHtml(editing.mistakes||''):''}</textarea></div>` : ''}
      ${state.fieldVisibility.lessons ? `<div class="field"><label>Lessons</label><textarea id="t-lessons" placeholder="What will you do differently?">${editing?escapeHtml(editing.lessons||''):''}</textarea></div>` : ''}
      <div class="field"><label>Chart screenshots</label>
        <div class="img-drop" id="t-img-drop">Click to add screenshot(s) — you can select more than one</div>
        <input type="file" id="t-img-input" accept="image/*" multiple style="display:none;">
        <div class="image-manager" id="t-img-list"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;">
        <div>${editing? `<button class="btn btn-danger" id="t-delete">Delete</button>` : ''}</div>
        <div style="display:flex;gap:10px;"><button class="btn btn-ghost" id="t-cancel">Cancel</button><button class="btn btn-primary" id="t-save">Save Trade</button></div>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  let selectedDir = editing? editing.direction : 'long';
  let selectedSetup = editing? editing.setup : '';
  let selectedGrade = editing? (editing.grade||'') : '';
  let selectedAccountIds = editing? tradeAccountIds(editing) : (state.accounts[0] ? [state.accounts[0].id] : []);
  let photos = editing? tradeImages(editing).map(p=> ({...p})) : [];

  function renderImageManager(){
    const el = backdrop.querySelector('#t-img-list');
    el.innerHTML = photos.length ? photos.map((p,idx)=> `
      <div class="image-manager-item">
        <img src="${p.data}" class="image-manager-thumb" data-zoom-idx="${idx}" alt="">
        <input type="text" class="image-manager-name" data-name-idx="${idx}" placeholder="Name this photo" value="${escapeHtml(p.name||'')}">
        <button class="del" data-del-idx="${idx}" title="Remove photo">×</button>
      </div>`).join('') : `<div style="color:var(--text1);font-size:12px;padding:4px 0;">No photos attached yet.</div>`;
    $$('.image-manager-thumb', el).forEach(img=> img.addEventListener('click', ()=>{
      const p = photos[+img.dataset.zoomIdx]; openImageLightbox(p.data, p.name);
    }));
    $$('.image-manager-name', el).forEach(inp=> inp.addEventListener('input', e=>{
      photos[+inp.dataset.nameIdx].name = e.target.value;
    }));
    $$('[data-del-idx]', el).forEach(btn=> btn.addEventListener('click', ()=>{
      photos.splice(+btn.dataset.delIdx, 1); renderImageManager();
    }));
  }
  renderImageManager();

  function syncDir(){ $$('.pill-choice',backdrop).forEach(el=> el.classList.toggle('on', el.dataset.dir===selectedDir)); }
  function syncGrade(){
    $$('.grade-box', backdrop).forEach(el=>{
      const g = gradeInfo(el.dataset.grade);
      const on = el.dataset.grade === selectedGrade;
      el.classList.toggle('on', on);
      el.style.background = on ? g.color : '';
      el.style.borderColor = on ? g.color : '';
    });
  }
  syncDir(); syncGrade();

  $$('.pill-choice', backdrop).forEach(el=> el.addEventListener('click', ()=>{ selectedDir = el.dataset.dir; syncDir(); }));
  $$('#t-setup-tags .tag', backdrop).forEach(el=> el.addEventListener('click', ()=>{
    selectedSetup = (selectedSetup === el.dataset.setup) ? '' : el.dataset.setup;
    $$('#t-setup-tags .tag', backdrop).forEach(t=> t.classList.toggle('on', t.dataset.setup===selectedSetup));
  }));
  $$('#t-account-tags .tag', backdrop).forEach(el=> el.addEventListener('click', ()=>{
    const id = el.dataset.account;
    if(selectedAccountIds.includes(id)) selectedAccountIds = selectedAccountIds.filter(x=> x!==id);
    else selectedAccountIds.push(id);
    el.classList.toggle('on', selectedAccountIds.includes(id));
  }));
  $$('.grade-box', backdrop).forEach(el=> el.addEventListener('click', ()=>{
    selectedGrade = (selectedGrade === el.dataset.grade) ? '' : el.dataset.grade; syncGrade();
  }));

  const dropEl = backdrop.querySelector('#t-img-drop');
  const imgInput = backdrop.querySelector('#t-img-input');

  function addPhotoFiles(fileList){
    Array.from(fileList).forEach(file=>{
      if(!file.type || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = ()=>{
        photos.push({ id: DB.uid(), name: file.name ? file.name.replace(/\.[^.]+$/,'') : '', data: reader.result });
        renderImageManager();
      };
      reader.readAsDataURL(file); // full-quality data URL, no resizing/recompression
    });
  }

  dropEl.addEventListener('click', ()=> imgInput.click());
  imgInput.addEventListener('change', ()=>{ addPhotoFiles(imgInput.files); imgInput.value = ''; });
  dropEl.addEventListener('dragover', e=>{ e.preventDefault(); dropEl.classList.add('drag-over'); });
  dropEl.addEventListener('dragleave', ()=> dropEl.classList.remove('drag-over'));
  dropEl.addEventListener('drop', e=>{
    e.preventDefault(); dropEl.classList.remove('drag-over');
    if(e.dataTransfer && e.dataTransfer.files.length) addPhotoFiles(e.dataTransfer.files);
  });
  function onPaste(e){
    if(!e.clipboardData) return;
    const items = Array.from(e.clipboardData.items).filter(i=> i.type && i.type.startsWith('image/'));
    if(!items.length) return;
    const files = items.map(i=> i.getAsFile()).filter(Boolean);
    if(files.length) addPhotoFiles(files);
  }
  document.addEventListener('paste', onPaste);

  function close(){ backdrop.remove(); document.removeEventListener('paste', onPaste); }
  backdrop.querySelector('#modal-close').addEventListener('click', close);
  backdrop.querySelector('#t-cancel').addEventListener('click', close);
  backdrop.addEventListener('click', e=>{ if(e.target === backdrop) close(); });

  if(editing){
    backdrop.querySelector('#t-delete').addEventListener('click', async ()=>{
      if(!confirm('Delete this trade? This cannot be undone.')) return;
      const accIds = tradeAccountIds(editing);
      await DB.trades.delete(editing.id); await refreshData();
      for(const accId of accIds) await recomputeAccountMinBalance(accId);
      await refreshData(); renderView(); close(); toast('Trade deleted');
    });
  }

  backdrop.querySelector('#t-save').addEventListener('click', async ()=>{
    const symbol = backdrop.querySelector('#t-symbol').value.trim();
    const date = backdrop.querySelector('#t-date').value;
    const entryPrice = parseFloat(backdrop.querySelector('#t-entry').value);
    const exitRaw = backdrop.querySelector('#t-exit').value;
    const qty = parseFloat(backdrop.querySelector('#t-qty').value);
    if(!symbol || !date || isNaN(entryPrice) || isNaN(qty)){
      toast('Symbol, date, entry price and size are required'); return;
    }
    const readField = (id, fallback)=>{ const el = backdrop.querySelector('#'+id); return el ? el.value.trim() : (fallback!==undefined? fallback : (editing?editing[id]:'')); };
    const oldAccountIds = editing ? tradeAccountIds(editing) : [];
    const trade = {
      id: editing? editing.id : DB.uid(),
      createdAt: editing? editing.createdAt : Date.now(),
      symbol, date, direction: selectedDir,
      entryPrice, exitPrice: exitRaw === '' ? null : parseFloat(exitRaw),
      qty, pnlInput: parseFloat(backdrop.querySelector('#t-pnl').value)||0,
      accountIds: selectedAccountIds,
      session: backdrop.querySelector('#t-session').value,
      setup: selectedSetup, grade: selectedGrade,
      images: photos,
      emotionsBefore: backdrop.querySelector('#t-emo-before') ? backdrop.querySelector('#t-emo-before').value.trim() : (editing?editing.emotionsBefore||'':''),
      emotionsDuring: backdrop.querySelector('#t-emo-during') ? backdrop.querySelector('#t-emo-during').value.trim() : (editing?editing.emotionsDuring||'':''),
      notes: backdrop.querySelector('#t-notes').value.trim(),
      mistakes: backdrop.querySelector('#t-mistakes') ? backdrop.querySelector('#t-mistakes').value.trim() : (editing?editing.mistakes||'':''),
      lessons: backdrop.querySelector('#t-lessons') ? backdrop.querySelector('#t-lessons').value.trim() : (editing?editing.lessons||'':'')
    };
    await DB.trades.put(trade);
    const affectedAccounts = Array.from(new Set([...oldAccountIds, ...selectedAccountIds]));
    await refreshData();
    for(const accId of affectedAccounts) await recomputeAccountMinBalance(accId);
    await refreshData(); renderView(); close(); toast('Trade saved');
  });
}

// ============== Boot ==============
function showBootError(err){
  const isBlocked = err && err.message === 'DB_BLOCKED';
  const isTimeout = err && err.message === 'DB_TIMEOUT';
  const msg = (isBlocked || isTimeout)
    ? "This app couldn't open its local database — this usually happens when another tab or window of VaultX is already open somewhere. Close every other VaultX tab, then reload this page."
    : "Something went wrong while loading your data. Reloading usually fixes it.";
  $('#view').innerHTML = `
    <div class="card" style="max-width:520px;margin-top:60px;">
      <div class="section-title">Couldn't load VaultX</div>
      <p style="color:var(--text1);font-size:13.5px;line-height:1.6;">${msg}</p>
      <button class="btn btn-primary" id="boot-retry" style="margin-top:6px;">Reload</button>
    </div>`;
  const btn = $('#boot-retry');
  if(btn) btn.addEventListener('click', ()=> location.reload());
}

async function boot(){
  try{
    const timeout = new Promise((_,reject)=> setTimeout(()=> reject(new Error('DB_TIMEOUT')), 6000));
    await Promise.race([DB.seedIfEmpty(), timeout]);
    await refreshData();
    const initial = (location.hash.replace('#/','') || 'dashboard');
    state.route = ['dashboard','trades','archive','calendar','analytics','streaks','settings'].includes(initial) ? initial : 'dashboard';
    renderShell();
    renderView();

    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
    }
  }catch(err){
    console.error('Boot failed:', err);
    showBootError(err);
  }
}
boot();
