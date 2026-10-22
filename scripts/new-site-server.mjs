// Compatibility entry for earlier local shortcuts. The active development server is Vite.
import {createServer} from 'vite';
const server=await createServer({server:{port:Number(process.env.PORT||3851)}});
await server.listen();
server.printUrls();
