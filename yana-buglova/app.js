'use strict';
const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#navigation');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
  menu.classList.remove('open');
}
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(expanded));
  menuButton.setAttribute('aria-label', expanded ? 'Закрыть меню' : 'Открыть меню');
  menu.classList.toggle('open', expanded);
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.header')) closeMenu();
});
window.matchMedia('(min-width: 601px)').addEventListener('change', closeMenu);

const copyButton = document.querySelector('.copy-email');
const copyStatus = document.querySelector('.copy-status');
copyButton.addEventListener('click', async () => {
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText('buglova@city-vrn.com');
    copyStatus.textContent = 'Email скопирован';
  } catch {
    copyStatus.textContent = 'Можно выделить и скопировать адрес: buglova@city-vrn.com';
  }
});

const businessCard = document.querySelector('#yana-card');
const cardOpen = document.querySelector('#card-open');
const cardClose = document.querySelector('#card-close');
const cardContacts = document.querySelector('#card-contacts');

function setCardOpen(open, moveFocus = true) {
  businessCard.classList.toggle('is-open', open);
  cardOpen.setAttribute('aria-expanded', String(open));
  cardContacts.setAttribute('aria-hidden', String(!open));
  cardContacts.inert = !open;
  const mobile = window.matchMedia('(max-width: 700px)').matches;
  cardOpen.inert = open && !mobile;
  cardOpen.setAttribute('aria-hidden', String(open && !mobile));
  cardOpen.querySelector('.card-open-label').textContent = open ? 'Скрыть контакты' : 'Мои контакты';
  cardOpen.setAttribute('aria-label', open && mobile ? 'Скрыть контакты Яны Бугловой' : 'Открыть визитку Яны Бугловой');
  cardClose.textContent = mobile ? 'Скрыть контакты' : 'Лицевая сторона';
  if (moveFocus) (open ? cardContacts : cardOpen).focus({preventScroll: true});
}

businessCard.dataset.enhanced = 'true';
cardOpen.disabled = false;
cardClose.hidden = false;
setCardOpen(false, false);
cardOpen.addEventListener('click', () => setCardOpen(!businessCard.classList.contains('is-open')));
cardClose.addEventListener('click', () => setCardOpen(false));
businessCard.addEventListener('keydown', event => {
  if (event.key === 'Escape' && businessCard.classList.contains('is-open')) {
    event.preventDefault();
    setCardOpen(false);
  }
});
window.matchMedia('(max-width: 700px)').addEventListener('change', () => {
  setCardOpen(businessCard.classList.contains('is-open'), false);
});
