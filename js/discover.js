/* =========================================================
   AIGEN O/X 퀴즈 스크립트
   5문항 · O/X 선택 → 정답과 해설 바로 표시 → 다음 문항 → 마무리 화면
   (이전 유형 테스트 버전은 discover(back_up2).js)
   ========================================================= */

// 문항 데이터 (문구 수정은 여기서만)
const QUIZ_DATA = [
  {
    question: 'AI나 코딩을 잘해야 아이젠에 도전할 수 있다.',
    answer: 'X',
    explain: '기술·예술·공공 등 분야는 다양합니다.\n중요한 것은 자기 분야에서 AI로 무엇을 해보고 싶은지입니다.',
  },
  {
    question: '아이젠은 SK 취업을 연계하는 프로그램이다.',
    answer: 'X',
    explain: '취업 연계 과정이 아닙니다. 실제 문제를 해결하며 경험과 실력을 쌓고, 스스로 다음 길을 설계하도록 지원합니다.',
  },
  {
    question: '아이젠의 장학은 돈뿐 아니라, 도전할 시간과 경험을 지원하는 것이다.',
    answer: 'O',
    explain: '장학금과 활동 공간을 기반으로, 새로운 시도에 몰입할 수 있는 2년을 지원합니다.',
  },
  {
    question: '프로젝트가 예상대로 되지 않은 경험도 성장의 일부가 될 수 있다.',
    answer: 'O',
    explain: '시도한 방법과 피드백을 돌아보고, 바꾼 방법으로 다시 도전하며 실력을 쌓습니다.',
  },
  {
    question: '아이젠에서는 모두 같은 진로를 목표로 한다.',
    answer: 'X',
    explain: '서로 다른 꿈을 가진 동료들과 경험과 관점을 나누며, 각자의 길을 구체화합니다.',
  },
];

let currentIndex = 0;
let isAnimating = false; // 애니메이션 중 중복 클릭 방지

const questionBox = document.getElementById('quizQuestion');
const progressQNum = document.getElementById('quizQNum');
const progressCurrent = document.getElementById('quizCurrent');
const progressTotal = document.getElementById('quizTotal');
const questionText = document.getElementById('quizQText');
const answerButtons = [...document.querySelectorAll('.quiz_answer')];
const feedbackBox = document.getElementById('quizFeedback');
const answerLabel = document.getElementById('quizAnswerLabel');
const explainText = document.getElementById('quizExplain');
const nextButton = document.getElementById('quizNext');
const resultBox = document.getElementById('quizResult');

// 마무리 화면이 나올 때 같이 보여줄 하단 섹션들
const RESULT_SECTION_SELECTORS = ['.sec_banner'];


// 진행 상태(Q1 / 01 | 05) 갱신
function updateProgress() {
  progressQNum.textContent = `Q${currentIndex + 1}`;
  progressCurrent.textContent = `${currentIndex + 1}`.padStart(2, '0');
  progressTotal.textContent = `${QUIZ_DATA.length}`.padStart(2, '0');
}


// 지금 순서(currentIndex)의 문항을 화면에 채우고, 선택·해설 상태를 초기화
function showQuestion() {
  const quiz = QUIZ_DATA[currentIndex];

  updateProgress();
  questionText.textContent = quiz.question;

  answerButtons.forEach((button) => {
    button.disabled = false;
    button.classList.remove('is-selected');
  });
  feedbackBox.hidden = true;

  if (currentIndex > 0) questionText.focus({ preventScroll: true });
}


// O/X 버튼 클릭 시: 버튼을 잠그고 정답과 해설을 바로 표시
function selectAnswer(button) {
  if (isAnimating || !feedbackBox.hidden) return;

  const quiz = QUIZ_DATA[currentIndex];
  const isLast = currentIndex === QUIZ_DATA.length - 1;

  answerButtons.forEach((b) => (b.disabled = true));
  button.classList.add('is-selected');

  answerLabel.textContent = `정답 : ${quiz.answer}`;
  explainText.textContent = quiz.explain;
  nextButton.textContent = isLast ? '결과 보기' : '다음 문제';
  feedbackBox.hidden = false;
  nextButton.focus({ preventScroll: true });
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


// "다음 문제" 버튼 클릭 시: 다음 문항(또는 마무리 화면)으로 전환
function goToNext() {
  if (isAnimating) return;

  currentIndex += 1;
  isAnimating = true;
  goToNextQuestion(() => {
    isAnimating = false;
    if (currentIndex < QUIZ_DATA.length) {
      showQuestion();
    } else {
      showResult();
    }
  });
}


// 마무리 화면이 나올 때 하단 섹션(배너)을 보이거나 숨김
function toggleResultSections(show) {
  document.querySelectorAll(RESULT_SECTION_SELECTORS.join(',')).forEach((el) => {
    el.hidden = !show;
  });
}


// 마무리 화면 표시
function showResult() {
  questionBox.hidden = true;
  resultBox.hidden = false;
  toggleResultSections(true);
  document.getElementById('resultLead').focus({ preventScroll: true });
}


function initQuiz() {
  if (!questionBox) return;

  answerButtons.forEach((button) => {
    button.addEventListener('click', () => selectAnswer(button));
  });
  nextButton.addEventListener('click', goToNext);

  showQuestion();
}

initQuiz();
