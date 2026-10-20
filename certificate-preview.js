(() => {
 const links = document.querySelectorAll('[data-certificate]');
 if (!links.length || typeof HTMLDialogElement === 'undefined') return;
 const dialog = document.createElement('dialog');
 dialog.className = 'certificate-dialog';
 const close = document.createElement('button');
 close.type = 'button'; close.className = 'certificate-close'; close.textContent = '×';
 close.setAttribute('aria-label', document.documentElement.lang === 'kk' ? 'Жабу' : document.documentElement.lang === 'en' ? 'Close' : 'Закрыть');
 const img = document.createElement('img');
 dialog.append(close, img); document.body.append(dialog);
 close.addEventListener('click', () => dialog.close());
 dialog.addEventListener('click', e => {
  if (e.target === dialog) dialog.close();
 });
 dialog.addEventListener('close', () => document.documentElement.classList.remove('certificate-open'));
 links.forEach(link => link.addEventListener('click', e => {
  if(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  e.preventDefault(); img.src = link.href; img.alt = link.querySelector('span').textContent;
  dialog.setAttribute('aria-label', img.alt); dialog.showModal();
  document.documentElement.classList.add('certificate-open');
 }));
})();
