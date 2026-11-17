const {chromium}=require('playwright');const fs=require('fs');const {spawn}=require('child_process');
const [a,b,out]=[+process.argv[2],+process.argv[3],process.argv[4]];
(async()=>{const dir=__dirname;const br=await chromium.launch();const p=await br.newPage({viewport:{width:1280,height:720}});
p.on('pageerror',e=>console.error('PAGEERR',e.message));
await p.goto('file://'+dir+'/'+(process.env.PAGE||'index.html'));await p.evaluate(async env=>{await init(env)},JSON.parse(fs.readFileSync(dir+'/env.json')));
const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate','24','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p',out],{stdio:['pipe','inherit','inherit']});
for(let f=a;f<b;f++){const u=await p.evaluate(f=>{render(f);return document.getElementById('c').toDataURL('image/jpeg',.92)},f);
 if(!ff.stdin.write(Buffer.from(u.split(',')[1],'base64')))await new Promise(r=>ff.stdin.once('drain',r));
 if(f%500===0)console.log(out,f);}
ff.stdin.end();await new Promise(r=>ff.on('close',r));await br.close();})();
