import test from 'node:test';
import assert from 'node:assert/strict';
import {publicPhotoSources,cleanPortfolioCatalog} from '../server/portfolio-library.js';
import {originalSourcesForCatalog} from '../server/original-photos.js';

test('only Tom photographs from the public image library become clean sources',()=>{
  const photo={id:'lake',src:'https://cdn.tevisuals.com/public/portfolio/nature/camping/lake.webp',filename:'lake.jpg',width:2400,height:1600,attribution:'tom'};
  const payload=JSON.stringify([1,JSON.stringify([photo,{...photo,id:'eric',attribution:'eric'},{...photo,id:'external',src:'https://example.com/private.jpg'}])]);
  const sources=publicPhotoSources(`<script>self.__next_f.push(${payload})</script>`);
  assert.equal(sources.size,1);assert.equal(sources.get('lake').url,photo.src);
});

test('original files with duplicate names are matched by capture time, with other owners excluded',async()=>{
  const prefix='private/originals/tom/automotive/shoot/';
  const first=prefix+'00000000-0000-0000-0000-000000000001-PIC.jpg';
  const second=prefix+'00000000-0000-0000-0000-000000000002-PIC.jpg';
  const catalog={collections:[{sourceUrl:'https://www.tevisuals.com/portfolio/automotive/shoot',photos:[{id:'earlier',name:'PIC.jpg',capturedAt:'2026-04-28T19:27:41-04:00'},{id:'later',name:'PIC.jpg',capturedAt:'2026-04-28T21:21:15-04:00'}]}]};
  const sources=await originalSourcesForCatalog(catalog,[first,second,'private/originals/eric/automotive/shoot/PIC.jpg'],async url=>({width:6000,height:4000,capturedAt:url.includes('000000000001')?'2026-04-28T19:27:41':'2026-04-28T21:21:15'}));
  assert.ok(sources.get('earlier').url.endsWith(first));
  assert.ok(sources.get('later').url.endsWith(second));
  assert.equal(sources.get('later').width,6000);
  await assert.rejects(originalSourcesForCatalog(catalog,[first,second],async()=>({capturedAt:null})),/Ambiguous original/);
});

test('every image and album cover uses the unmodified source, with metadata preserved',()=>{
  const photo={id:'lake',url:'/api/photo-preview?id=lake',width:1600,height:1067,techCaption:'Sony',watermarkRequired:true};
  const source={url:'https://cdn.tevisuals.com/public/portfolio/nature/camping/lake.webp',width:2400,height:1600};
  const catalog={collections:[{id:'camping',coverId:'lake',photos:[photo]}]};
  const result=cleanPortfolioCatalog(catalog,new Map([['lake',source]]));
  assert.equal(result.collections[0].coverUrl,source.url);
  assert.equal(result.collections[0].photos[0].thumbnailUrl,source.url);
  assert.equal(result.collections[0].photos[0].width,2400);
  assert.equal(result.collections[0].photos[0].techCaption,'Sony');
  assert.equal(result.collections[0].photos[0].watermarkRequired,false);
  assert.throws(()=>cleanPortfolioCatalog(catalog,new Map()),/no clean public source/);
});
