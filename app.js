'use strict';
const form=document.querySelector('#project-form');
if(form){
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const data=new FormData(form);
    const body=[String(data.get('name')||''),String(data.get('company')||''),'',String(data.get('task')||'')].join('\n');
    document.querySelector('#mail-link').href=`mailto:${form.dataset.email}?subject=${encodeURIComponent(form.dataset.subject)}&body=${encodeURIComponent(body)}`;
    const result=document.querySelector('#mail-result');result.hidden=false;
    document.querySelector('#mail-link').focus({preventScroll:true});
  });
}
document.querySelectorAll('.mobile-menu nav a').forEach(link=>link.addEventListener('click',()=>link.closest('details').removeAttribute('open')));
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const menu=document.querySelector('.mobile-menu[open]');if(menu){menu.removeAttribute('open');menu.querySelector('summary').focus();}}});
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
