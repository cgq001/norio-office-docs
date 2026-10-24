import http from 'node:http';
import fs from 'node:fs/promises';
import { watch } from 'node:fs';
import path from 'node:path';
import { build } from './build.mjs';

await build();
const root=path.resolve('dist');
const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8','.png':'image/png'};
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    let relative=decodeURIComponent(url.pathname).replace(/^[/\\]+/,'');
    let target=path.resolve(root,relative);
    if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
    let stat=await fs.stat(target).catch(()=>null);
    if(stat?.isDirectory()){
      if(!url.pathname.endsWith('/')){res.writeHead(301,{Location:url.pathname+'/'+url.search});res.end();return;}
      target=path.join(target,'index.html');stat=await fs.stat(target).catch(()=>null);
    }
    const found=stat?.isFile();
    if(!found)target=path.join(root,'404.html');
    const content=await fs.readFile(target);
    res.writeHead(found?200:404,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'"});
    res.end(req.method==='HEAD'?undefined:content);
  }catch{res.writeHead(400);res.end('Bad request');}
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
if(process.argv.includes('--watch')){
  let timer,running=false,queued=false;
  async function rebuild(){
    if(running){queued=true;return;}
    running=true;
    try{await build();}catch(error){console.error('Build failed:',error.message);}
    finally{running=false;if(queued){queued=false;await rebuild();}}
  }
  for(const directory of ['content','src','public'])watch(directory,{recursive:true},()=>{clearTimeout(timer);timer=setTimeout(rebuild,180);});
  console.log('Watching content/, src/, public/. Refresh the browser after edits.');
}
