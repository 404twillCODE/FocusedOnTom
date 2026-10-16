import {getLibrary} from '../server/photo-library.js';
import {watermarkedPreview} from '../server/watermark.js';
import {createPreviewService} from '../server/preview-service.js';
const preview=createPreviewService({getCatalog:getLibrary,transform:watermarkedPreview});
export async function GET(request) {
 const params=new URL(request.url).searchParams,id=params.get('id'),size=params.get('size');
 if(!id||!/^[a-zA-Z0-9_-]{1,100}$/.test(id)||!['thumb','large'].includes(size))return new Response('Not found',{status:404});
 try{
  const image=await preview(id,size);
  if(!image)return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
  return new Response(image,{headers:{'Content-Type':'image/webp','Cache-Control':'public, max-age=60, s-maxage=60','X-Content-Type-Options':'nosniff','Content-Disposition':'inline; filename="watermarked-preview.webp"'}});
 }catch{return new Response('Preview temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store'}})}
}
