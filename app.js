/* =====================================================================
   유림에퐁당 통합현황 — 데이터 모델 & 렌더링
===================================================================== */

/* ---------- 지점 정의 ---------- */
const RAW_STORES = [
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

const STORES_KEY = 'yfp_stores_v1';
function buildInitialStores(){
  return RAW_STORES.map(([brand,name,region,pos,royalty,royaltyFixed],i)=>{
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
}
function loadStores(){
  const raw = localStorage.getItem(STORES_KEY);
  if(raw){ try{ return JSON.parse(raw); }catch(e){} }
  const built = buildInitialStores();
  localStorage.setItem(STORES_KEY, JSON.stringify(built));
  return built;
}
function saveStores(list){ localStorage.setItem(STORES_KEY, JSON.stringify(list)); }
const STORES = loadStores();
function nextStoreId(){ return STORES.reduce((m,s)=>Math.max(m,s.id), -1) + 1; }

const BRANDS = ['퐁당','유림대패','려원장어','얼얼하이'];
const BRAND_ALIASES = { '마라꼬치':'얼얼하이' };
const BRAND_COLORS = { '퐁당':'#2B6CB0', '유림대패':'#2F9E5C', '려원장어':'#D98B2B', '얼얼하이':'#B0323F' };
const BRAND_COLOR_LIST = BRANDS.map(b=>BRAND_COLORS[b]);
const PERIODS = ['당월누적','전일','토요일','전월','전년동월'];
const PERIOD_DAYS_DEFAULT = { '당월누적':26, '전일':1, '토요일':1, '전월':30, '전년동월':28 };
const MONTH_TOTAL_DAYS = 31;

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

const won = n => n==null || isNaN(n) ? '-' : Math.round(n).toLocaleString('ko-KR');
const pct = n => n==null || isNaN(n) ? '-' : (n>=0?'+':'') + (n*100).toFixed(1) + '%';
const royPct = r => !r ? '-' : (r*100).toFixed(1) + '%';

/* =====================================================================
   컬럼 리사이즈 v5 — "한 컬럼만 늘어나고, 다른 컬럼은 절대 변하지 않음"
   ─────────────────────────────────────────────────────────────────────
   원리:
   - 모든 컬럼 폭을 명시적 px로 못박아둔다 (col.style.width, col.style.minWidth 모두 px)
   - table.style.width = 총합px, minWidth = 총합px 로 두어 테이블이 컨테이너에
     맞춰 재분배하지 않게 한다
   - 드래그 시:
       cols[colIdx].style.width = newW + 'px'
       cols[colIdx].style.minWidth = newW + 'px'
       table.style.width = (총합 - 이전 + newW) + 'px'
     이렇게 하면 다른 컬럼은 절대 영향받지 않고 딱 이 컬럼만 커지고 테이블
     전체가 그만큼 넓어져 옆으로 스크롤된다 (엑셀과 정확히 동일한 동작).
   - handle은 <th> 내부에 절대 위치 <div>로 심고, input/select보다 z-index를
     높이면서 <td>가 padding:0 이라도 <th>는 padding이 있어서 handle이 잘리지 않음.
     handle에 pointer-events:auto, 나머지는 그대로.
===================================================================== */

function resolveColSpans(theadRows){
  const occupied = [];
  const cellCols = new Map();
  let maxCol = 0;
  theadRows.forEach((row, rIdx)=>{
    occupied[rIdx] = occupied[rIdx] || new Set();
    let col = 0;
    Array.from(row.children).forEach(cell=>{
      while(occupied[rIdx].has(col)) col++;
      const colspan = cell.colSpan || 1;
      const rowspan = cell.rowSpan || 1;
      cellCols.set(cell, { start: col, span: colspan, rowIdx: rIdx });
      for(let r=rIdx; r<rIdx+rowspan; r++){
        occupied[r] = occupied[r] || new Set();
        for(let c=col; c<col+colspan; c++) occupied[r].add(c);
      }
      col += colspan;
      maxCol = Math.max(maxCol, col);
    });
  });
  return { cellCols, colCount:maxCol };
}

function measureColumnWidths(table, cellCols, colCount){
  const measured = new Array(colCount).fill(0);
  cellCols.forEach(({start,span}, cell)=>{
    if(span!==1) return;
    const w = Math.ceil(cell.getBoundingClientRect().width);
    if(w > measured[start]) measured[start] = w;
  });
  const bodyRows = table.tBodies[0] ? Array.from(table.tBodies[0].rows) : [];
  bodyRows.forEach(row=>{
    let col = 0;
    Array.from(row.children).forEach(cell=>{
      const span = cell.colSpan || 1;
      if(span===1){
        const w = Math.ceil(cell.getBoundingClientRect().width);
        if(w > measured[col]) measured[col] = w;
      }
      col += span;
    });
  });
  return measured;
}

function loadColState(key){
  try{
    const raw = localStorage.getItem('yfp_colw_'+key);
    if(!raw) return { widths:{}, manual:{} };
    const parsed = JSON.parse(raw);
    if(parsed && typeof parsed==='object' && parsed.widths) return { widths:parsed.widths||{}, manual:parsed.manual||{} };
    return { widths: parsed || {}, manual:{} };
  }catch(e){ return { widths:{}, manual:{} }; }
}
function saveColState(key, state){ localStorage.setItem('yfp_colw_'+key, JSON.stringify(state)); }
function saveColWidth(key, idx, width, manual){
  const st = loadColState(key);
  st.widths[idx] = width;
  if(manual) st.manual[idx] = true;
  saveColState(key, st);
}

let _measureCanvasCtx = null;
function textPixelWidth(text, font){
  if(!_measureCanvasCtx) _measureCanvasCtx = document.createElement('canvas').getContext('2d');
  _measureCanvasCtx.font = font;
  return _measureCanvasCtx.measureText(text ?? '').width;
}

function injectResizeCss(){
  if(document.getElementById('resize-v5-css')) return;
  const st = document.createElement('style');
  st.id = 'resize-v5-css';
  st.textContent = `
    body.col-resizing, body.col-resizing *{ cursor:col-resize !important; user-select:none !important; }
    /* handle을 th 내부에 심는다. th는 원래 relative 이므로 안전. */
    th.rz-th{ position:relative; }
    .rz-grip{
      position:absolute; top:0; right:-4px;
      width:9px; height:100%;
      cursor:col-resize;
      z-index:20;
      background:transparent;
      user-select:none;
      touch-action:none;
    }
    .rz-grip:hover, .rz-grip.active{ background:rgba(43,76,140,.35); }
    .rz-grip::after{
      content:''; position:absolute; top:0; left:4px; width:1px; height:100%;
      background:transparent;
    }
    .rz-grip:hover::after, .rz-grip.active::after{ background:var(--blue); }
    /* grid-table th의 sticky/overflow를 handle이 뚫고 나갈 수 있게 overflow:visible 강제 */
    table.rz-enabled th{ overflow:visible !important; }
    table.rz-enabled{ border-collapse:collapse; }
  `;
  document.head.appendChild(st);
}
injectResizeCss();

let _resizeGuide = null;
function getResizeGuide(){
  if(_resizeGuide && document.body.contains(_resizeGuide)) return _resizeGuide;
  const g = document.createElement('div');
  g.style.cssText = 'position:fixed;width:2px;background:var(--blue);z-index:99999;display:none;pointer-events:none;box-shadow:0 0 6px rgba(43,76,140,.5);';
  document.body.appendChild(g);
  _resizeGuide = g;
  return g;
}

// ★ 엑셀식 리사이즈: 한 컬럼만 늘어나고 나머지는 절대 안 변한다.
function setupExcelResize(table, key){
  if(!table || !table.tHead || !table.tBodies[0]) return;
  const theadRows = Array.from(table.tHead.rows);
  const { cellCols, colCount } = resolveColSpans(theadRows);
  if(!colCount) return;

  table.classList.add('rz-enabled');
  // 1) 측정 (auto layout으로 자연 폭)
  table.style.tableLayout = 'auto';
  table.style.width = '';
  table.style.minWidth = '';
  const measured = measureColumnWidths(table, cellCols, colCount);
  const saved = loadColState(key);
  const widths = new Array(colCount).fill(0).map((_,i)=> saved.widths[i] || measured[i] || 80);

  // 2) colgroup 재생성
  const oldColgroup = table.querySelector('colgroup');
  if(oldColgroup) oldColgroup.remove();
  const colgroup = document.createElement('colgroup');
  widths.forEach(w=>{
    const c = document.createElement('col');
    c.style.width = w+'px';
    c.style.minWidth = w+'px';
    colgroup.appendChild(c);
  });
  table.insertBefore(colgroup, table.firstChild);
  const cols = Array.from(colgroup.children);

  // 3) fixed layout + 명시적 총폭
  table.style.tableLayout = 'fixed';
  let totalW = widths.reduce((a,b)=>a+b, 0);
  table.style.width = totalW + 'px';
  table.style.minWidth = totalW + 'px';

  // 4) 이전 grip 제거
  table.querySelectorAll('.rz-grip').forEach(g=>g.remove());
  Array.from(table.tHead.querySelectorAll('th')).forEach(th=>th.classList.remove('rz-th'));

  // 5) 각 leaf 헤더 셀에 grip 심기
  const leafCells = [];
  cellCols.forEach(({start,span}, cell)=>{
    if(span!==1) return;
    // 같은 컬럼에 여러 후보가 있으면 마지막(가장 아래) 셀에 붙인다
    leafCells[start] = cell;
  });
  leafCells.forEach((cell, colIdx)=>{
    if(!cell) return;
    cell.classList.add('rz-th');
    const grip = document.createElement('div');
    grip.className = 'rz-grip';
    grip.dataset.col = String(colIdx);
    cell.appendChild(grip);

    grip.addEventListener('mousedown', (e)=>{
      if(e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = widths[colIdx];
      let finalW = startW;
      grip.classList.add('active');
      document.body.classList.add('col-resizing');
      const guide = getResizeGuide();
      const tRect = table.getBoundingClientRect();
      guide.style.top = tRect.top + 'px';
      guide.style.height = tRect.height + 'px';
      guide.style.left = e.clientX + 'px';
      guide.style.display = 'block';

      const onMove = (ev)=>{
        ev.preventDefault();
        const dx = ev.clientX - startX;
        finalW = Math.max(30, Math.round(startW + dx));
        // ★ 핵심: 이 컬럼만 폭 변경 + table 총폭도 그만큼 변경
        //   → 다른 컬럼은 절대 안 변함
        cols[colIdx].style.width = finalW + 'px';
        cols[colIdx].style.minWidth = finalW + 'px';
        totalW = widths.reduce((acc, w, i)=> acc + (i===colIdx ? finalW : w), 0);
        table.style.width = totalW + 'px';
        table.style.minWidth = totalW + 'px';
        guide.style.left = ev.clientX + 'px';
      };
      const onUp = (ev)=>{
        window.removeEventListener('mousemove', onMove, true);
        window.removeEventListener('mouseup', onUp, true);
        grip.classList.remove('active');
        document.body.classList.remove('col-resizing');
        guide.style.display = 'none';
        widths[colIdx] = finalW;
        saveColWidth(key, colIdx, finalW, true);
      };
      window.addEventListener('mousemove', onMove, true);
      window.addEventListener('mouseup', onUp, true);
    });

    // grip 위에서는 셀 클릭(포커스) 방지
    grip.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); });
  });

  return { cols, widths };
}

/* ---------- 공지용 마감장표 — 컨테이너 폭에 맞춰 표 확장/압축 ---------- */
// 4개 브랜드 표를 하나의 폭 배열로 정렬하되, 그 폭 배열을 컨테이너(사이드바 옆 영역)
// 폭에 정확히 맞춰 스케일한다. 자연폭이 컨테이너보다 크면 축소, 작으면 확장.
// 결과: 가로 스크롤 없이 항상 한 화면에 다 보임 + 4개 브랜드 표 일직선.
function applyNoticeAutoWidths(tables, container){
  if(!tables.length) return;
  // 1) 자연폭 측정 위해 auto layout으로
  tables.forEach(t=>{
    const old = t.querySelector('colgroup');
    if(old) old.remove();
    t.style.tableLayout = 'auto';
    t.style.width = '';
    t.style.minWidth = '';
  });
  // 2) 컬럼별 자연폭 최댓값
  const perTable = tables.map(t=>{
    const theadRows = Array.from(t.tHead.rows);
    const info = resolveColSpans(theadRows);
    const measured = measureColumnWidths(t, info.cellCols, info.colCount);
    return { table:t, colCount:info.colCount, measured };
  });
  const colCount = Math.max(...perTable.map(p=>p.colCount));
  const natural = new Array(colCount).fill(0);
  perTable.forEach(p=>{
    for(let i=0;i<p.colCount;i++){
      const w = p.measured[i]||0;
      if(w > natural[i]) natural[i] = w;
    }
  });
  const naturalTotal = natural.reduce((a,b)=>a+b, 0);

  // 3) 컨테이너 사용 가능 폭
  const containerEl = container || tables[0].closest('.notice-block')?.parentElement || document.body;
  const cRect = containerEl.getBoundingClientRect();
  const cs = getComputedStyle(containerEl);
  const availW = Math.max(300, Math.floor(cRect.width - parseFloat(cs.paddingLeft||0) - parseFloat(cs.paddingRight||0)) - 2);

  // 4) 비례 스케일 (커도 축소, 작아도 확장) → 항상 컨테이너에 딱 맞춤
  const ratio = naturalTotal > 0 ? availW / naturalTotal : 1;
  const widths = natural.map(w => Math.max(28, Math.floor(w * ratio)));
  const diff = availW - widths.reduce((a,b)=>a+b,0);
  if(diff !== 0){
    let maxIdx = 0;
    widths.forEach((w,i)=>{ if(w > widths[maxIdx]) maxIdx = i; });
    widths[maxIdx] += diff;
  }
  const totalW = widths.reduce((a,b)=>a+b, 0);

  // 5) 모든 표에 동일 colgroup 심고 fixed layout
  tables.forEach(t=>{
    const cg = document.createElement('colgroup');
    widths.forEach(w=>{
      const c = document.createElement('col');
      c.style.width = w+'px';
      cg.appendChild(c);
    });
    t.insertBefore(cg, t.firstChild);
    t.style.tableLayout = 'fixed';
    t.style.width = totalW + 'px';
    t.style.minWidth = totalW + 'px';
  });
}

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
    ${delta!=null ? `<div class="delta ${delta>=0?'up':'down'}">${delta>=0?'▲':'▼'} 전월 대비</div>` : ''}</div>`).join('')
;
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

  const brandTotals = {}; BRANDS.forEach(b=>brandTotals[b]=0);
  STORES.forEach(s=>{ brandTotals[s.brand] += metricsFor(s.name,period)?.sales||0; });
  if(miniCharts.brand) miniCharts.brand.destroy();
  miniCharts.brand = new Chart(document.getElementById('miniBrandChart'), {
    type:'doughnut',
    data:{ labels:BRANDS, datasets:[{ data:BRANDS.map(b=>brandTotals[b]), backgroundColor:BRAND_COLOR_LIST, borderWidth:2, borderColor:'#fff' }] },
    options:{ ...miniOpts, plugins:{legend:{position:'bottom', labels:{boxWidth:8, font:{size:9}}}} }
  });

  const ranked = list.map(s=>({name:s.short, sales:metricsFor(s.name,period)?.sales||0})).sort((a,b)=>b.sales-a.sales).slice(0,5);
  if(miniCharts.top) miniCharts.top.destroy();
  miniCharts.top = new Chart(document.getElementById('miniTopChart'), {
    type:'bar',
    data:{ labels:ranked.map(r=>r.name), datasets:[{ data:ranked.map(r=>r.sales), backgroundColor:'#2B4C8C', borderRadius:4 }] },
    options:{ ...miniOpts, indexAxis:'y', scales:{ x:{ ticks:{ display:false }, grid:{display:false} }, y:{ ticks:{font:{size:9}}, grid:{display:false} } } }
  });

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
    <table class="notice notice-sales" data-brand="${brand}">
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
    <table class="notice notice-royalty" data-brand="${brand}">
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
    BRANDS.forEach((brand, i)=>{
      const rows = a.parsed.brands[brand];
      if(rows && rows.length) salesHtml += renderArchiveBrandBlock(brand, dateStr, rows, i===0);
    });
    document.getElementById('noticeSalesContainer').innerHTML = salesHtml || `<div class="card">매출현황 데이터를 인식하지 못했어요.</div>`;

    let royaltyHtml = '';
    BRANDS.forEach(brand=>{
      const rows = a.parsed.royalty[brand];
      if(rows && rows.length) royaltyHtml += renderArchiveRoyaltyBlock(brand, dateStr, rows);
    });
    document.getElementById('noticeRoyaltyContainer').innerHTML = royaltyHtml || `<div class="card">로열티현황 데이터가 없어요.</div>`;
    requestAnimationFrame(applyNoticeFixedLayout);
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
  requestAnimationFrame(applyNoticeFixedLayout);
}

// 공지용: 4개 브랜드 표를 컨테이너 폭에 맞춰 스케일 (한 화면에 다 보임)
function applyNoticeFixedLayout(){
  const salesCont = document.getElementById('noticeSalesContainer');
  const royCont = document.getElementById('noticeRoyaltyContainer');
  const salesTables = Array.from(salesCont.querySelectorAll('table.notice-sales'));
  const royTables   = Array.from(royCont.querySelectorAll('table.notice-royalty'));
  if(salesTables.length) applyNoticeAutoWidths(salesTables, salesCont);
  if(royTables.length)   applyNoticeAutoWidths(royTables, royCont);
}
// 창 크기 바뀌면 재계산
window.addEventListener('resize', ()=>{
  if(state.view === 'notice') requestAnimationFrame(applyNoticeFixedLayout);
});

document.querySelectorAll('#noticeSubTab button').forEach(b=>b.addEventListener('click', ()=>{
  document.querySelectorAll('#noticeSubTab button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  const sub = b.dataset.sub;
  document.getElementById('noticeSalesContainer').style.display = sub==='sales' ? '' : 'none';
  document.getElementById('noticeRoyaltyContainer').style.display = sub==='royalty' ? '' : 'none';
  requestAnimationFrame(applyNoticeFixedLayout);
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

/* ---------- 업로드된 엑셀 렌더링 ---------- */
function displayStoreName(fullName){
  const s = cellText(fullName);
  const m = s.match(/\(([^()]+)\)\s*$/);
  return m ? m[1] : s;
}
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
    <table class="notice notice-sales" data-brand="${brand}">
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
          <td>${i+1}</td><td class="txt">${r.region||'-'}</td><td class="txt${r.type==='직영점'?' td-direct':''}">${displayStoreName(r.name)}</td><td class="txt${r.type==='직영점'?' td-direct':''}">${r.opened||'-'}</td>
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
      <td>${i+1}</td><td class="txt">${r.region||'-'}</td><td class="txt${r.type==='직영점'?' td-direct':''}">${displayStoreName(r.name)}</td><td class="txt${r.type==='직영점'?' td-direct':''}">${r.opened||'-'}</td>
      <td>${won(r.cur)}</td><td>${won(r.proj)}</td><td>${r.royaltyDisplay||'-'}</td>
      <td class="hl-cur">${won(r.royCur)}</td><td class="hl-proj">${won(r.royProj)}</td>
    </tr>`;
  }).join('');
  return `
  <div class="notice-block">
    <div class="notice-head"><div class="lft"><span class="date-chip">${dateStr} 마감 기준</span><span class="brand-chip">${brand} · 로열티현황</span></div></div>
    <table class="notice notice-royalty" data-brand="${brand}">
      <thead><tr><th>순위</th><th>지역</th><th>지점명</th><th>사업개시일</th><th>당월누적</th><th>예상마감</th><th>로열티율</th><th>당월누적기준</th><th>예상마감기준</th></tr></thead>
      <tbody>${body}
        <tr class="total"><td colspan="4" class="txt">계</td><td>${won(sumCur)}</td><td>${won(sumProj)}</td><td>-</td><td class="hl-cur">${won(sumRoyCur)}</td><td class="hl-proj">${won(sumRoyProj)}</td></tr>
      </tbody>
    </table>
  </div>`;
}

