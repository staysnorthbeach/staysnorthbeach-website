const OWNER_EMAIL = 'stay@staysnorthbeach.com.au';
const FROM_EMAIL = 'Stays North Beach <stay@staysnorthbeach.com.au>';

function esc(value=''){
  return String(value).replace(/[&<>'"]/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[ch]));
}

async function sendEmail(payload){
  const apiKey = process.env.RESEND_API_KEY;
  if(!apiKey) throw new Error('Missing RESEND_API_KEY');

  const res = await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{
      'Authorization':`Bearer ${apiKey}`,
      'Content-Type':'application/json'
    },
    body:JSON.stringify(payload)
  });

  if(!res.ok){
    const body = await res.text();
    throw new Error(`Resend returned ${res.status}: ${body}`);
  }
}

export default {
  async formSubmitted(event){
    const data = event?.data || {};
    if(data['form-name'] && data['form-name'] !== 'booking-enquiry') return;

    const guestEmail = String(data.email || '').trim();
    if(!guestEmail) return;

    const guestName = String(data.name || '').trim() || 'there';
    const stay = data.stay === 'midnight' ? 'The Midnight Hideaway' : data.stay === 'front' ? 'Front Residence' : String(data.stay || 'your selected stay');
    const checkin = String(data.checkin || '');
    const checkout = String(data.checkout || '');
    const phone = String(data.phone || 'Not provided');
    const message = String(data.message || 'Not provided');

    const guestHtml = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1d2324;max-width:620px;margin:auto">
        <h2 style="font-family:Georgia,serif;color:#1e292b">We’ve received your Stays North Beach enquiry</h2>
        <p>Hi ${esc(guestName)},</p>
        <p>Thank you for your enquiry. We’ve received your request for <strong>${esc(stay)}</strong>${checkin && checkout ? ` from <strong>${esc(checkin)}</strong> to <strong>${esc(checkout)}</strong>` : ''}.</p>
        <p>We’ll recheck availability, review the guest details and be in contact very soon with the next steps and final direct price.</p>
        <p>Please note that your enquiry is not yet a confirmed booking.</p>
        <p>Warm regards,<br><strong>Mel</strong><br>Stays North Beach<br><a href="mailto:${OWNER_EMAIL}">${OWNER_EMAIL}</a></p>
      </div>`;

    const ownerHtml = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1d2324;max-width:680px;margin:auto">
        <h2>New Stays North Beach booking enquiry</h2>
        <p><strong>Name:</strong> ${esc(guestName)}</p>
        <p><strong>Email:</strong> <a href="mailto:${esc(guestEmail)}">${esc(guestEmail)}</a></p>
        <p><strong>Phone:</strong> ${esc(phone)}</p>
        <p><strong>Stay:</strong> ${esc(stay)}</p>
        <p><strong>Check-in:</strong> ${esc(checkin || 'Not provided')}</p>
        <p><strong>Check-out:</strong> ${esc(checkout || 'Not provided')}</p>
        <p><strong>Who is travelling / reason for stay:</strong><br>${esc(message).replace(/\n/g,'<br>')}</p>
      </div>`;

    await Promise.all([
      sendEmail({
        from:FROM_EMAIL,
        to:[guestEmail],
        subject:'We’ve received your Stays North Beach enquiry',
        html:guestHtml,
        reply_to:OWNER_EMAIL
      }),
      sendEmail({
        from:FROM_EMAIL,
        to:[OWNER_EMAIL],
        subject:`New booking enquiry — ${guestName}${checkin ? ` — ${checkin}` : ''}`,
        html:ownerHtml,
        reply_to:guestEmail
      })
    ]);
  }
};
