/* =====================================================================
   유림에퐁당 통합현황 — 데이터 모델 & 렌더링
   실 서비스로 옮길 때는 STORES / 기간기준 을 API 응답으로 교체하고,
   localStorage 저장 부분을 서버 저장(POST) 으로 바꾸면 됩니다.
===================================================================== */

const BRAND_POS = {
  '퐁당':      ['OK포스','업솔루션'],
  '유림대패':  ['유니온포스','OK포스'],
  '려원장어':  ['유플러스포스'],
  '얼얼하이':  ['업솔루션'],
};

const STORES = [
  ['퐁당','탕정점','충남'], ['퐁당','전주혁신점','전북'], ['퐁당','공주점','충남'],
  ['퐁당','대구만촌','대구'], ['퐁당','세종시청','세종'], ['퐁당','영등점','서울'],
  ['퐁당','내포신도시점','충남'], ['퐁당','전주도청점','전북'], ['퐁당','관저점','대전'],
  ['퐁당','조치원점','세종'], ['퐁당','정읍점','전북'], ['퐁당','둔산점','대전'],
  ['퐁당','오송점','충북'], ['퐁당','모현점','경기'], ['퐁당','청수법원점','대전'],
  ['퐁당','보령점','충남'], ['퐁당','군산점','전북'], ['퐁당','오창점','충북'],
  ['퐁당','율량점','충북'], ['퐁당','광주첨단점','광주'], ['퐁당','유성점','대전'],
  ['퐁당','동남지구점','세종'], ['퐁당','김포구래점','경기'], ['퐁당','논산점','충남'],
  ['퐁당','세종점','세종'], ['퐁당','청주봉명점','충북'], ['퐁당','전주송천점','전북'],
  ['유림대패','오창점','충북'], ['유림대패','비하점','충북'],
  ['려원장어','세종점','세종'],
  ['얼얼하이','성안점','충북'], ['얼얼하이','아산용화점','충남'],
].map(([brand,name,region],i)=>({
  id:i, brand, name:`${brand}(${name})`, short:name, region,
  pos: BRAND_POS[brand][i % BRAND_POS[brand].length],
  area: 20 + Math.round(Math.random()*70),
  rent: 150 + Math.round(Math.random()*350),
  royalty: [0.022,0.025,0.028,0.033][i%4],
  opened: `20${20+ (i%6)}-0${1+(i%9)%9}-1${i%9}`,
}));

const PERIOD_DAYS = { '당월누적':26, '전일':1, '토요일':1 };
const MONTH_TOTAL_DAYS = 31;

/* ---------- 예시 매출 데이터 생성 (최초 1회) ---------- */
function seedSales(){
  const base = {};
  ['당월누적','전일','토요일','전월','전년동월'].forEach(period=>{
    base[period] = {};
    STORES.forEach(s=>{
      const scale = period==='당월누적' ? 26 : period==='전월' ? 30 : period==='전년동월' ? 28 : 1;
      const dayAvg = 1_700_000 + Math.round(Math.random()*1_600_000);
      const days = period==='당월누적' ? PERIOD_DAYS['당월누적'] : period==='전일'||period==='토요일' ? 1 : scale;
      const sales = Math.round(dayAvg * scale * (0.85+Math.random()*0.3));
      const receipts = Math.round(sales / (11000 + Math.random()*6000));
      base[period][s.name] = { days, receipts, sales };
    });
  });
  return base;
}

function loadSales(){
  const raw = localStorage.getItem('yfp_sales_v1');
  if(raw){ try{ return JSON.parse(raw); }catch(e){} }
  const seeded = seedSales();
  localStorage.setItem('yfp_sales_v1', JSON.stringify(seeded));
  return seeded;
}
function saveSales(data){ localStorage.setItem('yfp_sales_v1', JSON.stringify(data)); }

let SALES = loadSales();

