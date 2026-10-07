const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
  mobileNav.hidden = true;
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  mobileNav.hidden = !open;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
window.matchMedia('(min-width: 851px)').addEventListener('change', closeMenu);
const copyButton = document.querySelector('#copy-message');
const copyFeedback = document.querySelector('#copy-feedback');
copyButton.addEventListener('click', async () => {
  const message = document.querySelector('#message-text').textContent;
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(message);
    copyFeedback.textContent = 'Готово! Вставь сообщение в переписку с рекрутером.';
  } catch {
    document.querySelector('.message-fallback').open = true;
    copyFeedback.textContent = 'Выдели и скопируй текст сообщения ниже.';
    const range = document.createRange();
    range.selectNodeContents(document.querySelector('#message-text'));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
});
