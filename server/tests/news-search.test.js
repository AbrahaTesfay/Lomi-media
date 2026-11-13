import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase } from '../src/database.js';
import { createApp } from '../src/app.js';

test('public newsroom searches published articles only and uses safe literal text matching', async () => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'lomi-news-search-'));
  const db=openDatabase(path.join(directory,'test.sqlite'));
  let server;
  try {
    const insert=db.prepare('INSERT INTO articles(slug,title,excerpt,body,category,language,status) VALUES (?,?,?,?,?,?,?)');
    insert.run('world-camera','World Camera Story','Camera footage tells a new story','Original test article body for World','World','en','published');
    insert.run('world-draft','Secret camera plans','A confidential camera story','Original test article body for draft','World','en','draft');
    insert.run('africa-tech','Africa technology update','New technology news in Africa','Original test article body for Africa','Africa','en','published');
    insert.run('literal-percent','The 100% story','A percentage in a headline','Original test article body for percent','World','en','published');
    server=createApp(db).listen(0,'127.0.0.1');
    await new Promise((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject);});
    const origin=`http://127.0.0.1:${server.address().port}`;
    async function search(query) {
      const response=await fetch(origin+'/api/articles?'+query);
      assert.equal(response.status,200);
      return (await response.json()).items;
    }
    const camera=await search('q=camera');
    assert.deepEqual(camera.map(x=>x.slug),['world-camera']);
    const africa=await search('q=technology&category=Africa');
    assert.deepEqual(africa.map(x=>x.slug),['africa-tech']);
    assert.equal((await search('q=technology&category=World')).length,0);
    const percent=await search('q=%25');
    assert.deepEqual(percent.map(x=>x.slug),['literal-percent']);
    const empty=await search('q=missing');
    assert.equal(empty.length,0);
  } finally {
    if(server) await new Promise(resolve=>server.close(resolve));
    db.close();
    fs.rmSync(directory,{recursive:true,force:true});
  }
});
