import { openDatabase } from '../src/database.js';

const db = openDatabase();
const entries = db.prepare('SELECT id, name, email, organization, service, created_at FROM inquiries ORDER BY id DESC LIMIT 50').all();
console.log(`Most recent ${entries.length} inquiries (up to 50):`);
console.table(entries);
console.log('Keep access to this terminal and the database restricted. Never expose this command as a public API.');
db.close();
