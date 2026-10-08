// Site « Vols directs depuis Lyon » : lit data.json, affiche la carte et la liste.
// Aucun jeton ici : le navigateur ne parle jamais à l'API Travelpayouts.

const $ = (id) => document.getElementById(id);

const els = {
  title: $('title'),
  stats: $('stats'),
  budget: $('budget'),
  budgetValue: $('budget-value'),
  month: $('month'),
  country: $('country'),
  sort: $('sort'),
  count: $('result-count'),
  cards: $('cards'),
};

const fmtPrice = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const fmtDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const fmtMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const fmtUpdated = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const OSM_ATTRIBUTION = '&copy; <a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const PRICE_ZOOM = 6;          // à partir de ce zoom, les prix s'affichent sur la carte
const NEAR_KM = 4000;          // cadrage initial : destinations à moins de 4 000 km

let data = null;
let map = null;
let markersLayer = null;
const markersByCode = new Map();

init();

async function init() {
  setupMap();
  try {
    const res = await fetch('data.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch {
    els.stats.textContent = 'Les données ne sont pas encore disponibles. Revenez un peu plus tard.';
    return;
  }

  setupHeader();
  setupFilters();
  render(true);
}

// ---------------------------------------------------------------------------
// En-tête : titre, nombre de destinations, date de mise à jour
// ---------------------------------------------------------------------------
function setupHeader() {
  const title = `Vols directs depuis ${data.origin.city}`;
  els.title.textContent = title;
  document.title = title;
  els.stats.innerHTML =
    `<strong>${data.count}</strong> destination${data.count > 1 ? 's' : ''} · ` +
    `mis à jour le ${escapeHtml(fmtUpdated.format(new Date(data.updated_at)))}`;
}

// ---------------------------------------------------------------------------
// Filtres
// ---------------------------------------------------------------------------
function setupFilters() {
  // Mois : uniquement ceux pour lesquels on a au moins un prix.
  const months = (data.months || []).filter((m) => data.destinations.some((d) => d.months?.[m]));
  for (const m of months) {
    els.month.add(new Option(capitalize(fmtMonth.format(monthToDate(m))), m));
  }

  // Pays, triés par ordre alphabétique.
  const countries = [...new Set(data.destinations.map((d) => d.country).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'fr'));
  for (const c of countries) els.country.add(new Option(c, c));

  // Budget : de 0 au prix le plus élevé trouvé (arrondi à la dizaine supérieure).
  const allPrices = data.destinations.flatMap((d) => Object.values(d.months || {}).map((o) => o.price).concat(d.price));
  const max = Math.max(10, Math.ceil(Math.max(...allPrices) / 10) * 10);
  els.budget.max = max;
  els.budget.value = max;

  for (const el of [els.budget, els.month, els.country, els.sort]) {
    el.addEventListener('input', () => render(false));
  }
}

// Renvoie l'offre affichée pour une destination selon le mois choisi.
function offerFor(dest, month) {
  if (!month) return dest;
  return dest.months?.[month] || null;
}

function currentResults() {
  const month = els.month.value;
  const country = els.country.value;
  const budget = Number(els.budget.value);

  const rows = [];
  for (const dest of data.destinations) {
    const offer = offerFor(dest, month);
    if (!offer) continue;
    if (country && dest.country !== country) continue;
    if (offer.price > budget) continue;
    rows.push({ dest, offer });
  }

  const sorters = {
    'price-asc': (a, b) => a.offer.price - b.offer.price,
    'price-desc': (a, b) => b.offer.price - a.offer.price,
    date: (a, b) => a.offer.date.localeCompare(b.offer.date),
    city: (a, b) => a.dest.city.localeCompare(b.dest.city, 'fr'),
  };
  return rows.sort(sorters[els.sort.value] || sorters['price-asc']);
}

// ---------------------------------------------------------------------------
// Affichage (carte + liste)
// ---------------------------------------------------------------------------
function render(fitMap) {
  const rows = currentResults();
  els.budgetValue.textContent = fmtPrice.format(Number(els.budget.value));
  els.count.textContent = `${rows.length} destination${rows.length > 1 ? 's' : ''} affichée${rows.length > 1 ? 's' : ''}`;
  renderMarkers(rows, fitMap);
  renderCards(rows);
}

function renderCards(rows) {
  if (rows.length === 0) {
    els.cards.innerHTML = '<li class="empty">Aucune destination ne correspond à ces filtres.</li>';
    return;
  }
  els.cards.innerHTML = rows.map(({ dest, offer }) => `
    <li class="card">
      <div class="card-top">
        <div>
          <h2 class="card-city">${escapeHtml(dest.city)}<span class="card-code">${escapeHtml(dest.code)}</span></h2>
          <div class="card-country">${escapeHtml(dest.country)}${dest.airport ? ' · ' + escapeHtml(dest.airport) : ''}</div>
        </div>
        <div class="card-price"><small>à partir de</small><strong>${fmtPrice.format(offer.price)}</strong></div>
      </div>
      <ul class="card-details">
        <li>📅 ${escapeHtml(formatDay(offer.date))}</li>
        <li>🛫 ${escapeHtml(offer.airline)}</li>
        ${offer.duration ? `<li>⏱ ${formatDuration(offer.duration)}</li>` : ''}
      </ul>
      <div class="card-actions">
        <a class="btn btn-primary" href="${escapeHtml(offer.link)}" target="_blank" rel="sponsored noopener">Voir les vols</a>
        <button class="btn btn-ghost" type="button" data-show="${escapeHtml(dest.code)}" aria-label="Voir ${escapeHtml(dest.city)} sur la carte">📍 Carte</button>
      </div>
    </li>`).join('');
}

// Bouton « Carte » d'une fiche : remonte à la carte et ouvre la bulle.
els.cards.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-show]');
  if (!btn) return;
  const marker = markersByCode.get(btn.dataset.show);
  if (!marker) return;
  document.querySelector('.map-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
  map.setView(marker.getLatLng(), Math.max(map.getZoom(), 5));
  marker.openPopup();
});

