(()=>{
  const config=window.NBPS_CONFIG||{};
  let calendars={midnight:[],front:[]};
  const status=document.getElementById('availabilityStatus');
  const form=document.getElementById('bookingForm');
  const stayChoice=document.getElementById('stayChoice');
  const checkin=document.getElementById('checkin');
  const checkout=document.getElementById('checkout');
  const formMessage=document.getElementById('formMessage');

  const selection={key:null,start:null,end:null};
  const monthState={
    midnight:new Date(new Date().getFullYear(),new Date().getMonth(),1),
    front:new Date(new Date().getFullYear(),new Date().getMonth(),1)
  };

  const pad=n=>String(n).padStart(2,'0');
  const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const fmt=s=>new Date(s+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'});
  const monthLabel=d=>d.toLocaleDateString('en-AU',{month:'long',year:'numeric'});
  const propertyName=key=>key==='midnight'?'The Midnight Hideaway':'Front Residence';

  function isBlocked(ranges,dateStr){
    return ranges.some(r=>dateStr>=r.start&&dateStr<r.end);
  }

  function overlaps(ranges,start,end){
    return ranges.some(r=>start<r.end&&end>r.start);
  }

  function selectionText(key){
    if(selection.key!==key||!selection.start)return 'Tap an available date for check-in, then tap another available date for check-out.';
    if(!selection.end)return `Check-in: ${fmt(selection.start)}. Now choose your check-out date.`;
    return `Selected: ${fmt(selection.start)} – ${fmt(selection.end)}. Your form below has been filled in.`;
  }

  function renderCalendar(id,ranges,key){
    const el=document.getElementById(id);
    if(!el)return;

    const view=monthState[key];
    const year=view.getFullYear();
    const month=view.getMonth();
    const first=new Date(year,month,1);
    const last=new Date(year,month+1,0);
    const startOffset=(first.getDay()+6)%7;
    const daysInMonth=last.getDate();
    const today=ymd(new Date());

    const weekdayHeaders=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
      .map(d=>`<div class="cal-weekday">${d}</div>`).join('');

    let cells='';
    for(let i=0;i<startOffset;i++)cells+='<div class="cal-day empty" aria-hidden="true"></div>';

    for(let day=1;day<=daysInMonth;day++){
      const d=new Date(year,month,day);
      const ds=ymd(d);
      const blocked=isBlocked(ranges,ds);
      const past=ds<today;
      const selectable=!blocked&&!past;
      const classes=['cal-day',blocked?'blocked':'available'];
      if(past)classes.push('past');
      if(ds===today)classes.push('today');
      if(selection.key===key){
        if(ds===selection.start)classes.push('selected-start');
        if(ds===selection.end)classes.push('selected-end');
        if(selection.start&&selection.end&&ds>selection.start&&ds<selection.end)classes.push('selected-range');
      }
      const label=`${fmt(ds)}: ${blocked?'unavailable':'available'}`;
      cells+=selectable
        ? `<button type="button" class="${classes.join(' ')}" data-date="${ds}" data-cal-key="${key}" aria-label="${label}"><span>${day}</span></button>`
        : `<div class="${classes.join(' ')}" aria-label="${label}"><span>${day}</span></div>`;
    }

    el.innerHTML=`
      <div class="calendar-shell">
        <div class="calendar-toolbar">
          <button type="button" class="cal-nav" data-cal-key="${key}" data-dir="-1" aria-label="Previous month">‹</button>
          <div class="calendar-title" aria-live="polite">${monthLabel(view)}</div>
          <button type="button" class="cal-nav" data-cal-key="${key}" data-dir="1" aria-label="Next month">›</button>
        </div>
        <div class="calendar-grid weekdays">${weekdayHeaders}</div>
        <div class="calendar-grid days">${cells}</div>
        <div class="calendar-legend">
          <span><i class="legend-dot available-dot"></i>Available</span>
          <span><i class="legend-dot blocked-dot"></i>Unavailable</span>
          <span><i class="legend-dot selected-dot"></i>Your dates</span>
        </div>
        <p class="calendar-help" aria-live="polite">${selectionText(key)}</p>
      </div>`;
  }

  function renderAll(){
    renderCalendar('midnightCalendar',calendars.midnight,'midnight');
    renderCalendar('frontCalendar',calendars.front,'front');
  }

  function syncForm(){
    if(selection.key&&stayChoice)stayChoice.value=selection.key;
    if(checkin)checkin.value=selection.start||'';
    if(checkout)checkout.value=selection.end||'';
    if(formMessage){
      formMessage.textContent=selection.end
        ? `${propertyName(selection.key)} selected for ${fmt(selection.start)} – ${fmt(selection.end)}. Complete your details and send the request.`
        : selection.start
          ? `Check-in selected: ${fmt(selection.start)}. Choose a check-out date on the calendar.`
          : '';
    }
  }

  function chooseDate(key,ds){
    const ranges=calendars[key]||[];
    if(isBlocked(ranges,ds)||ds<ymd(new Date()))return;

    if(selection.key!==key||!selection.start||selection.end){
      selection.key=key;
      selection.start=ds;
      selection.end=null;
    }else if(ds<=selection.start){
      selection.start=ds;
      selection.end=null;
    }else if(overlaps(ranges,selection.start,ds)){
      if(formMessage)formMessage.textContent='That stay would cross an unavailable Airbnb date. Please choose an earlier check-out date or a new check-in date.';
      return;
    }else{
      selection.end=ds;
    }

    syncForm();
    renderAll();
  }

  async function load(){
    try{
      const res=await fetch(config.availabilityEndpoint||'/.netlify/functions/availability',{cache:'no-store'});
      if(!res.ok)throw new Error('Availability service returned '+res.status);
      const data=await res.json();
      calendars.midnight=data.midnight||[];
      calendars.front=data.front||[];
      renderAll();
      status.textContent='Airbnb availability loaded. Use the arrows to view future months, then choose your check-in and check-out dates directly on the calendar. Dates are subject to Mel’s final confirmation.';
    }catch(e){
      console.error(e);
      status.textContent='The website is live, but Airbnb availability could not be loaded right now. Please submit your preferred dates and Mel will confirm them manually.';
    }
  }

  document.addEventListener('click',e=>{
    const nav=e.target.closest('.cal-nav');
    if(nav){
      const key=nav.dataset.calKey;
      const dir=Number(nav.dataset.dir||0);
      const d=monthState[key];
      monthState[key]=new Date(d.getFullYear(),d.getMonth()+dir,1);
      renderCalendar(key==='midnight'?'midnightCalendar':'frontCalendar',calendars[key],key);
      return;
    }

    const day=e.target.closest('button.cal-day[data-date]');
    if(day)chooseDate(day.dataset.calKey,day.dataset.date);
  });

  if(stayChoice){
    stayChoice.addEventListener('change',()=>{
      if(!stayChoice.value)return;
      if(selection.key!==stayChoice.value){
        selection.key=stayChoice.value;
        selection.start=null;
        selection.end=null;
        if(checkin)checkin.value='';
        if(checkout)checkout.value='';
        renderAll();
      }
    });
  }

  if(checkin){
    checkin.min=ymd(new Date());
    checkin.addEventListener('change',()=>{
      if(!stayChoice?.value)return;
      selection.key=stayChoice.value;
      selection.start=checkin.value||null;
      selection.end=checkout?.value||null;
      renderAll();
    });
  }

  if(checkout){
    checkout.min=ymd(new Date());
    checkout.addEventListener('change',()=>{
      if(!stayChoice?.value)return;
      selection.key=stayChoice.value;
      selection.start=checkin?.value||null;
      selection.end=checkout.value||null;
      renderAll();
    });
  }

  if(form){
    form.addEventListener('submit',e=>{
      const stay=stayChoice.value;
      const start=checkin.value;
      const end=checkout.value;
      if(!stay||!start||!end)return;
      if(end<=start){
        e.preventDefault();
        formMessage.textContent='Please choose a check-out date after check-in.';
        return;
      }
      if(calendars[stay]&&overlaps(calendars[stay],start,end)){
        e.preventDefault();
        formMessage.textContent='Those dates overlap an Airbnb booking or block. Please choose different dates.';
        return;
      }
      formMessage.textContent='Dates currently look open. Sending your request to Mel…';
    });
  }

  load();
})();