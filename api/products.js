import '../products-data.js';

let tokenCache={value:null,expires:0};
const MARKETPLACE='www.amazon.de';
const PARTNER_TAG=process.env.AMAZON_PARTNER_TAG||'Onlinestarkei-21';
const searches={
  women:[
    {keywords:'Damen Halskette Schmuck',category:'Ketten'},
    {keywords:'Damen Ring Schmuck',category:'Ringe'},
    {keywords:'Damen Armband Schmuck',category:'Armbänder'},
    {keywords:'Damen Ohrringe Schmuck',category:'Ohrringe'},
    {keywords:'Damen Anhänger Schmuck',category:'Anhänger'}
  ],
  men:[
    {keywords:'Herren Halskette Schmuck',category:'Ketten'},
    {keywords:'Herren Ring Schmuck',category:'Ringe'},
    {keywords:'Herren Armband Schmuck',category:'Armbänder'},
    {keywords:'Herren Ohrringe Schmuck',category:'Ohrringe'},
    {keywords:'Herren Anhänger Schmuck',category:'Anhänger'}
  ]
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
  if(!item.asin||!title||!image)return null;
  return {asin:item.asin,parentAsin:item.parentASIN||item.parentAsin||item.asin,title,brand,image,price:value(money),amount:money?.amount??null,currency:money?.currency||'EUR',url:item.detailPageURL||`https://www.amazon.de/dp/${item.asin}?tag=${PARTNER_TAG}`,gender,category,available:money?.amount!=null};
}

async function searchOne(token,{keywords,category},gender){
  const response=await fetch('https://creatorsapi.amazon/catalog/v1/searchItems',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json','x-marketplace':MARKETPLACE},body:JSON.stringify({partnerTag:PARTNER_TAG,marketplace:MARKETPLACE,keywords,itemCount:10,searchIndex:'Fashion',resources:['images.primary.large','itemInfo.title','itemInfo.byLineInfo','offersV2.listings.price','parentASIN']})});
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
    const seen=new Set();
    const products=[];
    for(const bucket of buckets){
      for(const product of bucket){
        const key=product.parentAsin||product.asin;
        if(!product.available||seen.has(key))continue;
        seen.add(key);
        products.push(product);
        if(products.filter(p=>p.category===product.category).length===5)break;
      }
    }
    res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({products,count:products.length,requested:25,partnerTag:PARTNER_TAG,updatedAt:new Date().toISOString()});
  }catch(error){
    const products=globalThis.SCHMUCK_PRODUCTS?.[gender]||[];
    res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({products,count:products.length,requested:25,partnerTag:PARTNER_TAG,updatedAt:globalThis.SCHMUCK_PRODUCTS?.updatedAt,source:'verified-cache'});
  }
}
