/* =====================================================================
   유림에퐁당 통합현황 — 데이터 모델 & 렌더링
   실 서비스로 옮길 때는 STORES / SALES 을 API 응답으로 교체하고,
   localStorage 저장 부분을 서버 저장(POST) 으로 바꾸면 됩니다.
===================================================================== */

/* ---------- 지점 정의 (지점명 → 실제 사용 포스) ---------- */
const RAW_STORES = [
  // brand, name, region, pos, 로열티율(실제 파일 기준, 미확정 0)
  ['퐁당','탕정점','충남','OK포스',0.022], ['퐁당','전주혁신점','전북','OK포스',0.033],
  ['유림대패','오창점','충북','OK포스',0],
  ['퐁당','공주점','충남','OK포스',0.033], ['퐁당','대구만촌','대구','OK포스',0.022], ['퐁당','세종시청','세종','OK포스',0.033],
  ['퐁당','영등점','전북','OK포스',0.033], ['퐁당','내포신도시점','충남','OK포스',0.033], ['퐁당','전주도청점','전북','OK포스',0.033],
  ['퐁당','관저점','대전','OK포스',0], ['퐁당','조치원점','세종','OK포스',0], ['퐁당','둔산점','대전','OK포스',0.033],
  ['퐁당','정읍점','전북','OK포스',0.033], ['퐁당','오송점','충북','OK포스',0], ['퐁당','모현점','전북','OK포스',0],
  ['퐁당','율량점','충북','업솔루션',0.022], ['퐁당','광주첨단점','전북','업솔루션',0.033], ['퐁당','유성점','대전','업솔루션',0],
  ['퐁당','동남지구점','충북','업솔루션',0.033], ['퐁당','김포구래점','경기','업솔루션',0.033], ['퐁당','논산점','충남','업솔루션',0.022],
  ['퐁당','세종점','세종','업솔루션',0], ['퐁당','청주봉명점','충북','업솔루션',0.033], ['퐁당','전주송천점','전북','업솔루션',0.022],
  ['유림대패','비하점','충북','유니온포스',0],
  ['려원장어','세종점','세종','유플러스포스',0],
  ['얼얼하이','성안점','충북','업솔루션',0], ['얼얼하이','아산용화점','충남','업솔루션',0,300000],
];

const OPENED_DATES = {
  '퐁당(모현점)':'2020-05-12', '퐁당(세종점)':'2020-05-28', '퐁당(관저점)':'2020-11-06',
  '퐁당(오송점)':'2021-05-10', '퐁당(조치원점)':'2022-02-26', '퐁당(유성점)':'2022-10-24',
  '퐁당(둔산점)':'2023-03-14', '퐁당(공주점)':'2023-06-16', '퐁당(탕정점)':'2023-07-20',
  '퐁당(논산점)':'2023-08-10', '퐁당(전주도청점)':'2023-09-01', '퐁당(광주첨단점)':'2023-09-25',
  '퐁당(전주혁신점)':'2023-10-16', '퐁당(정읍점)':'2023-11-10', '퐁당(영등점)':'2024-03-05',
  '퐁당(대구만촌)':'2024-04-26', '퐁당(세종시청)':'2024-05-14', '퐁당(내포신도시점)':'2024-07-15',
  '퐁당(율량점)':'2024-08-08', '퐁당(김포구래점)':'2025-05-24', '퐁당(동남지구점)':'2025-12-01',
  '퐁당(청주봉명점)':'2026-03-05', '퐁당(전주송천점)':'2026-03-13',
  '유림대패(오창점)':'2024-08-15', '유림대패(비하점)':'2024-01-09',
  '려원장어(세종점)':'2024-12-01',
  '얼얼하이(성안점)':'2025-12-08', '얼얼하이(아산용화점)':'2026-05-01',
};

function loadStoreOverrides(){
  const raw = localStorage.getItem('yfp_store_overrides');
  if(raw){ try{ return JSON.parse(raw); }catch(e){} }
  return {};
}
function saveStoreOverrides(o){ localStorage.setItem('yfp_store_overrides', JSON.stringify(o)); }
let STORE_OVERRIDES = loadStoreOverrides();

const STORES = RAW_STORES.map(([brand,name,region,pos,royalty,royaltyFixed],i)=>{
  const fullName = `${brand}(${name})`;
  const base = {
    id:i, brand, name:fullName, short:name, region, pos,
    type:'가맹점', owner:'', bizNo:'', address:'',
    area: 20 + Math.round(Math.random()*70),
    rent: 150 + Math.round(Math.random()*350),
    royalty, royaltyFixed: royaltyFixed || null,
    opened: OPENED_DATES[fullName] || `20${20+(i%6)}-0${1+(i%9)%9}-1${(i%9)+1}`,
  };
  return STORE_OVERRIDES[fullName] ? {...base, ...STORE_OVERRIDES[fullName]} : base;
});

const BRANDS = ['퐁당','유림대패','려원장어','얼얼하이'];
const BRAND_COLORS = { '퐁당':'#2B6CB0', '유림대패':'#2F9E5C', '려원장어':'#D98B2B', '얼얼하이':'#B0323F' };
const BRAND_COLOR_LIST = BRANDS.map(b=>BRAND_COLORS[b]);
const PERIODS = ['당월누적','전일','토요일','전월','전년동월'];
const PERIOD_DAYS_DEFAULT = { '당월누적':26, '전일':1, '토요일':1, '전월':30, '전년동월':28 };
const MONTH_TOTAL_DAYS = 31;

/* ---------- 기준일(마감 기준일) 자동 계산 — 기본값: 어제 ---------- */
function defaultRefDate(){
  const d = new Date(); d.setDate(d.getDate()-1);
  return d.toISOString().slice(0,10);
}
function getRefDate(){ return state.refDate || defaultRefDate(); }
function daysInMonthOffset(dateStr, monthOffset){
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth()+1+monthOffset, 0).getDate();
}
function bizDaysElapsed(dateStr){ return new Date(dateStr).getDate(); }
function autoDaysFor(period){
  const ref = getRefDate();
  if(period==='당월누적') return bizDaysElapsed(ref);
  if(period==='전일' || period==='토요일') return 1;
  if(period==='전월') return daysInMonthOffset(ref, -1);
  if(period==='전년동월') return daysInMonthOffset(ref, -12);
  return PERIOD_DAYS_DEFAULT[period] || 30;
}

/* ---------- 포스별 원본 컬럼 스키마 (그대로 붙여넣기용) ---------- */
const TEXT_FIELDS = new Set(['매장명','매장코드','매출일자']);
const POS_SCHEMA = {
  'OK포스':      { fields:['매장명','총매출액','총할인액','실매출액','가액','부가세','영업일수','일평균 실매출액','영수건수','영수단가','객수','객단가','점유율(%)','결제합계','단순현금','현금영수','신용카드'],
                    storeField:'매장명', sales:'실매출액', receipts:'영수건수', days:'영업일수' },
  '업솔루션':    { fields:['매장명','전표수','공급가액','세금','매출액'],
                    storeField:'매장명', sales:'매출액', receipts:'전표수', days:null },
  '유니온포스':  { fields:['매장명','건수','결제합계','객단가','현금','카드','포인트','외상','기타','할인합계'],
                    storeField:'매장명', sales:'결제합계', receipts:'건수', days:null },
  '유플러스포스':{ fields:['매장코드','매장명','매출일자','수량','객수','객단가','영수건수','영수단가','총판매금액','총반품금액','총 매출 금액','할인 금액','순매출','매출 금액','현금매출','카드매출','간편결제매출','상품권매출','포인트매출','오더주문매출','즉시환급매출','기타매출'],
                    storeField:'매장명', sales:'매출 금액', receipts:'영수건수', days:null },
};
const POS_LIST = Object.keys(POS_SCHEMA);

// 같은 포스(시스템)라도 브랜드별로 계정이 분리되어 있으면 여기서 나눠주세요.
// key = 화면에 보일 탭 이름, schema = 어떤 POS_SCHEMA(컬럼 구성)를 쓸지, brands = 해당 계정에 속한 브랜드(null이면 그 포스 전체)
const ACCOUNTS = {
  'OK포스':          { schema:'OK포스',    brands:null },
  '업솔루션(퐁당)':   { schema:'업솔루션',  brands:['퐁당'] },
  '업솔루션(얼얼하이)':{ schema:'업솔루션',  brands:['얼얼하이'] },
  '유니온포스':      { schema:'유니온포스', brands:null },
  '유플러스포스':    { schema:'유플러스포스', brands:null },
};
const ACCOUNT_LIST = Object.keys(ACCOUNTS);
function accountOf(store){
  if(store.pos !== '업솔루션') return store.pos;
  return `업솔루션(${store.brand})`;
}
function storesForAccount(account){
  const cfg = ACCOUNTS[account];
  return STORES.filter(s=>accountOf(s)===account);
}

