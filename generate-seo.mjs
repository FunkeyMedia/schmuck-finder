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

const christmasPages = [
  ...[
    ['freundin','Schmuck als Weihnachtsgeschenk für die Freundin','women','Ein persönliches Stück für die Freundin gelingt, wenn Metallfarbe, Alltag und Bedeutung zusammenpassen.','Beobachte zuerst, ob sie Gold oder Silber trägt, und wähle bei unsicherer Größe lieber Kette, Ohrringe oder ein verstellbares Armband.'],
    ['ehefrau','Schmuck als Weihnachtsgeschenk für die Ehefrau','women','Für die Ehefrau darf das Geschenk vertraut und besonders zugleich wirken.','Orientiere dich an ihren meistgetragenen Stücken und setze mit Material, Stein oder Symbol einen persönlichen Akzent.'],
    ['mutter','Schmuck als Weihnachtsgeschenk für die Mutter','women','Schmuck für die Mutter sollte zu ihrem Alltag passen und eine klare persönliche Botschaft tragen.','Zeitlose Ketten, dezente Ohrringe und gut schließende Armbänder sind meist sicherer als überraschende Ringgrößen.'],
    ['schwester','Schmuck als Weihnachtsgeschenk für die Schwester','women','Für die Schwester darf Schmuck modisch sein, sollte aber ihren eigenen Stil respektieren.','Nutze ihre bevorzugte Metallfarbe als festen Ausgangspunkt und entscheide dann zwischen minimalistisch und auffällig.'],
    ['beste-freundin','Schmuck als Weihnachtsgeschenk für die beste Freundin','women','Ein Freundschaftsgeschenk wirkt stark, wenn es persönlich ist, ohne romantisch missverstanden zu werden.','Charms, Initialen, kleine Anhänger und alltagstaugliche Armbänder verbinden Bedeutung mit einfacher Passform.'],
    ['tochter','Schmuck als Weihnachtsgeschenk für die erwachsene Tochter','women','Für die erwachsene Tochter eignet sich ein modernes Stück, das sich in ihre vorhandene Garderobe einfügt.','Achte auf ihre bevorzugten Marken, Metallfarben und darauf, ob sie eher feine oder markante Proportionen trägt.'],
    ['freund','Schmuck als Weihnachtsgeschenk für den Freund','men','Herrenschmuck für den Freund wirkt am besten klar, tragbar und passend zu Uhr und Kleidung.','Eine schlichte Kette oder ein Armband ist größenfreundlicher; bei Ringen solltest du ein vorhandenes Modell ausmessen.'],
    ['ehemann','Schmuck als Weihnachtsgeschenk für den Ehemann','men','Ein Schmuckgeschenk für den Ehemann darf Haltung zeigen und trotzdem selbstverständlich im Alltag funktionieren.','Wiederhole Metall und Formsprache seiner Uhr oder Gürtelschnalle, damit das neue Stück sofort vertraut wirkt.'],
    ['vater','Schmuck als Weihnachtsgeschenk für den Vater','men','Für den Vater sind Komfort, gute Verschlüsse und eine ruhige Gestaltung oft wichtiger als ein kurzfristiger Trend.','Wähle robuste Materialien und eine Größe, die sich leicht anpassen oder umtauschen lässt.'],
    ['bruder','Schmuck als Weihnachtsgeschenk für den Bruder','men','Beim Bruder darf das Geschenk modern sein, sollte aber nicht verkleidet wirken.','Starte mit einem einzelnen, klaren Stück und orientiere dich an seinen vorhandenen Accessoires.'],
    ['bester-freund','Schmuck als Weihnachtsgeschenk für den besten Freund','men','Ein Geschenk für den besten Freund funktioniert mit klarer Symbolik und unkompliziertem Tragekomfort.','Schlichte Anhänger, Ketten und Armbänder sind sicherer als sehr persönliche Gravuren oder schwer einschätzbare Ringgrößen.'],
    ['partner','Schmuck als Weihnachtsgeschenk für den Partner','all','Schmuck für den Partner sollte Beziehung, Stil und Alltag miteinander verbinden.','Leite die Auswahl aus tatsächlich getragenen Stücken ab und nutze Bedeutung als Ergänzung statt als Ersatz für passenden Stil.']
  ].map(([slug,title,audience,intro,tip])=>({slug,title,audience,intro,tip,kind:'recipient'})),
  ...[
    ['unter-30-euro','Schmuck-Weihnachtsgeschenke unter 30 Euro',30,'Unter 30 Euro überzeugen klare Materialien und ein gut gewähltes Motiv mehr als möglichst viele Details.'],
    ['unter-50-euro','Schmuck-Weihnachtsgeschenke unter 50 Euro',50,'Bis 50 Euro gibt es viele markentaugliche Ketten, Ohrstecker, Anhänger und Armbänder.'],
    ['unter-75-euro','Schmuck-Weihnachtsgeschenke unter 75 Euro',75,'Bis 75 Euro wächst die Auswahl an soliden Markenstücken und aufwendigeren Oberflächen.'],
    ['unter-100-euro','Schmuck-Weihnachtsgeschenke unter 100 Euro',100,'Bis 100 Euro lassen sich Material, Marke und persönliche Wirkung gut ausbalancieren.'],
    ['unter-150-euro','Schmuck-Weihnachtsgeschenke unter 150 Euro',150,'Bis 150 Euro stehen viele ausdrucksstarke Markenstücke und hochwertigere Ausführungen zur Wahl.']
  ].map(([slug,title,maxPrice,intro])=>({slug,title,maxPrice,intro,tip:'Vergleiche Material, Maße und Verschluss und plane Versand sowie eine mögliche Rückgabe vor Weihnachten ein.',kind:'budget',audience:'all'})),
  ...[
    ['ketten','Ketten als Weihnachtsgeschenk','Ketten','Eine Kette ist größenfreundlich und lässt sich durch Länge, Anhänger und Metallfarbe gut personalisieren.'],
    ['ringe','Ringe als Weihnachtsgeschenk','Ringe','Ein Ring ist besonders persönlich, verlangt aber eine zuverlässig ermittelte Größe.'],
    ['armbaender','Armbänder als Weihnachtsgeschenk','Armbänder','Armbänder sind präsent, alltagstauglich und mit verstellbarer Länge relativ sicher zu verschenken.'],
    ['ohrringe','Ohrringe als Weihnachtsgeschenk','Ohrringe','Ohrringe funktionieren gut, wenn Stil, Gewicht und vorhandene Ohrlöcher bekannt sind.'],
    ['anhaenger','Anhänger als Weihnachtsgeschenk','Anhänger','Ein Anhänger transportiert Symbolik und lässt sich häufig mit vorhandenen Ketten kombinieren.']
  ].map(([slug,title,category,intro])=>({slug,title,category,intro,tip:'Prüfe konkrete Maße, Gewicht, Verschluss und Lieferumfang; Produktfotos allein zeigen die tatsächliche Größe selten zuverlässig.',kind:'type',audience:'all'})),
  ...[
    ['gold','Goldfarbener Schmuck zu Weihnachten','gold','Goldfarbener Schmuck wirkt warm und passt häufig zu Beige, Braun, Creme und Olivtönen.'],
    ['silber','Silberfarbener Schmuck zu Weihnachten','silber','Silberfarbener Schmuck wirkt klar und lässt sich leicht mit Grau, Blau, Weiß und Schwarz kombinieren.'],
    ['edelstahl','Edelstahlschmuck zu Weihnachten','edelstahl','Edelstahl ist für viele Alltagsstücke robust, pflegeleicht und preislich gut zugänglich.'],
    ['bicolor','Bicolor-Schmuck zu Weihnachten','bicolor','Bicolor-Schmuck verbindet Gold und Silber und ist hilfreich, wenn die bevorzugte Metallfarbe unklar ist.'],
    ['minimalistisch','Minimalistischer Schmuck als Weihnachtsgeschenk','minimal','Minimalistischer Schmuck ist vielseitig, wenn die beschenkte Person klare Formen und zurückhaltende Accessoires trägt.'],
    ['statement','Statement-Schmuck als Weihnachtsgeschenk','statement','Statement-Schmuck eignet sich für Menschen, die Accessoires bewusst als Blickfang einsetzen.'],
    ['persoenlich','Persönlicher Schmuck zu Weihnachten','personal','Persönlicher Schmuck gewinnt durch Initial, Symbol, Geburtsstein oder eine nachvollziehbare gemeinsame Bedeutung.']
  ].map(([slug,title,material,intro])=>({slug,title,material,intro,tip:'Gleiche die Wirkung mit zwei oder drei häufig getragenen Outfits der beschenkten Person ab.',kind:'style',audience:'all'})),
  ...[
    ['kleine-aufmerksamkeit','Kleine Schmuck-Aufmerksamkeit zu Weihnachten','all','Eine kleine Aufmerksamkeit sollte unkompliziert tragbar sein und keine große Größenkenntnis verlangen.'],
    ['wichtelgeschenk','Schmuck als Wichtelgeschenk','all','Als Wichtelgeschenk funktioniert Schmuck nur, wenn Stil und Materialverträglichkeit der Person ausreichend bekannt sind.'],
    ['last-minute','Last-Minute-Schmuckgeschenke','all','Bei einer späten Bestellung zählen verfügbare Modelle, klare Lieferangaben und eine sichere Geschenkoption.'],
    ['erstes-weihnachten','Schmuck zum ersten gemeinsamen Weihnachten','all','Das erste gemeinsame Weihnachten verlangt kein maximales Budget, sondern eine stimmige und nachvollziehbare Bedeutung.'],
    ['fernbeziehung','Schmuckgeschenk in einer Fernbeziehung','all','In einer Fernbeziehung kann ein häufig tragbares Stück Nähe im Alltag symbolisieren.'],
    ['kollegin','Schmuck als Weihnachtsgeschenk für die Kollegin','women','Für eine Kollegin sollte Schmuck zurückhaltend, unverfänglich und dem Verhältnis angemessen bleiben.'],
    ['kollege','Schmuck als Weihnachtsgeschenk für den Kollegen','men','Für einen Kollegen ist ein Schmuckgeschenk nur bei persönlicher Nähe sinnvoll und sollte bewusst neutral bleiben.'],
    ['teenager-maedchen','Schmuck-Weihnachtsgeschenke für Teenagerinnen','women','Für Teenagerinnen zählen aktueller Stil, tragbare Maße und klar deklarierte Materialien.'],
    ['teenager-jungen','Schmuck-Weihnachtsgeschenke für Teenager','men','Für männliche Teenager sind schlichte Ketten, Armbänder und einzelne Ringe häufig ein guter Einstieg.'],
    ['paare','Schmuck-Weihnachtsgeschenke für Paare','all','Paarschmuck wirkt überzeugender mit einer gemeinsamen Formsprache als mit vollkommen identischen Stücken.']
  ].map(([slug,title,audience,intro])=>({slug,title,audience,intro,tip:'Halte die Symbolik verständlich und prüfe vor dem Kauf Größe, Material sowie Umtauschbedingungen.',kind:'occasion'})),
  ...[
    ['ohne-ringgroesse','Schmuck schenken ohne Ringgröße','all','Ohne sichere Ringgröße sind Ketten, Anhänger, Ohrringe oder verstellbare Armbänder die risikoärmere Wahl.'],
    ['gold-oder-silber','Gold oder Silber zu Weihnachten schenken?','all','Die meistgetragene Metallfarbe ist verlässlicher als pauschale Regeln zu Hauttönen.'],
    ['richtige-kettenlaenge','Die richtige Kettenlänge als Geschenk','all','Eine mittlere, verstellbare Länge passt häufiger als ein sehr kurzer Choker oder eine ausgeprägt lange Kette.'],
    ['empfindliche-haut','Schmuckgeschenke bei empfindlicher Haut','all','Bei empfindlicher Haut sind vollständige Materialangaben wichtiger als Begriffe wie hautfreundlich oder hochwertig.'],
    ['groesse-heimlich-ermitteln','Schmuckgröße heimlich ermitteln','all','Miss ein häufig getragenes Stück, statt Körpermaße oder Ringgrößen zu schätzen.'],
    ['umtausch-sicher','Schmuck mit sicherer Umtauschmöglichkeit schenken','all','Bei unsicherer Größe oder Stilrichtung ist eine klare Rückgabe- und Umtauschmöglichkeit ein echtes Qualitätsmerkmal.'],
    ['alltagstauglich','Alltagstauglichen Schmuck zu Weihnachten schenken','all','Alltagsschmuck braucht glatte Kanten, sichere Verschlüsse und Proportionen, die bei Arbeit und Bewegung nicht stören.'],
    ['symbolik','Schmuck mit Bedeutung zu Weihnachten','all','Bedeutung entsteht durch Beziehung und Erinnerung; das Symbol sollte auch ohne lange Erklärung zur Person passen.'],
    ['markenschmuck','Markenschmuck als Weihnachtsgeschenk','all','Markenschmuck erleichtert die Orientierung, ersetzt aber nicht die Prüfung von Material, Maßen und Verarbeitung.'],
    ['fehlkaeufe-vermeiden','Schmuck-Fehlkäufe zu Weihnachten vermeiden','all','Die meisten Fehlkäufe entstehen durch falsche Größe, unpassende Metallfarbe oder eine zu auffällige Stilentscheidung.']
  ].map(([slug,title,audience,intro])=>({slug,title,audience,intro,tip:'Vergleiche zwei konkrete Kandidaten nach denselben Kriterien und entscheide erst danach nach Gefühl.',kind:'decision'}))
];
if (christmasPages.length !== 49) throw new Error(`Expected 49 Christmas subpages, got ${christmasPages.length}`);

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

