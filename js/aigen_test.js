/* =========================================================
   AIGEN TEST 퀴즈 스크립트
   v4 — 5문항 · 3지선다 · 문항별 가중치(정수 센트) · answers[] 기반 채점
   ========================================================= */

let questions = [];
let personas = {};
let introTraits = {};
let growthHints = {};

let currentIndex = 0;

// 문항별 가중치 (정수, 센트 단위 — 부동소수 동점 비교 버그 방지)
const WEIGHTS = [100, 106, 113, 121, 130];
const WEIGHTS_TOTAL = WEIGHTS.reduce((sum, w) => sum + w, 0); // 570

// answers[i] = i번째 문항에서 고른 유형 키 ('challenger' | 'achiever' | 'seeker')
// (v4 문서의 dare/achieve/seek 대신, 기존 HTML의 data-persona와 맞추기 위해 challenger/achiever/seeker 유지)
let answers = [];
let optionSnapshots = []; // 뒤로가기용: optionSnapshots[i] = i번째 문항에서 화면에 보였던 선택지 순서

let isAnimating = false; // 애니메이션 중 중복 클릭/뒤로가기 방지

const questionBox = document.getElementById('quizQuestion');
const progressText = document.getElementById('quizProgress');
const progressBarFill = document.getElementById('quizProgressBar'); // TODO: 실제 프로그레스 바 요소 id로 교체 (없으면 아무 동작 안 함)
const questionText = document.getElementById('quizQText');
const answerButtons = [...document.querySelectorAll('.quiz_answer')]; // HTML에서 3개로 구성되어야 함
const resultBox = document.getElementById('quizResult');
const prevButton = document.getElementById('quizPrev');

// 결과가 나왔을 때 같이 보여줄 하단 섹션들 (실제 클래스명 정해지면 여기만 수정)
const RESULT_SECTION_SELECTORS = ['.sec_banner', '.sec_who']; // TODO: 실제 클래스명으로 교체
const HERO_SELECTOR = '.scan-hero'; // TODO: 실제 클래스명으로 교체


// 배열 순서를 무작위로 섞는 함수 (답변 3개가 매번 다른 순서로 보이게 함, Fisher-Yates)
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}


// 이전 버튼 활성/비활성 상태 관리
function updatePrevButtonState() {
  if (!prevButton) return;
  prevButton.disabled = currentIndex === 0;
}


// 진행 상태 텍스트(01 / 05)와 프로그레스 바를 현재 위치에 맞게 갱신
function updateProgress() {
  progressText.textContent =
    `${currentIndex + 1}`.padStart(2, '0') + ' / ' + `${questions.length}`.padStart(2, '0');

  if (progressBarFill) {
    progressBarFill.style.width = `${((currentIndex + 1) / questions.length) * 100}%`;
  }
}


// 지금 순서(currentIndex)에 맞는 문항을 화면에 채워 넣는 함수
// snapshot이 있으면(=뒤로가기로 온 경우) 그 순서 그대로 복원, 없으면 새로 셔플
function showQuestion(snapshot) {
  const question = questions[currentIndex];
  const shuffledAnswers = snapshot || shuffle(question.answers);

  updateProgress();
  questionText.textContent = question.question;

  answerButtons.forEach((button, i) => {
    const answer = shuffledAnswers[i];
    button.querySelector('.answer_text').textContent = answer.text;
    button.dataset.axis = answer.axis;
    button.disabled = false;
    button.classList.remove('is-selected');
  });

  if (currentIndex > 0) questionText.focus({ preventScroll: true });
  updatePrevButtonState();
}


// 문항 전환 애니메이션: 페이드아웃이 끝나는 시점(transitionend)에 맞춰
// 콘텐츠를 바꾸고, 다시 페이드인 시킵니다. (240ms 기준)
function goToNextQuestion(renderNext) {
  const handleFadeOutEnd = (event) => {
    if (event.propertyName !== 'opacity') return;
    questionBox.removeEventListener('transitionend', handleFadeOutEnd);
    renderNext();
    questionBox.classList.remove('is-leaving');
  };
  questionBox.addEventListener('transitionend', handleFadeOutEnd);
  questionBox.classList.add('is-leaving');
}


