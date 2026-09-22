/* =========================================================
   AIGEN TEST 퀴즈 스크립트
   ========================================================= */

let questions = [];
let personas = {};

let currentIndex = 0;
// 4가지 성향별로 몇 점 쌓였는지 저장
const score = { think: 0, adapt: 0, empathy: 0, body: 0 };

let answerHistory = []; // 뒤로가기용: 각 문항에서 선택했던 axis와 화면에 보였던 순서를 기록
let isAnimating = false; // 애니메이션 중 중복 클릭/뒤로가기 방지

const questionBox = document.getElementById('quizQuestion');
const progressText = document.getElementById('quizProgress');
const questionText = document.getElementById('quizQText');
const answerButtons = [...document.querySelectorAll('.quiz_answer')];
const resultBox = document.getElementById('quizResult');
const prevButton = document.getElementById('quizPrev');

// 결과가 나왔을 때 같이 보여줄 하단 섹션들 (실제 클래스명 정해지면 여기만 수정)
const RESULT_SECTION_SELECTORS = ['.sec_banner', '.sec_who']; // TODO: 실제 클래스명으로 교체
const HERO_SELECTOR = '.scan-hero'; // TODO: 실제 클래스명으로 교체


// 배열 순서를 무작위로 섞는 함수 (답변 4개가 매번 다른 순서로 보이게 함)
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

  progressText.textContent = `${currentIndex + 1}`.padStart(2, '0') + ' / ' + questions.length;
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


// 답변 버튼을 클릭했을 때 실행: 점수 반영 후 다음 문항, 마지막이면 결과 화면으로
function selectAnswer(button) {
  if (isAnimating) return;
  answerButtons.forEach((b) => (b.disabled = true));
  button.classList.add('is-selected');

  const axis = button.dataset.axis;

  // 뒤로가기를 위해, 지금 화면에 보였던 답변 순서와 선택한 axis를 저장
  const snapshot = answerButtons.map((b) => ({
    text: b.querySelector('.answer_text').textContent,
    axis: b.dataset.axis,
  }));
  answerHistory.push({ axis, snapshot });

  score[axis] += 1;
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
  score[last.axis] -= 1; // 그때 더했던 점수 되돌리기
  currentIndex -= 1;

  isAnimating = true;
  goToNextQuestion(() => {
    isAnimating = false;
    showQuestion(last.snapshot); // 그때 봤던 순서 그대로 복원
  });
}


