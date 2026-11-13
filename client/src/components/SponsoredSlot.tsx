import { useEffect,useState } from 'react';
import { Megaphone, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getJson, type Campaign } from '../lib/api';
export default function SponsoredSlot({placement}:{placement:'homepage'|'news'|'sidebar'}) {
  const [items,setItems]=useState<Campaign[]>([]);
  useEffect(()=>{let active=true;getJson<{items:Campaign[]}>(`/api/ads?placement=${placement}`).then(data=>{if(active)setItems(data.items);}).catch(()=>{});return ()=>{active=false;};},[placement]);
  return <section className="ad-placement" aria-label="Advertising space"><div className="ad-placement-head"><span><Megaphone size={16}/> ADVERTISING</span><Link to="/advertise">Advertise here <ArrowUpRight size={15}/></Link></div>
    {items.length ? <div className="advert-grid">{items.map(item=><a key={item.id} className="advert-card" href={item.link_url} target="_blank" rel="noopener noreferrer sponsored nofollow"><span className="sponsored-label">Paid advertisement</span><strong>{item.company}</strong><h3>{item.headline}</h3><p>{item.description}</p><span className="ad-external">Visit advertiser <ArrowUpRight size={15}/></span></a>)}</div>
      : <div className="ad-placeholder"><div><span className="sponsored-label">Advertising space · available</span><h3>Your brand could be here.</h3><p>Premium placement for approved business advertising. No advertiser has been booked for this space.</p></div><Link to="/advertise" className="btn btn-dark">Request this space <ArrowUpRight size={17}/></Link></div>}
  </section>;
}
