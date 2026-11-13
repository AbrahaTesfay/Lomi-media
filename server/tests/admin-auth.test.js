import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { openDatabase, provisionAdmin } from '../src/database.js';
import { verifyPassword, createSession, findSession, endSession } from '../src/auth.js';
import { createApp } from '../src/app.js';

async function startApp(db) {
  const server = createApp(db).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

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
    const expiredResponse={headers:{},setHeader(key,value){this.headers[key]=value;}};
    createSession(db,user.id,expiredResponse);
    const expiredReq={headers:{cookie:expiredResponse.headers['Set-Cookie'].split(';')[0]}};
    db.prepare('UPDATE admin_sessions SET expires_at=?').run(Date.now()-1);
    assert.equal(findSession(db,expiredReq),null);
    process.env.ADMIN_EMAIL='another-admin@example.org';
    process.env.ADMIN_PASSWORD='a-different-strong-test-password';
    provisionAdmin(db);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM admin_users').get().count,1);
    assert.equal(db.prepare('SELECT email FROM admin_users').get().email,'admin@example.org');
    assert.equal(db.prepare('SELECT password_hash FROM admin_users').get().password_hash,user.password_hash);
  } finally {
    restoreEnv('ADMIN_EMAIL',oldEmail);
    restoreEnv('ADMIN_PASSWORD',oldPassword);
    db.close();fs.rmSync(temp,{recursive:true,force:true});
  }
});

test('rejects invalid or unusable administrator bootstrap credentials', () => {
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'lomi-bootstrap-invalid-'));
  const db=openDatabase(path.join(temp,'auth.sqlite'));
  const oldEmail=process.env.ADMIN_EMAIL, oldPassword=process.env.ADMIN_PASSWORD;
  try {
    process.env.ADMIN_EMAIL='not-an-email';
    process.env.ADMIN_PASSWORD='a-strong-example-test-password-2026';
    assert.throws(()=>provisionAdmin(db),/valid ADMIN_EMAIL/);
    process.env.ADMIN_EMAIL='admin@example.org';
    process.env.ADMIN_PASSWORD='x'.repeat(501);
    assert.throws(()=>provisionAdmin(db),/12 and 500 characters/);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM admin_users').get().count,0);
  } finally {
    restoreEnv('ADMIN_EMAIL',oldEmail);
    restoreEnv('ADMIN_PASSWORD',oldPassword);
    db.close();
    fs.rmSync(temp,{recursive:true,force:true});
  }
});

test('uses Secure host cookies when running in production mode', async () => {
  const oldNodeEnv=process.env.NODE_ENV;
  try {
    process.env.NODE_ENV='production';
    const {createSession}=await import('../src/auth.js?production-cookie-test');
    const response={headers:{},setHeader(key,value){this.headers[key]=value;}};
    createSession({prepare:()=>({run(){}})},1,response);
    const cookie=response.headers['Set-Cookie'];
    assert.match(cookie,/^__Host-lomi_admin=/);
    assert.match(cookie,/; Secure/);
    assert.match(cookie,/; HttpOnly/);
    assert.doesNotMatch(cookie,/Domain=/);
  } finally {
    restoreEnv('NODE_ENV',oldNodeEnv);
  }
});

test('protects admin endpoints with login, session, CSRF, and logout checks', async () => {
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'lomi-api-auth-'));
  const db=openDatabase(path.join(temp,'auth.sqlite'));
  const oldEmail=process.env.ADMIN_EMAIL, oldPassword=process.env.ADMIN_PASSWORD;
  let server;
  try {
    process.env.ADMIN_EMAIL='admin@example.org';
    process.env.ADMIN_PASSWORD='a-strong-example-test-password-2026';
    provisionAdmin(db);
    ({server}=await startApp(db));
    const baseUrl=`http://127.0.0.1:${server.address().port}`;

    const denied=await fetch(`${baseUrl}/api/admin/overview`);
    assert.equal(denied.status,401);
    const deniedWrite=await fetch(`${baseUrl}/api/admin/articles`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({title:'Example article',excerpt:'A valid article summary for tests.',body:'A sufficiently long article body for the authentication integration test.',category:'World',language:'en',status:'draft'}),
    });
    assert.equal(deniedWrite.status,401);

    const invalid=await fetch(`${baseUrl}/api/admin/login`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:'admin@example.org',password:'incorrect-password'}),
    });
    assert.equal(invalid.status,401);

    const login=await fetch(`${baseUrl}/api/admin/login`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:' ADMIN@EXAMPLE.ORG ',password:process.env.ADMIN_PASSWORD}),
    });
    assert.equal(login.status,200);
    const cookieHeader=login.headers.get('set-cookie');
    assert.ok(cookieHeader);
    assert.match(cookieHeader,/HttpOnly/);
    assert.match(cookieHeader,/SameSite=Strict/);
    assert.match(cookieHeader,/Path=\//);
    assert.match(cookieHeader,/Max-Age=14400/);
    if(process.env.NODE_ENV==='production') assert.match(cookieHeader,/Secure/);
    const cookie=cookieHeader.split(';',1)[0];
    const {csrf}=await login.json();
    assert.ok(csrf);

    const me=await fetch(`${baseUrl}/api/admin/me`,{headers:{Cookie:cookie}});
    assert.equal(me.status,200);
    assert.equal((await me.json()).email,'admin@example.org');

    const badCsrf=await fetch(`${baseUrl}/api/admin/logout`,{
      method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},
      body:'{}',
    });
    assert.equal(badCsrf.status,403);

    const validCsrf=await fetch(`${baseUrl}/api/admin/articles`,{
      method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json','X-CSRF-Token':csrf},
      body:JSON.stringify({title:'Example article',excerpt:'A valid article summary for tests.',body:'A sufficiently long article body for the authentication integration test.',category:'World',language:'en',status:'draft'}),
    });
    assert.equal(validCsrf.status,201);

    const logout=await fetch(`${baseUrl}/api/admin/logout`,{
      method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json','X-CSRF-Token':csrf},
      body:'{}',
    });
    assert.equal(logout.status,200);
    assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
    const afterLogout=await fetch(`${baseUrl}/api/admin/me`,{headers:{Cookie:cookie}});
    assert.equal(afterLogout.status,401);
  } finally {
    restoreEnv('ADMIN_EMAIL',oldEmail);
    restoreEnv('ADMIN_PASSWORD',oldPassword);
    if(server) await new Promise(resolve=>server.close(resolve));
    db.close();
    fs.rmSync(temp,{recursive:true,force:true});
  }
});

test('limits repeated administrator login attempts', async () => {
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'lomi-api-limit-'));
  const db=openDatabase(path.join(temp,'auth.sqlite'));
  let server;
  try {
    ({server}=await startApp(db));
    const baseUrl=`http://127.0.0.1:${server.address().port}`;
    for(let i=0;i<8;i++){
      const response=await fetch(`${baseUrl}/api/admin/login`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:'nobody@example.org',password:'not-the-password'}),
      });
      assert.equal(response.status,401);
    }
    const limited=await fetch(`${baseUrl}/api/admin/login`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:'nobody@example.org',password:'not-the-password'}),
    });
    assert.equal(limited.status,429);
  } finally {
    if(server) await new Promise(resolve=>server.close(resolve));
    db.close();
    fs.rmSync(temp,{recursive:true,force:true});
  }
});
