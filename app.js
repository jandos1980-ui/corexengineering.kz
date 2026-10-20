'use strict';
// Keep the QSC card as a concise proof point, leaving room for its visual field.
(() => {
  const copy = document.querySelector('.team-company-content p');
  if (!copy) return;
  if (document.documentElement.lang === 'en') return;
  copy.textContent = document.documentElement.lang === 'kk'
    ? 'Coolnet авторизациясы расталған: CoreX Engineering өндіруші регламенттері бойынша сервис көрсетеді.'
    : 'Авторизация Coolnet подтверждает: CoreX Engineering выполняет сервис по регламентам производителя.';
})();
// One-time entrances for explanatory groups. Content stays visible without JS.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || reduced.matches) return;
  const selector = '.task-scenario, .about-items > div, .scope-grid > article';
  const pending = new Set(document.querySelectorAll(selector));
  const arriving = new Set();
  let keyboard = false;
  const finish = element => {
    element.classList.remove('content-arriving');
    element.style.removeProperty('--arrival-delay');
    arriving.delete(element);
  };
  const observer = new IntersectionObserver(entries => {
    const groups = new Map();
    entries.filter(entry => entry.isIntersecting).forEach(({target}) => {
      observer.unobserve(target);
      pending.delete(target);
      if (keyboard || reduced.matches || target.contains(document.activeElement)) return;
      const index = groups.get(target.parentElement) || 0;
      groups.set(target.parentElement, index + 1);
      target.style.setProperty('--arrival-delay', `${Math.min(index, 3) * 60}ms`);
      arriving.add(target);
      target.classList.add('content-arriving');
      target.addEventListener('animationend', event => {
        if (event.target === target) finish(target);
      }, {once:true});
    });
  }, {threshold:.15});
  pending.forEach(element => observer.observe(element));
  document.addEventListener('keydown', () => {
    keyboard = true;
    arriving.forEach(finish);
  }, {capture:true});
  document.addEventListener('pointerdown', () => { keyboard = false; }, {passive:true});
  document.addEventListener('focusin', event => {
    const element = event.target.closest(selector);
    if (!element) return;
    observer.unobserve(element);
    pending.delete(element);
    finish(element);
  });
  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    observer.disconnect();
    pending.clear();
    arriving.forEach(finish);
  });
})();
const form=document.querySelector('#project-form');
if(form){
  const lang=document.documentElement.lang;
  const messages={
    ru:{sending:'Отправляем…',success:'Заявка принята к отправке. Спасибо! Мы ответим на указанный email.',error:'Не удалось подтвердить отправку. Текст сохранён в форме. Попробуйте позже или напишите на info@corexengineering.kz.',rate:'Слишком много попыток. Попробуйте через час или напишите на info@corexengineering.kz.'},
    en:{sending:'Sending…',success:'Your enquiry has been accepted for sending. Thank you! We will reply to your email.',error:'We could not confirm sending. Your text is still in the form. Try later or email info@corexengineering.kz.',rate:'Too many attempts. Try again in an hour or email info@corexengineering.kz.'},
    kk:{sending:'Жіберілуде…',success:'Өтінім жіберуге қабылданды. Рақмет! Көрсетілген email мекенжайына жауап береміз.',error:'Жіберілгенін растау мүмкін болмады. Мәтін формада қалды. Кейінірек қайталаңыз немесе info@corexengineering.kz мекенжайына жазыңыз.',rate:'Әрекет тым көп. Бір сағаттан кейін қайталаңыз немесе info@corexengineering.kz мекенжайына жазыңыз.'}
  }[lang] || null;
  if(messages){
    const task=form.querySelector('[name="task"]');
    const result=form.querySelector('#mail-result');
    const status=result.querySelector('[role="status"]');
    const button=form.querySelector('[type="submit"]');
    const validation={
      ru:{required:'Заполните это поле.',email:'Введите email в формате name@example.com без пробелов.'},
      en:{required:'Please fill in this field.',email:'Enter an email like name@example.com without spaces.'},
      kk:{required:'Бұл өрісті толтырыңыз.',email:'Email мекенжайын бос орынсыз name@example.com форматында енгізіңіз.'}
    }[lang];
    const fields=[...form.querySelectorAll('[required]')];
    const emailPattern=/^[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
    const validate=field=>{
      const value=field.value.trim();
      let error=value ? '' : validation.required;
      if(value && field.name==='email' && (!emailPattern.test(value) || value.length>254 || value.split('@')[0].length>64))error=validation.email;
      field.setCustomValidity(error);
    };
    fields.forEach(field=>{
      field.addEventListener('input',()=>validate(field));
      field.addEventListener('blur',()=>{field.value=field.value.trim();validate(field);});
      field.addEventListener('invalid',()=>validate(field));
    });
    let generatedTask='',busy=false;
    document.querySelectorAll('[data-scenario]').forEach(link=>link.addEventListener('click',()=>{
      if(busy)return;
      const scenario=link.dataset.scenario;
      if(!task.value.trim() || task.value===generatedTask){task.value=scenario;generatedTask=scenario;validate(task);}
      result.hidden=true;
    }));
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(busy)return;
      fields.forEach(field=>{field.value=field.value.trim();validate(field);});
      if(!form.reportValidity())return;
      const data=Object.fromEntries(new FormData(form));
      data.language=lang; data.page=location.pathname;
      busy=true;button.disabled=true;form.setAttribute('aria-busy','true');
      result.hidden=false;status.textContent=messages.sending;
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),20000);
      try{
        const response=await fetch(form.action,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data),signal:controller.signal,credentials:'same-origin'});
        if(response.status===429){status.textContent=messages.rate;return;}
        const reply=await response.json();
        if(!response.ok || reply.ok!==true || reply.code!=='accepted')throw new Error('Not accepted');
        status.textContent=messages.success;
        // Keep fields intact: a visitor may have edited them during the request.
      }catch(error){status.textContent=messages.error;}
      finally{clearTimeout(timeout);busy=false;button.disabled=false;form.removeAttribute('aria-busy');}
    });
    form.querySelectorAll('[disabled]').forEach(control=>{control.disabled=false;});
    form.hidden=false;
    document.querySelector('#form-fallback').hidden=true;
  }
}
document.querySelectorAll('.mobile-menu nav a').forEach(link=>link.addEventListener('click',()=>{link.closest('details').removeAttribute('open');}));

