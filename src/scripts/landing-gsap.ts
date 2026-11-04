import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

type RevealDir = 'left' | 'right' | 'up';

function revealFrom(dir: RevealDir): { x: number; y: number } {
	if (dir === 'left') return { x: -80, y: 28 };
	if (dir === 'right') return { x: 80, y: 28 };
	return { x: 0, y: 56 };
}

function resolveDir(panel: HTMLElement, index: number): RevealDir {
	const attr = panel.dataset.reveal as RevealDir | undefined;
	if (attr === 'left' || attr === 'right' || attr === 'up') return attr;
	const cycle = index % 3;
	if (cycle === 0) return 'left';
	if (cycle === 1) return 'right';
	return 'up';
}

/** Soft chapter scroll + Monument-style hero curtain + magnetic video cursor. */
export function initLandingGsap(root: ParentNode = document): void {
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const main = root instanceof Element ? root : document.getElementById('contenido');
	if (!main) return;

	// Tear down prior ScrollTriggers + unwrap leftover pin-spacers (HMR / re-mount).
	ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
	main.querySelectorAll('.pin-spacer').forEach((spacer) => {
		const parent = spacer.parentElement;
		if (!parent) return;
		while (spacer.firstChild) parent.insertBefore(spacer.firstChild, spacer);
		spacer.remove();
	});
	main
		.querySelectorAll<HTMLElement>(
			'[data-story-pin], [data-hero-pin], [data-playbooks-pin], [data-playbooks-track], [data-playbooks-card], [data-playbooks-progress], [data-capacity-pin], [data-capacity-track], [data-capacity-card], [data-capacity-progress], [data-story-stage], [data-swap-copy], [data-swap-media], [data-reveal-item], [data-parallax-bg], [data-parallax-content] > *, [data-hero-exit], [data-hero-giant], [data-curtain-left], [data-curtain-right], [data-curtain-top], [data-curtain-bottom], [data-origen-layer]',
		)
		.forEach((node) => {
			gsap.killTweensOf(node);
			gsap.set(node, { clearProps: 'all' });
		});

	initLandingGsapInner(main, reduce);
}

