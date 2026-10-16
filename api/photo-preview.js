import {getLibrary} from '../server/photo-library.js';
import {watermarkedPreview} from '../server/watermark.js';
const MAX_BYTES=18*1024*1024;
export async function GET(request) {
  const params=new URL(request.url).searchParams,id=params.get('id'),size=params.get('size');
  if(!id||!/^[a-zA-Z0-9_-]{1,100}$/.test(id)||!['thumb','large'].includes(size))return new Response('Not found',{status:404});
  try {
    const catalog=await getLibrary(),record=catalog.records.get(id);
    if(!record)return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
    const upstream=await fetch(record.source,{redirect:'error',signal:AbortSignal.timeout(15_000)});
    if(!upstream.ok||!upstream.body||!/^image\/(jpeg|png|webp|avif)/i.test(upstream.headers.get('content-type')||''))throw Error('Invalid preview');
    if(Number(upstream.headers.get('content-length'))>MAX_BYTES)throw Error('Preview too large');
    const reader=upstream.body.getReader(),chunks=[];let length=0;
    try {for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>MAX_BYTES)throw Error('Preview too large');chunks.push(value);}}
    finally {await reader.cancel().catch(()=>{});}
    const image=await watermarkedPreview(Buffer.concat(chunks),size);
    return new Response(image,{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=60, s-maxage=60','X-Content-Type-Options':'nosniff','Content-Disposition':'inline; filename="watermarked-preview.webp"'}});
  }catch {return new Response('Preview temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
}
