window.NBPS_CONFIG={availabilityEndpoint:'/.netlify/functions/availability'};

(()=>{
  const form=document.getElementById('bookingForm');
  if(!form)return;

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const msg=document.getElementById('formMessage');
    const button=form.querySelector('button[type="submit"]');

    if(!form.checkValidity()){
      form.reportValidity();
      if(msg)msg.textContent='Please complete the required fields above.';
      return;
    }

    const stay=form.querySelector('[name="stay"]')?.value||'';
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
        headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body
      });
      if(!response.ok)throw new Error(`Submission returned ${response.status}`);
      window.location.href='/thank-you.html';
    }catch(error){
      console.error('Enquiry submission failed',error);
      if(msg)msg.textContent='We could not send your enquiry just now. Please email stay@staysnorthbeach.com.au and we will help you directly.';
      if(button){button.disabled=false;button.textContent='Request these dates';}
    }
  },true);
})();