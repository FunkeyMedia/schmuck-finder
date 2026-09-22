import '../products-data.js';
import {createPriceService} from '../lib/live-price-server.cjs';
const allowed=[...(globalThis.SCHMUCK_PRODUCTS?.women||[]),...(globalThis.SCHMUCK_PRODUCTS?.men||[])].map(p=>p.asin);
const prices=createPriceService({allowed});
export default async function handler(req,res){if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed'});try{const data=await prices(String(req.query.asins||'').split(',').filter(Boolean));res.setHeader('Cache-Control','public, max-age=60, s-maxage=300');return res.status(200).json(data)}catch(error){res.setHeader('Cache-Control','no-store');return res.status(error.message.includes('selection')?400:503).json({items:[],error:'temporarily_unavailable'})}}
