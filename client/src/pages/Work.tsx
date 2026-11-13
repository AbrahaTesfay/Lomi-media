import { CTA, PageIntro } from '../components/Layout';
import { WorkCard } from '../components/WorkCard';
import { projects } from '../data/content';

export default function Work() {
  return <><PageIntro label="CREATIVE SHOWCASE" title="Work that makes" italic="you feel." description="A glimpse into our creative directions across film, brand identity and digital experiences."/>
    <section className="work-gallery section-space"><div className="container"><p className="concept-disclaimer"><strong>A note on our portfolio:</strong> These are illustrative creative concepts prepared for the website. They are not representations of delivered client projects. Replace them with authorized case studies as the company grows.</p><div className="work-grid work-full-grid">{projects.map(project => <WorkCard project={project} key={project.index}/>)}</div></div></section><CTA/></>;
}
