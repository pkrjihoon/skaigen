function initHeaderToggle() {
    const header = document.querySelector('.header');
    if (!header) return; // 헤더가 없는 페이지 방어

    const toggleBtn = header.querySelector('.header_toggle');
    if (!toggleBtn) return; // 버튼 없는 경우 방어

    const toggleLabel = toggleBtn.querySelector('.blind');

    function closeHeader() {
        header.classList.remove('is-active');
        toggleBtn.setAttribute('aria-expanded', 'false');
        if (toggleLabel) toggleLabel.textContent = '메뉴 열기';
    }

    function openHeader() {
        header.classList.add('is-active');
        toggleBtn.setAttribute('aria-expanded', 'true');
        if (toggleLabel) toggleLabel.textContent = '메뉴 닫기';
    }

    // 페이지 진입 시 항상 닫힌 상태로 초기화
    // (뒤로가기로 복원된 페이지도 여기서 강제로 리셋됨)
    closeHeader();

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = header.classList.contains('is-active');
        isActive ? closeHeader() : openHeader();
    });

    document.addEventListener('click', (e) => {
        if (!header.classList.contains('is-active')) return;
        if (header.contains(e.target)) return;
        closeHeader();
    });

    // 모바일 메뉴 항목·팝업 여는 버튼을 누르면 닫힘
    header.querySelectorAll('.header_mobile_nav a').forEach((link) => link.addEventListener('click', closeHeader));
    document.querySelectorAll('[data-popup-open]').forEach((button) => button.addEventListener('click', closeHeader));

    // PC 폭으로 넓어지면 닫힘
    window.matchMedia('(min-width: 769px)').addEventListener('change', (e) => {
        if (e.matches) closeHeader();
    });

    // ESC 키로도 닫히게 (선택사항이지만 접근성에 좋음)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && header.classList.contains('is-active')) {
            closeHeader();
        }
    });
}

function initExploreCardTap() {
    const cards = document.querySelectorAll('.sec_explore .explore_list li');
    cards.forEach((card) => {
        card.addEventListener('click', () => {
            card.classList.add('is-tapped');
            setTimeout(() => {
                card.classList.remove('is-tapped');
            }, 300);
        });
    });
}

let isPopupInitialized = false;

function initPopup() {
    const popups = document.querySelectorAll('[data-popup]');
    if (!popups.length) return;

    // 뒤로가기로 복원됐을 때 열려 있던 팝업은 닫힌 상태로 리셋
    popups.forEach((popup) => {
        popup.classList.remove('is-active');
        popup.setAttribute('aria-hidden', 'true');
    });
    document.body.classList.remove('is-popup-open');
    const wrapEl = document.querySelector('.wrap');
    if (wrapEl) wrapEl.style.position = wrapEl.style.top = wrapEl.style.left = wrapEl.style.width = '';

    if (isPopupInitialized) return;
    isPopupInitialized = true;

    let lastFocusedElement = null;
    let savedScrollY = 0;

    // 팝업이 열리면 본문(.wrap)을 지금 보이는 위치·폭 그대로 화면에 고정 → 페이지가 멈추고 스크롤바만 사라짐
    function lockScroll() {
        const wrap = document.querySelector('.wrap');
        if (!wrap) return;
        savedScrollY = window.scrollY;
        wrap.style.setProperty('--scrollbar-w', `${window.innerWidth - document.documentElement.clientWidth}px`); // 사라질 스크롤바 폭 (common.css .is-popup-open .wrap)
        wrap.style.width = `${wrap.offsetWidth}px`;
        wrap.style.position = 'fixed';
        wrap.style.top = `-${savedScrollY}px`;
        wrap.style.left = '0';
    }

    function unlockScroll() {
        const wrap = document.querySelector('.wrap');
        if (!wrap) return;
        wrap.style.position = wrap.style.top = wrap.style.left = wrap.style.width = '';
        wrap.style.removeProperty('--scrollbar-w');
        window.scrollTo({ top: savedScrollY, behavior: 'instant' });
    }

    function openPopup(popup) {
        lastFocusedElement = document.activeElement;
        lockScroll();
        popup.classList.add('is-active');
        popup.setAttribute('aria-hidden', 'false');
        document.body.classList.add('is-popup-open');

        const closeButton = popup.querySelector('.btn_popup_close');
        if (closeButton) closeButton.focus();
    }

    function closePopup(popup) {
        if (!popup) return;
        popup.classList.remove('is-active');
        popup.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('is-popup-open');
        unlockScroll();

        if (lastFocusedElement) lastFocusedElement.focus({ preventScroll: true });
    }

    // 버튼이 나중에 추가돼도 동작하도록 document에 한 번만 위임
    document.addEventListener('click', (e) => {
        const openButton = e.target.closest('[data-popup-open]');
        if (openButton) {
            e.preventDefault();
            const popup = document.querySelector(`[data-popup="${openButton.dataset.popupOpen}"]`);
            if (popup) openPopup(popup);
            return;
        }

        // X 버튼, 딤 클릭 시 닫기
        const closeTarget = e.target.closest('[data-popup-close]');
        if (closeTarget) closePopup(closeTarget.closest('[data-popup]'));
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        closePopup(document.querySelector('[data-popup].is-active'));
    });
}



function initApp() {
    initHeaderToggle();
    initExploreCardTap();
    initPopup()
}

// 일반 페이지 로드
document.addEventListener('DOMContentLoaded', initApp);

// 뒤로가기/앞으로가기로 bfcache에서 복원될 때도 다시 초기화
// (persisted가 true면 브라우저가 새로 로드하지 않고 캐시에서 꺼낸 것)
window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
        initApp();
    }
});