// 답변 버튼을 클릭했을 때 실행: 선택 즉시 버튼 비활성화 → answers[]에 기록 → 다음 문항(또는 결과)으로 전환
function selectAnswer(button) {
  if (isAnimating) return;
  answerButtons.forEach((b) => (b.disabled = true));
  button.classList.add('is-selected');

  const axis = button.dataset.axis;

  // 뒤로가기를 위해, 지금 화면에 보였던 답변 순서를 문항 인덱스별로 저장
  optionSnapshots[currentIndex] = answerButtons.map((b) => ({
    text: b.querySelector('.answer_text').textContent,
    axis: b.dataset.axis,
  }));

  answers[currentIndex] = axis;
  currentIndex += 1;

  isAnimating = true;
  goToNextQuestion(() => {
    isAnimating = false;
    if (currentIndex < questions.length) {
      showQuestion();
    } else {
      showResult();
    }
  });
}


// 이전 버튼 클릭 시: 마지막 선택을 취소하고 그 문항을 그대로 복원
function goToPrevQuestion() {
  if (isAnimating || currentIndex === 0 || answers.length === 0) return;

  currentIndex -= 1;
  answers.length = currentIndex; // 마지막 선택 기록 제거
  const snapshot = optionSnapshots[currentIndex];

  isAnimating = true;
  goToNextQuestion(() => {
    isAnimating = false;
    showQuestion(snapshot); // 그때 봤던 순서 그대로 복원
  });
}


// 최대잉여법(Largest Remainder Method)으로 정수 퍼센트 합계를 정확히 100%로 맞추는 함수
// weighted: { challenger, achiever, seeker } 형태의 가중 총점(정수, 센트 단위), total: 가중치 합(570)
function largestRemainderPercent(weighted, keys, total) {
  const raw = keys.map((k) => (weighted[k] * 100) / total);
  const floored = raw.map((n) => Math.floor(n));

  const flooredSum = floored.reduce((a, b) => a + b, 0);
  const remainder = 100 - flooredSum;

  // 버려진 소수점(나머지)이 큰 순서대로 정렬해서, 모자란 만큼(remainder) 앞에서부터 1%씩 채워준다
  const order = keys
    .map((k, i) => ({ key: k, frac: raw[i] - floored[i] }))
    .sort((a, b) => b.frac - a.frac);

  const percent = {};
  keys.forEach((k, i) => (percent[k] = floored[i]));
  for (let i = 0; i < remainder; i++) {
    percent[order[i].key] += 1;
  }

  return percent;
}


// answers[] (문항별 선택 기록)을 바탕으로 채점하는 함수
// 동점이면 5번 문항(answers[4]) 선택 유형 우선 → 그래도 동점이면 3번 문항(answers[2]) 선택 유형 우선
function scoreResult(answersArr) {
  const keys = ['challenger', 'achiever', 'seeker'];
  const weighted = { challenger: 0, achiever: 0, seeker: 0 };
  answersArr.forEach((type, i) => (weighted[type] += WEIGHTS[i]));

  const maxScore = Math.max(...keys.map((k) => weighted[k]));
  let tied = keys.filter((k) => weighted[k] === maxScore);

  if (tied.length > 1) tied = tied.includes(answersArr[4]) ? [answersArr[4]] : tied; // 5번 문항 우선
  if (tied.length > 1) tied = tied.includes(answersArr[2]) ? [answersArr[2]] : tied; // 3번 문항 우선
  // tied.length가 여전히 1보다 크면 극히 드문 폴백: 고정 우선순위(탐구가>성취가>도전가)로 확정
  if (tied.length > 1) {
    const FALLBACK_ORDER = ['seeker', 'achiever', 'challenger'];
    tied = [FALLBACK_ORDER.find((k) => tied.includes(k))];
  }

  const mainType = tied[0];
  const ranked = keys.slice().sort((a, b) => weighted[b] - weighted[a]);
  const subType = ranked.find((k) => k !== mainType);

  const percent = largestRemainderPercent(weighted, keys, WEIGHTS_TOTAL);

  return { weighted, percent, mainType, subType };
}


