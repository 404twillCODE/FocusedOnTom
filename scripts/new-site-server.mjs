import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {GET as photos} from '../api/photos.js';
import {GET as preview} from '../api/photo-preview.js';
import {GET as portfolio} from '../api/portfolio-photos.js';

try{process.loadEnvFile('.env.photos.local')}catch(error){if(error.code!=='ENOENT')throw error}

const root=fileURLToPath(new URL('../new-site/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ttf':'font/ttf'};
const port=Number(process.env.PORT||3851);
const server=http.createServer(async(req,res)=>{
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end('Method not allowed');}
    const url=new URL(req.url,'http://localhost');let response;
    if(['/api/photos','/api/photo-preview','/api/portfolio-photos'].includes(url.pathname)){
      if(url.pathname==='/api/portfolio-photos')response=await portfolio();
      else if(process.env.FOT_SYNC_API_KEY?.trim())response=url.pathname==='/api/photos'?await photos():await preview(new Request(url));
      else{
        // Local development only: the existing public site serves its watermarked previews.
        // Production API handlers keep using the server-only TEVisuals integration.
        const upstream=new URL(url.pathname+url.search,'https://focusedontom.com');
        response=await fetch(upstream,{signal:AbortSignal.timeout(20000),redirect:'error'});
      }
      res.writeHead(response.status,{'Content-Type':response.headers.get('content-type')||'application/json','Cache-Control':'no-cache'});
      return res.end(req.method==='HEAD'?undefined:Buffer.from(await response.arrayBuffer()));
    }
    let pathname=decodeURIComponent(url.pathname);
    if(['/','/index.html','/photography','/projects','/about','/contact','/connect'].includes(pathname)||/^\/(photography|projects)\//.test(pathname))pathname='/index.html';
    if(pathname.split('/').some(part=>part.startsWith('.'))){res.writeHead(404);return res.end('Not found');}
    let filename=resolve(root,'.'+pathname);
    if(filename!==resolve(root)&&!filename.startsWith(resolve(root)+sep)){res.writeHead(404);return res.end('Not found');}
    if((await stat(filename)).isDirectory())filename=resolve(filename,'index.html');
    const data=await readFile(filename);res.writeHead(200,{'Content-Type':mime[extname(filename)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data);
  }catch(error){const api=req.url.startsWith('/api/');res.writeHead(api?503:404,{'Content-Type':api?'application/json':'text/plain'});res.end(api?JSON.stringify({error:'The live photo library is temporarily unavailable.'}):'Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`New portfolio ready at http://127.0.0.1:${port}`));
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is in use. Stop the other server or choose a different PORT.`:error.message);process.exitCode=1;});
