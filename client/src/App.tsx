import { Route, Routes } from 'react-router-dom';
import { Footer, Header } from './components/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import Work from './pages/Work';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Newsroom from './pages/Newsroom';
import Advertise from './pages/Advertise';
import Admin from './pages/Admin';
import Account from './pages/Account';
import ArticleDetail from './pages/ArticleDetail';
import { LanguageProvider } from './lib/i18n';

export default function App() {
  return <LanguageProvider><a className="skip-link" href="#main-content">Skip to main content</a><Header/><main id="main-content"><Routes><Route path="/" element={<Home/>}/><Route path="/services" element={<Services/>}/><Route path="/work" element={<Work/>}/><Route path="/about" element={<About/>}/><Route path="/contact" element={<Contact/>}/><Route path="/privacy" element={<Privacy/>}/><Route path="/news" element={<Newsroom/>}/><Route path="/news/:slug" element={<ArticleDetail/>}/><Route path="/advertise" element={<Advertise/>}/><Route path="/admin" element={<Admin/>}/><Route path="/account" element={<Account/>}/><Route path="*" element={<section className="container not-found"><h1>Page not found.</h1><p>Looks like this link has wandered off.</p><a href="/">Back to home →</a></section>}/></Routes></main><Footer/></LanguageProvider>;
}
