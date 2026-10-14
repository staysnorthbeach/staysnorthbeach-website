window.NBPS_CONFIG={availabilityEndpoint:'/.netlify/functions/availability'};

(()=>{
  const form=document.getElementById('bookingForm');
  if(form){
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      const msg=document.getElementById('formMessage');
      const button=form.querySelector('button[type="submit"]');
      if(!form.checkValidity()){
        form.reportValidity();
        if(msg)msg.textContent='Please complete the required fields above.';
        return;
      }
      const start=form.querySelector('[name="checkin"]')?.value||'';
      const end=form.querySelector('[name="checkout"]')?.value||'';
      if(end<=start){
        if(msg)msg.textContent='Please choose a check-out date after check-in.';
        return;
      }
      if(button){button.disabled=true;button.textContent='Sending…';}
      if(msg)msg.textContent='Sending your enquiry securely…';
      try{
        const body=new URLSearchParams(new FormData(form)).toString();
        const response=await fetch('/.netlify/functions/submit-enquiry',{
          method:'POST',
          headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'application/json'},
          body,
          cache:'no-store'
        });
        const result=await response.json().catch(()=>null);
        if(!response.ok||!result?.ok)throw new Error(result?.error||`Submission returned ${response.status}`);
        if(msg)msg.textContent='Enquiry sent. Opening your confirmation…';
        window.location.assign('/thank-you.html');
      }catch(error){
        console.error('Enquiry submission failed',error);
        if(msg)msg.textContent='We could not send your enquiry just now. Please email stay@staysnorthbeach.com.au and we will help you directly.';
        if(button){button.disabled=false;button.textContent='Request these dates';}
      }
    },true);
  }

  const sprite='assets/gallery-sprite.jpg';
  const S=(cell,caption,alt)=>({sprite:true,cell,caption,alt});
  const I=(src,caption,alt)=>({src,caption,alt});
  const galleries={
    midnight:[
      I('assets/midnight-hero.jpg','Private courtyard at sunset','The Midnight Hideaway courtyard at sunset'),
      I('assets/midnight-living.jpg','Warm open-plan living','The Midnight Hideaway open-plan living area'),
      I('assets/midnight-bathroom.jpg','Modern bathroom','The Midnight Hideaway bathroom'),
      S(2,'Courtyard in the evening','The Midnight Hideaway courtyard in the evening'),
      S(3,'Firepit courtyard detail','The Midnight Hideaway firepit'),
      S(8,'Relaxed lounge area','The Midnight Hideaway lounge'),
      S(7,'Open-plan lounge and kitchen','The Midnight Hideaway lounge and kitchen'),
      S(4,'Dark exposed-brick kitchen','The Midnight Hideaway kitchen'),
      S(5,'Kitchen and island view','The Midnight Hideaway kitchen and island'),
      S(6,'Kitchen detail','The Midnight Hideaway kitchen detail'),
      S(1,'Main bedroom','The Midnight Hideaway main bedroom'),
      S(0,'Flexible second bedroom','The Midnight Hideaway flexible second bedroom')
    ],
    front:[
      I('assets/front-courtyard.jpg','Private outdoor living','North Beach House private courtyard'),
      I('assets/front-kitchen.jpg','Renovated kitchen','North Beach House kitchen'),
      I('assets/front-bathroom.jpg','Designer bathroom','North Beach House designer bathroom'),
      S(12,'Exterior and arrival','North Beach House exterior'),
      S(14,'Light-filled lounge','North Beach House lounge'),
      S(13,'Kitchen and living space','North Beach House kitchen and living area'),
      S(11,'Main bedroom','North Beach House main bedroom'),
      S(10,'Main bedroom alternate view','North Beach House main bedroom alternate view'),
      S(9,'Second bedroom','North Beach House second bedroom'),
      S(15,'Laundry and preparation area','North Beach House laundry and preparation area')
    ]
  };

  let state={key:null,index:0,lastFocus:null};
  const modal=()=>document.getElementById('galleryModal');
  const image=()=>document.getElementById('galleryImage');
  const wrap=()=>document.querySelector('.gallery-image-wrap');
  const caption=()=>document.getElementById('galleryCaption');
  const counter=()=>document.getElementById('galleryCounter');
  function render(){
    const items=galleries[state.key]||[];
    if(!items.length)return;
    state.index=(state.index+items.length)%items.length;
    const item=items[state.index];
    const img=image(),box=wrap();
    if(item.sprite){
      const col=item.cell%4,row=Math.floor(item.cell/4);
      img.style.display='none';
      box.style.backgroundImage=`url('${sprite}')`;
      box.style.backgroundRepeat='no-repeat';
      box.style.backgroundSize='400% 400%';
      box.style.backgroundPosition=`${col*33.333333}% ${row*33.333333}%`;
      box.style.backgroundColor='#111';
    }else{
      box.style.backgroundImage='none';
      img.style.display='block';
      img.src=item.src;
      img.alt=item.alt;
    }
    caption().textContent=item.caption;
    counter().textContent=`${state.index+1} of ${items.length}`;
  }
  function open(key,index,trigger){
    if(!galleries[key]?.length||!modal())return;
    state={key,index:Number(index)||0,lastFocus:trigger||document.activeElement};
    render();
    modal().classList.add('is-open');
    modal().setAttribute('aria-hidden','false');
    document.body.classList.add('gallery-modal-open');
    modal().querySelector('.gallery-close')?.focus();
  }
  function close(){
    if(!modal())return;
    modal().classList.remove('is-open');
    modal().setAttribute('aria-hidden','true');
    document.body.classList.remove('gallery-modal-open');
    if(image()){image().src='';image().style.display='block';}
    if(wrap())wrap().style.backgroundImage='none';
    state.lastFocus?.focus?.();
    state={key:null,index:0,lastFocus:null};
  }
  function move(dir){state.index+=dir;render();}
  document.addEventListener('click',e=>{
    const trigger=e.target.closest?.('.gallery-trigger');
    if(trigger){e.preventDefault();e.stopImmediatePropagation();open(trigger.dataset.gallery,trigger.dataset.index,trigger);return;}
    if(!modal()?.classList.contains('is-open'))return;
    if(e.target.closest?.('.gallery-close')){e.preventDefault();e.stopImmediatePropagation();close();return;}
    if(e.target.closest?.('.gallery-prev')){e.preventDefault();e.stopImmediatePropagation();move(-1);return;}
    if(e.target.closest?.('.gallery-next')){e.preventDefault();e.stopImmediatePropagation();move(1);return;}
    if(e.target===modal()){e.preventDefault();e.stopImmediatePropagation();close();}
  },true);
  document.addEventListener('keydown',e=>{
    if(!modal()?.classList.contains('is-open'))return;
    if(e.key==='Escape'){e.stopImmediatePropagation();close();}
    if(e.key==='ArrowLeft'){e.stopImmediatePropagation();move(-1);}
    if(e.key==='ArrowRight'){e.stopImmediatePropagation();move(1);}
  },true);

  const localCards=document.querySelectorAll('#local .local-grid article');
  if(localCards[1]) localCards[1].querySelector('span').textContent='North Beach and Mettams Pool are only about a 4–5 minute walk away, making a quick beach swim or sunset stroll easy.';
  if(localCards[2]) localCards[2].querySelector('span').textContent='Local cafés and casual dining are within easy walking distance, with Karrinyup and Scarborough also close by for more shopping and dining options.';
})();