// ---------------------------------------------------------------------------
// Carte Leaflet + fond OpenStreetMap (style épuré, noms en français)
// ---------------------------------------------------------------------------
function setupMap() {
  map = L.map('map', { worldCopyJump: true, zoomControl: true }).setView([45.76, 4.84], 4);
  markersLayer = L.layerGroup().addTo(map);
  const toggleLabels = () => map.getContainer().classList.toggle('show-prices', map.getZoom() >= PRICE_ZOOM);
  map.on('zoomend', toggleLabels);
  toggleLabels();
  addFrenchBaseMap().catch((err) => {
    console.warn("Fond de carte vectoriel indisponible :", err);
    // Secours si le fond vectoriel ne charge pas : tuiles OpenStreetMap classiques.
    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> France',
    }).addTo(map);
  });
}

// Charge le style de carte puis remplace chaque nom affiché par sa version
// française (name:fr), avec repli sur le nom en alphabet latin.
async function addFrenchBaseMap() {
  if (!L.maplibreGL) throw new Error('MapLibre indisponible');
  const res = await fetch(MAP_STYLE);
  if (!res.ok) throw new Error(res.status);
  const style = await res.json();
  for (const layer of style.layers) {
    const field = layer.layout?.['text-field'];
    if (field && JSON.stringify(field).includes('name')) {
      layer.layout['text-field'] = ['coalesce', ['get', 'name:fr'], ['get', 'name:latin'], ['get', 'name']];
    }
  }
  L.maplibreGL({ style, attribution: OSM_ATTRIBUTION }).addTo(map);
}

function renderMarkers(rows, fitMap) {
  markersLayer.clearLayers();
  markersByCode.clear();

  const origin = data.origin;
  const points = [];
  if (origin.lat != null) {
    L.marker([origin.lat, origin.lon], {
      icon: L.divIcon({ className: '', html: '<div class="origin-pin"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }),
      title: origin.city,
      zIndexOffset: 1000,
    }).bindPopup(`<div class="popup-city">${escapeHtml(origin.city)}</div><div class="popup-meta">Aéroport de départ</div>`)
      .addTo(markersLayer);
    points.push([origin.lat, origin.lon]);
  }

  for (const { dest, offer } of rows) {
    const marker = L.marker([dest.lat, dest.lon], {
      icon: L.divIcon({
        className: '',
        html: `<span class="price-pin ${priceTier(offer.price)}">${fmtPrice.format(offer.price)}</span>`,
        iconSize: [0, 0],
      }),
      title: dest.city,
      riseOnHover: true,
    });
    marker.bindPopup(`
      <div class="popup-city">${escapeHtml(dest.city)} (${escapeHtml(dest.code)})</div>
      <div class="popup-meta">${escapeHtml(dest.country)} · ${escapeHtml(formatDay(offer.date))}</div>
      <div class="popup-price">à partir de ${fmtPrice.format(offer.price)}</div>
      <a class="btn" href="${escapeHtml(offer.link)}" target="_blank" rel="sponsored noopener">Voir les vols</a>`);
    marker.addTo(markersLayer);
    markersByCode.set(dest.code, marker);
    // Les destinations lointaines (Montréal, Dubaï…) restent visibles en dézoomant.
    if (origin.lat == null || map.distance([origin.lat, origin.lon], [dest.lat, dest.lon]) < NEAR_KM * 1000) {
      points.push([dest.lat, dest.lon]);
    }
  }

  if (fitMap && points.length > 1) {
    map.fitBounds(points, { padding: [20, 20], maxZoom: 5 });
  }
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------
// Couleur du point selon le prix (voir la légende sous la carte).
function priceTier(price) {
  if (price <= 40) return 'tier-low';
  if (price <= 80) return 'tier-mid';
  return 'tier-high';
}

function formatDay(iso) {
  // On garde la date locale du vol (partie AAAA-MM-JJ) sans décalage horaire.
  return fmtDay.format(new Date(`${iso.slice(0, 10)}T12:00:00`));
}

function formatDuration(min) {
  const h = Math.floor(min / 60);
  const m = String(min % 60).padStart(2, '0');
  return h ? `${h} h ${m}` : `${min} min`;
}

function monthToDate(m) {
  return new Date(`${m}-15T12:00:00`);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
