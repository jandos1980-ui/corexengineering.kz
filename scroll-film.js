'use strict';
(() => {
  const root = document.querySelector('.scroll-film');
  if (!root) return;
  const stage = root.querySelector('.film-stage');
  const scenes = [...root.querySelectorAll('.film-scene')];
  const images = scenes.map(scene => scene.querySelector('.film-visual'));
  const copies = scenes.map(scene => scene.querySelector('.film-copy'));
  const bars = [...root.querySelectorAll('.film-track i')];
  const moduleViews = [...root.querySelectorAll('.film-module-view')];
  const equipment = [...root.querySelectorAll('.film-equipment')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const short = matchMedia('(max-height: 449px)');
  const narrow = matchMedia('(max-width: 700px)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const warmScene = index => {
    const image = images[index];
    if (!image) return;
    const source = image.parentElement.querySelector('source[data-srcset]');
    if (source) {
      source.srcset = source.dataset.srcset;
      delete source.dataset.srcset;
    }
    if (image.loading === 'lazy') image.loading = 'eager';
  };
  let frame = 0, enabled = false, travel = 1, offset = 0, header = 0;
  let active = -1;

  function render() {
    frame = 0;
    if (!enabled) return;
    const bounds = root.getBoundingClientRect();
    root.classList.toggle('film-in-view', bounds.top < innerHeight && bounds.bottom > header);
    const p = clamp((scrollY + header - offset) / travel);
    // Each chapter holds, then dissolves over the last 26% of its interval.
    const chapter = p * scenes.length;
    const weights = scenes.map((_, i) => i === 0 ? 1 : clamp((chapter - i + .26) / .26));
    const visible = weights.map((weight, i) => weight * (1 - (weights[i + 1] || 0)));
    const nextActive = visible.indexOf(Math.max(...visible));
    if (active !== nextActive) {
      active = nextActive;
      warmScene(active);
      warmScene(active + 1);
      scenes.forEach((scene, i) => {
        scene.inert = i !== active;
        scene.setAttribute('aria-hidden', String(i !== active));
      });
      root.dataset.chapter = String(active + 1);
    }
    scenes.forEach((scene, i) => {
      // Incoming image overlays a fully opaque outgoing image: no black flash.
      scene.style.opacity = String(weights[i]);
      scene.style.visibility = (i === active || visible[i] > 0) ? 'visible' : 'hidden';
      // Text fades out before the next copy fades in. Backgrounds still dissolve.
      // At any scroll position (including reverse scroll), at most one copy paints.
      const enter = i === 0 ? 1 : clamp((weights[i] - .5) * 2);
      const leave = clamp(1 - (weights[i + 1] || 0) * 2);
      copies[i].style.opacity = String(Math.min(enter, leave));
      const local = clamp(chapter - i);
      if (images[i]) images[i].style.transform = `scale(${1 + local * (narrow.matches ? .025 : .055)})`;
      bars[i].style.transform = `scaleX(${local})`;
    });
    const reveal = clamp((chapter - 1 - .25) / .4);
    if (moduleViews[0]) moduleViews[0].style.opacity = String(1 - reveal);
    if (moduleViews[1]) moduleViews[1].style.opacity = String(reveal);
    moduleViews.forEach((view,i) => {
      view.style.transform = `translateY(${(i ? 1-reveal : -reveal)*12}px)`;
      view.setAttribute('aria-hidden',String(i !== (reveal < .5 ? 0 : 1)));
    });
    equipment.forEach((item,i) => {
      const progress = clamp((chapter - 2 + .26 - i*.045) / .26);
      item.style.opacity = String(progress);
      item.style.transform = `translateY(${(1-progress)*20}px)`;
    });
  }
  function schedule() { if (enabled && !frame) frame = requestAnimationFrame(render); }
  function configure() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    enabled = !reduced.matches && !short.matches;
    root.classList.toggle('is-scroll-film', enabled);
    if (!enabled) root.classList.remove('film-in-view');
    active = -1;
    if (!enabled) {
      root.style.removeProperty('--film-copy-top');
      root.style.removeProperty('--film-heading-height');
      [...moduleViews,...equipment].forEach(item=>{item.style.opacity='';item.style.transform='';item.removeAttribute('aria-hidden');});
      scenes.forEach((scene, i) => {
        scene.style.opacity = ''; scene.style.visibility = '';
        scene.removeAttribute('aria-hidden'); scene.inert = false;
        copies[i].style.transform = '';
        copies[i].style.opacity = '';
        if (images[i]) images[i].style.transform = '';
      });
      delete root.dataset.chapter;
      return;
    }
    // Load the next scene ahead of its reveal without prioritizing all five at startup.
    header = document.querySelector('.header')?.getBoundingClientRect().height || 0;
    // Reserve the tallest heading so both titles and descriptions share a row.
    root.style.removeProperty('--film-heading-height');
    const headingHeight = Math.max(...copies.map(copy => copy.querySelector('h1,h2').getBoundingClientRect().height));
    root.style.setProperty('--film-heading-height', `${headingHeight}px`);
    const copyHeight = Math.max(...copies.map(copy => copy.getBoundingClientRect().height));
    const actionTop = root.querySelector('.film-actions').getBoundingClientRect().top - stage.getBoundingClientRect().top;
    const preferredTop = stage.offsetHeight * .4 - copyHeight / 2;
    root.style.setProperty('--film-copy-top', `${Math.max(16, Math.min(preferredTop, actionTop - copyHeight - 24))}px`);
    offset = root.getBoundingClientRect().top + scrollY;
    travel = Math.max(1, root.offsetHeight - stage.offsetHeight);
    render();
  }
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', configure, {passive: true});
  addEventListener('pageshow', configure);
  addEventListener('pagehide', () => { if (frame) cancelAnimationFrame(frame); frame = 0; });
  reduced.addEventListener('change', configure);
  short.addEventListener('change', configure);
  narrow.addEventListener('change', configure);
  configure();
  document.fonts.ready.then(configure);
  // Entrance belongs to the initial view only; scrolling immediately takes over.
  if (enabled && scrollY < 8 && !location.hash) {
    const finishEntrance = () => {
      root.classList.remove('film-entering');
      removeEventListener('scroll', finishEntrance);
      removeEventListener('keydown', finishEntrance);
      removeEventListener('resize', finishEntrance);
      root.removeEventListener('focusin', finishEntrance);
      reduced.removeEventListener('change', finishEntrance);
    };
    root.classList.add('film-entering');
    addEventListener('scroll', finishEntrance, {passive:true});
    addEventListener('keydown', finishEntrance);
    addEventListener('resize', finishEntrance, {passive:true});
    root.addEventListener('focusin', finishEntrance);
    reduced.addEventListener('change', finishEntrance);
    setTimeout(finishEntrance, 700);
  }
})();