function initLandingGsapInner(main: Element, reduce: boolean): void {
	const panels = gsap.utils.toArray<HTMLElement>(main.querySelectorAll('[data-panel]'));
	const stories = gsap.utils.toArray<HTMLElement>(main.querySelectorAll('[data-story]'));
	const curtainTop = document.querySelector<HTMLElement>('[data-landing-curtain="top"]');
	const curtainBottom = document.querySelector<HTMLElement>('[data-landing-curtain="bottom"]');
	const rail = document.querySelector<HTMLElement>('[data-chapter-rail]');
	const railItems = gsap.utils.toArray<HTMLElement>(document.querySelectorAll('[data-chapter-rail-item]'));

	const clearMotion = () => {
		main
			.querySelectorAll<HTMLElement>(
				'[data-reveal-item], [data-parallax-content] > *, [data-story-stage], [data-hero-exit], [data-hero-giant]',
			)
			.forEach((node) => {
				gsap.set(node, { clearProps: 'all', opacity: 1, y: 0, x: 0, scale: 1 });
			});
		curtainTop?.remove();
		curtainBottom?.remove();
	};

	let activeChapterId: string | undefined;
	const railIds = new Set(
		railItems.map((item) => item.dataset.chapterRailItem).filter((id): id is string => Boolean(id)),
	);

	const setActiveChapter = (id: string | undefined) => {
		if (!railItems.length || !id || !railIds.has(id)) return;
		if (activeChapterId === id) return;
		activeChapterId = id;
		railItems.forEach((item) => {
			const active = item.dataset.chapterRailItem === id;
			item.classList.toggle('is-active', active);
			item.setAttribute('aria-current', active ? 'true' : 'false');
		});
	};

	const heroApi = initHeroCurtain(main, reduce, setActiveChapter);
	initVideoCursor(main, heroApi);
	initAudienceSwitcher(main);
	initHorizontalScrolls(main);
	initFaqAccordion(main);

	if (reduce) {
		clearMotion();
		setActiveChapter(railItems[0]?.dataset.chapterRailItem);
		return;
	}

	if (curtainTop && curtainBottom) {
		gsap.to([curtainTop, curtainBottom], {
			height: 0,
			duration: 1.2,
			ease: 'power2.inOut',
			onComplete: () => {
				curtainTop.remove();
				curtainBottom.remove();
			},
		});
	}

	// Hero / demo / origen are driven by the hero curtain scrub.
	// Post-hero rail chapters use a single scroll probe so pins and sticky
	// stacks stay in sync (avoids missing producto / clearing on plataforma).
	const heroOwned = new Set(['hero', 'demo', 'origen']);
	const postHeroChapters = railItems
		.map((item) => item.dataset.chapterRailItem)
		.filter((id): id is string => Boolean(id) && !heroOwned.has(id))
		.map((id) => ({
			id,
			el: main.querySelector<HTMLElement>(`[data-chapter="${id}"]`),
		}))
		.filter((entry): entry is { id: string; el: HTMLElement } => Boolean(entry.el));

	const syncPostHeroChapter = () => {
		const heroSt = ScrollTrigger.getById('hero-curtain');
		if (heroSt?.isActive) return;

		const line = window.innerHeight * 0.42;
		let next = postHeroChapters[0]?.id;
		for (const entry of postHeroChapters) {
			const rect = entry.el.getBoundingClientRect();
			if (rect.top <= line) next = entry.id;
			if (rect.top <= line && rect.bottom > line) {
				next = entry.id;
				break;
			}
		}
		if (next) setActiveChapter(next);
	};

	ScrollTrigger.create({
		id: 'chapter-rail-sync',
		start: 0,
		end: 'max',
		onUpdate: syncPostHeroChapter,
		onRefresh: syncPostHeroChapter,
	});

	setActiveChapter('hero');

	const scrollYForHash = (hash: string): number | null => {
		const id = hash.replace(/^#/, '');
		if (!id) return null;
		if (id === 'hero') return 0;
		if (id === 'demo') {
			const st = ScrollTrigger.getById('hero-curtain');
			if (!st) {
				const demo = main.querySelector<HTMLElement>('#demo');
				return demo ? demo.getBoundingClientRect().top + window.scrollY : null;
			}
			return st.start + (st.end - st.start) * 0.42;
		}
		if (id === 'origen') {
			const st = ScrollTrigger.getById('hero-curtain');
			if (!st) {
				const origen = main.querySelector<HTMLElement>('#origen');
				return origen ? origen.getBoundingClientRect().top + window.scrollY : null;
			}
			return st.end;
		}
		const target =
			main.querySelector<HTMLElement>(`#${CSS.escape(id)}`) ??
			main.querySelector<HTMLElement>(`[data-chapter="${id}"]`);
		if (!target) return null;
		return target.getBoundingClientRect().top + window.scrollY;
	};

	const ensureNavCurtains = (): [HTMLElement, HTMLElement] => {
		const shell = 'pointer-events-none fixed inset-x-0 z-[100] bg-ink';
		let top = document.querySelector<HTMLElement>('[data-landing-curtain="top"]');
		let bottom = document.querySelector<HTMLElement>('[data-landing-curtain="bottom"]');
		if (!top) {
			top = document.createElement('div');
			top.dataset.landingCurtain = 'top';
			top.className = `${shell} top-0 h-[50vh]`;
			top.setAttribute('aria-hidden', 'true');
			document.body.appendChild(top);
		}
		if (!bottom) {
			bottom = document.createElement('div');
			bottom.dataset.landingCurtain = 'bottom';
			bottom.className = `${shell} bottom-0 h-[50vh]`;
			bottom.setAttribute('aria-hidden', 'true');
			document.body.appendChild(bottom);
		}
		return [top, bottom];
	};

	let curtainNavBusy = false;

	/** Cover with black bars, jump scroll, then open — same entrance as first load. */
	const navigateWithEntrance = (hash: string) => {
		if (curtainNavBusy) return;
		curtainNavBusy = true;

		// Menu locks body scroll; unlock before we jump or the first click is a no-op.
		document.body.classList.remove('overflow-hidden');
		const menuPanel = document.querySelector<HTMLElement>('[data-menu-panel]');
		if (menuPanel?.dataset.open === 'true') {
			menuPanel.dataset.open = 'false';
			menuPanel.setAttribute('aria-hidden', 'true');
			menuPanel.classList.add('pointer-events-none');
			menuPanel.classList.remove('pointer-events-auto');
			menuPanel.style.opacity = '0';
			document.querySelectorAll<HTMLElement>('[data-menu-button]').forEach((button) => {
				button.dataset.open = 'false';
				button.setAttribute('aria-expanded', 'false');
			});
		}

		const [top, bottom] = ensureNavCurtains();
		gsap.killTweensOf([top, bottom, window]);
		gsap.set([top, bottom], { height: '50vh' });

		const jumpToHash = () => {
			const y = scrollYForHash(hash);
			if (y == null) return;
			window.scrollTo(0, Math.max(0, y));
			ScrollTrigger.update();
			const st = ScrollTrigger.getById('hero-curtain');
			const tween = st?.getTween();
			if (!tween) return;
			const id = hash.replace(/^#/, '');
			if (id === 'hero') tween.progress(0);
			else if (id === 'demo') tween.progress(0.42);
			else tween.progress(1);
		};

		const reveal = () => {
			jumpToHash();
			// Pins can shift after the first jump; measure again while still covered.
			jumpToHash();
			const next = `${window.location.pathname}${window.location.search}${hash}`;
			history.replaceState(null, '', next);
			gsap.to([top, bottom], {
				height: 0,
				duration: 1.15,
				ease: 'power2.inOut',
				onComplete: () => {
					top.remove();
					bottom.remove();
					curtainNavBusy = false;
				},
			});
		};

		requestAnimationFrame(() => requestAnimationFrame(reveal));
	};

	railItems.forEach((item) => {
		item.addEventListener('click', (event) => {
			event.preventDefault();
			const id = item.dataset.chapterRailItem;
			if (!id) return;
			if (id === 'demo') {
				heroApi.scrollToDemo();
				return;
			}
			if (scrollYForHash(id) == null) return;
			navigateWithEntrance(`#${id}`);
		});
	});

	const samePath = (pathname: string) =>
		pathname.replace(/\/+$/, '') === window.location.pathname.replace(/\/+$/, '');

	document.querySelectorAll('a[href*="#"]').forEach((link) => {
		if (!(link instanceof HTMLAnchorElement)) return;
		if (link.dataset.curtainNav === '1') return;
		let url: URL;
		try {
			url = new URL(link.href, window.location.href);
		} catch {
			return;
		}
		if (!samePath(url.pathname)) return;
		if (!url.hash || url.hash === '#') return;
		if (scrollYForHash(url.hash) == null) return;
		link.dataset.curtainNav = '1';
		link.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopPropagation();
			navigateWithEntrance(url.hash);
		});
	});

	const backTop = document.querySelector<HTMLAnchorElement>('[data-back-top]');
	if (backTop && backTop.dataset.curtainNav !== '1') {
		backTop.dataset.curtainNav = '1';
		backTop.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopPropagation();
			navigateWithEntrance('#hero');
		});
	}

	if (window.location.hash === '#origen') {
		requestAnimationFrame(() => {
			const y = scrollYForHash('origen');
			if (y == null) return;
			window.scrollTo(0, y);
			ScrollTrigger.getById('hero-curtain')?.getTween()?.progress(1);
		});
	}

	panels.forEach((panel, index) => {
		const bg = panel.querySelector<HTMLElement>('[data-parallax-bg]');
		const marked = panel.querySelectorAll<HTMLElement>('[data-reveal-item]');
		const fallback = panel.querySelectorAll<HTMLElement>('[data-parallax-content] > *');
		const items = marked.length ? marked : fallback;
		const motion = panel.dataset.motion ?? 'styled';

		if (bg) {
			gsap.fromTo(
				bg,
				{ yPercent: -6 },
				{
					yPercent: 6,
					ease: 'none',
					scrollTrigger: {
						trigger: panel,
						start: 'top bottom',
						end: 'bottom top',
						scrub: 1.2,
					},
				},
			);
		}

		if (!items.length) return;

		if (motion === 'plain') {
			gsap.set(items, { opacity: 0, y: 28 });
			gsap.to(items, {
				opacity: 1,
				y: 0,
				duration: 0.7,
				stagger: 0.06,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: panel,
					start: 'top 78%',
					toggleActions: 'play none none reverse',
				},
			});
			return;
		}

		const dir = resolveDir(panel, index);
		const from = revealFrom(dir);
		gsap.set(items, { opacity: 0, x: from.x, y: from.y });
		gsap.to(items, {
			opacity: 1,
			x: 0,
			y: 0,
			duration: 1.05,
			stagger: 0.1,
			ease: 'power3.out',
			scrollTrigger: {
				trigger: panel,
				start: 'top 72%',
				end: 'top 38%',
				toggleActions: 'play none none reverse',
			},
		});
	});

	const desktop = gsap.matchMedia();

	// Mobile/tablet: stacked document flow, no pin/scrub (Monument-simple).
	desktop.add('(max-width: 1023px)', () => {
		stories.forEach((story) => {
			const stages = gsap.utils.toArray<HTMLElement>(story.querySelectorAll('[data-story-stage]'));
			gsap.set(stages, { clearProps: 'all', opacity: 1, x: 0, y: 0, pointerEvents: 'auto' });
			stages.forEach((stage) => {
				const lines = stage.querySelectorAll<HTMLElement>('[data-stage-line]');
				const fill = stage.querySelector<HTMLElement>('[data-platform-fill]');
				const swapCopy = stage.querySelectorAll<HTMLElement>('[data-swap-copy]');
				const swapMedia = stage.querySelectorAll<HTMLElement>('[data-swap-media]');
				if (lines.length) gsap.set(lines, { clearProps: 'all', opacity: 1, y: 0 });
				if (fill) gsap.set(fill, { clearProps: 'clipPath', clipPath: 'none' });
				if (swapCopy.length) gsap.set(swapCopy, { clearProps: 'all', opacity: 1, y: 0 });
				if (swapMedia.length) gsap.set(swapMedia, { clearProps: 'all', opacity: 1, y: 0 });
			});
		});

		main.querySelectorAll<HTMLElement>('[data-capacity-track], [data-playbooks-track]').forEach((track) => {
			gsap.set(track, { clearProps: 'transform', x: 0 });
		});
		main.querySelectorAll<HTMLElement>('[data-capacity-progress], [data-playbooks-progress]').forEach((bar) => {
			gsap.set(bar, { width: '100%' });
		});
	});

	// Desktop: pinned story stages + optional column swaps + horizontal timelines.
	desktop.add('(min-width: 1024px)', () => {
		stories.forEach((story, storyIndex) => {
			const pin = story.querySelector<HTMLElement>('[data-story-pin]');
			const stages = gsap.utils.toArray<HTMLElement>(story.querySelectorAll('[data-story-stage]'));
			if (!pin || stages.length < 2) return;

			const hold = 0.85;
			const fade = 0.55;

			type StoryBeat =
				| { kind: 'hold' }
				| { kind: 'swap'; stage: HTMLElement }
				| { kind: 'enter'; from: HTMLElement; to: HTMLElement }
				| { kind: 'audience'; root: HTMLElement; id: string };

			const appendAudienceBeats = (stage: HTMLElement, list: StoryBeat[]) => {
				const switcher = stage.querySelector<HTMLElement>('[data-audience-switcher]');
				if (!switcher) return;
				const ids = audienceIdsOf(switcher);
				for (let i = 1; i < ids.length; i += 1) {
					list.push({ kind: 'audience', root: switcher, id: ids[i] });
					list.push({ kind: 'hold' });
				}
			};

			const beats: StoryBeat[] = [{ kind: 'hold' }];
			if (stages[0].querySelector('[data-swap-col]')) {
				beats.push({ kind: 'swap', stage: stages[0] });
				beats.push({ kind: 'hold' });
			}
			appendAudienceBeats(stages[0], beats);
			for (let index = 1; index < stages.length; index += 1) {
				beats.push({ kind: 'enter', from: stages[index - 1], to: stages[index] });
				beats.push({ kind: 'hold' });
				if (stages[index].querySelector('[data-swap-col]')) {
					beats.push({ kind: 'swap', stage: stages[index] });
					beats.push({ kind: 'hold' });
				}
				appendAudienceBeats(stages[index], beats);
			}

			gsap.set(stages, { opacity: 0, x: 0, y: 36, pointerEvents: 'none' });
			gsap.set(stages[0], { opacity: 1, x: 0, y: 0, pointerEvents: 'auto' });

			stages.forEach((stage, index) => {
				const lines = stage.querySelectorAll<HTMLElement>('[data-stage-line]');
				const fill = stage.querySelector<HTMLElement>('[data-platform-fill]');
				const swapCopy = stage.querySelectorAll<HTMLElement>('[data-swap-copy]');
				const swapMedia = stage.querySelectorAll<HTMLElement>('[data-swap-media]');
				if (swapCopy.length) gsap.set(swapCopy, { opacity: 1, y: 0 });
				if (swapMedia.length) gsap.set(swapMedia, { opacity: 0, y: 28 });
				if (index === 0) {
					if (lines.length) gsap.set(lines, { opacity: 1, y: 0 });
					if (fill) gsap.set(fill, { clipPath: 'inset(0 0 0% 0)' });
					return;
				}
				if (lines.length) gsap.set(lines, { opacity: 0, y: 28 });
				if (fill) gsap.set(fill, { clipPath: 'inset(0 0 100% 0)' });
			});

			const audienceMarks: { time: number; root: HTMLElement; id: string }[] = [];

			const tl = gsap.timeline({
				scrollTrigger: {
					id: `story-${story.id || storyIndex}`,
					trigger: story,
					start: 'top top',
					end: () => `+=${Math.max(beats.length, stages.length) * 90}%`,
					scrub: 0.95,
					pin: pin,
					anticipatePin: 1,
					invalidateOnRefresh: true,
					onUpdate: () => {
						if (!audienceMarks.length) return;
						const time = tl.time();
						let current = audienceMarks[0];
						for (const mark of audienceMarks) {
							if (time + 0.001 >= mark.time) current = mark;
							else break;
						}
						setAudienceFocus(current.root, current.id);
					},
				},
			});

			let at = 0;
			for (const beat of beats) {
				if (beat.kind === 'hold') {
					tl.to({}, { duration: hold }, at);
					at += hold;
					continue;
				}

				if (beat.kind === 'audience') {
					audienceMarks.push({ time: at, root: beat.root, id: beat.id });
					tl.to({}, { duration: fade * 0.35 }, at);
					at += fade * 0.35;
					continue;
				}

				if (beat.kind === 'swap') {
					const copyEl = beat.stage.querySelectorAll<HTMLElement>('[data-swap-copy]');
					const mediaEl = beat.stage.querySelectorAll<HTMLElement>('[data-swap-media]');
					if (copyEl.length) {
						tl.to(copyEl, { opacity: 0, y: -24, duration: fade, ease: 'none' }, at);
					}
					if (mediaEl.length) {
						tl.to(mediaEl, { opacity: 1, y: 0, duration: fade, ease: 'none' }, at);
					}
					at += fade;
					continue;
				}

				const { from: prev, to: stage } = beat;
				const prevLines = prev.querySelectorAll<HTMLElement>('[data-stage-line]');
				const prevFill = prev.querySelector<HTMLElement>('[data-platform-fill]');
				const lines = stage.querySelectorAll<HTMLElement>('[data-stage-line]');
				const fill = stage.querySelector<HTMLElement>('[data-platform-fill]');
				const switcher = stage.querySelector<HTMLElement>('[data-audience-switcher]');
				if (switcher) {
					const firstId = audienceIdsOf(switcher)[0];
					if (firstId) audienceMarks.push({ time: at, root: switcher, id: firstId });
				}

				gsap.set(stage, { x: 0, y: 36, opacity: 0 });
				tl.to(
					prev,
					{
						opacity: 0,
						x: 0,
						y: -28,
						pointerEvents: 'none',
						duration: fade,
						ease: 'none',
					},
					at,
				);
				if (prevLines.length) {
					tl.to(prevLines, { opacity: 0, y: -18, duration: fade, ease: 'none', stagger: 0.04 }, at);
				}
				if (prevFill) {
					tl.to(prevFill, { clipPath: 'inset(0 0 100% 0)', duration: fade, ease: 'none' }, at);
				}
				tl.to(
					stage,
					{
						opacity: 1,
						x: 0,
						y: 0,
						pointerEvents: 'auto',
						duration: fade,
						ease: 'none',
					},
					at,
				);
				if (lines.length) {
					tl.to(lines, { opacity: 1, y: 0, duration: fade, ease: 'none', stagger: 0.05 }, at);
				}
				if (fill) {
					tl.to(fill, { clipPath: 'inset(0 0 0% 0)', duration: fade, ease: 'none' }, at);
				}
				at += fade;
			}
		});

		initShapeWipes(main);
		initHorizontalTimeline(main, reduce, {
			id: 'capacity-timeline',
			section: '[data-capacity-timeline]',
			pin: '[data-capacity-pin]',
			track: '[data-capacity-track]',
			progress: '[data-capacity-progress]',
			card: '[data-capacity-card]',
		});
		initHorizontalTimeline(main, reduce, {
			id: 'playbooks-timeline',
			section: '[data-playbooks-timeline]',
			pin: '[data-playbooks-pin]',
			track: '[data-playbooks-track]',
			progress: '[data-playbooks-progress]',
			card: '[data-playbooks-card]',
		});

		requestAnimationFrame(() => {
			ScrollTrigger.refresh();
			initStoryTextFills(main);
		});
	});

	if (rail) {
		gsap.set(rail, { opacity: 0, x: 12 });
		ScrollTrigger.create({
			start: 'top -40',
			onUpdate: (self) => {
				gsap.to(rail, {
					opacity: self.scroll() > 80 ? 1 : 0,
					x: self.scroll() > 80 ? 0 : 12,
					duration: 0.35,
					overwrite: 'auto',
				});
			},
		});
	}

	requestAnimationFrame(() => ScrollTrigger.refresh());
}