/* ---------- 예시 매출 데이터 생성 ---------- */
function seedSales(){
  const base = {};
  PERIODS.forEach(period=>{
    base[period] = {};
    STORES.forEach(s=>{
      const scale = PERIOD_DAYS_DEFAULT[period];
      const dayAvg = 1_700_000 + Math.round(Math.random()*1_600_000);
      const sales = Math.round(dayAvg * scale * (0.85+Math.random()*0.3));
      const receipts = Math.round(sales / (11000 + Math.random()*6000));
      const rec = {
        총매출액:sales, 실매출액:sales, 매출액:sales, 결제합계:sales, '매출 금액':sales, 순매출:sales,
        영업일수:scale, '일평균 실매출액': Math.round(sales/(scale||1)),
        영수건수:receipts, 전표수:receipts, 건수:receipts,
        영수단가: Math.round(sales/(receipts||1)), 객단가: Math.round(sales/(receipts||1)),
        객수: Math.round(receipts*1.05),
        가액: Math.round(sales/1.1), 부가세: Math.round(sales-sales/1.1), 총할인액: Math.round(sales*0.02),
        '점유율(%)': +(3+Math.random()*10).toFixed(2), 현금영수: 0,
        단순현금: Math.round(sales*0.25), 신용카드: Math.round(sales*0.7), 할인합계: Math.round(sales*0.02),
        현금: Math.round(sales*0.25), 카드: Math.round(sales*0.7), 포인트: Math.round(sales*0.02), 외상:0, 기타:0,
        공급가액: Math.round(sales/1.1), 세금: Math.round(sales-sales/1.1),
        수량: Math.round(receipts*1.3), 총판매금액: sales, 총반품금액: 0, '총 매출 금액': sales, '할인 금액': Math.round(sales*0.02),
        현금매출: Math.round(sales*0.25), 카드매출: Math.round(sales*0.6), 간편결제매출: Math.round(sales*0.1),
        상품권매출:0, 포인트매출: Math.round(sales*0.03), 오더주문매출: Math.round(sales*0.02), 즉시환급매출:0, 기타매출:0,
        매장코드: `ST${String(s.id+1).padStart(3,'0')}`, 매출일자: '',
      };
      base[period][s.name] = rec;
    });
  });
  return base;
}

function loadSales(){
  const raw = localStorage.getItem('yfp_sales_v2');
  if(raw){ try{ return JSON.parse(raw); }catch(e){} }
  const seeded = seedSales();
  localStorage.setItem('yfp_sales_v2', JSON.stringify(seeded));
  return seeded;
}
function saveSales(data){ localStorage.setItem('yfp_sales_v2', JSON.stringify(data)); }
let SALES = loadSales();

/* ---------- 계산 헬퍼 ---------- */
const won = n => n==null || isNaN(n) ? '-' : Math.round(n).toLocaleString('ko-KR');
const pct = n => n==null || isNaN(n) ? '-' : (n>=0?'+':'') + (n*100).toFixed(1) + '%';
const royPct = r => !r ? '-' : (r*100).toFixed(1) + '%';

function metricsFor(storeName, period){
  const store = STORES.find(s=>s.name===storeName);
  const rec = SALES[period]?.[storeName];
  if(!rec || !store) return null;
  const schema = POS_SCHEMA[store.pos];
  const sales = +rec[schema.sales] || 0;
  const receipts = +rec[schema.receipts] || 0;
  const days = schema.days ? (+rec[schema.days] || 0) : autoDaysFor(period);
  return { days, receipts, sales, dayAvg: sales/(days||1), unit: receipts ? sales/receipts : 0 };
}
function projectedClose(storeName){
  const cur = metricsFor(storeName,'당월누적');
  if(!cur) return 0;
  const baseDays = cur.days || bizDaysElapsed(getRefDate());
  const totalDays = daysInMonthOffset(getRefDate(), 0);
  return cur.sales / baseDays * totalDays;
}
function momChange(storeName){
  const proj = projectedClose(storeName);
  const prev = metricsFor(storeName,'전월')?.sales;
  if(!prev) return null;
  return (proj-prev)/prev;
}
function yoyChange(storeName){
  const proj = projectedClose(storeName);
  const prev = metricsFor(storeName,'전년동월')?.sales;
  if(!prev) return null;
  return (proj-prev)/prev;
}

/* ---------- 상태 ---------- */
let state = { view:'report', reportBrand:'전체', reportPeriod:'당월누적', storeBrand:'전체', storeQuery:'', entryPeriod:'당월누적', entryPos:'OK포스', refDate: defaultRefDate() };
let charts = {};

const TITLES = {
  report:['매출장표','전 지점 매출 순위와 예상마감'],
  notice:['공지용 마감장표','가맹점 공지용 · 브랜드별 마감 현황'],
  analysis:['매출성과분석표','브랜드별 · 기간별 비교 분석'],
  stores:['매장별현황','지점 기본정보 및 최근 실적'],
  entry:['매출 데이터 입력','포스 화면 표를 그대로 붙여넣으세요'],
  admin:['가맹점 정보 관리','지점 기본정보 · 계약정보 등록 및 수정'],
  archive:['마감장표 업로드','월별 마감 완료된 엑셀 장표 보관'],
};
const NAV_ICON = { report:'▤', notice:'▥', analysis:'◈', stores:'▦', entry:'✎', admin:'⚙', archive:'⇪' };
const NAV_CATEGORIES_DEFAULT = [
  { label:'통합현황', views:['report','notice','analysis','stores'] },
  { label:'운영', views:['entry','admin','archive'] },
];
const ALL_NAV_VIEWS = NAV_CATEGORIES_DEFAULT.flatMap(c=>c.views);

function loadNavCategories(){
  const raw = localStorage.getItem('yfp_nav_categories');
  if(raw){
    try{
      const cats = JSON.parse(raw);
      const flat = cats.flatMap(c=>c.views);
      if(Array.isArray(cats) && ALL_NAV_VIEWS.every(v=>flat.includes(v)) && flat.length===ALL_NAV_VIEWS.length) return cats;
    }catch(e){}
  }
  return NAV_CATEGORIES_DEFAULT.map(c=>({label:c.label, views:c.views.slice()}));
}
function saveNavCategories(cats){ localStorage.setItem('yfp_nav_categories', JSON.stringify(cats)); }

function renderNav(){
  const cats = loadNavCategories();
  const nav = document.getElementById('nav');
  nav.innerHTML = cats.map(cat=>`
    <div class="nav-label" data-cat="${cat.label}">${cat.label}</div>
    ${cat.views.map(v=>`
      <button data-view="${v}" draggable="true" class="${v===state.view?'active':''}">
        <span class="handle">⠿</span><ico>${NAV_ICON[v]}</ico> ${TITLES[v][0]}
      </button>`).join('')}
  `).join('');
  bindNavClicks();
  bindNavDrag();
}

function bindNavClicks(){
  document.querySelectorAll('#nav button').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      if(btn.classList.contains('dragging')) return;
      document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const v = btn.dataset.view; state.view = v;
      document.querySelectorAll('.view').forEach(s=>s.classList.remove('active'));
      document.getElementById('view-'+v).classList.add('active');
      document.getElementById('pageTitle').textContent = TITLES[v][0];
      document.getElementById('pageSub').textContent = TITLES[v][1];
      document.getElementById('side').classList.remove('open');
      renderAll();
    });
  });
}

function persistNavFromDom(){
  const nav = document.getElementById('nav');
  const cats = [];
  let cur = null;
  Array.from(nav.children).forEach(el=>{
    if(el.classList.contains('nav-label')){
      cur = { label: el.dataset.cat, views: [] };
      cats.push(cur);
    }else if(el.tagName==='BUTTON' && cur){
      cur.views.push(el.dataset.view);
    }
  });
  saveNavCategories(cats);
}

