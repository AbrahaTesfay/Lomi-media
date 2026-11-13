import { useState, type FormEvent } from 'react';
import { ArrowUpRight, CheckCircle2, Mail, MoveUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageIntro } from '../components/Layout';
import { WhatsAppLink } from '../components/WhatsAppLink';

const serviceOptions = ['Film & Video Production','Brand Strategy & Identity','PR & Communications','Digital & Web Experiences','Social & Digital Campaigns','Events & Live Media','International News & Editorial','Advertising & Media Buying','Not sure yet'];

type ContactForm = { name: string; email: string; organization: string; service: string; message: string; website: string; consent: boolean };
const initial: ContactForm = { name: '', email: '', organization: '', service: '', message: '', website: '', consent: false };

export default function Contact() {
  const [form, setForm] = useState<ContactForm>(initial);
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [feedback, setFeedback] = useState('');
  function update<K extends keyof ContactForm>(name: K, value: ContactForm[K]) { setForm(current => ({ ...current, [name]: value })); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus('sending'); setFeedback('');
    try {
      const response = await fetch(`${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')}/api/contact`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(form) });
      const result: { message?: string } = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to submit right now. Please try again.');
      setStatus('sent'); setFeedback(result.message || 'Your inquiry has been recorded.'); setForm(initial);
    } catch (error) {setStatus('error');setFeedback(error instanceof Error ? error.message : 'Network error. Please try again.');}
  }
  return <><PageIntro label="START A CONVERSATION" title="Let's make something" italic="meaningful." description="Have an idea, a challenge or a big ambition? We'd love to hear what you're working on."/>
    <section className="contact-section section-space"><div className="container contact-grid"><div className="contact-info"><span className="eyebrow"><span className="eyebrow-line"/>GET IN TOUCH</span><h2>Great things<br/>start <em>here.</em></h2><p>Tell us a little about your project and we'll have the context we need to continue the conversation.</p><div className="contact-method"><span className="contact-method-icon"><Mail size={22}/></span><div><strong>Project inquiries</strong><p>Use the secure contact form to submit your inquiry.</p></div><ArrowUpRight size={20}/></div><WhatsAppLink/> <div className="contact-aside-note"><span className="status-pulse"/> OPEN TO NEW COLLABORATIONS<br/><small>This is a starter website. Add your verified business email, phone and office address before launch.</small></div></div>
    <div className="contact-panel"><h3>Tell us about your project <MoveUpRight size={21}/></h3><p>Fields marked * are required.</p><form onSubmit={submit} className="contact-form"><div className="form-pair"><label>Full name *<input name="name" autoComplete="name" placeholder="Your full name" maxLength={100} required value={form.name} onChange={e => update('name', e.target.value)}/></label><label>Email address *<input type="email" name="email" autoComplete="email" placeholder="you@company.com" maxLength={200} required value={form.email} onChange={e => update('email', e.target.value)}/></label></div><div className="form-pair"><label>Company / organization<input name="organization" autoComplete="organization" placeholder="Company name (optional)" maxLength={140} value={form.organization} onChange={e => update('organization', e.target.value)}/></label><label>Service you're interested in<select name="service" value={form.service} onChange={e => update('service', e.target.value)}><option value="">Select a service</option>{serviceOptions.map(service => <option key={service}>{service}</option>)}</select></label></div><label>Tell us about your idea *<textarea name="message" rows={5} required minLength={15} maxLength={4000} placeholder="What are you hoping to create? Goals, timeline, scope..." value={form.message} onChange={e => update('message', e.target.value)}/></label><div className="honeypot" aria-hidden="true"><label>Leave this field empty<input type="text" name="website" autoComplete="off" tabIndex={-1} value={form.website} onChange={e => update('website', e.target.value)}/></label></div><label className="consent"><input type="checkbox" checked={form.consent} onChange={e => update('consent', e.target.checked)} required/><span>I agree to be contacted about this request and have read the <Link to="/privacy">draft privacy notice</Link>. *</span></label><button type="submit" className="btn btn-dark submit-button" disabled={status === 'sending'}>{status === 'sending' ? 'Sending...' : 'Send project inquiry'}<ArrowUpRight size={19}/></button><div className="form-feedback" role="status" aria-live="polite">{status === 'sent' && <CheckCircle2 size={19}/>} {feedback}</div></form></div></div></section></>;
}
