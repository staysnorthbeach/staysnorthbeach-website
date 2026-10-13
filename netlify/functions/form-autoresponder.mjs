const OWNER_EMAIL = 'stay@staysnorthbeach.com.au';
const FROM_EMAIL = 'Stays North Beach <stay@staysnorthbeach.com.au>';

function esc(value=''){
  return String(value).replace(/[&<>'"]/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[ch]));
}

function clean(value=''){
  return String(value).trim();
}

function formatDate(value=''){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || 'Not provided';
  const d = new Date(`${value}T12:00:00`);
  return d.toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'});
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

    // Only act on the Stays North Beach booking enquiry form.
    if(data['form-name'] && data['form-name'] !== 'booking-enquiry') return;

    const guestEmail = clean(data.email);
    if(!guestEmail || !guestEmail.includes('@')) return;

    const guestName = clean(data.name) || 'there';
    const stay = data.stay === 'midnight'
      ? 'The Midnight Hideaway'
      : data.stay === 'front'
        ? 'Front Residence'
        : clean(data.stay) || 'your selected stay';
    const checkinRaw = clean(data.checkin);
    const checkoutRaw = clean(data.checkout);
    const checkin = formatDate(checkinRaw);
    const checkout = formatDate(checkoutRaw);
    const phone = clean(data.phone) || 'Not provided';
    const message = clean(data.message) || 'Not provided';

    const guestSubject = 'We’ve received your Stays North Beach enquiry';
    const guestText = [
      `Hi ${guestName},`,
      '',
      `Thank you for your enquiry for ${stay}${checkinRaw && checkoutRaw ? ` from ${checkin} to ${checkout}` : ''}.`,
      '',
      'We’ve received your request and will recheck availability, review the guest details and be in contact very soon with the next steps and final direct price.',
      '',
      'Please note that this is an enquiry only and your stay is not confirmed until we contact you and confirm the booking.',
      '',
      'Warm regards,',
      'Mel',
      'Stays North Beach',
      OWNER_EMAIL
    ].join('\n');

    const guestHtml = `
      <div style="font-family:Arial,sans-serif;line-height:1.65;color:#1d2324;max-width:620px;margin:auto">
        <div style="padding:28px;border:1px solid #e3ddd4;border-radius:18px;background:#ffffff">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;font-weight:700;color:#735c3f">STAYS NORTH BEACH</p>
          <h2 style="margin:0 0 20px;font-family:Georgia,serif;color:#1e292b">We’ve received your enquiry</h2>
          <p>Hi ${esc(guestName)},</p>
          <p>Thank you for your enquiry for <strong>${esc(stay)}</strong>${checkinRaw && checkoutRaw ? ` from <strong>${esc(checkin)}</strong> to <strong>${esc(checkout)}</strong>` : ''}.</p>
          <p>We’ve received your request and will recheck availability, review the guest details and be in contact very soon with the next steps and final direct price.</p>
          <p style="padding:12px 14px;border-radius:10px;background:#f5f1e9"><strong>Please note:</strong> this is an enquiry only. Your stay is not confirmed until we contact you and confirm the booking.</p>
          <p>Warm regards,<br><strong>Mel</strong><br>Stays North Beach<br><a href="mailto:${OWNER_EMAIL}">${OWNER_EMAIL}</a></p>
        </div>
      </div>`;

    const ownerSubject = `New booking enquiry — ${guestName}${checkinRaw ? ` — ${checkin}` : ''}`;
    const ownerText = [
      'New Stays North Beach booking enquiry',
      '',
      `Name: ${guestName}`,
      `Email: ${guestEmail}`,
      `Phone: ${phone}`,
      `Stay: ${stay}`,
      `Check-in: ${checkin}`,
      `Check-out: ${checkout}`,
      '',
      'Who is travelling / reason for stay:',
      message
    ].join('\n');

    const ownerHtml = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1d2324;max-width:680px;margin:auto">
        <h2>New Stays North Beach booking enquiry</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:7px 0;font-weight:700;width:160px">Name</td><td>${esc(guestName)}</td></tr>
          <tr><td style="padding:7px 0;font-weight:700">Email</td><td><a href="mailto:${esc(guestEmail)}">${esc(guestEmail)}</a></td></tr>
          <tr><td style="padding:7px 0;font-weight:700">Phone</td><td>${esc(phone)}</td></tr>
          <tr><td style="padding:7px 0;font-weight:700">Stay</td><td>${esc(stay)}</td></tr>
          <tr><td style="padding:7px 0;font-weight:700">Check-in</td><td>${esc(checkin)}</td></tr>
          <tr><td style="padding:7px 0;font-weight:700">Check-out</td><td>${esc(checkout)}</td></tr>
        </table>
        <p><strong>Who is travelling / reason for stay:</strong><br>${esc(message).replace(/\n/g,'<br>')}</p>
        <p style="margin-top:24px;padding:12px 14px;border-radius:10px;background:#f5f1e9">Reply directly to this email to respond to the guest.</p>
      </div>`;

    // Send both emails immediately after a verified Netlify form submission.
    await Promise.all([
      sendEmail({
        from:FROM_EMAIL,
        to:[guestEmail],
        subject:guestSubject,
        text:guestText,
        html:guestHtml,
        reply_to:OWNER_EMAIL,
        tags:[{name:'type',value:'booking-enquiry-guest'}]
      }),
      sendEmail({
        from:FROM_EMAIL,
        to:[OWNER_EMAIL],
        subject:ownerSubject,
        text:ownerText,
        html:ownerHtml,
        reply_to:guestEmail,
        tags:[{name:'type',value:'booking-enquiry-owner'}]
      })
    ]);
  }
};