// 성장 힌트: 가중 총점이 가장 낮은 유형 기준. 동점이면 고정 우선순위(탐구가>성취가>도전가)로 확정
// (v4 문서 §9-3: "고정 우선순위 하나만 정해두면 충분" — 구체적 순서는 미지정이라 위 기본 동점 규칙과 통일)
function getGrowthHintType(weighted) {
  const keys = ['challenger', 'achiever', 'seeker'];
  const minScore = Math.min(...keys.map((k) => weighted[k]));
  const tied = keys.filter((k) => weighted[k] === minScore);
  if (tied.length === 1) return tied[0];

  const FALLBACK_ORDER = ['seeker', 'achiever', 'challenger'];
  return FALLBACK_ORDER.find((k) => tied.includes(k));
}


// 결과가 나왔을 때 하단 섹션들(RESULT_SECTION_SELECTORS)을 보이거나 숨기는 함수
function toggleResultSections(show) {
  document.querySelectorAll(RESULT_SECTION_SELECTORS.join(',')).forEach((el) => {
    el.hidden = !show;
  });
  document.querySelector(HERO_SELECTOR)?.classList.toggle('has-result', show);
}


// 결과 화면을 채우는 함수: 유형 이름/설명/막대그래프/강한순간/조심할것/성장힌트 등을 화면에 표시
function fillResultScreen({ weighted, percent, mainType, subType }) {
  const mainPersona = personas[mainType];
  const subPersona = personas[subType];

  document.getElementById('resultName').textContent = mainPersona.name;
  document.getElementById('resultTag').textContent = mainPersona.tag;
  document.getElementById('resultLead').textContent = mainPersona.lead;

  // 부성향: weighted(가중 총점)가 0이면 문장 자체를 숨김
  document.getElementById('resultSecondary').textContent =
    weighted[subType] > 0 ? `${subPersona.name}(${percent[subType]}%) 기질도 함께 갖고 있어요` : '';

  document.querySelectorAll('.result_bar_row').forEach((row) => {
    const key = row.dataset.persona;
    row.classList.toggle('is-top', key === mainType);
    row.querySelector('.result_bar_fill').style.width = percent[key] + '%';
    row.querySelector('.bar_pct').textContent = percent[key] + '%';
  });

  // 본문(리드 아래 설명 2단락)
  document.getElementById('resultCopy1').textContent = mainPersona.body[0];
  document.getElementById('resultCopy2').textContent =
    weighted[subType] > 0
      ? `${mainPersona.name}의 성향이 가장 두드러지며, ${subPersona.trait} ${subPersona.name}의 성향(${percent[subType]}%)도 함께 가지고 있습니다.`
      : `${mainPersona.name}의 성향이 가장 두드러집니다.`;

  // 강한 순간 / 조심할 것 / 활동 예시 — 해당 요소가 있을 때만 채움(없으면 조용히 넘어감)
  const strongMomentEl = document.getElementById('resultStrongMoment');
  if (strongMomentEl) strongMomentEl.textContent = mainPersona.strongMoment || '';

  const cautionEl = document.getElementById('resultCaution');
  if (cautionEl) cautionEl.textContent = mainPersona.caution || '';

  const activityEl = document.getElementById('resultActivity');
  if (activityEl) activityEl.textContent = mainPersona.activityExamples || '';

  // 성장 힌트: 가중 총점이 가장 낮은 유형 기준
  const growthHintEl = document.getElementById('resultGrowthHint');
  if (growthHintEl) {
    const growthType = getGrowthHintType(weighted);
    growthHintEl.textContent = growthHints[growthType] || '';
  }

  document.getElementById('resultName').focus({ preventScroll: true });
}


