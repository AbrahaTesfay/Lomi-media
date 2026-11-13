import { useEffect,useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getJson,type Article } from '../lib/api';
import SponsoredSlot from '../components/SponsoredSlot';
export default function ArticleDetail(){
  const {slug}=useParams();const [article,setArticle]=useState<Article|null>(null);const [error,setError]=useState('');
  useEffect(()=>{if(!slug)return;let active=true;setError('');getJson<Article>(`/api/articles/${encodeURIComponent(slug)}`).then(data=>{if(active)setArticle(data)}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Story unavailable')});return()=>{active=false;};},[slug]);
  return <section className="section-space"><div className="container article-layout"><Link className="text-link" to="/news">← Back to newsroom</Link>{error&&<p className="state-note" role="alert">{error}</p>}{!article&&!error&&<p role="status">Loading story…</p>}{article&&<><header className="article-heading"><span className="story-category">LOMI ORIGINAL · {article.category} · {article.language.toUpperCase()}</span><h1>{article.title}</h1><p>{article.excerpt}</p><small>Published {new Date(article.created_at.replace(' ','T')+'Z').toLocaleDateString()}</small></header><article className="article-body">{article.body?.split(/\n\s*\n/).filter(Boolean).map((paragraph,i)=><p key={i}>{paragraph}</p>)}</article><SponsoredSlot placement="sidebar"/></>}</div></section>;
}