const allProducts=[...catalog.women,...catalog.men];
function christmasProducts(page){
  let list=allProducts.filter(p=>(page.audience==='women'?p.gender==='women':page.audience==='men'?p.gender==='men':true));
  if(page.category) list=list.filter(p=>p.category===page.category);
  if(page.maxPrice) list=list.filter(p=>p.amount&&p.amount<=page.maxPrice);
  if(page.material){
    const terms={gold:['gold','vergold','gelbgold','roségold'],silber:['silber','rhodin'],edelstahl:['edelstahl'],bicolor:['bicolor','zweifarbig','multicolor'],minimal:['minimal','basic','schlicht'],statement:['statement','chunky','groß'],personal:['anhänger','charm','herz','initial']}[page.material]||[];
    const matched=list.filter(p=>terms.some(t=>p.title.toLowerCase().includes(t)));
    if(matched.length>=8) list=matched;
  }
  return list.sort((a,b)=>(a.amount||9999)-(b.amount||9999));
}
function christmasFaq(page){
  const whom=page.audience==='women'?'für eine Frau':page.audience==='men'?'für einen Mann':'als Geschenk';
  return [
    [`Welcher Schmuck eignet sich ${whom} zu Weihnachten?`,page.intro],
    ['Wie vermeide ich eine falsche Größe?',page.category==='Ringe'?'Miss den Innendurchmesser eines gut passenden Rings und gleiche ihn mit der Größentabelle des Angebots ab. Bei Unsicherheit ist eine andere Schmuckart sicherer.':'Bevorzuge verstellbare Längen oder miss ein vorhandenes Lieblingsstück. Konkrete Produktmaße sind zuverlässiger als allgemeine Größenangaben.'],
    ['Wann sollte ich bestellen?','Plane Lieferzeit, Prüfung des Artikels und gegebenenfalls einen Umtausch ein. Entscheidend ist die aktuelle Lieferangabe beim Händler, besonders in den letzten Wochen vor Weihnachten.']
  ];
}
function christmasCopy(page, products){
  const audience=page.audience==='women'?'Frauen':page.audience==='men'?'Männer':'Frauen und Männer';
  const faq=christmasFaq(page);
  return `<section class="hero christmas-hero"><p class="eyebrow">Weihnachten 2026 · Geschenkefinder</p><h1>${esc(page.title)}</h1><p>${esc(page.intro)}</p><a class="button" href="#auswahl">${products.length} passende Markenstücke ansehen</a></section><section class="direct-answer"><h2>Die kurze Antwort</h2><p>${esc(page.intro)} ${esc(page.tip)}</p></section><section><h2>So wird aus Schmuck ein persönliches Weihnachtsgeschenk</h2><p>Ein überzeugendes Geschenk beginnt bei der Person, nicht beim größten Rabatt. Sieh dir an, welche Metallfarbe, Größen und Formen tatsächlich getragen werden. Wiederkehrende Details sind ein belastbarer Hinweis auf den Stil. Ein neues Stück darf diesen Stil erweitern, sollte ihn aber nicht vollständig verändern.</p><p>${esc(page.tip)} Berücksichtige außerdem Alltag, Verschluss, Gewicht und Pflege. Wer viel mit den Händen arbeitet, profitiert häufig von glatten, robusten Formen. Für seltene Anlässe darf das Stück ausdrucksstärker sein.</p><div class="gift-steps"><article><b>1</b><h3>Stil beobachten</h3><p>Gold oder Silber, fein oder markant, klassisch oder modern: Fotografiere ein vorhandenes Lieblingsstück oder notiere seine Merkmale.</p></article><article><b>2</b><h3>Passform absichern</h3><p>Miss vorhandenen Schmuck und prüfe Maße, Gewicht, Verschluss und Verstellbereich im Angebot.</p></article><article><b>3</b><h3>Lieferung prüfen</h3><p>Bestätige Preis, Verfügbarkeit, Lieferdatum und Rückgabebedingungen unmittelbar vor dem Kauf beim Händler.</p></article></div></section><section id="auswahl"><h2>Ausgewählte Geschenkideen für ${audience}</h2><p class="section-intro">Die Auswahl stammt aus dem geprüften Markenkatalog von SCHMUCK FINDER. Preise und Verfügbarkeit können sich ändern; maßgeblich ist das aktuelle Angebot bei Amazon.</p>${productCards(products)}</section><section class="answer"><h2>Checkliste vor dem Kauf</h2><ul><li>Bevorzugte Metallfarbe an vorhandenem Schmuck prüfen</li><li>Material, Maße und Verschluss vollständig lesen</li><li>Größe nicht schätzen, sondern an einem vorhandenen Stück messen</li><li>Lieferdatum und Rückgabefrist für Weihnachten kontrollieren</li><li>Geschenk nach persönlichem Stil statt nach kurzfristigem Trend auswählen</li></ul></section><section><h2>Häufige Fragen</h2><div class="faq">${faq.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div><p class="editorial-note">Redaktionelle Auswahl: SCHMUCK FINDER Redaktion · Aktualisiert am 16.09.2026. Wir führen keine eigenen Material- oder Tragetests durch. Die Reihenfolge berücksichtigt Zielgruppe, Kategorie, Preis und verfügbare Produktangaben.</p></section>`;
}

