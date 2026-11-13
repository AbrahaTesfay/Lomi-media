import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { openDatabase, provisionAdmin } from '../src/database.js';
import { verifyPassword, createSession, findSession, endSession } from '../src/auth.js';

test('creates initial admin, verifies session, allows removal of bootstrap password', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'lomi-test-'));
  const db = openDatabase(path.join(temp, 'auth.sqlite'));
  const oldEmail = process.env.ADMIN_EMAIL, oldPassword=process.env.ADMIN_PASSWORD;
  try {
    process.env.ADMIN_EMAIL='admin@example.org'; process.env.ADMIN_PASSWORD='a-strong-example-test-password-2026';
    provisionAdmin(db);
    const user = db.prepare('SELECT * FROM admin_users').get();
    assert.ok(user);
    assert.equal(verifyPassword(process.env.ADMIN_PASSWORD, user.password_hash),true);
    assert.equal(verifyPassword('wrong',user.password_hash),false);
    const response = {headers:{},setHeader(key,value){this.headers[key]=value;}};
    const csrf = createSession(db,user.id,response);
    assert.ok(csrf.length >= 40);
    const req={headers:{cookie:response.headers['Set-Cookie'].split(';')[0]}};
    assert.equal(findSession(db,req).user_id,user.id);
    endSession(db,req,response);
    assert.equal(findSession(db,req),null);
    delete process.env.ADMIN_PASSWORD;
    provisionAdmin(db); // must not throw after initial user creation
  } finally {
    if(oldEmail===undefined)delete process.env.ADMIN_EMAIL;else process.env.ADMIN_EMAIL=oldEmail;
    if(oldPassword===undefined)delete process.env.ADMIN_PASSWORD;else process.env.ADMIN_PASSWORD=oldPassword;
    db.close();fs.rmSync(temp,{recursive:true,force:true});
  }
});
