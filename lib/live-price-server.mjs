export function createPriceService({ allowed, gatewayUrl = process.env.AMAZON_CATALOG_GATEWAY_URL, secret = process.env.AMAZON_CATALOG_GATEWAY_SECRET, fetchImpl = fetch, now = Date.now }) {
  const accepted = new Set(allowed), cache = new Map();
  return async function getPrices(ids) {
    ids = [...new Set(ids)];
    if (!ids.length || ids.length > 10 || ids.some(id => !accepted.has(id))) throw Error('Invalid product selection');
    if (!gatewayUrl || !secret) throw Error('Amazon price access unavailable');
    const missing = ids.filter(id => !cache.has(id) || cache.get(id).expiresAt <= now());
    if (missing.length) {
      const response = await fetchImpl(gatewayUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }, body: JSON.stringify({ operation: 'getItems', request: { itemIds: missing, itemIdType: 'ASIN', resources: ['offersV2.listings.price', 'offersV2.listings.availability'] } }), signal: AbortSignal.timeout(25000) });
      if (!response.ok) throw Error('Amazon price request failed');
      const data = await response.json(), checked = now();
      const items = (data.itemsResult || data.itemResults)?.items;
      if (!Array.isArray(items) && !Array.isArray(data.errors)) throw Error('Invalid Amazon response');
      for (const id of missing) {
        const item = items?.find(item => item.asin === id);
        const listings = item?.offersV2?.listings || [];
        const offer = listings.find(item => item.isBuyBoxWinner && !item.violatesMAP) || listings.find(item => !item.violatesMAP && item.type !== 'SUBSCRIBE_AND_SAVE');
        const money = offer?.price?.money;
        const available = !/OUT.?OF.?STOCK|UNAVAILABLE/i.test(offer?.availability?.type || '');
        const valid = available && money?.currency === 'EUR' && Number.isFinite(money.amount) && money.amount > 0;
        const expiresAt = checked + (valid ? 1800000 : 60000);
        cache.set(id, { expiresAt, item: valid ? { asin: id, amount: money.amount, currency: 'EUR', displayAmount: money.displayAmount || new Intl.NumberFormat('de-DE', {style:'currency',currency:'EUR'}).format(money.amount), updatedAt: new Date(checked).toISOString(), expiresAt } : null });
      }
    }
    return { items: ids.flatMap(id => cache.get(id)?.item ? [cache.get(id).item] : []), missing: ids.filter(id => !cache.get(id)?.item) };
  };
}
