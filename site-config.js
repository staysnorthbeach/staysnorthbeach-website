window.NBPS_CONFIG={availabilityEndpoint:'/.netlify/functions/availability'};

(()=>{
  const galleries={
    midnight:[
      {src:'assets/midnight-hero.jpg',alt:'The Midnight Hideaway courtyard at sunset in North Beach, Perth',caption:'Private courtyard at sunset'},
      {src:'assets/midnight-living.jpg',alt:'Warm open-plan living at The Midnight Hideaway',caption:'Warm open-plan living'},
      {src:'assets/midnight-bathroom.jpg',alt:'Modern bathroom at The Midnight Hideaway',caption:'Bathroom'}
    ],
    front:[
      {src:'assets/front-courtyard.jpg',alt:'Private courtyard at North Beach House',caption:'Private outdoor living'},
      {src:'assets/front-kitchen.jpg',alt:'Open-plan kitchen at North Beach House',caption:'Open-plan kitchen'},
      {src:'assets/front-bathroom.jpg',alt:'Designer bathroom at North Beach House',caption:'Designer bathroom'}
    ]
  };

  let state={key:null,index:0,lastFocus:null};
  const modal=()=>document.getElementById('galleryModal');
  const image=()=>document.getElementById('galleryImage');
  const caption=()=>document.getElementById('galleryCaption');
  const counter=()=>document.getElementById('galleryCounter');

  function render(){
    const items=galleries[state.key]||[]; if(!items.length)return;
    state.index=(state.index+items.length)%items.length;
    const item=items[state.index];
    image().src=item.src; image().alt=item.alt; caption().textContent=item.caption; counter().textContent=`${state.index+1} of ${items.length}`;
  }
  function open(key,index,trigger){
    if(!galleries[key]?.length||!modal())return;
    state={key,index:Number(index)||0,lastFocus:trigger||document.activeElement}; render();
    modal().classList.add('is-open'); modal().setAttribute('aria-hidden','false'); document.body.classList.add('gallery-modal-open');
    modal().querySelector('.gallery-close')?.focus();
  }
  function close(){
    if(!modal())return;
    modal().classList.remove('is-open'); modal().setAttribute('aria-hidden','true'); document.body.classList.remove('gallery-modal-open');
    if(image()) image().src=''; state.lastFocus?.focus?.(); state={key:null,index:0,lastFocus:null};
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

  const form=document.getElementById('bookingForm');
  if(form){
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const msg=document.getElementById('formMessage');
      const button=form.querySelector('button[type="submit"]');

      if(!form.checkValidity()){
        form.reportValidity();
        if(msg) msg.textContent='Please complete the required fields above.';
        return;
      }

      // Clear any old validation message before script.js checks the CURRENT dates.
      if(msg) msg.textContent='';

      setTimeout(async()=>{
        const text=(msg?.textContent||'').toLowerCase();
        if(text.includes('check-out date after check-in')||text.includes('overlap an airbnb booking')||text.includes('cross an unavailable airbnb date')) return;

        if(button){button.disabled=true;button.textContent='Sending…';}
        if(msg) msg.textContent='Sending your enquiry securely…';

        try{
          const body=new URLSearchParams(new FormData(form)).toString();
          const response=await fetch('/',{
            method:'POST',
            headers:{'Content-Type':'application/x-www-form-urlencoded'},
            body
          });
          if(!response.ok) throw new Error(`Form submission returned ${response.status}`);
          window.location.assign('/thank-you.html');
        }catch(err){
          console.error(err);
          if(msg) msg.textContent='We could not send your enquiry just now. Please email stay@staysnorthbeach.com.au and we will help you directly.';
          if(button){button.disabled=false;button.textContent='Request these dates';}
        }
      },0);
    });
  }
})();