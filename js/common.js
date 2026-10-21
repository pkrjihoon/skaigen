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

    // data-popup-auto 팝업은 첫 진입 때 한 번 자동으로 열기 (뒤로가기 복원 때는 다시 열지 않음)
    const autoPopup = document.querySelector('[data-popup-auto]');
    if (autoPopup && !autoPopupShown) {
        autoPopupShown = true;
        getBriefingWait().then((wait) => {
            if (wait <= 0) return; // 설명회 신청 마감(BRIEFING_CLOSE) 후엔 자동으로 띄우지 않음
            // #sec_people 처럼 해시로 들어오면 그 영역까지 스크롤이 끝난 뒤 팝업 (닫으면 그 위치에 남음)
            const hashTarget = location.hash && document.getElementById(location.hash.slice(1));
            if (hashTarget) {
                let opened = false;
                const openAuto = () => {
                    if (opened) return;
                    opened = true;
                    openPopup(autoPopup);
                };
                window.addEventListener('scrollend', openAuto, { once: true });
                setTimeout(openAuto, 1500); // scrollend 미지원 브라우저·이미 그 위치일 때 대비
                hashTarget.scrollIntoView({ behavior: 'smooth' });
            } else {
                openPopup(autoPopup);
            }
        });
    }
}
let autoPopupShown = false;

// // 설명회 신청 오픈 시각 (한국 시간) : 년, 월, 일, 시, 분
// const BRIEFING_OPEN = [2026, 10, 15, 15, 0];
// // 설명회 신청 링크 : HTML에 미리 두지 않고 오픈 시각이 되면 넣음 (Elements 탭에서 미리 안 보이게)
// const BRIEFING_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeoZ7pw0ZPJbXRhdoCLTacCkqwYVAU2M2Jb01qN5VpnCpkvQA/viewform?pli=1';

// // 오픈 시각이 되면 안내 문구·확인 버튼 → 신청 링크
// // 서버 응답의 Date 헤더 기준, 못 읽으면(파일로 열기·네트워크 오류) 사용자 PC 시계로 대신함
// async function initBriefingOpen() {
//     const popup = document.querySelector('[data-briefing-link]')?.closest('[data-popup]');
//     if (!popup || popup.dataset.briefingReady) return;
//     popup.dataset.briefingReady = 'true';

//     let serverNow = NaN;
//     try {
//         const res = await fetch(location.href, { method: 'HEAD', cache: 'no-store' });
//         // CloudFront 캐시 응답은 Date가 캐시된 시각이라, 캐시된 뒤 지난 초(Age)를 더해야 지금 시각
//         serverNow = Date.parse(res.headers.get('Date')) + (Number(res.headers.get('Age')) || 0) * 1000;
//     } catch (e) {}
//     if (Number.isNaN(serverNow)) serverNow = Date.now();

//     const show = () => {
//         popup.querySelector('.popup_note').hidden = true;
//         popup.querySelector('button.btn_popup_confirm').hidden = true;
//         const link = popup.querySelector('[data-briefing-link]');
//         link.href = BRIEFING_URL;
//         link.hidden = false;
//     };
//     const [year, month, day, hour, minute] = BRIEFING_OPEN;
//     const openAt = Date.UTC(year, month - 1, day, hour - 9, minute); // 한국 시간 = UTC+9
//     const wait = openAt - serverNow;
//     // ponytail: 탭이 오래 잠들면 타이머가 늦을 수 있음, 필요하면 visibilitychange 때 다시 확인
//     wait <= 0 ? show() : setTimeout(show, wait);
// }



// 설명회 신청 마감 시각 (한국 시간) : 년, 월, 일, 시, 분
// 이 시각부터 첫 진입 자동 팝업 안 뜸 + 신청 링크 제거 → 비활성 '신청이 완료되었습니다' 버튼
const BRIEFING_CLOSE = [2026, 10, 23, 0, 0];

// 마감까지 남은 ms (0 이하면 마감). 자동 팝업·마감 처리가 같이 쓰도록 서버 요청은 한 번만
// 서버 응답의 Date 헤더 기준(CloudFront 캐시면 Age만큼 더함), 못 읽으면 사용자 PC 시계로 대신함
let briefingWaitPromise = null;
function getBriefingWait() {
    briefingWaitPromise = briefingWaitPromise || (async () => {
        let serverNow = NaN;
        try {
            const res = await fetch(location.href, { method: 'HEAD', cache: 'no-store' });
            serverNow = Date.parse(res.headers.get('Date')) + (Number(res.headers.get('Age')) || 0) * 1000;
        } catch (e) {}
        if (Number.isNaN(serverNow)) serverNow = Date.now();
        const [year, month, day, hour, minute] = BRIEFING_CLOSE;
        return Date.UTC(year, month - 1, day, hour - 9, minute) - serverNow; // 한국 시간 = UTC+9
    })();
    return briefingWaitPromise;
}

async function initBriefingClose() {
    const link = document.querySelector('[data-briefing-link]');
    const popup = link?.closest('[data-popup]');
    if (!popup || popup.dataset.briefingReady) return;
    popup.dataset.briefingReady = 'true';

    const close = () => {
        link.remove(); // 숨기지 않고 지움 (Elements 탭에서 링크가 안 보이게)
        popup.querySelector('.popup_deadline')?.remove();
        popup.querySelector('button.btn_popup_confirm').hidden = false;
    };
    const wait = await getBriefingWait();
    // ponytail: 탭이 오래 잠들면 타이머가 늦을 수 있음, 필요하면 visibilitychange 때 다시 확인
    wait <= 0 ? close() : setTimeout(close, wait);
}

function initApp() {
    initHeaderToggle();
    initExploreCardTap();
    initPopup()
    initBriefingClose();
    // initBriefingOpen();
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
