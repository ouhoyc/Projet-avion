// Site « Vols directs depuis Lyon » : en-tête, carte et outils communs.
// La recherche (et la liste des résultats) est dans search.js.
// Aucun jeton ici : le navigateur ne parle jamais à l'API Travelpayouts.

const $ = (id) => document.getElementById(id);

const els = {
  originCode: $('origin-code'),
  titleCity: $('title-city'),
  stats: $('stats'),
  updated: $('updated'),
};

const fmtPrice = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const fmtDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtDayShort = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const fmtRelative = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });

// Fond de carte : sombre pour la direction artistique « Nuit », clair sinon.
const MAP_STYLE = `https://tiles.openfreemap.org/styles/${document.documentElement.dataset.da === 'nuit' ? 'dark' : 'positron'}`;
const PRICE_ZOOM = 6;   // à partir de ce zoom, les prix s'affichent sur la carte
const NEAR_KM = 4000;   // cadrage initial : destinations à moins de 4 000 km

// Vérification du prix en direct (fonction serverless api/prix.js sur Vercel).
const LIVE_PRICE_URL = 'https://projet-avion-ouhoyc.vercel.app/api/prix';

// Réservation sur Kiwi.com (en français, en euros, vols directs).
// Quand le programme Kiwi.com est rejoint dans Travelpayouts, coller ici le modèle
// de lien d'affiliation fourni, avec {url} à la place du lien Kiwi encodé.
// Exemple : 'https://c111.travelpayouts.com/click?shmarker=787111&promo_id=3791&source_type=customlink&type=click&custom_url={url}'
const KIWI_AFFILIATE_TEMPLATE = '';

let data = null;
let map = null;
let markersLayer = null;
const markersByCode = new Map();

init();

// Barre d'aperçu des directions artistiques (seulement si un essai est en cours).
if (window.DA_PREVIEW) {
  const bar = $('da-switch');
  const current = document.documentElement.dataset.da || 'actuelle';
  for (const a of bar.querySelectorAll('a')) a.setAttribute('aria-current', a.search === `?da=${current}`);
  bar.hidden = false;
}

async function init() {
  setupMap();
  try {
    const res = await fetch('data.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch {
    els.updated.querySelector('span').textContent = 'Données indisponibles pour le moment. Reviens un peu plus tard.';
    return;
  }

  setupHeader();
  document.dispatchEvent(new Event('data-ready')); // search.js peut démarrer
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

// Affiche des destinations sur la carte.
// items : [{ dest, price, tierPrice, popup }] — popup = HTML de la bulle.
function showOnMap(items, fitMap) {
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

  for (const { dest, price, tierPrice, popup } of items) {
    const marker = L.marker([dest.lat, dest.lon], {
      icon: L.divIcon({
        className: '',
        html: `<span class="price-pin ${priceTier(tierPrice ?? price)}">${fmtPrice.format(price)}</span>`,
        iconSize: [0, 0],
      }),
      title: `${dest.city} – ${fmtPrice.format(price)}`,
      riseOnHover: true,
    });
    marker.bindPopup(popup, { autoPanPaddingTopLeft: [56, 16], autoPanPaddingBottomRight: [16, 16], maxWidth: 270 });
    marker.addTo(markersLayer);
    markersByCode.set(dest.city_code, marker);
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

sheet.addEventListener('click', (e) => {
  // Clic sur le fond sombre ou sur « Fermer » : on ferme.
  if (e.target === sheet || e.target.closest('[data-close]')) sheet.close();
});

// Lien de recherche Kiwi.com (avec le suivi d'affiliation une fois configuré).
function kiwiLink(from, to, day, returnDay) {
  const params = new URLSearchParams({ from, to, departure: day, lang: 'fr', currency: 'EUR', stopNumber: '0' });
  if (returnDay) params.set('return', returnDay);
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

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
