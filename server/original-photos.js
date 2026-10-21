import {readFile} from 'node:fs/promises';
import {S3Client,ListObjectsV2Command} from '@aws-sdk/client-s3';
import sharp from 'sharp';

const PREFIX='private/originals/tom/';
const CDN='https://cdn.tevisuals.com/';
const snapshot=()=>readFile(new URL('./tom-original-objects.json',import.meta.url),'utf8').then(JSON.parse);
let originalClient;
export function originalsConfigured(){return ['FOT_R2_ACCOUNT_ID','FOT_R2_ACCESS_KEY_ID','FOT_R2_SECRET_ACCESS_KEY'].every(key=>process.env[key]?.trim())}

export async function listTomOriginals(){
  if(!originalsConfigured())return {keys:await snapshot(),live:false};
  const client=originalClient??=new S3Client({region:'auto',endpoint:`https://${process.env.FOT_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,forcePathStyle:true,credentials:{accessKeyId:process.env.FOT_R2_ACCESS_KEY_ID,secretAccessKey:process.env.FOT_R2_SECRET_ACCESS_KEY}});
  const keys=[];let token;
  do{
    const page=await client.send(new ListObjectsV2Command({Bucket:process.env.FOT_R2_BUCKET||'tevisuals',Prefix:PREFIX,ContinuationToken:token}));
    for(const object of page.Contents||[])if(object.Key?.startsWith(PREFIX)&&/\.(jpe?g|png|webp|avif)$/i.test(object.Key))keys.push(object.Key);
    token=page.IsTruncated?page.NextContinuationToken:undefined;
  }while(token);
  return {keys,live:true};
}

export function originalCaptureTime(exif){
  if(!exif||exif.length<14)return null;
  const start=exif.subarray(0,6).toString()==='Exif\0\0'?6:0;
  const little=exif.toString('ascii',start,start+2)==='II';
  const u16=offset=>little?exif.readUInt16LE(offset):exif.readUInt16BE(offset);
  const u32=offset=>little?exif.readUInt32LE(offset):exif.readUInt32BE(offset);
  function visit(relative,depth=0){
    const offset=start+relative;if(depth>2||offset+2>exif.length)return null;
    const count=u16(offset);let fallback=null;
    for(let i=0;i<Math.min(count,512);i++){
      const entry=offset+2+i*12;if(entry+12>exif.length)break;
      const tag=u16(entry),type=u16(entry+2),length=u32(entry+4);
      if(tag===0x8769){const found=visit(u32(entry+8),depth+1);if(found)return found}
      if([0x9003,0x9004,0x0132].includes(tag)&&type===2){
        const pos=length<=4?entry+8:start+u32(entry+8);
        const value=exif.toString('ascii',pos,Math.min(exif.length,pos+length)).replace(/\0/g,'');
        if(/^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(value)){
          const date=value.replace(/^(\d{4}):(\d{2}):(\d{2}) /,'$1-$2-$3T');
          if(tag===0x9003)return date;fallback=date;
        }
      }
    }
    return fallback;
  }
  try{return visit(u32(start+4))}catch{return null}
}

const metadataCache=new Map();
const knownMetadata=readFile(new URL('../new-site/catalog.json',import.meta.url),'utf8').then(JSON.parse).then(catalog=>new Map(['cloudflare-original','cloudflare-webp'].includes(catalog.imageDelivery)?catalog.collections.flatMap(collection=>collection.photos.map(photo=>[photo.originalUrl||photo.url,{width:photo.originalWidth||photo.width,height:photo.originalHeight||photo.height,capturedAt:photo.capturedAt?.slice(0,19)}])):[])).catch(()=>new Map());
function jpegHeader(bytes){
  if(bytes.readUInt16BE(0)!==0xffd8)return null;
  let offset=2,exif,dimensions;
  while(offset+4<bytes.length){
    if(bytes[offset++]!==0xff)break;
    while(bytes[offset]===0xff)offset++;
    const marker=bytes[offset++];
    if(marker===0xda||marker===0xd9)break;
    const length=bytes.readUInt16BE(offset);
    if(length<2||offset+length>bytes.length)break;
    if(marker===0xe1&&bytes.toString('ascii',offset+2,offset+8)==='Exif\0\0')exif=bytes.subarray(offset+2,offset+length);
    if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))dimensions={height:bytes.readUInt16BE(offset+3),width:bytes.readUInt16BE(offset+5)};
    offset+=length;
  }
  return dimensions?{...dimensions,capturedAt:originalCaptureTime(exif)}:null;
}
export function originalMetadata(url){
  if(!metadataCache.has(url))metadataCache.set(url,(async()=>{
    const known=(await knownMetadata).get(url);if(known?.width&&known.height)return known;
    for(const length of [65536,262144,1048576]){
      const response=await fetch(url,{headers:{Range:`bytes=0-${length-1}`},redirect:'error',signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw Error('Original image unavailable.');
      const reader=response.body.getReader(),chunks=[];let received=0;
      try{while(received<length){const part=await reader.read();if(part.done)break;chunks.push(part.value);received+=part.value.length}}finally{await reader.cancel().catch(()=>{})}
      const bytes=Buffer.concat(chunks).subarray(0,length);
      const jpeg=jpegHeader(bytes);if(jpeg)return jpeg;
      try{
        const info=await sharp(bytes,{failOn:'none'}).metadata();
        if(info.width&&info.height){const rotated=[5,6,7,8].includes(info.orientation);return {width:rotated?info.height:info.width,height:rotated?info.width:info.height,capturedAt:originalCaptureTime(info.exif)}}
      }catch{}
    }
    throw Error(`Could not read original image dimensions: ${url}`);
  })().catch(error=>{metadataCache.delete(url);throw error}));
  return metadataCache.get(url);
}

export async function originalSourcesForCatalog(catalog,keys,getMetadata=originalMetadata){
  const byName=new Map();
  for(const key of keys){
    if(!key.startsWith(PREFIX)||key.includes('..'))continue;
    const relative=key.slice(PREFIX.length),parts=relative.split('/');
    const name=parts.pop().replace(/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}-/i,'');
    const match=[...parts,name].join('/').toLowerCase();
    if(!byName.has(match))byName.set(match,[]);
    byName.get(match).push(key);
  }
  const sources=new Map();
  const tasks=[];
  for(const collection of catalog.collections){
    const gallery=new URL(collection.sourceUrl).pathname.replace(/^\/portfolio\//,'');
    for(const photo of collection.photos){
      tasks.push(async()=>{
        const candidates=byName.get(`${gallery}/${photo.name}`.toLowerCase());
        if(!candidates)throw Error(`Original missing for ${collection.name}: ${photo.name}`);
        const options=await Promise.all(candidates.map(async key=>{const url=CDN+key.split('/').map(encodeURIComponent).join('/');return {url,...await getMetadata(url)}}));
        const matches=options.length===1?options:options.filter(option=>option.capturedAt&&option.capturedAt===photo.capturedAt?.slice(0,19));
        if(matches.length!==1)throw Error(`Ambiguous original for ${collection.name}: ${photo.name}`);
        sources.set(photo.id,matches[0]);
      });
    }
  }
  let cursor=0;
  await Promise.all(Array.from({length:6},async()=>{while(cursor<tasks.length)await tasks[cursor++]()}));
  return sources;
}