// Keep keyboard focus inside the open navigation and restore it on dismissal.
document.querySelectorAll('.mobile-menu').forEach(menu=>{
  const trigger=menu.querySelector('summary');
  const links=[...menu.querySelectorAll('nav a')];
  let openedByHover=false;
  // Hover opens the desktop menu without moving keyboard focus.
  trigger.addEventListener('pointerenter',event=>{
    if(event.pointerType!=='mouse'||!matchMedia('(min-width:701px) and (hover:hover)').matches)return;
    if(!menu.open){openedByHover=true;menu.open=true;}
  });
  menu.addEventListener('toggle',()=>{
    if(menu.open&&!openedByHover) links[0]?.focus({preventScroll:true});
    else if(menu.contains(document.activeElement)&&document.activeElement!==trigger) trigger.focus({preventScroll:true});
    openedByHover=false;
  });
  menu.querySelector('.menu-overlay')?.addEventListener('click',()=>{menu.open=false;});
  menu.addEventListener('keydown',event=>{
    if(!menu.open||event.key!=='Tab')return;
    const items=[trigger,...links];
    if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1).focus();}
    else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();trigger.focus();}
  });
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const menu=document.querySelector('.mobile-menu[open]');if(menu){menu.removeAttribute('open');menu.querySelector('summary').focus();}}});
// The home header is transparent through the first four film chapters, then
// gains its solid surface as the final "next step" chapter enters.
(()=>{
  const film=document.querySelector('.scroll-film');
  const header=document.querySelector('.header');
  const stage=film?.querySelector('.film-stage');
  if(!film||!header||!stage)return;
  let frame=0;
  const render=()=>{
    frame=0;
    const offset=film.getBoundingClientRect().top+scrollY;
    const travel=Math.max(1,film.offsetHeight-stage.offsetHeight);
    const progress=Math.max(0,Math.min(1,(scrollY+header.offsetHeight-offset)/travel));
    // The fifth scene begins its crossfade at 3.74 of five chapters.
    header.classList.toggle('is-solid',progress>=.748);
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(render);};
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});render();
})();
const story=document.querySelector('.story');
if(story){
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const desktop=matchMedia('(min-width: 851px)');
  const scenes=[...story.querySelectorAll('.story-scene')];
  const bars=[...story.querySelectorAll('.story-progress i')];
  let frame=0;
  const clamp=value=>Math.max(0,Math.min(1,value));
  function render(){
    frame=0;
    if(!story.classList.contains('is-motion'))return;
    const travel=Math.max(1,story.offsetHeight-story.querySelector('.story-stage').offsetHeight);
    const p=clamp(-story.getBoundingClientRect().top/travel);
    const a=clamp((p-.25)/.12),b=clamp((p-.64)/.12);
    const opacity=[1-a,a*(1-b),b];
    const active=opacity.indexOf(Math.max(...opacity));
    scenes.forEach((scene,i)=>{scene.style.opacity=opacity[i];scene.setAttribute('aria-hidden',String(i!==active));scene.inert=i!==active;});
    bars.forEach((bar,i)=>bar.classList.toggle('active',i===active));
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(render);}
  function configure(){
    const motion=desktop.matches&&!preference.matches;
    story.classList.toggle('is-motion',motion);
    scenes.forEach(scene=>{scene.style.opacity='';scene.removeAttribute('aria-hidden');scene.inert=false;});
    if(motion)schedule();
  }
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',configure,{passive:true});
  preference.addEventListener('change',configure);desktop.addEventListener('change',configure);configure();
  addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);});
  addEventListener('pageshow',configure);
}

