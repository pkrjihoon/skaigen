/* =========================================================
   AIGEN TEST 퀴즈 스크립트
   7문항 · 3지선다 · 문항별 가중치 적용 버전
   ========================================================= */

let questions = [];
let personas = {};

let currentIndex = 0;

// 3가지 유형(축)의 점수를 저장. 가중치가 적용되므로 소수점 값이 됩니다.
const score = { challenger: 0, achiever: 0, seeker: 0 };

// 문항별 가중치 (판별력이 높은 문항일수록 값이 큼)
// ⚠️ 임의로 확장한 값입니다. 실제 기획 확정값으로 교체해주세요.
const QUESTION_WEIGHTS = [1.00, 1.06, 1.13, 1.21, 1.30, 1.40, 1.51];

let answerHistory = []; // 뒤로가기용: 각 문항에서 선택했던 axis / 가중치 / 화면 순서 기록
let isAnimating = false; // 애니메이션 중 중복 클릭/뒤로가기 방지

const questionBox = document.getElementById('quizQuestion');
const progressText = document.getElementById('quizProgress');
const questionText = document.getElementById('quizQText');
const answerButtons = [...document.querySelectorAll('.quiz_answer')]; // HTML에서 3개로 구성되어야 함
const resultBox = document.getElementById('quizResult');
const prevButton = document.getElementById('quizPrev');

// 결과가 나왔을 때 같이 보여줄 하단 섹션들 (실제 클래스명 정해지면 여기만 수정)
const RESULT_SECTION_SELECTORS = ['.sec_banner', '.sec_who']; // TODO: 실제 클래스명으로 교체
const HERO_SELECTOR = '.scan-hero'; // TODO: 실제 클래스명으로 교체


// 배열 순서를 무작위로 섞는 함수 (답변 3개가 매번 다른 순서로 보이게 함)
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


