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
const messageText = document.querySelector('#message-text');
const messageFallback = document.querySelector('.message-fallback');
const smsLink = document.querySelector('#send-sms');
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isMobile = isIOS || /Android/i.test(navigator.userAgent);
const smsBody = encodeURIComponent(messageText.textContent.trim());
// iOS Messages and Android use different separators for a prefilled SMS body.
smsLink.href = `sms:${smsLink.dataset.phone}${isIOS ? '&' : '?'}body=${smsBody}`;
smsLink.addEventListener('click', event => {
  if (!isMobile) {
    event.preventDefault();
    messageFallback.open = true;
    copyFeedback.textContent = 'Отправь этот текст с телефона на +7 906 670-17-54. Его можно скопировать кнопкой выше.';
    messageText.focus({preventScroll: true});
    return;
  }
  // Keep the SMS link's native navigation synchronous with the user's click.
  // Clipboard copying is only a backup if the messaging app omits the body.
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(messageText.textContent.trim()).catch(() => {});
  }
  copyFeedback.textContent = 'В приложении СМС проверь текст и нажми «Отправить». Если текст не подставился, скопируй его на сайте.';
});
copyButton.addEventListener('click', async () => {
  const message = messageText.textContent.trim();
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(message);
    copyFeedback.textContent = 'Текст скопирован. Отправь его по СМС на +7 906 670-17-54.';
  } catch {
    messageFallback.open = true;
    copyFeedback.textContent = 'Выдели и скопируй текст сообщения ниже.';
    const range = document.createRange();
    range.selectNodeContents(messageText);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
});
