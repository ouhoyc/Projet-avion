// Site « Vols directs depuis Lyon » : lit data.json, affiche la carte et la liste.
// Aucun jeton ici : le navigateur ne parle jamais à l'API Travelpayouts.

const $ = (id) => document.getElementById(id);

const els = {
  originCode: $('origin-code'),
  titleCity: $('title-city'),
  stats: $('stats'),
  updated: $('updated'),
  deals: $('deals'),
  months: $('months'),
  more: $('more'),
  badge: $('filter-badge'),
  budget: $('budget'),
  budgetValue: $('budget-value'),
  country: $('country'),
  sort: $('sort'),
  reset: $('reset'),
  count: $('result-count'),
  cards: $('cards'),
};

const fmtPrice = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const fmtDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtDayShort = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const fmtMonth = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
const fmtMonthYear = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' });
const fmtRelative = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const PRICE_ZOOM = 6;   // à partir de ce zoom, les prix s'affichent sur la carte
const NEAR_KM = 4000;   // cadrage initial : destinations à moins de 4 000 km
const DEALS_COUNT = 8;  // nombre de « meilleures affaires » en haut de page

// Vérification du prix en direct (fonction serverless api/prix.js sur Vercel).
const LIVE_PRICE_URL = 'https://projet-avion.vercel.app/api/prix';

// Réservation sur Kiwi.com (en français, en euros, vols directs).
// Quand le programme Kiwi.com est rejoint dans Travelpayouts, coller ici le modèle
// de lien d'affiliation fourni, avec {url} à la place du lien Kiwi encodé.
// Exemple : 'https://c111.travelpayouts.com/click?shmarker=787111&promo_id=3791&source_type=customlink&type=click&custom_url={url}'
const KIWI_AFFILIATE_TEMPLATE = '';

const state = { month: '' };
let data = null;
let map = null;
let markersLayer = null;
let budgetMax = 0;
const markersByCode = new Map();

init();

async function init() {
  setupMap();
  try {
    const res = await fetch('data.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch {
    els.updated.querySelector('span').textContent = 'Données indisponibles pour le moment. Reviens un peu plus tard.';
    els.cards.innerHTML = '';
    els.cards.removeAttribute('aria-busy');
    return;
  }

  setupHeader();
  renderDeals();
  setupFilters();
  render(true);
}

// ---------------------------------------------------------------------------
// En-tête : ville, chiffres clés, date de mise à jour
// ---------------------------------------------------------------------------
function setupHeader() {
  const { origin, destinations } = data;
  els.originCode.textContent = origin.code;
  els.titleCity.textContent = origin.city;
  document.title = `Vols directs depuis ${origin.city}`;

  const minPrice = Math.min(...destinations.map((d) => d.price));
  const countries = new Set(destinations.map((d) => d.country).filter(Boolean)).size;
  els.stats.innerHTML = [
    [data.count, data.count > 1 ? 'destinations' : 'destination'],
    [fmtPrice.format(minPrice), 'prix mini'],
    [countries, 'pays'],
  ].map(([value, label]) => `<li><strong>${escapeHtml(value)}</strong><span>${label}</span></li>`).join('');

  els.updated.querySelector('span').textContent = `Mis à jour ${relativeTime(new Date(data.updated_at))}`;
}

// ---------------------------------------------------------------------------
// Les meilleures affaires : les moins chères, toutes dates confondues
// ---------------------------------------------------------------------------
function renderDeals() {
  const top = [...data.destinations].sort((a, b) => a.price - b.price).slice(0, DEALS_COUNT);
  els.deals.innerHTML = top.map((d, i) => `
    <li>
      <button type="button" class="deal" data-book="${escapeHtml(d.code)}" data-m=""
         aria-label="${escapeHtml(`${d.city}, ${d.country} : dernier prix repéré ${fmtPrice.format(d.price)} le ${formatDay(d.date)}. Vérifier le prix et réserver`)}">
        <span class="deal-top"><span class="deal-rank">${i + 1}</span>${flag(d.country_code)} ${escapeHtml(d.country)}</span>
        <span class="deal-city">${escapeHtml(d.city)}</span>
        <span class="deal-bottom">
          <span>
            <span class="deal-price">${fmtPrice.format(d.price)}</span><br>
            <span class="deal-date">${escapeHtml(formatDayShort(d.date))}${d.found_at ? ` · vu ${seenLabel(d.found_at)}` : ''}</span>
          </span>
          <span class="deal-go"><svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></span>
        </span>
      </button>
    </li>`).join('');
}

// ---------------------------------------------------------------------------
// Filtres
// ---------------------------------------------------------------------------
function setupFilters() {
  // Mois : boutons « puces », uniquement ceux pour lesquels on a au moins un prix.
  const thisYear = new Date().getFullYear();
  const months = (data.months || []).filter((m) => data.destinations.some((d) => d.months?.[m]));
  const chip = (value, label) =>
    `<button type="button" class="chip" data-month="${value}" aria-pressed="${value === state.month}">${label}</button>`;
  els.months.innerHTML = chip('', 'Toutes dates') + months.map((m) => {
    const date = monthToDate(m);
    const label = date.getFullYear() === thisYear ? fmtMonth.format(date) : fmtMonthYear.format(date);
    return chip(m, capitalize(label.replace('.', '')));
  }).join('');
  els.months.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-month]');
    if (!btn) return;
    state.month = btn.dataset.month;
    for (const b of els.months.children) b.setAttribute('aria-pressed', b === btn);
    render(false);
  });

  // Pays, triés par ordre alphabétique.
  const countries = [...new Set(data.destinations.map((d) => d.country).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'fr'));
  for (const c of countries) els.country.add(new Option(c, c));

  // Budget : de 0 au prix le plus élevé trouvé (arrondi à la dizaine supérieure).
  const allPrices = data.destinations.flatMap((d) => Object.values(d.months || {}).map((o) => o.price).concat(d.price));
  budgetMax = Math.max(10, Math.ceil(Math.max(...allPrices) / 10) * 10);
  els.budget.max = budgetMax;
  els.budget.value = budgetMax;

  for (const el of [els.budget, els.country, els.sort]) {
    el.addEventListener('input', () => render(false));
  }

  els.reset.addEventListener('click', () => {
    state.month = '';
    for (const b of els.months.children) b.setAttribute('aria-pressed', b.dataset.month === '');
    els.budget.value = budgetMax;
    els.country.value = '';
    els.sort.value = 'price-asc';
    render(false);
  });
}