function bindNavDrag(){
  const nav = document.getElementById('nav');
  let dragEl = null;
  nav.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('dragstart', (e)=>{
      dragEl = btn; btn.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    btn.addEventListener('dragend', ()=>{
      btn.classList.remove('dragging');
      nav.querySelectorAll('button, .nav-label').forEach(b=>b.classList.remove('drag-over'));
      persistNavFromDom();
    });
    btn.addEventListener('dragover', (e)=>{
      e.preventDefault();
      if(btn===dragEl) return;
      const rect = btn.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height/2;
      nav.querySelectorAll('button, .nav-label').forEach(b=>b.classList.remove('drag-over'));
      btn.classList.add('drag-over');
      btn.parentNode.insertBefore(dragEl, before ? btn : btn.nextSibling);
    });
  });
  // 카테고리 라벨 위로 드롭하면 그 카테고리 맨 앞으로 이동
  nav.querySelectorAll('.nav-label').forEach(label=>{
    label.addEventListener('dragover', (e)=>{
      e.preventDefault();
      if(!dragEl) return;
      nav.querySelectorAll('button, .nav-label').forEach(b=>b.classList.remove('drag-over'));
      label.classList.add('drag-over');
      label.parentNode.insertBefore(dragEl, label.nextSibling);
    });
  });
}
document.getElementById('mobileToggle').addEventListener('click', ()=>document.getElementById('side').classList.toggle('open'));

/* ---------- 매출장표 ---------- */
function filteredStores(brand){ return brand==='전체' ? STORES : STORES.filter(s=>s.brand===brand); }

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
    <div class="card kpi"><div class="label">${label}</div><div class="value num">${value}</div>
    ${delta!=null ? `<div class="delta ${delta>=0?'up':'down'}">${delta>=0?'▲':'▼'} 전월 대비</div>` : ''}</div>`).join('');
}

function renderReportTable(){
  const list = filteredStores(state.reportBrand);
  const period = state.reportPeriod;
  renderReportKpis(list, period);
  renderMiniDashboard(list, period);
  const rows = list.map(s=>{
    const m = metricsFor(s.name, period) || {days:0,receipts:0,sales:0,dayAvg:0,unit:0};
    return { s, m, proj: projectedClose(s.name), mom: momChange(s.name) };
  }).sort((a,b)=>b.m.sales-a.m.sales);

  document.getElementById('reportBody').innerHTML = rows.map((r,i)=>`
    <tr><td>${i+1}</td><td>${r.s.short}<span class="brand-tag tag-${r.s.brand}">${r.s.brand}</span></td>
      <td class="num">${r.m.days||'-'}</td><td class="num">${won(r.m.receipts)}</td><td class="num">${won(r.m.unit)}</td>
      <td class="num" style="font-weight:700">${won(r.m.sales)}</td><td class="num">${won(r.m.dayAvg)}</td>
      <td class="num">${won(r.proj)}</td>
      <td>${r.mom==null?'<span class="pill flat">-</span>':`<span class="pill ${r.mom>=0?'up':'down'}">${r.mom>=0?'▲':'▼'} ${pct(r.mom)}</span>`}</td></tr>`).join('');
}

let miniCharts = {};
function renderMiniDashboard(list, period){
  if(typeof Chart === 'undefined') return;
  const miniOpts = { plugins:{legend:{display:false}}, responsive:true, maintainAspectRatio:false };

  // ① 브랜드 비중 (필터 무관하게 전체 기준)
  const brandTotals = {}; BRANDS.forEach(b=>brandTotals[b]=0);
  STORES.forEach(s=>{ brandTotals[s.brand] += metricsFor(s.name,period)?.sales||0; });
  if(miniCharts.brand) miniCharts.brand.destroy();
  miniCharts.brand = new Chart(document.getElementById('miniBrandChart'), {
    type:'doughnut',
    data:{ labels:BRANDS, datasets:[{ data:BRANDS.map(b=>brandTotals[b]), backgroundColor:BRAND_COLOR_LIST, borderWidth:2, borderColor:'#fff' }] },
    options:{ ...miniOpts, plugins:{legend:{position:'bottom', labels:{boxWidth:8, font:{size:9}}}} }
  });

  // ② TOP5 매장 (현재 필터 기준)
  const ranked = list.map(s=>({name:s.short, sales:metricsFor(s.name,period)?.sales||0})).sort((a,b)=>b.sales-a.sales).slice(0,5);
  if(miniCharts.top) miniCharts.top.destroy();
  miniCharts.top = new Chart(document.getElementById('miniTopChart'), {
    type:'bar',
    data:{ labels:ranked.map(r=>r.name), datasets:[{ data:ranked.map(r=>r.sales), backgroundColor:'#2B4C8C', borderRadius:4 }] },
    options:{ ...miniOpts, indexAxis:'y', scales:{ x:{ ticks:{ display:false }, grid:{display:false} }, y:{ ticks:{font:{size:9}}, grid:{display:false} } } }
  });

  // ③ 기간별 합계매출 비교
  const periodTotals = PERIODS.map(p=> list.reduce((a,s)=>a+(metricsFor(s.name,p)?.sales||0),0));
  if(miniCharts.trend) miniCharts.trend.destroy();
  miniCharts.trend = new Chart(document.getElementById('miniTrendChart'), {
    type:'bar',
    data:{ labels:PERIODS, datasets:[{ data:periodTotals, backgroundColor:'#1B2C50', borderRadius:4 }] },
    options:{ ...miniOpts, scales:{ x:{ ticks:{font:{size:9}}, grid:{display:false} }, y:{ ticks:{display:false}, grid:{display:false} } } }
  });
}
document.querySelectorAll('#brandFilter button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('#brandFilter button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); state.reportBrand=b.dataset.brand; renderReportTable();
}));
document.querySelectorAll('#periodFilter button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('#periodFilter button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); state.reportPeriod=b.dataset.period; renderReportTable();
}));

/* ---------- 공지용 마감장표 ---------- */
function initNoticeDate(){
  const el = document.getElementById('noticeDate');
  el.value = state.refDate;
  el.addEventListener('change', ()=>{
    state.refDate = el.value || defaultRefDate();
    renderAll();
  });
}
function fmtDate(iso){ const d=new Date(iso); return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`; }

function noticeRowsForBrand(brand){
  return STORES.filter(s=>s.brand===brand)
    .map(s=>{
      const cur = metricsFor(s.name,'당월누적') || {days:0,receipts:0,sales:0,unit:0};
      const prevDay = metricsFor(s.name,'전일')?.sales;
      const proj = projectedClose(s.name);
      const prevMonth = metricsFor(s.name,'전월')?.sales;
      const prevYear = metricsFor(s.name,'전년동월')?.sales;
      return { s, cur, prevDay, proj, prevMonth, prevYear,
        momP: prevMonth ? (proj-prevMonth)/prevMonth : null,
        yoyP: prevYear ? (proj-prevYear)/prevYear : null };
    })
    .sort((a,b)=>b.cur.sales-a.cur.sales);
}

function deltaSpan(p){
  if(p==null) return '<span class="txt" style="text-align:right;color:var(--muted)">-</span>';
  const up = p>=0;
  return `<span class="updn ${up?'up':'down'}">${up?'▲':'▼'}${Math.abs(p*100).toFixed(2)}%</span>`;
}

function renderNoticeBrandBlock(brand, dateStr, showSortLabel){
  const rows = noticeRowsForBrand(brand);
  if(!rows.length) return '';
  const sums = rows.reduce((a,r)=>({
    prevDay:a.prevDay+(r.prevDay||0), receipts:a.receipts+r.cur.receipts, sales:a.sales+r.cur.sales,
    proj:a.proj+r.proj, prevMonth:a.prevMonth+(r.prevMonth||0), prevYear:a.prevYear+(r.prevYear||0)
  }), {prevDay:0,receipts:0,sales:0,proj:0,prevMonth:0,prevYear:0});
  const sumUnit = sums.receipts ? sums.sales/sums.receipts : 0;
  const sumMom = sums.prevMonth ? (sums.proj-sums.prevMonth)/sums.prevMonth : null;
  const sumYoy = sums.prevYear ? (sums.proj-sums.prevYear)/sums.prevYear : null;

  return `
  <div class="notice-block">
    <div class="notice-head">
      <div class="lft"><span class="date-chip">${dateStr} 마감 기준</span><span class="brand-chip">${brand}</span></div>
      ${showSortLabel ? '<div class="hint">매출 내림차순 정렬</div>' : ''}
    </div>
    <table class="notice">
      <colgroup>
        <col style="width:4%"><col style="width:6%"><col style="width:9%"><col style="width:8%">
        <col style="width:8%"><col style="width:7%"><col style="width:7%">
        <col style="width:8%"><col style="width:8%"><col style="width:7%">
        <col style="width:8%"><col style="width:6%"><col style="width:8%"><col style="width:6%">
      </colgroup>
      <thead>
        <tr>
          <th rowspan="2">순위</th><th rowspan="2">지역</th><th rowspan="2">지점명</th><th rowspan="2">사업개시일</th>
          <th colspan="6">당월 매출 현황</th>
          <th colspan="2">전월 대비</th><th colspan="2">전년동월 대비</th>
        </tr>
        <tr>
          <th>전일매출</th><th>영수건수</th><th>영수단가</th><th>당월누적매출</th><th>당월예상마감</th><th>일평균매출</th>
          <th>전월매출</th><th>증감률</th><th>전년동월매출</th><th>증감률</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r,i)=>`
        <tr>
          <td>${i+1}</td><td class="txt">${r.s.region}</td><td class="txt${r.s.type==='직영점'?' td-direct':''}">${r.s.short}</td><td class="txt${r.s.type==='직영점'?' td-direct':''}">${r.s.opened}</td>
          <td>${won(r.prevDay)}</td><td>${won(r.cur.receipts)}</td><td>${won(r.cur.unit)}</td>
          <td class="hl-cur">${won(r.cur.sales)}</td><td class="hl-proj">${won(r.proj)}</td><td>${won(r.cur.dayAvg??(r.cur.sales/(r.cur.days||1)))}</td>
          <td>${won(r.prevMonth)}</td><td>${deltaSpan(r.momP)}</td>
          <td>${won(r.prevYear)}</td><td>${deltaSpan(r.yoyP)}</td>
        </tr>`).join('')}
        <tr class="total">
          <td colspan="4" class="txt">합계</td>
          <td>${won(sums.prevDay)}</td><td>${won(sums.receipts)}</td><td>${won(sumUnit)}</td>
          <td class="hl-cur">${won(sums.sales)}</td><td class="hl-proj">${won(sums.proj)}</td><td>-</td>
          <td>${won(sums.prevMonth)}</td><td>${deltaSpan(sumMom)}</td>
          <td>${won(sums.prevYear)}</td><td>${deltaSpan(sumYoy)}</td>
        </tr>
      </tbody>
    </table>
  </div>`;
}