type HeroApi = {
	scrollToDemo: () => void;
	getProgress: () => number;
};

function initHeroCurtain(
	main: Element,
	reduce: boolean,
	setActiveChapter: (id: string | undefined) => void,
): HeroApi {
	const hero = main.querySelector<HTMLElement>('[data-hero-curtain]');
	const pin = hero?.querySelector<HTMLElement>('[data-hero-pin]');
	const left = hero?.querySelector<HTMLElement>('[data-curtain-left]');
	const right = hero?.querySelector<HTMLElement>('[data-curtain-right]');
	const top = hero?.querySelector<HTMLElement>('[data-curtain-top]');
	const bottom = hero?.querySelector<HTMLElement>('[data-curtain-bottom]');
	const exitsUp = gsap.utils.toArray<HTMLElement>(hero?.querySelectorAll('[data-hero-exit="up"]') ?? []);
	const exitsLeft = gsap.utils.toArray<HTMLElement>(hero?.querySelectorAll('[data-hero-exit="left"]') ?? []);
	const giant = hero?.querySelector<HTMLElement>('[data-hero-giant]');
	const hotspot = hero?.querySelector<HTMLElement>('[data-video-hotspot]');
	const origenLayer = hero?.querySelector<HTMLElement>('[data-origen-layer]');
	const siteHeader = document.querySelector<HTMLElement>('[data-site-header]');

	let progress = 0;

	const setHeaderForDemo = (hidden: boolean) => {
		if (!siteHeader) return;
		siteHeader.dataset.demoHidden = hidden ? 'true' : 'false';
	};

	const scrollToDemo = () => {
		const st = ScrollTrigger.getById('hero-curtain');
		if (!st) {
			const demo = main.querySelector<HTMLElement>('#demo');
			demo?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			return;
		}
		const videoScroll = st.start + (st.end - st.start) * 0.42;
		// autoKill must stay false: the pin/scrub nudges scroll and would cancel the tween.
		gsap.killTweensOf(window);
		gsap.to(window, {
			duration: 0.5,
			ease: 'power3.out',
			scrollTo: { y: videoScroll, autoKill: false },
			overwrite: true,
			onUpdate: () => {
				// Keep curtain in sync with the programmatic scroll (bypass scrub lag).
				st.getTween()?.progress(1);
			},
		});
	};

	const api: HeroApi = {
		scrollToDemo,
		getProgress: () => progress,
	};

	if (!hero || !pin || reduce) return api;

	if (origenLayer) {
		gsap.set(origenLayer, {
			opacity: 1,
			clipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)',
		});
	}

	const tl = gsap.timeline({
		scrollTrigger: {
			id: 'hero-curtain',
			trigger: hero,
			start: 'top top',
			end: '+=320%',
			scrub: 1.15,
			pin: pin,
			anticipatePin: 1,
			invalidateOnRefresh: true,
			onUpdate: (self) => {
				progress = self.progress;
				if (self.progress < 0.3) setActiveChapter('hero');
				else if (self.progress < 0.68) setActiveChapter('demo');
				else setActiveChapter('origen');
				// Hide header while the full-bleed demo video is in focus.
				setHeaderForDemo(self.progress > 0.3 && self.progress < 0.68);
				if (hotspot) {
					const openVideo = self.progress > 0.32 && self.progress < 0.7;
					hotspot.dataset.hotspotMode = openVideo ? 'toggle' : 'scroll';
					hotspot.style.pointerEvents = self.progress > 0.72 ? 'none' : 'auto';
				}
			},
			onLeave: () => setHeaderForDemo(false),
			onLeaveBack: () => setHeaderForDemo(false),
		},
	});

	tl.to(
		left,
		{
			clipPath: 'polygon(0% 0%, 38% 8%, 24% 100%, 0% 100%)',
			duration: 0.5,
			ease: 'none',
		},
		0,
	);
	tl.to(
		right,
		{
			clipPath: 'polygon(55% 0%, 100% 0%, 100% 100%, 18% 100%)',
			xPercent: 12,
			duration: 0.5,
			ease: 'none',
		},
		0,
	);
	tl.to(
		top,
		{
			yPercent: -35,
			clipPath: 'polygon(0% 0%, 100% 0%, 100% 55%, 0% 100%)',
			duration: 0.5,
			ease: 'none',
		},
		0,
	);
	tl.to(
		bottom,
		{
			yPercent: 35,
			clipPath: 'polygon(0% 45%, 100% 0%, 100% 100%, 0% 100%)',
			duration: 0.5,
			ease: 'none',
		},
		0,
	);
	// autoAlpha (not opacity): hides + visibility:hidden so exited CTAs cannot hover/click off-screen.
	tl.to(exitsUp, { y: -160, autoAlpha: 0, duration: 0.42, ease: 'none', stagger: 0.04 }, 0.02);
	tl.to(exitsLeft, { x: -120, autoAlpha: 0, duration: 0.42, ease: 'none', stagger: 0.05 }, 0.04);
	tl.to(giant, { yPercent: -28, opacity: 0.22, scale: 1.06, duration: 0.5, ease: 'none' }, 0);

	if (hotspot) {
		tl.to(
			hotspot,
			{
				clipPath: 'polygon(8% 14%, 94% 8%, 96% 86%, 4% 90%)',
				duration: 0.5,
				ease: 'none',
			},
			0,
		);
	}

	tl.to(
		left,
		{
			xPercent: -108,
			clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
			duration: 0.35,
			ease: 'none',
		},
		0.5,
	);
	tl.to(
		right,
		{
			xPercent: 120,
			opacity: 0,
			duration: 0.35,
			ease: 'none',
		},
		0.5,
	);
	tl.to(top, { yPercent: -110, duration: 0.35, ease: 'none' }, 0.5);
	tl.to(bottom, { yPercent: 110, duration: 0.35, ease: 'none' }, 0.5);
	tl.to(giant, { yPercent: -70, opacity: 0, duration: 0.3, ease: 'none' }, 0.5);

	if (hotspot) {
		tl.to(
			hotspot,
			{
				clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
				duration: 0.35,
				ease: 'none',
			},
			0.5,
		);
	}

	// Hold full-bleed video.
	tl.to({}, { duration: 0.28 }, 0.85);

	// Phase 3: black curtain closes over video → origen (Webdrift-style fill).
	const closeAt = 1.15;
	tl.to(
		[left, right, top, bottom].filter(Boolean),
		{ backgroundColor: '#000000', duration: 0.01, ease: 'none' },
		closeAt,
	);
	tl.to(
		left,
		{
			xPercent: 0,
			width: '100%',
			clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
			duration: 0.45,
			ease: 'none',
		},
		closeAt,
	);
	tl.to(
		right,
		{
			xPercent: 0,
			opacity: 0,
			duration: 0.35,
			ease: 'none',
		},
		closeAt,
	);
	tl.to(top, { yPercent: 0, duration: 0.45, ease: 'none' }, closeAt);
	tl.to(bottom, { yPercent: 0, duration: 0.45, ease: 'none' }, closeAt);

	if (origenLayer) {
		tl.to(
			origenLayer,
			{
				opacity: 1,
				clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
				duration: 0.5,
				ease: 'none',
			},
			closeAt,
		);
		// One united fill, top → bottom (clip bottom edge down).
		const fillMask = origenLayer.querySelector<HTMLElement>('[data-text-fill-mask]');
		if (fillMask) {
			gsap.set(fillMask, { clipPath: 'inset(0 0 100% 0)' });
			tl.to(
				fillMask,
				{
					clipPath: 'inset(0 0 0% 0)',
					duration: 0.85,
					ease: 'none',
				},
				closeAt + 0.35,
			);
			// After fill: drop the overlay mask so the base text is selectable.
			const solidAt = closeAt + 1.2;
			tl.set(fillMask, { autoAlpha: 0 }, solidAt);
			tl.set(
				origenLayer,
				{
					pointerEvents: 'auto',
					attr: { 'aria-hidden': 'false', 'data-solid': 'true' },
				},
				solidAt,
			);
			tl.set(
				origenLayer,
				{
					pointerEvents: 'none',
					attr: { 'aria-hidden': 'true', 'data-solid': 'false' },
				},
				0,
			);
		}
	}

	if (hotspot) {
		tl.to(hotspot, { autoAlpha: 0, duration: 0.2, ease: 'none' }, closeAt);
	}

	tl.to({}, { duration: 0.45 }, closeAt + 0.85);

	return api;
}