// 지금 순서(currentIndex)에 맞는 문항을 화면에 채워 넣는 함수
// snapshot이 있으면(=뒤로가기로 온 경우) 그 순서 그대로 복원, 없으면 새로 셔플
function showQuestion(snapshot) {
  const question = questions[currentIndex];
  const shuffledAnswers = snapshot || shuffle(question.answers);

  progressText.textContent = `${currentIndex + 1}`.padStart(2, '0') + ' / ' + `${questions.length}`.padStart(2, '0');
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
// 콘텐츠를 바꾸고, 다시 페이드인 시킵니다.
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


// 답변 버튼을 클릭했을 때 실행: 가중치 점수 반영 후 다음 문항, 마지막이면 결과 화면으로
function selectAnswer(button) {
  if (isAnimating) return;
  answerButtons.forEach((b) => (b.disabled = true));
  button.classList.add('is-selected');

  const axis = button.dataset.axis;
  const weight = QUESTION_WEIGHTS[currentIndex];

  // 뒤로가기를 위해, 지금 화면에 보였던 답변 순서와 선택 정보를 저장
  const snapshot = answerButtons.map((b) => ({
    text: b.querySelector('.answer_text').textContent,
    axis: b.dataset.axis,
  }));
  answerHistory.push({ axis, weight, snapshot });

  score[axis] += weight;
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
  if (isAnimating || currentIndex === 0 || answerHistory.length === 0) return;

  const last = answerHistory.pop(); // 마지막으로 답했던 기록 꺼내기
  score[last.axis] -= last.weight; // 그때 더했던 가중치 점수 되돌리기
  currentIndex -= 1;

  isAnimating = true;
  goToNextQuestion(() => {
    isAnimating = false;
    showQuestion(last.snapshot); // 그때 봤던 순서 그대로 복원
  });
}


// 동점 처리: 가중치가 높은 문항에서 선택한 유형을 우선한다.
// (기존 기획: "5번 문항 우선 → 3번 문항 우선" = "가중치 큰 문항 우선"을 일반화한 버전)
function resolveTie(candidates) {
  // answerHistory를 가중치 내림차순으로 훑으면서, candidates 중 하나를 고른 문항을 찾으면 그걸로 확정
  const byWeightDesc = [...answerHistory].sort((a, b) => b.weight - a.weight);
  for (const entry of byWeightDesc) {
    if (candidates.includes(entry.axis)) return entry.axis;
  }
  return candidates[0]; // 이론상 도달하지 않음 (안전장치)
}


// 3개 유형(challenger/achiever/seeker)의 점수를 바탕으로
// 순위(mainType/subType)와 퍼센트(percent)를 계산하는 함수
function calculateResult() {
  const keys = ['challenger', 'achiever', 'seeker'];
  const total = keys.reduce((sum, k) => sum + score[k], 0);

  const percent = {};
  keys.forEach((k) => {
    percent[k] = total > 0 ? Math.round((score[k] * 100) / total) : 0;
  });

  // 점수 내림차순 정렬, 동점이면 resolveTie로 우선순위 결정
  const ranked = [...keys].sort((a, b) => {
    if (score[b] !== score[a]) return score[b] - score[a];
    // 동점인 두 유형만 놓고 우선순위를 물어봄
    return resolveTie([a, b]) === a ? -1 : 1;
  });

  return { percent, mainType: ranked[0], subType: ranked[1] };
}


// 결과가 나왔을 때 하단 섹션들(RESULT_SECTION_SELECTORS)을 보이거나 숨기는 함수
function toggleResultSections(show) {
  document.querySelectorAll(RESULT_SECTION_SELECTORS.join(',')).forEach((el) => {
    el.hidden = !show;
  });
  document.querySelector(HERO_SELECTOR)?.classList.toggle('has-result', show);
}


// 결과 화면을 채우는 함수: 유형 이름/설명/막대그래프 등을 화면에 표시
function showResult() {
  questionBox.hidden = true;
  resultBox.hidden = false;
  toggleResultSections(true);

  const { percent, mainType, subType } = calculateResult();
  const mainPersona = personas[mainType];
  const subPersona = personas[subType];

  document.getElementById('resultName').textContent = mainPersona.name;
  document.getElementById('resultTag').textContent = mainPersona.tag;
  document.getElementById('resultLead').textContent = mainPersona.lead;
  document.getElementById('resultSecondary').textContent =
    percent[subType] > 0 ? `${subPersona.name}(${percent[subType]}%) 기질도 함께 갖고 있어요` : '';

  document.querySelectorAll('.result_bar_row').forEach((row) => {
    const key = row.dataset.persona;
    row.classList.toggle('is-top', key === mainType);
    row.querySelector('.result_bar_fill').style.width = percent[key] + '%';
    row.querySelector('.bar_pct').textContent = percent[key] + '%';
  });

  document.getElementById('resultCopy1').textContent = mainPersona.body[0];
  document.getElementById('resultCopy2').textContent =
    percent[subType] > 0
      ? `${mainPersona.name}의 성향이 가장 두드러지며, ${subPersona.trait} ${subPersona.name}의 성향(${percent[subType]}%)도 함께 가지고 있습니다.`
      : `${mainPersona.name}의 성향이 가장 두드러집니다.`;

  document.getElementById('resultName').focus({ preventScroll: true });
}


// "다시 하기" 버튼 클릭 시: 점수/순서 초기화하고 첫 문항부터 다시 시작
function resetQuiz() {
  currentIndex = 0;
  Object.keys(score).forEach((key) => (score[key] = 0));
  answerHistory = [];
  history.replaceState(null, '', location.pathname);

  resultBox.hidden = true;
  questionBox.hidden = false;
  toggleResultSections(false);
  showQuestion();
}


// 데이터(questions, personas)를 받아서 퀴즈를 실제로 시작시키는 함수.
// 버튼 이벤트 연결, 공유된 URL(?result=...)이 있으면 바로 결과 화면 표시
function startQuiz(data) {
  questions = data.questions;
  personas = data.personas;

  answerButtons.forEach((button) => {
    button.addEventListener('click', () => selectAnswer(button));
  });
  document.getElementById('testRetry').addEventListener('click', resetQuiz);
  prevButton?.addEventListener('click', goToPrevQuestion);

  // 공유 URL은 원점수 대신 "퍼센트"를 그대로 인코딩합니다. (challenger-achiever-seeker, 합계 100)
  // 가중치가 붙어 원점수가 소수점이 되기 때문에, 정수인 퍼센트로 공유하는 편이 URL도 짧고 안전합니다.
  const shared = new URLSearchParams(location.search).get('result');
  const parsed = shared && /^\d{1,3}-\d{1,3}-\d{1,3}$/.test(shared) ? shared.split('-').map(Number) : null;
  const isValidShare = parsed && parsed.every((n) => n <= 100) && parsed.reduce((a, b) => a + b, 0) === 100;

  if (isValidShare) {
    showSharedResult(parsed); // [challenger%, achiever%, seeker%]
  } else {
    showQuestion();
  }
}


// 공유 링크로 들어왔을 때: 직접 계산하지 않고 URL의 퍼센트 값을 그대로 표시
function showSharedResult(parsedPercents) {
  const keys = ['challenger', 'achiever', 'seeker'];
  const percent = {};
  keys.forEach((k, i) => (percent[k] = parsedPercents[i]));

  const ranked = [...keys].sort((a, b) => percent[b] - percent[a]);
  const mainType = ranked[0];
  const subType = ranked[1];

  questionBox.hidden = true;
  resultBox.hidden = false;
  toggleResultSections(true);

  const mainPersona = personas[mainType];
  const subPersona = personas[subType];

  document.getElementById('resultName').textContent = mainPersona.name;
  document.getElementById('resultTag').textContent = mainPersona.tag;
  document.getElementById('resultLead').textContent = mainPersona.lead;
  document.getElementById('resultSecondary').textContent =
    percent[subType] > 0 ? `${subPersona.name}(${percent[subType]}%) 기질도 함께 갖고 있어요` : '';

  document.querySelectorAll('.result_bar_row').forEach((row) => {
    const key = row.dataset.persona;
    row.classList.toggle('is-top', key === mainType);
    row.querySelector('.result_bar_fill').style.width = percent[key] + '%';
    row.querySelector('.bar_pct').textContent = percent[key] + '%';
  });

  document.getElementById('resultCopy1').textContent = mainPersona.body[0];
  document.getElementById('resultCopy2').textContent =
    percent[subType] > 0
      ? `${mainPersona.name}의 성향이 가장 두드러지며, ${subPersona.trait} ${subPersona.name}의 성향(${percent[subType]}%)도 함께 가지고 있습니다.`
      : `${mainPersona.name}의 성향이 가장 두드러집니다.`;
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

   ⚠️ 기획서(문서1)에는 5문항 내용만 확정되어 있어서,
   아래에는 그 5개를 그대로 넣고 나머지 2개는 TODO 자리만 만들어뒀습니다.
   질문/선택지/axis 내용을 채워주세요. axis는 challenger / achiever / seeker 중 하나입니다.
   ========================================================= */

const QUIZ_DATA_FALLBACK = {
  "questions": [
    {
      "question": "늘 쓰던 물건에서 불편함을 발견했습니다.",
      "answers": [
        { "text": "일단 다 방식대로 고쳐 써본다. 잘 안되면 다른 방법을 다시 시도한다.", "axis": "challenger" },
        { "text": "새로운 방식으로 만들어 함께 쓰자고 제안한다.", "axis": "achiever" },
        { "text": "왜 같은 불편이 반복되는지 원인부터 살펴본다.", "axis": "seeker" }
      ]
    },
    {
      "question": "여러 사람이 모여 무엇을 할지 논의하고 있지만, 30분째 결론이 나지 않습니다.",
      "answers": [
        { "text": "우선 하나를 정하고 움직이면서 방향을 조정하자고 한다.", "axis": "challenger" },
        { "text": "내가 먼저 방향을 만들어 구체적인 방향을 제시한다.", "axis": "achiever" },
        { "text": "무엇을 기준으로 결정할지부터 다시 정하자고 한다.", "axis": "seeker" }
      ]
    },
    {
      "question": "새로 설치한 앱을 처음 실행했습니다.",
      "answers": [
        { "text": "튜토리얼을 건너뛰고 여러 기능을 직접 눌러본다.", "axis": "challenger" },
        { "text": "기능을 빠르게 익힌 뒤 무엇을 만들 수 있을지 바로 시험해본다.", "axis": "achiever" },
        { "text": "설정과 메뉴를 하나씩 살펴보며 앱의 구조부터 파악한다.", "axis": "seeker" }
      ]
    },
    {
      "question": "몇 달 동안 준비한 일이 결국 무산됐습니다. 다음날,",
      "answers": [
        { "text": "잠시 숨을 고른 뒤 새로운 가능성을 찾아 다시 움직인다.", "axis": "challenger" },
        { "text": "이번 경험을 정리해 다음 도전에 활용할 수 있는 결과물로 남긴다.", "axis": "achiever" },
        { "text": "일이 무산된 진짜 이유가 무엇인지 다시 분석해본다.", "axis": "seeker" }
      ]
    },
    {
      "question": "같은 실수를 두 번째로 반복했습니다.",
      "answers": [
        { "text": "오늘과 자책하기보다 방법을 다시 시도하며 방법을 찾는다.", "axis": "challenger" },
        { "text": "같은 실수를 막을 수 있도록 체크리스트나 장치를 마련한다.", "axis": "achiever" },
        { "text": "두 번의 실수가 어떤 상황에서 발생했는지 공통점을 찾아본다.", "axis": "seeker" }
      ]
    },
    {
      "question": "해보고 싶은 일이 생겼지만, 검색해도 정보가 잘 나오지 않습니다.",
      "answers": [
        { "text": "자료가 부족해도 일단 직접 시작하며 방법을 찾아간다.", "axis": "challenger" },
        { "text": "직접 결과물을 몇 가지 만들며 실행 가능한 방법을 찾아낸다.", "axis": "achiever" },
        { "text": "비슷한 사례를 찾아 비교하고, 실행 순서를 먼저 정리한다.", "axis": "seeker" }
      ]
    },
    {
      "question": "오랫동안 사실이라고 믿었던 내용이 틀렸다는 이야기를 들었습니다.",
      "answers": [
        { "text": "새로운 내용이 맞다면 바로 받아들이고 생각을 바꾼다.", "axis": "challenger" },
        { "text": "사실인지 직접 확인할 방법을 만들어 검증한다.", "axis": "achiever" },
        { "text": "신뢰할 만한 자료를 찾아 사실관계와 근거를 확인한다.", "axis": "seeker" }
      ]
    }
  ],
  "personas": {
    "challenger": {
      "name": "도전가",
      "tag": "DARE · ACT · GROW",
      "lead": "낯선 가능성에 먼저 뛰어드는 사람",
      "trait": "새로운 방법을 먼저 시도하는",
      "body": [
        "불확실해도 작은 행동부터 시작합니다. 익숙한 방식보다 새로운 가능성을 선택합니다.",
        "실패에 머무르지 않고 다시 도전합니다."
      ]
    },
    "achiever": {
      "name": "성취가",
      "tag": "AIM · ACT · ACHIEVE",
      "lead": "목표를 결과로 완성하는 사람",
      "trait": "목표를 끝까지 완성하는",
      "body": [
        "목표와 우선순위를 명확히 정합니다. 실행 과정과 역할을 구체적으로 설계합니다.",
        "시작한 일을 끝까지 완성합니다."
      ]
    },
    "seeker": {
      "name": "탐구가",
      "tag": "ASK · EXPLORE · GO DEEP",
      "lead": "질문을 깊게 파고드는 사람",
      "trait": "질문의 본질을 깊이 파고드는",
      "body": [
       "표면적인 답에서 멈추지 않고 그 뒤에 있는 이유와 맥락을 이해하려 합니다. \n다른 사람이 지나친 질문 하나를 붙잡고 문제의 본질에 닿을 때까지 깊이 탐색합니다.",
        "문제의 표면보다 본질을 깊이 탐색합니다."
      ]
    }
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
