import {getLibrary} from '../server/photo-library.js';
export async function GET() {
  try { const catalog=await getLibrary(); return Response.json(catalog.public,{headers:{'Cache-Control':'no-store'}}); }
  catch {return Response.json({error:'The photo library is temporarily unavailable. Please try again shortly.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
