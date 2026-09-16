import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const root = process.cwd();
const origin = 'https://schmuck-finder.de';
const appSource = fs.readFileSync('app.js', 'utf8');
const appPrelude = appSource.slice(0, appSource.indexOf('function setMode'));
const catalogSource = fs.readFileSync('products-data.js', 'utf8');
const context = { window: {}, localStorage: { getItem: () => null } };
vm.createContext(context);
vm.runInContext(catalogSource, context);
vm.runInContext(`${appPrelude};globalThis.__articles=articles;globalThis.__details=details;globalThis.__editorialImages=editorialImages`, context);

const articles = JSON.parse(JSON.stringify(context.__articles));
const details = JSON.parse(JSON.stringify(context.__details));
const catalog = JSON.parse(JSON.stringify(context.SCHMUCK_PRODUCTS));
const categories = ['Ketten', 'Ringe', 'Armbänder', 'Ohrringe', 'Anhänger'];
const categorySlug = { Ketten:'ketten', Ringe:'ringe', Armbänder:'armbaender', Ohrringe:'ohrringe', Anhänger:'anhaenger' };
const editorial = ['/assets/references/nasteho-elin.webp','/assets/references/freja-rune.webp','/assets/magazin-gold.webp','/assets/magazin-silber.webp'];
const maleEditorial = ['/assets/references/male-high-fashion.webp','/assets/editorial-men-red.webp','/assets/references/male-dark-luxury.webp'];
const editorialFor = (article,index) => article[2] === 'Männer' ? maleEditorial[index % maleEditorial.length] : editorial[index % editorial.length];
const urls = [];

