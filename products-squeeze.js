/* Progressive enhancement: catalog links remain available without JavaScript. */
(() => {
  const section = document.querySelector('#products');
  if (!section) return;
  const grid = section.querySelector('.product-grid');
  const cards = [...grid.querySelectorAll('.product-card')];
  if (cards.length < 2) return;
  const kk = document.documentElement.lang === 'kk';
  const slides = cards.map(card => ({summary:card.querySelector('.product-summary').textContent,title:card.querySelector('h3').textContent, href:card.getAttribute('href'), image:card.querySelector('img').cloneNode(true), action:card.querySelector('.product-link').firstChild.textContent}));
  const root = document.createElement('div'); root.className='sq-carousel';
  const controls=document.createElement('div'); controls.className='sq-controls';
  const prev=document.createElement('button'), next=document.createElement('button');
  for(const [button,label,symbol] of [[prev,kk?'Алдыңғы жабдық':'Предыдущее оборудование','←'],[next,kk?'Келесі жабдық':'Следующее оборудование','→']]){button.type='button';button.setAttribute('aria-label',label);button.textContent=symbol;}
  controls.append(prev,next);
  const strip=document.createElement('div');strip.className='sq-strip';strip.setAttribute('role','tablist');strip.setAttribute('aria-label',kk?'Жабдық':'Оборудование');
  const details=document.createElement('div');details.className='sq-details';
  const stageContent=document.createElement('div');stageContent.className='sq-content-layer';
  const tabs=[],panels=[],motions=[];
  let containerShow = null;
  slides.forEach((slide,i)=>{
    slide.image.loading='eager';
    const tab=document.createElement('button');tab.type='button';tab.className='sq-tab';tab.id=`sq-tab-${i}`;tab.setAttribute('role','tab');tab.setAttribute('aria-label',slide.title);tab.setAttribute('aria-controls',`sq-panel-${i}`);
    const hasStructure=slide.image.getAttribute('src').endsWith('/catalog-metarack-computing.png');
    const picture=document.createElement('span');picture.className='sq-picture'+(slide.image.getAttribute('src').includes('monitoring')?' sq-picture-screen':'');picture.append(slide.image);
    const isContainer=slide.image.getAttribute('src').endsWith('/catalog-metacube.png');
    if(isContainer){
      const variants=slides.filter(item=>/catalog-metacube(?:-20ft|-40ft|-assembled)?\.png$/.test(item.image.getAttribute('src')));
      picture.classList.add('sq-container-pictures');
      const images=variants.map((item,j)=>{
        const img=j===0?slide.image:item.image.cloneNode(true);
        img.loading='eager';img.alt='';img.setAttribute('aria-hidden','true');
        img.classList.add('sq-container-frame');img.classList.toggle('is-current',j===0);
        if(j)picture.append(img);
        return img;
      });
      containerShow={index:i,variants,images,current:0,timer:null,visible:false};
    }
    if(hasStructure){
      const exploded=slide.image.cloneNode(true);exploded.src=new URL('catalog-metarack-computing-exploded.png',slide.image.src).href;exploded.loading='eager';exploded.width=1000;exploded.height=588;exploded.className='sq-exploded';exploded.alt='';exploded.setAttribute('aria-hidden','true');picture.append(exploded);tab.classList.add('sq-has-structure');
    }
    tab.append(picture);strip.append(tab);tabs.push(tab);
    const panel=document.createElement('div');panel.className='sq-panel';panel.id=`sq-panel-${i}`;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);
    const heading=document.createElement('h3');heading.textContent=slide.title;
    const label=document.createElement('span');label.className='sq-model';label.textContent=`COOLNET / ${String(i+1).padStart(2,'0')}`;
    const summary=document.createElement('p');summary.className='sq-summary';summary.textContent=slide.summary;
    const link=document.createElement('a');link.href=slide.href;link.className='sq-action';link.textContent=slide.action+' →';
  panel.append(label,heading,summary);
    if(hasStructure){
      const toggle=document.createElement('button');toggle.type='button';toggle.className='sq-structure';toggle.setAttribute('aria-pressed','false');toggle.textContent=kk?'Құрылымын көрсету':'Показать устройство';
      toggle.addEventListener('click',()=>{const opened=tab.classList.toggle('sq-open');toggle.setAttribute('aria-pressed',String(opened));toggle.textContent=opened?(kk?'Жинау':'Собрать'):(kk?'Құрылымын көрсету':'Показать устройство');window.CorexButtons?.enhance(toggle);});panel.append(toggle);
    }
    panel.append(link);
    const motion=document.createElement('div');motion.className='sq-content-motion';
    const content=document.createElement('div');content.className='sq-content-position';content.append(panel);motion.append(content);stageContent.append(motion);
    panels.push(panel);motions.push(motion);
    tab.addEventListener('click',()=>select(i));
  });
  details.append(controls);
  const stage=document.createElement('div');stage.className='sq-stage';stage.append(strip,stageContent,details);root.append(stage);grid.replaceWith(root);
  let active=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function renderContainer(){
    if(!containerShow)return;
    const s=containerShow;
    s.images.forEach((img,i)=>img.classList.toggle('is-current',i===s.current));
  }
  function scheduleContainer(){
    if(!containerShow)return;
    const s=containerShow;clearTimeout(s.timer);
    if(active!==s.index || !s.visible || reduced.matches || document.hidden)return;
    s.timer=setTimeout(()=>{s.current=(s.current+1)%s.images.length;renderContainer();scheduleContainer();},4000);
  }
  if(containerShow){
    const s=containerShow;
    new IntersectionObserver(entries=>{s.visible=entries[0].isIntersecting;scheduleContainer();},{threshold:.35}).observe(stage);
    document.addEventListener('visibilitychange',scheduleContainer);
    reduced.addEventListener('change',scheduleContainer);
    renderContainer();
  }
  function layout(){
    const width=strip.clientWidth,gap=width<600?8:16;
    const tailCount=width<600?0:Math.min(3,slides.length-3);
    const tailSize=8, tailGap=8, tailRoom=tailCount*(tailSize+tailGap);
    const room=width-2*gap-tailRoom;
    const small=width<600?12:room*.08;
    const mid=width<600?16:room*.16;
    const hero=room-small-mid;
    details.style.width=`${hero}px`;
    const widths=[hero,mid,small],positions=[0,hero+gap,hero+mid+2*gap];
    for(let j=0;j<tailCount;j++){positions.push(width-tailRoom+tailGap+j*(tailSize+tailGap));widths.push(tailSize);}
    tabs.forEach((tab,i)=>{
      const col=(i-active+slides.length)%slides.length;
      const visible=col<widths.length;
      tab.style.visibility=visible?'visible':'hidden';
      const panelWidth=visible?widths[col]:0;
      const panelPosition=visible?positions[col]:width;
      tab.style.transform=`translateX(${panelPosition}px)`;
      tab.style.clipPath=`inset(0 ${width-panelWidth}px 0 0 round 12px)`;
      const pic=tab.querySelector('.sq-picture');pic.style.width=`${hero}px`;pic.style.transform=`translateX(${col===0?0:panelWidth/2-hero*(window.innerWidth>1000?.23:.5)}px)`;
      const motion=motions[i];motion.style.visibility=tab.style.visibility;motion.style.transform=tab.style.transform;motion.style.clipPath=tab.style.clipPath;
      const content=motion.firstElementChild;content.style.width=`${hero}px`;content.style.transform=pic.style.transform;
    });
    // Reserve navigation space below even the longest localized description.
    strip.style.height=window.innerWidth<=1000?`${Math.max(window.innerWidth<=650?660:640,(window.innerWidth<=650?290:310)+24+Math.max(...panels.map(panel=>panel.scrollHeight))+88)}px`:'';
  }
  function select(index,keyboard=false){
    root.classList.toggle('sq-instant',keyboard);
    active=(index+slides.length)%slides.length;
    tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===active));tab.tabIndex=i===active?0:-1;panels[i].hidden=i!==active;panels[i].inert=i!==active;panels[i].setAttribute('aria-hidden',String(i!==active));});
    layout();
    scheduleContainer();
    if(keyboard)tabs[active].focus({preventScroll:true});
  }
  prev.addEventListener('click',()=>select(active-1));next.addEventListener('click',()=>select(active+1));
  strip.addEventListener('keydown',event=>{const moves={ArrowRight:active+1,ArrowLeft:active-1,Home:0,End:slides.length-1};if(event.key in moves){event.preventDefault();select(moves[event.key],true);}});
  new ResizeObserver(layout).observe(strip);
  select(0);
  document.fonts.ready.then(layout);
  // Initial enhancement must not steal focus or scroll the page.
})();
