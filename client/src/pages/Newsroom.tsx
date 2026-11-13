import { useEffect,useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Globe2, Newspaper, Clock3 } from 'lucide-react';
import { PageIntro } from '../components/Layout';
import SponsoredSlot from '../components/SponsoredSlot';
import { getJson, type Article } from '../lib/api';
import { useLang } from '../lib/i18n';
const categories = ['All','World','Africa','Business','Technology','Culture','Company'];
const sourceLinks = [
  {label:'Reuters',url:'https://www.reuters.com/world/',area:'Global reporting'},
  {label:'Associated Press',url:'https://apnews.com/world-news',area:'International coverage'},
  {label:'BBC News',url:'https://www.bbc.com/news/world',area:'World news'},
  {label:'Deutsche Welle',url:'https://www.dw.com/en/top-stories/s-9097',area:'Global perspectives'},
];
export default function Newsroom(){
  const {t}=useLang();const [category,setCategory]=useState('All');const [items,setItems]=useState<Article[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  useEffect(()=>{let active=true;setLoading(true);setError('');getJson<{items:Article[]}>(`/api/articles?category=${encodeURIComponent(category)}`).then(data=>{if(active)setItems(data.items);}).catch(()=>{if(active)setError('The newsroom is temporarily unavailable.');}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[category]);
  return <><PageIntro label="LOMI / EDITORIAL" title={t('newsroomHeading')} italic="& insights." description={t('newsroomText')}/>
    <section className="news-highlight"><div className="container highlight-grid"><div><span className="eyebrow light-eyebrow">PUBLISH WITH PURPOSE</span><h2>Local insight.<br/><em>Global awareness.</em></h2><p>Original news, industry insight and company announcements. Every published article is created and approved by the Lomi editorial team.</p></div><div className="globe-illustration" aria-hidden="true"><Globe2 size={174} strokeWidth={.75}/><span>LOMI / WORLD DESK</span></div></div></section>
    <section className="section-space"><div className="container"><div className="section-head"><div><span className="eyebrow"><Newspaper size={18}/> EDITORIAL</span><h2>Latest from<br/><em>our newsroom.</em></h2></div></div>
    <div className="category-bar" role="group" aria-label="Filter newsroom stories">{categories.map(c=><button key={c} type="button" className={c===category?'chip active':'chip'} onClick={()=>setCategory(c)}>{c}</button>)}</div>
    {loading && <p className="state-note" role="status">Loading published stories…</p>}{error && <p role="alert" className="state-note">{error}</p>}
    {!loading&&!error&&items.length===0 && <div className="news-empty"><Newspaper size={40}/><h3>Stories are coming soon.</h3><p>No {category==='All'?'published':category} articles yet. Authorized editors can publish original stories through the admin dashboard.</p></div>}
    <div className="story-grid">{items.map(item=><Link className="story-card" key={item.id} to={`/news/${item.slug}`}><span className="story-category">{item.category} · {item.language.toUpperCase()}</span><h3>{item.title}</h3><p>{item.excerpt}</p><div className="story-footer"><span><Clock3 size={14}/>{new Date(item.created_at.replace(' ','T')+'Z').toLocaleDateString()}</span><ArrowUpRight size={21}/></div></Link>)}</div>
    </div></section>
    <div className="container"><SponsoredSlot placement="news"/></div>
    <section className="section-space"><div className="container"><div className="section-head"><div><span className="eyebrow">EXTERNAL SOURCES</span><h2>Follow the<br/><em>wider world.</em></h2></div></div><p className="source-disclaimer">These are independent international publishers. Links open their official websites; their content is not hosted, copied or endorsed by Lomi Media. Their links are not paid advertisements.</p><div className="source-grid">{sourceLinks.map(source=><a href={source.url} target="_blank" rel="noopener noreferrer" className="source-card" key={source.label}><span>{source.area}</span><strong>{source.label}</strong><ArrowUpRight size={20}/></a>)}</div></div></section>
  </>;
}