// Renvoie l'offre affichée pour une destination selon le mois choisi.
function offerFor(dest, month) {
  if (!month) return dest;
  return dest.months?.[month] || null;
}

function currentResults() {
  const country = els.country.value;
  const budget = Number(els.budget.value);

  const rows = [];
  for (const dest of data.destinations) {
    const offer = offerFor(dest, state.month);
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

// Nombre de filtres actifs dans le panneau « Filtres » (pastille bleue).
function updateBadge() {
  const active = [
    Number(els.budget.value) < budgetMax,
    els.country.value !== '',
    els.sort.value !== 'price-asc',
  ].filter(Boolean).length;
  els.badge.hidden = active === 0;
  els.badge.textContent = active;
}

// ---------------------------------------------------------------------------
// Affichage (carte + liste)
// ---------------------------------------------------------------------------
function render(fitMap) {
  const rows = currentResults();
  els.budgetValue.textContent = fmtPrice.format(Number(els.budget.value));
  els.count.textContent = `${rows.length} résultat${rows.length > 1 ? 's' : ''}`;
  updateBadge();
  renderMarkers(rows, fitMap);
  renderCards(rows);
}

function renderCards(rows) {
  els.cards.removeAttribute('aria-busy');
  if (rows.length === 0) {
    els.cards.innerHTML = `
      <li class="empty">
        <svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>
        <p>Aucune destination ne correspond à ces filtres.</p>
        <button type="button" class="btn btn-text" data-reset>Réinitialiser les filtres</button>
      </li>`;
    return;
  }
  els.cards.innerHTML = rows.map(({ dest, offer }, i) => `
    <li class="card ${priceTier(offer.price)}" style="--i:${Math.min(i, 12)}">
      <div class="card-top">
        <span class="flag" aria-hidden="true">${flag(dest.country_code)}</span>
        <div class="card-title">
          <h3 class="card-city">${escapeHtml(dest.city)}<span class="code">${escapeHtml(dest.code)}</span></h3>
          <p class="card-sub">${escapeHtml(dest.country)}${dest.airport ? ' · ' + escapeHtml(dest.airport) : ''}</p>
        </div>
        <p class="card-price"><small>prix repéré</small><strong>${fmtPrice.format(offer.price)}</strong></p>
      </div>
      <ul class="meta">
        <li><svg class="icon" aria-hidden="true"><use href="#i-calendar"/></svg>${escapeHtml(formatDay(offer.date))}</li>
        <li><svg class="icon" aria-hidden="true"><use href="#i-plane"/></svg>${escapeHtml(offer.airline)}</li>
        ${offer.duration ? `<li><svg class="icon" aria-hidden="true"><use href="#i-clock"/></svg>${formatDuration(offer.duration)}</li>` : ''}
        ${offer.found_at ? `<li class="seen"><svg class="icon" aria-hidden="true"><use href="#i-refresh"/></svg>Prix vu ${seenLabel(offer.found_at)}</li>` : ''}
      </ul>
      <div class="card-actions">
        <button type="button" class="btn btn-primary" data-book="${escapeHtml(dest.code)}" data-m="${escapeHtml(state.month)}">
          Voir les vols <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>
        </button>
        <button class="btn btn-secondary" type="button" data-show="${escapeHtml(dest.code)}" aria-label="Voir ${escapeHtml(dest.city)} sur la carte">
          <svg class="icon" aria-hidden="true"><use href="#i-pin"/></svg>
        </button>
      </div>
    </li>`).join('');
}

els.cards.addEventListener('click', (e) => {
  if (e.target.closest('[data-reset]')) { els.reset.click(); return; }

  // Bouton « carte » d'une fiche : remonte à la carte et ouvre la bulle.
  const btn = e.target.closest('[data-show]');
  if (!btn) return;
  const marker = markersByCode.get(btn.dataset.show);
  if (!marker) return;
  document.querySelector('.map-frame').scrollIntoView({ behavior: 'smooth', block: 'center' });
  map.setView(marker.getLatLng(), Math.max(map.getZoom(), PRICE_ZOOM));
  marker.openPopup();
});

// ---------------------------------------------------------------------------
// Carte Leaflet + fond OpenStreetMap (style épuré, noms en français)
// ---------------------------------------------------------------------------
function setupMap() {
  // Pas de bandeau « Leaflet » : les crédits OpenStreetMap sont sous la carte.
  map = L.map('map', { worldCopyJump: true, zoomControl: true, attributionControl: false }).setView([45.76, 4.84], 4);
  markersLayer = L.layerGroup().addTo(map);
  const toggleLabels = () => map.getContainer().classList.toggle('show-prices', map.getZoom() >= PRICE_ZOOM);
  map.on('zoomend', toggleLabels);
  toggleLabels();
  addFrenchBaseMap().catch((err) => {
    console.warn('Fond de carte vectoriel indisponible :', err);
    // Secours si le fond vectoriel ne charge pas : tuiles OpenStreetMap classiques.
    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
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
  L.maplibreGL({ style }).addTo(map);
}

function renderMarkers(rows, fitMap) {
  markersLayer.clearLayers();
  markersByCode.clear();

  const origin = data.origin;
  const points = [];
  if (origin.lat != null) {
    L.marker([origin.lat, origin.lon], {
      icon: L.divIcon({ className: '', html: '<div class="origin-pin"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
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
      title: `${dest.city} – ${fmtPrice.format(offer.price)}`,
      riseOnHover: true,
    });
    marker.bindPopup(`
      <div class="popup-city">${flag(dest.country_code)} ${escapeHtml(dest.city)}</div>
      <div class="popup-meta">${escapeHtml(dest.country)} · ${escapeHtml(formatDay(offer.date))} · ${escapeHtml(offer.airline)}</div>
      <div class="popup-price"><small>prix repéré</small> ${fmtPrice.format(offer.price)}</div>
      ${offer.found_at ? `<div class="popup-meta">Prix vu ${seenLabel(offer.found_at)}</div>` : ''}
      <button type="button" class="btn btn-primary" data-book="${escapeHtml(dest.code)}" data-m="${escapeHtml(state.month)}">Voir les vols</button>`,
      { autoPanPaddingTopLeft: [56, 16], autoPanPaddingBottomRight: [16, 16], maxWidth: 260 });
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
// Panneau de réservation : vérifie le prix en direct puis envoie sur Kiwi.com
// ---------------------------------------------------------------------------
const sheet = $('sheet');
let liveRequest = 0;

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-book]');
  if (btn) openSheet(btn.dataset.book, btn.dataset.m || '');
});
sheet.addEventListener('click', (e) => {
  // Clic sur le fond sombre ou sur « Fermer » : on ferme.
  if (e.target === sheet || e.target.closest('[data-close]')) sheet.close();
});

function openSheet(code, month) {
  const dest = data.destinations.find((d) => d.code === code);
  if (!dest) return;
  const offer = offerFor(dest, month) || dest;
  const day = offer.date.slice(0, 10);
  const link = kiwiLink(data.origin.code, dest.code, day);

  sheet.innerHTML = `
    <div class="sheet-body">
      <div class="sheet-grip" aria-hidden="true"></div>
      <button type="button" class="sheet-close" data-close aria-label="Fermer">
        <svg class="icon" aria-hidden="true"><use href="#i-close"/></svg>
      </button>
      <p class="sheet-route">${escapeHtml(data.origin.city)} <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg> ${escapeHtml(dest.code)}</p>
      <h2 class="sheet-city">${flag(dest.country_code)} ${escapeHtml(dest.city)}</h2>
      <p class="sheet-date"><svg class="icon" aria-hidden="true"><use href="#i-calendar"/></svg>${escapeHtml(formatDay(offer.date))} · aller simple · vol direct</p>

      <div class="live" id="live" aria-live="polite">
        <div class="live-loading"><span class="spinner" aria-hidden="true"></span>Vérification du prix en direct…</div>
      </div>

      <p class="sheet-seen">Dernier prix repéré : <strong>${fmtPrice.format(offer.price)}</strong>${offer.found_at ? ` (vu ${seenLabel(offer.found_at)})` : ''}, ${escapeHtml(offer.airline)}</p>

      <a class="btn btn-primary btn-block" href="${escapeHtml(link)}" target="_blank" rel="sponsored noopener">
        Réserver sur Kiwi.com <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>
      </a>
      <p class="sheet-note">Tu seras redirigé vers Kiwi.com (en français, prix en euros) pour choisir ton vol et payer.</p>
    </div>`;
  sheet.showModal();
  checkLivePrice(dest, day);
}

async function checkLivePrice(dest, day) {
  const id = ++liveRequest;
  const box = () => (id === liveRequest ? $('live') : null); // ignore une réponse arrivée trop tard
  let result = null;
  try {
    const res = await fetch(`${LIVE_PRICE_URL}?to=${encodeURIComponent(dest.code)}&date=${day}`);
    if (res.ok) result = await res.json();
  } catch { /* hors ligne ou service indisponible */ }

  const el = box();
  if (!el) return;
  if (result?.status === 'ok') {
    const price = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: result.currency || 'EUR', maximumFractionDigits: 0 }).format(result.price);
    const details = [result.airline, result.departure ? `départ ${String(result.departure).slice(11, 16)}` : null, result.duration ? formatDuration(result.duration) : null]
      .filter(Boolean).map(escapeHtml).join(' · ');
    el.innerHTML = `
      <p class="live-label"><span class="live-dot" aria-hidden="true"></span>Prix vérifié à l'instant</p>
      <p class="live-price">${price}</p>
      ${details ? `<p class="live-details">${details}</p>` : ''}`;
  } else if (result?.status === 'none') {
    el.innerHTML = `<p class="live-label warn">Plus de vol direct trouvé ce jour-là</p>
      <p class="live-details">Les places à ce prix sont peut-être parties. Kiwi.com te proposera les autres dates.</p>`;
  } else {
    el.innerHTML = `<p class="live-label muted">Vérification en direct indisponible</p>
      <p class="live-details">Le prix exact s'affichera sur Kiwi.com.</p>`;
  }
}

// Lien de recherche Kiwi.com (avec le suivi d'affiliation une fois configuré).
function kiwiLink(from, to, day) {
  const params = new URLSearchParams({ from, to, departure: day, lang: 'fr', currency: 'EUR', stopNumber: '0' });
  const url = `https://www.kiwi.com/deep?${params}`;
  return KIWI_AFFILIATE_TEMPLATE ? KIWI_AFFILIATE_TEMPLATE.replace('{url}', encodeURIComponent(url)) : url;
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

// Couleur selon le prix (voir la légende sous la carte).
function priceTier(price) {
  if (price <= 40) return 'tier-low';
  if (price <= 80) return 'tier-mid';
  return 'tier-high';
}

// Drapeau à partir du code pays (FR → 🇫🇷).
function flag(code) {
  if (!/^[A-Z]{2}$/.test(code || '')) return '';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

// « aujourd'hui », « hier », « il y a 3 jours » à partir d'une date AAAA-MM-JJ.
function seenLabel(day) {
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((todayUtc - Date.parse(day)) / 86400000);
  return days <= 0 ? "aujourd'hui" : fmtRelative.format(-days, 'day');
}

function relativeTime(date) {
  const minutes = Math.round((date - Date.now()) / 60000);
  if (Math.abs(minutes) < 60) return fmtRelative.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return fmtRelative.format(hours, 'hour');
  return fmtRelative.format(Math.round(hours / 24), 'day');
}

function formatDay(iso) {
  // On garde la date locale du vol (partie AAAA-MM-JJ) sans décalage horaire.
  return capitalize(fmtDay.format(new Date(`${iso.slice(0, 10)}T12:00:00`)));
}

function formatDayShort(iso) {
  return fmtDayShort.format(new Date(`${iso.slice(0, 10)}T12:00:00`));
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