function renderNoticeRoyaltyBlock(brand, dateStr){
  const rows = STORES.filter(s=>s.brand===brand).slice().sort((a,b)=> new Date(a.opened)-new Date(b.opened));
  if(!rows.length) return '';
  let sumCur=0,sumProj=0,sumRoyCur=0,sumRoyProj=0;
  const body = rows.map((s,i)=>{
    const cur = metricsFor(s.name,'당월누적')?.sales||0;
    const proj = projectedClose(s.name);
    const isFixed = !!s.royaltyFixed;
    const royCur = isFixed ? s.royaltyFixed : cur*s.royalty;
    const royProj = isFixed ? s.royaltyFixed : proj*s.royalty;
    sumCur+=cur; sumProj+=proj; sumRoyCur+=royCur; sumRoyProj+=royProj;
    return `<tr>
      <td>${i+1}</td><td class="txt">${s.region}</td><td class="txt${s.type==='직영점'?' td-direct':''}">${s.short}</td><td class="txt${s.type==='직영점'?' td-direct':''}">${s.opened}</td>
      <td>${won(cur)}</td><td>${won(proj)}</td><td>${isFixed ? '정액' : royPct(s.royalty)}</td>
      <td class="hl-cur">${won(royCur)}</td><td class="hl-proj">${won(royProj)}</td>
    </tr>`;
  }).join('');
  return `
  <div class="notice-block">
    <div class="notice-head"><div class="lft"><span class="date-chip">${dateStr} 마감 기준</span><span class="brand-chip">${brand} · 로열티현황 (개설순)</span></div></div>
    <table class="notice">
      <colgroup>
        <col style="width:6%"><col style="width:8%"><col style="width:14%"><col style="width:12%">
        <col style="width:13%"><col style="width:13%"><col style="width:9%">
        <col style="width:13%"><col style="width:12%">
      </colgroup>
      <thead><tr><th>개설순</th><th>지역</th><th>지점명</th><th>사업개시일</th><th>당월누적</th><th>예상마감</th><th>로열티율</th><th>당월누적기준</th><th>예상마감기준</th></tr></thead>
      <tbody>${body}
        <tr class="total"><td colspan="4" class="txt">계</td><td>${won(sumCur)}</td><td>${won(sumProj)}</td><td>-</td><td class="hl-cur">${won(sumRoyCur)}</td><td class="hl-proj">${won(sumRoyProj)}</td></tr>
      </tbody>
    </table>
  </div>`;
}

function renderNotice(){
  const monthSel = document.getElementById('noticeMonthSelect');
  const isArchive = monthSel && monthSel.value !== 'current';

  document.getElementById('noticeDate').closest('.toolbar').querySelector('span').style.display = isArchive ? 'none' : '';
  document.getElementById('noticeDate').style.display = isArchive ? 'none' : '';
  document.getElementById('noticeArchiveContainer').style.display = 'none';

  const activeSub = document.querySelector('#noticeSubTab button.active')?.dataset.sub || 'sales';
  document.getElementById('noticeSalesContainer').style.display = activeSub==='sales' ? '' : 'none';
  document.getElementById('noticeRoyaltyContainer').style.display = activeSub==='royalty' ? '' : 'none';

  if(isArchive){
    const a = ARCHIVES[monthSel.value];
    if(!a){
      document.getElementById('noticeSalesContainer').innerHTML = `<div class="card">해당 월의 업로드된 마감장표를 찾을 수 없어요.</div>`;
      document.getElementById('noticeRoyaltyContainer').innerHTML = '';
      return;
    }
    const dateStr = monthSel.value + ' 업로드본';
    let salesHtml = '';
    Object.entries(a.parsed.brands).forEach(([brand, rows], i)=>{ salesHtml += renderArchiveBrandBlock(brand, dateStr, rows, i===0); });
    document.getElementById('noticeSalesContainer').innerHTML = salesHtml || `<div class="card">매출현황 데이터를 인식하지 못했어요.</div>`;

    let royaltyHtml = '';
    Object.entries(a.parsed.royalty).forEach(([brand, rows])=>{ royaltyHtml += renderArchiveRoyaltyBlock(brand, dateStr, rows); });
    document.getElementById('noticeRoyaltyContainer').innerHTML = royaltyHtml || `<div class="card">로열티현황 데이터가 없어요.</div>`;
    return;
  }

  const dateStr = fmtDate(document.getElementById('noticeDate').value || new Date());
  let salesHtml = '';
  BRANDS.forEach((brand,i)=>{ salesHtml += renderNoticeBrandBlock(brand, dateStr, i===0); });
  document.getElementById('noticeSalesContainer').innerHTML = salesHtml;

  let royaltyHtml = '';
  const ROYALTY_BRANDS = BRANDS.filter(b=>b!=='유림대패' && b!=='려원장어');
  ROYALTY_BRANDS.forEach(brand=>{ royaltyHtml += renderNoticeRoyaltyBlock(brand, dateStr); });
  document.getElementById('noticeRoyaltyContainer').innerHTML = royaltyHtml;
}