function setAudienceFocus(root: HTMLElement, id: string): void {
	if (root.dataset.activeAudience === id) return;
	root.dataset.activeAudience = id;
	root.querySelectorAll<HTMLElement>('[data-audience-link]').forEach((link) => {
		const active = link.dataset.audienceLink === id;
		link.classList.toggle('text-white', active);
		link.classList.toggle('text-white/45', !active);
	});
	root.querySelectorAll<HTMLElement>('[data-audience-photo]').forEach((photo) => {
		const active = photo.dataset.audiencePhoto === id;
		photo.classList.toggle('opacity-100', active);
		photo.classList.toggle('opacity-0', !active);
		photo.setAttribute('aria-hidden', active ? 'false' : 'true');
	});
}

function audienceIdsOf(root: HTMLElement): string[] {
	return gsap.utils
		.toArray<HTMLElement>(root.querySelectorAll('[data-audience-link]'))
		.map((link) => link.dataset.audienceLink)
		.filter((id): id is string => Boolean(id));
}

function initAudienceSwitcher(main: Element): void {
	const root = main.querySelector<HTMLElement>('[data-audience-switcher]');
	if (!root) return;
	const ids = audienceIdsOf(root);
	if (ids[0]) setAudienceFocus(root, ids[0]);

	root.querySelectorAll<HTMLElement>('[data-audience-link]').forEach((link) => {
		const id = link.dataset.audienceLink;
		if (!id) return;
		link.addEventListener('pointerenter', () => setAudienceFocus(root, id));
		link.addEventListener('focus', () => setAudienceFocus(root, id));
	});
}

