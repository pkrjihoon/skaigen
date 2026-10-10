// 키비주얼: PC는 이미지가 뜨면 장막 빛 효과 1회(재생 버튼으로 다시 보기), 모바일은 01 → 02 → 03 장면 자동 전환(이전·다음·재생/일시정지·스와이프)
// 화면 밖·다른 탭에서는 멈추고, 동작 줄이기 설정이면 자동 전환 없이 정지 화면
function initKvMotion() {
	const section = document.querySelector('.sec_kv');
	if (!section) return;
	const stage = section.querySelector('.kv_stage');
	const base = section.querySelector('.kv_base_img');
	const basePicture = section.querySelector('.kv_base');
	const frames = [base, ...section.querySelectorAll('.kv_frame')];
	const captions = [...section.querySelectorAll('[data-caption]')];
	const controls = section.querySelector('.kv_controls');
	const prev = section.querySelector('.kv_prev');
	const next = section.querySelector('.kv_next');
	const play = section.querySelector('.kv_play');
	const position = section.querySelector('.kv_position');
	const announce = section.querySelector('.kv_announce');
	const curtain = section.querySelector('.kv_curtain');
	const replay = section.querySelector('.kv_replay');
	const mobile = window.matchMedia('(max-width: 768px)');
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
	const labels = ['익숙한 길을 넘어', '새로운 길을 만들어가다', '새로운 길을 만들어가다'];
	const last = frames.length - 1;
	const duration = 3600; // 장면 하나 머무는 시간
	const fade = 500; // 장면 전환 시간 (short.css kv_reveal)
	const loaded = new Map();
	let index = 0;
	let wanted = !reduced.matches; // 사용자가 자동 전환을 원하는지
	let inView = true;
	let busy = false;
	let finished = false;
	let timer = null;
	let startedAt = 0;
	let remaining = duration;
	let pcPlayed = false;
	let request = 0;
	let touchStart = null;
	let fadeTimer = null;
	let fadeLeft = fade;
	let fadeStarted = 0;
	let fadeDone = null;

	function eligible() {
		return mobile.matches && wanted && !reduced.matches && inView && !document.hidden && !finished && !busy;
	}

	function stopClock() {
		if (timer === null) return;
		clearTimeout(timer);
		timer = null;
		remaining = Math.max(0, remaining - (performance.now() - startedAt));
	}

	function updateControls() {
		controls.hidden = !mobile.matches;
		replay.hidden = mobile.matches || reduced.matches;
		play.hidden = reduced.matches;
		prev.disabled = busy || index === 0;
		next.disabled = busy || index === last;
		play.disabled = busy;
		position.textContent = `${index + 1} / ${last + 1}`;
		const running = eligible();
		play.textContent = finished ? '다시 재생' : running ? '일시정지' : '재생';
		play.setAttribute('aria-pressed', String(!running));
		play.setAttribute('aria-label', finished ? '첫 장면부터 다시 재생' : running ? '자동 장면 전환 일시정지' : '자동 장면 전환 재생');
		section.dataset.visible = String(inView && !document.hidden);
		section.dataset.slide = String(index);
	}

	// 모바일 02·03 장면 이미지는 필요할 때 data-src로 불러옴
	function ensureImage(i) {
		const img = frames[i];
		if (!img) return Promise.resolve();
		if (loaded.has(i)) return loaded.get(i);
		const promise = new Promise((resolve, reject) => {
			if (img.complete && img.naturalWidth > 0) {
				resolve();
				return;
			}
			img.addEventListener('load', () => (img.naturalWidth > 0 ? resolve() : reject(new Error('image unavailable'))), { once: true });
			img.addEventListener('error', () => reject(new Error('image unavailable')), { once: true });
			if (i > 0) {
				img.loading = 'eager';
				if (!img.getAttribute('src') || (img.complete && !img.naturalWidth)) img.src = img.dataset.src;
			}
		});
		loaded.set(i, promise);
		promise.catch(() => loaded.delete(i));
		return promise;
	}

	function settleFrames() {
		frames.forEach((frame, i) => {
			frame.classList.remove('is-entering');
			if (i > 0) frame.hidden = !mobile.matches || i !== index;
		});
		basePicture.classList.remove('is-entering');
		base.style.visibility = !mobile.matches || index === 0 ? 'visible' : 'hidden';
	}

	function pauseFade() {
		if (fadeTimer === null) return;
		clearTimeout(fadeTimer);
		fadeTimer = null;
		fadeLeft = Math.max(0, fadeLeft - (performance.now() - fadeStarted));
	}

	function runFade() {
		if (!busy || !fadeDone || !inView || document.hidden || !mobile.matches) return;
		fadeStarted = performance.now();
		fadeTimer = setTimeout(fadeDone, fadeLeft);
	}

	function cancelFade() {
		pauseFade();
		fadeDone = null;
		fadeLeft = fade;
		busy = false;
		settleFrames();
	}

	function preloadNext() {
		if (!mobile.matches || index >= last || !inView) return;
		ensureImage(index + 1).catch(() => {});
	}

	// PC 장막 빛 효과: 이미지가 화면에 보일 때 한 번
	function playCurtain() {
		if (mobile.matches || pcPlayed || reduced.matches || !inView || document.hidden || !base.complete || !base.naturalWidth) return;
		pcPlayed = true;
		curtain.classList.add('is-playing');
	}

	function sync() {
		stopClock();
		pauseFade();
		updateControls();
		playCurtain();
		runFade();
		if (!eligible() || !base.complete || !base.naturalWidth) return;
		startedAt = performance.now();
		timer = setTimeout(() => {
			timer = null;
			remaining = 0;
			go(index + 1, false);
		}, remaining);
		preloadNext();
	}

	async function go(target, manual) {
		if (!mobile.matches || busy || target < 0 || target > last || target === index) return;
		stopClock();
		if (manual) wanted = false;
		const token = ++request;
		try {
			await ensureImage(target);
		} catch (e) {
			if (token === request) {
				wanted = false;
				announce.textContent = '장면을 불러오지 못했습니다. 다시 시도해 주세요.';
				sync();
			}
			return;
		}
		if (token !== request || !mobile.matches || (!manual && (!inView || document.hidden || !wanted || reduced.matches))) return;
		stopClock();
		busy = true;
		index = target;
		remaining = duration;
		finished = index === last;
		captions.forEach((caption, i) => { caption.hidden = i !== index; });
		const incoming = frames[index];
		if (index > 0) incoming.hidden = false;
		if (index === 0) base.style.visibility = 'visible';
		if (!reduced.matches) (index === 0 ? basePicture : incoming).classList.add('is-entering');
		else settleFrames();
		updateControls();
		const complete = () => {
			settleFrames();
			busy = false;
			fadeTimer = null;
			fadeDone = null;
			fadeLeft = fade;
			if (manual) announce.textContent = `${index + 1}번째 장면. ${labels[index]}`;
			sync();
		};
		if (reduced.matches) {
			complete();
		} else {
			fadeDone = complete;
			fadeLeft = fade;
			runFade();
		}
	}

	prev.addEventListener('click', () => go(index - 1, true));
	next.addEventListener('click', () => go(index + 1, true));
	play.addEventListener('click', async () => {
		if (busy) return;
		if (finished) {
			finished = false;
			await go(0, true);
			wanted = !reduced.matches;
			remaining = duration;
			sync();
			return;
		}
		wanted = !wanted;
		remaining = remaining || duration;
		sync();
	});
	controls.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			go(index - 1, true);
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			go(index + 1, true);
		}
	});
	// 좌우 스와이프 (세로 스크롤은 그대로)
	stage.addEventListener('touchstart', (e) => {
		if (!mobile.matches || e.touches.length !== 1) return;
		touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
	}, { passive: true });
	stage.addEventListener('touchend', (e) => {
		if (!touchStart || !mobile.matches) return;
		const touch = e.changedTouches[0];
		const dx = touch.clientX - touchStart.x;
		const dy = touch.clientY - touchStart.y;
		touchStart = null;
		if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1), true);
	}, { passive: true });
	// 키보드로 KV 안에 들어오면 자동 전환 멈춤 (재생 버튼 제외)
	section.addEventListener('focusin', (e) => {
		if (e.target === play) return;
		wanted = false;
		sync();
	});
	replay.addEventListener('click', () => {
		if (reduced.matches) return;
		curtain.classList.remove('is-playing');
		requestAnimationFrame(() => curtain.classList.add('is-playing'));
	});
	curtain.addEventListener('animationend', () => curtain.classList.remove('is-playing'));
	document.addEventListener('visibilitychange', sync);
	mobile.addEventListener('change', () => {
		++request;
		cancelFade();
		sync();
	});
	reduced.addEventListener('change', () => {
		wanted = !reduced.matches && !finished;
		if (reduced.matches) {
			++request;
			curtain.classList.remove('is-playing');
			cancelFade();
		}
		sync();
	});
	base.addEventListener('load', () => {
		loaded.set(0, Promise.resolve());
		sync();
	});
	window.addEventListener('pagehide', () => {
		stopClock();
		pauseFade();
		section.dataset.visible = 'false';
	});
	window.addEventListener('pageshow', sync);
	if ('IntersectionObserver' in window) {
		new IntersectionObserver((entries) => {
			inView = entries[0].isIntersecting;
			sync();
		}, { threshold: .1 }).observe(section);
	}
	sync();
}

