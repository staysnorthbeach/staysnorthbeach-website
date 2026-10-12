(()=>{
  const config=window.NBPS_CONFIG||{};
  let calendars={midnight:[],front:[]};
  const status=document.getElementById('availabilityStatus');

  const monthState={
    midnight:new Date(new Date().getFullYear(),new Date().getMonth(),1),
    front:new Date(new Date().getFullYear(),new Date().getMonth(),1)
  };

  const pad=n=>String(n).padStart(2,'0');
  const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const fmt=s=>new Date(s+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'});
  const monthLabel=d=>d.toLocaleDateString('en-AU',{month:'long',year:'numeric'});

  function isBlocked(ranges,dateStr){
    return ranges.some(r=>dateStr>=r.start&&dateStr<r.end);
  }

  function renderCalendar(id,ranges,key){
    const el=document.getElementById(id);
    if(!el)return;

    const view=monthState[key];
    const year=view.getFullYear();
    const month=view.getMonth();
    const first=new Date(year,month,1);
    const last=new Date(year,month+1,0);
    const startOffset=(first.getDay()+6)%7; // Monday first
    const daysInMonth=last.getDate();
    const today=ymd(new Date());

    const weekdayHeaders=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
      .map(d=>`<div class="cal-weekday">${d}</div>`).join('');

    let cells='';
    for(let i=0;i<startOffset;i++)cells+='<div class="cal-day empty"></div>';

    for(let day=1;day<=daysInMonth;day++){
      const d=new Date(year,month,day);
      const ds=ymd(d);
      const blocked=isBlocked(ranges,ds);
      const past=ds<today;
      const classes=['cal-day'];
      if(blocked)classes.push('blocked');
      else classes.push('available');
      if(past)classes.push('past');
      if(ds===today)classes.push('today');
      cells+=`<div class="${classes.join(' ')}" title="${blocked?'Unavailable':'Available'}"><span>${day}</span></div>`;
    }

    el.innerHTML=`
      <div class="calendar-shell">
        <div class="calendar-toolbar">
          <button type="button" class="cal-nav" data-cal-key="${key}" data-dir="-1" aria-label="Previous month">‹</button>
          <div class="calendar-title">${monthLabel(view)}</div>
          <button type="button" class="cal-nav" data-cal-key="${key}" data-dir="1" aria-label="Next month">›</button>
        </div>
        <div class="calendar-grid weekdays">${weekdayHeaders}</div>
        <div class="calendar-grid days">${cells}</div>
        <div class="calendar-legend">
          <span><i class="legend-dot available-dot"></i>Available</span>
          <span><i class="legend-dot blocked-dot"></i>Unavailable</span>
        </div>
      </div>`;
  }

  function renderAll(){
    renderCalendar('midnightCalendar',calendars.midnight,'midnight');
    renderCalendar('frontCalendar',calendars.front,'front');
  }

  function overlaps(ranges,start,end){
    return ranges.some(r=>start<r.end&&end>r.start);
  }

  async function load(){
    try{
      const res=await fetch(config.availabilityEndpoint||'/.netlify/functions/availability',{cache:'no-store'});
      if(!res.ok)throw new Error('Availability service returned '+res.status);
      const data=await res.json();
      calendars.midnight=data.midnight||[];
      calendars.front=data.front||[];
      renderAll();
      status.textContent='Airbnb availability loaded. Use the arrows to view future months. Dates are subject to Mel’s final confirmation.';
    }catch(e){
      console.error(e);
      status.textContent='The website is live, but Airbnb availability could not be loaded right now. Please submit your preferred dates and Mel will confirm them manually.';
    }
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest('.cal-nav');
    if(!btn)return;
    const key=btn.dataset.calKey;
    const dir=Number(btn.dataset.dir||0);
    const d=monthState[key];
    monthState[key]=new Date(d.getFullYear(),d.getMonth()+dir,1);
    renderCalendar(key==='midnight'?'midnightCalendar':'frontCalendar',calendars[key],key);
  });

  load();

  const form=document.getElementById('bookingForm');
  if(form){
    form.addEventListener('submit',e=>{
      const stay=document.getElementById('stayChoice').value;
      const start=document.getElementById('checkin').value;
      const end=document.getElementById('checkout').value;
      const msg=document.getElementById('formMessage');
      if(!stay||!start||!end)return;
      if(end<=start){
        e.preventDefault();
        msg.textContent='Please choose a check-out date after check-in.';
        return;
      }
      if(calendars[stay]&&overlaps(calendars[stay],start,end)){
        e.preventDefault();
        msg.textContent='Those dates overlap an Airbnb booking or block. Please choose different dates.';
        return;
      }
      msg.textContent='Dates currently look open. Sending your request to Mel…';
    });
  }
})();