document.querySelectorAll('#noticeSubTab button').forEach(b=>b.addEventListener('click', ()=>{
  document.querySelectorAll('#noticeSubTab button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  const sub = b.dataset.sub;
  document.getElementById('noticeSalesContainer').style.display = sub==='sales' ? '' : 'none';
  document.getElementById('noticeRoyaltyContainer').style.display = sub==='royalty' ? '' : 'none';
}));

function activeNoticeContainerId(){
  const active = document.querySelector('#noticeSubTab button.active')?.dataset.sub;
  return active==='royalty' ? 'noticeRoyaltyContainer' : 'noticeSalesContainer';
}
function activeNoticeLabel(){
  const monthSel = document.getElementById('noticeMonthSelect');
  const suffix = (monthSel && monthSel.value!=='current') ? `_${monthSel.value}` : '';
  return (activeNoticeContainerId()==='noticeRoyaltyContainer' ? '로열티현황' : '매출현황') + suffix;
}

/* ---------- 업로드된 엑셀을 "공지용 마감장표"와 같은 양식으로 렌더링 ---------- */
function renderArchiveBrandBlock(brand, dateStr, rows, showSortLabel){
  if(!rows.length) return '';
  const sums = rows.reduce((a,r)=>({
    prevDay:a.prevDay+(r.prevDay||0), receipts:a.receipts+(r.receipts||0), sales:a.sales+(r.curSales||0),
    proj:a.proj+(r.proj||0), prevMonth:a.prevMonth+(r.prevMonth||0), prevYear:a.prevYear+(r.prevYear||0)
  }), {prevDay:0,receipts:0,sales:0,proj:0,prevMonth:0,prevYear:0});
  const sumUnit = sums.receipts ? sums.sales/sums.receipts : 0;
  const sumMom = sums.prevMonth ? (sums.proj-sums.prevMonth)/sums.prevMonth : null;
  const sumYoy = sums.prevYear ? (sums.proj-sums.prevYear)/sums.prevYear : null;
  return `
  <div class="notice-block">
    <div class="notice-head">
      <div class="lft"><span class="date-chip">${dateStr} 마감 기준</span><span class="brand-chip">${brand}</span></div>
      ${showSortLabel ? '<div class="hint">매출 내림차순 정렬</div>' : ''}
    </div>
    <table class="notice">
      <colgroup>
        <col style="width:4%"><col style="width:6%"><col style="width:9%"><col style="width:8%">
        <col style="width:8%"><col style="width:7%"><col style="width:7%">
        <col style="width:8%"><col style="width:8%"><col style="width:7%">
        <col style="width:8%"><col style="width:6%"><col style="width:8%"><col style="width:6%">
      </colgroup>
      <thead>
        <tr>
          <th rowspan="2">순위</th><th rowspan="2">지역</th><th rowspan="2">지점명</th><th rowspan="2">사업개시일</th>
          <th colspan="6">당월 매출 현황</th>
          <th colspan="2">전월 대비</th><th colspan="2">전년동월 대비</th>
        </tr>
        <tr>
          <th>전일매출</th><th>영수건수</th><th>영수단가</th><th>당월누적매출</th><th>당월예상마감</th><th>일평균매출</th>
          <th>전월매출</th><th>증감률</th><th>전년동월매출</th><th>증감률</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r,i)=>`
        <tr>
          <td>${i+1}</td><td class="txt">${r.region||'-'}</td><td class="txt${r.type==='직영점'?' td-direct':''}">${r.name}</td><td class="txt${r.type==='직영점'?' td-direct':''}">${r.opened||'-'}</td>
          <td>${won(r.prevDay)}</td><td>${won(r.receipts)}</td><td>${won(r.unit)}</td>
          <td class="hl-cur">${won(r.curSales)}</td><td class="hl-proj">${won(r.proj)}</td><td>${won(r.dayAvg)}</td>
          <td>${won(r.prevMonth)}</td><td>${deltaSpan(r.momP)}</td>
          <td>${won(r.prevYear)}</td><td>${deltaSpan(r.yoyP)}</td>
        </tr>`).join('')}
        <tr class="total">
          <td colspan="4" class="txt">합계</td>
          <td>${won(sums.prevDay)}</td><td>${won(sums.receipts)}</td><td>${won(sumUnit)}</td>
          <td class="hl-cur">${won(sums.sales)}</td><td class="hl-proj">${won(sums.proj)}</td><td>-</td>
          <td>${won(sums.prevMonth)}</td><td>${deltaSpan(sumMom)}</td>
          <td>${won(sums.prevYear)}</td><td>${deltaSpan(sumYoy)}</td>
        </tr>
      </tbody>
    </table>
  </div>`;
}

function renderArchiveRoyaltyBlock(brand, dateStr, rows){
  if(!rows.length) return '';
  let sumCur=0,sumProj=0,sumRoyCur=0,sumRoyProj=0;
  const body = rows.map((r,i)=>{
    sumCur+=r.cur||0; sumProj+=r.proj||0; sumRoyCur+=r.royCur||0; sumRoyProj+=r.royProj||0;
    return `<tr>
      <td>${i+1}</td><td class="txt">${r.region||'-'}</td><td class="txt${r.type==='직영점'?' td-direct':''}">${r.name}</td><td class="txt${r.type==='직영점'?' td-direct':''}">${r.opened||'-'}</td>
      <td>${won(r.cur)}</td><td>${won(r.proj)}</td><td>${r.royaltyDisplay||'-'}</td>
      <td class="hl-cur">${won(r.royCur)}</td><td class="hl-proj">${won(r.royProj)}</td>
    </tr>`;
  }).join('');
  return `
  <div class="notice-block">
    <div class="notice-head"><div class="lft"><span class="date-chip">${dateStr} 마감 기준</span><span class="brand-chip">${brand} · 로열티현황</span></div></div>
    <table class="notice">
      <colgroup>
        <col style="width:6%"><col style="width:8%"><col style="width:14%"><col style="width:12%">
        <col style="width:13%"><col style="width:13%"><col style="width:9%">
        <col style="width:13%"><col style="width:12%">
      </colgroup>
      <thead><tr><th>순위</th><th>지역</th><th>지점명</th><th>사업개시일</th><th>당월누적</th><th>예상마감</th><th>로열티율</th><th>당월누적기준</th><th>예상마감기준</th></tr></thead>
      <tbody>${body}
        <tr class="total"><td colspan="4" class="txt">계</td><td>${won(sumCur)}</td><td>${won(sumProj)}</td><td>-</td><td class="hl-cur">${won(sumRoyCur)}</td><td class="hl-proj">${won(sumRoyProj)}</td></tr>
      </tbody>
    </table>
  </div>`;
}

// 헤더 텍스트로 컬럼을 찾기 위한 별칭표
const COL_ALIASES = {
  region:['지역'], name:['지점명','매장명'], opened:['사업개시일','개시일'],
  prevDay:['전일매출'], receipts:['영수건수','누적영수건수'], unit:['영수단가'],
  curSales:['당월누적매출','당월누적'], proj:['당월예상마감','예상마감'], dayAvg:['일평균매출','일평균'],
  prevMonth:['전월매출'], prevYear:['전년동월매출'],
  royaltyPct:['로열티율'], royCur:['당월누적기준'], royProj:['예상마감기준'],
};
function cellText(v){ return v==null ? '' : String(v).trim(); }
function toNum(v){
  if(v==null || v==='' || v==='-') return null;
  if(typeof v==='number') return v;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g,''));
  return isNaN(n) ? null : n;
}
function matchHeaderRow(row){
  const map = {};
  let momSeen = false;
  row.forEach((cellRaw, c)=>{
    const cell = cellText(cellRaw);
    if(!cell) return;
    for(const [field, aliases] of Object.entries(COL_ALIASES)){
      if(map[field]!=null) continue;
      if(aliases.some(a=>cell.includes(a))) map[field] = c;
    }
    if(cell.includes('증감률')){
      if(!momSeen){ map.momPct = c; momSeen = true; } else { map.yoyPct = c; }
    }
  });
  // 마감장표 판별: 지점명 + (당월누적매출 또는 당월누적) 컬럼이 있어야 유효한 헤더로 인정
  const hasSales = map.name!=null && (map.curSales!=null || map.royaltyPct!=null);
  return hasSales ? map : null;
}

function parseArchiveWorkbook(wb){
  const result = { brands:{}, royalty:{} };
  const sheetNames = wb.SheetNames.filter(n=>n.includes('마감장표'));
  const targets = sheetNames.length ? sheetNames : wb.SheetNames;
  targets.forEach(sn=>{
    const grid = XLSX.utils.sheet_to_json(wb.Sheets[sn], {header:1, raw:true, defval:null});
    let currentBrand = null;
    let i = 0;
    while(i < grid.length){
      const row = grid[i] || [];
      const map = matchHeaderRow(row);
      if(map){
        // 브랜드명: 이 헤더 위 1~2줄 안에서 브랜드 이름이 들어있는 셀을 찾는다
        for(let back=1; back<=3 && i-back>=0; back++){
          const text = (grid[i-back]||[]).map(cellText).join(' ');
          const hit = BRANDS.find(b=>text.includes(b));
          if(hit){ currentBrand = hit; break; }
        }
        const isRoyalty = map.royaltyPct!=null;
        const rows = [];
        let r = i+1;
        while(r < grid.length){
          const dataRow = grid[r] || [];
          const nameVal = cellText(dataRow[map.name]);
          if(!nameVal || nameVal==='합계' || nameVal==='계'){ break; }
          if(matchHeaderRow(dataRow)) break; // 다음 블록 헤더를 만나면 중단
          if(isRoyalty){
            rows.push({
              name:nameVal, region: map.region!=null?cellText(dataRow[map.region]):'',
              opened: map.opened!=null?cellText(dataRow[map.opened]):'',
              cur: toNum(dataRow[map.curSales]), proj: toNum(dataRow[map.proj]),
              royaltyDisplay: map.royaltyPct!=null ? cellText(dataRow[map.royaltyPct]) : '-',
              royCur: toNum(dataRow[map.royCur]), royProj: toNum(dataRow[map.royProj]),
            });
          }else{
            const prevMonth = toNum(dataRow[map.prevMonth]);
            const prevYear = toNum(dataRow[map.prevYear]);
            const proj = toNum(dataRow[map.proj]);
            rows.push({
              name:nameVal, region: map.region!=null?cellText(dataRow[map.region]):'',
              opened: map.opened!=null?cellText(dataRow[map.opened]):'',
              prevDay: toNum(dataRow[map.prevDay]), receipts: toNum(dataRow[map.receipts]),
              unit: toNum(dataRow[map.unit]), curSales: toNum(dataRow[map.curSales]),
              proj, dayAvg: toNum(dataRow[map.dayAvg]),
              prevMonth, momP: (prevMonth && proj!=null) ? (proj-prevMonth)/prevMonth : toNum(dataRow[map.momPct])/100,
              prevYear, yoyP: (prevYear && proj!=null) ? (proj-prevYear)/prevYear : toNum(dataRow[map.yoyPct])/100,
            });
          }
          r++;
        }
        if(currentBrand && rows.length){
          if(isRoyalty) result.royalty[currentBrand] = rows;
          else result.brands[currentBrand] = rows;
        }
        i = r;
      }else{
        i++;
      }
    }
  });
  return result;
}

