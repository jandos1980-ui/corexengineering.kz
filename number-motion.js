/* Count editorial numbers once when visible, preserving their final layout and text. */
(async () => {
  const labels = [...document.querySelectorAll('main span')].filter(el =>
    !el.childElementCount && /^\d+$/.test(el.textContent.trim()) &&
    !el.closest('.scroll-film, .sq-carousel, .product-showcase')
  );
  if (!labels.length || !('IntersectionObserver' in window)) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;
  if (document.fonts) await document.fonts.ready;
  if (reduced.matches) return;

  const active = new Map();
  const counters = new Map();
  const context = document.createElement('canvas').getContext('2d');
  const digitWidths = new Map();
  for (const el of labels) {
    const final = el.textContent.trim();
    const value = Number(final);
    if (!Number.isSafeInteger(value)) continue;

    // Keep the original flex/grid alignment and baseline for the entire count.
    el.style.fontVariantNumeric = 'tabular-nums';
    const font = getComputedStyle(el);
    const fontKey = `${font.fontStyle} ${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
    if (!digitWidths.has(fontKey)) {
      let width = 1;
      if (context) {
        context.font = fontKey;
        width = Math.max(...'0123456789'.split('').map(digit => context.measureText(digit).width)) / parseFloat(font.fontSize);
      }
      digitWidths.set(fontKey, width);
    }
    const tracking = (parseFloat(font.letterSpacing) || 0) / parseFloat(font.fontSize);
    const cellWidth = digitWidths.get(fontKey) + Math.max(0, tracking);
    const slot = document.createElement('span');
    slot.style.cssText = 'position:relative;display:inline-block;vertical-align:baseline;white-space:nowrap;font:inherit;letter-spacing:inherit;font-variant-numeric:inherit';
    // A stable final value remains available to assistive technology.
    const measurement = document.createElement('span');
    measurement.textContent = final;
    measurement.style.cssText = 'position:absolute;inset:0;opacity:0;pointer-events:none;font:inherit;letter-spacing:inherit;font-variant-numeric:inherit';
    measurement.dataset.numberMeasure = '';
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    visual.style.cssText = 'display:inline-block;white-space:nowrap;font:inherit;letter-spacing:0;font-variant-numeric:inherit;user-select:none;-webkit-user-select:none';
    visual.dataset.numberVisual = '';
    // Equal digit cells also work when a supplied font lacks the OpenType tnum feature.
    const cells = Array.from(final, digit => {
      const cell = document.createElement('span');
      cell.style.cssText = `display:inline-block;width:${cellWidth}em;text-align:center;font:inherit;letter-spacing:0;font-variant-numeric:inherit`;
      cell.textContent = digit;
      visual.append(cell);
      return cell;
    });
    slot.append(measurement, visual);
    el.replaceChildren(slot);
    el.dataset.numberMotion = 'ready';
    const format = n => /^0\d/.test(final) ? String(n).padStart(final.length, '0') : String(n);
    const render = n => {
      const digits = format(n).padStart(final.length, '\u00a0');
      cells.forEach((cell, i) => {
        if (cell.textContent !== digits[i]) cell.textContent = digits[i];
      });
    };
    counters.set(el, { final, value, render });
  }

  const count = el => {
    const counter = counters.get(el);
    if (!counter || reduced.matches) return;
    const { value, render } = counter;
    render(0);
    el.dataset.numberMotion = 'running';

    let raf;
    let start;
    const finish = () => {
      cancelAnimationFrame(raf);
      render(value);
      el.dataset.numberMotion = 'complete';
      active.delete(el);
    };
    active.set(el, finish);
    const frame = now => {
      if (reduced.matches || !el.isConnected) return finish();
      if (start === undefined) start = now;
      const progress = Math.min(1, (now - start) / 1800);
      const eased = Math.sin(progress * Math.PI / 2);
      render(Math.floor(value * eased));
      if (progress < 1) raf = requestAnimationFrame(frame);
      else finish();
    };
    raf = requestAnimationFrame(frame);
  };

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      count(entry.target);
    }
  }, { threshold: 0.35 });
  for (const el of counters.keys()) observer.observe(el);
  reduced.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    for (const finish of active.values()) finish();
  });
})();
