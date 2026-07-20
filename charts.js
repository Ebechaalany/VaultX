// charts.js — minimal canvas drawing, no dependency, works fully offline.

function fitCanvas(canvas){
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return { ctx, w: rect.width, h: rect.height };
}

function drawEquityCurve(canvas, series){
  const { ctx, w, h } = fitCanvas(canvas);
  ctx.clearRect(0,0,w,h);
  const pad = { l:8, r:8, t:14, b:8 };
  if(series.length < 2){
    ctx.fillStyle = '#5b6472';
    ctx.font = '12px Inter';
    ctx.fillText('Log a few trades to see your equity curve', pad.l, h/2);
    return;
  }
  const min = Math.min(0, ...series);
  const max = Math.max(0, ...series);
  const range = (max - min) || 1;
  const stepX = (w - pad.l - pad.r) / (series.length - 1);
  const xAt = i => pad.l + i*stepX;
  const yAt = v => pad.t + (h - pad.t - pad.b) * (1 - (v - min) / range);

  const isUp = series[series.length-1] >= series[0];
  const lineColor = isUp ? '#34d67a' : '#f2555a';

  // area fill
  const grad = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
  grad.addColorStop(0, isUp ? 'rgba(52,214,122,.28)' : 'rgba(242,85,90,.28)');
  grad.addColorStop(1, isUp ? 'rgba(52,214,122,0)' : 'rgba(242,85,90,0)');
  ctx.beginPath();
  ctx.moveTo(xAt(0), yAt(series[0]));
  series.forEach((v,i)=> ctx.lineTo(xAt(i), yAt(v)));
  ctx.lineTo(xAt(series.length-1), h - pad.b);
  ctx.lineTo(xAt(0), h - pad.b);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // zero line
  if(min < 0 && max > 0){
    ctx.strokeStyle = 'rgba(139,150,165,.25)';
    ctx.setLineDash([3,4]);
    ctx.beginPath();
    ctx.moveTo(pad.l, yAt(0));
    ctx.lineTo(w-pad.r, yAt(0));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // line
  ctx.beginPath();
  ctx.moveTo(xAt(0), yAt(series[0]));
  series.forEach((v,i)=> ctx.lineTo(xAt(i), yAt(v)));
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2.25;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // last point dot
  const lastX = xAt(series.length-1), lastY = yAt(series[series.length-1]);
  ctx.beginPath();
  ctx.arc(lastX, lastY, 3.5, 0, Math.PI*2);
  ctx.fillStyle = lineColor;
  ctx.fill();

  bindEquityHover(canvas, series, pad, stepX, w, h, xAt, yAt);
}

function bindEquityHover(canvas, series, pad, stepX, w, h, xAt, yAt){
  const host = canvas.parentElement;
  if(!host) return;
  let tip = host.querySelector('.chart-tooltip');
  if(!tip){
    tip = document.createElement('div');
    tip.className = 'chart-tooltip';
    host.appendChild(tip);
  }
  let guide = host.querySelector('.chart-guide');
  if(!guide){
    guide = document.createElement('div');
    guide.className = 'chart-guide';
    host.appendChild(guide);
  }

  let rafPending = false;
  let lastEvent = null;

  function update(){
    rafPending = false;
    if(!lastEvent) return;
    const rect = canvas.getBoundingClientRect();
    const x = lastEvent.clientX - rect.left;
    // guard against stale hover after the canvas has been removed/resized
    if(x < -20 || x > rect.width + 20) return;
    let idx = Math.round((x - pad.l) / stepX);
    idx = Math.max(0, Math.min(series.length - 1, idx));
    const val = series[idx];
    const px = canvas.offsetLeft + xAt(idx);
    const py = canvas.offsetTop + yAt(val);
    tip.textContent = (val >= 0 ? '+' : '-') + '$' + Math.abs(Math.round(val)).toLocaleString();
    tip.style.display = 'block';
    tip.style.left = px + 'px';
    let top = py - 34;
    if(top < 0) top = py + 12;
    tip.style.top = top + 'px';
    guide.style.display = 'block';
    guide.style.left = px + 'px';
    guide.style.top = (canvas.offsetTop + pad.t) + 'px';
    guide.style.height = (h - pad.t - pad.b) + 'px';
  }

  canvas.onmousemove = (e)=>{
    lastEvent = e;
    if(!rafPending){ rafPending = true; requestAnimationFrame(update); }
  };
  canvas.onmouseleave = ()=>{
    lastEvent = null;
    tip.style.display = 'none';
    guide.style.display = 'none';
  };
}

function drawDayOfWeekBars(canvas, values /* [{label, value}] */){
  const { ctx, w, h } = fitCanvas(canvas);
  ctx.clearRect(0,0,w,h);
  const pad = { l:4, r:4, t:8, b:20 };
  const max = Math.max(1, ...values.map(v=>Math.abs(v.value)));
  const bw = (w - pad.l - pad.r) / values.length;
  const zeroY = h - pad.b;
  const usableH = h - pad.t - pad.b;

  values.forEach((v,i)=>{
    const bh = Math.abs(v.value) / max * usableH;
    const x = pad.l + i*bw + bw*0.18;
    const bwi = bw*0.64;
    const y = v.value >= 0 ? zeroY - bh : zeroY;
    ctx.fillStyle = v.value >= 0 ? 'rgba(52,214,122,.75)' : 'rgba(242,85,90,.75)';
    ctx.beginPath();
    const r = 4;
    const rectH = Math.max(bh, 2);
    ctx.moveTo(x, y+rectH);
    ctx.arcTo(x, y, x+r, y, r);
    ctx.arcTo(x+bwi, y, x+bwi, y+r, r);
    ctx.lineTo(x+bwi, y+rectH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#5b6472';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(v.label, x + bwi/2, h - 6);
  });
  ctx.textAlign = 'left';
}