/* ---------- 계산 헬퍼 ---------- */
const won = n => n==null || isNaN(n) ? '-' : Math.round(n).toLocaleString('ko-KR');
const pct = n => n==null || isNaN(n) ? '-' : (n>=0?'+':'') + (n*100).toFixed(1) + '%';

function metricsFor(storeName, period){
  const rec = SALES[period]?.[storeName];
  if(!rec) return null;
  const dayAvg = rec.sales / (rec.days||1);
  const unit = rec.receipts ? rec.sales / rec.receipts : 0;
  return { ...rec, dayAvg, unit };
}
function projectedClose(storeName){
  const cur = metricsFor(storeName,'당월누적');
  if(!cur) return 0;
  const baseDays = PERIOD_DAYS['당월누적'] || 26;
  return cur.sales / baseDays * MONTH_TOTAL_DAYS;
}
function momChange(storeName){
  const proj = projectedClose(storeName);
  const prev = SALES['전월']?.[storeName]?.sales;
  if(!prev) return null;
  return (proj-prev)/prev;
}
function yoyChange(storeName){
  const proj = projectedClose(storeName);
  const prev = SALES['전년동월']?.[storeName]?.sales;
  if(!prev) return null;
  return (proj-prev)/prev;
}

/* ---------- 상태 ---------- */
let state = { view:'report', reportBrand:'전체', reportPeriod:'당월누적', storeBrand:'전체', storeQuery:'', entryPeriod:'당월누적' };
let charts = {};

/* ---------- 네비게이션 ---------- */
const TITLES = {
  report:['매출장표','전 지점 매출 순위와 예상마감'],
  analysis:['매출성과분석표','브랜드별 · 기간별 비교 분석'],
  stores:['매장별현황','지점 기본정보 및 최근 실적'],
  entry:['매출 데이터 입력','포스 데이터를 붙여넣듯 입력하고 저장하세요'],
};
document.querySelectorAll('#nav button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const v = btn.dataset.view;
    state.view = v;
    document.querySelectorAll('.view').forEach(s=>s.classList.remove('active'));
    document.getElementById('view-'+v).classList.add('active');
    document.getElementById('pageTitle').textContent = TITLES[v][0];
    document.getElementById('pageSub').textContent = TITLES[v][1];
    document.getElementById('side').classList.remove('open');
    renderAll();
  });
});
document.getElementById('mobileToggle').addEventListener('click', ()=>{
  document.getElementById('side').classList.toggle('open');
});

/* ---------- 매출장표 ---------- */
function filteredStores(brand){
  return brand==='전체' ? STORES : STORES.filter(s=>s.brand===brand);
}

function renderReportKpis(list, period){
  const totalSales = list.reduce((a,s)=>a+(metricsFor(s.name,period)?.sales||0),0);
  const totalProj = list.reduce((a,s)=>a+projectedClose(s.name),0);
  const avgMom = list.map(s=>momChange(s.name)).filter(v=>v!=null);
  const mom = avgMom.length ? avgMom.reduce((a,b)=>a+b,0)/avgMom.length : null;
  const kpis = [
    ['지점 수', list.length + ' 개', null],
    [`${period} 합계매출`, won(totalSales)+' 원', null],
    ['당월 예상마감 합계', won(totalProj)+' 원', null],
    ['평균 전월대비', pct(mom), mom],
  ];
  document.getElementById('reportKpis').innerHTML = kpis.map(([label,value,delta])=>`
    <div class="card kpi">
      <div class="label">${label}</div>
      <div class="value num">${value}</div>
      ${delta!=null ? `<div class="delta ${delta>=0?'up':'down'}">${delta>=0?'▲':'▼'} 전월 대비</div>` : ''}
    </div>`).join('');
}

