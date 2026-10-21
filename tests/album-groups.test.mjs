import test from 'node:test';
import assert from 'node:assert/strict';
import {groupAlbumPhotos} from '../new-site/album-groups.js';

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
