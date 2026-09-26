(() => {
  const emit = (name, detail = {}) => {
    const event = { name, detail, path: location.pathname, timestamp: new Date().toISOString() };
    globalThis.dataLayer = globalThis.dataLayer || [];
    globalThis.dataLayer.push({ event: name, ...detail, page_path: location.pathname });
    document.dispatchEvent(new CustomEvent('sf:analytics', { detail: event }));
  };

  document.addEventListener('click', event => {
    const product = event.target.closest('[data-product-click]');
    if (product) emit('affiliate_product_click', { asin: product.dataset.asin, brand: product.dataset.brand });
  });
  document.addEventListener('sf:finder-result', event => emit('finder_result', event.detail));
})();
