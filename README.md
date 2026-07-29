# 유림에퐁당 · 통합현황 대시보드

정적 파일 2개(`index.html`, `app.js`)로만 이루어진 순수 프론트엔드입니다.
빌드 과정이 필요 없어서 GitHub Pages에 그대로 올리면 바로 동작합니다.

## GitHub Pages로 배포하기

1. 새 저장소를 만들고 `index.html`, `app.js` 를 루트에 올립니다.
2. 저장소 **Settings → Pages** 에서 Source를 `main` 브랜치 / `root` 로 설정합니다.
3. 몇 분 뒤 `https://<계정명>.github.io/<저장소명>/` 으로 접속하면 됩니다.

기존 `유림에퐁당` 사이트(Railway) 안에 페이지 하나로 넣고 싶다면, 이 두 파일을
정적 파일 서빙 경로(`/public`, `/static` 등)에 넣고 라우팅만 연결하면 됩니다.

## 지금 상태 (중요)

- **데이터는 지금 이 브라우저의 localStorage에만 저장돼요.** 즉, 내가 입력한 값은
  내 컴퓨터/브라우저에서만 보이고, 다른 사람 화면이나 다른 기기에는 반영되지 않아요.
  지점 담당자가 각자 입력하고 본사가 한 화면에서 모아보는 "진짜 통합"이 되려면
  데이터를 **서버(데이터베이스)에 저장**하도록 바꿔야 해요.
- 매장 목록·초기 매출 수치는 예시 데이터예요. `app.js` 맨 위 `STORES` 배열을
  실제 지점 정보로 바꿔주세요.

## 다음 단계로 서버에 연결하려면

`app.js`에서 아래 두 함수만 API 호출로 바꾸면 됩니다. 나머지 화면 로직은 그대로 써도 됩니다.

```js
// 지금: localStorage에서 읽기
function loadSales(){ ... }

// 나중: 서버에서 읽기
async function loadSales(){
  const res = await fetch('/api/sales');
  return res.json();
}
```

```js
// 지금: localStorage에 쓰기
function saveSales(data){ localStorage.setItem(...) }

// 나중: 서버에 쓰기
async function saveSales(data){
  await fetch('/api/sales', { method:'POST', body: JSON.stringify(data) });
}
```

기존 유림에퐁당 사이트에 이미 로그인·DB가 있다면, 그 API에 맞춰 이 두 함수만
고치면 이 화면 그대로 실제 서비스에 붙일 수 있어요.

## 화면 구성

- **매출장표** — 전 지점 순위표 (당월누적/전일/토요일, 브랜드 필터)
- **매출성과분석표** — 브랜드별 매출 비중, 전월·전년동월 대비 (Chart.js)
- **매장별현황** — 지점 카드 + 클릭 시 상세(임대료·로열티·평당매출 등)
- **매출 데이터 입력** — 지점별 영업일수/영수건수/실매출액 입력 → 저장 즉시 다른 화면에 반영

## 커스터마이징 포인트

- 색상/폰트: `index.html` 상단 `<style>` 의 `:root` 변수
- 지점·브랜드·포스 매핑: `app.js` 상단 `BRAND_POS`, `STORES`
- 로열티율/평수/임대료: `STORES` 생성부 (현재는 예시 값이 랜덤 생성됨 — 실제 값으로 교체 필요)