// 결과 화면을 채점 → 표시까지 한 번에 처리
function showResult() {
  questionBox.hidden = true;
  resultBox.hidden = false;
  toggleResultSections(true);

  const result = scoreResult(answers);
  fillResultScreen(result);
}


// "다시 하기" 버튼 클릭 시: 점수/순서 초기화하고 첫 문항부터 다시 시작
function resetQuiz() {
  currentIndex = 0;
  answers = [];
  optionSnapshots = [];
  history.replaceState(null, '', location.pathname);

  resultBox.hidden = true;
  questionBox.hidden = false;
  toggleResultSections(false);
  showQuestion();
}


// 데이터(questions, personas, introTraits, growthHints)를 받아서 퀴즈를 실제로 시작시키는 함수.
// 버튼 이벤트 연결, 공유된 URL(?result=...)이 있으면 바로 결과 화면 표시
function startQuiz(data) {
  questions = data.questions;
  personas = data.personas;
  introTraits = data.introTraits;
  growthHints = data.growthHints;

  answerButtons.forEach((button) => {
    button.addEventListener('click', () => selectAnswer(button));
  });
  document.getElementById('testRetry').addEventListener('click', resetQuiz);
  prevButton?.addEventListener('click', goToPrevQuestion);

  // 공유 URL은 answers[] 5칸을 그대로 인코딩합니다 (예: ?result=challenger-seeker-challenger-achiever-challenger)
  // 원본 선택이 있어야 "5번→3번 우선" 동점 규칙까지 그대로 재현할 수 있기 때문입니다.
  const shared = new URLSearchParams(location.search).get('result');
  const validTokens = ['challenger', 'achiever', 'seeker'];
  const parsed = shared ? shared.split('-') : null;
  const isValidShare = parsed && parsed.length === 5 && parsed.every((t) => validTokens.includes(t));

  if (isValidShare) {
    showSharedResult(parsed);
  } else {
    showQuestion();
  }
}


// 공유 링크로 들어왔을 때: URL의 answers[]를 그대로 복원해서 scoreResult() 재사용, 결과 화면 표시
function showSharedResult(sharedAnswers) {
  answers = sharedAnswers;

  questionBox.hidden = true;
  resultBox.hidden = false;
  toggleResultSections(true);

  const result = scoreResult(answers);
  fillResultScreen(result);
}


/* =========================================================
   데이터 불러오기

   기본: json/main.json을 fetch로 불러옵니다. (로컬 서버 필요, file://는 안 됨)

   만약 로컬 서버 없이 file://로 바로 열어야 하는 상황이면:
   1) 아래 init() 안의 fetch 부분을 주석 처리
   2) 맨 아래 QUIZ_DATA_FALLBACK 블록의 주석 표시를 해제하고
      startQuiz(QUIZ_DATA_FALLBACK); 를 대신 호출하면 됩니다.
   ========================================================= */

async function init() {
  //  const response = await fetch('../json/main.json');
  //  const data = await response.json();
  //  startQuiz(data);

  //  ↓ fetch가 막히는 환경이면, 위 3줄을 주석 처리하고 아래 2줄을 살리세요.
  const data = QUIZ_DATA_FALLBACK;
  startQuiz(data);
}


/* =========================================================
   백업용 데이터 (평소엔 사용 안 함, 위 안내대로 필요할 때만 주석 해제)
   json/main.json과 내용이 완전히 동일해야 합니다.

   v4 문서 §1 문항 5개, §5 페르소나 콘텐츠, §5-1 INTRO_TRAITS, §6 성장힌트 반영.
   challenger=도전가, achiever=성취가, seeker=탐구가 (기존 HTML data-persona와 맞춤)
   ========================================================= */

