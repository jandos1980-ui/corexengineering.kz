'use strict';
// Keep the QSC card as a concise proof point, leaving room for its visual field.
(() => {
  const copy = document.querySelector('.team-company-content p');
  if (!copy) return;
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
  const baseSubject=form.dataset.subject;
  const task=form.querySelector('[name="task"]');
  let generatedTask='';
  document.querySelectorAll('[data-scenario]').forEach(link=>link.addEventListener('click',()=>{
    const scenario=link.dataset.scenario;
    if(!task.value.trim() || task.value===generatedTask){task.value=scenario;generatedTask=scenario;}
    form.dataset.subject=baseSubject+' — '+scenario;
    document.querySelector('#mail-result').hidden=true;
  }));
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const data=new FormData(form);
    const body=[String(data.get('name')||''),String(data.get('company')||''),'',String(data.get('task')||''),'',location.origin+location.pathname].join('\n');
    document.querySelector('#mail-link').href=`mailto:${form.dataset.email}?subject=${encodeURIComponent(form.dataset.subject)}&body=${encodeURIComponent(body)}`;
    const result=document.querySelector('#mail-result');result.hidden=false;
    document.querySelector('#mail-link').focus({preventScroll:true});
  });
}
document.querySelectorAll('.mobile-menu nav a').forEach(link=>link.addEventListener('click',()=>{link.closest('details').removeAttribute('open');}));

// Keep keyboard focus inside the open navigation and restore it on dismissal.
document.querySelectorAll('.mobile-menu').forEach(menu=>{
  const trigger=menu.querySelector('summary');
  const links=[...menu.querySelectorAll('nav a')];
  menu.addEventListener('toggle',()=>{
    if(menu.open) links[0]?.focus({preventScroll:true});
    else if(menu.contains(document.activeElement)&&document.activeElement!==trigger) trigger.focus({preventScroll:true});
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
