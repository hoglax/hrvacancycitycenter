'use strict';
(() => {
  const form = document.getElementById('unlock-form');
  const input = document.getElementById('password');
  const button = document.getElementById('submit-button');
  const message = document.getElementById('login-message');
  const screen = document.getElementById('login-screen');
  const shell = document.getElementById('unlocked-shell');
  const frame = document.getElementById('project-frame');
  const showPassword = document.getElementById('show-password');
  const decoder = new TextDecoder('utf-8', {fatal:true});
  const fromBase64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  let busy = false;
  let loadTimer;
  function setBusy(value) {
    busy = value;
    button.disabled = value;
    input.disabled = value;
    form.setAttribute('aria-busy', String(value));
    message.classList.toggle('busy',value);
  }
  function lock() {
    clearTimeout(loadTimer);
    frame.removeAttribute('srcdoc');
    frame.src = 'about:blank';
    shell.hidden = true;
    screen.hidden = false;
    document.body.classList.remove('unlocked');
    input.value = '';
    input.type = 'password';
    showPassword.setAttribute('aria-pressed','false');
    showPassword.setAttribute('aria-label','Показать пароль');
    message.textContent = '';
    setBusy(false);
    input.focus();
  }
  showPassword.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    showPassword.setAttribute('aria-pressed',String(show));
    showPassword.setAttribute('aria-label',show?'Скрыть пароль':'Показать пароль');
  });
  document.getElementById('lock-button').addEventListener('click',lock);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if(busy) return;
    let password = input.value.trim();
    if(!password) {input.focus();return;}
    if(!window.isSecureContext || !window.crypto?.subtle || typeof DecompressionStream === 'undefined') {
      message.textContent = 'Откройте сайт по HTTPS в современном браузере.';
      return;
    }
    setBusy(true);
    message.textContent = 'Открываем проект…';
    let phase = 'loading';
    try {
      const response = await fetch(new URL('payload.json',location.href), {cache:'no-store',referrerPolicy:'no-referrer'});
      if(!response.ok) throw new Error('payload unavailable');
      const payload = await response.json();
      if(payload.version !== 1 || payload.algorithm !== 'AES-256-GCM' || payload.iterations !== 600000 || payload.compression !== 'gzip') throw new Error('unsupported payload');
      const salt = fromBase64(payload.salt);
      const iv = fromBase64(payload.iv);
      if(salt.length !== 16 || iv.length !== 12) throw new Error('invalid payload');
      phase = 'decrypting';
      const keyMaterial = await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
      password = '';
      input.value = '';
      const key = await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:payload.iterations,hash:'SHA-256'},keyMaterial,{name:'AES-GCM',length:256},false,['decrypt']);
      const compressed = await crypto.subtle.decrypt({name:'AES-GCM',iv,tagLength:128},key,fromBase64(payload.ciphertext));
      phase = 'opening';
      const decompressed = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
      const html = decoder.decode(await new Response(decompressed).arrayBuffer());
      frame.removeAttribute('src');
      frame.srcdoc = html;
      screen.hidden = true;
      shell.hidden = false;
      document.body.classList.add('unlocked');
      message.textContent = '';
      setBusy(false);
    } catch(error) {
      password = '';
      input.value = '';
      setBusy(false);
      message.textContent = phase === 'decrypting' ? 'Пароль не подошёл. Проверьте его и попробуйте ещё раз.' : 'Не удалось открыть проект. Проверьте соединение и попробуйте снова.';
      input.focus();
    }
  });
  window.addEventListener('pageshow', event => {if(event.persisted) lock();});
})();
