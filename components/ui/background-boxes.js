/* Background Boxes: dependency-free adaptation for the static CoreX site.
 * Canvas keeps the original skewed grid without 15,000 interactive DOM nodes. */
(() => {
  const colors = ['#7dd3fc', '#f9a8d4', '#86efac', '#fde047', '#fca5a5', '#d8b4fe', '#93c5fd', '#a5b4fc', '#c4b5fd'];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('.footer').forEach(footer => {
    const canvas = document.createElement('canvas');
    canvas.className = 'footer-boxes';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    footer.prepend(canvas);
    let width = 0, height = 0, frame = 0, visible = false, lastCell = '';
    const highlights = new Map();
    // Same oblique lattice as the React reference, sized to the actual footer.
    const matrix = new DOMMatrix([0.675, 0.168, -0.75, 0.488, 0, 0]);
    const inverse = matrix.inverse();
    let bounds;
    const point = (x, y) => new DOMPoint(x - width / 2, y - height / 2).matrixTransform(inverse);
    function highlight(x, y, now) {
      highlights.set(`${x}:${y}`, {x, y, time: now, color: colors[Math.floor(Math.random() * colors.length)]});
    }
    function draw(now = performance.now()) {
      frame = 0;
      if (!visible || document.hidden || motion.matches) highlights.clear();
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, 0, 0);
      for (const [key, cell] of highlights) {
        const opacity = Math.max(0, 1 - (now - cell.time) / 2000);
        if (!opacity) { highlights.delete(key); continue; }
        ctx.globalAlpha = opacity * 0.65;
        ctx.fillStyle = cell.color;
        ctx.fillRect(cell.x * 64, cell.y * 32, 64, 32);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#384859';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = bounds.left; x <= bounds.right; x++) {
        ctx.moveTo(x * 64, bounds.top * 32);
        ctx.lineTo(x * 64, bounds.bottom * 32);
      }
      for (let y = bounds.top; y <= bounds.bottom; y++) {
        ctx.moveTo(bounds.left * 64, y * 32);
        ctx.lineTo(bounds.right * 64, y * 32);
      }
      ctx.stroke();
      ctx.strokeStyle = '#5d6878';
      ctx.beginPath();
      for (let x = bounds.left; x <= bounds.right; x++) {
        for (let y = bounds.top; y <= bounds.bottom; y++) {
          if (x % 2 || y % 2) continue;
          ctx.moveTo(x * 64 - 5, y * 32); ctx.lineTo(x * 64 + 5, y * 32);
          ctx.moveTo(x * 64, y * 32 - 5); ctx.lineTo(x * 64, y * 32 + 5);
        }
      }
      ctx.stroke();
      ctx.restore();
      if (highlights.size && visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(draw);
    }
    function resize() {
      width = footer.clientWidth; height = footer.clientHeight;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const corners = [point(0, 0), point(width, 0), point(0, height), point(width, height)];
      bounds = {
        left: Math.floor(Math.min(...corners.map(p => p.x)) / 64) - 1,
        right: Math.ceil(Math.max(...corners.map(p => p.x)) / 64) + 1,
        top: Math.floor(Math.min(...corners.map(p => p.y)) / 32) - 1,
        bottom: Math.ceil(Math.max(...corners.map(p => p.y)) / 32) + 1,
      };
      cancelAnimationFrame(frame); draw();
    }
    function reset() {
      highlights.clear(); lastCell = '';
      cancelAnimationFrame(frame); draw();
    }
    function highlightPointer(event) {
      if (!visible || document.hidden || motion.matches || (!pointer.matches && event.pointerType !== 'touch')) return;
      const rect = footer.getBoundingClientRect();
      const position = point(event.clientX - rect.left, event.clientY - rect.top);
      const x = Math.floor(position.x / 64), y = Math.floor(position.y / 32);
      const key = `${x}:${y}`;
      if (lastCell === key) return;
      lastCell = key;
      highlight(x, y, performance.now());
      if (!frame) frame = requestAnimationFrame(draw);
    }
    footer.addEventListener('pointermove', highlightPointer, {passive: true});
    footer.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') highlightPointer(event);
    }, {passive: true});
    // Native scrolling cancels pointermove; passive touchmove keeps the trail under the finger.
    footer.addEventListener('touchmove', event => {
      const touch = event.touches[0];
      if (touch) highlightPointer({clientX: touch.clientX, clientY: touch.clientY, pointerType: 'touch'});
    }, {passive: true});
    const releaseTouch = () => { lastCell = ''; };
    footer.addEventListener('pointerup', releaseTouch, {passive: true});
    footer.addEventListener('pointercancel', releaseTouch, {passive: true});
    footer.addEventListener('touchend', releaseTouch, {passive: true});
    footer.addEventListener('touchcancel', releaseTouch, {passive: true});
    footer.addEventListener('pointerleave', () => { lastCell = ''; });
    resize();
    new ResizeObserver(resize).observe(footer);
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      reset();
    }).observe(footer);
    motion.addEventListener('change', reset);
    pointer.addEventListener('change', reset);
    document.addEventListener('visibilitychange', reset);
  });
})();
