import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Menu, X, Instagram, Linkedin, Youtube } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLang, type Key } from '../lib/i18n';
import { getJson } from '../lib/api';

const navigation: {to:string;key:Key}[] = [
  { to: '/', key: 'home' }, { to: '/services', key: 'services' },
  { to: '/work', key: 'work' }, { to: '/news', key: 'news' },
  { to: '/advertise', key: 'advertise' }, { to: '/about', key: 'about' },
];

export function Logo({ light = false }: { light?: boolean }) {
  return <Link className={`brand ${light ? 'brand-light' : ''}`} to="/" aria-label="Lomi Media & Communication home">
    <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><path d="M10 8v24h22" stroke="currentColor" strokeWidth="6" strokeLinejoin="round"/><circle cx="28" cy="11" r="5" fill="#F2A572" /></svg></span>
    <span className="brand-copy"><strong>LOMI<span className="brand-period">.</span></strong><small>MEDIA & COMMUNICATION</small></span>
  </Link>;
}

export function Header() {
  const [open, setOpen] = useState(false);
  const {lang,setLang,t} = useLang();
  const location = useLocation();
  const [sessionRole, setSessionRole] = useState<'guest'|'user'|'admin'>('guest');
  useEffect(() => {
    let active = true;
    const refresh = () => getJson<{role:'user'|'admin'}>('/api/account/me')
      .then(session => { if (active) setSessionRole(session.role); })
      .catch(() => { if (active) setSessionRole('guest'); });
    refresh();
    window.addEventListener('lomi:auth-changed', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.removeEventListener('lomi:auth-changed', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [location.pathname]);
  useEffect(() => { setOpen(false); window.scrollTo({top: 0, behavior: 'instant'}); }, [location.pathname]);
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return <header className="site-header">
    <div className="header-inner container">
      <Logo />
      <nav className={`main-nav ${open ? 'nav-open' : ''}`} id="primary-navigation" aria-label="Primary navigation">
        {navigation.map(link => <NavLink key={link.to} to={link.to} end={link.to === '/'}>{t(link.key)}</NavLink>)}
        {sessionRole === 'admin' ? <NavLink to="/admin">Admin Dashboard</NavLink> : <NavLink to="/account">{sessionRole === 'user' ? 'My Account' : 'Sign In'}</NavLink>}
        <Link to="/contact" className="nav-contact mobile-cta">{t('hello')} <ArrowUpRight size={17}/></Link>
      </nav>
      <label className="lang-control"><span className="sr-only">{t('language')}</span><select aria-label={t('language')} value={lang} onChange={e=>setLang(e.target.value as typeof lang)}><option value="en">EN</option><option value="am">አማ</option><option value="ti">ትግ</option></select></label><Link className="nav-contact desktop-cta" to="/contact">{t('hello')} <ArrowUpRight size={17}/></Link>
      <button className="menu-button" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>{open ? <X size={24}/> : <Menu size={24}/>}</button>
    </div>
  </header>;
}

export function Footer() {
  return <footer className="footer">
    <div className="container">
      <div className="footer-main">
        <div className="footer-brand"><Logo light/><p>Made for meaningful stories, ambitious brands and ideas worth sharing.</p><span className="small-label">AFRICA-ROOTED. GLOBALLY MINDED.</span></div>
        <div className="footer-col"><span className="footer-heading">EXPLORE</span><Link to="/services">What we do</Link><Link to="/work">Selected work</Link><Link to="/about">Our studio</Link><Link to="/news">Newsroom</Link><Link to="/advertise">Advertise</Link><Link to="/contact">Start a project</Link></div>
        <div className="footer-col"><span className="footer-heading">CONNECT</span><Link to="/contact">Send an inquiry <ArrowUpRight size={14}/></Link><span className="footer-muted">Social pages coming soon</span><div className="social-row"><span aria-label="Instagram coming soon" title="Instagram coming soon"><Instagram size={18}/></span><span aria-label="LinkedIn coming soon" title="LinkedIn coming soon"><Linkedin size={18}/></span><span aria-label="YouTube coming soon" title="YouTube coming soon"><Youtube size={18}/></span></div></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Lomi Media & Communication. All rights reserved.</span><Link to="/privacy">Privacy notice (draft)</Link><span>Designed to communicate.</span></div>
    </div>
  </footer>;
}

export function CTA({ compact = false }: { compact?: boolean }) {
  return <section className={`cta-section ${compact ? 'cta-compact' : ''}`}><div className="container cta-inner"><div><span className="eyebrow light-eyebrow"><span className="eyebrow-line"/>LET'S MAKE AN IMPACT</span><h2>Have a story<br/>worth <em>telling?</em></h2><p>Great things start with a conversation. Tell us what you're imagining.</p></div><Link to="/contact" className="cta-circle" aria-label="Contact Lomi Media & Communication"><ArrowRight size={35}/><span>LET'S TALK</span></Link></div></section>;
}

export function PageIntro({ label, title, italic, description }: { label: string; title: string; italic?: string; description: string }) {
  return <section className="page-intro"><div className="container"><span className="eyebrow"><span className="eyebrow-line"/>{label}</span><h1>{title} {italic && <em>{italic}</em>}</h1><p>{description}</p></div></section>;
}
