import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Clapperboard, Megaphone, MonitorSmartphone, Play, Sparkles } from 'lucide-react';
import { CTA } from '../components/Layout';
import { WorkCard } from '../components/WorkCard';
import { processes, projects, services } from '../data/content';

const serviceIcons = [<Clapperboard size={29}/>, <Sparkles size={29}/>, <Megaphone size={29}/>, <MonitorSmartphone size={29}/>];

export default function Home() {
  return <>
    <section className="hero"><div className="container hero-grid">
      <div className="hero-content"><span className="eyebrow light-eyebrow"><span className="eyebrow-line"/>CREATIVE COMMUNICATIONS STUDIO</span><h1>Ideas that<br/><span className="highlight-word">move</span> people<span className="dot">.</span></h1><p>We bring stories, brands and bold ideas to life through media, strategy and meaningful communication.</p><div className="hero-actions"><Link className="btn btn-peach" to="/services">What we do <ArrowUpRight size={20}/></Link><Link to="/work" className="text-link light-link">Explore our thinking <ArrowRight size={18}/></Link></div><div className="hero-meta"><span><span className="status-pulse"/>OPEN TO COLLABORATION</span><span>AFRICA-ROOTED / GLOBALLY MINDED</span></div></div>
      <div className="hero-visual" aria-label="Abstract editorial design representing film, storytelling and communication" role="img">
        <div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/>
        <div className="hero-poster"><div className="poster-top"><span>LOMI<br/>CREATIVE STUDIO</span><span>EST. / THE FUTURE</span></div><div className="poster-circle"><div className="poster-face"><div className="face-eye left"/><div className="face-eye right"/><div className="face-nose"/></div></div><div className="poster-type">MAKE<br/><i>WAVES.</i></div><div className="poster-bottom"><span>STRATEGY · STORY · CULTURE</span><span>↗</span></div></div>
        <div className="hero-sticker"><Play size={20} fill="currentColor"/><span>MAKE IT<br/>MATTER</span></div>
        <span className="hero-vertical">VISION IN EVERY FRAME — 2026</span>
      </div>
    </div></section>

    <div className="ribbon" aria-label="Our disciplines"><div className="ribbon-track"><span>STORYTELLING ✳ BRANDING ✳ COMMUNICATION ✳ DIGITAL EXPERIENCES ✳ MEDIA PRODUCTION ✳ CREATIVE STRATEGY ✳</span><span aria-hidden="true">STORYTELLING ✳ BRANDING ✳ COMMUNICATION ✳ DIGITAL EXPERIENCES ✳ MEDIA PRODUCTION ✳ CREATIVE STRATEGY ✳</span></div></div>

    <section className="intro-section section-space"><div className="container intro-grid"><div><span className="eyebrow"><span className="eyebrow-line"/>WHO WE ARE</span><h2>More than media.<br/><em>Meaningful impact.</em></h2></div><div className="intro-right"><p>In a noisy world, good communication makes the difference. Lomi Media & Communication is building a home for fresh perspectives, powerful stories and clear ideas that help organizations connect with people.</p><Link to="/about" className="text-link">Get to know us <ArrowUpRight size={18}/></Link></div></div></section>

    <section className="services-preview section-space"><div className="container"><div className="section-head"><div><span className="eyebrow"><span className="eyebrow-line"/>OUR EXPERTISE</span><h2>One studio.<br/><em>Many possibilities.</em></h2></div><Link className="outline-link" to="/services">All services <ArrowUpRight size={18}/></Link></div><div className="service-grid">{services.slice(0,4).map((service, index) => <Link className="service-card" to="/services" key={service.number}><div className="service-card-top"><span>{service.number} / EXPERTISE</span><ArrowUpRight size={19}/></div><div className="service-icon">{serviceIcons[index]}</div><div><h3>{service.title}</h3><p>{service.short}</p></div></Link>)}</div></div></section>

    <section className="work-section section-space"><div className="container"><div className="section-head"><div><span className="eyebrow"><span className="eyebrow-line"/>SELECTED DIRECTIONS</span><h2>Good work starts<br/>with <em>a great idea.</em></h2></div><p className="section-side-note">A look at the kind of creative thinking we bring to the table. Sample concepts — not client commissions.</p></div><div className="work-grid">{projects.slice(0,2).map(project => <WorkCard project={project} key={project.index}/>)}</div><div className="work-more"><Link to="/work" className="text-link">Explore all concepts <ArrowUpRight size={18}/></Link></div></div></section>

    <section className="process-section section-space"><div className="container"><div className="section-head"><div><span className="eyebrow light-eyebrow"><span className="eyebrow-line"/>HOW WE THINK</span><h2>Simple process.<br/><em>Extraordinary possibilities.</em></h2></div><p>Every great collaboration begins with curiosity, focus and a shared ambition.</p></div><div className="process-grid">{processes.map(item => <div className="process-item" key={item.number}><span className="process-number">{item.number}</span><h3>{item.title}</h3><p>{item.copy}</p></div>)}</div></div></section>

    <section className="statement-section"><div className="container statement-grid"><span className="eyebrow"><span className="eyebrow-line"/>OUR PERSPECTIVE</span><h2>Rooted in our perspective.<br/><em>Open to the world.</em></h2><p>We believe remarkable ideas can come from anywhere — and connect with people everywhere.</p></div></section>
    <CTA />
  </>;
}
