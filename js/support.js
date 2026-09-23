function initBenefitAccordion() {
    const lists = document.querySelectorAll('.sec_benefits .benefit_list');
    if (!lists.length) return;

    const MODE = 'multiple';       // 'single' 또는 'multiple'
    const DEFAULT_OPEN_INDEX = []; // 모바일 진입 시 기본으로 열릴 항목 인덱스, 카드별로 공통 적용됨

    const mq = window.matchMedia('(max-width: 768px)');

    lists.forEach((list) => {
        const items = [...list.querySelectorAll('.benefit_item')];

        function openItem(item) {
            const content = item.querySelector('.item_content');
            item.classList.add('open');
            item.querySelector('.item_title_btn').setAttribute('aria-expanded', 'true');
            content.style.maxHeight = content.scrollHeight + 'px';
        }

        function closeItem(item) {
            const content = item.querySelector('.item_content');
            item.classList.remove('open');
            item.querySelector('.item_title_btn').setAttribute('aria-expanded', 'false');
            content.style.maxHeight = '';
        }

        function toggleItem(item) {
            const isOpen = item.classList.contains('open');

            if (MODE === 'single' && !isOpen) {
                items.forEach((other) => {
                    if (other !== item && other.classList.contains('open')) closeItem(other);
                });
            }

            isOpen ? closeItem(item) : openItem(item);
        }

        function setupMobile() {
            items.forEach((item, idx) => {
                DEFAULT_OPEN_INDEX.includes(idx) ? openItem(item) : closeItem(item);
            });
        }

        function teardownDesktop() {
            items.forEach((item) => {
                item.classList.remove('open');
                item.querySelector('.item_content').style.maxHeight = '';
                item.querySelector('.item_title_btn').setAttribute('aria-expanded', 'true');
            });
        }

        items.forEach((item) => {
            const btn = item.querySelector('.item_title_btn');
            btn.addEventListener('click', () => {
                if (mq.matches) toggleItem(item);
            });
        });

        if (mq.matches) {
            setupMobile();
        }

        mq.addEventListener('change', (e) => {
            if (e.matches) {
                setupMobile();
            } else {
                teardownDesktop();
            }
        });

        window.addEventListener('resize', () => {
            items.forEach((item) => {
                if (item.classList.contains('open')) {
                    const content = item.querySelector('.item_content');
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        });
    });
}

// .faq_list의 data-mode 값("single" 또는 "multiple")에 따라 기능수정
function initFaqSection() {
    const faqSection = document.querySelector('.sec_faq');
    if (!faqSection) return;

    const tabs = [...faqSection.querySelectorAll('.faq_tab')];
    const list = faqSection.querySelector('.faq_list');
    const mode = list.dataset.mode || 'multiple';
    const items = [...list.querySelectorAll('.faq_item')];

    function showCategory(category) {
        items.forEach((item) => {
            item.hidden = item.dataset.cat !== category;
        });

        // 카테고리 전환으로 다시 보이게 된 항목 중 열려있는 게 있으면 높이 재계산
        // (숨겨진(hidden) 동안엔 scrollHeight가 부정확하게 잡히기 때문)
        items.forEach((item) => {
            if (!item.hidden && item.classList.contains('open')) {
                const answer = item.querySelector('.faq_answer');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    }

    function openItem(item) {
        const answer = item.querySelector('.faq_answer');
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
    }

    function closeItem(item) {
        const answer = item.querySelector('.faq_answer');
        answer.style.maxHeight = '0px';
        item.classList.remove('open');
    }

    function toggleItem(item) {
        const isOpen = item.classList.contains('open');

        if (mode === 'single' && !isOpen) {
            items.forEach((other) => {
                if (other !== item && other.classList.contains('open')) closeItem(other);
            });
        }

        isOpen ? closeItem(item) : openItem(item);
    }

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((t) => t.classList.toggle('active', t === tab));
            showCategory(tab.dataset.cat);
        });
    });

    items.forEach((item) => {
        const questionBtn = item.querySelector('.faq_question');
        questionBtn.addEventListener('click', () => toggleItem(item));
    });

    // 처음한번 첫번쨰거열어놓기
    const firstCategory = tabs[0].dataset.cat;
    showCategory(firstCategory);

    const firstItem = items.find((item) => item.dataset.cat === firstCategory);
    if (firstItem) openItem(firstItem);

    // 전부열게하기
    // const firstCategoryItems = items.filter((item) => item.dataset.cat === firstCategory);
    // firstCategoryItems.forEach((item) => openItem(item));

    // 창 크기 변경 시, 열려있는 항목의 높이를 다시 계산 (benefit_list와 동일한 처리)
    window.addEventListener('resize', () => {
        items.forEach((item) => {
            if (item.classList.contains('open')) {
                const answer = item.querySelector('.faq_answer');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });
}

initBenefitAccordion();
initFaqSection();
