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
// Carte Leaflet + OpenStreetMap
// ---------------------------------------------------------------------------
function setupMap() {
  map = L.map('map', { worldCopyJump: true, zoomControl: true }).setView([45.76, 4.84], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
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
        html: `<span class="price-pin">${fmtPrice.format(offer.price)}</span>`,
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
    points.push([dest.lat, dest.lon]);
  }

  if (fitMap && points.length > 1) {
    map.fitBounds(points, { padding: [30, 30], maxZoom: 6 });
  }
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------
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