// 4개 성향(think/adapt/empathy/body) 점수를 3개 유형 점수로 변환하고,
// 순위(mainType/subType)와 퍼센트(percent)를 계산하는 함수
function calculateResult() {
  const totalScores = {
    experimenter: score.adapt * 2,
    achiever: score.body * 2,
    seeker: score.think + score.empathy,
  };

  const order = ['seeker', 'achiever', 'experimenter'];
  const ranked = order.slice().sort((a, b) => totalScores[b] - totalScores[a] || order.indexOf(a) - order.indexOf(b));

  const total = totalScores.seeker + totalScores.achiever + totalScores.experimenter;
  const percent = {};
  order.forEach((key) => {
    percent[key] = Math.round((totalScores[key] * 100) / total);
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
  document.getElementById('resultCopy2').textContent = mainPersona.body[1];

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

  const shared = new URLSearchParams(location.search).get('result');
  const parsed = shared && /^\d{1,2}-\d{1,2}-\d{1,2}-\d{1,2}$/.test(shared) ? shared.split('-').map(Number) : null;
  const isValidShare = parsed && parsed.every((n) => n <= 12) && parsed.reduce((a, b) => a + b, 0) === 12;

  if (isValidShare) {
    [score.think, score.adapt, score.empathy, score.body] = parsed;
    showResult();
  } else {
    showQuestion();
  }
}


/* =========================================================
   데이터 불러오기

   기본: json/main.json을 fetch로 불러옵니다. (로컬 서버 필요, file://는 안 됨)

   만약 로컬 서버 없이 file://로 바로 열어야 하는 상황이면:
   1) 아래 init() 안의 fetch 부분을 주석 처리
   2) 맨 아래 QUIZ_DATA_FALLBACK 블록의 주석 표시를 해제하고
      startQuiz(QUIZ_DATA_FALLBACK); 를 대신 호출하면 됩니다.
   ========================================================= */

// 퀴즈 시작점: 데이터를 불러온 뒤 startQuiz()를 호출
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
   json/main.json과 내용이 완전히 동일합니다.
   ========================================================= */

// file://로 바로 열 때를 대비한 백업 데이터 (json/main.json과 동일 내용)
const QUIZ_DATA_FALLBACK = {
  "questions": [
    {
      "question": "늘 쓰던 것에서 불편한 점이 눈에 들어왔습니다. 다들 그냥 쓰고 있습니다.",
      "answers": [
        { "text": "다른 사람들도 불편한지 물어본다", "axis": "empathy" },
        { "text": "왜 자꾸 같은 문제가 나오는지 생각해본다", "axis": "think" },
        { "text": "내 나름대로 고쳐 써본다. 안 되면 마는 거다", "axis": "adapt" },
        { "text": "아예 다르게 만들어서 다음부턴 이걸 쓰자고 내놓는다", "axis": "body" }
      ]
    },
    {
      "question": "여럿이 모여 뭘 할지 30분째 결론이 안 납니다.",
      "answers": [
        { "text": "고르는 기준부터 다시 정하자고 한다", "axis": "think" },
        { "text": "일단 아무거나 정하고 움직이자고 한다", "axis": "adapt" },
        { "text": "각자 뭘 원하는지 듣고 겹치는 지점을 찾는다", "axis": "empathy" },
        { "text": "그냥 내가 먼저 하나 만들어서 이걸로 하자고 보여준다", "axis": "body" }
      ]
    },
    {
      "question": "새로 깐 앱을 처음 켰습니다.",
      "answers": [
        { "text": "튜토리얼 건너뛰고 아무거나 눌러본다", "axis": "adapt" },
        { "text": "써보고 괜찮으면 주변에도 알려주고 같이 써보자고 한다", "axis": "empathy" },
        { "text": "설정이랑 메뉴부터 하나씩 열어본다", "axis": "think" },
        { "text": "익힌 기능으로 뭘 만들 수 있을지 바로 테스트해본다", "axis": "body" }
      ]
    },
    {
      "question": "몇 달 준비한 일이 결국 엎어졌습니다. 다음 날,",
      "answers": [
        { "text": "같이 했던 사람들한테 먼저 연락한다", "axis": "empathy" },
        { "text": "하루만 쉬고 다른 걸 찾아본다", "axis": "adapt" },
        { "text": "다들 이유를 말하는데, 내가 보기엔 다른 게 문제였다", "axis": "think" },
        { "text": "그 경험을 바로 정리해서 다음에 쓸 수 있는 형태로 만들어둔다", "axis": "body" }
      ]
    },
    {
      "question": "다들 좋다는 걸 샀는데 나한테는 안 맞습니다.",
      "answers": [
        { "text": "바로 정리하고 다른 걸 알아본다", "axis": "adapt" },
        { "text": "후기를 다시 읽어본다. 광고였나 싶어서", "axis": "think" },
        { "text": "후기에 내가 겪은 그대로 남긴다", "axis": "empathy" },
        { "text": "나한테 맞게 직접 뜯어고쳐서 쓴다", "axis": "body" }
      ]
    },
    {
      "question": "친했던 사람이랑 대화가 예전 같지 않습니다.",
      "answers": [
        { "text": "내가 뭐 잘못했나 그동안 대화를 떠올려본다", "axis": "empathy" },
        { "text": "사이가 변한 건지, 상황이 바뀐 건지 생각해본다", "axis": "think" },
        { "text": "예전처럼 안 되면 지금 사이에 맞춰간다", "axis": "adapt" },
        { "text": "같이 할 거리를 만들어서 다시 가까워질 계기를 만든다", "axis": "body" }
      ]
    },
    {
      "question": "같은 실수를 두 번째 했습니다.",
      "answers": [
        { "text": "두 번 다 어떤 상황이었는지 되짚어본다", "axis": "think" },
        { "text": "나 때문에 곤란해진 사람부터 찾는다", "axis": "empathy" },
        { "text": "한숨 한 번 쉬고 바로 다시 한다", "axis": "adapt" },
        { "text": "다시 안 그러도록 체크리스트나 장치를 만들어둔다", "axis": "body" }
      ]
    },
    {
      "question": "하고 싶은 게 생겼는데 주변에서 다들 말립니다.",
      "answers": [
        { "text": "일단 해보고 아니면 그때 접는다", "axis": "adapt" },
        { "text": "말리는 이유 들어보고 걸리는 것만 고친다", "axis": "empathy" },
        { "text": "들을 건 듣고, 결정은 원래대로 한다", "axis": "think" },
        { "text": "일단 뭐라도 만들어서 보여준다", "axis": "body" }
      ]
    },
    {
      "question": "오래 사실이라 믿었던 게 아니라는 얘기를 들었습니다.",
      "answers": [
        { "text": "진짜인지 검색해본다", "axis": "think" },
        { "text": "그동안 이걸로 누구한테 뭐라 한 적 있나 떠올린다", "axis": "empathy" },
        { "text": "\"아 그래?\" 하고 바로 바꿔서 기억한다", "axis": "adapt" },
        { "text": "진짜인지 직접 확인해볼 방법부터 만든다", "axis": "body" }
      ]
    },
    {
      "question": "약속 두 시간 전에 취소 연락이 왔습니다.",
      "answers": [
        { "text": "그럼 혼자 할 거 하고 온다", "axis": "adapt" },
        { "text": "무슨 일 있나 싶어서 먼저 물어본다", "axis": "empathy" },
        { "text": "오늘 뭘 하면 좋을지 처음부터 다시 짠다", "axis": "think" },
        { "text": "남는 시간에 뭐 하나라도 만들어놓는다", "axis": "body" }
      ]
    },
    {
      "question": "해보고 싶은 게 있는데 검색해도 자료가 안 나옵니다.",
      "answers": [
        { "text": "같이 할 사람부터 구해본다", "axis": "empathy" },
        { "text": "비슷한 거라도 찾아서 순서를 짜본다", "axis": "think" },
        { "text": "자료 없으면 없는 대로 그냥 시작한다", "axis": "adapt" },
        { "text": "일단 손으로 만들어보면서 방법을 찾는다", "axis": "body" }
      ]
    },
    {
      "question": "다 같이 정한 방향인데 하다 보니 아닌 것 같습니다.",
      "answers": [
        { "text": "일단 해보다가 아니면 그때 바꾼다", "axis": "adapt" },
        { "text": "지금이라도 얘기 꺼낸다", "axis": "empathy" },
        { "text": "내 몫은 내 방식대로 해본다", "axis": "think" },
        { "text": "내가 생각한 대안을 직접 만들어서 제시한다", "axis": "body" }
      ]
    }
  ],
  "personas": {
    "experimenter": {
      "name": "실험가",
      "tag": "TRY · BUILD · LEARN",
      "lead": "궁금하면 먼저 시도해보는 사람",
      "body": [
        "새로운 기술이나 방법을 마주하면 설명을 다 읽기 전에 일단 만져봅니다. 처음 보는 도구도 금방 손에 익히고, 그 과정에서 남들이 못 본 가능성을 먼저 발견합니다.",
        "이 성향은 아직 정답이 없는 곳에서 가장 크게 빛납니다. 아무도 안 가본 길일수록, 먼저 발을 디뎌본 사람의 경험이 가장 큰 자산이 됩니다."
      ]
    },
    "achiever": {
      "name": "성취가",
      "tag": "SET · CHALLENGE · MAKE IT HAPPEN",
      "lead": "정한 목표는 끝까지 만들어내는 사람",
      "body": [
        "어려운 목표일수록 오히려 몰입합니다. 중간에 막혀도 포기 대신 다른 방법을 찾고, 결국 눈에 보이는 성과로 끝을 맺습니다.",
        "방향이 정해졌는데 아무도 안 움직일 때, 먼저 끝까지 가보는 사람이 나머지를 움직이게 합니다."
      ]
    },
    "seeker": {
      "name": "탐구가",
      "tag": "ASK · EXPLORE · GO DEEP",
      "lead": "질문을 깊게 파고드는 사람",
      "body": [
        "표면적인 답에서 멈추지 않고, 그 뒤에 있는 사람과 맥락을 이해하려 합니다. 다른 사람이 지나친 질문 하나를 붙잡고 오래 들여다봅니다.",
        "기술이나 방법보다 그걸 쓰는 사람을 먼저 이해해야 진짜 문제가 풀립니다."
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