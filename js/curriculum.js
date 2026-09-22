function initCurriculumStepper() {
  const stepperBox = document.querySelector('[data-stepper="year1"]');
  if (!stepperBox) return;

  const stepButtons = [...stepperBox.querySelectorAll('.btn_step')];
  const yearBlock = stepperBox.closest('.year_box');
  const workspace = yearBlock.querySelector('.detail_box');
  const detailPanels = [...workspace.querySelectorAll('.detail_panel')];
  const pcPrevButton = workspace.querySelector('.btn_arrow.prev');
  const pcNextButton = workspace.querySelector('.btn_arrow.next');
  const mobileBar = yearBlock.querySelector('.mobile_stepper_bar');
  const mobilePrevButton = mobileBar ? mobileBar.querySelector('.mobile_arrow.prev') : null;
  const mobileNextButton = mobileBar ? mobileBar.querySelector('.mobile_arrow.next') : null;
  const mobileLabelText = mobileBar ? mobileBar.querySelector('.mobile_active_label') : null;

  let currentStepIndex = 0;

  const update = (newIndex) => {
    currentStepIndex = newIndex;

    stepButtons.forEach((button, index) => {
      const isSelected = index === currentStepIndex;
      button.dataset.state = index < currentStepIndex ? 'done' : index === currentStepIndex ? 'active' : 'upcoming';
      button.setAttribute('aria-selected', String(isSelected));
      button.tabIndex = isSelected ? 0 : -1;
    });

    detailPanels.forEach((panel, index) => {
      panel.hidden = index !== currentStepIndex;
    });

    if (mobileLabelText) mobileLabelText.textContent = stepButtons[currentStepIndex].dataset.label;

    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === stepButtons.length - 1;
    pcPrevButton.disabled = isFirstStep;
    pcNextButton.disabled = isLastStep;
    if (mobilePrevButton) mobilePrevButton.disabled = isFirstStep;
    if (mobileNextButton) mobileNextButton.disabled = isLastStep;
  };

  stepButtons.forEach((button, index) => {
    button.addEventListener('click', () => update(index));

    button.addEventListener('keydown', (event) => {
      let nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % stepButtons.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + stepButtons.length) % stepButtons.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = stepButtons.length - 1;
      else return;

      event.preventDefault();
      update(nextIndex);
      stepButtons[nextIndex].focus();
    });
  });

  pcPrevButton.addEventListener('click', () => currentStepIndex > 0 && update(currentStepIndex - 1));
  pcNextButton.addEventListener('click', () => currentStepIndex < stepButtons.length - 1 && update(currentStepIndex + 1));
  if (mobilePrevButton) mobilePrevButton.addEventListener('click', () => currentStepIndex > 0 && update(currentStepIndex - 1));
  if (mobileNextButton) mobileNextButton.addEventListener('click', () => currentStepIndex < stepButtons.length - 1 && update(currentStepIndex + 1));

  update(0);
}


function initRouteSteppers() {
  // sec_route 안에 있는 route_box(PIONEER, SCOUT) 각각을 찾아서
  // 서로 완전히 독립적으로 동작하는 미니 스텝퍼를 하나씩 세팅합니다.
  const routeBlocks = document.querySelectorAll('.sec_route .route_step_box');

  routeBlocks.forEach((routeBlock) => {
    const miniStepper = routeBlock.querySelector('.route_mini_stepper');
    const miniSteps = [...miniStepper.querySelectorAll('.mini_step')];
    const cards = [...routeBlock.querySelectorAll('.card_item')];

    const mobileBar = routeBlock.querySelector('.route_mobile_bar');
    const prevBtn = mobileBar.querySelector('.route_arrow.prev');
    const nextBtn = mobileBar.querySelector('.route_arrow.next');
    const labelText = mobileBar.querySelector('.route_active_label');

    let current = 0;

    function update(index) {
      current = index;

      miniSteps.forEach((step, i) => {
        const selected = i === current;
        step.dataset.state = i < current ? 'done' : i === current ? 'active' : 'upcoming';
        step.tabIndex = selected ? 0 : -1;
      });

      cards.forEach((card, i) => { card.hidden = i !== current; });

      labelText.textContent = miniSteps[current].dataset.label;

      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === cards.length - 1;
    }

    miniSteps.forEach((step, i) => {
      step.addEventListener('click', () => update(i));
    });

    prevBtn.addEventListener('click', () => current > 0 && update(current - 1));
    nextBtn.addEventListener('click', () => current < cards.length - 1 && update(current + 1));

    update(0);
  });
}


// 초기화는 여기서 딱 한 번씩만
initCurriculumStepper();
initRouteSteppers();
