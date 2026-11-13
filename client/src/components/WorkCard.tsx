import { ArrowUpRight, Aperture, Globe2, Layers3 } from 'lucide-react';
import type { projects } from '../data/content';

type Project = typeof projects[number];

export function WorkCard({ project }: { project: Project }) {
  return <article className="work-card">
    <div className={`work-art ${project.className}`}>
      {project.index === '01' && <div className="art-documentary"><span className="art-top">LOMI / ORIGINALS</span><div className="art-sun"/><div className="art-hills art-hills-back"/><div className="art-hills art-hills-front"/><div className="art-btm"><Aperture size={26}/> BEYOND<br/>THE FRAME.</div></div>}
      {project.index === '02' && <div className="art-branding"><span className="art-top dark-text">REIMAGINE / 001</span><div className="art-rings"><div className="art-ring-inner">GOOD<br/>IDEAS.</div></div><div className="art-branding-sub">A new visual language.</div></div>}
      {project.index === '03' && <div className="art-digital"><span className="art-top dark-text">LOMI / DIGITAL</span><div className="art-browser"><div className="art-browser-bar"><span/><span/><span/></div><div className="art-browser-body"><Globe2 size={42}/><strong>NEXT<br/>IS NOW.</strong><Layers3 size={22}/></div></div></div>}
    </div>
    <div className="work-info"><div><span className="work-type">{project.type} • {project.note}</span><h3>{project.title}</h3><p>{project.subtitle}</p></div><span className="work-arrow" aria-hidden="true"><ArrowUpRight size={22}/></span></div>
  </article>;
}
