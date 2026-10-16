import test from 'node:test';
import assert from 'node:assert/strict';
import {createPreviewService} from '../server/preview-service.js';
test('concurrent preview requests share work, reuse cache, and expire',async()=>{
 let calls=0,renders=0,now=0;
 const records=new Map([['photo',{source:'https://cdn.tevisuals.com/public/portfolio/a.webp',revision:'1'}]]);
 const preview=createPreviewService({getCatalog:async()=>({records}),clock:()=>now,ttl:100,fetcher:async()=>{calls++;return new Response('image',{headers:{'Content-Type':'image/webp'}})},transform:async()=>{renders++;return Buffer.from('protected')}});
 await Promise.all([preview('photo','large'),preview('photo','large'),preview('photo','large')]);
 assert.equal(calls,1);assert.equal(renders,1);await preview('photo','large');assert.equal(calls,1);
 now=101;await preview('photo','large');assert.equal(calls,2);
 records.delete('photo');assert.equal(await preview('photo','large'),null);
});
test('cached pixels never bypass catalog authentication failures',async()=>{
 let revoked=false;
 const preview=createPreviewService({getCatalog:async()=>{if(revoked)throw Error('revoked');return {records:new Map([['p',{source:'https://cdn.tevisuals.com/public/portfolio/p.webp',revision:'1'}]])}},fetcher:async()=>new Response('image',{headers:{'Content-Type':'image/webp'}}),transform:async()=>Buffer.from('protected')});
 await preview('p','thumb');revoked=true;await assert.rejects(preview('p','thumb'),/revoked/);
});
test('preview cache respects its byte budget and rejects non-image responses',async()=>{
 let calls=0;
 const records=new Map(['a','b'].map(id=>[id,{source:'https://cdn.tevisuals.com/public/portfolio/'+id+'.webp',revision:'1'}]));
 const preview=createPreviewService({getCatalog:async()=>({records}),maxCacheBytes:5,fetcher:async()=>{calls++;return new Response('image',{headers:{'Content-Type':'image/webp'}})},transform:async()=>Buffer.from('four')});
 await preview('a','thumb');await preview('b','thumb');await preview('a','thumb');assert.equal(calls,3);
 const bad=createPreviewService({getCatalog:async()=>({records}),fetcher:async()=>new Response('html',{headers:{'Content-Type':'text/html'}}),transform:async()=>{throw Error('must not transform')}});
 await assert.rejects(bad('a','thumb'),/Invalid preview/);
});