async function copyNoticeAsImage(){
  const btn = document.getElementById('copyImgBtn');
  const original = btn.textContent;
  btn.textContent = '이미지 만드는 중…';
  try{
    const target = document.getElementById(activeNoticeContainerId());
    const canvas = await html2canvas(target, { backgroundColor:'#F3F4F7', scale:2, useCORS:true });
    canvas.toBlob(async (blob)=>{
      try{
        await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);
        showToast(`${activeNoticeLabel()} 이미지를 복사했어요 — 카카오톡 대화창에 Ctrl+V로 붙여넣으세요.`);
      }catch(err){
        // 클립보드 API를 지원하지 않는 브라우저 → 다운로드로 대체
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${activeNoticeLabel()}_${document.getElementById('noticeDate').value}.png`;
        a.click(); URL.revokeObjectURL(url);
        showToast('이 브라우저는 클립보드 복사가 안 되어 이미지로 다운로드했어요.');
      }
      btn.textContent = original;
    }, 'image/png');
  }catch(e){
    showToast('이미지 생성에 실패했어요. 인터넷 연결을 확인해주세요.');
    btn.textContent = original;
  }
}
document.getElementById('copyImgBtn').addEventListener('click', copyNoticeAsImage);

/* ---------- 매출성과분석표 ---------- */
function renderAnalysis(){
  const brandTotals = {}; BRANDS.forEach(b=>brandTotals[b]=0);
  STORES.forEach(s=>{ brandTotals[s.brand] += metricsFor(s.name,'당월누적')?.sales||0; });

  if(typeof Chart === 'undefined'){
    document.getElementById('brandPie').replaceWith(Object.assign(document.createElement('div'),{style:'padding:30px;text-align:center;color:var(--muted);font-size:12.5px',textContent:'차트 라이브러리(Chart.js)를 불러오지 못했어요. 인터넷 연결을 확인해주세요.'}));
    document.getElementById('compareBar').replaceWith(Object.assign(document.createElement('div'),{style:'padding:30px;text-align:center;color:var(--muted);font-size:12.5px',textContent:'차트 라이브러리(Chart.js)를 불러오지 못했어요.'}));
    return renderRankTables();
  }
  const ctx1 = document.getElementById('brandPie');
  if(charts.pie) charts.pie.destroy();
  charts.pie = new Chart(ctx1, { type:'doughnut',
    data:{ labels:BRANDS, datasets:[{ data:BRANDS.map(b=>brandTotals[b]),
      backgroundColor:BRAND_COLOR_LIST, borderWidth:2, borderColor:'#fff' }]},
    options:{ plugins:{legend:{position:'bottom', labels:{font:{family:'Pretendard'}, boxWidth:10}}} } });

  const withCompare = STORES.map(s=>({ name:s.short, brand:s.brand, mom:momChange(s.name), yoy:yoyChange(s.name) }))
    .filter(x=>x.mom!=null || x.yoy!=null);
  const brandAvg = {};
  BRANDS.forEach(b=>{
    const items = withCompare.filter(x=>x.brand===b);
    brandAvg[b] = { mom: items.length? items.reduce((a,c)=>a+(c.mom||0),0)/items.length:0,
                     yoy: items.length? items.reduce((a,c)=>a+(c.yoy||0),0)/items.length:0 };
  });
  const ctx2 = document.getElementById('compareBar');
  if(charts.bar) charts.bar.destroy();
  charts.bar = new Chart(ctx2, { type:'bar',
    data:{ labels:BRANDS, datasets:[
      {label:'전월대비', data:BRANDS.map(b=>+(brandAvg[b].mom*100).toFixed(1)), backgroundColor:'#B0281C', borderRadius:4},
      {label:'전년동월대비', data:BRANDS.map(b=>+(brandAvg[b].yoy*100).toFixed(1)), backgroundColor:'#2B4C8C', borderRadius:4},
    ]},
    options:{ scales:{ y:{ ticks:{ callback:v=>v+'%' } } }, plugins:{legend:{position:'bottom'}} } });

  renderRankTables();
}
function renderRankTables(){
  const grid = document.getElementById('brandRankGrid');
  grid.innerHTML = BRANDS.map(brand=>{
    const list = STORES.filter(s=>s.brand===brand)
      .map(s=>({s, sales:metricsFor(s.name,'당월누적')?.sales||0, mom:momChange(s.name)}))
      .sort((a,b)=>b.sales-a.sales);
    const rows = list.map((r,i)=>`
      <tr><td style="width:26px;color:var(--muted)">${i+1}</td>
        <td style="text-align:left;font-weight:600">${r.s.short}</td>
        <td class="num">${won(r.sales)}</td>
        <td>${r.mom==null?'<span class="pill flat">-</span>':`<span class="pill ${r.mom>=0?'up':'down'}">${r.mom>=0?'▲':'▼'} ${pct(r.mom)}</span>`}</td></tr>`).join('');

    const watch = list.filter(r=>r.mom!=null && r.mom<0).sort((a,b)=>a.mom-b.mom).slice(0,3);
    const watchHtml = watch.length ? `
      <div class="watch-box">
        <div class="watch-title">⚠ 주의 필요 매장</div>
        ${watch.map(r=>`<div class="watch-row"><span>${r.s.short}</span><span class="pill down">▼ ${pct(r.mom)}</span></div>`).join('')}
      </div>` : `<div class="watch-box ok">모든 지점이 전월 대비 상승 중이에요</div>`;

    return `
    <div class="card brand-rank-card">
      <div class="brand-rank-head" style="background:${BRAND_COLORS[brand]}"><span>${brand}</span><span style="font-weight:400;font-size:11.5px;opacity:.85">${list.length}개 지점</span></div>
      <div class="table-scroll"><table>
        <thead><tr><th style="width:26px"></th><th style="text-align:left">지점명</th><th>실매출액</th><th>전월대비</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      ${watchHtml}
    </div>`;
  }).join('');
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
      <div class="head"><div><h3>${s.short}</h3><div class="region">${s.region} · ${s.pos}</div></div>
        <span class="brand-tag tag-${s.brand}">${s.brand}</span></div>
      <div class="figures">
        <div class="frow"><div class="lbl">당월누적 실매출액</div><div class="num">${won(m?.sales)}</div></div>
        <div class="frow proj"><div class="lbl">당월 예상마감</div><div class="num">${won(projectedClose(s.name))}</div></div>
      </div>
      <div class="gauge-wrap"><div class="gauge-fill" style="width:${pctGauge}%"></div></div>
      <button class="btn ghost small detail-btn" data-id="${s.id}">상세보기 →</button>
    </div>`;
  }).join('');
  document.querySelectorAll('.store-card').forEach(el=>el.addEventListener('click', (e)=>{
    if(e.target.closest('.detail-btn')) return; // 버튼 클릭은 아래 핸들러가 처리
    openStoreModal(+el.dataset.id);
  }));
  document.querySelectorAll('.detail-btn').forEach(el=>el.addEventListener('click', (e)=>{
    e.stopPropagation(); openStoreModal(+el.dataset.id);
  }));
}
document.querySelectorAll('#brandFilter2 button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('#brandFilter2 button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); state.storeBrand=b.dataset.brand; renderStores();
}));
document.getElementById('storeSearch').addEventListener('input', e=>{ state.storeQuery=e.target.value; renderStores(); });

