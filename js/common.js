function initHeaderToggle() {
    const header = document.querySelector('.header');
    if (!header) return; // 헤더가 없는 페이지 방어

    const toggleBtn = header.querySelector('.header_toggle');
    if (!toggleBtn) return; // 버튼 없는 경우 방어

    function closeHeader() {
        header.classList.remove('is-active');
        toggleBtn.setAttribute('aria-expanded', 'false');
    }

    function openHeader() {
        header.classList.add('is-active');
        toggleBtn.setAttribute('aria-expanded', 'true');
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

function initApp() {
    initHeaderToggle();
    initExploreCardTap();
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