const COL_ALIASES = {
  region:['지역'], name:['지점명','매장명'], opened:['사업개시일','개시일','개점일','오픈일'],
  prevDay:['전일매출'], receipts:['영수건수','누적영수건수'], unit:['영수단가'],
  curSales:['당월누적매출','당월누적'], proj:['당월예상마감','예상마감'], dayAvg:['일평균매출','일평균'],
  prevMonth:['전월매출'], prevYear:['전년동월매출'],
  royaltyPct:['로열티율'], royCur:['당월누적기준'], royProj:['예상마감기준'],
  type:['가맹점/직영점','구분','유형'],
};
function cellText(v){
  if(v==null) return '';
  if(v instanceof Date) return formatDateCell(v);
  return String(v).trim();
}
function normText(v){ return cellText(v).replace(/\s+/g, ''); }
function toNum(v){
  if(v==null || v==='' || v==='-') return null;
  if(typeof v==='number') return v;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g,''));
  return isNaN(n) ? null : n;
}

function formatDateCell(v){
  if(v==null || v==='') return '';
  const pad = (n)=> String(n).padStart(2,'0');
  const asISO = (d)=>{
    if(!(d instanceof Date) || isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  };
  if(v instanceof Date) return asISO(v);
  if(typeof v === 'number' && isFinite(v) && v > 20000 && v < 80000){
    const ms = (v - 25569) * 86400 * 1000;
    return asISO(new Date(ms));
  }
  const s = String(v).trim();
  if(!s) return '';
  let m = s.match(/^(\d{4})[.\-\/년\s]+(\d{1,2})[.\-\/월\s]+(\d{1,2})/);
  if(m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = s.match(/^(\d{2})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
  if(m){
    const year = +m[1] < 70 ? 2000 + +m[1] : 1900 + +m[1];
    return `${year}-${pad(+m[2])}-${pad(+m[3])}`;
  }
  if(/^\d+(\.\d+)?$/.test(s)){
    const n = parseFloat(s);
    if(n > 20000 && n < 80000){
      const ms = (n - 25569) * 86400 * 1000;
      return asISO(new Date(ms));
    }
  }
  const d = new Date(s);
  if(!isNaN(d.getTime())) return asISO(d);
  return s;
}

function matchHeaderRow(row){
  const map = {};
  let momSeen = false;
  row.forEach((cellRaw, c)=>{
    const cell = normText(cellRaw);
    if(!cell) return;
    for(const [field, aliases] of Object.entries(COL_ALIASES)){
      if(map[field]!=null) continue;
      if(aliases.some(a=>cell.includes(normText(a)))) map[field] = c;
    }
    if(cell.includes('증감률')){
      if(!momSeen){ map.momPct = c; momSeen = true; } else { map.yoyPct = c; }
    }
  });
  const hasSales = map.name!=null && (map.curSales!=null || map.royaltyPct!=null);
  return hasSales ? map : null;
}

function enrichRowWithStoreInfo(row){
  row.opened = formatDateCell(row.opened);
  const nameStr = cellText(row.name);
  if(!nameStr) return row;
  const normPasted = normalizeName(nameStr);
  let hit = STORES.find(s=> s.name===nameStr || s.short===nameStr);
  if(!hit){
    hit = STORES.find(s=>{
      const fn = normalizeName(s.name);
      const sn = normalizeName(s.short);
      return fn===normPasted || sn===normPasted || fn.includes(normPasted) || normPasted.includes(sn);
    });
  }
  if(hit){
    if(!row.type || (row.type!=='가맹점' && row.type!=='직영점')){
      row.type = hit.type || '가맹점';
    }
    if(!row.opened) row.opened = hit.opened || '';
    if(!row.region) row.region = hit.region || '';
  }else{
    if(!row.type) row.type = '가맹점';
  }
  return row;
}

function parseArchiveWorkbook(wb){
  const result = { brands:{}, royalty:{}, skipped:[] };
  const sheetNames = wb.SheetNames.filter(n=>n.includes('마감장표'));
  const targets = sheetNames.length ? sheetNames : wb.SheetNames;
  targets.forEach(sn=>{
    const grid = XLSX.utils.sheet_to_json(wb.Sheets[sn], {header:1, raw:true, cellDates:true, defval:null});
    let i = 0;
    while(i < grid.length){
      const row = grid[i] || [];
      const map = matchHeaderRow(row);
      if(map){
        let currentBrand = null;
        for(let back=1; back<=3 && i-back>=0; back++){
          const text = (grid[i-back]||[]).map(cellText).join(' ');
          const hit = BRANDS.find(b=>text.includes(b));
          if(hit){ currentBrand = hit; break; }
          const aliasHit = Object.keys(BRAND_ALIASES).find(a=>text.includes(a));
          if(aliasHit){ currentBrand = BRAND_ALIASES[aliasHit]; break; }
        }
        const isRoyalty = map.royaltyPct!=null;
        const rows = [];
        let r = i+1;
        while(r < grid.length){
          const dataRow = grid[r] || [];
          const nameVal = cellText(dataRow[map.name]);
          if(!nameVal || nameVal==='합계' || nameVal==='계'){ break; }
          if(matchHeaderRow(dataRow)) break;
          if(isRoyalty){
            rows.push(enrichRowWithStoreInfo({
              name:nameVal, region: map.region!=null?cellText(dataRow[map.region]):'',
              opened: map.opened!=null?dataRow[map.opened]:'',
              type: map.type!=null?cellText(dataRow[map.type]):'',
              cur: toNum(dataRow[map.curSales]), proj: toNum(dataRow[map.proj]),
              royaltyDisplay: map.royaltyPct!=null ? cellText(dataRow[map.royaltyPct]) : '-',
              royCur: toNum(dataRow[map.royCur]), royProj: toNum(dataRow[map.royProj]),
            }));
          }else{
            const prevMonth = toNum(dataRow[map.prevMonth]);
            const prevYear = toNum(dataRow[map.prevYear]);
            const proj = toNum(dataRow[map.proj]);
            rows.push(enrichRowWithStoreInfo({
              name:nameVal, region: map.region!=null?cellText(dataRow[map.region]):'',
              opened: map.opened!=null?dataRow[map.opened]:'',
              type: map.type!=null?cellText(dataRow[map.type]):'',
              prevDay: toNum(dataRow[map.prevDay]), receipts: toNum(dataRow[map.receipts]),
              unit: toNum(dataRow[map.unit]), curSales: toNum(dataRow[map.curSales]),
              proj, dayAvg: toNum(dataRow[map.dayAvg]),
              prevMonth, momP: (prevMonth && proj!=null) ? (proj-prevMonth)/prevMonth : (toNum(dataRow[map.momPct])!=null ? toNum(dataRow[map.momPct])/100 : null),
              prevYear, yoyP: (prevYear && proj!=null) ? (proj-prevYear)/prevYear : (toNum(dataRow[map.yoyPct])!=null ? toNum(dataRow[map.yoyPct])/100 : null),
            }));
          }
          r++;
        }
        if(currentBrand && rows.length){
          if(isRoyalty) result.royalty[currentBrand] = rows;
          else result.brands[currentBrand] = rows;
        }else if(rows.length){
          result.skipped.push({ row: i+1, sampleName: rows[0].name });
        }
        i = r;
      }else{
        i++;
      }
    }
  });
  return result;
}

/* ---------- 공지용 이미지 복사 — 표들만 캡처 (오른쪽 여백 제거) ---------- */
async function copyNoticeAsImage(){
  const btn = document.getElementById('copyImgBtn');
  const original = btn.textContent;
  btn.textContent = '이미지 만드는 중…';
  try{
    // ★ 표만 캡처: notice-block(각 표 블록)만 임시 래퍼로 옮겨서 캡처
    const source = document.getElementById(activeNoticeContainerId());
    const blocks = Array.from(source.querySelectorAll('.notice-block'));
    if(!blocks.length){ showToast('표가 없어 이미지를 만들 수 없어요.'); btn.textContent = original; return; }

    const srcW = source.getBoundingClientRect().width;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;left:-99999px;top:0;background:#F3F4F7;padding:8px;box-sizing:border-box;';
    wrap.style.width = Math.ceil(srcW) + 'px';
    blocks.forEach(b=>{
      const clone = b.cloneNode(true);
      clone.style.marginBottom = '10px';
      clone.style.overflow = 'hidden';
      wrap.appendChild(clone);
    });
    document.body.appendChild(wrap);

    // 복제된 표들에도 폭 재계산 (원본 컨테이너 폭 기준으로 fit)
    const salesTables = Array.from(wrap.querySelectorAll('table.notice-sales'));
    const royTables = Array.from(wrap.querySelectorAll('table.notice-royalty'));
    if(salesTables.length) applyNoticeAutoWidths(salesTables, wrap);
    if(royTables.length) applyNoticeAutoWidths(royTables, wrap);

    await new Promise(r=>requestAnimationFrame(r));
    const rect = wrap.getBoundingClientRect();
    const canvas = await html2canvas(wrap, {
      backgroundColor:'#F3F4F7',
      scale:2,
      useCORS:true,
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
      windowWidth: Math.ceil(rect.width),
      windowHeight: Math.ceil(rect.height),
      scrollX: 0, scrollY: 0, x: 0, y: 0
    });
    document.body.removeChild(wrap);

    canvas.toBlob(async (blob)=>{
      try{
        await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);
        showToast(`${activeNoticeLabel()} 이미지를 복사했어요 — 카카오톡 대화창에 Ctrl+V로 붙여넣으세요.`);
      }catch(err){
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${activeNoticeLabel()}_${document.getElementById('noticeDate').value}.png`;
        a.click(); URL.revokeObjectURL(url);
        showToast('이 브라우저는 클립보드 복사가 안 되어 이미지로 다운로드했어요.');
      }
      btn.textContent = original;
    }, 'image/png');
  }catch(e){
    console.error(e);
    showToast('이미지 생성에 실패했어요.');
    btn.textContent = original;
  }
}
document.getElementById('copyImgBtn').addEventListener('click', copyNoticeAsImage);

/* ---------- 매출성과분석표 ---------- */
function renderAnalysis(){
  const brandTotals = {}; BRANDS.forEach(b=>brandTotals[b]=0);
  STORES.forEach(s=>{ brandTotals[s.brand] += metricsFor(s.name,'당월누적')?.sales||0; });

  if(typeof Chart === 'undefined'){
    document.getElementById('brandPie').replaceWith(Object.assign(document.createElement('div'),{style:'padding:30px;text-align:center;color:var(--muted);font-size:12.5px',textContent:'차트 라이브러리(Chart.js)를 불러오지 못했어요.'}));
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
    if(e.target.closest('.detail-btn')) return;
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

/* ---------- 매출 데이터 입력 ---------- */
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
  requestAnimationFrame(()=>{
    setupExcelResize(grid, 'entry-'+schemaKey);
  });
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
      if(!text.includes('\t') && !text.includes('\n')) return;
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

  const aliasKey = Object.keys(STORE_ALIASES).find(k => normalizeName(k) === normalizeName(trimmed));
  if(aliasKey){
    const canonical = STORE_ALIASES[aliasKey];
    const hit = candidates.find(s=>s.name===canonical);
    if(hit) return hit;
  }

  let hit = candidates.find(s=>s.name === trimmed);
  if(hit) return hit;

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
    showToast('저장했어요.');
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

function tickClock(){
  const d = new Date(); const days=['일','월','화','수','목','금','토'];
  document.getElementById('clock').textContent =
    `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} · ${days[d.getDay()]}요일 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
tickClock(); setInterval(tickClock, 1000*30);

/* ---------- 가맹점 정보 관리 ---------- */
const ADMIN_FIELDS = [
  ['brand','브랜드','select'], ['region','지역','text'], ['type','가맹점/직영점','select'],
  ['pos','사용 포스','select'], ['owner','대표자명','text'],
  ['bizNo','사업자번호','text'], ['address','소재지 주소','text'],
  ['royaltyPct','로열티(%)','number'], ['royaltyFixed','정액 로열티(원)','number'],
  ['opened','사업개시일','text'], ['area','평수','number'], ['rent','월 임대료(만원)','number'],
];
let adminQuery = '';
function renderAdmin(){
  const list = STORES.filter(s=>!adminQuery || s.name.includes(adminQuery));
  const grid = document.getElementById('adminGrid');
  grid.innerHTML = `
    <thead><tr><th>매장명</th>${ADMIN_FIELDS.map(f=>`<th>${f[1]}</th>`).join('')}<th>관리</th></tr></thead>
    <tbody>${list.map(s=>`
      <tr data-id="${s.id}">
        <td><input type="text" data-field="short" value="${s.short}" style="text-align:left;font-weight:600;"></td>
        ${ADMIN_FIELDS.map(([key,label,type])=>{
          if(key==='type'){
            return `<td><select data-field="type" style="width:100%;height:100%;border:none;padding:6px 8px;">
              <option value="가맹점" ${s.type==='가맹점'?'selected':''}>가맹점</option>
              <option value="직영점" ${s.type==='직영점'?'selected':''}>직영점</option>
            </select></td>`;
          }
          if(key==='brand'){
            return `<td><select data-field="brand" style="width:100%;height:100%;border:none;padding:6px 8px;">
              ${BRANDS.map(b=>`<option value="${b}" ${s.brand===b?'selected':''}>${b}</option>`).join('')}
            </select></td>`;
          }
          if(key==='pos'){
            return `<td><select data-field="pos" style="width:100%;height:100%;border:none;padding:6px 8px;">
              ${POS_LIST.map(p=>`<option value="${p}" ${s.pos===p?'selected':''}>${p}</option>`).join('')}
            </select></td>`;
          }
          if(key==='royaltyPct'){
            const v = s.royalty ? +(s.royalty*100).toFixed(2) : '';
            return `<td><input type="number" step="0.1" data-field="royaltyPct" value="${v}" placeholder="정률(%)"></td>`;
          }
          if(key==='royaltyFixed'){
            return `<td><input type="number" data-field="royaltyFixed" value="${s.royaltyFixed ?? ''}" placeholder="정액이면 입력"></td>`;
          }
          const val = s[key] ?? '';
          const isText = type==='text';
          return `<td><input type="${type}" data-field="${key}" value="${val}" style="${isText?'text-align:left;':''}"></td>`;
        }).join('')}
        <td><button class="btn ghost small admin-del" data-id="${s.id}">삭제</button></td>
      </tr>`).join('')}</tbody>`;
  requestAnimationFrame(()=>{
    setupExcelResize(grid, 'admin');
  });
  document.querySelectorAll('.admin-del').forEach(b=>b.addEventListener('click', ()=>{
    const id = +b.dataset.id;
    const store = STORES.find(s=>s.id===id);
    if(!store) return;
    if(!confirm(`"${store.name}" 지점을 삭제할까요?`)) return;
    const idx = STORES.findIndex(s=>s.id===id);
    if(idx>=0) STORES.splice(idx,1);
    PERIODS.forEach(p=>{ if(SALES[p]) delete SALES[p][store.name]; });
    saveStores(STORES);
    saveSales(SALES);
    showToast(`"${store.name}" 지점을 삭제했어요.`);
    renderAll();
  }));
}
document.getElementById('adminSearch').addEventListener('input', e=>{ adminQuery=e.target.value.trim(); renderAdmin(); });
document.getElementById('adminAddBtn').addEventListener('click', ()=>{
  const brand = BRANDS[0];
  let short = '새매장', n=1;
  while(STORES.some(s=>s.name===`${brand}(${short})`)){ n++; short = `새매장${n}`; }
  const id = nextStoreId();
  STORES.push({
    id, brand, name:`${brand}(${short})`, short, region:'', pos:POS_LIST[0],
    type:'가맹점', owner:'', bizNo:'', address:'',
    area:0, rent:0, royalty:0, royaltyFixed:null, opened:'',
  });
  saveStores(STORES);
  adminQuery = '';
  document.getElementById('adminSearch').value = '';
  renderAdmin();
  const row = document.querySelector(`#adminGrid tr[data-id="${id}"]`);
  if(row){ row.scrollIntoView({block:'center'}); row.querySelector('[data-field="short"]').focus(); }
  showToast('새 지점을 추가했어요.');
});
document.getElementById('adminSaveBtn').addEventListener('click', ()=>{
  document.querySelectorAll('#adminGrid tbody tr').forEach(row=>{
    const id = +row.dataset.id;
    const liveStore = STORES.find(s=>s.id===id);
    if(!liveStore) return;
    const oldName = liveStore.name;
    row.querySelectorAll('[data-field]').forEach(el=>{
      const f = el.dataset.field;
      if(f==='royaltyPct'){
        liveStore.royalty = el.value==='' ? 0 : +el.value/100;
      }else if(f==='royaltyFixed'){
        liveStore.royaltyFixed = el.value==='' ? null : +el.value;
      }else if(el.tagName==='SELECT'){
        liveStore[f] = el.value;
      }else if(el.type==='number'){
        liveStore[f] = el.value==='' ? 0 : +el.value;
      }else{
        liveStore[f] = el.value;
      }
    });
    liveStore.name = `${liveStore.brand}(${liveStore.short})`;
    if(liveStore.name !== oldName){
      PERIODS.forEach(p=>{
        if(SALES[p] && SALES[p][oldName]!==undefined){
          SALES[p][liveStore.name] = SALES[p][oldName];
          delete SALES[p][oldName];
        }
      });
    }
  });
  saveStores(STORES);
  saveSales(SALES);
  showToast('가맹점 정보를 저장했어요.');
  renderAll();
});

/* ---------- 마감장표 업로드 ---------- */
function loadArchives(){
  const raw = localStorage.getItem('yfp_archives');
  if(raw){ try{ return JSON.parse(raw); }catch(e){} }
  return {};
}
function saveArchives(a){ localStorage.setItem('yfp_archives', JSON.stringify(a)); }
let ARCHIVES = loadArchives();

function syncPrevMonthFromArchives(){
  const months = Object.keys(ARCHIVES).sort();
  const latest = months[months.length-1];
  if(!latest) return;
  const brands = ARCHIVES[latest].parsed?.brands || {};
  let matched = 0;
  Object.values(brands).forEach(rows=>{
    rows.forEach(row=>{
      const store = STORES.find(s=>s.name===row.name);
      if(!store || row.curSales==null) return;
      const schema = POS_SCHEMA[store.pos];
      SALES['전월'][store.name] = {
        ...(SALES['전월'][store.name]||{}),
        [schema.sales]: row.curSales,
        [schema.receipts]: row.receipts,
      };
      matched++;
    });
  });
  if(matched) saveSales(SALES);
}
syncPrevMonthFromArchives();

function renderArchiveList(){
  const months = Object.keys(ARCHIVES).sort().reverse();
  document.getElementById('archiveList').innerHTML = months.length ? months.map(m=>{
    const a = ARCHIVES[m];
    return `<tr>
      <td class="txt" style="font-weight:600">${m}</td>
      <td class="txt">${a.fileName}</td>
      <td class="txt" style="font-size:11.5px;color:var(--muted)">${new Date(a.uploadedAt).toLocaleString('ko-KR')} · 브랜드 ${Object.keys(a.parsed?.brands||{}).length}개 인식${(a.parsed?.skipped||[]).length ? ` · <span style="color:var(--up);font-weight:600">인식 실패 ${a.parsed.skipped.length}건</span>` : ''}</td>
      <td><button class="btn ghost small archive-del" data-month="${m}">삭제</button></td>
    </tr>`;
  }).join('') : `<tr><td colspan="4" class="txt" style="color:var(--muted)">아직 업로드된 마감장표가 없어요.</td></tr>`;
  document.querySelectorAll('.archive-del').forEach(b=>b.addEventListener('click', ()=>{
    if(!confirm(`${b.dataset.month} 마감장표를 삭제할까요?`)) return;
    delete ARCHIVES[b.dataset.month];
    saveArchives(ARCHIVES);
    syncPrevMonthFromArchives();
    renderArchiveList();
    populateNoticeMonthSelect();
  }));
}

document.getElementById('archiveUploadBtn').addEventListener('click', async ()=>{
  const month = document.getElementById('archiveMonth').value;
  const file = document.getElementById('archiveFile').files[0];
  if(!month){ showToast('먼저 해당 월을 선택해주세요.'); return; }
  if(!file){ showToast('업로드할 엑셀 파일을 선택해주세요.'); return; }
  if(typeof XLSX === 'undefined'){ showToast('엑셀 처리 라이브러리를 불러오지 못했어요.'); return; }
  const btn = document.getElementById('archiveUploadBtn');
  const original = btn.textContent; btn.textContent = '업로드 중…';
  try{
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type:'array', cellDates:true });
    const parsed = parseArchiveWorkbook(wb);
    const brandCount = Object.keys(parsed.brands).length;
    if(!brandCount){
      showToast('마감장표 형식을 인식하지 못했어요.');
      btn.textContent = original;
      return;
    }
    ARCHIVES[month] = { fileName:file.name, uploadedAt:Date.now(), parsed };
    saveArchives(ARCHIVES);
    syncPrevMonthFromArchives();
    renderArchiveList();
    populateNoticeMonthSelect();
    showToast(`${month} 마감장표를 저장했어요 (${brandCount}개 브랜드 인식됨).`);
    document.getElementById('archiveFile').value = '';
  }catch(e){
    console.error(e);
    showToast('파일을 읽는 데 실패했어요.');
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
