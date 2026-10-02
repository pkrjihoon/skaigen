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



function initRouteTabs() {
  const tabBox = document.querySelector('[data-tabs="route"]');
  if (!tabBox) return;

  const tabButtons = [...tabBox.querySelectorAll('.btn_tab')];
  const tabPanels = [...tabBox.querySelectorAll('.tab_panel')];

  let currentTabIndex = 0;

  const update = (newIndex) => {
    currentTabIndex = newIndex;

    tabButtons.forEach((button, index) => {
      const isSelected = index === currentTabIndex;
      button.classList.toggle('active', isSelected);
      button.setAttribute('aria-selected', String(isSelected));
      button.tabIndex = isSelected ? 0 : -1;
    });

    tabPanels.forEach((panel, index) => {
      const isSelected = index === currentTabIndex;
      panel.classList.toggle('active', isSelected);
      panel.hidden = !isSelected;
    });
  };

  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => update(index));

    button.addEventListener('keydown', (event) => {
      let nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabButtons.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabButtons.length - 1;
      else return;

      event.preventDefault();
      update(nextIndex);
      tabButtons[nextIndex].focus();
    });
  });

  update(0);
}

function initRouteCardSteppers() {
  const panels = document.querySelectorAll('.sec_year02 .tab_panel');

  panels.forEach((panel) => {
    const miniSteps = [...panel.querySelectorAll('.mini_step')];
    const cards = [...panel.querySelectorAll('.card_item')];
    const prevButton = panel.querySelector('.route_arrow.prev');
    const nextButton = panel.querySelector('.route_arrow.next');
    const labelText = panel.querySelector('.route_active_label');
    if (!miniSteps.length || !cards.length) return;

    let currentStepIndex = 0;

    // 포커스된 버튼이 비활성화되면 반대쪽 버튼으로 포커스 이동
    const setDisabled = (button, disabled, fallbackButton) => {
      if (!button) return;
      const hadFocus = document.activeElement === button;
      button.disabled = disabled;
      if (disabled && hadFocus && fallbackButton) fallbackButton.focus();
    };

    const update = (newIndex) => {
      currentStepIndex = newIndex;

      miniSteps.forEach((step, index) => {
        step.dataset.state = index < currentStepIndex ? 'done' : index === currentStepIndex ? 'active' : 'upcoming';
        if (index === currentStepIndex) step.setAttribute('aria-current', 'step');
        else step.removeAttribute('aria-current');
      });

      // PC는 CSS가 hidden을 무시하고 3장 모두 노출, 모바일은 한 장씩
      cards.forEach((card, index) => {
        card.classList.toggle('active', index === currentStepIndex);
        card.hidden = index !== currentStepIndex;
      });

      if (labelText) labelText.textContent = miniSteps[currentStepIndex].dataset.label;

      setDisabled(prevButton, currentStepIndex === 0, nextButton);
      setDisabled(nextButton, currentStepIndex === cards.length - 1, prevButton);
    };

    miniSteps.forEach((step, index) => {
      step.addEventListener('click', () => update(index));
    });

    if (prevButton) prevButton.addEventListener('click', () => currentStepIndex > 0 && update(currentStepIndex - 1));
    if (nextButton) nextButton.addEventListener('click', () => currentStepIndex < cards.length - 1 && update(currentStepIndex + 1));

    update(0);
  });
}

initRouteTabs()
initRouteCardSteppers();
