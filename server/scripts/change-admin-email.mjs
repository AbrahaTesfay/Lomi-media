import { openDatabase } from '../src/database.js';
import { verifyPassword } from '../src/auth.js';

let input = '';
for await (const chunk of process.stdin) input += chunk.toString('utf8');
let values;
try { values = JSON.parse(input); } catch { throw new Error('Expected secure input via standard input.'); }
const email = String(values.email || '').trim().toLowerCase();
const password = String(values.password || '');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200 || !password) {
  throw new Error('Enter a valid email and the current admin password.');
}
const db=openDatabase();
try {
  const admins=db.prepare('SELECT id,email,password_hash FROM admin_users').all();
  if (admins.length !== 1) throw new Error('Expected exactly one administrator. No changes made.');
  const current=admins[0];
  if (!verifyPassword(password,current.password_hash)) throw new Error('Administrator password was incorrect. No changes made.');
  if (db.prepare('SELECT 1 FROM member_users WHERE email=?').get(email)) {
    throw new Error('That email belongs to a regular user. No changes made.');
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('UPDATE admin_users SET email=? WHERE id=?').run(email,current.id);
    db.prepare('DELETE FROM admin_sessions WHERE user_id=?').run(current.id);
    db.prepare("DELETE FROM password_reset_tokens WHERE account_type='admin' AND user_id=?").run(current.id);
    db.exec('COMMIT');
  } catch(err) { db.exec('ROLLBACK'); throw err; }
  console.log('Administrator email updated. Sign in again using the new email.');
} finally { db.close(); }
