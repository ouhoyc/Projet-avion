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

// Fond de carte (recoloré ensuite avec les couleurs --map-… du site).
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const PRICE_ZOOM = 5;   // à partir de ce zoom, les prix s'affichent sur la carte
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
let mapReady = null;      // promesse résolue quand la carte est prête
let mapPopup = null;
let mapItems = [];        // destinations affichées sur la carte (pour les bulles)

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
  $('legend-origin').textContent = origin.city;
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
// Carte : MapLibre seul (fond vectoriel + points dessinés DANS la carte, donc fixes
// au zoom), noms en français et couleurs reprises de la direction artistique.
// ---------------------------------------------------------------------------
function setupMap() {
  mapReady = (async () => {
    try {
      const style = await buildMapStyle();
      map = new maplibregl.Map({
        container: 'map',
        style,
        center: [4.84, 45.76],
        zoom: 3,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        renderWorldCopies: false,
      });
      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
      await new Promise((resolve) => map.on('load', resolve));
      addPriceLayers();
      return map;
    } catch (err) {
      console.warn('Carte indisponible :', err);
      $('map').innerHTML = '<p class="map-error">La carte ne peut pas s\'afficher sur cet appareil.</p>';
      return null;
    }
  })();
}

// Couleurs de la carte définies en CSS (--map-…), différentes selon la direction artistique.
function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

// Charge le style OpenFreeMap, traduit les noms en français, retire les détails inutiles
// (routes, voies ferrées…) et applique la palette du site.
async function buildMapStyle() {
  const res = await fetch(MAP_STYLE);
  if (!res.ok) throw new Error(res.status);
  const style = await res.json();
  const c = {
    land: cssVar('--map-land', '#f2f3f0'),
    water: cssVar('--map-water', '#c2c8ca'),
    border: cssVar('--map-border', '#b3b3b3'),
    label: cssVar('--map-label', '#333333'),
    halo: cssVar('--map-label-halo', '#ffffff'),
  };
  style.layers = style.layers.filter((l) => !/highway|railway|road|tunnel|bridge|aeroway|building|park|landuse|landcover_wood|waterway/.test(l.id));
  for (const layer of style.layers) {
    const paint = (layer.paint ||= {});
    if (layer.type === 'background') paint['background-color'] = c.land;
    if (layer.id === 'water') paint['fill-color'] = c.water;
    if (layer.id.startsWith('boundary')) paint['line-color'] = c.border;
    if (layer.type === 'symbol') {
      const field = layer.layout?.['text-field'];
      if (field && JSON.stringify(field).includes('name')) {
        layer.layout['text-field'] = ['coalesce', ['get', 'name:fr'], ['get', 'name:latin'], ['get', 'name']];
      }
      paint['text-color'] = layer.id.startsWith('water') ? c.border : c.label;
      paint['text-halo-color'] = c.halo;
      paint['text-halo-width'] = 1.2;
      paint['text-halo-blur'] = 0;
    }
  }
  return style;
}

// Pastille arrondie (image extensible) pour afficher les prix au zoom.
function pillImage(fill, stroke) {
  const ratio = 2, w = 32, h = 24, r = 11, line = 2;
  const canvas = document.createElement('canvas');
  canvas.width = w * ratio; canvas.height = h * ratio;
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  ctx.beginPath();
  ctx.roundRect(line / 2, line / 2, w - line, h - line, r);
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = line; ctx.strokeStyle = stroke; ctx.stroke();
  return {
    image: ctx.getImageData(0, 0, w * ratio, h * ratio),
    options: { pixelRatio: ratio, stretchX: [[12 * ratio, 20 * ratio]], stretchY: [[11 * ratio, 13 * ratio]], content: [7 * ratio, 4 * ratio, 25 * ratio, 20 * ratio] },
  };
}

