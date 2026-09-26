(() => {
  const catalog = globalThis.SCHMUCK_PRODUCTS;
  if (!catalog) return;

  const elements = {
    gender: document.querySelector('#finder-gender'),
    category: document.querySelector('#finder-category'),
    material: document.querySelector('#finder-material'),
    budget: document.querySelector('#finder-budget'),
    search: document.querySelector('#finder-search'),
    reset: document.querySelector('#finder-reset'),
    more: document.querySelector('#finder-more'),
    count: document.querySelector('#finder-count'),
    results: document.querySelector('#finder-results')
  };
  if (!elements.results) return;

  const params = new URLSearchParams(location.search);
  const categoryMap = { ketten: 'Ketten', ringe: 'Ringe', armbaender: 'Armbänder', ohrringe: 'Ohrringe', anhaenger: 'Anhänger' };
  elements.gender.value = params.get('gender') === 'men' ? 'men' : 'women';
  elements.category.value = categoryMap[params.get('category')] || '';
  elements.search.value = params.get('brand') || '';
  let visible = 12;

  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const matchesBudget = (amount, budget) => !budget || (budget === '50' ? amount < 50 : budget === '100' ? amount >= 50 && amount <= 100 : amount > 100);
  const productCard = product => `<article class="product-card"><a href="${escapeHtml(product.url)}" rel="nofollow sponsored noopener" target="_blank" data-product-click data-asin="${escapeHtml(product.asin)}" data-brand="${escapeHtml(product.brand)}"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.brand)} ${escapeHtml(product.title)}" loading="lazy" width="500" height="500"><span>${escapeHtml(product.brand)}</span><h2>${escapeHtml(product.title)}</h2><strong>${escapeHtml(product.price || 'Preis bei Amazon prüfen')}</strong><b>Bei Amazon ansehen →</b></a></article>`;

  function filtered() {
    const query = elements.search.value.trim().toLowerCase();
    return (catalog[elements.gender.value] || []).filter(product => {
      const haystack = `${product.brand} ${product.title}`.toLowerCase();
      return (!elements.category.value || product.category === elements.category.value)
        && (!elements.material.value || haystack.includes(elements.material.value))
        && matchesBudget(product.amount, elements.budget.value)
        && (!query || haystack.includes(query));
    });
  }

  function render() {
    const products = filtered();
    const shown = products.slice(0, visible);
    elements.count.textContent = `${products.length} Treffer für ${elements.gender.value === 'men' ? 'Men' : 'Women'}`;
    elements.results.innerHTML = shown.length ? `<div class="product-grid">${shown.map(productCard).join('')}</div>` : '<div class="empty-result"><h3>Keine passende Kombination gefunden</h3><p>Öffne einen Filter oder setze die Auswahl zurück.</p></div>';
    elements.more.hidden = shown.length >= products.length;
    history.replaceState(null, '', `${location.pathname}?gender=${elements.gender.value}`);
    document.dispatchEvent(new CustomEvent('sf:finder-result', { detail: { gender: elements.gender.value, count: products.length } }));
  }

  [elements.gender, elements.category, elements.material, elements.budget].forEach(element => element.addEventListener('change', () => { visible = 12; render(); }));
  elements.search.addEventListener('input', () => { visible = 12; render(); });
  elements.more.addEventListener('click', () => { visible += 12; render(); });
  elements.reset.addEventListener('click', () => {
    elements.gender.value = 'women';
    elements.category.value = '';
    elements.material.value = '';
    elements.budget.value = '';
    elements.search.value = '';
    visible = 12;
    render();
  });
  render();
})();
