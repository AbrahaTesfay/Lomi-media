import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { CTA, PageIntro } from '../components/Layout';
import { services } from '../data/content';

export default function Services() {
  return <><PageIntro label="WHAT WE DO" title="Everything you need to" italic="be heard." description="Integrated creative, media and communication services designed around your goals — from the first conversation to the final frame."/>
    <section className="section-space"><div className="container service-list">{services.map(item => <article className="service-row" key={item.number}><div className="service-row-num">{item.number} / 06</div><div><h2>{item.title}</h2><p>{item.detail}</p><div className="tag-list">{item.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div><Link to="/contact" className="service-row-arrow" aria-label={`Ask about ${item.title}`}><ArrowUpRight size={24}/></Link></article>)}</div></section>
    <section className="service-banner"><div className="container service-banner-inner"><span className="eyebrow light-eyebrow">BUILT FOR YOUR AMBITION</span><h2>Not sure where to start?</h2><p>Tell us the challenge. We'll help define the right creative approach.</p><Link className="btn btn-peach" to="/contact">Discuss your project <ArrowRight size={18}/></Link></div></section><CTA compact/></>;
}
