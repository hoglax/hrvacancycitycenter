(() => {
  'use strict';
  const d = window.PROJECT_DATA;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const num = (value, digits = 0) => value == null ? 'Не рассчитано' : new Intl.NumberFormat('ru-RU', {minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
  const money = value => value == null ? '<span class="subtle">Не рассчитано</span>' : `${num(value)} ₽`;
  const million = value => num(value / 1e6, 2);
  const signed = value => `${value > 0 ? '+' : ''}${num(value)} ₽`;
  const monthNames = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
  const arrow = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8"/></svg>';
  const safeUrl = value => {try {const url = new URL(value);return ['https:','http:'].includes(url.protocol) ? esc(url.href) : '#';} catch {return '#';}};
  $$('[data-source]').forEach(link => link.href = d.sourceUrl);
  $('#print-button').addEventListener('click', () => window.print());

  function showView(id, updateHash = true) {
    if (!['cities','launch','finance','team','data'].includes(id)) id = 'cities';
    $$('.view').forEach(view => view.hidden = view.id !== id);
    $$('[data-view]').forEach(link => {if (link.dataset.view === id) link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    if (updateHash) history.replaceState(null,'',`#${id}`);
  }
  $$('[data-view]').forEach(link => link.addEventListener('click', event => {event.preventDefault();showView(link.dataset.view);}));
  $$('[data-go]').forEach(button => button.addEventListener('click', () => {showView(button.dataset.go);window.scrollTo({top:0,behavior:'instant'});$(`[data-view="${button.dataset.go}"]`).focus();}));
  window.addEventListener('hashchange', () => showView(location.hash.slice(1),false));

  let scope = 'core';
  let mode = 'comparable';
  const selected = new Set(d.cities.filter(c => c.core).map(c => c.id));
  const citiesInScope = () => d.cities.filter(c => scope === 'all' || c.core);
  const valuesFor = city => mode === 'local' ? city.local : city;
  function renderPicks() {
    $('#city-picks').innerHTML = citiesInScope().map(c => `<label class="city-pick"><input type="checkbox" value="${esc(c.id)}" ${selected.has(c.id) ? 'checked' : ''}><span>${esc(c.name)}</span>${!c.core ? '<span class="small-dot" title="Альтернатива"></span>' : ''}</label>`).join('');
    $$('[data-scope]').forEach(button => button.setAttribute('aria-pressed',button.dataset.scope === scope));
  }
  function renderCities() {
    let cities = citiesInScope().filter(c => selected.has(c.id));
    const sort = $('#city-sort').value;
    cities.sort((a,b) => sort === 'cost' ? valuesFor(a).cost-valuesFor(b).cost : sort === 'result' ? valuesFor(b).result-valuesFor(a).result : a.order-b.order);
    $('#city-rows').innerHTML = cities.map(c => {const v=valuesFor(c);return `<tr><td><button class="city-name" data-city-detail="${esc(c.id)}">${esc(c.name)}</button><span class="city-sub">${esc(c.region)}${c.id === 'ufa' ? ' · обновлено 07.10' : !c.core ? ' · альтернатива' : ''}</span></td><td class="amount">${money(v.cost)}</td><td>${num(v.deals)} <span class="subtle">/ мес.</span></td><td class="positive amount">${signed(v.result)}</td><td>${money(c.rent)}</td><td>${num(c.vacancies)}</td></tr>`;}).join('');
    $('#empty-cities').hidden = cities.length !== 0;
    $('.city-table').hidden = cities.length === 0;
    $('#selection-count').textContent = `Выбрано: ${cities.length} из ${citiesInScope().length}`;
    $('#comparison-description').textContent = mode === 'comparable' ? '30 агентов · 150 м² · единый оклад рекрутера 85 000 ₽. Между городами меняется ставка выбранного объявления.' : '30 агентов · 150 м². Оклад рекрутера по местным допущениям: 50 / 85 / 90 / 105 / 85 тыс. ₽. Это не измеренные рыночные медианы.';
    const max = Math.max(...cities.map(c => valuesFor(c).cost));
    $('#city-bars').innerHTML = cities.length ? cities.map(c => `<div class="bar-row"><a href="#cities" data-city-detail="${esc(c.id)}">${esc(c.name)}</a><div class="bar-track"><div class="bar-fill" style="width:${valuesFor(c).cost / max * 100}%"></div></div><strong>${num(valuesFor(c).cost)}</strong></div>`).join('') : '<p class="empty-bars">Здесь появятся выбранные города.</p>';
  }
  $('#city-picks').addEventListener('change', event => {if (event.target.matches('input')) {if(event.target.checked)selected.add(event.target.value);else selected.delete(event.target.value);renderCities();}});
  $('#reset-cities').addEventListener('click', () => {citiesInScope().forEach(c => selected.add(c.id));renderPicks();renderCities();});
  $$('[data-scope]').forEach(button => button.addEventListener('click', () => {
    scope = button.dataset.scope;
    if (scope === 'all') {mode='comparable';$('#cost-mode').value=mode;d.cities.filter(c=>!c.core).forEach(c=>selected.add(c.id));}
    renderPicks();renderCities();
  }));
  $('#cost-mode').addEventListener('change', () => {mode=$('#cost-mode').value;if(mode === 'local')scope='core';renderPicks();renderCities();});
  $('#city-sort').addEventListener('change',renderCities);

  function showCity(id) {
    const c = d.cities.find(city => city.id === id);
    if (!c) return;
    const v = valuesFor(c) || c;
    $('#city-detail').innerHTML = `<h2 class="dialog-title">${esc(c.name)}</h2><p class="dialog-region">${esc(c.region)} · ${c.core ? 'Рабочая пятёрка' : 'Альтернатива'}</p><div class="dialog-stats"><div class="dialog-stat"><span>Расходы зрелого офиса / месяц</span><b>${money(v.cost)}</b></div><div class="dialog-stat"><span>Порог оплаченных сделок</span><b>${num(v.deals)} <small>/ мес.</small></b></div><div class="dialog-stat"><span>Вторичка, предложение за м²</span><b>${num(c.secondary,1)} <small>тыс. ₽</small></b></div><div class="dialog-stat"><span>Первичка, предложение за м²</span><b>${num(c.primary,1)} <small>тыс. ₽</small></b></div></div><div class="dialog-section"><h4>Почему в исследовании</h4><p>${esc(c.reason)}</p></div><div class="dialog-section"><h4>Аренда — исходный ориентир</h4><p>${esc(c.rentAddress)}. ${esc(c.rentNote)}</p><a class="source-link" href="${safeUrl(c.rentUrl)}" target="_blank" rel="noopener">Объявление ${arrow}</a></div><div class="dialog-section"><h4>Подход к найму</h4><p>${esc(c.hiring)}</p><p style="margin-top:8px">Наблюдаемые работодатели: ${esc(c.competitors)}</p></div><div class="dialog-section"><h4>Что проверить до открытия</h4><p>${esc(c.check)}</p></div>${c.core ? `<div class="dialog-section"><h4>Клиентский поток — отдельная проверка</h4><p>При текущей рекламной гипотезе: ${num(c.clientDeals,2)} сделки / месяц и результат <span class="negative">${signed(c.clientResult)}</span>. Это отличается от плана 21 сделки в сравнении выше и пока не связано с общей моделью.</p></div>` : ''}<div class="dialog-section"><h4>Свежесть hh</h4><p>${esc(c.vacancySource)}</p><p style="margin-top:7px">${num(c.vacancies)} — широкий счётчик, включая смежные роли.</p></div>`;
    $('#city-dialog').showModal();
    $('#close-dialog').focus();
  }
  document.addEventListener('click', event => {const item=event.target.closest('[data-city-detail]');if(item){event.preventDefault();showCity(item.dataset.cityDetail);}});
  $('#close-dialog').addEventListener('click', () => $('#city-dialog').close());
  $('#city-dialog').addEventListener('click', event => {if(event.target === $('#city-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});

  let calendar = 'waves';
  const launchRows = [
    ['financing','Финансирование с резервом',c=>`${million(c.financing)} млн ₽`],
    ['deficit','Максимальный кассовый разрыв',c=>`${million(c.deficit)} млн ₽`],
    ['reserve','Дополнительный резерв',c=>`${million(c.reserve)} млн ₽`],
    ['commissions2027','Полученные комиссии 2027',c=>`${million(c.commissions2027)} млн ₽`],
    ['cash2027','Денежный поток 2027',c=>`${million(c.cash2027)} млн ₽`],
    ['agents2027','Агенты на конец 2027, модель',c=>num(c.agents2027,1)],
    ['last','Последнее открытие',c=>`${monthNames[Math.max(...c.months)-1]} 2027`],
    ['cumulative2029','Накопленный поток конца 2029',c=>`${million(c.cumulative2029)} млн ₽`]
  ];
  function renderLaunch() {
    $('#launch-options').innerHTML = d.calendars.map((c,i)=>`<button class="launch-option" data-calendar="${c.id}" aria-pressed="${c.id===calendar}"><span class="option-kicker">Вариант 0${i+1}</span><span class="option-circle" aria-hidden="true"></span><h3>${esc(c.label)}</h3><p>${esc(c.description)}</p><span class="option-cost">${million(c.financing)} <small>млн ₽</small></span><span class="option-caption">Финансирование на весь горизонт с резервом</span></button>`).join('');
    $('#launch-comparison').innerHTML = `<caption class="sr-only">Сравнение трёх календарей запуска сети</caption><thead><tr><th scope="col">Показатель</th>${d.calendars.map(c=>`<th class="${c.id===calendar?'selected-col table-heading':''}" scope="col">${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${launchRows.map(([key,label,format])=>`<tr><th scope="row">${esc(label)}</th>${d.calendars.map(c=>`<td class="${c.id===calendar?'selected-col ':''}${key==='cash2027'||key==='cumulative2029'?'negative':''}">${format(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    const c = d.calendars.find(c=>c.id===calendar);
    $('#timeline-title').textContent = `Календарь: ${c.label.toLowerCase()}`;
    $('#timeline').innerHTML = `<div class="timeline"><div>Открытие офиса</div>${monthNames.map(m=>`<div class="tl-header">${m}</div>`).join('')}${c.months.map((m,i)=>`<div class="tl-label">Офис ${i+1}</div>${monthNames.map((_,j)=>`<div class="${j+1===m?'tl-opening':j+1>m?'tl-active':''}" ${j+1===m?`aria-label="Офис ${i+1}: открытие ${monthNames[j]} 2027"`:''}>${j+1===m?'Старт':''}</div>`).join('')}`).join('')}</div>`;
  }
  $('#launch-options').addEventListener('click', event=>{const button=event.target.closest('[data-calendar]');if(button){calendar=button.dataset.calendar;renderLaunch();$(`[data-calendar="${calendar}"]`).focus({preventScroll:true});}});
  $('#stress-table').innerHTML = `<caption class="sr-only">Стресс-проверка открытия волнами</caption><thead><tr><th scope="col">Показатель</th>${d.stress.map(s=>`<th scope="col">${esc(s.label)}</th>`).join('')}</tr></thead><tbody>${[
    ['Финансирование с резервом',s=>`${million(s.financing)} млн ₽`],['Дополнительно к базе',s=>`${s.extra?'+' : ''}${million(s.extra)} млн ₽`],['Агенты на конец 2027, модель',s=>num(s.agents2027,1)],['Стартовая команда / ежемесячный найм',s=>`${num(s.teamShare)}% / ${num(s.hireShare)}%`],['Дополнительные месяцы без сделок',s=>num(s.delay)],['Доля планового объёма сделок',s=>`${num(s.dealShare)}%`]
  ].map(([label,format])=>`<tr><th scope="row">${label}</th>${d.stress.map(s=>`<td>${format(s)}</td>`).join('')}</tr>`).join('')}</tbody>`;

  const metric = (label,value,note) => `<article class="metric-card"><span>${esc(label)}</span><b>${value}</b><p>${esc(note)}</p></article>`;
  const f=d.finance;
  $('#finance-scenario').textContent = `Сценарий: ${f.scenario}`;
  $('#finance-metrics').innerHTML = metric('Финансирование с резервом',`${million(f.financing)} <small>млн ₽</small>`,'Весь горизонт 2027–2029')+metric('Максимальный кассовый разрыв',`${million(f.deficit)} <small>млн ₽</small>`,`Плюс резерв ${million(f.reserve)} млн ₽`)+metric('Поступившие комиссии 2027',`${million(f.commissions2027)} <small>млн ₽</small>`,'До выплаты агентам')+metric('Денежная окупаемость','<span style="font-size:19px">Не достигнута</span>','До конца 2029 года');
  let year='2027';
  const series=f.series;
  function renderFinance() {
    $$('[data-year]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.year===year));
    const start=year==='all'?0:(Number(year)-2027)*12;
    const end=year==='all'?36:start+12;
    const cumulative=series['Накопленный денежный поток, ₽'].slice(start,end).map(v=>v/1e6);
    const monthly=series['Чистый денежный поток, ₽'].slice(start,end).map(v=>v/1e6);
    const width=1060,height=300,left=57,right=26,top=18,bottom=40;
    const low=Math.floor(Math.min(0,...cumulative,...monthly)/10)*10;
    const high=Math.max(5,Math.ceil(Math.max(0,...cumulative,...monthly)/5)*5);
    const y=v=>top+(high-v)/(high-low)*(height-top-bottom);
    const x=i=>left+i/(end-start-1)*(width-left-right);
    const path=values=>values.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const labels=Array.from({length:end-start},(_,i)=>i).filter(i=>year==='all'?i%6===0||i===end-start-1:i%2===0||i===end-start-1);
    let grid='';for(let i=0;i<=5;i++){const v=low+(high-low)*i/5;grid+=`<line x1="${left}" x2="${width-right}" y1="${y(v)}" y2="${y(v)}" stroke="#e9ede2"/><text x="${left-12}" y="${y(v)+4}" text-anchor="end">${num(v)}</text>`;}
    $('#finance-chart').innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="cash-chart-title cash-chart-desc"><title id="cash-chart-title">Денежный поток, ${year==='all'?'2027–2029':year}</title><desc id="cash-chart-desc">Накопленный поток от ${million(cumulative[0]*1e6)} до ${million(cumulative.at(-1)*1e6)} миллиона рублей. Точные значения доступны в таблице ниже.</desc>${grid}<line x1="${left}" x2="${width-right}" y1="${y(0)}" y2="${y(0)}" stroke="#cad5be" stroke-dasharray="4 4"/><path d="${path(cumulative)} L${x(cumulative.length-1)},${y(0)} L${x(0)},${y(0)}Z" fill="#e9f0e0"/><path d="${path(cumulative)}" fill="none" stroke="#547b48" stroke-width="3"/><path d="${path(monthly)}" fill="none" stroke="#7190cc" stroke-width="2.3"/>${labels.map(i=>`<text x="${x(i)}" y="${height-13}" text-anchor="middle">${year==='all'?`${monthNames[(start+i)%12]} ${2027+Math.floor((start+i)/12)}`:monthNames[i]}</text>`).join('')}</svg>`;
    $('#finance-table').innerHTML=`<caption class="sr-only">Помесячная модель, ${year==='all'?'все годы':year}</caption><thead><tr>${['Месяц','Офисы','Агенты','Комиссии, ₽','Чистый поток, ₽','Накопленный, ₽'].map(label=>`<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${Array.from({length:end-start},(_,i)=>{const j=start+i;return `<tr><th scope="row">${esc(f.months[j])}</th><td>${num(series['Открыто офисов'][j])}</td><td>${num(series['Агенты на конец месяца'][j],1)}</td><td>${num(series['Поступило комиссий, ₽'][j])}</td><td class="${series['Чистый денежный поток, ₽'][j]<0?'negative':'positive'}">${num(series['Чистый денежный поток, ₽'][j])}</td><td class="negative">${num(series['Накопленный денежный поток, ₽'][j])}</td></tr>`;}).join('')}</tbody>`;
  }
  $$('[data-year]').forEach(button=>button.addEventListener('click',()=>{year=button.dataset.year;renderFinance();}));
  $('#trade-table').innerHTML=`<caption class="sr-only">Разбор одной сделки</caption><thead><tr><th scope="col">Показатель</th>${['Вторичка','Новостройка','Смесь'].map(v=>`<th scope="col">${v}</th>`).join('')}</tr></thead><tbody>${d.trade.map(t=>`<tr><th scope="row">${esc(t.label)}</th>${t.values.map(v=>`<td>${typeof v==='number'?num(v,t.label.includes('/ комиссия')?1:0)+(t.label.includes('/ комиссия')?'%':''):esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>`;

  const h=d.hiring;
  $('#team-metrics').innerHTML=metric('Агенты первого набора',num(h.agents),'12 человек на каждый офис')+metric('Опытное ядро',num(h.agents-h.beginners),'4 опытных агента на офис')+metric('Новички',num(h.beginners),'8 новичков на офис')+metric('Общая нагрузка найма',`${num(h.hours)} <small>часов</small>`,'На первый набор пяти офисов');
  $('#hiring-table').innerHTML=`<caption class="sr-only">Городские дополнения к бюджету найма</caption><thead><tr>${['Город','Подбор и обучение','Доплата рекрутеру','Поддержка новичков','Статус разбора'].map(label=>`<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${d.cities.filter(c=>c.core).map(c=>`<tr><th scope="row"><button class="city-name" data-city-detail="${c.id}">${esc(c.name)}</button></th><td>${money(c.hireBudget)}</td><td>${money(c.recruiterExtra)}</td><td>${money(c.newbieSupport)}</td><td>${esc(c.hireStatus)}</td></tr>`).join('')}</tbody>`;
  $('#capacity').innerHTML=[['Общая команда рекрутеров',h.centralRecruiters,'Альтернатива — 5 отдельных городских рекрутеров'],['Онлайн-группы обучения',h.groups,'По 10 новичков из разных городов'],['Тренер при поэтапном обучении',h.trainers,'Нижняя граница; параллельные группы требуют больше ресурса'],['Наставники',h.mentors,`${num(h.mentorHours)} часов в неделю на сеть — часть рабочего времени опытных агентов`]].map(([label,value,note])=>`<div class="capacity-row"><span>${label}<small>${note}</small></span><b>${num(value)}</b></div>`).join('');
  $('#hiring-funnel').innerHTML=[['Дозвоны',h.calls],['Приглашения',h.invites],['Интервью',h.interviews],['Оформления',h.agents]].map(([label,value])=>`<div><span>${label}</span><b>${num(value)}</b></div>`).join('');
  $('#newbie-table').innerHTML=`<caption class="sr-only">Расходы на новичка до первых поступлений</caption><thead><tr><th scope="col">Город</th><th scope="col">До начала вторички</th><th scope="col">До начала первички</th></tr></thead><tbody>${d.cities.map(c=>`<tr><th scope="row">${esc(c.name)}${!c.core?' · альтернатива':''}</th><td>${money(c.newbieSecondary)}</td><td>${money(c.newbiePrimary)}</td></tr>`).join('')}</tbody>`;

  const sourceSelect=$('#source-select');
  sourceSelect.innerHTML=d.sources.map((s,i)=>`<option value="${i}">${esc(s.sheet)} · ${esc(s.range)}</option>`).join('');
  function columnName(index) {let label='';for(let n=index+1;n;n=Math.floor((n-1)/26))label=String.fromCharCode(65+(n-1)%26)+label;return label;}
  function renderSource() {
    const s=d.sources[Number(sourceSelect.value)];
    const match=s.range.match(/^([A-Z]+)(\d+)/);
    const startCol=[...match[1]].reduce((n,c)=>n*26+c.charCodeAt(0)-64,0)-1;
    const startRow=Number(match[2]);
    const cols=Math.max(...s.values.map(r=>r.length));
    $('#raw-data').innerHTML=`<table><caption class="sr-only">${esc(s.sheet)}, ${esc(s.range)}</caption><thead><tr><th scope="col">Строка</th>${Array.from({length:cols},(_,i)=>`<th scope="col">${columnName(startCol+i)}</th>`).join('')}</tr></thead><tbody>${s.values.map((r,i)=>`<tr><th scope="row">${startRow+i}</th>${Array.from({length:cols},(_,j)=>`<td>${esc(r[j])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    $('#source-range').textContent=`Лист «${s.sheet}» · диапазон ${s.range} · прочитано ${d.asOf}`;
  }
  sourceSelect.addEventListener('change',renderSource);
  renderPicks();renderCities();renderLaunch();renderFinance();renderSource();
  showView(location.hash.slice(1),false);
})();
