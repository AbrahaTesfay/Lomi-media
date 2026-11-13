import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import express from 'express';
import { openDatabase, provisionAdmin } from '../src/database.js';
import { createAccountRouter } from '../src/account.js';

const exampleAdmin='admin-for-test@example.org';
const adminPassword='administrator-example-passphrase-2026';
async function withServer(operation) {
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'lomi-account-test-'));
  const db=openDatabase(path.join(folder,'accounts.sqlite'));
  const prevEmail=process.env.ADMIN_EMAIL,prevPass=process.env.ADMIN_PASSWORD;
  process.env.ADMIN_EMAIL=exampleAdmin;process.env.ADMIN_PASSWORD=adminPassword;
  const deliveries=[];
  let server;
  try {
    provisionAdmin(db);
    const app=express();app.use(express.json());
    app.use('/api/account',createAccountRouter(db,{sendResetEmail:async options=>deliveries.push(options)}));
    server=await new Promise(resolve=>{const srv=app.listen(0,'127.0.0.1',()=>resolve(srv));});
    const url=`http://127.0.0.1:${server.address().port}`;
    await operation({db,url,deliveries});
  } finally {
    if(server)await new Promise(resolve=>server.close(resolve));
    db.close();fs.rmSync(folder,{recursive:true,force:true});
    if(prevEmail===undefined)delete process.env.ADMIN_EMAIL;else process.env.ADMIN_EMAIL=prevEmail;
    if(prevPass===undefined)delete process.env.ADMIN_PASSWORD;else process.env.ADMIN_PASSWORD=prevPass;
  }
}
async function call(url,route,data,cookie='',csrf='') {
  const headers={...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(csrf?{'X-CSRF-Token':csrf}:{})};
  const response=await fetch(url+route,{method:data?'POST':'GET',headers,body:data?JSON.stringify(data):undefined});
  return {status:response.status,body:await response.json(),cookie:response.headers.get('set-cookie')||''};
}

test('signup stays regular user; admin role requires existing admin password',async()=>{
 await withServer(async({url})=>{
  const unauthed=await call(url,'/api/account/me');assert.equal(unauthed.status,401);
  const registered=await call(url,'/api/account/signup',{name:'Visitor Example',email:'visitor@example.org',password:'valid-regular-user-passphrase'});
  assert.equal(registered.status,201);assert.equal(registered.body.role,'user');
  const cookie=registered.cookie.match(/lomi_member=[a-f0-9]{64}/)?.[0];assert.ok(cookie);
  const me=await call(url,'/api/account/me',undefined,cookie);assert.equal(me.body.role,'user');
  const blocked=await call(url,'/api/account/signup',{name:'Fake Admin',email:exampleAdmin,password:'some-strong-password-2026'});
  assert.equal(blocked.status,409);
  const noAdmin=await call(url,'/api/account/login',{email:exampleAdmin,password:'wrong-password'});assert.equal(noAdmin.status,401);
  const admin=await call(url,'/api/account/login',{email:exampleAdmin,password:adminPassword});
  assert.equal(admin.status,200);assert.equal(admin.body.role,'admin');
  const adminCookie=admin.cookie.match(/lomi_admin=[a-f0-9]{64}/)?.[0];assert.ok(adminCookie);
  const adminMe=await call(url,'/api/account/me',undefined,adminCookie);assert.equal(adminMe.body.role,'admin');
  const wrongCsrf=await call(url,'/api/account/logout',{},adminCookie,'incorrect');assert.equal(wrongCsrf.status,403);
  const signedOut=await call(url,'/api/account/logout',{},adminCookie,admin.body.csrf);assert.equal(signedOut.status,200);
  assert.equal((await call(url,'/api/account/me',undefined,adminCookie)).status,401);
 });
});

test('email reset is single-use and revokes active member sessions',async()=>{
 await withServer(async({url,deliveries})=>{
  const user=await call(url,'/api/account/signup',{name:'Member Example',email:'member@example.org',password:'long-starting-member-password'});
  const cookie=user.cookie.match(/lomi_member=[a-f0-9]{64}/)?.[0];
  const forgot=await call(url,'/api/account/password/forgot',{email:'member@example.org'});
  assert.equal(forgot.status,200);assert.equal(deliveries.length,1);
  const link=new URL(deliveries[0].link);
  const token=link.searchParams.get('token');assert.ok(token);
  assert.equal((await call(url,'/api/account/password/reset',{token,password:'another-strong-member-password'})).status,200);
  assert.equal((await call(url,'/api/account/password/reset',{token,password:'yet-another-member-password'})).status,400);
  assert.equal((await call(url,'/api/account/me',undefined,cookie)).status,401);
  assert.equal((await call(url,'/api/account/login',{email:'member@example.org',password:'long-starting-member-password'})).status,401);
  assert.equal((await call(url,'/api/account/login',{email:'member@example.org',password:'another-strong-member-password'})).status,200);
 });
});