function initHorizontalScrolls(main: Element): void {
	const zones = gsap.utils.toArray<HTMLElement>(main.querySelectorAll('[data-h-scroll]'));

	zones.forEach((zone) => {
		const track = zone.querySelector<HTMLElement>('[data-h-scroll-track]');
		if (!track) return;

		let pointerId: number | null = null;
		let startX = 0;
		let origin = 0;

		const onPointerDown = (event: PointerEvent) => {
			if (event.pointerType === 'mouse' && event.button !== 0) return;
			if (track.scrollWidth <= track.clientWidth + 8) return;
			pointerId = event.pointerId;
			startX = event.clientX;
			origin = track.scrollLeft;
			gsap.killTweensOf(track);
			track.classList.add('cursor-grabbing');
			try {
				track.setPointerCapture(event.pointerId);
			} catch {
				/* ignore */
			}
		};

		const onPointerMove = (event: PointerEvent) => {
			if (pointerId !== event.pointerId) return;
			event.preventDefault();
			track.scrollLeft = origin - (event.clientX - startX);
		};

		const onPointerUp = (event: PointerEvent) => {
			if (pointerId !== event.pointerId) return;
			pointerId = null;
			track.classList.remove('cursor-grabbing');
			try {
				track.releasePointerCapture(event.pointerId);
			} catch {
				/* ignore */
			}
		};

		track.addEventListener('pointerdown', onPointerDown);
		track.addEventListener('pointermove', onPointerMove, { passive: false });
		track.addEventListener('pointerup', onPointerUp);
		track.addEventListener('pointercancel', onPointerUp);
		track.addEventListener('lostpointercapture', () => {
			pointerId = null;
			track.classList.remove('cursor-grabbing');
		});
	});
}

