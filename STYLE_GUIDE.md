# SK AIGEN 퍼블리싱 스타일 가이드

`D:\project\skaigen` 프로젝트에서 쓰는 폴더 구조, HTML·CSS·JS 작성 규칙, 반응형 기준, 글꼴·색상, Figma 작업 규칙을 정리한 문서입니다.
새 페이지를 만들거나 다른 작업물을 아이젠 방식으로 바꿀 때 이 기준을 따릅니다.

---

## 1. 폴더 구조

```
skaigen/
├── index.html              메인 (루트에 위치, 경로는 ./)
├── project/                서브 페이지 (경로는 ../)
│   ├── about.html
│   ├── journey.html
│   ├── support.html
│   └── discover.html
├── css/
│   ├── reset.css           글꼴 선언, 리셋, rem 기준, pc_show / mo_show
│   ├── common.css          wrap·inner, 헤더, 하단 배너, 푸터, 팝업 (공통)
│   └── pages/
│       ├── main.css        페이지마다 1개 (index → main.css)
│       ├── about.css
│       └── ...
├── js/
│   ├── common.js           헤더 모바일 메뉴, 팝업 (공통)
│   └── about.js ...        페이지별 스크립트
├── img/                    이미지 (사진은 .webp, 아이콘·로고는 .svg)
└── font/                   PretendardVariable.woff2, Blinker-Regular/SemiBold.woff2
```

- 페이지마다 CSS·JS 파일을 하나씩 둡니다. 공통 요소는 `common.css` / `common.js`에만 둡니다.
- 백업은 `파일명(back_up).html`처럼 괄호를 붙여 따로 둡니다. 실제 작업 파일에서는 참조하지 않습니다.
- 줄바꿈 형식은 **CRLF**입니다. 편집기나 스크립트가 LF로 바꾸지 않게 주의합니다.

---

## 2. HTML 규칙

### 2-1. head

```html
<!DOCTYPE html>
<html lang="kr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SK AIGEN 소개 | 나만의 길을 만드는 도전</title>
    <meta name="description" content="페이지 설명 (120자 안팎)">
	<!-- Google Tag Manager --> ... <!-- End Google Tag Manager -->
	<!-- OG 공유 이미지 : 도메인 확정 후 주석 해제 (og:url, og:image는 절대 경로 필수) -->
	<link rel="icon" href="../img/favicon.ico" type="image/png">
    <link rel="stylesheet" href="../css/reset.css">
    <link rel="stylesheet" href="../css/common.css">
    <link rel="stylesheet" href="../css/pages/about.css">
</head>
```

- CSS 순서는 `reset.css` → `common.css` → `pages/페이지.css`입니다.
- `title`은 `SK AIGEN ○○ | 한 줄 설명` 형식입니다.
- OG 태그는 주석 블록으로 미리 넣어 두었습니다. 도메인이 정해지면 `https://도메인`을 바꾸고 주석을 풉니다. 공유 이미지는 `img/og_image.jpg`입니다.

### 2-2. body 기본 골격

```html
<body>
    <div class="wrap">
		<!-- header -->
		<header class="header"> ... </header>

		<!-- sec_kv -->
		<section class="sec_kv"> ... </section>

		<!-- sec_about -->
		<section class="sec_about">
			<div class="inner_1920">
				<div class="title_box">
					<span class="eyebrow font_en">WHAT IS SK AIGEN?</span>
					<h2>제목 <br class="mo_show">줄바꿈</h2>
					<p class="sub_txt">설명 문구</p>
				</div>
				...
			</div>
		</section>

		<!-- sec_banner -->
		<section class="sec_banner"> ... </section>

		<!-- sec_footer -->
		<footer class="footer"> ... </footer>

		<div class="popup" data-popup="temp" role="dialog" aria-hidden="true"> ... </div>
    </div>
	<script src="../js/common.js"></script>
	<script src="../js/about.js"></script>
</body>
```

- 전체를 `<div class="wrap">`으로 감쌉니다.
- 섹션은 `<section class="sec_이름">`이고, 바로 위에 `<!-- sec_이름 -->` 이름표 주석을 답니다.
- 섹션 안 내용은 항상 `<div class="inner_1920">` 안에 넣습니다.
- 들여쓰기는 **탭**입니다.

### 2-3. 클래스 이름 규칙

- 소문자와 **밑줄(`_`)** 을 씁니다. 하이픈(`-`)은 쓰지 않습니다.
- 섹션 접두어는 `sec_`입니다. 예: `sec_kv`, `sec_history`, `sec_what`, `sec_compare`, `sec_message`, `sec_offline`, `sec_faq`, `sec_banner`
- 자주 쓰는 공통 이름은 아래와 같습니다.

