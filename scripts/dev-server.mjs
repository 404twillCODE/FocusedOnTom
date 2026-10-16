import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {GET as photos} from '../api/photos.js';
import {GET as preview} from '../api/photo-preview.js';
const root=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
 try {
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  const url=new URL(req.url,'http://localhost');let response;
  if(url.pathname==='/api/photos')response=await photos();
  else if(url.pathname==='/api/photo-preview')response=await preview(new Request(url));
  if(response){res.writeHead(response.status,Object.fromEntries(response.headers));return res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));}
  const path=decodeURIComponent(url.pathname),parts=path.split('/');
  if(parts.some(x=>x.startsWith('.'))||path==='/photos.json'){res.writeHead(404);return res.end();}
  let filename=resolve(root,'.'+path);
  if(!filename.startsWith(root+sep)&&filename!==root){res.writeHead(404);return res.end();}
  if((await stat(filename)).isDirectory())filename=resolve(filename,'index.html');
  const data=await readFile(filename);res.writeHead(200,{'Content-Type':mime[extname(filename)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data);
 }catch {res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT||3851),'127.0.0.1',()=>console.log('Portfolio ready at http://127.0.0.1:'+(process.env.PORT||3851)));
