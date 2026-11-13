import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { randomBytes } from 'node:crypto';
import { contactSchema, adRequestSchema, loginSchema, articleSchema, campaignSchema, portfolioSchema } from './schema.js';
import { createSession, findSession, requireAdmin, endSession, verifyPassword } from './auth.js';
import { createAccountRouter } from './account.js';

function slugify(title) { return title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,68) || 'story'; }
function idFrom(request) { const id = Number(request.params.id); return Number.isSafeInteger(id) && id > 0 ? id : 0; }
const errorMessage = { message: 'Please review your information and try again.' };
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(x => x.trim()).filter(Boolean);

export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ credentials:true, origin:(origin,cb) => cb(null,!origin || origins.includes(origin)), methods:['GET','POST','PUT','DELETE'],allowedHeaders:['Content-Type','X-CSRF-Token'] }));
  app.use(express.json({limit:'48kb'}));
  // Restrict state-changing calls made from browsers to configured origins.
  app.use('/api', (request,response,next) => {
    if (['POST','PUT','PATCH','DELETE'].includes(request.method)) {
      const origin = request.get('origin');
      if (origin && !origins.includes(origin)) return response.status(403).json({message:'Origin not allowed.'});
    }
    next();
  });
  const publicLimiter = rateLimit({windowMs:15*60*1000,limit:5,standardHeaders:'draft-8',legacyHeaders:false,message:{message:'Too many requests. Try again later.'}});
  const loginLimiter = rateLimit({windowMs:15*60*1000,limit:8,standardHeaders:'draft-8',legacyHeaders:false,message:{message:'Too many login attempts. Try again later.'}});
  const adminRead = requireAdmin(db); const adminWrite = requireAdmin(db,{mutation:true});
  app.use('/api/account', createAccountRouter(db));

  app.get('/api/health', (_req,res) => res.json({ok:true,service:'lomi-api'}));
  app.post('/api/contact',publicLimiter,(req,res)=>{
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(errorMessage);
    const {name,email,organization,service,message,website} = parsed.data;
    if (!website) db.prepare('INSERT INTO inquiries(name,email,organization,service,message) VALUES (?,?,?,?,?)').run(name,email,organization,service,message);
    res.status(202).json({message:'Thank you. Your inquiry has been received.'});
  });
  app.post('/api/advertise',publicLimiter,(req,res)=>{
    const parsed=adRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(errorMessage);
    const {company,name,email,website_url,message,placement,website}=parsed.data;
    if (!website) db.prepare('INSERT INTO ad_requests(company,name,email,website_url,message,placement) VALUES (?,?,?,?,?,?)').run(company,name,email,website_url,message,placement);
    res.status(202).json({message:'Advertising inquiry received. Our team will review it. No payment has been charged.'});
  });
  app.get('/api/articles',(req,res)=>{
    const category = typeof req.query.category==='string' ? req.query.category : '';
    const articles = category && category !== 'All' ? db.prepare(`SELECT id,slug,title,excerpt,category,language,created_at FROM articles WHERE status='published' AND category=? ORDER BY created_at DESC,id DESC LIMIT 60`).all(category) : db.prepare(`SELECT id,slug,title,excerpt,category,language,created_at FROM articles WHERE status='published' ORDER BY created_at DESC,id DESC LIMIT 60`).all();
    res.json({items:articles});
  });
  app.get('/api/articles/:slug',(req,res)=>{
    const item=db.prepare(`SELECT id,slug,title,excerpt,body,category,language,created_at FROM articles WHERE slug=? AND status='published'`).get(req.params.slug);
    if (!item) return res.status(404).json({message:'Story not found.'});
    res.json(item);
  });
  app.get('/api/portfolio',(_req,res)=>res.json({items:db.prepare(`SELECT * FROM portfolio_items WHERE status='published' ORDER BY id DESC LIMIT 50`).all()}));
  app.get('/api/ads',(req,res)=>{
    const placement = typeof req.query.placement==='string' ? req.query.placement : '';
    if (!['homepage','news','sidebar'].includes(placement)) return res.status(400).json(errorMessage);
    const today=new Date().toISOString().slice(0,10);
    const items=db.prepare(`SELECT id,company,headline,description,link_url,placement FROM campaigns WHERE placement=? AND status='active' AND payment_verified=1 AND start_date<=? AND end_date>=? ORDER BY id DESC LIMIT 4`).all(placement,today,today);
    res.json({items});
  });

  app.post('/api/admin/login',loginLimiter,(req,res)=>{
    const parsed=loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(401).json({message:'Invalid email or password.'});
    const user=db.prepare('SELECT id,email,password_hash FROM admin_users WHERE email=?').get(parsed.data.email.toLowerCase());
    if (!user || !verifyPassword(parsed.data.password,user.password_hash)) return res.status(401).json({message:'Invalid email or password.'});
    const csrf=createSession(db,user.id,res); res.json({email:user.email,csrf});
  });
  app.get('/api/admin/me',adminRead,(req,res)=>res.json({email:req.admin.email,csrf:req.admin.csrf_token}));
  app.post('/api/admin/logout',adminWrite,(req,res)=>{endSession(db,req,res);res.json({ok:true});});
  app.get('/api/admin/overview',adminRead,(_req,res)=>{
    const count = (table) => db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get().total;
    res.json({inquiries:count('inquiries'),ad_requests:count('ad_requests'),articles:count('articles'),campaigns:count('campaigns'),portfolio:count('portfolio_items')});
  });
  app.get('/api/admin/inquiries',adminRead,(_req,res)=>res.json({items:db.prepare('SELECT * FROM inquiries ORDER BY id DESC LIMIT 100').all()}));
  app.get('/api/admin/ad-requests',adminRead,(_req,res)=>res.json({items:db.prepare('SELECT * FROM ad_requests ORDER BY id DESC LIMIT 100').all()}));
  app.get('/api/admin/articles',adminRead,(_req,res)=>res.json({items:db.prepare('SELECT * FROM articles ORDER BY id DESC LIMIT 100').all()}));
  app.post('/api/admin/articles',adminWrite,(req,res)=>{
    const parsed=articleSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json(errorMessage);
    const p=parsed.data; const slug=`${slugify(p.title)}-${randomBytes(3).toString('hex')}`;
    const result=db.prepare('INSERT INTO articles(slug,title,excerpt,body,category,language,status) VALUES (?,?,?,?,?,?,?)').run(slug,p.title,p.excerpt,p.body,p.category,p.language,p.status);
    res.status(201).json({id:result.lastInsertRowid,slug});
  });
  app.put('/api/admin/articles/:id',adminWrite,(req,res)=>{
    const p=articleSchema.safeParse(req.body);if(!p.success)return res.status(400).json(errorMessage);
    const v=p.data;const result=db.prepare(`UPDATE articles SET title=?,excerpt=?,body=?,category=?,language=?,status=?,updated_at=datetime('now') WHERE id=?`).run(v.title,v.excerpt,v.body,v.category,v.language,v.status,idFrom(req));
    res.status(result.changes?200:404).json({ok:!!result.changes});
  });
  app.delete('/api/admin/articles/:id',adminWrite,(req,res)=>{
    const result=db.prepare('DELETE FROM articles WHERE id=?').run(idFrom(req));res.status(result.changes?200:404).json({ok:!!result.changes});
  });
  app.get('/api/admin/campaigns',adminRead,(_req,res)=>res.json({items:db.prepare('SELECT * FROM campaigns ORDER BY id DESC LIMIT 100').all()}));
  app.post('/api/admin/campaigns',adminWrite,(req,res)=>{
    const parsed=campaignSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json(errorMessage);
    const p=parsed.data;
    if(p.status==='active' && !p.payment_verified)return res.status(400).json({message:'Verify payment before activating an ad.'});
    const result=db.prepare('INSERT INTO campaigns(company,headline,description,link_url,placement,status,payment_verified,start_date,end_date) VALUES (?,?,?,?,?,?,?,?,?)').run(p.company,p.headline,p.description,p.link_url,p.placement,p.status,Number(p.payment_verified),p.start_date,p.end_date);
    res.status(201).json({id:result.lastInsertRowid});
  });
  app.put('/api/admin/campaigns/:id',adminWrite,(req,res)=>{
    const parsed=campaignSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json(errorMessage);
    const p=parsed.data;
    if(p.status==='active'&&!p.payment_verified)return res.status(400).json({message:'Verify payment before activating an ad.'});
    const result=db.prepare('UPDATE campaigns SET company=?,headline=?,description=?,link_url=?,placement=?,status=?,payment_verified=?,start_date=?,end_date=? WHERE id=?').run(p.company,p.headline,p.description,p.link_url,p.placement,p.status,Number(p.payment_verified),p.start_date,p.end_date,idFrom(req));
    res.status(result.changes?200:404).json({ok:!!result.changes});
  });
  app.get('/api/admin/portfolio',adminRead,(_req,res)=>res.json({items:db.prepare('SELECT * FROM portfolio_items ORDER BY id DESC LIMIT 100').all()}));
  app.post('/api/admin/portfolio',adminWrite,(req,res)=>{
    const parsed=portfolioSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json(errorMessage);
    const p=parsed.data;const result=db.prepare('INSERT INTO portfolio_items(title,category,description,case_url,status) VALUES (?,?,?,?,?)').run(p.title,p.category,p.description,p.case_url,p.status);
    res.status(201).json({id:result.lastInsertRowid});
  });
  app.put('/api/admin/portfolio/:id',adminWrite,(req,res)=>{
    const parsed=portfolioSchema.safeParse(req.body);if(!parsed.success)return res.status(400).json(errorMessage);
    const p=parsed.data;const result=db.prepare('UPDATE portfolio_items SET title=?,category=?,description=?,case_url=?,status=? WHERE id=?').run(p.title,p.category,p.description,p.case_url,p.status,idFrom(req));
    res.status(result.changes?200:404).json({ok:!!result.changes});
  });
  app.use((_req,res)=>res.status(404).json({message:'Endpoint not found.'}));
  app.use((error,_req,res,_next)=>{console.error('[API error]',error?.message || 'Unknown error');res.status(500).json({message:'Service unavailable. Please try again later.'});});
  return app;
}
