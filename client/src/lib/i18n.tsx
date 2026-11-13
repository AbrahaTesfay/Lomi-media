import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
type Lang = 'en'|'am'|'ti';
export type Key = 'home'|'services'|'work'|'news'|'advertise'|'about'|'contact'|'heroHeading'|'heroText'|'newsroomHeading'|'newsroomText'|'advertiseHeading'|'advertiseText'|'hello'|'language';
const translations: Record<Lang,Record<Key,string>> = {
  en: { home:'Home',services:'Services',work:'Our work',news:'Newsroom',advertise:'Advertise',about:'About',contact:'Contact',heroHeading:'Ideas that move people.',heroText:'Media, storytelling and communication built to connect your brand to the world.',newsroomHeading:'Lomi newsroom',newsroomText:'Original company news and editorial stories, plus links to independent international news sources.',advertiseHeading:'Advertise with Lomi',advertiseText:'Put your brand in front of an engaged audience through clearly identified sponsored placements.',hello:'Let’s talk',language:'Language' },
  am: { home:'መነሻ',services:'አገልግሎቶች',work:'ሥራዎቻችን',news:'ዜና',advertise:'ማስታወቂያ',about:'ስለ እኛ',contact:'ያግኙን',heroHeading:'ሰዎችን የሚያነሳሱ ሀሳቦች።',heroText:'የምርት ስምዎን ከዓለም ጋር የሚያገናኙ ሚዲያ፣ ታሪኮች እና ግንኙነት።',newsroomHeading:'የሎሚ ዜና ክፍል',newsroomText:'የኩባንያ ዜናዎች፣ የራሳችን ጽሑፎች እና ወደ ዓለም አቀፍ የዜና ምንጮች አገናኞች።',advertiseHeading:'በሎሚ ላይ ያስተዋውቁ',advertiseText:'በግልጽ ሁኔታ የተለዩ የክፍያ ማስታወቂያ ቦታዎች።',hello:'እንነጋገር',language:'ቋንቋ' },
  ti: { home:'መበገሲ',services:'ኣገልግሎታት',work:'ስራሕና',news:'ዜና',advertise:'መወዓውዒ',about:'ብዛዕባና',contact:'ርኸቡና',heroHeading:'ንሰባት ዝተንቀሳቕሱ ሓሳባት።',heroText:'ንምልክት ንግድኹም ምስ ዓለም ዘራኽብ ሚድያ፣ ትረኻን ርክብን።',newsroomHeading:'ክፍሊ ዜና ሎሚ',newsroomText:'ዜና ኩባንያ፣ ናይ ባዕልና ጽሑፋትን መላግቦታት ዓለምለኻዊ ምንጭታት ዜናን።',advertiseHeading:'ኣብ ሎሚ ኣወዓውዑ',advertiseText:'ብግልጺ ዝተለለዩ ናይ ክፍሊት መወዓውዒ ቦታታት።',hello:'ንዛረብ',language:'ቋንቋ' },
};
const LanguageContext = createContext<{lang:Lang;setLang:(v:Lang)=>void;t:(key:Key)=>string}>({lang:'en',setLang:()=>{},t:(key)=>translations.en[key]});
export function LanguageProvider({children}:{children:ReactNode}) {
  const [lang,setLang] = useState<Lang>(() => { try {const saved=localStorage.getItem('lomi_language');return saved==='am'||saved==='ti'?saved:'en';}catch{return 'en';}});
  useEffect(()=>{document.documentElement.lang=lang;try{localStorage.setItem('lomi_language',lang);}catch{}},[lang]);
  return <LanguageContext.Provider value={{lang,setLang,t:(key)=>translations[lang][key]}}>{children}</LanguageContext.Provider>;
}
export function useLang(){return useContext(LanguageContext);}
