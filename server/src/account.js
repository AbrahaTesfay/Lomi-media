import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { createSession, endSession, findSession, verifyPassword } from './auth.js';

const routerMessages = {
  resetRequested: 'If the address is registered, you will receive a password reset link.',
  invalidLogin: 'Invalid email or password.',
};
const SESSION_MS = 4 * 60 * 60 * 1000;
const RESET_MS = 15 * 60 * 1000;
const VERIFY_MS = 24 * 60 * 60 * 1000;
const production = process.env.NODE_ENV === 'production';
const memberCookie = production ? '__Host-lomi_member' : 'lomi_member';
const email = z.string().trim().email().max(200);
const newPassword = z.string().min(12).max(128);
const signupSchema = z.object({ name: z.string().trim().min(2).max(100), email, password: newPassword, consent:z.literal(true) }).strict();
const loginSchema = z.object({ email, password: z.string().min(1).max(500) }).strict();
const forgotSchema = z.object({ email }).strict();
const resetSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), password: newPassword }).strict();
const verifySchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).strict();

function digest(value) { return createHash('sha256').update(value).digest('hex'); }
function passwordHash(value) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(value, Buffer.from(salt, 'hex'), 64).toString('hex')}`;
}
function appendCookie(res, value) {
  const current = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', current ? [...(Array.isArray(current) ? current : [current]), value] : value);
}
function cookieValue(req) {
  for (const pair of (req.headers.cookie || '').split(';')) {
    const pos = pair.indexOf('=');
    if (pos > 0 && pair.slice(0, pos).trim() === memberCookie) return pair.slice(pos+1).trim();
  }
  return '';
}
function memberSession(db, req) {
  const token = cookieValue(req);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return db.prepare(`SELECT s.token_hash,s.csrf_token,m.id AS user_id,m.email,m.name
    FROM member_sessions s JOIN member_users m ON m.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>?`).get(digest(token), Date.now()) || null;
}
function createMemberSession(db, user, res) {
  const token = randomBytes(32).toString('hex');
  const csrf = randomBytes(24).toString('hex');
  const now = Date.now();
  db.prepare('DELETE FROM member_sessions WHERE expires_at<?').run(now);
  db.prepare(`INSERT INTO member_sessions(token_hash,user_id,csrf_token,expires_at,created_at)
    VALUES (?,?,?,?,?)`).run(digest(token), user.id, csrf, now+SESSION_MS, now);
  appendCookie(res, `${memberCookie}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS/1000}${production ? '; Secure' : ''}`);
  return { email:user.email, name:user.name, csrf, role:'user' };
}
function endMemberSession(db, req, res) {
  const session=memberSession(db,req);
  if (session) db.prepare('DELETE FROM member_sessions WHERE token_hash=?').run(session.token_hash);
  appendCookie(res, `${memberCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${production ? '; Secure' : ''}`);
}
function validCsrf(actual, supplied) {
  const left=Buffer.from(actual || ''); const right=Buffer.from(supplied || '');
  return left.length>0 && left.length===right.length && timingSafeEqual(left,right);
}

function smtpConfigured() {
  return ['SMTP_HOST','SMTP_USER','SMTP_PASS','SMTP_FROM'].every(key => Boolean(process.env[key]));
}
function verificationLink(token) {
  const base = new URL(process.env.APP_BASE_URL || 'http://127.0.0.1:5173');
  if (production && base.protocol !== 'https:') throw new Error('Verified HTTPS site URL required.');
  const url = new URL('/account?mode=verify',base);
  url.searchParams.set('token',token);
  return url.toString();
}
async function sendVerification(to,link,sendVerificationEmail) {
  if (sendVerificationEmail) {
    await sendVerificationEmail({to,link});
    return;
  }
  if (!smtpConfigured()) throw new Error('Email provider not configured.');
  const { default:nodemailer } = await import('nodemailer');
  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host:process.env.SMTP_HOST,port,secure:port===465,
    auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},
  });
  await transporter.sendMail({
    from:process.env.SMTP_FROM,to,subject:'Verify your Lomi Media email',
    text:`Confirm your Lomi Media account within 24 hours:\n\n${link}\n\nIf you did not register, ignore this email.`,
  });
}
async function issueVerification(db, userId, address, sendVerificationEmail) {
  const token = randomBytes(32).toString('hex');
  const link = verificationLink(token);
  db.prepare('DELETE FROM email_verification_tokens WHERE expires_at<?').run(Date.now());
  db.prepare('DELETE FROM email_verification_tokens WHERE user_id=?').run(userId);
  db.prepare('INSERT INTO email_verification_tokens(token_hash,user_id,expires_at) VALUES (?,?,?)')
    .run(digest(token),userId,Date.now()+VERIFY_MS);
  try {
    await sendVerification(address,link,sendVerificationEmail);
  } catch (error) {
    db.prepare('DELETE FROM email_verification_tokens WHERE token_hash=?').run(digest(token));
    throw error;
  }
}

export function createAccountRouter(db, { sendResetEmail, sendVerificationEmail } = {}) {
  const router=Router();
  // Each app instance owns its own limiter state, including isolated test apps.
  const limited={message:'Too many requests. Please try again later.'};
  const loginLimiter=rateLimit({windowMs:15*60*1000,limit:8,standardHeaders:'draft-8',legacyHeaders:false,message:limited});
  const signupLimiter=rateLimit({windowMs:60*60*1000,limit:5,standardHeaders:'draft-8',legacyHeaders:false,message:limited});
  const forgotLimiter=rateLimit({windowMs:60*60*1000,limit:5,standardHeaders:'draft-8',legacyHeaders:false,message:limited});
  const resetLimiter=rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:'draft-8',legacyHeaders:false,message:limited});
  router.get('/me', (req,res) => {
    const admin=findSession(db,req);
    if (admin) return res.json({email:admin.email,csrf:admin.csrf_token,role:'admin'});
    const member=memberSession(db,req);
    if (member) return res.json({email:member.email,name:member.name,csrf:member.csrf_token,role:'user'});
    return res.status(401).json({message:'Please sign in.'});
  });
  router.post('/signup', signupLimiter, async (req,res) => {
    const parsed=signupSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({message:'Enter a valid name, email, password of at least 12 characters, and accept the privacy notice.'});
    if (!sendVerificationEmail && !smtpConfigured()) {
      return res.status(503).json({message:'Account registration is not available until email verification is configured.'});
    }
    const data=parsed.data;
    const address=data.email.toLowerCase();
    const existing=db.prepare('SELECT id FROM admin_users WHERE email=?').get(address) ||
                   db.prepare('SELECT id FROM member_users WHERE email=?').get(address);
    if (existing) return res.status(409).json({message:'This email cannot be registered. Try signing in or resetting your password.'});
    let userId;
    try {
      const result=db.prepare('INSERT INTO member_users(name,email,password_hash,verification_required) VALUES (?,?,?,1)')
        .run(data.name,address,passwordHash(data.password));
      userId=Number(result.lastInsertRowid);
    } catch (error) {
      if (error.code?.startsWith('SQLITE_CONSTRAINT')) return res.status(409).json({message:'This email cannot be registered.'});
      throw error;
    }
    try {
      await issueVerification(db,userId,address,sendVerificationEmail);
    } catch (error) {
      // Do not leave inaccessible accounts behind after email delivery fails.
      db.prepare('DELETE FROM member_users WHERE id=?').run(userId);
      console.error('Account verification delivery failed.');
      return res.status(503).json({message:'Unable to send a verification email. Please try again later.'});
    }
    return res.status(201).json({message:'Check your email to verify your account before signing in.'});
  });
  router.post('/email/resend', forgotLimiter, async (req,res) => {
    const parsed=forgotSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({message:'Provide a valid email address.'});
    const user=db.prepare('SELECT id,email,verification_required FROM member_users WHERE email=?').get(parsed.data.email.toLowerCase());
    if (user?.verification_required) {
      try { await issueVerification(db,user.id,user.email,sendVerificationEmail); }
      catch (error) {
        console.error('Verification resend delivery failed.');
        return res.status(503).json({message:'Email delivery is currently unavailable.'});
      }
    }
    return res.json({message:'If this account is awaiting verification, a new verification link has been sent.'});
  });
  router.post('/email/verify', resetLimiter, (req,res) => {
    const parsed=verifySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({message:'Invalid verification link.'});
    const tokenHash=digest(parsed.data.token);
    const record=db.prepare('SELECT user_id FROM email_verification_tokens WHERE token_hash=? AND expires_at>?')
      .get(tokenHash,Date.now());
    if (!record) return res.status(400).json({message:'This verification link is invalid or expired.'});
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('UPDATE member_users SET verification_required=0,email_verified_at=? WHERE id=?')
        .run(Date.now(),record.user_id);
      db.prepare('DELETE FROM email_verification_tokens WHERE user_id=?').run(record.user_id);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK');throw error; }
    return res.json({message:'Your email is verified. You can now sign in.'});
  });
  router.post('/login', loginLimiter, (req,res) => {
    const parsed=loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(401).json({message:routerMessages.invalidLogin});
    const address=parsed.data.email.toLowerCase();
    const admin=db.prepare('SELECT id,email,password_hash FROM admin_users WHERE email=?').get(address);
    if (admin) {
      if (!verifyPassword(parsed.data.password,admin.password_hash)) return res.status(401).json({message:routerMessages.invalidLogin});
      const csrf=createSession(db,admin.id,res);
      endMemberSession(db,req,res);
      return res.json({role:'admin',email:admin.email,csrf});
    }
    const user=db.prepare('SELECT id,name,email,password_hash,verification_required FROM member_users WHERE email=?').get(address);
    if (!user || !verifyPassword(parsed.data.password,user.password_hash)) return res.status(401).json({message:routerMessages.invalidLogin});
    if (user.verification_required) return res.status(403).json({message:'Verify your email before signing in.'});
    endSession(db,req,res);
    return res.json(createMemberSession(db,user,res));
  });
  router.post('/logout', (req,res) => {
    const admin=findSession(db,req);
    const member=memberSession(db,req);
    if (!admin && !member) return res.status(401).json({message:'Not signed in.'});
    if (!validCsrf(admin?.csrf_token || member?.csrf_token,req.get('X-CSRF-Token'))) return res.status(403).json({message:'Invalid security token.'});
    endSession(db,req,res);
    endMemberSession(db,req,res);
    return res.json({ok:true});
  });
  router.post('/password/forgot', forgotLimiter, async (req,res) => {
    const parsed=forgotSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({message:'Provide a valid email address.'});
    const address=parsed.data.email.toLowerCase();
    // Report unavailable mail delivery consistently, without disclosing account existence.
    if (!sendResetEmail && !['SMTP_HOST','SMTP_USER','SMTP_PASS','SMTP_FROM'].every(key => process.env[key])) {
      return res.status(503).json({message:'Password reset email is not configured. Contact the website administrator.'});
    }
    const admin=db.prepare('SELECT id FROM admin_users WHERE email=?').get(address);
    const member=admin?null:db.prepare('SELECT id FROM member_users WHERE email=?').get(address);
    if (!admin && !member) return res.json({message:routerMessages.resetRequested});
    const origin=process.env.APP_BASE_URL || 'http://127.0.0.1:5173';
    const base=new URL(origin);
    if (production && base.protocol !== 'https:') return res.status(503).json({message:'Password reset is not available.'});
    const token=randomBytes(32).toString('hex');
    const tokenHash=digest(token);const type=admin?'admin':'user';const userId=admin?.id || member.id;
    db.prepare('DELETE FROM password_reset_tokens WHERE expires_at<?').run(Date.now());
    db.prepare('DELETE FROM password_reset_tokens WHERE account_type=? AND user_id=?').run(type,userId);
    db.prepare('INSERT INTO password_reset_tokens(token_hash,account_type,user_id,expires_at) VALUES (?,?,?,?)')
      .run(tokenHash,type,userId,Date.now()+RESET_MS);
    const resetLink=new URL('/account?mode=reset',base);
    resetLink.searchParams.set('token',token);
    try {
      if (sendResetEmail) await sendResetEmail({to:address,link:resetLink.toString()});
      else {
        const {default:nodemailer}=await import('nodemailer');
        const port=Number(process.env.SMTP_PORT || 587);
        const transporter=nodemailer.createTransport({
          host:process.env.SMTP_HOST,port,secure:port===465,
          auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},
        });
        await transporter.sendMail({
          from:process.env.SMTP_FROM,to:address,subject:'Reset your Lomi Media password',
          text:`A password reset was requested for your Lomi Media account.\n\nUse this link within 15 minutes:\n${resetLink.toString()}\n\nIf you did not request this, ignore this email.`,
        });
      }
    } catch (error) {
      db.prepare('DELETE FROM password_reset_tokens WHERE token_hash=?').run(tokenHash);
      console.error('Password reset email delivery failed:', error?.message || 'unknown error');
      return res.status(503).json({message:'Password reset email could not be sent. Please try again later.'});
    }
    return res.json({message:routerMessages.resetRequested});
  });
  router.post('/password/reset', resetLimiter, (req,res) => {
    const parsed=resetSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({message:'Invalid reset token or password.'});
    const tokenHash=digest(parsed.data.token);
    const reset=db.prepare('SELECT * FROM password_reset_tokens WHERE token_hash=? AND expires_at>?').get(tokenHash,Date.now());
    if (!reset) return res.status(400).json({message:'This reset link is invalid or has expired.'});
    db.exec('BEGIN IMMEDIATE');
    try {
      const table=reset.account_type==='admin'?'admin_users':'member_users';
      db.prepare(`UPDATE ${table} SET password_hash=? WHERE id=?`).run(passwordHash(parsed.data.password),reset.user_id);
      db.prepare('DELETE FROM password_reset_tokens WHERE account_type=? AND user_id=?').run(reset.account_type,reset.user_id);
      const sessionTable=reset.account_type==='admin'?'admin_sessions':'member_sessions';
      db.prepare(`DELETE FROM ${sessionTable} WHERE user_id=?`).run(reset.user_id);
      db.exec('COMMIT');
    } catch (err) { db.exec('ROLLBACK');throw err; }
    endSession(db,req,res);
    endMemberSession(db,req,res);
    return res.json({message:'Password updated. Please sign in with your new password.'});
  });
  return router;
}