let storeModalChart = null;
function openStoreModal(id){
  const s = STORES.find(x=>x.id===id);
  const cur = metricsFor(s.name,'당월누적');
  const mom = momChange(s.name), yoy = yoyChange(s.name);
  const proj = projectedClose(s.name);
  document.getElementById('modalBody').classList.add('modal-wide');
  document.getElementById('modalBody').innerHTML = `
    <span class="close" id="modalClose">✕</span>
    <h2>${s.short} <span class="brand-tag tag-${s.brand}">${s.brand}</span></h2>
    <div style="font-size:12.5px;color:var(--muted)">${s.region} · ${s.pos} 연동 · 상세분석</div>

    <div class="modal-kpis">
      <div class="modal-kpi"><div class="mk-label">당월누적</div><div class="mk-value">${won(cur?.sales)}</div></div>
      <div class="modal-kpi"><div class="mk-label">예상마감</div><div class="mk-value">${won(proj)}</div></div>
      <div class="modal-kpi"><div class="mk-label">전월대비</div><div class="mk-value ${mom==null?'':(mom>=0?'up':'down')}">${mom==null?'-':pct(mom)}</div></div>
      <div class="modal-kpi"><div class="mk-label">전년동월대비</div><div class="mk-value ${yoy==null?'':(yoy>=0?'up':'down')}">${yoy==null?'-':pct(yoy)}</div></div>
    </div>

    <div class="mini-title" style="margin-top:20px;">기간별 실매출액 비교</div>
    <canvas id="storeModalChart" style="max-height:180px;"></canvas>

    <div class="kv">
      <div class="k">개점일</div><div class="v">${s.opened}</div>
      <div class="k">전용면적</div><div class="v">${s.area}평</div>
      <div class="k">월 임대료</div><div class="v">${s.rent}만원</div>
      <div class="k">로열티율</div><div class="v">${s.royaltyFixed ? `정액 ${won(s.royaltyFixed)}원` : royPct(s.royalty)}</div>
      <div class="k">예상 로열티(마감기준)</div><div class="v num">${won(s.royaltyFixed || proj*s.royalty)}원</div>
      <div class="k">평당 매출(예상마감 기준)</div><div class="v num">${won(proj/s.area)}원</div>
    </div>`;
  document.getElementById('overlay').classList.add('open');
  document.getElementById('modalClose').addEventListener('click', closeModal);

  if(typeof Chart !== 'undefined'){
    const vals = PERIODS.map(p=>metricsFor(s.name,p)?.sales||0);
    if(storeModalChart) storeModalChart.destroy();
    storeModalChart = new Chart(document.getElementById('storeModalChart'), {
      type:'bar',
      data:{ labels:PERIODS, datasets:[{ data:vals, backgroundColor:['#2B4C8C','#3A6B4C','#1B2C50','#6C749A','#101B33'], borderRadius:5 }] },
      options:{ plugins:{legend:{display:false}}, scales:{ y:{ ticks:{ callback:v=>(v/1e6).toFixed(0)+'백만' } } } }
    });
  }
}
function closeModal(){ document.getElementById('overlay').classList.remove('open'); }
document.getElementById('overlay').addEventListener('click', e=>{ if(e.target.id==='overlay') closeModal(); });

/* ---------- 매출 데이터 입력 (포스별 붙여넣기) ---------- */
function renderPosTabs(){
  document.getElementById('posTabs').innerHTML = ACCOUNT_LIST.map(p=>
    `<button data-pos="${p}" class="${p===state.entryPos?'active':''}">${p} <span style="opacity:.6">(${storesForAccount(p).length})</span></button>`
  ).join('');
  document.querySelectorAll('#posTabs button').forEach(b=>b.addEventListener('click', ()=>{
    state.entryPos = b.dataset.pos; renderEntry();
  }));
}
document.querySelectorAll('#entryPeriod button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('#entryPeriod button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); state.entryPeriod=b.dataset.period; renderEntry();
}));

function renderEntry(){
  renderPosTabs();
  const period = state.entryPeriod, account = state.entryPos;
  const schemaKey = ACCOUNTS[account].schema;
  const schema = POS_SCHEMA[schemaKey];
  const rows = storesForAccount(account);
  const grid = document.getElementById('entryGrid');
  grid.innerHTML = `
    <thead><tr>${schema.fields.map(f=>`<th>${f}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(s=>{
      const rec = SALES[period]?.[s.name] || {};
      return `<tr>
        ${schema.fields.map(f=>{
          const isText = TEXT_FIELDS.has(f);
          const val = f===schema.storeField ? s.name : (rec[f] ?? '');
          return `<td><input type="${isText?'text':'number'}" data-field="${f}" value="${val}" style="${isText?'text-align:left;font-weight:600;':''}"></td>`;
        }).join('')}
      </tr>`;
    }).join('')}</tbody>`;
  attachPasteHandler(grid);
  attachNameValidation(grid, schema, account);
}

function attachNameValidation(grid, schema, account){
  const nameInputs = Array.from(grid.querySelectorAll(`input[data-field="${schema.storeField}"]`));
  const check = (inp)=>{
    const ok = !!matchStore(inp.value.trim(), account);
    inp.style.background = ok ? '' : '#FDE7E5';
    inp.style.outline = ok ? '' : '2px solid var(--up)';
    inp.title = ok ? '' : '등록된 지점명과 일치하지 않아요. 저장해도 이 줄은 반영되지 않아요.';
  };
  nameInputs.forEach(inp=>{
    check(inp);
    inp.addEventListener('input', ()=>check(inp));
    inp.addEventListener('paste', ()=>setTimeout(()=>{
      // paste 이벤트로 여러 줄이 채워질 수 있으니 전체 매장명 칸을 다시 검사
      nameInputs.forEach(check);
    }, 0));
  });
}

function attachPasteHandler(grid){
  const schema = POS_SCHEMA[ACCOUNTS[state.entryPos].schema];
  const inputs = Array.from(grid.querySelectorAll('input'));
  const cols = schema.fields.length;
  inputs.forEach((inp, idx)=>{
    inp.addEventListener('paste', (e)=>{
      const text = (e.clipboardData || window.clipboardData).getData('text');
      if(!text.includes('\t') && !text.includes('\n')) return; // 단일 값 붙여넣기는 기본 동작
      e.preventDefault();
      const rows = text.replace(/\r/g,'').split('\n').filter(r=>r.length);
      const startRow = Math.floor(idx / cols);
      const startCol = idx % cols;
      rows.forEach((rowText, rOff)=>{
        const cells = rowText.split('\t');
        cells.forEach((val, cOff)=>{
          const targetRow = startRow + rOff;
          const targetCol = startCol + cOff;
          const targetIdx = targetRow*cols + targetCol;
          const target = inputs[targetIdx];
          if(!target) return;
          if(TEXT_FIELDS.has(target.dataset.field)){
            target.value = val.trim();
          }else{
            const numeric = val.replace(/[^0-9.\-]/g,'');
            if(numeric!=='') target.value = numeric;
          }
        });
      });
    });
  });
}

// 포스 화면에 찍히는 이름이 우리 지점명과 다른 경우 여기에 등록하세요.
// 왼쪽(포스에서 붙여넣는 실제 텍스트) -> 오른쪽(우리 시스템의 정식 지점명)
const STORE_ALIASES = {
  '얼얼하이 청주성안점': '얼얼하이(성안점)',
  '얼얼하이 청주 성안점': '얼얼하이(성안점)',
  '얼얼하이 아산점': '얼얼하이(아산용화점)',
  '얼얼하이 아산 점': '얼얼하이(아산용화점)',
};

function normalizeName(s){ return (s||'').replace(/\s+/g,'').replace(/[()]/g,''); }

function matchStore(pastedName, account){
  const candidates = storesForAccount(account);
  const trimmed = pastedName.trim();

  // 1) 별칭표 먼저 확인 (공백 유무 상관없이)
  const aliasKey = Object.keys(STORE_ALIASES).find(k => normalizeName(k) === normalizeName(trimmed));
  if(aliasKey){
    const canonical = STORE_ALIASES[aliasKey];
    const hit = candidates.find(s=>s.name===canonical);
    if(hit) return hit;
  }

  // 2) 정확히 일치
  let hit = candidates.find(s=>s.name === trimmed);
  if(hit) return hit;

  // 3) 공백/괄호 제거 후 서로 포함 관계 확인
  const norm = normalizeName(trimmed);
  hit = candidates.find(s=>{
    const shortNorm = normalizeName(s.short);
    const nameNorm = normalizeName(s.name);
    return norm.includes(shortNorm) || nameNorm.includes(norm) || norm.includes(nameNorm.replace(s.brand,''));
  });
  return hit;
}

document.getElementById('saveBtn').addEventListener('click', ()=>{
  const period = state.entryPeriod, account = state.entryPos;
  const schema = POS_SCHEMA[ACCOUNTS[account].schema];
  let unmatched = [];
  document.querySelectorAll('#entryGrid tbody tr').forEach(row=>{
    const inputs = row.querySelectorAll('input');
    const nameInput = Array.from(inputs).find(i=>i.dataset.field===schema.storeField);
    const pastedName = nameInput.value.trim();
    const store = matchStore(pastedName, account);
    if(!store){ unmatched.push(pastedName || '(빈 칸)'); return; }
    const rec = SALES[period][store.name] || {};
    inputs.forEach(inp=>{ rec[inp.dataset.field] = TEXT_FIELDS.has(inp.dataset.field) ? inp.value : (+inp.value || 0); });
    SALES[period][store.name] = rec;
  });
  saveSales(SALES);
  if(unmatched.length){
    showToast(`⚠ 지점명을 못 찾아 저장 안 된 줄이 있어요: ${unmatched.slice(0,3).join(', ')}`);
  }else{
    showToast('저장했어요 — 매출장표 · 공지용 마감장표에 반영됐어요.');
  }
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
  const d = new Date(); const days=['일','월','화','수','목','금','토'];
  document.getElementById('clock').textContent =
    `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} · ${days[d.getDay()]}요일 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
