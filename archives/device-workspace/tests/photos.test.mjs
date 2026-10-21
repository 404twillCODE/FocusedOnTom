import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {makeCatalog,createLibrary,previewSource} from '../server/photo-library.js';
import {watermarkedPreview} from '../server/watermark.js';
const row={photoId:'photo-1',galleryId:'gallery-1',galleryTitle:'Camping',gallerySlug:'camping',category:'nature',photographer:'tom',filename:'DSC.jpg',publicUrl:'https://cdn.tevisuals.com/public/portfolio/nature/camping/photo.webp',techCaption:'Sony A6400 • 17-70mm • 1/125s • f/2.8 • ISO 100',width:2400,height:1600,capturedAt:'2026-05-02T10:00:00Z',createdAt:'2026-05-02T10:00:00Z',displayOrder:1,coverPhotoId:'photo-1',prices:{personalCents:500,commercialCents:2500,currency:'usd'}};
const page=(photos,hasMore=false,nextCursor=null)=>Response.json({photos,pageInfo:{hasMore,nextCursor},generatedAt:'2026-10-15'});
test('only Tom previews are public, with details and exact-photo purchase links',()=>{
 const catalog=makeCatalog([row,{...row,photoId:'eric',photographer:'eric'},{...row,photoId:'private',publicUrl:'https://cdn.tevisuals.com/private/original.jpg'}],'now');
 assert.equal(catalog.records.size,1);const p=catalog.public.collections[0].photos[0];
 assert.equal(p.camera,'Sony A6400');assert.match(p.settings,/ISO 100/);assert.equal(new URL(p.buyUrl).searchParams.get('photo'),'photo-1');assert.equal(new URL(p.buyUrl).searchParams.get('buy'),'personal');
 assert.match(p.url,/^\/api\/photo-preview/);assert.equal(JSON.stringify(catalog.public).includes('cdn.tevisuals.com'),false);
 assert.equal(previewSource({...row,publicUrl:'https://evil.test/image.jpg',proxyUrl:'http://127.0.0.1/secret'}),null);
});
test('all pages are fetched and cache refresh discovers uploads and removals',async()=>{
 let now=0,calls=0,updated=false;
 const get=createLibrary({clock:()=>now,getKey:()=> 'test-key',fetcher:async(url,options)=>{calls++;assert.equal(options.headers.Authorization,'Bearer test-key');if(updated)return page([{...row,photoId:'new-photo'}]);return url.searchParams.has('cursor')?page([{...row,photoId:'photo-2'}]):page([row],true,'second');}});
 assert.equal((await get()).records.size,2);assert.equal(calls,2);await get();assert.equal(calls,2);
 now=61_000;updated=true;const fresh=await get();assert.equal(fresh.records.has('new-photo'),true);assert.equal(fresh.records.has('photo-1'),false);
});
test('authentication failure fails closed rather than serving expired cached metadata',async()=>{
 let now=0,fail=false;const get=createLibrary({clock:()=>now,getKey:()=> 'test-key',fetcher:async()=>fail?new Response('',{status:401}):page([row])});
 await get();now=61_000;fail=true;await assert.rejects(get());
});
test('invalid repeated pagination cursor is rejected',async()=>{
 const get=createLibrary({getKey:()=> 'test-key',fetcher:async()=>page([row],true,'repeat')});await assert.rejects(get());
});
test('preview pixels contain watermark, shrink dimensions, and strip metadata',async()=>{
 const source=await sharp({create:{width:2400,height:1600,channels:3,background:'#555555'}}).jpeg().toBuffer();
 const preview=await watermarkedPreview(source,'thumb'),metadata=await sharp(preview).metadata();
 assert.equal(metadata.width,720);assert.equal(metadata.height,480);assert.equal(metadata.exif,undefined);assert.equal(metadata.format,'webp');
 const pixels=await sharp(preview).raw().toBuffer();assert.ok(pixels.reduce((m,n)=>Math.max(m,n),0)-pixels.reduce((m,n)=>Math.min(m,n),255)>10);
});
