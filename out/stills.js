const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const dir=__dirname;const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+dir+'/'+(process.env.PAGE||'index.html'));
await p.evaluate(async env=>{await init(env)},JSON.parse(fs.readFileSync(dir+'/env.json')));
const times=process.argv.slice(2).map(Number);fs.mkdirSync(dir+'/st',{recursive:true});
for(const t of times){try{const u=await p.evaluate(f=>{render(f);return document.getElementById('c').toDataURL('image/jpeg',.85)},Math.round(t*24));fs.writeFileSync(dir+`/st/${t}.jpg`,Buffer.from(u.split(',')[1],'base64'));}catch(e){console.log('ERR',t,e.message)}}
console.log(errs.join('\n'));await b.close();})();