tickClock(); setInterval(tickClock, 1000*30);

/* ---------- 전체 렌더 ---------- */
/* ---------- 가맹점 정보 관리 ---------- */
const ADMIN_FIELDS = [
  ['region','지역','text'], ['type','가맹점/직영점','select'], ['owner','대표자명','text'],
  ['bizNo','사업자번호','text'], ['address','소재지 주소','text'],
  ['royaltyPct','로열티(%)','number'], ['opened','사업개시일','text'],
  ['area','평수','number'], ['rent','월 임대료(만원)','number'],
];
let adminQuery = '';
function renderAdmin(){
  const list = STORES.filter(s=>!adminQuery || s.name.includes(adminQuery));
  const grid = document.getElementById('adminGrid');
  grid.innerHTML = `
    <thead><tr><th>매장명</th>${ADMIN_FIELDS.map(f=>`<th>${f[1]}</th>`).join('')}</tr></thead>
    <tbody>${list.map(s=>`
      <tr data-store="${s.name}">
        <td class="fixed">${s.name}</td>
        ${ADMIN_FIELDS.map(([key,label,type])=>{
          if(key==='type'){
            return `<td><select data-field="type" style="width:100%;height:100%;border:none;padding:6px 8px;">
              <option value="가맹점" ${s.type==='가맹점'?'selected':''}>가맹점</option>
              <option value="직영점" ${s.type==='직영점'?'selected':''}>직영점</option>
            </select></td>`;
          }
          if(key==='royaltyPct'){
            const v = s.royaltyFixed ? '' : (s.royalty ? +(s.royalty*100).toFixed(2) : '');
            return `<td><input type="number" step="0.1" data-field="royaltyPct" value="${v}" placeholder="${s.royaltyFixed?'정액:'+s.royaltyFixed:''}"></td>`;
          }
          const val = s[key] ?? '';
          const isText = type==='text';
          return `<td><input type="${type}" data-field="${key}" value="${val}" style="${isText?'text-align:left;':''}"></td>`;
        }).join('')}
      </tr>`).join('')}</tbody>`;
}
document.getElementById('adminSearch').addEventListener('input', e=>{ adminQuery=e.target.value.trim(); renderAdmin(); });
document.getElementById('adminSaveBtn').addEventListener('click', ()=>{
  document.querySelectorAll('#adminGrid tbody tr').forEach(row=>{
    const name = row.dataset.store;
    const cur = STORE_OVERRIDES[name] || {};
    const liveStore = STORES.find(s=>s.name===name);
    row.querySelectorAll('[data-field]').forEach(el=>{
      const f = el.dataset.field;
      if(f==='royaltyPct'){
        if(el.value!==''){ cur.royalty = +el.value/100; if(liveStore) liveStore.royalty = cur.royalty; }
      }else if(el.tagName==='SELECT'){
        cur[f] = el.value; if(liveStore) liveStore[f] = el.value;
      }else if(el.type==='number'){
        const v = el.value==='' ? undefined : +el.value;
        cur[f] = v; if(liveStore && v!==undefined) liveStore[f] = v;
      }else{
        cur[f] = el.value; if(liveStore) liveStore[f] = el.value;
      }
    });
    STORE_OVERRIDES[name] = cur;
  });
  saveStoreOverrides(STORE_OVERRIDES);
  showToast('가맹점 정보를 저장했어요 — 다른 화면에도 바로 반영돼요.');
  renderAll();
});

/* ---------- 마감장표 업로드(월별 보관) ---------- */
function loadArchives(){
  const raw = localStorage.getItem('yfp_archives');
  if(raw){ try{ return JSON.parse(raw); }catch(e){} }
  return {}; // { 'YYYY-MM': {fileName, uploadedAt, html} }
}
function saveArchives(a){ localStorage.setItem('yfp_archives', JSON.stringify(a)); }
let ARCHIVES = loadArchives();

function renderArchiveList(){
  const months = Object.keys(ARCHIVES).sort().reverse();
  document.getElementById('archiveList').innerHTML = months.length ? months.map(m=>{
    const a = ARCHIVES[m];
    return `<tr>
      <td class="txt" style="font-weight:600">${m}</td>
      <td class="txt">${a.fileName}</td>
      <td class="txt" style="font-size:11.5px;color:var(--muted)">${new Date(a.uploadedAt).toLocaleString('ko-KR')} · 브랜드 ${Object.keys(a.parsed?.brands||{}).length}개 인식</td>
      <td><button class="btn ghost small archive-del" data-month="${m}">삭제</button></td>
    </tr>`;
  }).join('') : `<tr><td colspan="4" class="txt" style="color:var(--muted)">아직 업로드된 마감장표가 없어요.</td></tr>`;
  document.querySelectorAll('.archive-del').forEach(b=>b.addEventListener('click', ()=>{
    if(!confirm(`${b.dataset.month} 마감장표를 삭제할까요?`)) return;
    delete ARCHIVES[b.dataset.month];
    saveArchives(ARCHIVES);
    renderArchiveList();
    populateNoticeMonthSelect();
  }));
}

document.getElementById('archiveUploadBtn').addEventListener('click', async ()=>{
  const month = document.getElementById('archiveMonth').value;
  const file = document.getElementById('archiveFile').files[0];
  if(!month){ showToast('먼저 해당 월을 선택해주세요.'); return; }
  if(!file){ showToast('업로드할 엑셀 파일을 선택해주세요.'); return; }
  if(typeof XLSX === 'undefined'){ showToast('엑셀 처리 라이브러리를 불러오지 못했어요. 인터넷 연결을 확인해주세요.'); return; }
  const btn = document.getElementById('archiveUploadBtn');
  const original = btn.textContent; btn.textContent = '업로드 중…';
  try{
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type:'array' });
    const parsed = parseArchiveWorkbook(wb);
    const brandCount = Object.keys(parsed.brands).length;
    if(!brandCount){
      showToast('마감장표 형식을 인식하지 못했어요 — 지역/지점명/당월누적매출 등 컬럼명을 확인해주세요.');
      btn.textContent = original;
      return;
    }
    ARCHIVES[month] = { fileName:file.name, uploadedAt:Date.now(), parsed };
    saveArchives(ARCHIVES);
    renderArchiveList();
    populateNoticeMonthSelect();
    showToast(`${month} 마감장표를 저장했어요 (${brandCount}개 브랜드 인식됨).`);
    document.getElementById('archiveFile').value = '';
  }catch(e){
    showToast('파일을 읽는 데 실패했어요. 엑셀(.xlsx) 파일이 맞는지 확인해주세요.');
  }
  btn.textContent = original;
});

function populateNoticeMonthSelect(){
  const sel = document.getElementById('noticeMonthSelect');
  const cur = sel.value;
  const months = Object.keys(ARCHIVES).sort().reverse();
  sel.innerHTML = `<option value="current">현재(실시간)</option>` + months.map(m=>`<option value="${m}">${m} (업로드본)</option>`).join('');
  if([...sel.options].some(o=>o.value===cur)) sel.value = cur;
}
document.getElementById('noticeMonthSelect').addEventListener('change', renderNotice);

function renderAll(){
  if(state.view==='report') renderReportTable();
  if(state.view==='notice') renderNotice();
  if(state.view==='analysis') renderAnalysis();
  if(state.view==='stores') renderStores();
  if(state.view==='entry') renderEntry();
  if(state.view==='admin') renderAdmin();
  if(state.view==='archive') renderArchiveList();
}
initNoticeDate();
populateNoticeMonthSelect();
renderNav();
renderAll();
