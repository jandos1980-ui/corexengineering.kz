/* The supplied hover interaction, adapted to native links and buttons. */
(() => {
  const selector = '.button, .product-catalog, .sq-action, .sq-structure';
  const alignDot = label => label.parentElement?.style.setProperty('--ihb-label-width', `${label.getBoundingClientRect().width}px`);
  const labelObserver = 'ResizeObserver' in window ? new ResizeObserver(entries => entries.forEach(entry => alignDot(entry.target))) : null;
  function enhance(button) {
    if (button.querySelector(':scope > .ihb-label')) return;
    const icon = button.matches('.sq-controls button');
    button.classList.add('interactive-hover-button');
    button.classList.toggle('ihb-icon', icon);
    const label = document.createElement('span');
    label.className = 'ihb-label';
    const text = button.textContent.trim();
    label.textContent = icon ? text : text.replace(/\s*[↗→➜]\s*$/, '');
    button.replaceChildren();
    const active = document.createElement('span');
    active.className = 'ihb-active';
    active.setAttribute('aria-hidden', 'true');
    const activeText = document.createElement('span');
    activeText.textContent = label.textContent;
    active.append(activeText);
    if (!icon) {
      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      arrow.setAttribute('class', 'ihb-arrow');
      arrow.setAttribute('viewBox', '0 0 24 24');
      arrow.setAttribute('fill', 'none');
      arrow.setAttribute('stroke', 'currentColor');
      arrow.setAttribute('stroke-width', '2');
      arrow.setAttribute('stroke-linecap', 'round');
      arrow.setAttribute('stroke-linejoin', 'round');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M5 12h14m-7-7 7 7-7 7');
      arrow.append(path);
      active.append(arrow);
    }
    const fill = document.createElement('span');
    fill.className = 'ihb-fill';
    fill.setAttribute('aria-hidden', 'true');
    button.append(label, active, fill);
    alignDot(label);
    labelObserver?.observe(label);
  }
  window.CorexButtons = {enhance};
  document.querySelectorAll(selector).forEach(enhance);
  document.fonts?.ready.then(() => document.querySelectorAll('.interactive-hover-button > .ihb-label').forEach(alignDot));
})();