function esc(value='') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function slug(value='') { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,'-und-').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function write(route, html) {
  const dir = path.join(root, route);
  fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  urls.push(`${origin}/${route ? `${route}/` : ''}`);
}
function structured(data) { return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g,'\\u003c')}</script>`; }
function shell({title, description, route, content, schema=[], image='/assets/references/nasteho-elin.webp', bodyClass=''}) {
  const canonical = `${origin}/${route ? `${route}/` : ''}`;
  return `<!doctype html><html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="SCHMUCK FINDER"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin}${image}"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#3d2330"><link rel="icon" href="/assets/brand/mark.svg" type="image/svg+xml"><link rel="stylesheet" href="/seo.css">${schema.map(structured).join('')}</head><body class="${bodyClass}"><a class="skip" href="#content">Zum Inhalt</a><div class="announcement">FINDE DAS STÜCK, DAS SICH NACH DIR ANFÜHLT.</div><header><a class="brand" href="/"><img src="/assets/brand/logo-light.svg" alt="SCHMUCK FINDER"></a><nav aria-label="Hauptnavigation"><a href="/frauen/">Women</a><a href="/maenner/">Men</a><a href="/#finder">Finder</a><a href="/ratgeber/">Journal</a></nav></header><main id="content">${content}</main>${footer()}</body></html>`;
}
function footer(){ return `<footer><div><img src="/assets/brand/logo-light.svg" alt="SCHMUCK FINDER"><p>Finde das Stück, das sich nach dir anfühlt.</p></div><nav aria-label="Fußnavigation"><a href="/frauen/">Schmuck für Frauen</a><a href="/maenner/">Schmuck für Männer</a><a href="/ratgeber/">Journal</a><a href="/#impressum">Impressum</a><a href="/#datenschutz">Datenschutz</a></nav><p class="legal">Als Amazon-Partner verdienen wir an qualifizierten Verkäufen. Preise und Verfügbarkeit können sich ändern; maßgeblich sind die Angaben bei Amazon.de.</p></footer>`; }
function crumbs(items){ return `<nav class="crumbs" aria-label="Brotkrumen">${items.map((x,i)=>i===items.length-1?`<span>${esc(x.name)}</span>`:`<a href="${x.url}">${esc(x.name)}</a>`).join('<b>›</b>')}</nav>`; }
function breadcrumbSchema(items){ return {'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':items.map((x,i)=>({'@type':'ListItem',position:i+1,name:x.name,item:`${origin}${x.url}`}))}; }
function productCards(products){ return `<div class="product-grid">${products.slice(0,12).map(p=>`<article class="product-card"><a href="${esc(p.url)}" rel="nofollow sponsored noopener" target="_blank"><img src="${esc(p.image)}" alt="${esc(p.brand)} ${esc(p.title)}" loading="lazy" width="500" height="500"><span>${esc(p.brand)}</span><h2>${esc(p.title)}</h2><strong>${esc(p.price || 'Preis bei Amazon prüfen')}</strong><b>Bei Amazon ansehen →</b></a></article>`).join('')}</div>`; }

const websiteSchema = {'@context':'https://schema.org','@type':'WebSite',name:'SCHMUCK FINDER',url:`${origin}/`,description:'Unabhängiger Schmuck-Finder mit Markenauswahl, Beratung und Journal.'};
const organizationSchema = {'@context':'https://schema.org','@type':'Organization',name:'SCHMUCK FINDER',url:`${origin}/`,email:'info@schmuck-finder.de',logo:`${origin}/assets/brand/mark.svg`};

for (const [gender, label, intro] of [['women','Frauen','Entdecke ausgewählten Markenschmuck für Frauen – von feinen Ketten bis zu ausdrucksstarken Ringen.'],['men','Männer','Entdecke ausgewählten Markenschmuck für Männer – klare Ketten, Ringe und Armbänder für deinen Stil.']]) {
  const route = gender === 'women' ? 'frauen' : 'maenner';
  const ps = catalog[gender];
  const items = [{name:'Startseite',url:'/'},{name:`Schmuck für ${label}`,url:`/${route}/`}];
  const catLinks = categories.map(c=>`<a class="choice" href="/${route}/${categorySlug[c]}/"><strong>${c}</strong><span>${ps.filter(p=>p.category===c).length} ausgewählte Modelle →</span></a>`).join('');
  const content = `${crumbs(items)}<section class="hero"><p class="eyebrow">SCHMUCK FINDER · ${label}</p><h1>Schmuck für ${label}, der Persönlichkeit zeigt.</h1><p>${intro}</p><a class="button" href="/#finder">Persönlichen Finder starten</a></section><section><h2>Nach Schmuckart entdecken</h2><div class="choices">${catLinks}</div></section><section><h2>Aktuelle Auswahl</h2>${productCards(ps)}</section>`;
  write(route, shell({title:`Schmuck für ${label}: Marken, Stile & Beratung | SCHMUCK FINDER`,description:intro,route,content,schema:[websiteSchema,breadcrumbSchema(items)],bodyClass:gender==='men'?'men':''}));
  for (const category of categories) {
    const catRoute = `${route}/${categorySlug[category]}`;
    const filtered = ps.filter(p=>p.category===category);
    const catItems = [...items,{name:category,url:`/${catRoute}/`}];
    const desc = `${filtered.length} ausgewählte ${category} für ${label}: Marken, Preise und Stilberatung übersichtlich vergleichen.`;
    const content = `${crumbs(catItems)}<section class="hero compact"><p class="eyebrow">${label} · ${category}</p><h1>${category} für ${label}</h1><p>${desc} Nutze anschließend den interaktiven Finder für Material, Marke und Preis.</p><a class="button" href="/#finder">Auswahl weiter filtern</a></section><section><h2>Ausgewählte ${category}</h2>${productCards(filtered)}</section><section class="answer"><h2>Worauf sollte ich achten?</h2><p>Achte auf konkrete Materialangaben, Maße, Verschluss und Gewicht. Vergleiche den Preis erst, wenn diese Merkmale ähnlich sind. Bei empfindlicher Haut sollte die vollständige Legierung angegeben sein.</p><a href="/ratgeber/materialien/">Materialien verständlich vergleichen →</a></section>`;
    const itemList = {'@context':'https://schema.org','@type':'ItemList',name:`${category} für ${label}`,numberOfItems:filtered.length,itemListElement:filtered.slice(0,12).map((p,i)=>({'@type':'ListItem',position:i+1,url:p.url,name:`${p.brand} ${p.title}`}))};
    write(catRoute, shell({title:`${category} für ${label}: ausgewählte Markenmodelle`,description:desc,route:catRoute,content,schema:[breadcrumbSchema(catItems),itemList],bodyClass:gender==='men'?'men':''}));
  }
}

const brands = [...new Set([...catalog.women,...catalog.men].map(p=>p.brand))].sort((a,b)=>a.localeCompare(b,'de'));
for (const brand of brands) {
  const ps = [...catalog.women,...catalog.men].filter(p=>p.brand===brand);
  if (ps.length < 8) continue;
  const route=`marken/${slug(brand)}`;
  const items=[{name:'Startseite',url:'/'},{name:'Marken',url:'/marken/'},{name:brand,url:`/${route}/`}];
  const desc=`${brand} Schmuck für Frauen und Männer entdecken: ${ps.length} ausgewählte Modelle mit aktuellen Amazon-Angeboten.`;
  const content=`${crumbs(items)}<section class="hero compact"><p class="eyebrow">Markenwelt</p><h1>${esc(brand)} Schmuck entdecken</h1><p>${esc(desc)} Verfügbarkeit und Preis werden beim Händler bestätigt.</p><a class="button" href="/#finder">Im Finder vergleichen</a></section><section><h2>Ausgewählte Modelle von ${esc(brand)}</h2>${productCards(ps)}</section>`;
  write(route,shell({title:`${brand} Schmuck: ausgewählte Modelle | SCHMUCK FINDER`,description:desc,route,content,schema:[breadcrumbSchema(items)]}));
}

const journalCards=articles.map((a,i)=>`<article class="journal-card"><a href="/ratgeber/${a[0]}/"><span class="editorial-media"><img src="${editorialFor(a,i)}" alt="Redaktionelles Schmuckmotiv" loading="lazy" width="640" height="800"><small class="ai-badge">KI-Bild</small></span><span>${esc(a[2])} · ${esc(a[3])}</span><h2>${esc(a[1])}</h2><p>${esc(a[4])}</p></a></article>`).join('');
write('ratgeber',shell({title:'Schmuck-Ratgeber: Material, Pflege, Trends & Stil',description:'26 fundierte Schmuck-Ratgeber zu Material, Passform, Pflege, Trends, Geschenken und persönlichem Stil.',route:'ratgeber',content:`${crumbs([{name:'Startseite',url:'/'},{name:'Journal',url:'/ratgeber/'}])}<section class="hero compact"><p class="eyebrow">SCHMUCK FINDER Journal</p><h1>Wissen, das bleibt.</h1><p>Fundierte, verständliche Antworten für bessere Schmuckentscheidungen.</p></section><section class="journal-grid">${journalCards}</section>`,schema:[websiteSchema]}));

const sourceLinks=`<ul class="sources"><li><a href="https://www.gia.edu/gem-encyclopedia" rel="noopener" target="_blank">Gemological Institute of America: Gem Encyclopedia</a></li><li><a href="https://echa.europa.eu/hot-topics/nickel" rel="noopener" target="_blank">ECHA: Nickel und Hautkontakt</a></li><li><a href="https://www.verbraucherzentrale.de/wissen/umwelt-haushalt/produkte/schmuck-kaufen-darauf-sollten-sie-achten-11471" rel="noopener" target="_blank">Verbraucherzentrale: Hinweise zum Schmuckkauf</a></li></ul>`;
for (let i=0;i<articles.length;i++) {
  const a=articles[i], d=details[a[0]], route=`ratgeber/${a[0]}`, image=editorialFor(a,i);
  const items=[{name:'Startseite',url:'/'},{name:'Journal',url:'/ratgeber/'},{name:a[1],url:`/${route}/`}];
  const related=[articles[(i+1)%articles.length],articles[(i+3)%articles.length]];
  const content=`${crumbs(items)}<article class="article"><header><p class="eyebrow">${esc(a[2])} · ${esc(a[3])}</p><h1>${esc(a[1])}</h1><p class="lead">${esc(a[4])}</p><p class="byline">Von der SCHMUCK FINDER Redaktion · Fachlich geprüft am 16.09.2026</p></header><span class="editorial-media article-media"><img class="article-image" src="${image}" alt="KI-generiertes redaktionelles Schmuckmotiv" width="1200" height="800"><small class="ai-badge">KI-Bild</small></span><small>KI-generiertes redaktionelles Motiv; kein konkretes Markenprodukt.</small><section class="direct-answer"><h2>Die kurze Antwort</h2><p>${esc(d[0])}</p></section><section><h2>Worauf es wirklich ankommt</h2><p>${esc(d[0])}</p><p>Materialangaben sollten konkret sein. Aussagekräftig sind Legierung, Basismetall, Beschichtung und genaue Maße. Vergleiche diese Angaben, bevor du dich vom Foto leiten lässt.</p><h2>Praktisches Beispiel</h2><p>${esc(d[1])}</p><div class="check"><h2>Checkliste</h2><ul>${d[2].map(x=>`<li>${esc(x)}</li>`).join('')}<li>Rückgabe und Reparatur vor dem Kauf klären</li></ul></div><h2>So triffst du die Entscheidung</h2><p>Reduziere die Auswahl auf zwei Stücke und prüfe beide nach denselben Kriterien: Tragekomfort, Kombinierbarkeit, Materialqualität und Pflegeaufwand. Das Stück, das in mehr realen Situationen funktioniert, ist meist die bessere langfristige Wahl.</p><h2>Quellen und Einordnung</h2><p>Die Redaktion fasst öffentlich zugängliche Fachinformationen zusammen. Wir führen keine eigenen Material- oder Tragetests durch. Produktpreise und Verfügbarkeit stammen vom jeweiligen Händler.</p>${sourceLinks}<h2>Weiterlesen</h2><div class="related">${related.map(r=>`<a href="/ratgeber/${r[0]}/">${esc(r[1])} →</a>`).join('')}</div></section></article>`;
  const articleSchema={'@context':'https://schema.org','@type':'Article',headline:a[1],description:a[4],image:`${origin}${image}`,datePublished:'2026-09-12',dateModified:'2026-09-16',author:{'@type':'Organization',name:'SCHMUCK FINDER Redaktion'},publisher:{'@type':'Organization',name:'SCHMUCK FINDER',logo:{'@type':'ImageObject',url:`${origin}/assets/brand/mark.svg`}},mainEntityOfPage:`${origin}/${route}/`};
  write(route,shell({title:`${a[1]} | SCHMUCK FINDER`,description:a[4],route,content,schema:[articleSchema,breadcrumbSchema(items)],image}));
}

const now='2026-09-16';
fs.writeFileSync('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[origin+'/',...urls].map(u=>`  <url><loc>${u}</loc><lastmod>${now}</lastmod></url>`).join('\n')}\n</urlset>\n`);
console.log(`Generated ${urls.length} indexable pages.`);