function addPriceLayers() {
  const stroke = cssVar('--map-pin-stroke', '#ffffff');
  const tiers = { low: cssVar('--tier-low', '#16a34a'), mid: cssVar('--tier-mid', '#ea8a00'), high: cssVar('--tier-high', '#dc2626') };
  for (const [name, color] of Object.entries(tiers)) {
    const { image, options } = pillImage(color, stroke);
    map.addImage(`pill-${name}`, image, options);
  }
  const empty = { type: 'FeatureCollection', features: [] };
  map.addSource('dests', { type: 'geojson', data: empty });
  map.addSource('origin', { type: 'geojson', data: empty });

  // Points de couleur (dézoomé)…
  map.addLayer({
    id: 'dest-dots', type: 'circle', source: 'dests', maxzoom: PRICE_ZOOM,
    paint: {
      'circle-color': ['match', ['get', 'tier'], 'low', tiers.low, 'mid', tiers.mid, tiers.high],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 5, 5, 7],
      'circle-stroke-color': stroke,
      'circle-stroke-width': 2,
    },
  });
  // …puis pastilles avec le prix (zoomé).
  map.addLayer({
    id: 'dest-prices', type: 'symbol', source: 'dests', minzoom: PRICE_ZOOM,
    layout: {
      'icon-image': ['concat', 'pill-', ['get', 'tier']],
      'icon-text-fit': 'both',
      'text-field': ['get', 'label'],
      'text-font': ['Noto Sans Bold'],
      'text-size': 12,
      'icon-allow-overlap': true,
      'text-allow-overlap': true,
      'symbol-sort-key': ['get', 'price'],
    },
    paint: { 'text-color': '#ffffff' },
  });
  // Aéroport de départ.
  map.addLayer({
    id: 'origin', type: 'circle', source: 'origin',
    paint: {
      'circle-color': cssVar('--map-origin', '#1e3a8a'),
      'circle-radius': 8,
      'circle-stroke-color': stroke,
      'circle-stroke-width': 3,
    },
  });

  for (const layer of ['dest-dots', 'dest-prices']) {
    map.on('click', layer, (e) => openMapPopup(e.features[0].properties.index));
    map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
  }
}

function openMapPopup(index) {
  const item = mapItems[index];
  if (!item) return;
  mapPopup?.remove();
  mapPopup = new maplibregl.Popup({ offset: 14, maxWidth: '280px', focusAfterOpen: false })
    .setLngLat([item.dest.lon, item.dest.lat])
    .setHTML(item.popup)
    .addTo(map);
}

// Affiche des destinations sur la carte.
// items : [{ dest, price, tierPrice, popup }] — popup = HTML de la bulle.
async function showOnMap(items, fitMap) {
  const m = await mapReady;
  if (!m) return;
  mapItems = items;
  mapPopup?.remove();

  const origin = data.origin;
  m.getSource('origin').setData({
    type: 'FeatureCollection',
    features: origin.lat == null ? [] : [{ type: 'Feature', geometry: { type: 'Point', coordinates: [origin.lon, origin.lat] }, properties: {} }],
  });
  m.getSource('dests').setData({
    type: 'FeatureCollection',
    features: items.map((item, index) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [item.dest.lon, item.dest.lat] },
      properties: {
        index,
        price: item.price,
        label: fmtPrice.format(item.price),
        tier: priceTier(item.tierPrice ?? item.price).replace('tier-', ''),
      },
    })),
  });

  if (fitMap && items.length) {
    // Cadrage sur les destinations proches (Montréal, Dubaï… restent visibles en dézoomant).
    const bounds = new maplibregl.LngLatBounds();
    if (origin.lat != null) bounds.extend([origin.lon, origin.lat]);
    for (const { dest } of items) {
      if (origin.lat == null || distanceKm(origin, dest) < NEAR_KM) bounds.extend([dest.lon, dest.lat]);
    }
    m.fitBounds(bounds, { padding: 30, maxZoom: 5, duration: 0 });
  }
}

function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
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