/** Fill muted titles top → bottom as their story stage scrolls into focus. */
function initStoryTextFills(main: Element): void {
	const stories = gsap.utils.toArray<HTMLElement>(main.querySelectorAll('[data-story]'));
	stories.forEach((story, storyIndex) => {
		const masks = gsap.utils.toArray<HTMLElement>(story.querySelectorAll('[data-text-fill-mask]'));
		if (!masks.length) return;
		const st = ScrollTrigger.getById(`story-${story.id || storyIndex}`);
		if (!st) return;

		masks.forEach((mask) => gsap.set(mask, { clipPath: 'inset(0 0 100% 0)' }));
		ScrollTrigger.create({
			trigger: story,
			start: () => st.start,
			end: () => st.start + (st.end - st.start) * 0.45,
			scrub: 0.7,
			onUpdate: (self) => {
				const bottom = (1 - self.progress) * 100;
				masks.forEach((mask) => {
					gsap.set(mask, { clipPath: `inset(0 0 ${bottom}% 0)` });
				});
			},
		});
	});
}

/**
 * Monument-style letter open: the section itself starts as an inset card
 * and the clip expands outward to the full frame. No accent fill — only the
 * section background/content, so nothing reads as a colored “hueco”.
 */
function initShapeWipes(main: Element): void {
	const full = 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';
	// Inset cards that open outward (letter). Margins show ink-100, not a fill color.
	const closedShapes = [
		'polygon(10% 16%, 90% 12%, 93% 84%, 7% 88%)',
		'polygon(8% 14%, 92% 16%, 90% 86%, 10% 84%)',
		'polygon(12% 13%, 88% 10%, 91% 87%, 9% 90%)',
		'polygon(9% 18%, 91% 14%, 94% 82%, 6% 86%)',
		'polygon(11% 12%, 89% 15%, 92% 88%, 8% 85%)',
	];
	const midShapes = [
		'polygon(4% 7%, 96% 5%, 97% 93%, 3% 95%)',
		'polygon(3% 6%, 97% 7%, 96% 94%, 4% 93%)',
		'polygon(5% 5%, 95% 4%, 96% 95%, 4% 96%)',
		'polygon(4% 8%, 96% 6%, 98% 92%, 2% 94%)',
		'polygon(5% 5%, 95% 6%, 96% 95%, 4% 94%)',
	];

	// Drop any leftover accent layers from earlier iterations.
	main.querySelectorAll('[data-shape-surface]').forEach((node) => node.remove());

	const sections = gsap.utils
		.toArray<HTMLElement>(main.querySelectorAll(':scope > section'))
		.filter((section) => {
			if (section.dataset.heroCurtain !== undefined) return false;
			if (section.dataset.snapVideo !== undefined) return false;
			return (section.offsetHeight || 0) > 80;
		});

	sections.forEach((section, index) => {
		// Pinned stories + brand sticky timeline own their scroll; clipping the
		// wrapper breaks pin/scrub and overflow-hidden kills position:sticky.
		if (
			section.dataset.story !== undefined ||
			section.dataset.brandTimeline !== undefined ||
			section.dataset.playbooksTimeline !== undefined ||
			section.dataset.capacityTimeline !== undefined
		) {
			gsap.set(section, { clearProps: 'clipPath' });
			section.style.clipPath = '';
			return;
		}

		const closed = closedShapes[index % closedShapes.length];
		const mid = midShapes[index % midShapes.length];

		section.classList.add('relative', 'overflow-hidden');
		gsap.set(section, { clipPath: closed, force3D: true });

		const tl = gsap.timeline({
			scrollTrigger: {
				trigger: section,
				start: 'top 88%',
				end: 'top 24%',
				scrub: 0.7,
				invalidateOnRefresh: true,
			},
		});

		tl.fromTo(section, { clipPath: closed }, { clipPath: mid, duration: 0.4, ease: 'none' }, 0);
		tl.to(section, { clipPath: full, duration: 0.6, ease: 'none' }, 0.4);
	});
}

