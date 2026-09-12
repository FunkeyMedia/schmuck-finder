let tokenCache={value:null,expires:0};
const MARKETPLACE='www.amazon.de';
const PARTNER_TAG=process.env.AMAZON_PARTNER_TAG||'Onlinestarkei-21';
const searches={women:['Damen Schmuck 925 Silber','Damen Schmuck Gold Kette','Damen Ringe Schmuck','Damen Ohrringe Schmuck','Damen Armband Schmuck'],men:['Herren Schmuck 925 Silber','Herren Kette Schmuck','Herren Ring Schmuck','Herren Armband Schmuck','Herren Anhänger Schmuck']};

async function accessToken(){
  if(tokenCache.value&&Date.now()<tokenCache.expires)return tokenCache.value;
  const id=process.env.AMAZON_CREATORS_CREDENTIAL_ID;
  const secret=process.env.AMAZON_CREATORS_CREDENTIAL_SECRET;
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
  const image=item.images?.primary?.large?.url||item.images?.primary?.medium?.url||item.images?.primary?.small?.url;
  if(!item.asin||!title||!image)return null;
  return {asin:item.asin,parentAsin:item.parentASIN||item.parentAsin||item.asin,title,brand,image,price:value(price),amount:price?.amount??null,currency:price?.currency||'EUR',url:item.detailPageURL||`https://www.amazon.de/dp/${item.asin}?tag=${PARTNER_TAG}`,gender,category,available:Boolean(price)};
}

async function searchOne(token,keywords,gender,index){
  const response=await fetch('https://creatorsapi.amazon/catalog/v1/searchItems',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json','x-marketplace':MARKETPLACE},body:JSON.stringify({partnerTag:PARTNER_TAG,marketplace:MARKETPLACE,keywords,itemCount:10,searchIndex:'Fashion',resources:['images.primary.large','itemInfo.title','itemInfo.byLineInfo','offersV2.listings.price','parentASIN']})});
  if(!response.ok){const detail=await response.text();throw new Error(`Amazon search failed (${response.status}): ${detail.slice(0,180)}`)}
  const data=await response.json();
  const label=['Ketten','Ringe','Armbänder','Ohrringe','Anhänger'][index]||'Schmuck';
  return (data.searchResult?.items||[]).map(x=>normalize(x,gender,label)).filter(Boolean);
}

export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const gender=req.query?.gender==='men'?'men':'women';
  try{
    const token=await accessToken();
    const all=[];
    for(let i=0;i<searches[gender].length;i++){
      if(i)await new Promise(resolve=>setTimeout(resolve,1050));
      all.push(...await searchOne(token,searches[gender][i],gender,i));
    }
    const seen=new Set();
    const products=all.filter(p=>{const key=p.parentAsin||p.asin;if(seen.has(key))return false;seen.add(key);return true}).slice(0,50);
    res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({products,count:products.length,requested:50,partnerTag:PARTNER_TAG,updatedAt:new Date().toISOString()});
  }catch(error){
    return res.status(503).json({products:[],count:0,requested:50,error:'Amazon Creators API ist noch nicht freigeschaltet oder konfiguriert.',detail:process.env.NODE_ENV==='development'?error.message:undefined});
  }
}