function renderReportTable(){
  const list = filteredStores(state.reportBrand);
  const period = state.reportPeriod;
  renderReportKpis(list, period);
  const rows = list.map(s=>{
    const m = metricsFor(s.name, period) || {days:0,receipts:0,sales:0,dayAvg:0,unit:0};
    const proj = projectedClose(s.name);
    const mom = momChange(s.name);
    return { s, m, proj, mom };
  }).sort((a,b)=>b.m.sales-a.m.sales);

  document.getElementById('reportBody').innerHTML = rows.map((r,i)=>`
    <tr>
      <td>${i+1}</td>
      <td>${r.s.short}<span class="brand-tag tag-${r.s.brand}">${r.s.brand}</span></td>
      <td class="num">${r.m.days||'-'}</td>
      <td class="num">${won(r.m.receipts)}</td>
      <td class="num">${won(r.m.unit)}</td>
      <td class="num" style="font-weight:700">${won(r.m.sales)}</td>
      <td class="num">${won(r.m.dayAvg)}</td>
      <td class="num">${won(r.proj)}</td>
      <td>${r.mom==null?'<span class="pill flat">-</span>':`<span class="pill ${r.mom>=0?'up':'down'}">${r.mom>=0?'▲':'▼'} ${pct(r.mom)}</span>`}</td>
    </tr>`).join('');
}

document.querySelectorAll('#brandFilter button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('#brandFilter button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); state.reportBrand=b.dataset.brand; renderReportTable();
}));
document.querySelectorAll('#periodFilter button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('#periodFilter button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); state.reportPeriod=b.dataset.period; renderReportTable();
}));

/* ---------- 매출성과분석표 ---------- */
function renderAnalysis(){
  const brandTotals = {};
  Object.keys(BRAND_POS).forEach(b=>brandTotals[b]=0);
  STORES.forEach(s=>{ brandTotals[s.brand] += metricsFor(s.name,'당월누적')?.sales||0; });

  if(typeof Chart === 'undefined'){
    document.getElementById('brandPie').replaceWith(Object.assign(document.createElement('div'),{style:'padding:30px;text-align:center;color:var(--muted);font-size:12.5px',textContent:'차트 라이브러리(Chart.js)를 불러오지 못했어요. 인터넷 연결을 확인해주세요.'}));
    document.getElementById('compareBar').replaceWith(Object.assign(document.createElement('div'),{style:'padding:30px;text-align:center;color:var(--muted);font-size:12.5px',textContent:'차트 라이브러리(Chart.js)를 불러오지 못했어요.'}));
    return renderRankTables();
  }
  const ctx1 = document.getElementById('brandPie');
  if(charts.pie) charts.pie.destroy();
  charts.pie = new Chart(ctx1, {
    type:'doughnut',
    data:{ labels:Object.keys(brandTotals),
      datasets:[{ data:Object.values(brandTotals),
        backgroundColor:['#B4892E','#3A6B4C','#2E4E7C','#B23A2E'], borderWidth:2, borderColor:'#fff' }]},
    options:{ plugins:{legend:{position:'bottom', labels:{font:{family:'Pretendard'}, boxWidth:10}}} }
  });

  const withCompare = STORES.map(s=>({
    name:s.short, brand:s.brand, mom:momChange(s.name), yoy:yoyChange(s.name)
  })).filter(x=>x.mom!=null || x.yoy!=null);
  const brandAvg = {};
  Object.keys(BRAND_POS).forEach(b=>{
    const items = withCompare.filter(x=>x.brand===b);
    brandAvg[b] = {
      mom: items.length ? items.reduce((a,c)=>a+(c.mom||0),0)/items.length : 0,
      yoy: items.length ? items.reduce((a,c)=>a+(c.yoy||0),0)/items.length : 0,
    };
  });
  const ctx2 = document.getElementById('compareBar');
  if(charts.bar) charts.bar.destroy();
  charts.bar = new Chart(ctx2, {
    type:'bar',
    data:{ labels:Object.keys(brandAvg),
      datasets:[
        {label:'전월대비', data:Object.values(brandAvg).map(v=>+(v.mom*100).toFixed(1)), backgroundColor:'#B23A2E', borderRadius:4},
        {label:'전년동월대비', data:Object.values(brandAvg).map(v=>+(v.yoy*100).toFixed(1)), backgroundColor:'#B4892E', borderRadius:4},
      ]},
    options:{ scales:{ y:{ ticks:{ callback:v=>v+'%' } } }, plugins:{legend:{position:'bottom'}} }
  });

  renderRankTables();
}