| 클래스 | 용도 |
|---|---|
| `inner_1920` | 내용 영역 (최대 1920, 좌우 120px 여백) |
| `title_box` | 섹션 제목 묶음 (eyebrow + h2 + sub_txt) |
| `eyebrow` | 제목 위 영문 라벨. `font_en`과 함께 씀 |
| `sub_txt` | 제목 아래 설명 문구 |
| `txt_box` | 텍스트 묶음 |
| `img_box` | 이미지를 감싸는 칸 (`position:relative; display:block; width:100%`) |
| `bg_box` | 섹션 배경 이미지 (`<picture class="bg_box">`) |
| `btn_apply`, `btn_dark`, `btn_blue` | 버튼 |
| `ico_xxx` | 아이콘 (`ico_arrow`, `ico_plus` 등) |
| `point_blue02` | 파란 강조 글자 (#155DFC) |
| `point_blue`, `point_pink` | 강조 글자 (#1447E6, #FF466E) |
| `font_en` | 영문 글꼴(Blinker) 적용 |
| `pc_show` / `mo_show` | PC에서만 / 모바일에서만 보이기 |
| `blind` | 화면에는 안 보이고 스크린리더만 읽는 텍스트 |
| `is-active`, `open`, `is-open` | JS가 붙이는 상태 클래스 |

### 2-4. 줄바꿈

- PC 줄바꿈과 모바일 줄바꿈은 따로 겁니다.
  - `<br class="pc_show">`: PC에서만 줄바꿈
  - `<br class="mo_show">`: 모바일에서만 줄바꿈
  - `<br>`: 둘 다 줄바꿈
- 줄바꿈 위치는 PC는 PC Figma, 모바일은 모바일 Figma 기준입니다.

### 2-5. 이미지

```html
<picture class="bg_box">
	<source srcset="../img/about_kv_mo.webp" media="(max-width: 768px)">
	<source srcset="../img/about_kv_pc.webp" media="(min-width: 769px)">
	<img src="../img/about_kv_pc.webp" alt="">
</picture>
```

- 사진은 **webp**로 넣습니다. PC·모바일 이미지를 `_pc` / `_mo`로 나눕니다.
- 파일 이름은 `페이지_용도_pc/mo.webp` 형식입니다. 예: `about_what_pc.webp`, `main_kv_mo.webp`
- 아이콘·로고는 svg로 넣습니다.
- 꾸밈용 이미지는 `alt=""`로 비웁니다.

### 2-6. 주석

- 남기는 주석: 섹션 이름표(`<!-- sec_xxx -->`), GTM 시작·끝, OG 블록, 구조 설명용 짧은 주석
- 지우는 주석: 주석으로 막아 둔 옛 코드. 다시 쓸 일이 있으면 git 기록에서 찾습니다.
- 임시로 숨길 때는 이유를 같이 적습니다. 예: `<!-- 피그마에서 DISCOVER 메뉴 제외 <a ...>DISCOVER</a> -->`

---

## 3. CSS 규칙

### 3-1. 작성 형식

- 규칙 하나를 **한 줄**에 씁니다.
- 선택자는 섹션 클래스부터 시작합니다. 다른 섹션과 충돌하지 않게 하기 위해서입니다.
- 색상은 **대문자 HEX**로 씁니다. 예: `#155DFC`
- 섹션마다 `/* sec_이름 */` 주석으로 구분합니다.
- 파일 구성은 `/* PC */` 규칙을 먼저 쓰고, 맨 아래에 `/* MOBILE */` 블록 하나를 둡니다.

```css
/* PC */
/* sec_what */
.sec_what {padding:12rem 0; background-color:#F9FAFB;}
.sec_what .title_box h2 {padding-bottom:1.6rem; font-size:7.2rem; font-weight:800; line-height:1.3; letter-spacing:-0.36rem;}

/* MOBILE */
/* SIZE 360 기준 */
@media all and (max-width:768px) {
	/* sec_what */
	.sec_what {padding:6rem 0;}
	.sec_what .title_box h2 {font-size:4rem;}
}
```

### 3-2. 단위와 반응형 기준

- 모든 크기는 **rem**으로 씁니다. **1rem = 10px**이라 Figma 수치를 그대로 ÷10 하면 됩니다. 예: 48px → `4.8rem`
- 예외: 테두리 `1px`, 자간 `em`, 줄간격은 단위 없이(`1.5`)
- 화면 크기에 따른 rem 기준은 `reset.css`에 정해져 있습니다.

| 화면 폭 | 1rem | 기준 디자인 |
|---|---|---|
| 1681px 이상 | 10px 고정 | PC Figma (1920) |
| 769 ~ 1680px | 화면 폭 ÷ 168 | PC 화면 전체가 1680 비율로 함께 줄어듦 |
| 768px 이하 | 화면 폭 ÷ 36 | 모바일 Figma (360) |

- 반응형 구간은 **PC / 모바일(768px)** 두 개뿐입니다. 중간 구간(1240, 1024 등)은 만들지 않습니다. 769~1680은 rem이 알아서 줄어듭니다.
- 모바일 블록 안에서는 PC와 달라지는 값만 덮어씁니다.
- PC 값을 바꿨는데 모바일 블록에 그 속성이 없으면 모바일도 같이 바뀝니다. 이때는 모바일 블록에 기존 값을 다시 적어 둡니다.

### 3-3. 내용 영역(inner)

```css
.wrap .inner_1920 {width:100%; max-width:192rem; margin:0 auto; padding:0 12rem;}
/* 모바일 */
.wrap .inner_1920 {max-width:100%; padding:0 2rem;}
```

- 1920 화면 기준 좌우 120px 여백, 내용 폭 1680px입니다.
- Figma에서 내용 폭이 더 좁은 섹션은 그 섹션에만 `max-width`를 지정합니다. 내용 1280px이면 `max-width:152rem`입니다(1520 − 좌우 120×2 = 1280).
- `inner_1920` 안에서 `position:absolute`로 놓는 요소는 inner의 바깥 테두리 기준입니다. 패딩을 포함한 위치(예: 왼쪽 120px이면 `left:12rem`)로 잡습니다.

### 3-4. 글꼴

```css
/* reset.css */
html, body {font-family:"Pretendard Variable", sans-serif; color:#030712;}
/* common.css */
.font_en {font-family:"Blinker", "Pretendard Variable", sans-serif;}
```

| 글꼴 | 용도 | 굵기 |
|---|---|---|
| Pretendard Variable | 한글·기본 | 400 / 500 / 600 / 700 / 800 |
| Blinker | 영문 라벨(eyebrow), 메뉴, 영문 큰 제목 | 400 / 600 |

### 3-5. 글자 크기 (Figma 텍스트 스타일 기준)

| 스타일 | PC | 모바일 | 줄간격 | 자간 |
|---|---|---|---|---|
| Display (영문) | 64px | 36px | 1 | 0 |
| Headline 1 | 48px | 30px | 1.2~1.3 | -0.025em |
| Headline 2 | 40px | 28px | 1.2 | -0.025em |
| Headline 3 | 32px | 24px | 1.2 | -0.025em |
| Headline 4 | 24px | 20px | 1.5 | -0.025em |
| Body XL | 20~22px | 18px | 1.5~1.6 | -0.025em |
| Body L | 18~20px | 16px | 1.6 | -0.025em |
| Body M | 16~18px | 16px | 1.6 | -0.025em |
| Body S | 14px | 14px | 1.6 | -0.025em |
| Label (영문 eyebrow) | 16px | 14px | 1 | 0.1em |

- 한글 자간은 `-.025em`(Figma -2.5%)으로 통일합니다. 영문 라벨은 `.1em`(Figma 10%)입니다.
- 모바일 크기는 Figma 코드값보다 **텍스트 스타일의 모바일 값**을 믿습니다. Figma 코드에는 PC 값이 섞여 나오는 경우가 있습니다. 확실하지 않으면 레이어 높이로 계산합니다(높이 = 글자 크기 × 줄간격 × 줄 수).

### 3-6. 색상

| 이름 | 값 | 주 용도 |
|---|---|---|
| 기본 글자 | `#030712` | 본문 기본색 (reset.css) |
| 제목 진한 글자 | `#151515`, `#0F172A` | 일부 제목 |
| 본문 회색 | `#364153` | 설명 문구 |
| 보조 회색 | `#4A5565`, `#64748B` | 보조 설명 |
| 캡션 | `#99A1AF` | 캡션, 주석, 저작권 |
| 메인 파랑 | `#155DFC` | 버튼, 강조, 라벨 |
| 진한 파랑 | `#193CB8` | 파란 배경 섹션, 강조 카드 |
| 파랑 강조2 | `#1447E6` | `point_blue` |
| 핑크 | `#FF466E` | `point_pink` |
| 연파랑 배경 | `#EFF6FF`, `#E6F1FF` | KV·섹션 배경 |
| 연회색 배경 | `#F9FAFB` | 섹션 배경 |
| 구분선 | `#D1D5DB`, `#E5E7EB` | 테두리, 구분선 |
| 카드 테두리 | `#BEDBFF` | journey 카드 |
| 푸터 배경 | `#101828` | 푸터 |
| 푸터 구분선 | `#4A5565` | 푸터 |

### 3-7. 공통 영역 (common.css)

| 영역 | PC | 모바일 |
|---|---|---|
| 헤더 | 높이 70px, `position:sticky`, 흰 배경, 메뉴 24px(Blinker), APPLY 버튼 16px | 높이 60px, 햄버거 메뉴 + 드롭다운 |
| 하단 배너 | `sec_banner`, APPLY NOW 버튼 | |
| 푸터 | 배경 #101828, 위아래 60px, 문의처 20px·이메일 18px·하단 14px | 위아래 36px, 하단 12px |
| 팝업 | `.popup`, 딤 rgba(0,0,0,.3) + blur(10px), 최대 폭 480px | 안쪽 여백 축소 |

---

## 4. JS 규칙

- 바닐라 JS만 씁니다. 라이브러리(jQuery 등)는 쓰지 않습니다.
- 공통 기능은 `common.js`에 함수로 만들고(`initHeaderToggle()`, `initPopup()`), 페이지 기능은 `페이지.js`에 둡니다.
- 요소가 없는 페이지에서도 오류가 나지 않게, 요소를 찾고 없으면 바로 `return` 합니다.
- 뒤로가기로 돌아온 페이지에서도 메뉴·팝업이 열린 채 남지 않게 초기화합니다.

### 4-1. 팝업 연결 방법

HTML 속성만으로 연결합니다. JS를 따로 쓸 필요가 없습니다.

```html
<!-- 여는 버튼: 어떤 요소든 data-popup-open="이름" -->
<a href="#" data-popup-open="temp" class="btn_apply">APPLY NOW</a>

<!-- 팝업 본체 -->
<div class="popup" data-popup="temp" role="dialog" aria-hidden="true">
	<div class="popup_dim" data-popup-close></div>
	<div class="popup_inner">
		<button type="button" class="btn_popup_close" data-popup-close><span class="blind">팝업 닫기</span></button>
		<div class="popup_content">
			<h2 class="popup_title">현재는 모집기간이 아닙니다</h2>
			<p class="popup_txt">...</p>
			<button type="button" class="btn_popup_confirm" data-popup-close>확인</button>
		</div>
	</div>
</div>
```

- 닫기는 `data-popup-close`가 붙은 요소(X 버튼, 딤, 확인 버튼)를 누르거나 ESC 키를 누르면 됩니다.
- 열려 있는 동안 `body`에 `is-popup-open`, 팝업에 `is-active`가 붙습니다.
- 팝업이 열리면 본문(`.wrap`)을 그 자리에 고정해 배경 스크롤을 막습니다. 스크롤바가 사라진 자리는 섹션 배경을 늘려 채우고, 닫으면 원래 스크롤 위치로 돌아갑니다.

### 4-2. 아코디언

- FAQ 등은 `data-mode="single"`(하나만 열림) / `"multiple"`(여러 개 열림) 속성으로 동작 방식을 바꿉니다.

---

## 5. Figma 작업 규칙

- **파일**: `Jw1eI1f9RwU9nIfV69Oblw`. 최신 디자인은 날짜 이름 섹션(예: `261007`) 안의 `PC page` / `Mo page`에 있습니다.
- **비교 항목**: 섹션마다 문구, 줄바꿈, 글꼴, 글자 크기·굵기·색, 줄간격, 자간, 여백·간격, 배경색, 테두리, 투명도, 숨김 레이어, 이미지·아이콘 크기를 하나씩 비교합니다.
- **문구**: PC와 모바일 Figma 문구가 다르면 **PC 문구로 통일**하고 다른 부분은 따로 기록합니다.
- **줄바꿈**: PC는 PC Figma, 모바일은 모바일 Figma 위치에 맞춥니다.
- **숨김 레이어**: Figma에서 숨긴 레이어는 화면에 넣지 않습니다.
- **공통 영역**: 헤더·하단 배너·푸터·팝업은 모든 페이지에 같은 마크업으로 들어갑니다. 고치면 다섯 페이지에 똑같이 반영합니다.
- **이미지**: Figma에서 이미지를 받아 쓰지 않습니다. 바뀐 이미지는 디자이너가 webp로 넣습니다.

---

## 6. 확인 체크리스트

- [ ] 1920 / 1440 / 1024 / 768 / 360px에서 가로 스크롤이 생기지 않는다
- [ ] 콘솔 오류가 없다
- [ ] 헤더 모바일 메뉴가 열리고 닫힌다
- [ ] 팝업이 열리고 X·딤·확인·ESC로 닫힌다. 열린 동안 배경이 스크롤되지 않는다
- [ ] PC 수정이 모바일 화면을 바꾸지 않았다
- [ ] 이미지 경로가 모두 존재하는 파일을 가리킨다 (webp)
- [ ] 파일 줄바꿈 형식이 CRLF로 유지됐다