type HorizontalTimelineConfig = {
	id: string;
	section: string;
	pin: string;
	track: string;
	progress: string;
	card: string;
};

function initHorizontalTimeline(
	main: Element,
	reduce: boolean,
	config: HorizontalTimelineConfig,
): void {
	const section = main.querySelector<HTMLElement>(config.section);
	const pin = section?.querySelector<HTMLElement>(config.pin);
	const track = section?.querySelector<HTMLElement>(config.track);
	const progress = section?.querySelector<HTMLElement>(config.progress);
	const cards = gsap.utils.toArray<HTMLElement>(section?.querySelectorAll(config.card) ?? []);
	if (!section || !pin || !track || cards.length < 2) return;

	const maxShift = () => Math.max(0, track.scrollWidth - pin.clientWidth);

	gsap.set(track, { x: 0 });
	gsap.set(cards, { opacity: 1, y: 0 });
	if (progress) gsap.set(progress, { width: reduce ? '100%' : '0%' });
	if (reduce) return;

	// Create after story pins so start/end land on the real document flow.
	ScrollTrigger.create({
		id: config.id,
		trigger: section,
		start: 'top top',
		end: () => `+=${maxShift() + window.innerHeight * 0.35}`,
		scrub: 0.55,
		pin,
		pinSpacing: true,
		anticipatePin: 0,
		invalidateOnRefresh: true,
		onRefresh: () => {
			gsap.set(track, { x: 0 });
			if (progress) gsap.set(progress, { width: '0%' });
		},
		onUpdate: (self) => {
			const shift = maxShift();
			gsap.set(track, { x: -shift * self.progress });
			if (progress) gsap.set(progress, { width: `${self.progress * 100}%` });
		},
	});
}

function initFaqAccordion(main: Element): void {
	const list = main.querySelector<HTMLElement>('[data-faq-list]');
	if (!list) return;

	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const items = gsap.utils.toArray<HTMLDetailsElement>(list.querySelectorAll('details'));
	const duration = reduce ? 0.01 : 0.32;
	const ease = 'power3.inOut';

	const panelOf = (details: HTMLDetailsElement) =>
		details.querySelector<HTMLElement>('[data-faq-panel]');

	const closeItem = (details: HTMLDetailsElement) => {
		const panel = panelOf(details);
		if (!details.open) return;
		if (!panel) {
			details.open = false;
			return;
		}
		gsap.killTweensOf(panel);
		gsap.to(panel, {
			height: 0,
			duration,
			ease,
			onComplete: () => {
				details.open = false;
				gsap.set(panel, { clearProps: 'height' });
			},
		});
	};

	const openItem = (details: HTMLDetailsElement) => {
		const panel = panelOf(details);
		items.forEach((other) => {
			if (other !== details) closeItem(other);
		});
		if (details.open) return;
		details.open = true;
		if (!panel) return;
		gsap.killTweensOf(panel);
		gsap.fromTo(
			panel,
			{ height: 0 },
			{
				height: 'auto',
				duration,
				ease,
			},
		);
	};

	items.forEach((details) => {
		const panel = panelOf(details);
		if (panel && !details.open) gsap.set(panel, { height: 0 });

		const summary = details.querySelector('summary');
		summary?.addEventListener('click', (event) => {
			event.preventDefault();
			if (details.open) closeItem(details);
			else openItem(details);
		});

		// Close from anywhere on the open card (answer body included).
		details.addEventListener('click', (event) => {
			if (!details.open) return;
			const target = event.target as Node | null;
			if (target && summary?.contains(target)) return;
			event.preventDefault();
			closeItem(details);
		});
	});
}

