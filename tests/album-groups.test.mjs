import test from 'node:test';
import assert from 'node:assert/strict';
import {groupAlbumPhotos,normalizeCatalog} from '../frontend/src/lib/catalog.ts';

test('home collections sort newest shoots first, with stable natural ties and undated work last',()=>{
 const album=(id,dates)=>({id,name:id,photos:dates.map((capturedAt,i)=>({id:String(i),url:'https://example.com/photo.webp',capturedAt}))});
 const collections=[album('Undated',[]),album('Camping',['2026-05-11']),album('Session 10',['2026-09-01']),album('Portraits',['2026-09-30','2026-10-02']),album('Session 2',['2026-09-01']),{id:'older',name:'Older',photos:[{id:'old',url:'https://example.com/old.webp',date:'September 2025'}]},album('Unknown',['not a date'])];
 const before=JSON.stringify(collections);
 assert.deepEqual(normalizeCatalog({collections}).map(c=>c.name),['Portraits','Session 2','Session 10','Camping','Older','Unknown']);
 assert.equal(JSON.stringify(collections),before);
});

test('section groups follow published order without losing photos or changing the catalog',()=>{
  const photos=[{id:'flower',section:'Flowers',displayOrder:2},{id:'hike-b',section:'Hike',displayOrder:1},{id:'hike-a',section:'Hike',displayOrder:0},{id:'night',section:'Stars',displayOrder:3}];
  const before=JSON.stringify(photos),groups=groupAlbumPhotos(photos);
  assert.deepEqual(groups.map(g=>g.name),['Hike','Flowers','Stars']);
  assert.deepEqual(groups.flatMap(g=>g.photos.map(p=>p.id)),['hike-a','hike-b','flower','night']);
  assert.equal(JSON.stringify(photos),before);
});

test('new sections appear automatically and albums without sections remain one group',()=>{
  assert.deepEqual(groupAlbumPhotos([{id:'a'},{id:'b',section:' '}]).map(g=>[g.name,g.photos.length]),[['',2]]);
  assert.deepEqual(groupAlbumPhotos([{id:'a',section:'Hike'},{id:'b',section:'New adventures'}]).map(g=>g.name),['Hike','New adventures']);
  assert.deepEqual(groupAlbumPhotos([]),[]);
});
