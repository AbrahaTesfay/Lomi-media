import { MessageCircle } from 'lucide-react';
const number=(import.meta.env.VITE_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g,'');
export function WhatsAppLink(){
  if(!number)return <p className="whatsapp-note">WhatsApp contact can be enabled once the company business number is verified.</p>;
  return <a className="whatsapp-button" href={`https://wa.me/${number}?text=${encodeURIComponent('Hello Lomi Media, I would like to discuss a project.')}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={19}/> Chat with Lomi on WhatsApp</a>;
}