function initVideoCursor(main: Element, heroApi: HeroApi): void {
	const cursor = document.querySelector<HTMLElement>('[data-video-cursor]');
	const label = document.querySelector<HTMLElement>('[data-video-cursor-label]');
	const iconPan = document.querySelector<HTMLElement>('[data-video-cursor-icon="pan"]');
	const iconExpand = document.querySelector<HTMLElement>('[data-video-cursor-icon="expand"]');
	const iconHand = document.querySelector<HTMLElement>('[data-video-cursor-icon="hand"]');
	const iconGrab = document.querySelector<HTMLElement>('[data-video-cursor-icon="grab"]');
	const videos = gsap.utils.toArray<HTMLVideoElement>(main.querySelectorAll('[data-demo-loop]'));
	const heroHotspot = main.querySelector<HTMLElement>('[data-video-hotspot]');
	const goTargets = gsap.utils.toArray<HTMLElement>(document.querySelectorAll('[data-cursor-go]'));
	const canvasTargets = gsap.utils.toArray<HTMLElement>(main.querySelectorAll('[data-canvas-pan]'));
	const panTargets = gsap.utils.toArray<HTMLElement>(main.querySelectorAll('[data-h-scroll]'));
	if (!cursor) return;

	const playLabel = cursor.dataset.playLabel ?? 'Play';
	const pauseLabel = cursor.dataset.pauseLabel ?? 'Pausa';
	const goLabel = cursor.dataset.goLabel ?? 'Ir';
	const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	type CursorMode = 'scroll' | 'toggle' | 'go' | 'pan' | 'expand' | 'grab' | 'grabbing';

	const videoModeOf = (): 'scroll' | 'toggle' =>
		heroHotspot?.dataset.hotspotMode === 'toggle' ? 'toggle' : 'scroll';

	const syncIcons = (mode: CursorMode) => {
		iconPan?.classList.toggle('hidden', mode !== 'pan');
		iconExpand?.classList.toggle('hidden', mode !== 'expand');
		iconHand?.classList.toggle('hidden', mode !== 'grab');
		iconGrab?.classList.toggle('hidden', mode !== 'grabbing');
		const iconMode = mode === 'pan' || mode === 'expand' || mode === 'grab' || mode === 'grabbing';
		if (label) label.classList.toggle('hidden', iconMode);
	};

	const syncLabel = (mode: CursorMode) => {
		syncIcons(mode);
		if (!label) return;
		if (mode === 'pan' || mode === 'expand' || mode === 'grab' || mode === 'grabbing') return;
		if (mode === 'go') {
			label.textContent = goLabel;
			return;
		}
		if (mode === 'scroll') {
			label.textContent = playLabel;
			return;
		}
		const anyPlaying = videos.some((video) => !video.paused && !video.ended);
		label.textContent = anyPlaying ? pauseLabel : playLabel;
	};

	const setPlaying = (shouldPlay: boolean) => {
		videos.forEach((video) => {
			if (shouldPlay) void video.play().catch(() => {});
			else video.pause();
		});
		syncLabel('toggle');
	};

	videos.forEach((video) => {
		video.addEventListener('play', () => {
			if (cursor.dataset.mode === 'toggle') syncLabel('toggle');
		});
		video.addEventListener('pause', () => {
			if (cursor.dataset.mode === 'toggle') syncLabel('toggle');
		});
		video.muted = true;
		video.loop = true;
		video.playsInline = true;
		void video.play().catch(() => {});
	});

	const onHotspotClick = (event: Event) => {
		event.preventDefault();
		if (videoModeOf() === 'scroll') {
			heroApi.scrollToDemo();
			return;
		}
		const anyPlaying = videos.some((video) => !video.paused && !video.ended);
		setPlaying(!anyPlaying);
	};

	if (!finePointer) {
		cursor.hidden = true;
		heroHotspot?.addEventListener('click', onHotspotClick);
		return;
	}

	let lastX = window.innerWidth / 2;
	let lastY = window.innerHeight / 2;
	let refreshRaf = 0;
	const cursorScaleHidden = 0.38;
	const cursorScaleShown = (mode: CursorMode) =>
		mode === 'go' || mode === 'expand' || mode === 'grab' || mode === 'grabbing' ? 0.92 : 1;

	gsap.set(cursor, {
		xPercent: -50,
		yPercent: -50,
		x: lastX,
		y: lastY,
		scale: cursorScaleHidden,
	});

	const hasTextSelection = () => {
		const selection = window.getSelection();
		return Boolean(selection && !selection.isCollapsed && selection.toString().length > 0);
	};

	const showCursor = (mode: CursorMode) => {
		const wasHidden = cursor.dataset.visible !== 'true';
		const prevMode = cursor.dataset.mode;
		cursor.dataset.visible = 'true';
		cursor.dataset.mode = mode;
		document.documentElement.classList.add('cursor-none');
		syncLabel(mode);
		if (wasHidden) {
			gsap.fromTo(
				cursor,
				{ scale: cursorScaleHidden },
				{ scale: cursorScaleShown(mode), duration: 0.75, ease: 'power2.out', overwrite: 'auto' },
			);
		} else if (prevMode !== mode) {
			gsap.to(cursor, {
				scale: cursorScaleShown(mode),
				duration: 0.35,
				ease: 'power2.out',
				overwrite: 'auto',
			});
		}
	};

	const hideCursor = () => {
		if (cursor.dataset.visible !== 'true') {
			document.documentElement.classList.remove('cursor-none');
			return;
		}
		cursor.dataset.visible = 'false';
		document.documentElement.classList.remove('cursor-none');
		gsap.to(cursor, {
			scale: cursorScaleHidden,
			duration: 0.4,
			ease: 'power2.in',
			overwrite: 'auto',
		});
	};

	const modeAtPoint = (x: number, y: number): CursorMode | null => {
		if (hasTextSelection()) return null;
		const el = document.elementFromPoint(x, y);
		if (!el) return null;
		if (heroHotspot && (el === heroHotspot || heroHotspot.contains(el))) return videoModeOf();
		if (el.closest('[data-cursor-go]')) return 'go';
		if (el.closest('[data-cursor-expand]')) return 'expand';
		const canvas = el.closest<HTMLElement>('[data-canvas-pan]');
		if (canvas) return canvas.dataset.dragging === 'true' ? 'grabbing' : 'grab';
		if (el.closest('[data-h-scroll]')) return 'pan';
		return null;
	};

	/** Hit-test under the real pointer. Scroll/pin + text selection skip pointerleave. */
	const refreshCursorFromPoint = () => {
		const mode = modeAtPoint(lastX, lastY);
		if (!mode) {
			hideCursor();
			return;
		}
		showCursor(mode);
		if (mode === 'toggle' || mode === 'scroll') syncLabel(mode);
	};

	const scheduleRefresh = () => {
		if (refreshRaf) return;
		refreshRaf = requestAnimationFrame(() => {
			refreshRaf = 0;
			refreshCursorFromPoint();
		});
	};

	const onPointerMove = (event: PointerEvent) => {
		lastX = event.clientX;
		lastY = event.clientY;
		if (cursor.dataset.visible === 'true') {
			gsap.to(cursor, {
				x: lastX,
				y: lastY,
				duration: 0.45,
				ease: 'power3.out',
				overwrite: 'auto',
			});
		} else {
			gsap.set(cursor, { x: lastX, y: lastY });
		}
		scheduleRefresh();
	};

	heroHotspot?.addEventListener('click', onHotspotClick);

	goTargets.forEach((target) => {
		target.classList.add('cursor-none');
	});

	canvasTargets.forEach((target) => {
		target.classList.add('cursor-none');
	});

	panTargets.forEach((target) => {
		target.classList.add('cursor-none');
	});

	// Follow the real pointer globally so the ring never sticks while html has cursor-none.
	window.addEventListener('pointermove', onPointerMove, { passive: true });
	window.addEventListener('pointerdown', scheduleRefresh, { passive: true });
	window.addEventListener('pointerup', scheduleRefresh, { passive: true });
	window.addEventListener('blur', hideCursor);
	document.addEventListener('visibilitychange', () => {
		if (document.hidden) hideCursor();
	});
	document.addEventListener('selectionchange', scheduleRefresh);
	window.addEventListener('scroll', scheduleRefresh, { passive: true });
	window.addEventListener('resize', scheduleRefresh);
}
