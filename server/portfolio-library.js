import {readFile} from 'node:fs/promises';
import {getLibrary,previewSource} from './photo-library.js';
import {listTomOriginals,originalSourcesForCatalog} from './original-photos.js';

const SOURCE='https://www.tevisuals.com';

// Read only the public, Tom-attributed image records rendered by the photo library.
export function publicPhotoSources(html){
  const sources=new Map();
  for(const script of html.matchAll(/self\.__next_f\.push\((\[[\s\S]*?\])\)<\/script>/g)){
    let payload;try{payload=JSON.parse(script[1])[1]}catch{continue}
    if(typeof payload!=='string')continue;
    for(const match of payload.matchAll(/\{"id":"[^"}]+","src":"[^"}]+"[^{}]*\}/g)){
      let photo;try{photo=JSON.parse(match[0])}catch{continue}
      const source=previewSource({publicUrl:photo.src});
      if(photo.attribution==='tom'&&source)sources.set(photo.id,{url:source,width:photo.width,height:photo.height});
    }
  }
  return sources;
}

export function cleanPortfolioCatalog(catalog,sources){
  const collections=catalog.collections.map(collection=>{
    const photos=collection.photos.map(photo=>{
      const source=sources.get(photo.id);
      if(!source)throw Error('A photograph has no clean public source.');
      return {...photo,url:source.url,thumbnailUrl:source.url,width:source.width||photo.width,height:source.height||photo.height,watermarkRequired:false};
    });
    const cover=photos.find(photo=>photo.id===collection.coverId)||photos[0];
    return {...collection,photos,totalPhotos:photos.length,coverUrl:cover.url};
  });
  return {...catalog,collections,imageDelivery:'published-source',watermarkRequired:false};
}

async function readJson(url){
  const response=await fetch(url,{signal:AbortSignal.timeout(20000),redirect:'error'});
  if(!response.ok)throw Error('Photo library unavailable.');
  return response.json();
}

async function refreshPublishedCatalog(){
  if(process.env.FOT_SYNC_API_KEY?.trim()){
    const library=await getLibrary();
    const sources=new Map([...library.records].map(([id,record])=>[id,{url:record.source,width:record.photo.width,height:record.photo.height}]));
    return cleanPortfolioCatalog(library.public,sources);
  }
  const catalog=await readJson('https://focusedontom.com/api/photos');
  const groups=await Promise.all(catalog.collections.map(async collection=>{
    const url=new URL(collection.sourceUrl);
    if(!['https://www.tevisuals.com','https://tevisuals.com'].includes(url.origin)||!url.pathname.startsWith('/portfolio/'))throw Error('Invalid gallery source.');
    const response=await fetch(new URL(url.pathname,SOURCE),{signal:AbortSignal.timeout(20000),redirect:'error'});
    if(!response.ok)throw Error('Gallery unavailable.');
    return publicPhotoSources(await response.text());
  }));
  return cleanPortfolioCatalog(catalog,new Map(groups.flatMap(group=>[...group])));
}

export async function refreshPortfolioCatalog(){
  const [catalog,originals]=await Promise.all([refreshPublishedCatalog(),listTomOriginals()]);
  const sources=await originalSourcesForCatalog(catalog,originals.keys);
  const result=catalog;
  for(const collection of result.collections)for(const photo of collection.photos){
    const original=sources.get(photo.id);
    photo.originalUrl=original.url;photo.originalWidth=original.width;photo.originalHeight=original.height;
  }
  // Display the CDN's compressed WebP exports; retain original references for sync.
  result.imageDelivery='cloudflare-webp';
  result.originalsSync=originals.live?'live':'verified-inventory';
  result.refreshAfterSeconds=15;
  return result;
}

let cached,expires=0,pending;
export async function getPortfolioCatalog(){
  if(cached&&Date.now()<expires)return cached;
  if(!pending)pending=refreshPortfolioCatalog().then(data=>{cached=data;expires=Date.now()+15000;return data}).catch(async()=>{
    // The bundled catalog also points to the unmodified public source files.
    const fallback=JSON.parse(await readFile(new URL('../new-site/catalog.json',import.meta.url),'utf8'));
    if(!['published-source','cloudflare-original','cloudflare-webp'].includes(fallback.imageDelivery))throw Error('Clean photo library unavailable.');
    return fallback;
  }).finally(()=>pending=null);
  return pending;
}