const christmasHubRoute='weihnachtsgeschenke-schmuck';
const hubItems=[{name:'Startseite',url:'/'},{name:'Weihnachtsgeschenke',url:`/${christmasHubRoute}/`}];
const hubLinks=christmasPages.map(p=>`<a class="choice" href="/${christmasHubRoute}/${p.slug}/"><strong>${esc(p.title.replace(/Schmuck als Weihnachtsgeschenk|Schmuck-Weihnachtsgeschenke| zu Weihnachten| als Weihnachtsgeschenk/g,'').trim())}</strong><span>Geschenkideen entdecken →</span></a>`).join('');
const hubFaq=[['Welcher Schmuck ist ein gutes Weihnachtsgeschenk?','Ein gutes Schmuckgeschenk passt zur getragenen Metallfarbe, zum Alltag und zur persönlichen Stilrichtung. Größen und Materialien sollten vor dem Kauf konkret geprüft werden.'],['Wie finde ich Schmuck, wenn ich den Stil nicht genau kenne?','Nutze ein vorhandenes Lieblingsstück als Referenz. Ketten, Anhänger und verstellbare Armbänder sind bei unsicherer Größe meist einfacher als Ringe.'],['Sind die Preise aktuell?','Die Website zeigt verfügbare Amazon-Produktdaten. Preis, Lieferdatum und Verfügbarkeit müssen unmittelbar vor dem Kauf beim Händler bestätigt werden.']];
const hubContent=`${crumbs(hubItems)}<section class="hero christmas-hero"><p class="eyebrow">SCHMUCK FINDER · Weihnachten 2026</p><h1>Schmuck zu Weihnachten schenken.</h1><p>Finde ein Schmuckgeschenk nach Person, Budget, Schmuckart und Stil – mit konkreten Entscheidungshilfen statt einer beliebigen Bestsellerliste.</p><a class="button" href="#geschenkwege">Geschenkideen entdecken</a></section><section class="direct-answer"><h2>Welcher Schmuck passt zu Weihnachten?</h2><p>Am sichersten ist ein Stück, das die bevorzugte Metallfarbe und Formsprache der beschenkten Person aufgreift. Bei unbekannter Größe sind Ketten, Anhänger, Ohrringe oder verstellbare Armbänder leichter zu wählen als Ringe.</p></section><section id="geschenkwege"><h2>In 50 Wegen zum passenden Geschenk</h2><p class="section-intro">Wähle nach Beziehung, Budget, Schmuckart oder konkreter Unsicherheit. Jede Auswahl enthält passende Markenmodelle und eine eigene Checkliste.</p><div class="choices christmas-choices">${hubLinks}</div></section><section><h2>Geschenke, die nicht geraten wirken</h2><div class="gift-steps"><article><b>1</b><h3>Person</h3><p>Für wen suchst du und welche Stücke trägt die Person bereits?</p></article><article><b>2</b><h3>Rahmen</h3><p>Lege Budget, Metallfarbe und eine größenfreundliche Schmuckart fest.</p></article><article><b>3</b><h3>Sicherheit</h3><p>Prüfe Maße, Lieferdatum und Rückgabe direkt beim Händler.</p></article></div></section><section><h2>Häufige Fragen</h2><div class="faq">${hubFaq.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></section>`;
const hubFaqSchema={'@context':'https://schema.org','@type':'FAQPage','mainEntity':hubFaq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))};
write(christmasHubRoute,shell({title:'Schmuck-Weihnachtsgeschenke 2026: Finder für Sie & Ihn',description:'Schmuck zu Weihnachten finden: 50 Geschenkwege nach Person, Budget, Schmuckart und Stil – mit konkreten Tipps und Markenprodukten.',route:christmasHubRoute,content:hubContent,schema:[breadcrumbSchema(hubItems),hubFaqSchema],image:'/assets/magazin-gold.webp'}));

for(const page of christmasPages){
  const route=`${christmasHubRoute}/${page.slug}`;
  const items=[...hubItems,{name:page.title,url:`/${route}/`}];
  const products=christmasProducts(page).slice(0,12);
  const faq=christmasFaq(page);
  const faqSchema={'@context':'https://schema.org','@type':'FAQPage','mainEntity':faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))};
  const itemSchema={'@context':'https://schema.org','@type':'ItemList',name:page.title,numberOfItems:products.length,itemListElement:products.map((p,i)=>({'@type':'ListItem',position:i+1,url:p.url,name:`${p.brand} ${p.title}`}))};
  const description=`${page.intro} Auswahlhilfe, Checkliste und ${products.length} passende Markenstücke.`;
  write(route,shell({title:`${page.title} | SCHMUCK FINDER`,description,route,content:`${crumbs(items)}${christmasCopy(page,products)}`,schema:[breadcrumbSchema(items),faqSchema,itemSchema],image:page.audience==='men'?'/assets/references/male-dark-luxury.webp':'/assets/magazin-gold.webp',bodyClass:page.audience==='men'?'men':''}));
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