const QUIZ_DATA_FALLBACK = {
  "questions": [
    {
      "question": "자주 가는 카페에서 주문 대기 순서를 알기 어려워 손님들이 직원에게 반복해서 묻습니다.\n모두 불편해하지만 익숙한 일처럼 넘깁니다.",
      "answers": [
        { "text": "직원에게 번호표나 대기 안내판을 한번 사용해보면 어떨지 바로 제안한다.", "axis": "challenger" },
        { "text": "언제 유독 붐비는지 살펴보고, 왜 대기 순서가 꼬이는지 원인부터 파악한다.", "axis": "seeker" },
        { "text": "손님과 직원이 모두 확인하기 쉬운 운영 방법을 정리해 제안한다.", "axis": "achiever" }
      ]
    },
    {
      "question": "친구들과 여행을 준비하는데 비용, 먹거리, 휴식 등 각자 우선순위가 달라\n오래 이야기해도 일정을 정하지 못합니다.",
      "answers": [
        { "text": "각자 원하는 것과 그 이유를 물어보고, 모두가 만족할 새로운 선택지를 찾아본다.", "axis": "seeker" },
        { "text": "일단 한 가지 일정을 정해 움직여보고, 문제가 생기면 그때 조정하자고 제안한다.", "axis": "challenger" },
        { "text": "예산과 이동 시간 등 공통 기준을 정하고, 그에 맞춰 일정과 역할을 확정한다.", "axis": "achiever" }
      ]
    },
    {
      "question": "곧 공개해야 할 행사 홍보 영상을 앞두고, 제작 경험이 없는 팀에\nAI 영상 도구를 활용해보자는 제안이 나왔습니다.",
      "answers": [
        { "text": "필요한 영상의 구성과 마감 일정을 정하고, 팀원별 작업을 관리한다.", "axis": "achiever" },
        { "text": "주요 도구의 특징과 사용법을 비교해보고, 목적에 맞는 도구를 선택한다.", "axis": "seeker" },
        { "text": "우선 도구를 열어 직접 만들어보고, 결과를 보면서 사용법을 익힌다.", "axis": "challenger" }
      ]
    },
    {
      "question": "오랫동안 준비한 공모전에서 탈락했지만 별도의 피드백이 없어\n무엇을 보완해야 할지 알기 어렵습니다.",
      "answers": [
        { "text": "수상작과 심사 기준을 살펴보며 우리 결과물이 탈락한 이유를 찾아본다.", "axis": "seeker" },
        { "text": "부족했던 점과 다음 목표를 정리하고, 역할을 정해 다음 공모전을 준비한다.", "axis": "achiever" },
        { "text": "이번 결과에 오래 머물기보다 새 아이디어로 다른 도전을 준비한다.", "axis": "challenger" }
      ]
    },
    {
      "question": "버려지는 물건을 필요한 사람과 연결하는 서비스를 떠올렸지만,\n실제 수요와 가능성은 아직 검증하지 못했습니다.",
      "answers": [
        { "text": "주변에게 바로 물어보고, 소수부터 직접 연결해보며 가능성을 확인한다.", "axis": "challenger" },
        { "text": "기존 서비스와 이용 사례를 조사해, 불편한 지점을 파악한다.", "axis": "seeker" },
        { "text": "누구를 위한 서비스인지 정한 뒤, 실행 단계를 구체적인 계획으로 만든다.", "axis": "achiever" }
      ]
    }
  ],
  "personas": {
    "challenger": {
      "name": "도전가",
      "tag": "DARE · ACT · GROW",
      "lead": "낯선 가능성에 먼저 뛰어드는 사람",
      "trait": "새로운 가능성에 먼저 뛰어드는",
      "body": [
        "불확실한 상황에서도 결과를 다 알기 전에 먼저 움직입니다. 익숙한 방식에 머무르기보다 새로운 가능성 쪽으로 한 걸음 먼저 나갑니다.",
        "이 성향은 아무도 답을 정해두지 않은 곳에서 가장 크게 빛납니다. 실패해도 거기서 멈추지 않고, 다시 다른 방식으로 도전하며 앞으로 나갑니다."
      ],
      "strongMoment": "정답이 없어서 다들 망설일 때",
      "caution": "도전이 많아지는 만큼 벌여놓은 것도 쌓입니다. 끝까지 가져갈 것과 아닌 것을 가끔 정리해두면 좋습니다.",
      "activityExamples": "GitHub·Kaggle 등 AI 개발 활동 · ROBLOX 등 게임·창작 플랫폼 활동 · 해커톤·메이커 활동"
    },
    "achiever": {
      "name": "성취가",
      "tag": "AIM · ACT · ACHIEVE",
      "lead": "목표를 끝까지 현실로 만드는 사람",
      "trait": "목표를 끝까지 완성하는",
      "body": [
        "목표와 우선순위를 명확히 정합니다. 실행 과정과 역할을 구체적으로 설계합니다.",
        "시작한 일을 끝까지 완성합니다."
      ],
      "strongMoment": "", // TODO: v3 §5 원문 확인 필요
      "caution": "", // TODO: v3 §5 원문 확인 필요
      "activityExamples": "" // TODO: v3 §5 원문 확인 필요
    },
    "seeker": {
      "name": "탐구가",
      "tag": "ASK · EXPLORE · GO DEEP",
      "lead": "질문을 깊이 파고드는 사람",
      "trait": "질문의 본질을 깊이 파고드는",
      "body": [
        "표면적인 답에서 멈추지 않고 그 뒤에 있는 이유와 맥락을 이해하려 합니다.\n다른 사람이 지나친 질문 하나를 붙잡고 문제의 본질에 닿을 때까지 깊이 탐색합니다.",
        "문제의 표면보다 본질을 깊이 탐색합니다."
      ],
      "strongMoment": "", // TODO: v3 §5 원문 확인 필요
      "caution": "", // TODO: v3 §5 원문 확인 필요
      "activityExamples": "" // TODO: v3 §5 원문 확인 필요
    }
  },
  // 결과 화면 하단 3분할 소개 섹션 전용 콘텐츠 (메인 결과화면 lead와는 의도적으로 다른 문구, §5-1)
  "introTraits": {
    "challenger": {
      "name": "도전가",
      "tag": "DARE · ACT · GROW",
      "definition": "낯선 가능성에 먼저 뛰어드는 사람",
      "traits": [
        "불확실해도 작은 행동부터 시작합니다.",
        "익숙한 방식보다 새로운 가능성을 선택합니다.",
        "실패에 머무르지 않고 다시 도전합니다."
      ]
    },
    "achiever": {
      "name": "성취가",
      "tag": "AIM · ACT · ACHIEVE",
      "definition": "목표를 결과로 완성하는 사람",
      "traits": [
        "목표와 우선순위를 명확히 정합니다.",
        "실행 과정과 역할을 구체적으로 설계합니다.",
        "시작한 일을 끝까지 완성합니다."
      ]
    },
    "seeker": {
      "name": "탐구가",
      "tag": "ASK · EXPLORE · GO DEEP",
      "definition": "질문을 깊게 파고드는 사람",
      "traits": [
        "익숙한 것에도 '왜?'라는 질문을 던집니다.",
        "다양한 관점과 근거를 비교합니다.",
        "문제의 표면보다 본질을 깊이 탐색합니다."
      ]
    }
  },
  // 성장 힌트: 가중 총점이 가장 낮은 유형 기준으로 노출
  "growthHints": {
    "challenger": "머릿속 생각에 머물지 말고 한 번 먼저 움직여보면, 그 다음이 훨씬 빨라집니다",
    "achiever": "작은 목표라도 끝까지 밀고 나가보면, 그 다음이 훨씬 선명해집니다",
    "seeker": "한 번만 더 본질을 물어보면, 지금 하는 일이 훨씬 선명해집니다"
  }
};

init();


function initWhoCardTap() {
  const cards = document.querySelectorAll('.sec_who .who_list > li');

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      card.classList.add('is-tapped');
      setTimeout(() => {
        card.classList.remove('is-tapped');
      }, 300);
    });
  });
}
initWhoCardTap();