/* Purposeful motion; native disclosure semantics and no-JS content are retained. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ease = getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim();
  const steps = [...document.querySelectorAll('#approach .steps li')];
  let observer;
  if ('IntersectionObserver' in window && !reduced.matches) {
    observer = new IntersectionObserver(entries => {
      const entering = entries.filter(entry => entry.isIntersecting);
      entering.forEach((entry, index) => {
        const step = entry.target;
        step.style.setProperty('--step-delay', `${index * 60}ms`);
        step.classList.add('step-arriving');
        observer.unobserve(step);
      });
    }, {threshold: .2});
    steps.forEach(step => observer.observe(step));
  }

  const disclosures = [...document.querySelectorAll('.faq details, .modular-applications, .mobile-menu')];
  const finishers = [];
  disclosures.forEach(details => {
    const summary = details.querySelector('summary');
    const menu = details.classList.contains('mobile-menu');
    const target = menu ? details.querySelector('nav') : details;
    let animation = null, desired = details.open;
    function settle() {
      if (animation) { animation.cancel(); animation = null; }
      details.open = desired;
      details.style.overflow = '';
      summary.removeAttribute('aria-expanded');
    }
    finishers.push(() => { if (animation) settle(); });
    summary.addEventListener('click', event => {
      if (!target.animate) return;
      event.preventDefault();
      desired = animation ? !desired : !details.open;
      const startHeight = details.getBoundingClientRect().height;
      const style = getComputedStyle(target);
      const startOpacity = details.open ? style.opacity : '0';
      const startTransform = details.open ? style.transform : 'translateY(-6px)';
      if (animation) { animation.cancel(); animation = null; }
      if (reduced.matches || event.detail === 0) { settle(); return; }
      let frames;
      if (menu) {
        details.open = true;
        frames = [{opacity:startOpacity, transform:startTransform},
          {opacity:desired ? 1 : 0, transform:desired ? 'translateY(0)' : 'translateY(-6px)'}];
      } else {
        details.open = desired;
        const endHeight = details.getBoundingClientRect().height;
        details.open = true;
        details.style.overflow = 'hidden';
        frames = [{height:`${startHeight}px`}, {height:`${endHeight}px`}];
      }
      summary.setAttribute('aria-expanded', String(desired));
      animation = target.animate(frames, {duration:200, easing:ease});
      animation.onfinish = settle;
    });
    // Existing menu links and Escape close natively, also during an entrance.
    details.addEventListener('toggle', () => {
      if (!details.open && animation) { desired = false; settle(); }
      if (!animation) desired = details.open;
    });
  });
  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    observer?.disconnect();
    steps.forEach(step => step.classList.remove('step-arriving'));
    finishers.forEach(finish => finish());
  });
  addEventListener('resize', () => finishers.forEach(finish => finish()), {passive:true});
})();
