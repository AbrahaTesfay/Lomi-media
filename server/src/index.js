import { createApp } from './app.js';
import { openDatabase, provisionAdmin } from './database.js';

const db = openDatabase();
provisionAdmin(db);
const app = createApp(db);
const port = Number(process.env.PORT || 4000);
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
const server = app.listen(port, host, () => {
  console.log(`Lomi API ready on http://localhost:${port}`);
  console.log('Contact form submissions are stored in a local SQLite database.');
});

function stop() { server.close(() => { db.close(); process.exit(0); }); }
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
