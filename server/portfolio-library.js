import {getLibrary,previewSource} from './photo-library.js';

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

export async function refreshPortfolioCatalog(loadPublished=refreshPublishedCatalog){
  // Published WebP records are authoritative. Client-gallery publications need
  // not have a second, independently indexed original to appear here.
  const catalog=await loadPublished();
  return {...catalog,imageDelivery:'cloudflare-webp',refreshAfterSeconds:15};
}

let cached,expires=0,pending;
export async function getPortfolioCatalog(){
  if(cached&&Date.now()<expires)return cached;
  if(!pending)pending=refreshPortfolioCatalog().then(data=>{cached=data;expires=Date.now()+15000;return data}).finally(()=>pending=null);
  return pending;
}
