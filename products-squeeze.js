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
  // Adapted from the previous/next button group pattern on 21st.dev.
  for(const [button,label,direction] of [[prev,kk?'Алдыңғы жабдық':'Предыдущее оборудование','prev'],[next,kk?'Келесі жабдық':'Следующее оборудование','next']]){
    button.type='button';button.className='sq-nav-button';button.setAttribute('aria-label',label);
    const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');
    arrow.setAttribute('viewBox','0 0 24 24');arrow.setAttribute('width','24');arrow.setAttribute('height','24');
    arrow.setAttribute('fill','none');arrow.setAttribute('stroke','currentColor');arrow.setAttribute('stroke-width','1.8');
    arrow.setAttribute('stroke-linecap','round');arrow.setAttribute('stroke-linejoin','round');arrow.setAttribute('aria-hidden','true');
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',direction==='prev'?'M19 12H5m7 7-7-7 7-7':'M5 12h14m-7-7 7 7-7 7');
    arrow.append(path);button.append(arrow);
  }
  controls.append(prev,next);
  const strip=document.createElement('div');strip.className='sq-strip';strip.setAttribute('role','tablist');strip.setAttribute('aria-label',kk?'Жабдық':'Оборудование');
  const details=document.createElement('div');details.className='sq-details';
  const stageContent=document.createElement('div');stageContent.className='sq-content-layer';
  const tabs=[],panels=[],motions=[];
  const galleries=[];
  const galleryCounts={'cooling':1,'cool-row':2,'metarack':3,'metarow':3,'metacube':4,'ups':2,'monitoring':3,'distribution':3,'metarack-computing':3};
  slides.forEach((slide,i)=>{
    slide.image.loading='lazy';
    const tab=document.createElement('button');tab.type='button';tab.className='sq-tab';tab.id=`sq-tab-${i}`;tab.setAttribute('role','tab');tab.setAttribute('aria-label',slide.title);tab.setAttribute('aria-controls',`sq-panel-${i}`);
    const picture=document.createElement('span');picture.className='sq-picture'+(slide.image.getAttribute('src').includes('monitoring')?' sq-picture-screen':'');picture.append(slide.image);
    const key=slide.image.getAttribute('src').split('/').pop().replace('catalog-','').replace(/\.(png|webp)(?:\?.*)?$/,'');
    const imageMotion=document.createElement('span');imageMotion.className='sq-image-motion';
    const images=Array.from({length:galleryCounts[key]||1},(_,j)=>{
      const img=slide.image.cloneNode(true);
      img.src=new URL(key==='metarow'&&j===1?'gallery-metarow-2-cutout.webp':`gallery-${key}-${j+1}.webp?v=cutout-1`,slide.image.src).href;
      img.width=1000;img.height=760;img.loading='lazy';img.alt='';img.setAttribute('aria-hidden','true');
      img.className='sq-gallery-frame'+(j===0?' is-current':'');imageMotion.append(img);return img;
    });
    picture.replaceChildren(imageMotion);
    galleries.push({images,current:0,tab,imageMotion});
    tab.append(picture);strip.append(tab);tabs.push(tab);
    const panel=document.createElement('div');panel.className='sq-panel';panel.id=`sq-panel-${i}`;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);
    const heading=document.createElement('h3');heading.textContent=slide.title;
    const label=document.createElement('span');label.className='sq-model';label.textContent=`COOLNET / ${String(i+1).padStart(2,'0')}`;
    const summary=document.createElement('p');summary.className='sq-summary';summary.textContent=slide.summary;
    const link=document.createElement('a');link.href=slide.href;link.className='sq-action';link.textContent=slide.action+' →';
  panel.append(label,heading,summary);
    panel.append(link);
    const motion=document.createElement('div');motion.className='sq-content-motion';
    const content=document.createElement('div');content.className='sq-content-position';content.append(panel);motion.append(content);stageContent.append(motion);
    panels.push(panel);motions.push(motion);
    tab.addEventListener('click',()=>navigate(i));
  });
  details.append(controls);
  const stage=document.createElement('div');stage.className='sq-stage';stage.append(strip,stageContent,details);root.append(stage);grid.replaceWith(root);
  let active=0;
  let pendingIndex=0, switchTimer=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let galleryTimer=null, galleryVisible=false;
  function scheduleGallery(){
    clearTimeout(galleryTimer);
    const canPlay=galleryVisible&&!reduced.matches&&!document.hidden&&!root.classList.contains('sq-switching');
    const g=galleries[active];
    if(!canPlay||g.current>=g.images.length-1)return;
    galleryTimer=setTimeout(()=>{
      const next=g.current+1;
      if(g.images[next].complete&&g.images[next].naturalWidth){
        g.current=next;g.images.forEach((img,i)=>img.classList.toggle('is-current',i===next));
      }
      scheduleGallery();
    },2000);
  }
  new IntersectionObserver(entries=>{galleryVisible=entries[0].isIntersecting;scheduleGallery();},{threshold:0.05}).observe(stage);
  document.addEventListener('visibilitychange',scheduleGallery);
  reduced.addEventListener('change',scheduleGallery);
  function layout(){
    const width=strip.clientWidth,gap=width<600?4:16;
    const tailCount=width<600?0:Math.min(3,slides.length-3);
    const tailSize=8, tailGap=8, tailRoom=tailCount*(tailSize+tailGap);
    const room=width-2*gap-tailRoom;
    const small=width<600?8:room*.08;
    const mid=width<600?8:room*.16;
    const hero=room-small-mid;
    details.style.width=`${hero}px`;
    const widths=[hero,mid,small],positions=[0,hero+gap,hero+mid+2*gap];
    for(let j=0;j<tailCount;j++){positions.push(width-tailRoom+tailGap+j*(tailSize+tailGap));widths.push(tailSize);}
    tabs.forEach((tab,i)=>{
      const col=(i-active+slides.length)%slides.length;
      const visible=col<widths.length;
      tab.style.visibility=visible?'visible':'hidden';
      tab.classList.toggle('sq-tail',col>=3);
      tab.classList.toggle('sq-preview',col>0);
      const panelWidth=visible?widths[col]:0;
      const panelPosition=visible?positions[col]:width;
      tab.style.transform=`translateX(${panelPosition}px)`;
      tab.style.clipPath=`inset(0 ${width-panelWidth}px 0 0 round 12px)`;
      const pic=tab.querySelector('.sq-picture');pic.style.width=`${hero}px`;pic.style.transform=`translateX(${col===0?0:panelWidth/2-hero*(window.innerWidth>1000?.23:.5)}px)`;
      const motion=motions[i];motion.style.visibility=tab.style.visibility;motion.style.transform=tab.style.transform;motion.style.clipPath=tab.style.clipPath;
      const content=motion.firstElementChild;content.style.width=`${hero}px`;content.style.transform=pic.style.transform;
    });
    // Reserve navigation space below even the longest localized description.
    strip.style.height=window.innerWidth<=1000?`${Math.max(window.innerWidth<=650?660:640,(window.innerWidth<=650?230:310)+24+Math.max(...panels.map(panel=>panel.scrollHeight))+88)}px`:'';
  }
  function select(index,keyboard=false){
    active=(index+slides.length)%slides.length;
    tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===active));tab.tabIndex=i===active?0:-1;panels[i].hidden=i!==active;panels[i].inert=i!==active;panels[i].setAttribute('aria-hidden',String(i!==active));});
    layout();
    scheduleGallery();
    if(keyboard)tabs[active].focus({preventScroll:true});
  }
  function navigate(index,keyboard=false){
    const target=(index+slides.length)%slides.length;
    if(target===active){
      clearTimeout(switchTimer);
      pendingIndex=active;
      root.classList.remove('sq-switching');
      scheduleGallery();
      return;
    }
    pendingIndex=target;
    clearTimeout(switchTimer);
    if(keyboard||reduced.matches||!galleryVisible){
      root.classList.remove('sq-switching');select(pendingIndex,keyboard);return;
    }
    root.classList.add('sq-switching');
    switchTimer=setTimeout(()=>{
      select(pendingIndex);
      requestAnimationFrame(()=>{root.classList.remove('sq-switching');scheduleGallery();});
    },140);
  }
  prev.addEventListener('click',()=>navigate(pendingIndex-1));next.addEventListener('click',()=>navigate(pendingIndex+1));
  strip.addEventListener('keydown',event=>{const moves={ArrowRight:pendingIndex+1,ArrowLeft:pendingIndex-1,Home:0,End:slides.length-1};if(event.key in moves){event.preventDefault();navigate(moves[event.key],true);}});
  new ResizeObserver(layout).observe(strip);
  select(0);
  document.fonts.ready.then(layout);
  // Initial enhancement must not steal focus or scroll the page.
})();
