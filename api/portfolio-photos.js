import {getPortfolioCatalog} from '../server/portfolio-library.js';
export async function GET(){
  try{return Response.json(await getPortfolioCatalog(),{headers:{'Cache-Control':'no-store'}})}
  catch{return Response.json({error:'The photo library is temporarily unavailable.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
