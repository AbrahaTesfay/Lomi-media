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
  const deliveries=[],verificationDeliveries=[];
  let server;
  try {
    provisionAdmin(db);
    const app=express();app.use(express.json());
    app.use('/api/account',createAccountRouter(db,{
      sendResetEmail:async options=>deliveries.push(options),
      sendVerificationEmail:async options=>verificationDeliveries.push(options),
    }));
    server=await new Promise(resolve=>{const srv=app.listen(0,'127.0.0.1',()=>resolve(srv));});
    const url=`http://127.0.0.1:${server.address().port}`;
    await operation({db,url,deliveries,verificationDeliveries});
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
function tokenFrom(delivery) {
  const url=new URL(delivery.link);
  const token=url.searchParams.get('token');
  assert.match(token,/^[a-f0-9]{64}$/);
  return token;
}
const regularSignup={name:'Visitor Example',email:'visitor@example.org',password:'valid-regular-user-passphrase',consent:true};

test('signup requires consent and verified email; only existing admins receive admin access',async()=>{
 await withServer(async({url,db,verificationDeliveries})=>{
  const unauthed=await call(url,'/api/account/me');assert.equal(unauthed.status,401);
  const noConsent=await call(url,'/api/account/signup',{...regularSignup,consent:false});
  assert.equal(noConsent.status,400);
  const registered=await call(url,'/api/account/signup',regularSignup);
  assert.equal(registered.status,201);assert.ok(registered.body.message);
  assert.equal(db.prepare('SELECT verification_required FROM member_users WHERE email=?').get(regularSignup.email).verification_required,1);
  assert.equal(verificationDeliveries.length,1);
  const unverified=await call(url,'/api/account/login',{email:regularSignup.email,password:regularSignup.password});
  assert.equal(unverified.status,403);
  const token=tokenFrom(verificationDeliveries[0]);
  assert.equal((await call(url,'/api/account/email/verify',{token})).status,200);
  assert.equal((await call(url,'/api/account/email/verify',{token})).status,400);
  const registeredLogin=await call(url,'/api/account/login',{email:regularSignup.email,password:regularSignup.password});
  assert.equal(registeredLogin.status,200);assert.equal(registeredLogin.body.role,'user');
  const cookie=registeredLogin.cookie.match(/lomi_member=[a-f0-9]{64}/)?.[0];assert.ok(cookie);
  const me=await call(url,'/api/account/me',undefined,cookie);assert.equal(me.body.role,'user');
  const blocked=await call(url,'/api/account/signup',{...regularSignup,email:exampleAdmin});
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

test('email confirmation expires and can be resent; regular user cannot sign in until confirmed',async()=>{
 await withServer(async({url,db,verificationDeliveries})=>{
  assert.equal((await call(url,'/api/account/signup',regularSignup)).status,201);
  const expiredToken=tokenFrom(verificationDeliveries[0]);
  db.prepare('UPDATE email_verification_tokens SET expires_at=?').run(Date.now()-1000);
  assert.equal((await call(url,'/api/account/email/verify',{token:expiredToken})).status,400);
  const resend=await call(url,'/api/account/email/resend',{email:regularSignup.email});
  assert.equal(resend.status,200);
  assert.equal(verificationDeliveries.length,2);
  const token=tokenFrom(verificationDeliveries[1]);
  assert.equal((await call(url,'/api/account/email/verify',{token})).status,200);
  assert.equal((await call(url,'/api/account/login',{email:regularSignup.email,password:regularSignup.password})).status,200);
 });
});

test('password reset tokens are single-use and revoke active member sessions',async()=>{
 await withServer(async({url,deliveries,verificationDeliveries})=>{
  assert.equal((await call(url,'/api/account/signup',regularSignup)).status,201);
  assert.equal((await call(url,'/api/account/email/verify',{token:tokenFrom(verificationDeliveries[0])})).status,200);
  const user=await call(url,'/api/account/login',{email:regularSignup.email,password:regularSignup.password});
  assert.equal(user.status,200);
  const cookie=user.cookie.match(/lomi_member=[a-f0-9]{64}/)?.[0];assert.ok(cookie);
  const forgot=await call(url,'/api/account/password/forgot',{email:regularSignup.email});
  assert.equal(forgot.status,200);assert.equal(deliveries.length,1);
  const token=tokenFrom(deliveries[0]);
  assert.equal((await call(url,'/api/account/password/reset',{token,password:'another-strong-member-password'})).status,200);
  assert.equal((await call(url,'/api/account/password/reset',{token,password:'yet-another-member-password'})).status,400);
  assert.equal((await call(url,'/api/account/me',undefined,cookie)).status,401);
  assert.equal((await call(url,'/api/account/login',{email:regularSignup.email,password:regularSignup.password})).status,401);
  assert.equal((await call(url,'/api/account/login',{email:regularSignup.email,password:'another-strong-member-password'})).status,200);
 });
});

test('old accounts remain accessible after compatible database migration',async()=>{
 await withServer(async({url,db})=>{
  const {randomBytes,scryptSync}=await import('node:crypto');
  const salt=randomBytes(16).toString('hex');
  const legacyPassword='an-existing-account-password-2026';
  const derived=scryptSync(legacyPassword,Buffer.from(salt,'hex'),64).toString('hex');
  db.prepare('INSERT INTO member_users(name,email,password_hash) VALUES (?,?,?)')
    .run('Legacy user','existing@example.org',`${salt}:${derived}`);
  const result=await call(url,'/api/account/login',{email:'existing@example.org',password:legacyPassword});
  assert.equal(result.status,200);assert.equal(result.body.role,'user');
 });
});
