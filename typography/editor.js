'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const frame = $('site'), key = 'corex-typography-v1';
  const fields = [...document.querySelectorAll('[data-prop]')];
  const textSelector = 'h1,h2,h3,h4,h5,h6,p,a,button,label,li,span,strong,small,summary,figcaption,dt,dd,address';
  let rules = [], undo = [], redo = [], selected = null, elements = [], style, doc, pending = null;
  const base = new URL('../', location.href);
  const route = () => ($('language').value === 'kk' ? 'kk/' : '') + $('page').value;
  const snapshot = () => JSON.stringify(rules);
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved?.version === 1 && Array.isArray(saved.rules)) rules = saved.rules;
  } catch { $('status').textContent = 'Не удалось прочитать черновик. Экспортируйте новые настройки.'; }

  function save() {
    try { localStorage.setItem(key, JSON.stringify({version:1,rules})); $('status').textContent = 'Черновик сохранён в этом браузере'; }
    catch { $('status').textContent = 'Хранилище недоступно. Сохраните результат через экспорт.'; }
    $('rule-count').textContent = `${rules.length} настроек`;
    $('undo').disabled = !undo.length; $('redo').disabled = !redo.length;
  }
  function commit() {
    if (pending !== null && pending !== snapshot()) { undo.push(pending); if (undo.length > 100) undo.shift(); redo = []; }
    pending = null; save();
  }
  function begin() { if (pending === null) pending = snapshot(); }
  function pathFor(el) {
    const parts = [];
    while (el && el !== doc.body) {
      if (el.id && doc.querySelectorAll('#' + CSS.escape(el.id)).length === 1) { parts.unshift('#' + CSS.escape(el.id)); break; }
      const tag = el.localName;
      const siblings = [...el.parentElement.children].filter(e => e.localName === tag);
      parts.unshift(`${tag}:nth-of-type(${siblings.indexOf(el)+1})`); el = el.parentElement;
    }
    return parts.join(' > ');
  }
  const scope = () => $('scope').value;
  function identity() {
    if (!selected) return null;
    return {language:$('language').value,device:$('device').value,scope:scope(),page:scope()==='type'?'*':route(),selector:scope()==='type'?selected.localName:pathFor(selected)};
  }
  const same = (a,b) => b && ['language','device','scope','page','selector'].every(k=>a[k]===b[k]);
  function ruleForSelection() { return rules.find(r=>same(r,identity())); }
  function cssFor(pageRoute, language) {
    return [...rules].sort((a,b)=>(a.kind==='font-replacement'?0:(a.scope==='element'?2:1))-(b.kind==='font-replacement'?0:(b.scope==='element'?2:1))).filter(r=>r.language===language&&(r.page==='*'||r.page===pageRoute)).map(r=>{
      if (r.kind === 'font-replacement') {
        return `@media (${r.device==='mobile'?'max-width: 700px':'min-width: 701px'}) {\n:root:root:root:root:lang(${language}) [data-type-font="${r.source}"] {\n  font-family: "${r.target}", sans-serif !important;\n}\n}`;
      }
      const declarations = Object.entries(r.properties).map(([k,v])=>`  ${k}: ${v} !important;`).join('\n');
      // Repeated :root gives inspector rules priority over existing site selectors.
      const selector = `:root:root:root:root:lang(${language}) ${r.selector}`;
      return `@media (${r.device==='mobile'?'max-width: 700px':'min-width: 701px'}) {\n${selector} {\n${declarations}\n}\n}`;
    }).join('\n\n');
  }
  function replacementIdentity() {
    return {kind:'font-replacement',language:$('language').value,device:$('device').value,source:$('replace-source').value,page:$('replace-scope').value==='language'?'*':route()};
  }
  function replacementFor() {
    const id = replacementIdentity();
    return rules.find(r=>r.kind==='font-replacement'&&['language','device','source','page'].every(k=>r[k]===id[k]));
  }
  function syncReplacements() {
    const unbounded = $('language').value !== 'kk';
    $('replace-target').querySelector('[value="Unbounded"]').disabled = !unbounded;
    if (!unbounded && $('replace-target').value === 'Unbounded') $('replace-target').value = '';
    const replacement = replacementFor();
    $('reset-font-replace').disabled = !replacement;
    $('replace-note').textContent = replacement
      ? `Замена ${replacement.source==='unbounded'?'Unbounded':'Golos Text'} → ${replacement.target} уже показана в предпросмотре.`
      : 'Выберите оба шрифта — замена сразу появится в предпросмотре.';
  }
  function editReplacement() {
    const source=$('replace-source').value,target=$('replace-target').value;
    if (!source || !target || ($('language').value==='kk'&&target==='Unbounded')) { syncReplacements(); return; }
    begin();
    const id=replacementIdentity();
    rules=rules.filter(r=>!(r.kind==='font-replacement'&&['language','device','source','page'].every(k=>r[k]===id[k])));
    rules.push({...id,target}); apply(); commit(); syncReplacements();
  }
  function apply() { if (style) style.textContent = cssFor(route(),$('language').value); updateWarning(); }
  function updateWarning() {
    if (!selected || !doc) { $('warning').hidden = true; return; }
    const c = frame.contentWindow.getComputedStyle(selected), size = parseFloat(c.fontSize);
    const crowded = parseFloat(c.lineHeight)/size < 1.05;
    const overflow = selected.scrollWidth > selected.clientWidth + 2 && selected.clientWidth > 0;
    $('warning').hidden = !crowded && !overflow;
    $('warning').textContent = overflow ? 'Текст выходит за ширину блока. Увеличьте ширину или уменьшите размер.' : 'Строки очень близко. Проверьте буквы с верхними и нижними элементами.';
  }
  function syncFields() {
    $('controls').disabled = !selected;
    $('reset-selection').disabled = !ruleForSelection();
    syncReplacements();
    if (!selected) return;
    const c = frame.contentWindow.getComputedStyle(selected), rule = ruleForSelection();
    for (const input of fields) {
      const prop = input.dataset.prop, value = c.getPropertyValue(prop);
      if (prop === 'font-family') input.value = value.includes('Unbounded')?'Unbounded':'Golos Text';
      else if (prop === 'color') {
        const rgb=value.match(/\d+/g); input.value=rgb&&rgb.length>=3?'#'+rgb.slice(0,3).map(n=>Number(n).toString(16).padStart(2,'0')).join(''):'#171d26';
      }
      else if (prop === 'font-weight') input.value = value;
      else if (prop === 'text-align') input.value = value;
      else if (prop === 'line-height') input.value = Math.round((parseFloat(value)||parseFloat(c.fontSize)*1.2)/parseFloat(c.fontSize)*100);
      else input.value = value === 'none' ? '' : (Math.round((parseFloat(value)||0)*10)/10);
      input.title = rule?.properties[prop] ? 'Ваше значение: '+rule.properties[prop] : 'Текущее значение сайта';
    }
    $('font-family').querySelector('[value="Unbounded"]').disabled = $('language').value === 'kk';
    const matches = doc.querySelectorAll(selected.localName).length;
    $('scope-note').textContent = scope()==='type'
      ? `Все ${selected.localName.toUpperCase()} на всех страницах ${$('language').value.toUpperCase()} для этого экрана. На текущей странице: ${matches}. Индивидуальные настройки имеют приоритет.`
      : `Только этот элемент, страница «${$('page').selectedOptions[0].textContent}», ${$('language').value.toUpperCase()}, ${$('device').selectedOptions[0].textContent.toLowerCase()}.`;
    updateWarning();
  }
  function select(el, scroll=false) {
    commit();
    if (selected) selected.removeAttribute('data-type-selected');
    selected = el;
    if (!el) { $('tag').textContent='Ничего не выбрано'; $('selected-text').textContent='Выберите текст на странице.'; syncFields(); return; }
    el.setAttribute('data-type-selected','');
    $('tag').textContent = el.localName.toUpperCase(); $('selected-text').textContent = el.textContent.trim();
    $('elements').value = String(elements.indexOf(el)); syncFields();
    if (scroll) {
      const scene = el.closest('.film-scene'), film = el.closest('.scroll-film');
      if (scene && film?.classList.contains('is-scroll-film')) {
        const scenes = [...film.querySelectorAll('.film-scene')], header = doc.querySelector('header').offsetHeight;
        const y = film.offsetTop-header+(film.offsetHeight-frame.contentWindow.innerHeight)*(scenes.indexOf(scene)+.35)/scenes.length;
        frame.contentWindow.scrollTo(0,Math.max(0,y));
      } else el.scrollIntoView({block:'center',behavior:'instant'});
    }
  }
  function edit(input) {
    if (!selected || !input.checkValidity()) return;
    begin();
    const id = identity(); let rule = ruleForSelection();
    if (!rule) { rule={...id,properties:{}}; rules.push(rule); }
    const p=input.dataset.prop, raw=input.value;
    if (raw==='') delete rule.properties[p];
    else rule.properties[p] = p==='font-family'?`"${raw}", sans-serif`:p==='line-height'?String(Number(raw)/100):['font-weight','text-align','color'].includes(p)?raw:raw+'px';
    rules=rules.filter(r=>r.kind==='font-replacement'||Object.keys(r.properties||{}).length);
    apply(); save(); $('reset-selection').disabled=!ruleForSelection();
  }
  for (const input of fields) {
    input.addEventListener('input',()=>edit(input));
    input.addEventListener('change',()=>{commit();syncFields();});
    input.addEventListener('blur',commit);
  }
  function history(direction) {
    commit(); const source=direction==='undo'?undo:redo, target=direction==='undo'?redo:undo;
    if (!source.length) return; target.push(snapshot()); rules=JSON.parse(source.pop()); apply();save();syncFields();
  }
  $('undo').onclick=()=>history('undo'); $('redo').onclick=()=>history('redo');
  function shortcuts(e) {
    if ((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z' && !['INPUT','TEXTAREA'].includes(e.target.tagName)) {e.preventDefault();history(e.shiftKey?'redo':'undo');}
  }
  document.addEventListener('keydown',shortcuts);
  $('reset-selection').onclick=()=>{begin();rules=rules.filter(r=>!same(r,identity()));apply();commit();syncFields();};
  $('reset-all').onclick=()=>$('reset-dialog').showModal();
  $('reset-dialog').addEventListener('close',()=>{if($('reset-dialog').returnValue==='reset'){begin();rules=[];apply();commit();syncFields();}});
  $('scope').onchange=()=>{commit();syncFields();};
  for (const id of ['replace-source','replace-target','replace-scope']) $(id).onchange=editReplacement;
  $('reset-font-replace').onclick=()=>{
    const id=replacementIdentity(); begin();
    rules=rules.filter(r=>!(r.kind==='font-replacement'&&['language','device','source','page'].every(k=>r[k]===id[k])));
    apply();commit();syncReplacements();
  };
  $('elements').onchange=()=>select(elements[Number($('elements').value)],true);
  function resize() {
    const mobile=$('device').value==='mobile', width=mobile?390:1536, height=mobile?844:960;
    const fit=Math.max(.1,Math.min(1,($('canvas').clientWidth-48)/width));
    const scale=$('zoom').value==='fit'?fit:Number($('zoom').value);
    frame.style.width=width+'px';frame.style.height=height+'px';frame.style.transform=`scale(${scale})`;
    $('frame-wrap').style.width=width*scale+'px';$('frame-wrap').style.height=height*scale+'px';
    $('viewport-label').textContent=`${width} × ${height} · ${Math.round(scale*100)}%`;
  }
  function load() { commit(); selected=null;syncFields();frame.src=new URL(route()||'./',base).href; }
  for(const id of ['page','language']) $(id).onchange=load;
  $('device').onchange=()=>{commit();resize();apply();requestAnimationFrame(()=>{syncFields();if(selected)select(selected,true);});};
  $('zoom').onchange=resize;new ResizeObserver(resize).observe($('canvas'));
  frame.addEventListener('load',()=>{
    try {
      doc=frame.contentDocument;
      // Keep navigation inside the chosen preview route; page changes use the toolbar.
      if (!doc || !doc.querySelector('main')) throw Error('Страница не загрузилась');
      // Mark every node by its original family before live overrides are injected.
      doc.querySelectorAll(textSelector).forEach(el=>{
        el.dataset.typeFont=frame.contentWindow.getComputedStyle(el).fontFamily.includes('Unbounded')?'unbounded':'golos';
      });
      style=doc.createElement('style');style.id='typography-overrides';doc.head.append(style);
      const highlight=doc.createElement('style');highlight.textContent='[data-type-selected]{outline:2px solid #0b78eb!important;outline-offset:4px!important} [data-type-hover]{outline:1px dashed #0b78eb!important;outline-offset:3px!important}';doc.head.append(highlight);
      apply();elements=[...doc.querySelectorAll(textSelector)].filter(el=>el.textContent.trim() && !el.closest('svg,script,style') && (el.matches('h1,h2,h3,h4,h5,h6,p,label,figcaption,summary,button')||[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())));
      $('elements').replaceChildren(new Option('Выберите текст…',''));
      elements.forEach((el,i)=>$('elements').add(new Option(`${el.localName.toUpperCase()} · ${el.textContent.trim().replace(/\s+/g,' ').slice(0,85)}`,String(i))));
      const pick = target => {
        const heading=target.closest('h1,h2,h3,h4,h5,h6');if(heading)return heading;
        let el=target.closest(textSelector);while(el&&!elements.includes(el))el=el.parentElement?.closest(textSelector);return el;
      };
      doc.addEventListener('click',e=>{
        if ($('inspect').checked) {e.preventDefault();e.stopImmediatePropagation();const el=pick(e.target);if(el)select(el);}
        else if(e.target.closest('a')&&!e.target.closest('a').getAttribute('href')?.startsWith('#')){e.preventDefault();}
      },true);
      doc.addEventListener('submit',e=>e.preventDefault(),true);
      let hovered;
      doc.addEventListener('mousemove',e=>{if(hovered)hovered.removeAttribute('data-type-hover');hovered=$('inspect').checked?pick(e.target):null;if(hovered&&hovered!==selected)hovered.setAttribute('data-type-hover','');});
      doc.addEventListener('keydown',shortcuts);
      doc.fonts.ready.then(()=>{resize();select(doc.querySelector('#solutions h2') || doc.querySelector('main h1'),true);});
      $('tag').textContent='Ничего не выбрано';$('selected-text').textContent='Выберите текст на странице.';syncFields();save();
    } catch(e) { $('status').textContent='Не удалось открыть предпросмотр. Запустите редактор через локальный сервер.'; }
  });
  function download(name,content,type) {
    const url=URL.createObjectURL(new Blob([content],{type})), link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  $('export').onclick=()=>{
    commit();
    const pages=[...$('page').options].map(o=>o.value), cssByPage={};
    for(const language of ['ru','kk'])for(const page of pages){const r=(language==='kk'?'kk/':'')+page;const css=cssFor(r,language);if(css)cssByPage[r||'/']=css;}
    download('corex-typography.json',JSON.stringify({version:1,createdAt:new Date().toISOString(),breakpoint:700,rules,cssByPage},null,2),'application/json');
    $('status').textContent='JSON экспортирован. Передайте файл в чат для применения.';
  };
  $('export-css').onclick=()=>download(`corex-${route().replaceAll('/','-')||'home'}-typography.css`,'/* CoreX: '+route()+'; подключить после стилей сайта. */\n'+cssFor(route(),$('language').value),'text/css');
  resize();load();save();
})();