function renderRankTables(){
  const ranked = STORES.map(s=>({s, sales:metricsFor(s.name,'당월누적')?.sales||0, mom:momChange(s.name)}))
                        .sort((a,b)=>b.sales-a.sales);
  const top = ranked.slice(0,5);
  const bottom = [...ranked].sort((a,b)=> (a.mom??0) - (b.mom??0)).slice(0,5);

  document.getElementById('topBody').innerHTML = top.map(r=>`
    <tr><td style="text-align:left;font-weight:600">${r.s.short}<span class="brand-tag tag-${r.s.brand}">${r.s.brand}</span></td>
    <td class="num">${won(r.sales)}</td>
    <td>${r.mom==null?'-':`<span class="pill ${r.mom>=0?'up':'down'}">${pct(r.mom)}</span>`}</td></tr>`).join('');
  document.getElementById('bottomBody').innerHTML = bottom.map(r=>`
    <tr><td style="text-align:left;font-weight:600">${r.s.short}<span class="brand-tag tag-${r.s.brand}">${r.s.brand}</span></td>
    <td class="num">${won(r.sales)}</td>
    <td>${r.mom==null?'-':`<span class="pill ${r.mom>=0?'up':'down'}">${pct(r.mom)}</span>`}</td></tr>`).join('');
}


/* ---------- 매장별현황 ---------- */
function renderStores(){
  const q = state.storeQuery.trim();
  const list = filteredStores(state.storeBrand).filter(s=>!q || s.name.includes(q));
  const maxSales = Math.max(...STORES.map(s=>metricsFor(s.name,'당월누적')?.sales||0));
  document.getElementById('storeGrid').innerHTML = list.map(s=>{
    const m = metricsFor(s.name,'당월누적');
    const pctGauge = m ? Math.round((m.sales/maxSales)*100) : 0;
    return `
    <div class="card store-card" data-id="${s.id}">
      <div class="head">
        <div><h3>${s.short}</h3><div class="region">${s.region} · ${s.pos}</div></div>
        <span class="brand-tag tag-${s.brand}">${s.brand}</span>
      </div>
      <div class="figures">
        <div><div class="num">${won(m?.sales)}</div><div class="lbl">당월누적 실매출액</div></div>
        <div style="text-align:right"><div class="num">${won(projectedClose(s.name))}</div><div class="lbl">예상마감</div></div>
      </div>
      <div class="gauge-wrap"><div class="gauge-fill" style="width:${pctGauge}%"></div></div>
    </div>`;
  }).join('');
  document.querySelectorAll('.store-card').forEach(el=>{
    el.addEventListener('click', ()=>openStoreModal(+el.dataset.id));
  });
}
document.querySelectorAll('#brandFilter2 button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('#brandFilter2 button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); state.storeBrand=b.dataset.brand; renderStores();
}));
document.getElementById('storeSearch').addEventListener('input', e=>{ state.storeQuery=e.target.value; renderStores(); });

