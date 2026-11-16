const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('file://'+__dirname+'/'+process.env.PAGE);
await p.evaluate(async env=>{await init(env)},JSON.parse(fs.readFileSync(__dirname+'/env.json')));
for(const t of [7,20,30,45,66,98,110,140,152,175,190]){const f=Math.round(t*24);const t0=Date.now();
 for(let i=0;i<6;i++) await p.evaluate(f=>{render(f);return document.getElementById('c').toDataURL('image/jpeg',.92).length},f+i);
 console.log(t, ((Date.now()-t0)/6).toFixed(0)+'ms');}
await b.close();})();
