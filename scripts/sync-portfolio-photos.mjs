import {readFile,writeFile} from 'node:fs/promises';
import {refreshPortfolioCatalog} from '../server/portfolio-library.js';
try{process.loadEnvFile('.env.photos.local')}catch(error){if(error.code!=='ENOENT')throw error}

const root=new URL('../new-site/',import.meta.url);
const catalog=await refreshPortfolioCatalog();
const selections=JSON.parse(await readFile(new URL('hero-selections.json',root),'utf8'));
let html=await readFile(new URL('index.html',root),'utf8');
for(const selection of selections){
  const photo=catalog.collections.find(collection=>collection.id===selection.id)?.photos.find(photo=>photo.id===selection.coverPhotoId);
  if(!photo)throw Error(`Selected hero photograph missing: ${selection.name}`);
  html=html.replaceAll(selection.coverUrl,photo.url);
  selection.coverUrl=photo.url;
}
await writeFile(new URL('catalog.json',root),JSON.stringify(catalog,null,2)+'\n');
await writeFile(new URL('hero-selections.json',root),JSON.stringify(selections,null,2)+'\n');
await writeFile(new URL('index.html',root),html);
console.log(`Updated ${catalog.collections.length} albums and ${catalog.collections.reduce((count,collection)=>count+collection.photos.length,0)} clean source photographs.`);
