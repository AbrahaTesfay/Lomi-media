import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

const DURATION_MS = 4 * 60 * 60 * 1000;
const prod = process.env.NODE_ENV === 'production';
const cookieName = prod ? '__Host-lomi_admin' : 'lomi_admin';
function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
function cookies(request) {
  const map = new Map();
  for (const pair of (request.headers.cookie || '').split(';')) {
    const i = pair.indexOf('='); if (i >= 0) map.set(pair.slice(0,i).trim(), pair.slice(i+1).trim());
  }
  return map;
}
export function verifyPassword(plain, record) {
  try {
    const [salt, expected] = record.split(':');
    const candidate = scryptSync(plain, Buffer.from(salt, 'hex'), 64);
    const stored = Buffer.from(expected, 'hex');
    return candidate.length === stored.length && timingSafeEqual(candidate,stored);
  } catch { return false; }
}
export function createSession(db, userId, response) {
  const token = randomBytes(32).toString('hex');
  const csrf = randomBytes(24).toString('hex');
  const now = Date.now();
  db.prepare('DELETE FROM admin_sessions WHERE expires_at < ?').run(now);
  db.prepare('INSERT INTO admin_sessions(token_hash,user_id,csrf_token,expires_at,created_at) VALUES (?,?,?,?,?)')
    .run(sha256(token),userId,csrf,now+DURATION_MS,now);
  response.setHeader('Set-Cookie', `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(DURATION_MS / 1000)}${prod ? '; Secure' : ''}`);
  return csrf;
}
export function findSession(db, request) {
  const token = cookies(request).get(cookieName);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return db.prepare(`SELECT s.token_hash,s.csrf_token,s.expires_at,u.email,u.id AS user_id
    FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.token_hash=? AND s.expires_at>?`)
    .get(sha256(token),Date.now()) || null;
}
export function requireAdmin(db, { mutation = false } = {}) {
  return (request,response,next) => {
    const session = findSession(db,request);
    if (!session) return response.status(401).json({message:'Please sign in.'});
    if (mutation) {
      const candidate = request.get('X-CSRF-Token') || '';
      const a = Buffer.from(candidate); const b = Buffer.from(session.csrf_token);
      if (a.length !== b.length || !timingSafeEqual(a,b)) return response.status(403).json({message:'Invalid security token. Sign in again.'});
    }
    request.admin = session;
    next();
  };
}
export function endSession(db,request,response) {
  const session = findSession(db,request);
  if (session) db.prepare('DELETE FROM admin_sessions WHERE token_hash=?').run(session.token_hash);
  response.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${prod?'; Secure':''}`);
}