// 헤더 메뉴: 보고 있는 섹션 표시(aria-current), 모바일 메뉴는 항목을 누르면 닫힘
function initAnchorNav() {
	const header = document.querySelector('.header');
	if (!header) return;
	const links = header.querySelectorAll('.header_nav a, .header_mobile_nav nav a');
	const groups = { sec_why: 'sec_about', sec_makers: 'sec_about' };
	const sections = [...document.querySelectorAll('.wrap section[id]')];

	function update() {
		const line = header.getBoundingClientRect().height + 130;
		let current = '';
		sections.forEach((section) => {
			if (section.getBoundingClientRect().top <= line) current = section.id;
		});
		const target = '#' + (groups[current] || current);
		links.forEach((link) => {
			const active = link.getAttribute('href') === target;
			link.classList.toggle('active', active);
			if (!link.className) link.removeAttribute('class'); // 빈 class="" 남지 않게
			if (active) link.setAttribute('aria-current', 'location');
			else link.removeAttribute('aria-current');
		});
	}

	let ticking = false;
	window.addEventListener('scroll', () => {
		if (ticking) return;
		ticking = true;
		requestAnimationFrame(() => {
			update();
			ticking = false;
		});
	}, { passive: true });
	window.addEventListener('resize', update);
	update();
}

