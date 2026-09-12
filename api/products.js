import '../products-data.js';

let tokenCache={value:null,expires:0};
const MARKETPLACE='www.amazon.de';
const PARTNER_TAG=process.env.AMAZON_PARTNER_TAG||'Onlinestarkei-21';
const searches={
  women:[
    {keywords:'Swarovski Damen Halskette',category:'Ketten'},
    {keywords:'s.Oliver Damen Ring',category:'Ringe'},
    {keywords:'LIEBESKIND Damen Armband',category:'Armbänder'},
    {keywords:'Fossil Damen Ohrringe',category:'Ohrringe'},
    {keywords:'Thomas Sabo Damen Anhänger',category:'Anhänger'}
  ],
  men:[
    {keywords:'Fossil Herren Halskette',category:'Ketten'},
    {keywords:'Diesel Herren Ring Schmuck',category:'Ringe'},
    {keywords:'Lacoste Herren Armband',category:'Armbänder'},
    {keywords:'Diesel Herren Ohrringe',category:'Ohrringe'},
    {keywords:'Police Herren Anhänger',category:'Anhänger'}
  ]
};
const approvedBrands={
  women:new Set(['Swarovski','THOMAS SABO','Fossil','LIEBESKIND','s.Oliver','Guess','Michael Kors','Calvin Klein','Tommy Hilfiger','Elli']),
  men:new Set(['Fossil','Diesel','Police','Tommy Hilfiger','Emporio Armani','BOSS','Lacoste','Calvin Klein','s.Oliver','Maserati'])
};

async function accessToken(){
  if(tokenCache.value&&Date.now()<tokenCache.expires)return tokenCache.value;
  const id=process.env.AMAZON_CREATORS_CREDENTIAL_ID||process.env.AMAZON_CREDENTIAL_ID;
  const secret=process.env.AMAZON_CREATORS_CREDENTIAL_SECRET||process.env.AMAZON_CREDENTIAL_SECRET;
  if(!id||!secret)throw new Error('Creators API credentials are not configured');
  const response=await fetch('https://api.amazon.co.uk/auth/o2/token',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({grant_type:'client_credentials',client_id:id,client_secret:secret,scope:'creatorsapi::default'})});
  if(!response.ok)throw new Error(`Amazon token request failed (${response.status})`);
  const data=await response.json();
  tokenCache={value:data.access_token,expires:Date.now()+Math.max(60,(data.expires_in||3600)-120)*1000};
  return tokenCache.value;
}

const value=x=>x?.displayValue??x?.displayAmount??x?.value??null;
function normalize(item,gender,category){
  const title=value(item.itemInfo?.title)||'';
  const brand=value(item.itemInfo?.byLineInfo?.brand)||value(item.itemInfo?.byLineInfo?.manufacturer)||'Amazon';
  const price=item.offersV2?.listings?.[0]?.price||item.offers?.listings?.[0]?.price;
  const money=price?.money||price;
  const image=item.images?.primary?.large?.url||item.images?.primary?.medium?.url||item.images?.primary?.small?.url;
  const hoverImage=(item.images?.variants||[]).map(x=>x.large?.url||x.medium?.url||x.small?.url).find(Boolean)||null;
  if(!item.asin||!title||!image)return null;
  return {asin:item.asin,parentAsin:item.parentASIN||item.parentAsin||item.asin,title,brand,image,hoverImage,price:value(money),amount:money?.amount??null,currency:money?.currency||'EUR',url:item.detailPageURL||`https://www.amazon.de/dp/${item.asin}?tag=${PARTNER_TAG}`,gender,category,available:money?.amount!=null};
}

async function searchOne(token,{keywords,category},gender){
  const response=await fetch('https://creatorsapi.amazon/catalog/v1/searchItems',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json','x-marketplace':MARKETPLACE},body:JSON.stringify({partnerTag:PARTNER_TAG,marketplace:MARKETPLACE,keywords,itemCount:10,searchIndex:'Fashion',resources:['images.primary.large','images.variants.large','itemInfo.title','itemInfo.byLineInfo','offersV2.listings.price','parentASIN']})});
  if(!response.ok){const detail=await response.text();throw new Error(`Amazon search failed (${response.status}): ${detail.slice(0,180)}`)}
  const data=await response.json();
  return (data.searchResult?.items||[]).map(x=>normalize(x,gender,category)).filter(Boolean);
}

export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const gender=req.query?.gender==='men'?'men':'women';
  try{
    const token=await accessToken();
    const buckets=[];
    for(let i=0;i<searches[gender].length;i++){
      if(i)await new Promise(resolve=>setTimeout(resolve,1050));
      buckets.push(await searchOne(token,searches[gender][i],gender));
    }
    const seen=new Set(),products=[];
    const add=product=>{
      const key=product.parentAsin||product.asin;
      if(products.length>=200)return false;
      if(!product.available||!approvedBrands[gender].has(product.brand)||seen.has(key))return false;
      if(products.filter(p=>p.category===product.category).length>=60)return false;
      seen.add(key);products.push(product);return true;
    };
    for(const bucket of buckets){
      for(const product of bucket){
        add(product);
        if(products.filter(p=>p.category===product.category).length===60)break;
      }
    }
    for(const product of globalThis.SCHMUCK_PRODUCTS?.[gender]||[])add(product);
    res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({products,count:products.length,requested:200,partnerTag:PARTNER_TAG,updatedAt:new Date().toISOString()});
  }catch(error){
    const products=globalThis.SCHMUCK_PRODUCTS?.[gender]||[];
    res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({products,count:products.length,requested:200,partnerTag:PARTNER_TAG,updatedAt:globalThis.SCHMUCK_PRODUCTS?.updatedAt,source:'verified-cache'});
  }
}
