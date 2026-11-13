import { useEffect,useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { getJson, type PortfolioItem } from '../lib/api';
export default function PortfolioProjects(){const [items,setItems]=useState<PortfolioItem[]>([]),[error,setError]=useState('');
  useEffect(()=>{getJson<{items:PortfolioItem[]}>('/api/portfolio').then(data=>setItems(data.items)).catch(()=>setError('Live portfolio projects cannot be loaded right now.'));},[]);
  return <div className="container verified-portfolio"><span className="eyebrow">OUR DELIVERED PROJECTS</span><h2>Client-approved <em>case studies.</em></h2>{error&&<p role="status">{error}</p>}{items.length===0&&!error&&<p>Verified client projects will appear here as they are approved for public display.</p>}<div className="story-grid">{items.map(item=><article className="story-card" key={item.id}><span className="story-category">{item.category}</span><h3>{item.title}</h3><p>{item.description}</p>{item.case_url&&<a href={item.case_url} target="_blank" rel="noopener noreferrer" className="text-link">View project <ArrowUpRight size={17}/></a>}</article>)}</div></div>;
}