// 아코디언 (연차별·FAQ 공통): 목록에 data-mode="single"(하나만 열림) / "multiple"(여러 개 열림)
// 항목 안의 첫 번째 button[aria-controls]로 열고 닫음, 열리면 항목에 is-open
function initAccordion(listSelector, itemSelector) {
	document.querySelectorAll(listSelector).forEach((list) => {
		const single = list.dataset.mode === 'single';
		const items = [...list.querySelectorAll(itemSelector)];

		function setOpen(item, open) {
			const button = item.querySelector('button[aria-controls]');
			const panel = button && document.getElementById(button.getAttribute('aria-controls'));
			if (!panel) return;
			item.classList.toggle('is-open', open);
			button.setAttribute('aria-expanded', String(open));
			panel.hidden = !open;
		}

		items.forEach((item) => {
			setOpen(item, false);
			const button = item.querySelector('button[aria-controls]');
			if (!button) return;
			button.addEventListener('click', () => {
				const open = !item.classList.contains('is-open');
				if (open && single) items.forEach((other) => { if (other !== item) setOpen(other, false); });
				setOpen(item, open);
			});
		});
	});
}

// 모집 카운트다운: data-countdown 시각(KST) 전에는 남은 일·시간·분·초, 지나면 '모집 기간' → data-end-date(KST) 다음 날부터 '모집 기간 종료'
// 스크립트가 없으면 HTML 그대로 접수 일정(11.01–11.15)만 보임
function initCountdown() {
	const box = document.querySelector('[data-countdown]');
	if (!box) return;
	const target = Date.parse(box.dataset.countdown);
	if (!Number.isFinite(target)) return;
	const label = box.querySelector('.count_label');
	const value = box.querySelector('.count_value');
	const clock = box.querySelector('.count_list');
	const units = ['d', 'h', 'm', 's'].map((unit) => clock.querySelector(`[data-unit="${unit}"]`));
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
	const dayIndex = (iso) => {
		const [y, m, d] = iso.split('-').map(Number);
		return Date.UTC(y, m - 1, d) / 86400000;
	};
	const end = dayIndex(box.dataset.endDate);
	const seoul = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
	let timeout;
	let first = true;

	// 글자가 바뀔 때만 교체, 숫자는 살짝 올라오는 효과 (첫 표시·동작 줄이기 제외)
	function put(node, text, animate) {
		if (node.textContent === text) return;
		node.textContent = text;
		if (!animate || first || reduced.matches || typeof node.animate !== 'function') return;
		node.getAnimations().forEach((animation) => animation.cancel());
		node.animate([{ opacity: .65, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'ease-out' });
	}

	function update() {
		if (document.hidden) return;
		const now = Date.now();
		const parts = Object.fromEntries(seoul.formatToParts(new Date(now)).map((part) => [part.type, part.value]));
		const today = dayIndex(`${parts.year}-${parts.month}-${parts.day}`);
		const left = Math.max(0, Math.ceil((target - now) / 1000));
		if (left > 0) {
			put(label, '모집 시작일 11월 1일까지');
			const amounts = [Math.floor(left / 86400), Math.floor(left % 86400 / 3600), Math.floor(left % 3600 / 60), left % 60];
			units.forEach((unit, i) => put(unit, i === 0 ? String(amounts[i]) : String(amounts[i]).padStart(2, '0'), true));
			value.hidden = true;
			clock.hidden = false;
		} else {
			put(label, '2026.11.01–11.15');
			put(value, today <= end ? '모집 기간' : '모집 기간 종료');
			value.hidden = false;
			clock.hidden = true;
		}
		first = false;
		timeout = setTimeout(update, 1000 - now % 1000);
	}

	document.addEventListener('visibilitychange', () => {
		clearTimeout(timeout);
		update();
	});
	window.addEventListener('pagehide', () => clearTimeout(timeout));
	window.addEventListener('pageshow', () => {
		clearTimeout(timeout);
		update();
	});
	update();
}

// 스크롤 등장: 요소가 화면에 15% 이상 들어오면 한 번 아래에서 떠오름, 같은 묶음 안 항목은 0.1초씩 차례로 (최대 0.4초)
// 숨김 상태는 JS가 붙이는 html.js-reveal + .reveal에서만 → 스크립트가 실패하면 처음부터 다 보임, 동작 줄이기면 효과 없음
function initScrollReveal() {
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
	if (reduced.matches || !('IntersectionObserver' in window)) return;
	// 이 묶음은 안쪽 항목을 하나씩 등장시킴 (그 외 요소는 통째로)
	const groups = '.title_split, .split, .journey_cultivation, .problem_box, .problem_list, .card_list, .support_list, .movie_list, .loop_list, .journey_overview, .year_list, .persona_list, .apply_top, .apply_facts, .faq_layout, .faq_list';
	const targets = [];

	function collect(el, index) {
		if (el.matches('.apply_steps')) return; // 모집·선발 절차는 아래 별도 순차 등장
		if (el.matches(groups)) {
			[...el.children].forEach(collect);
			return;
		}
		el.style.setProperty('--reveal-delay', `${Math.min(index * .1, .4)}s`);
		targets.push(el);
	}
	document.querySelectorAll('.wrap section:not(.sec_kv) > .inner_1680').forEach((inner) => [...inner.children].forEach((el) => collect(el, 0)));

	function show(el) {
		if (el.classList.contains('is-show')) return;
		el.classList.add('is-show');
		observer.unobserve(el);
		// 끝나면 클래스를 지워 원래 transition(버튼 hover 등)으로 복귀
		el.addEventListener('transitionend', function done(e) {
			if (e.target !== el || e.propertyName !== 'transform') return;
			el.removeEventListener('transitionend', done);
			el.classList.remove('reveal', 'is-show');
			el.style.removeProperty('--reveal-delay');
			cleanAttrs(el);
		});
	}

	// 효과가 끝난 뒤 빈 class=""·style="" 이 남지 않게
	function cleanAttrs(el) {
		if (!el.getAttribute('style')) el.removeAttribute('style');
		if (!el.getAttribute('class')) el.removeAttribute('class');
	}

	function showAll() {
		targets.forEach(show);
	}

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) show(entry.target);
		});
	}, { threshold: .15, rootMargin: '0px 0px -10% 0px' });

	// 모집·선발 절차 (클론과 동일): 목록이 화면 끝에 닿으면 STEP 카드 6개가 0.7초 간격으로 하나씩 떠오름 (미리 숨기지 않음)
	const steps = document.querySelector('.sec_apply .apply_steps ol');
	if (steps) {
		const stepObserver = new IntersectionObserver((entries) => {
			if (!entries[0].isIntersecting) return;
			stepObserver.disconnect();
			[...steps.children].forEach((li, i) => {
				li.style.setProperty('--step-delay', `${(i * .7).toFixed(1)}s`);
				li.classList.add('is-step');
				li.addEventListener('animationend', () => {
					li.classList.remove('is-step');
					li.style.removeProperty('--step-delay');
					cleanAttrs(li);
				}, { once: true });
			});
		}, { threshold: .01, rootMargin: '0px 0px -3% 0px' });
		stepObserver.observe(steps);
	}

	targets.forEach((el) => el.classList.add('reveal'));
	document.documentElement.classList.add('js-reveal');
	// 처음 보이는 요소도 숨김 상태를 한 번 그린 뒤 관찰 시작 → 로드 후 부드럽게 등장
	requestAnimationFrame(() => requestAnimationFrame(() => targets.forEach((el) => observer.observe(el))));

	// 키보드 포커스가 들어간 곳은 바로 보이게, 동작 줄이기로 바뀌면 전부 보이게
	document.addEventListener('focusin', (e) => {
		const el = e.target.closest && e.target.closest('.reveal');
		if (el) show(el);
	});
	reduced.addEventListener('change', (e) => { if (e.matches) showAll(); });
	window.addEventListener('beforeprint', showAll);
}

document.addEventListener('DOMContentLoaded', () => {
	initKvMotion();
	initAnchorNav();
	initAccordion('.sec_journey .year_list', '.year_item');
	initAccordion('.sec_faq .faq_list', '.faq_item');
	initCountdown();
	initScrollReveal();
});