function openStoreModal(id){
  const s = STORES.find(x=>x.id===id);
  const cur = metricsFor(s.name,'당월누적');
  const mom = momChange(s.name), yoy = yoyChange(s.name);
  const proj = projectedClose(s.name);
  document.getElementById('modalBody').innerHTML = `
    <span class="close" id="modalClose">✕</span>
    <h2>${s.short} <span class="brand-tag tag-${s.brand}">${s.brand}</span></h2>
    <div style="font-size:12.5px;color:var(--muted)">${s.region} · ${s.pos} 연동</div>
    <div class="kv">
      <div class="k">개점일</div><div class="v">${s.opened}</div>
      <div class="k">전용면적</div><div class="v">${s.area}평</div>
      <div class="k">월 임대료</div><div class="v">${s.rent}만원</div>
      <div class="k">로열티율</div><div class="v">${(s.royalty*100).toFixed(1)}%</div>
      <div class="k">당월누적 실매출액</div><div class="v num">${won(cur?.sales)}원</div>
      <div class="k">당월 예상마감</div><div class="v num">${won(proj)}원</div>
      <div class="k">예상 로열티(마감기준)</div><div class="v num">${won(proj*s.royalty)}원</div>
      <div class="k">전월대비</div><div class="v">${mom==null?'-':pct(mom)}</div>
      <div class="k">전년동월대비</div><div class="v">${yoy==null?'-':pct(yoy)}</div>
      <div class="k">평당 매출(예상마감 기준)</div><div class="v num">${won(proj/s.area)}원</div>
    </div>`;
  document.getElementById('overlay').classList.add('open');
  document.getElementById('modalClose').addEventListener('click', closeModal);
}
function closeModal(){ document.getElementById('overlay').classList.remove('open'); }
document.getElementById('overlay').addEventListener('click', e=>{ if(e.target.id==='overlay') closeModal(); });

/* ---------- 데이터 입력 ---------- */
function renderEntry(){
  const period = state.entryPeriod;
  document.getElementById('entryRows').innerHTML = STORES.map(s=>{
    const rec = SALES[period]?.[s.name] || {days:'',receipts:'',sales:''};
    return `
    <div class="entry-row" data-store="${s.name}">
      <div class="store-name">${s.short}<span class="brand-tag tag-${s.brand}" style="margin-left:6px">${s.brand}</span></div>
      <input type="number" class="f-days" value="${rec.days ?? ''}">
      <input type="number" class="f-receipts" value="${rec.receipts ?? ''}">
      <input type="number" class="f-sales" value="${rec.sales ?? ''}">
      <div style="font-size:11px;color:var(--muted)">${s.pos}</div>
      <div></div>
    </div>`;
  }).join('');
}
document.querySelectorAll('#entryPeriod button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('#entryPeriod button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); state.entryPeriod=b.dataset.period; renderEntry();
}));
document.getElementById('saveBtn').addEventListener('click', ()=>{
  const period = state.entryPeriod;
  document.querySelectorAll('.entry-row[data-store]').forEach(row=>{
    const store = row.dataset.store;
    const days = +row.querySelector('.f-days').value || 0;
    const receipts = +row.querySelector('.f-receipts').value || 0;
    const sales = +row.querySelector('.f-sales').value || 0;
    SALES[period][store] = { days, receipts, sales };
  });
  saveSales(SALES);
  showToast('저장했어요 — 매출장표 · 분석표에 반영됐어요.');
  renderAll();
});
document.getElementById('resetBtn').addEventListener('click', ()=>{
  if(!confirm('입력한 데이터를 예시 데이터로 되돌릴까요?')) return;
  SALES = seedSales(); saveSales(SALES); renderAll();
});

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2400);
}

/* ---------- 시계 ---------- */
function tickClock(){
  const d = new Date();
  const days=['일','월','화','수','목','금','토'];
  document.getElementById('clock').textContent =
    `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} · ${days[d.getDay()]}요일 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
tickClock(); setInterval(tickClock, 1000*30);

/* ---------- 전체 렌더 ---------- */
function renderAll(){
  if(state.view==='report') renderReportTable();
  if(state.view==='analysis') renderAnalysis();
  if(state.view==='stores') renderStores();
  if(state.view==='entry') renderEntry();
}
renderAll();
