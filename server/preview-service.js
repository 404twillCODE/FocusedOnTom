// Bounded processed-image cache with concurrent request coalescing.
// Validate catalog membership before cache access so removed photos fail closed.
const MAX_BYTES=18*1024*1024;
export function createPreviewService({getCatalog,transform,fetcher=fetch,clock=Date.now,maxCacheBytes=32*1024*1024,ttl=60_000}) {
 const cached=new Map(),pending=new Map();let cacheBytes=0;
 async function render(record,size){
  const upstream=await fetcher(record.source,{redirect:'error',signal:AbortSignal.timeout(15_000)});
  if(!upstream.ok||!upstream.body||!/^image\/(jpeg|png|webp|avif)/i.test(upstream.headers.get('content-type')||''))throw Error('Invalid preview');
  if(Number(upstream.headers.get('content-length'))>MAX_BYTES)throw Error('Preview too large');
  const reader=upstream.body.getReader(),chunks=[];let length=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>MAX_BYTES)throw Error('Preview too large');chunks.push(value)}}finally{await reader.cancel().catch(()=>{})}
  return transform(Buffer.concat(chunks),size);
 }
 return async function preview(id,size){
  const catalog=await getCatalog(),record=catalog.records.get(id);
  if(!record)return null;
  const key=[id,record.revision,size,'wordmark-v2'].join(':');
  const hit=cached.get(key);
  if(hit&&hit.expires>clock()){cached.delete(key);cached.set(key,hit);return hit.bytes}
  if(hit){cacheBytes-=hit.bytes.length;cached.delete(key)}
  if(!pending.has(key))pending.set(key,render(record,size).then(bytes=>{
   if(bytes.length<=maxCacheBytes){
    while(cacheBytes+bytes.length>maxCacheBytes&&cached.size){const oldest=cached.keys().next().value;cacheBytes-=cached.get(oldest).bytes.length;cached.delete(oldest)}
    cached.set(key,{bytes,expires:clock()+ttl});cacheBytes+=bytes.length;
   }
   return bytes;
  }).finally(()=>pending.delete(key)));
  return pending.get(key);
 };
}
