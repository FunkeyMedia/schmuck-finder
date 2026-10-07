import {readdirSync,cpSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=fileURLToPath(new URL('../',import.meta.url));process.chdir(root);
const output='dist',origin='https://schmuck-finder.de';mkdirSync(output,{recursive:true});
const folders=['assets','finder','frauen','maenner','marken','methodik','ratgeber','redaktion','themen','weihnachtsgeschenke-schmuck'];
for(const dir of folders)cpSync(dir,join(output,dir),{recursive:true});
for(const file of ['index.html','app.js','finder-page.js','products-data.js','tracking.js','styles.css','products.css','premium.css','seo.css','robots.txt','sitemap.xml'])cpSync(file,join(output,file));
const guides=JSON.parse(readFileSync('content/guides.json','utf8'));
const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const strip=v=>v.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]*>/g,' ').replace(/&\w+;/g,' ');
const readMinutes=body=>Math.max(1,Math.ceil(strip(body).trim().split(/\s+/).length/200));
const schema=x=>`<script type="application/ld+json">${JSON.stringify(x).replace(/</g,'\\u003c')}</script>`;
const files=[];function collect(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const path=join(dir,e.name);if(e.isDirectory())collect(path);else if(e.name.endsWith('.html'))files.push(path)}}collect(output);
let removedPrices=0;const readTimes={};
for(const file of files){
 let html=readFileSync(file,'utf8');
 html=html.replace(/<strong>[^<]*(?:€|&euro;)[^<]*<\/strong>/g,()=>{removedPrices++;return '<strong>Preis bei Amazon prüfen</strong>'});
 html=html.replaceAll('Fachlich geprüft am 16.09.2026','Redaktioneller Ratgeber · Stand: 16.09.2026');
 html=html.replace(/href="\/?#impressum"/g,'href="/impressum/"').replace(/href="\/?#datenschutz"/g,'href="/datenschutz/"');
 if(html.includes('class="product-grid"'))html=html.replace('</main>','<p class="editorial-note">Die Vorauswahl und Budgetzuordnung beruhen auf dem gespeicherten Katalogstand. Preise können sich ändern. Prüfe den aktuellen Preis, Versand und die Produktvariante beim Anbieter.</p></main>');
 const match=file.replaceAll('\\','/').match(/dist\/ratgeber\/([^/]+)\/index.html$/);
 if(match){
  const slug=match[1],g=guides.find(x=>x.slug===slug);
  if(g){
   const sections=`${g.sections.map(s=>`<section><h2>${escape(s.title)}</h2><p>${escape(s.text)}</p></section>`).join('')}<section class="check"><h2>Deine Checkliste</h2><ul>${g.checklist.map(c=>`<li>${escape(c)}</li>`).join('')}</ul></section><section class="faq"><h2>Häufige Fragen</h2>${g.faq.map(f=>`<details><summary>${escape(f.question)}</summary><p>${escape(f.answer)}</p></details>`).join('')}</section>${g.sources.length?`<section class="sources"><h2>Quellen und weiterführende Informationen</h2><ul>${g.sources.map(s=>`<li><a href="${escape(s.url)}" rel="noopener noreferrer">${escape(s.title)}</a></li>`).join('')}</ul></section>`:''}<section class="related"><h2>Weiterlesen</h2><a href="/ratgeber/">Alle Ratgeber</a><a href="/finder/">Schmuck im Finder auswählen</a></section>`;
   html=html.replace(/<section class="direct-answer">[\s\S]*?<\/article>/,sections+'</article>');
   html=html.replace('Redaktioneller Ratgeber · Stand: 16.09.2026','Redaktionell überarbeitet am 07.10.2026');
   html=html.replace(/<script([^>]*type="application\/ld\+json"[^>]*)>([\s\S]*?)<\/script>/g,(full,attrs,json)=>{const s=JSON.parse(json);if(s['@type']==='Article')s.dateModified='2026-10-07';return `<script${attrs}>${JSON.stringify(s).replace(/</g,'\\u003c')}</script>`});
   html=html.replace('</head>',schema({'@context':'https://schema.org','@type':'FAQPage',mainEntity:g.faq.map(f=>({'@type':'Question',name:f.question,acceptedAnswer:{'@type':'Answer',text:f.answer}}))})+'</head>');
  }
  const body=html.match(/<article class="article">([\s\S]*?)<\/article>/)?.[1];if(!body)throw Error('Missing article '+slug);
  const minutes=readMinutes(body);readTimes[slug]=minutes+' Min.';html=html.replace(/\d+ Min\./g,minutes+' Min.');
 }
 writeFileSync(file,html);
}
let source=readFileSync('app.js','utf8');
source=source.replaceAll('500 Pieces für deinen Stil','Ausgewählte Stücke für deinen Stil').replaceAll('Geprüfte Amazon-Angebote','Amazon-Angebote mit Datenstand').replaceAll('Alle 500 Markenstücke zeigen','Alle Markenstücke zeigen').replaceAll('· geprüft ${date}','· Katalogstand ${date}');
source=source.replace("'Der Moment gehört dir.'","'Schmuck, der zu dir passt.'");
source=source.replace('<h3>Was darf es kosten?</h3>','<h3>Was darf es kosten?</h3><p class="price-note">Budgetfilter und Sortierung nutzen den gespeicherten Katalogstand. Aktuelle Preise und Versandkosten bitte beim Anbieter prüfen.</p>');
source=source.replace('function render(){let h=',"function render(){const legacy=(location.hash||'').match(/^#artikel\\/([a-z0-9-]+)$/);if(legacy&&articles.some(a=>a[0]===legacy[1])){window.location.replace('/ratgeber/'+legacy[1]+'/');return;}let h=");
source=source.replace('const editorialImages=',`for(const article of articles)article[3]=${JSON.stringify(readTimes)}[article[0]]||article[3];\nconst editorialImages=`);
source=source.replace(/href="#impressum"/g,'href="/impressum/"').replace(/href="#datenschutz"/g,'href="/datenschutz/"');
writeFileSync(join(output,'app.js'),source);
let finder=readFileSync('finder-page.js','utf8').replace("${escapeHtml(product.price || 'Preis bei Amazon prüfen')}",'Preis bei Amazon prüfen');writeFileSync(join(output,'finder-page.js'),finder);
const context={window:{},localStorage:{getItem:()=>null},setInterval:()=>0,setTimeout:()=>0};vm.createContext(context);
vm.runInContext(readFileSync('products-data.js','utf8'),context);context.window.SCHMUCK_PRODUCTS=context.SCHMUCK_PRODUCTS;
const boundary=source.lastIndexOf("\ndocument.querySelectorAll('[data-mode]')");if(boundary<0)throw Error('Missing app bootstrap boundary');
vm.runInContext(source.slice(0,boundary)+';globalThis.__home=home();globalThis.__imprint=imprint();globalThis.__privacy=privacy();',context,{timeout:1000});
let home=readFileSync(join(output,'index.html'),'utf8');home=home.replace(/<main id="app">[\s\S]*?<\/main>/,'<main id="app">'+context.__home+'</main>');
home=home.replace('1.000 Markenstücke entdecken →','Markenstücke entdecken →');writeFileSync(join(output,'index.html'),home);
for(const file of files){
 let html=readFileSync(file,'utf8');
 html=html.replace(/(<a[^>]*href="\/ratgeber\/([a-z0-9-]+)\/"[^>]*>[\s\S]*?<\/a>)/g,(card,_,slug)=>readTimes[slug]?card.replace(/\d+ Min\./g,readTimes[slug]):card);
 writeFileSync(file,html);
}
const legalHead=(title,path)=>`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | SCHMUCK FINDER</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="${origin+path}"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/seo.css"></head><body><header><a class="brand" href="/"><img src="/assets/brand/logo-light.svg" alt="SCHMUCK FINDER"></a><nav><a href="/finder/">Schmuck-Finder</a><a href="/ratgeber/">Ratgeber</a></nav></header><main>`;
const legalFoot='<p><a href="/">Zur Startseite</a></p></main></body></html>';
for(const [name,title,body] of [['impressum','Impressum',context.__imprint],['datenschutz','Datenschutz',context.__privacy]]){
 const dir=join(output,name);mkdirSync(dir,{recursive:true});
 const content=body.replace(/href="#home"/g,'href="/"');
 const tools=name==='datenschutz'?`<script>function clearLocalData(button){try{localStorage.removeItem('sf-saved');localStorage.removeItem('sf-mode');button.textContent='Lokale Einstellungen wurden gelöscht';button.disabled=true}catch{button.textContent='Lokale Einstellungen konnten nicht gelöscht werden'}}</script>`:'';
 writeFileSync(join(dir,'index.html'),legalHead(title,'/'+name+'/')+content+tools+legalFoot);
}
let sitemap=readFileSync('sitemap.xml','utf8');
for(const g of guides){const re=new RegExp(`(<loc>${origin}/ratgeber/${g.slug}/</loc><lastmod>)[^<]+`);sitemap=sitemap.replace(re,'$1'+'2026-10-07');}
sitemap=sitemap.replace(/(<loc>https:\/\/schmuck-finder\.de\/<\/loc><lastmod>)[^<]+/,'$1'+'2026-10-07');writeFileSync(join(output,'sitemap.xml'),sitemap);
writeFileSync(join(output,'404.html'),'<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Seite nicht gefunden | SCHMUCK FINDER</title></head><body><h1>Diese Seite gibt es hier nicht.</h1><a href="/">Zum Schmuck-Finder</a></body></html>');
writeFileSync('seo-build-status.json',JSON.stringify({guidesRewritten:guides.length,articleReadTimes:readTimes,stalePricesRemoved:removedPrices},null,2));
console.log(`Homepage rendered; ${guides.length} existing guides rewritten; ${Object.keys(readTimes).length} reading times computed; ${removedPrices} stale price displays removed.`);
