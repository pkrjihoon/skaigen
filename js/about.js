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


function initMessageAccordion() {
    const list = document.querySelector('.sec_message .message_list');
    if (!list) return;

    const MODE = 'multiple';
    const DEFAULT_OPEN_INDEX = [0];

    const items = [...list.querySelectorAll('.message_item')];
    const mq = window.matchMedia('(max-width: 768px)');

    function openItem(item) {
        const content = item.querySelector('.message_content');
        item.classList.add('open');
        item.querySelector('.message_title').setAttribute('aria-expanded', 'true');
        content.style.maxHeight = content.scrollHeight + 'px';
    }

    function closeItem(item) {
        const content = item.querySelector('.message_content');
        item.classList.remove('open');
        item.querySelector('.message_title').setAttribute('aria-expanded', 'false');
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
        // PC로 전환 시, 혹시 모바일에서 건드려놨던 인라인 스타일/클래스 싹 정리
        items.forEach((item) => {
            item.classList.remove('open');
            item.querySelector('.message_content').style.maxHeight = '';
            item.querySelector('.message_title').setAttribute('aria-expanded', 'true');
        });
    }

    items.forEach((item) => {
        const btn = item.querySelector('.message_title');
        btn.addEventListener('click', () => {
            if (mq.matches) toggleItem(item); // 모바일일 때만 클릭 반응
        });
    });

    // 초기 진입 시: 모바일이면만 아코디언 세팅, PC면 아무것도 안 건드림 (CSS가 이미 처리)
    if (mq.matches) {
        setupMobile();
    }

    mq.addEventListener('change', (e) => {
        if (e.matches) {
            setupMobile(); // 모바일로 전환
        } else {
            teardownDesktop(); // PC로 전환 시 인라인 스타일 정리
        }
    });
}

initWhoCardTap();
initMessageAccordion();
