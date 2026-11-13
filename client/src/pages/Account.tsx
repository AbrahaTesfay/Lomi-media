import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { getJson, sendJson } from '../lib/api';

type Session={email:string;role:'admin'|'user';csrf:string;name?:string};
type Mode='signin'|'signup'|'forgot'|'reset';

export default function Account() {
  const [params,setParams]=useSearchParams();
  const navigate=useNavigate();
  const mode=(['signin','signup','forgot','reset'].includes(params.get('mode')||'')?params.get('mode'):'signin') as Mode;
  const [session,setSession]=useState<Session|null>(null);
  const [checking,setChecking]=useState(true);
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [completed,setCompleted]=useState(false);
  const token=params.get('token')||'';
  useEffect(()=>{
    let active=true;
    getJson<Session>('/api/account/me').then(v=>{if(active)setSession(v)}).catch(()=>{if(active)setSession(null)}).finally(()=>{if(active)setChecking(false)});
    return ()=>{active=false};
  },[]);
  function switchMode(next:Mode) {
    setParams(next==='signin'?{}:{mode:next});
    setMessage('');setPassword('');setConfirm('');setCompleted(false);
  }
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();setMessage('');
    if ((mode==='signup'||mode==='reset') && password!==confirm) {setMessage('Passwords do not match.');return;}
    setBusy(true);
    try {
      if (mode==='signin') {
        const user=await sendJson<Session>('/api/account/login','POST',{email,password});
        setSession(user);setPassword('');
        window.dispatchEvent(new Event('lomi:auth-changed'));
        if(user.role==='admin') navigate('/admin');
      } else if (mode==='signup') {
        const user=await sendJson<Session>('/api/account/signup','POST',{name,email,password});
        setSession(user);setPassword('');setConfirm('');
        window.dispatchEvent(new Event('lomi:auth-changed'));
      } else if (mode==='forgot') {
        const result=await sendJson<{message:string}>('/api/account/password/forgot','POST',{email});
        setMessage(result.message);setCompleted(true);
      } else {
        if (!token) {setMessage('This reset link is missing its token.');return;}
        const result=await sendJson<{message:string}>('/api/account/password/reset','POST',{token,password});
        setPassword('');setConfirm('');setCompleted(true);setMessage(result.message);
      }
    } catch(err) {setMessage(err instanceof Error?err.message:'Please try again.');}
    finally {setBusy(false);}
  }
  async function logout() {
    if(!session)return;
    setBusy(true);setMessage('');
    try {
      await sendJson('/api/account/logout','POST',{},session.csrf);
      setSession(null);switchMode('signin');
      window.dispatchEvent(new Event('lomi:auth-changed'));
    } catch(err) {setMessage(err instanceof Error?err.message:'Unable to sign out.');}
    finally {setBusy(false);}
  }
  const resetView=mode==='reset';
  return <section className="admin-login-wrap"><div className="admin-login account-card">
    <span className="eyebrow"><ShieldCheck size={18}/> LOMI MEDIA · ACCOUNT</span>
    {checking ? <p role="status">Checking your session…</p> : (
      session && !resetView ? <>
        <h1>You're signed in.</h1>
        <p>Account: <strong>{session.email}</strong><br/>Access level: <strong>{session.role==='admin'?'Administrator':'Regular user'}</strong></p>
        {session.role==='admin' ? <Link className="btn btn-dark" to="/admin">Open Admin Dashboard <ArrowRight size={17}/></Link> : <p>You can browse Lomi Media services, articles, and projects. Publishing tools are restricted to authorized administrators.</p>}
        <button className="btn outline-button account-logout" type="button" disabled={busy} onClick={logout}>Sign out</button>
        {message && <p role="alert" className="form-feedback">{message}</p>}
      </> : <>
        <h1>{mode==='signin'?'Sign in.':mode==='signup'?'Create account.':mode==='forgot'?'Reset password.':'Choose new password.'}</h1>
        <p>{mode==='signin'?'Sign in to Lomi Media & Communication. Access is based on your verified account role.':mode==='signup'?'Create a regular user account. Admin access is not granted through registration.':mode==='forgot'?'Enter the email associated with your account to request a secure reset link.':'Use the one-time link from your email. It expires after 15 minutes.'}</p>
        {!resetView&&<div className="account-tabs" role="group" aria-label="Account options">
          <button type="button" aria-pressed={mode==='signin'} onClick={()=>switchMode('signin')}>Sign In</button>
          <button type="button" aria-pressed={mode==='signup'} onClick={()=>switchMode('signup')}>Sign Up</button>
          <button type="button" aria-pressed={mode==='forgot'} onClick={()=>switchMode('forgot')}>Forgot Password</button>
        </div>}
        {!completed&&<form className="contact-form" onSubmit={submit}>
          {mode==='signup'&&<label>Full name<input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label>}
          {mode!=='reset'&&<label>Email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>}
          {(mode==='signin'||mode==='signup'||mode==='reset')&&<label>{resetView?'New password':'Password'}<input type="password" required autoComplete={mode==='signin'?'current-password':'new-password'} minLength={mode==='signin'?1:12} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/></label>}
          {(mode==='signup'||mode==='reset')&&<label>Confirm password<input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>}
          <button type="submit" className="btn btn-dark" disabled={busy}>{busy?'Please wait…':mode==='signin'?'Sign In':mode==='signup'?'Create Account':mode==='forgot'?'Send Reset Link':'Update Password'} <ArrowRight size={18}/></button>
        </form>}
        {message&&<p role="status" className="form-feedback account-feedback">{message}</p>}
        {(resetView||completed)&&<button type="button" className="text-link account-return" onClick={()=>switchMode('signin')}>Return to Sign In</button>}
      </>
    )}
    <Link className="text-link account-home" to="/">Return to homepage</Link>
    <p className="account-security"><LockKeyhole size={15}/> Admin permissions are issued by the server, never by self-registration.</p>
  </div></section>;
}
