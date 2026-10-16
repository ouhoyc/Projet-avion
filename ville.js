// Circuit « Mon voyage » d'une ville : ville.html?c=BCN&a=BCN&out=…&vo=…&ret=…&vr=…&dur=…
// 5 étapes : 1 le vol, 2 les activités (facultatif), 3 les restaurants (facultatif), 4 l'hôtel
// (facultatif), 5 le récapitulatif et la réservation. L'étape est dans l'adresse (#2…) : le bouton retour du
// navigateur et la flèche de retour reviennent à l'étape précédente.
// Lit la fiche de la ville (villes.json), ses activités (guides/CODE.json) et data.json.

// Liens partenaires par activité (Tiqets…), à remplir quand les liens seront créés dans
// Travelpayouts. Sans lien, seul le bouton « Site officiel » s'affiche.
const PARTNER_LINKS = {
  // 'sagrada-familia': 'https://…',
};

// Identifiant partenaire Stay22 (carte d'hôtels avec les prix en direct). Ce n'est pas un
// secret : il apparaît dans l'adresse de la carte. Vide = carte remplacée par un lien Booking.
const STAY22_AID = '';

// Gammes d'hôtel : filtre appliqué à la carte d'hôtels et au lien Booking.
const GAMMES = [
  { id: 'dormir', nom: 'Juste pour dormir', sous: 'simple et pas cher' },
  { id: 'confort', nom: 'Confort', sous: '3 étoiles', etoiles: 3 },
  { id: 'haut', nom: 'Haut de gamme', sous: '4 étoiles', etoiles: 4 },
  { id: 'luxe', nom: 'Grand luxe', sous: '5 étoiles', etoiles: 5 },
];

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const TYPES = {
  culture: 'Culture', sport: 'Sport', vue: 'Points de vue', sortir: 'Sorties',
  balade: 'Balades', restos: 'Manger', plage: 'Plages', nature: 'Excursions',
};
// Restaurants : 3 gammes de prix, et des badges pour dire pourquoi on les a choisis.
const RESTO_GAMMES = [
  { id: 'petit', nom: 'Petit prix', sous: 'moins de 30 € par personne', dot: '🟢' },
  { id: 'moyen', nom: 'Gamme moyenne', sous: '25 à 60 € par personne', dot: '🟠' },
  { id: 'haut', nom: 'Haut de gamme', sous: 'à partir de 50 € par personne', dot: '🔴' },
];
const BADGES = {
  tendance: { icon: '🔥', nom: 'Tendance', long: 'Restaurant tendance', why: 'Très partagé sur Instagram et TikTok.' },
  recompense: { icon: '🍽️', nom: 'Récompensé', long: 'Récompensé', why: 'Distingué par les guides gastronomiques.' },
  institution: { icon: '🏛️', nom: 'Institution', long: 'Institution', why: 'Une adresse historique, connue de tous les Barcelonais.' },
};
const RESTO_BOOKING = {
  indispensable: 'Réservation indispensable',
  conseille: 'Réservation conseillée',
  sur_place: 'Sans réservation',
};
const BOOKING = {
  indispensable: 'Réservation indispensable',
  conseille: 'Réservation conseillée',
  sur_place: 'Sur place possible',
  libre: 'Accès libre',
};

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const euro = (v) => (Number.isInteger(v) ? v : v.toFixed(2).replace('.', ',')) + ' €';
const fmtCell = (v) => (typeof v === 'number' ? euro(v) : esc(v) + (/\d/.test(v) && !/€|pièce|personne/.test(v) ? ' €' : ''));
const fmtDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

const params = new URLSearchParams(location.search);
const code = (params.get('c') || 'BCN').toUpperCase().replace(/[^A-Z]/g, '');
const trip = params.get('out') ? (() => {
  const vo = Number(params.get('vo')) || 0, vr = Number(params.get('vr')) || 0;
  return {
    airport: (params.get('a') || code).toUpperCase().replace(/[^A-Z]/g, ''),
    out: params.get('out'), ret: params.get('ret'), vo, vr, dur: Number(params.get('dur')) || 0,
    price: vo + vr || Number(params.get('vol')) || 0,
  };
})() : null;
const KIWI_AFFILIATE_TEMPLATE = ''; // même réglage que dans app.js
const SEL_KEY = `sejour-${code}`;
const RESTO_KEY = `restos-${code}`;

let guide = null;
let ville = {};
let cityName = code;
let filter = 'all';
let selected = new Set(loadSelection());
let restos = new Set(loadRestos());
const pins = {};
const HOTEL_KEY = `hotel-${code}`;
let hotel = loadHotel();
let quartierChoisi = null; // null = quartier idéal calculé
let map = null;
let hotelsOn = false;       // le visiteur a demandé à voir les hôtels
let hotelResults = null;    // dernière liste reçue { hotels, nights, key }
let origin = { code: 'LYS', city: 'Lyon' };
let step = 1;
const BOOK_KEY = `reserver-${code}`;
let book = loadBook();


init();

async function init() {
  const [villes, g, data] = await Promise.all([
    getJson('villes.json'), getJson(`guides/${code}.json`), getJson('data.json'),
  ]);
  if (!g) {
    $('v-city').textContent = 'Guide pas encore disponible';
    return;
  }
  guide = g;
  ville = villes?.[code] || {};
  selected = new Set([...selected].filter((id) => guide.activites.some((a) => a.id === id)));
  restos = new Set([...restos].filter((id) => (guide.restaurants || []).some((r) => r.id === id)));
  const flights = (data?.destinations || []).filter((d) => d.city_code === code);
  cityName = flights[0]?.city || code;

  if (data?.origin) origin = data.origin;
  document.title = `Mon voyage à ${cityName} · Vols directs depuis ${origin.city}`;
  $('v-city').textContent = cityName;
  $('v-country').textContent = flights[0]?.country || '';
  if (ville.pitch) $('v-pitch').textContent = ville.pitch;
  if (ville.photo?.src) $('v-hero').style.backgroundImage = `url("${ville.photo.src}")`;
  $('t-acts').firstChild.textContent = `Que faire à ${cityName} ? `;

  $('v-foot').textContent = `Prix des activités vérifiés le ${new Date(guide.verifie_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  $('open-credits').addEventListener('click', openCredits);
  $('s1-pax').addEventListener('click', () => paxOpen($('pax-sheet'), refresh));

  renderFlight(flights);
  renderChips();
  renderList();
  renderRestos();
  setupHotel();
  setupSteps();
  $('v-list').addEventListener('click', (e) => {
    const t = e.target.closest('[data-toggle]');
    if (t) return toggle(t.dataset.toggle);
    const b = e.target.closest('[data-act]');
    if (b) openSheet(b.dataset.act);
  });
  $('r-gammes').addEventListener('click', (e) => {
    const t = e.target.closest('[data-rtoggle]');
    if (t) return toggleResto(t.dataset.rtoggle);
    const b = e.target.closest('[data-resto]');
    if (b) openResto(b.dataset.resto);
  });
}

async function getJson(url) {
  try {
    const r = await fetch(url, { cache: 'no-cache' });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sélection des activités (gardée dans le navigateur, par ville)
// ---------------------------------------------------------------------------
function loadSelection() {
  try { return JSON.parse(localStorage.getItem(SEL_KEY)) || []; } catch { return []; }
}

function toggle(id) {
  if (selected.has(id)) selected.delete(id);
  else selected.add(id);
  try { localStorage.setItem(SEL_KEY, JSON.stringify([...selected])); } catch {}
  renderList();
  paintPins();
  renderHotel();
  updateFoot();
}

// Prix d'une activité pour le groupe : adultes au tarif adulte, chaque enfant selon son âge.
function groupCost(a, pax) {
  const t = a.tarifs || { adulte: a.prix || 0, enfants: [] };
  const childPrice = (age) => (t.enfants.find(([max]) => age <= max) || [null, t.adulte])[1];
  const parts = [];
  if (pax.adults) parts.push({ label: `${pax.adults} adulte${pax.adults > 1 ? 's' : ''}`, n: pax.adults, unit: t.adulte });
  const byPrice = new Map();
  for (const age of pax.children) {
    const price = childPrice(age);
    byPrice.set(price, (byPrice.get(price) || 0) + 1);
  }
  for (const [price, n] of byPrice) parts.push({ label: `${n} enfant${n > 1 ? 's' : ''}`, n, unit: price });
  const total = parts.reduce((s, p) => s + p.n * p.unit, 0);
  const detail = parts.map((p) => (p.unit === 0 ? `${p.label} gratuit` : `${p.label} × ${euro(p.unit)}`)).join(' · ');
  return { total, detail, estimation: Boolean(t.estimation) };
}


// ---------------------------------------------------------------------------
// Liste des activités
// ---------------------------------------------------------------------------
function renderChips() {
  const present = new Set(guide.activites.map((a) => a.type));
  const chips = [['all', 'Tout'], ['free', 'Gratuit'], ...Object.keys(TYPES).filter((t) => present.has(t)).map((t) => [t, TYPES[t]])];
  $('v-chips').innerHTML = chips.map(([k, label]) =>
    `<button type="button" class="v-chip" data-f="${k}" aria-pressed="${k === filter}">${label}</button>`).join('');
  $('v-chips').onclick = (e) => {
    const b = e.target.closest('[data-f]');
    if (!b) return;
    filter = b.dataset.f;
    renderChips();
    renderList();
  };
}

// Vignette photo de l'activité (l'émoji reste en secours).
function thumb(a) {
  if (!a.photo) return `<span class="v-emoji" aria-hidden="true">${a.emoji}</span>`;
  const mini = a.photo.src.replace(/\/([^/]+)$/, '/mini/$1');
  return `<span class="v-emoji v-thumb" aria-hidden="true"><img src="${esc(mini)}" alt="" loading="lazy" decoding="async"></span>`;
}

function priceLabel(a) {
  if (a.prix === 0) return 'Gratuit';
  if (a.prix_niveau) return a.prix_niveau;
  return `<small>dès</small>${euro(a.prix)}`;
}

function renderList() {
  const acts = guide.activites.filter((a) => filter === 'all' || (filter === 'free' ? a.prix === 0 : a.type === filter));
  $('v-list').innerHTML = acts.map((a) => {
    const on = selected.has(a.id);
    return `
    <li class="v-row${on ? ' is-on' : ''}">
      <button type="button" class="v-act" data-act="${esc(a.id)}">
        ${thumb(a)}
        <span class="v-act-main">
          <span class="v-act-name">${esc(a.nom)}</span>
          <span class="v-act-meta">${esc(TYPES[a.type] || '')} · ${esc(a.duree)}</span>
          <span class="v-tags"><span class="tag tag-${a.reservation}">${BOOKING[a.reservation]}</span>${badgeTags(a.badges)}</span>
        </span>
        <span class="v-act-price">${priceLabel(a)}</span>
      </button>
      <button type="button" class="v-check" data-toggle="${esc(a.id)}" aria-pressed="${on}" aria-label="${on ? 'Retirer' : 'Ajouter'} ${esc(a.nom)} ${on ? 'de' : 'à'} mon séjour">${on ? '✓' : '+'}</button>
    </li>`;
  }).join('');
}

// ---------------------------------------------------------------------------
// Étape 3 : les restaurants, rangés par gamme de prix
// ---------------------------------------------------------------------------
function loadRestos() {
  try { return JSON.parse(localStorage.getItem(RESTO_KEY)) || []; } catch { return []; }
}
function saveRestos() {
  try { localStorage.setItem(RESTO_KEY, JSON.stringify([...restos])); } catch {}
}
function toggleResto(id) {
  if (restos.has(id)) restos.delete(id);
  else restos.add(id);
  saveRestos();
  renderRestos();
  paintPins();
  updateFoot();
}
function chosenRestos() {
  return (guide.restaurants || []).filter((r) => restos.has(r.id));
}

function badgeTags(list) {
  return (list || []).map((b) => BADGES[b] ? `<span class="badge badge-${b}">${BADGES[b].icon} ${BADGES[b].nom}</span>` : '').join('');
}

function renderRestos() {
  const all = guide.restaurants || [];
  $('r-legend').innerHTML = Object.entries(BADGES).filter(([k]) => all.some((r) => r.badges.includes(k)))
    .map(([k, b]) => `<span><span class="badge badge-${k}">${b.icon} ${b.nom}</span> ${esc(b.why)}</span>`).join('');
  $('r-gammes').innerHTML = RESTO_GAMMES.map((g) => {
    const list = all.filter((r) => r.gamme === g.id).sort((a, b) => a.prix_min - b.prix_min);
    if (!list.length) return '';
    return `
      <h3 class="r-gamme"><span aria-hidden="true">${g.dot}</span> ${g.nom}<small>${g.sous}</small></h3>
      <ul class="v-list">${list.map((r) => {
        const on = restos.has(r.id);
        return `
        <li class="v-row${on ? ' is-on' : ''}">
          <button type="button" class="v-act" data-resto="${esc(r.id)}">
            ${r.photo ? thumb(r) : `<span class="v-emoji r-emoji r-${r.gamme}" aria-hidden="true">${r.emoji}</span>`}
            <span class="v-act-main">
              <span class="v-act-name">${esc(r.nom)}</span>
              <span class="v-act-meta">${esc(r.genre)} · ${esc(r.quartier)}</span>
              <span class="v-tags">${badgeTags(r.badges)}</span>
            </span>
            <span class="v-act-price r-price">${esc(r.prix)}<small>par pers.</small></span>
          </button>
          <button type="button" class="v-check" data-rtoggle="${esc(r.id)}" aria-pressed="${on}" aria-label="${on ? 'Retirer' : 'Ajouter'} ${esc(r.nom)} ${on ? 'de' : 'à'} mon séjour">${on ? '✓' : '+'}</button>
        </li>`;
      }).join('')}</ul>`;
  }).join('');
}

function mapsLink(r) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.nom}, ${r.adresse}`)}`;
}

function openResto(id) {
  const r = (guide.restaurants || []).find((x) => x.id === id);
  if (!r) return;
  const on = restos.has(r.id);
  const g = RESTO_GAMMES.find((x) => x.id === r.gamme);
  const boxClass = r.reservation === 'indispensable' ? 'box-warn' : r.reservation === 'conseille' ? 'box-mid' : '';
  showDialog($('v-sheet'), `
    ${sheetTop(r, `r-top r-${r.gamme}`)}
    <div class="a-body">
      <p class="a-kicker">${g.dot} ${esc(g.nom)} · ${esc(r.genre)} · ${esc(r.quartier)}</p>
      <h2 id="a-title">${esc(r.nom)}</h2>
      <div class="r-badges">${r.badges.map((b) => `<p class="r-badge badge-${b}"><b>${BADGES[b].icon} ${BADGES[b].long}</b><small>${esc(b === 'recompense' && r.recompense ? r.recompense : BADGES[b].why)}</small></p>`).join('')}</div>
      <p class="a-text">${esc(r.texte)}</p>
      <div class="box ${boxClass}"><span class="box-h">🗓 Réservation</span><b>${RESTO_BOOKING[r.reservation]}</b>${r.reservation_delai ? ` : ${esc(r.reservation_delai)}` : ''}</div>
      <div class="box"><span class="box-h">💶 Prix</span>${r.prix.startsWith('≈') ? esc(r.prix) : `Environ ${esc(r.prix)}`} par personne, boissons comprises. À régler sur place.</div>
      <div class="box"><span class="box-h">📍 Adresse</span>${esc(r.adresse)}</div>
      <button type="button" class="btn ${on ? 'btn-line' : 'btn-ink'}" id="a-toggle">${on ? '✓ Dans mon séjour · retirer' : '+ Ajouter à mon séjour'}</button>
      <a class="btn btn-line" href="${esc(mapsLink(r))}" target="_blank" rel="noopener">Horaires et réservation (Google Maps)</a>
    </div>`);
  $('a-toggle').onclick = () => {
    toggleResto(r.id);
    openResto(r.id);
  };
}

// ---------------------------------------------------------------------------
// Fenêtres : activité, devis, crédits
// ---------------------------------------------------------------------------
function showDialog(dialog, html) {
  dialog.innerHTML = html;
  dialog.querySelectorAll('[data-close]').forEach((b) => { b.onclick = () => dialog.close(); });
  dialog.onclick = (e) => { if (e.target === dialog) dialog.close(); };
  if (!dialog.open) dialog.showModal();
}

// Haut de fiche : la photo (avec « Photo d'illustration » si ce n'est pas le lieu lui-même), sinon l'émoji.
function sheetTop(x, cls = '') {
  if (!x.photo) return `<div class="a-top ${cls}"><span aria-hidden="true">${x.emoji}</span><button type="button" class="a-close" data-close aria-label="Fermer">×</button></div>`;
  return `<div class="a-top has-photo"><img src="${esc(x.photo.src)}" alt="${esc(x.nom)}"${x.photo.pos ? ` style="object-position:${esc(x.photo.pos)}"` : ''}>${x.photo.illustration ? '<span class="a-illu">Photo d\'illustration</span>' : ''}<button type="button" class="a-close" data-close aria-label="Fermer">×</button></div>`;
}

function openSheet(id) {
  const a = guide.activites.find((x) => x.id === id);
  if (!a) return;
  const partner = PARTNER_LINKS[a.id];
  const on = selected.has(a.id);
  const boxClass = a.reservation === 'indispensable' ? 'box-warn' : a.reservation === 'conseille' ? 'box-mid' : '';
  const booking = a.reservation === 'libre'
    ? 'Accès libre, rien à réserver.'
    : `<b>${BOOKING[a.reservation]}</b>${a.reservation_delai ? ` : ${esc(a.reservation_delai)}` : ''}`;
  showDialog($('v-sheet'), `
    ${sheetTop(a)}
    <div class="a-body">
      <p class="a-kicker">${esc(TYPES[a.type] || '')} · ${esc(a.quartier)}</p>
      <h2 id="a-title">${esc(a.nom)}</h2>
      <p class="a-text">${esc(a.texte)}</p>
      <div class="box ${boxClass}"><span class="box-h">🗓 Réservation</span>${booking}</div>
      <div class="box"><span class="box-h">💶 Prix</span><table>${a.prix_detail.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${fmtCell(v)}</td></tr>`).join('')}</table></div>
      <div class="box"><span class="box-h">⏱ Pratique</span>${esc(a.duree)} · ${esc(a.moment)}</div>
      ${a.note ? `<p class="a-note">ℹ️ ${esc(a.note)}</p>` : ''}
      <button type="button" class="btn ${on ? 'btn-line' : 'btn-ink'}" id="a-toggle">${on ? '✓ Dans mon séjour · retirer' : '+ Ajouter à mon séjour'}</button>
      ${partner ? `<a class="btn btn-main" href="${esc(partner)}" target="_blank" rel="sponsored noopener">Réserver</a>` : ''}
      ${a.site_officiel ? `<a class="btn btn-line" href="${esc(a.site_officiel)}" target="_blank" rel="noopener">Site officiel</a>` : ''}
      ${partner ? '<p class="a-legal">Le bouton « Réserver » passe par notre partenaire : nous touchons une petite commission, sans frais en plus pour vous.</p>' : ''}
    </div>`);
  $('a-toggle').onclick = () => {
    toggle(a.id);
    openSheet(a.id);
  };
}

function openCredits() {
  const p = ville.photo;
  showDialog($('credits-sheet'), `
    <div class="a-body q-body">
      <button type="button" class="a-close q-close" data-close aria-label="Fermer">×</button>
      <h2 id="c-title">Crédits et mentions</h2>
      <div class="c-item"><b>Photos</b>
        Photos libres de droits venant de Wikimedia Commons, sous licence Creative Commons ou domaine public.
        ${p ? `<p class="c-line">Photo de ${esc(cityName)} : ${esc(p.author)}, ${esc(p.license)}${p.page ? ` · <a href="${esc(p.page)}" target="_blank" rel="noopener">source</a>` : ''}</p>` : ''}
        <details class="c-more">
          <summary>Photos des activités (${guide.activites.filter((a) => a.photo).length})</summary>
          <ul>${guide.activites.filter((a) => a.photo).map((a) => `
            <li><b>${esc(a.nom)}</b> : ${esc(a.photo.auteur)}, ${esc(a.photo.licence)} · <a href="${esc(a.photo.page)}" target="_blank" rel="noopener">source</a></li>`).join('')}
          </ul>
        </details>
        ${(guide.restaurants || []).some((r) => r.photo) ? `
        <details class="c-more">
          <summary>Photos des restaurants (${guide.restaurants.filter((r) => r.photo).length})</summary>
          <ul>${guide.restaurants.filter((r) => r.photo).map((r) => `
            <li><b>${esc(r.nom)}</b>${r.photo.illustration ? ' (illustration)' : ''} : ${esc(r.photo.auteur)}, ${esc(r.photo.licence)} · <a href="${esc(r.photo.page)}" target="_blank" rel="noopener">source</a></li>`).join('')}
          </ul>
        </details>` : ''}
      </div>
      <p class="c-item"><b>Carte</b>© OpenStreetMap contributors, OpenMapTiles, fond OpenFreeMap.</p>
      <p class="c-item"><b>Prix des activités</b>Relevés le ${esc(new Date(guide.verifie_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }))} sur les sites officiels et des guides récents. Ils peuvent changer : vérifiez avant de réserver.</p>
      <p class="c-item"><b>Prix des vols</b>Prix repérés par les voyageurs (Travelpayouts), mis à jour chaque matin.</p>
    </div>`);
}

// ---------------------------------------------------------------------------
// Carte : même fond et mêmes couleurs que la carte des vols (accueil)
// ---------------------------------------------------------------------------
async function buildMapStyle() {
  const res = await fetch(MAP_STYLE);
  if (!res.ok) throw new Error(res.status);
  const style = await res.json();
  const c = { land: '#fbf7ef', water: '#c4e3ea', border: '#14213d', label: '#14213d', halo: '#fbf7ef' };
  // Carte de ville : on garde les rues (avec leur nom), les parcs et les voies ferrées,
  // on retire les bâtiments et les aéroports, et on applique les couleurs du site.
  style.layers = style.layers.filter((l) => !/building|aeroway/.test(l.id));
  for (const layer of style.layers) {
    const paint = (layer.paint ||= {});
    if (layer.type === 'background') paint['background-color'] = c.land;
    if (layer.id === 'water') paint['fill-color'] = c.water;
    if (/park|landcover_wood|landuse_park/.test(layer.id) && layer.type === 'fill') { paint['fill-color'] = '#e3ecd3'; paint['fill-opacity'] = 1; }
    if (layer.id.startsWith('boundary')) paint['line-color'] = c.border;
    if (layer.type === 'symbol') {
      const field = layer.layout?.['text-field'];
      if (field && JSON.stringify(field).includes('name')) {
        layer.layout['text-field'] = ['coalesce', ['get', 'name:fr'], ['get', 'name:latin'], ['get', 'name']];
      }
      paint['text-color'] = layer.id.startsWith('water') ? '#4f7f8c' : /highway|road/.test(layer.id) ? '#5a6480' : c.label;
      paint['text-halo-color'] = c.halo;
      paint['text-halo-width'] = 1.2;
      paint['text-halo-blur'] = 0;
    }
  }
  return style;
}

async function setupMap() {
  if (!window.maplibregl) return;
  try {
    const style = await buildMapStyle();
    const acts = guide.activites.filter((a) => a.lat && a.type !== 'nature');
    const bounds = new maplibregl.LngLatBounds();
    (chosenPlaces().length ? chosenPlaces() : acts).forEach((a) => bounds.extend([a.lng, a.lat]));
    const { q } = currentQuartier();
    if (q) bounds.extend([q.lng, q.lat]);
    map = new maplibregl.Map({
      container: 'v-map', style, bounds, fitBoundsOptions: { padding: 40, maxZoom: 15 },
      attributionControl: false, dragRotate: false, pitchWithRotate: false, cooperativeGestures: true,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    // Le « i » de la mention OpenStreetMap démarre replié (MapLibre l'ouvre au chargement).
    map.on('load', () => {
      map.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
      // Zone idéale pour dormir : cercle au milieu des activités cochées.
      map.addSource('zone', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'zone-fill', type: 'fill', source: 'zone', paint: { 'fill-color': '#14213d', 'fill-opacity': 0.08 } });
      map.addLayer({ id: 'zone-line', type: 'line', source: 'zone', paint: { 'line-color': '#14213d', 'line-width': 2.5, 'line-dasharray': [2, 1.5] } });
      drawZone();
      addHotelLayers();
      if (hotelResults) drawHotels();
    });
    for (const a of acts) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'v-pin';
      el.textContent = a.emoji;
      el.setAttribute('aria-label', a.nom);
      el.addEventListener('click', () => openSheet(a.id));
      pins[a.id] = el;
      new maplibregl.Marker({ element: el }).setLngLat([a.lng, a.lat]).addTo(map);
    }
    for (const r of guide.restaurants || []) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'v-pin r-pin';
      el.textContent = r.emoji;
      el.setAttribute('aria-label', r.nom);
      el.addEventListener('click', () => openResto(r.id));
      pins[`r:${r.id}`] = el;
      new maplibregl.Marker({ element: el }).setLngLat([r.lng, r.lat]).addTo(map);
    }
    paintPins();
  } catch (err) {
    console.warn('Carte indisponible :', err);
    $('v-map').innerHTML = '<p style="padding:16px">La carte ne peut pas s\'afficher sur cet appareil.</p>';
  }
}

// ---------------------------------------------------------------------------
// Où dormir : quartier idéal (au milieu des activités cochées), gamme, dates,
// hôtels avec les prix en direct (Stay22) ou lien Booking en attendant.
// ---------------------------------------------------------------------------
function loadHotel() {
  try { return { gamme: 'confort', prix: 0, ...JSON.parse(localStorage.getItem(HOTEL_KEY)) }; } catch { return { gamme: 'confort', prix: 0 }; }
}
function saveHotel() {
  try { localStorage.setItem(HOTEL_KEY, JSON.stringify(hotel)); } catch {}
}

// Distance « à pied » : environ 20 minutes de marche.
const WALK_KM = 1.6;

// Distance à vol d'oiseau en km.
function km(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Activités cochées dans la ville (sans les excursions lointaines).
function chosenPlaces() {
  return guide.activites.filter((a) => selected.has(a.id) && a.lat && a.type !== 'nature');
}

function idealQuartier() {
  const places = chosenPlaces();
  const qs = guide.quartiers || [];
  if (!qs.length) return null;
  if (!places.length) return { q: qs[0], places, center: null };
  const center = { lat: places.reduce((s, p) => s + p.lat, 0) / places.length, lng: places.reduce((s, p) => s + p.lng, 0) / places.length };
  // Le quartier qui a le plus d'activités à pied ; à égalité, le plus proche du centre des activités.
  const score = (x) => places.filter((p) => km(p, x) <= WALK_KM).length;
  const q = qs.reduce((best, x) => {
    const d = score(x) - score(best);
    return d > 0 || (d === 0 && km(x, center) < km(best, center)) ? x : best;
  });
  return { q, places, center };
}

function currentQuartier() {
  const ideal = idealQuartier();
  const q = (guide.quartiers || []).find((x) => x.id === quartierChoisi) || ideal?.q;
  return { q, ideal };
}

function stayDates() {
  return { inD: $('h-in').value, outD: $('h-out').value };
}

function nights() {
  const { inD, outD } = stayDates();
  if (!inD || !outD) return 0;
  return Math.max(0, Math.round((new Date(outD) - new Date(inD)) / 86400000));
}

function hotelSummary() {
  if (hotel.nom) return `${hotel.nom}${hotel.nuits ? ` · ${hotel.nuits} nuit${hotel.nuits > 1 ? 's' : ''}` : ''}`;
  const { q } = currentQuartier();
  const g = GAMMES.find((x) => x.id === hotel.gamme);
  const n = nights();
  return [q?.nom, g?.nom, n ? `${n} nuit${n > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ');
}

function setupHotel() {
  if (!guide.quartiers?.length) { $('hotel').hidden = true; return; }
  const saved = (() => { try { return JSON.parse(localStorage.getItem(`dates-${code}`)) || {}; } catch { return {}; } })();
  $('h-in').value = trip?.out || saved.inD || '';
  $('h-out').value = trip?.ret || saved.outD || '';
  const today = new Date().toISOString().slice(0, 10);
  $('h-in').min = today; $('h-out').min = today;
  for (const id of ['h-in', 'h-out']) {
    $(id).addEventListener('change', () => {
      try { localStorage.setItem(`dates-${code}`, JSON.stringify(stayDates())); } catch {}
      renderHotel();
    });
  }
  $('h-gammes').onclick = (e) => {
    const b = e.target.closest('[data-g]');
    if (!b) return;
    hotel.gamme = b.dataset.g;
    saveHotel();
    renderHotel();
  };
  $('h-zone').onclick = (e) => {
    const b = e.target.closest('[data-q]');
    if (!b) return;
    quartierChoisi = b.dataset.q === 'ideal' ? null : b.dataset.q;
    renderHotel();
  };
  renderHotel();
}

function renderHotel() {
  if (!guide.quartiers?.length) return;
  const { q, ideal } = currentQuartier();
  const isIdeal = q.id === ideal.q.id;
  const n = ideal.places.length;
  const near = ideal.places.filter((p) => km(p, q) <= WALK_KM).length;
  const avg = n ? ideal.places.reduce((s, p) => s + km(p, q), 0) / n : 0;
  const why = !n
    ? 'Cochez des activités : on calcule le quartier le plus proche de vos visites.'
    : near
      ? (n === 1 ? 'Votre activité est à moins de 20 min à pied.' : `${near} de vos ${n} activités à moins de 20 min à pied.`)
      : `À environ ${avg.toFixed(1).replace('.', ',')} km de vos activités : le métro vous y emmène vite.`;
  $('h-zone').innerHTML = `
    <div class="h-card">
      <p class="h-q"><b>${esc(q.nom)}</b>${isIdeal && ideal.places.length ? '<span class="h-best">Le plus proche de vos activités</span>' : ''}</p>
      <p class="h-text">${esc(q.texte)}</p>
      <p class="h-why">${esc(why)}</p>
    </div>
    <div class="h-others" role="group" aria-label="Autres quartiers">
      <span>Autres quartiers :</span>
      ${guide.quartiers.filter((x) => x.id !== q.id).map((x) => `<button type="button" class="h-other" data-q="${x.id === ideal.q.id ? 'ideal' : x.id}">${esc(x.nom)}</button>`).join('')}
    </div>`;
  $('h-gammes').innerHTML = GAMMES.map((g) => `
    <button type="button" class="h-gamme" data-g="${g.id}" aria-pressed="${g.id === hotel.gamme}"><b>${g.nom}</b><small>${g.sous}</small></button>`).join('');
  renderHotels(q);
  drawZone();
}

function renderHotels(q) {
  const { inD, outD } = stayDates();
  const pax = paxGet();
  const g = GAMMES.find((x) => x.id === hotel.gamme);
  const n = nights();
  if (!inD || !outD || n <= 0) {
    $('h-hotels').innerHTML = '<p class="h-hint">Choisissez vos dates d\'arrivée et de départ pour voir les hôtels et leurs prix.</p>';
    return;
  }
  if (hotelsOn) return loadHotels(q, inD, outD, pax, g);
  $('h-hotels').innerHTML = `
    <button type="button" class="btn btn-main" id="h-search">Voir les hôtels et leurs prix dans tout ${esc(cityName)}</button>
    <p class="h-hint">${n} nuit${n > 1 ? 's' : ''} · ${esc(paxLabel(pax))} · ${esc(g.nom)}. Les hôtels apparaissent sur la carte avec leur prix pour vos dates.</p>`;
  $('h-search').onclick = () => { hotelsOn = true; renderHotels(q); };
}

function bookingFallback(q, inD, outD, pax, g, why) {
  const n = nights();
  if (STAY22_AID) {
    const p = new URLSearchParams({
      aid: STAY22_AID, lat: q.lat, lng: q.lng, zoom: '15', checkin: inD, checkout: outD,
      adults: pax.adults, children: pax.children.length, ljs: 'fr', currency: 'EUR', maincolor: 'ff6b4a',
      priceper: 'total', campaign: `guide-${code}`, hidebrandlogo: 'true',
    });
    if (g.etoiles) p.set('minstarrating', g.etoiles);
    if (g.id === 'dormir' && guide.hotel_petit_prix_max) { p.set('max', guide.hotel_petit_prix_max); p.set('priceper', 'nightly'); }
    const poi = chosenPlaces().map((a) => ({ lat: a.lat, lng: a.lng, name: a.nom }));
    if (poi.length) p.set('poi', JSON.stringify(poi));
    $('h-hotels').innerHTML = `
      <iframe class="h-map" title="Hôtels à ${esc(q.nom)} et leurs prix" loading="lazy" src="https://www.stay22.com/embed/gm?${esc(p.toString())}"></iframe>
      <p class="h-hint">Prix réels pour ${n} nuit${n > 1 ? 's' : ''}, ${esc(paxLabel(pax))}. Notez le prix de l'hôtel choisi dans votre devis.</p>`;
    return;
  }
  // En attendant la carte d'hôtels : recherche Booking déjà remplie (dates, voyageurs, quartier, gamme).
  const b = new URLSearchParams({ ss: `${q.nom}, ${cityName}`, checkin: inD, checkout: outD, group_adults: pax.adults, group_children: pax.children.length, no_rooms: '1', lang: 'fr', selected_currency: 'EUR' });
  for (const age of pax.children) b.append('age', age);
  if (g.etoiles) b.set('nflt', `class=${g.etoiles}`);
  if (g.id === 'dormir') b.set('order', 'price');
  $('h-hotels').innerHTML = `
    ${why ? `<p class="h-hint">${esc(why)}</p>` : ''}
    <a class="btn btn-main" href="https://www.booking.com/searchresults.fr.html?${esc(b.toString())}" target="_blank" rel="noopener">Voir les hôtels et leurs prix sur Booking · ${esc(q.nom)}</a>
    <p class="h-hint">${n} nuit${n > 1 ? 's' : ''} · ${esc(paxLabel(pax))} · ${esc(g.nom)}. Notez ensuite le prix de l'hôtel choisi dans votre devis.</p>`;
}

// Cercle de la zone (rayon ≈ 15 min à pied) sur la carte des activités.
function drawZone() {
  const src = map?.getSource?.('zone');
  if (!src || !guide?.quartiers?.length) return;
  const { q } = currentQuartier();
  const r = 1.0, pts = [];
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * 2 * Math.PI;
    pts.push([q.lng + (r / (111.32 * Math.cos(q.lat * Math.PI / 180))) * Math.cos(t), q.lat + (r / 110.57) * Math.sin(t)]);
  }
  src.setData({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [pts] } });
}

// ---------------------------------------------------------------------------
// Hôtels en direct (api/hotels.js → LiteAPI) : pastilles de prix sur la carte,
// vert / orange / rouge comme pour les vols, et choix qui remplit le devis.
// ---------------------------------------------------------------------------
const HOTELS_CACHE_MIN = 30;

// Recherche sur toute la ville : centre des quartiers du guide, rayon qui les couvre tous.
function cityArea() {
  const qs = guide.quartiers;
  const c = { lat: qs.reduce((s, x) => s + x.lat, 0) / qs.length, lng: qs.reduce((s, x) => s + x.lng, 0) / qs.length };
  const r = Math.min(6000, Math.max(3000, Math.round((Math.max(...qs.map((x) => km(c, x))) + 2) * 1000)));
  return { ...c, r };
}

async function loadHotels(q, inD, outD, pax, g) {
  const area = cityArea();
  const p = new URLSearchParams({ c: code, lat: area.lat.toFixed(4), lng: area.lng.toFixed(4), r: area.r, in: inD, out: outD, adults: pax.adults, children: pax.children.join(','), gamme: g.id });
  const key = p.toString();
  if (hotelResults?.key === key) return showHotels();
  $('h-hotels').innerHTML = `<p class="h-loading">Recherche des hôtels dans tout ${esc(cityName)} pour vos dates…</p>`;
  let data = null;
  try {
    const cached = JSON.parse(sessionStorage.getItem(`h:${key}`) || 'null');
    if (cached && Date.now() - cached.t < HOTELS_CACHE_MIN * 60000) data = cached.data;
  } catch {}
  if (!data) {
    try {
      const r = await fetch(`api/hotels?${key}`);
      data = await r.json();
      if (r.ok && data.status === 'ok') try { sessionStorage.setItem(`h:${key}`, JSON.stringify({ t: Date.now(), data })); } catch {}
      else if (data.error === 'not_configured') return bookingFallback(q, inD, outD, pax, g, '');
      else throw new Error(data.error || r.status);
    } catch {
      return bookingFallback(q, inD, outD, pax, g, 'La recherche d\'hôtels ne répond pas pour le moment.');
    }
  }
  if (stayDates().inD !== inD || stayDates().outD !== outD) return; // la recherche a changé entre-temps
  if (!data.hotels?.length) return bookingFallback(q, inD, outD, pax, g, `Aucun hôtel « ${g.nom} » trouvé ici pour vos dates.`);
  hotelResults = { key, ...data };
  showHotels();
  $('v-map').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Paliers de prix (par nuit) : le tiers le moins cher en vert, le tiers du milieu en orange.
function tiers(list) {
  const per = list.map((h) => h.total / hotelResults.nights).sort((a, b) => a - b);
  return { low: per[Math.floor((per.length - 1) / 3)], mid: per[Math.floor(((per.length - 1) * 2) / 3)] };
}
function tierOf(h, t) {
  const v = h.total / hotelResults.nights;
  return v <= t.low ? 'low' : v <= t.mid ? 'mid' : 'high';
}

function showHotels() {
  const list = hotelResults.hotels;
  const n = hotelResults.nights;
  const t = tiers(list);
  $('h-hotels').innerHTML = `<p class="h-found">${list.length} hôtel${list.length > 1 ? 's' : ''} trouvé${list.length > 1 ? 's' : ''} pour vos dates · prix total pour ${n} nuit${n > 1 ? 's' : ''}, ${esc(paxLabel(paxGet()))}</p>`;
  $('lg-low').textContent = `≤ ${Math.round(t.low)} €/nuit`;
  $('lg-mid').textContent = `≤ ${Math.round(t.mid)} €/nuit`;
  $('lg-high').textContent = `> ${Math.round(t.mid)} €/nuit`;
  $('v-legend').hidden = false;
  $('v-map-note').textContent = 'Touchez un prix pour voir l\'hôtel, ou un point pour voir l\'activité.';
  $('h-list').innerHTML = list.slice(0, 20).map((h) => hotelCard(h, tierOf(h, t))).join('');
  $('h-list').onclick = (e) => {
    const b = e.target.closest('[data-hotel]');
    if (b) openHotel(b.dataset.hotel);
  };
  drawHotels();
}

function starsTxt(s) {
  return s ? '★'.repeat(Math.round(s)) : '';
}

function hotelCard(h, tier) {
  const on = hotel.id === h.id;
  return `
    <li><button type="button" class="h-item${on ? ' is-on' : ''}" data-hotel="${esc(h.id)}">
      ${h.photo ? `<img src="${esc(h.photo)}" alt="" loading="lazy">` : '<span class="h-noimg" aria-hidden="true">🏨</span>'}
      <span class="h-item-main"><b>${esc(h.name)}</b><small>${starsTxt(h.stars)}${h.rating ? ` · ${String(h.rating).replace('.', ',')}/10` : ''}${on ? ' · ✓ choisi' : ''}</small></span>
      <span class="h-item-price t-${tier}">${euro(h.total)}<small>${euro(Math.round(h.total / hotelResults.nights))}/nuit</small></span>
    </button></li>`;
}

// Pastille arrondie extensible (même dessin que la carte des vols).
function pillImage(fill) {
  const ratio = 2, w = 32, h = 24, r = 11, line = 2;
  const canvas = document.createElement('canvas');
  canvas.width = w * ratio; canvas.height = h * ratio;
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  ctx.beginPath();
  ctx.roundRect(line / 2, line / 2, w - line, h - line, r);
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = line; ctx.strokeStyle = '#14213d'; ctx.stroke();
  return {
    image: ctx.getImageData(0, 0, w * ratio, h * ratio),
    options: { pixelRatio: ratio, stretchX: [[12 * ratio, 20 * ratio]], stretchY: [[11 * ratio, 13 * ratio]], content: [7 * ratio, 4 * ratio, 25 * ratio, 20 * ratio] },
  };
}

const TIER_COLORS = { low: '#12a865', mid: '#f59e0b', high: '#ef4444' };

// Couches des hôtels : un point pour chacun, et le prix par-dessus. Quand deux prix se
// chevauchent, le moins cher reste affiché ; en zoomant, les autres apparaissent.
function addHotelLayers() {
  for (const [name, color] of Object.entries(TIER_COLORS)) {
    const { image, options } = pillImage(color);
    map.addImage(`pill-${name}`, image, options);
  }
  map.addSource('hotels', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({
    id: 'h-dots', type: 'circle', source: 'hotels',
    paint: {
      'circle-color': ['match', ['get', 'tier'], 'low', TIER_COLORS.low, 'mid', TIER_COLORS.mid, TIER_COLORS.high],
      'circle-radius': 6, 'circle-stroke-color': '#14213d', 'circle-stroke-width': 2,
    },
  });
  map.addLayer({
    id: 'h-prices', type: 'symbol', source: 'hotels',
    layout: {
      'icon-image': ['concat', 'pill-', ['get', 'tier']],
      'icon-text-fit': 'both',
      'text-field': ['get', 'label'],
      'text-font': ['Noto Sans Bold'],
      'text-size': 12,
      'icon-allow-overlap': false,
      'text-allow-overlap': false,
      'symbol-sort-key': ['get', 'perNight'],
    },
    paint: { 'text-color': '#ffffff' },
  });
  map.addLayer({
    id: 'h-chosen', type: 'circle', source: 'hotels', filter: ['==', ['get', 'id'], ''],
    paint: { 'circle-color': 'rgba(0,0,0,0)', 'circle-radius': 16, 'circle-stroke-color': '#14213d', 'circle-stroke-width': 3 },
  });
  for (const layer of ['h-dots', 'h-prices']) {
    map.on('click', layer, (e) => openHotel(e.features[0].properties.id));
    map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
  }
}

function drawHotels() {
  const src = map?.getSource?.('hotels');
  if (!src || !hotelResults) return;
  const t = tiers(hotelResults.hotels);
  const n = hotelResults.nights;
  src.setData({
    type: 'FeatureCollection',
    features: hotelResults.hotels.map((h) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [h.lng, h.lat] },
      properties: { id: h.id, tier: tierOf(h, t), perNight: Math.round(h.total / n), label: `${Math.round(h.total / n)} €` },
    })),
  });
  map.setFilter('h-chosen', ['==', ['get', 'id'], hotel.id || '']);
  const bounds = new maplibregl.LngLatBounds();
  hotelResults.hotels.forEach((h) => bounds.extend([h.lng, h.lat]));
  chosenPlaces().forEach((a) => bounds.extend([a.lng, a.lat]));
  if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 40, maxZoom: 15, duration: 600 });
}

function openHotel(id) {
  const h = hotelResults?.hotels.find((x) => x.id === id);
  if (!h) return;
  const n = hotelResults.nights;
  const on = hotel.id === h.id;
  const near = chosenPlaces().map((a) => ({ a, d: km(a, { lat: h.lat, lng: h.lng }) })).sort((x, y) => x.d - y.d);
  showDialog($('v-sheet'), `
    <div class="a-top${h.photo ? ' has-photo' : ''}">${h.photo ? `<img src="${esc(h.photo)}" alt="${esc(h.name)}">` : '<span aria-hidden="true">🏨</span>'}<button type="button" class="a-close" data-close aria-label="Fermer">×</button></div>
    <div class="a-body">
      <p class="a-kicker">${starsTxt(h.stars)}${h.rating ? ` · ${String(h.rating).replace('.', ',')}/10${h.reviews ? ` (${h.reviews} avis)` : ''}` : ''}</p>
      <h2 id="a-title">${esc(h.name)}</h2>
      ${h.address ? `<p class="a-text">${esc(h.address)}</p>` : ''}
      <div class="box"><span class="box-h">💶 Prix pour vos dates</span><table>
        <tr><td>Total, ${n} nuit${n > 1 ? 's' : ''} (${esc(paxLabel(paxGet()))})</td><td>${euro(h.total)}</td></tr>
        <tr><td>Soit par nuit</td><td>${euro(Math.round(h.total / n))}</td></tr></table></div>
      ${near.length ? `<div class="box"><span class="box-h">🚶 Vos activités</span><table>${near.slice(0, 4).map(({ a, d }) => `<tr><td>${a.emoji} ${esc(a.nom)}</td><td>${d < 1 ? `${Math.round(d * 1000 / 50) * 50} m` : `${d.toFixed(1).replace('.', ',')} km`}</td></tr>`).join('')}</table></div>` : ''}
      <div class="box" id="h-transit"><span class="box-h">🚇 Transports à pied</span><span class="muted">Recherche des stations proches…</span></div>
      <button type="button" class="btn ${on ? 'btn-line' : 'btn-ink'}" id="h-choose">${on ? '✓ Hôtel choisi · retirer' : 'Choisir cet hôtel pour mon séjour'}</button>
      <p class="a-legal">Prix trouvé à l'instant pour vos dates ; il peut changer au moment de réserver.</p>
    </div>`);
  loadTransit(h);
  $('h-choose').onclick = () => {
    if (on) hotel = { gamme: hotel.gamme, prix: 0 };
    else hotel = { gamme: hotel.gamme, prix: h.total, nom: h.name, id: h.id, nuits: n };
    saveHotel();
    updateFoot();
    showHotels();
    openHotel(h.id);
  };
}

// Activités sur la carte : celles choisies en couleur, les autres en gris.
function paintPins() {
  for (const [id, el] of Object.entries(pins)) {
    if (id.startsWith('r:')) { el.style.display = restos.has(id.slice(2)) ? '' : 'none'; continue; } // restaurants : seulement ceux choisis
    el.style.display = selected.has(id) ? '' : 'none'; // seules les activités choisies restent sur la carte
    el.classList.add('is-on');
  }
}

// ---------------------------------------------------------------------------
// Circuit : étapes, flèche de retour, bas d'écran (total + bouton pour avancer)
// ---------------------------------------------------------------------------
const STEP_TEXT = {
  1: { next: 'Garder ce vol et continuer' },
  2: { next: 'Continuer vers les restaurants', skip: "Passer, pas d'activités" },
  3: { next: "Continuer vers l'hôtel", skip: 'Passer, pas de restaurant' },
  4: { next: 'Voir mon voyage', skip: "Passer, j'ai déjà un logement" },
  5: {},
};

function setupSteps() {
  $('c-steps').onclick = (e) => {
    const b = e.target.closest('[data-go]');
    if (b) go(Number(b.dataset.go));
  };
  $('c-back').onclick = () => (step > 1 ? go(step - 1) : (location.href = 'index.html'));
  $('c-next').onclick = () => go(step + 1);
  $('c-skip').onclick = () => {
    if (step === 2) { selected.clear(); saveSelection(); renderList(); paintPins(); renderHotel(); }
    if (step === 3) { restos.clear(); saveRestos(); renderRestos(); paintPins(); }
    if (step === 4) { hotel = { gamme: hotel.gamme, prix: 0, aucun: true }; saveHotel(); }
    go(step + 1);
  };
  window.addEventListener('hashchange', () => show(stepFromHash()));
  show(stepFromHash());
}

function stepFromHash() {
  const n = Number(location.hash.replace('#', ''));
  return n >= 1 && n <= 5 ? n : 1;
}

function go(n) {
  n = Math.min(5, Math.max(1, n));
  if (n === step) return show(n);
  location.hash = String(n); // déclenche show() et garde l'historique (bouton retour du téléphone)
}

function show(n) {
  step = n;
  document.querySelectorAll('.c-step').forEach((sec) => { sec.hidden = Number(sec.dataset.step) !== n; });
  document.querySelectorAll('#c-steps li').forEach((li, i) => {
    li.classList.toggle('is-on', i + 1 === n);
    li.classList.toggle('is-done', i + 1 < n);
    li.querySelector('i').textContent = i + 1 < n ? '✓' : String(i + 1);
  });
  document.body.dataset.step = String(n);
  $('c-back').setAttribute('aria-label', n > 1 ? "Retour à l'étape précédente" : 'Retour aux vols');
  if (n === 4) { if (!map) setupMap(); else { map.resize(); drawZone(); } }
  if (n === 5) renderRecap();
  updateFoot();
  window.scrollTo({ top: 0 });
}

function totals() {
  const pax = paxGet();
  const flight = trip ? trip.price * paxCount(pax) : 0;
  const acts = guide.activites.filter((a) => selected.has(a.id)).reduce((s, a) => s + groupCost(a, pax).total, 0);
  const hotelPrice = hotel.prix > 0 ? hotel.prix : 0;
  return { pax, flight, acts, hotelPrice, total: flight + acts + hotelPrice };
}

function updateFoot() {
  if (!guide) return;
  const t = totals();
  const parts = [trip ? 'Vol' : null, selected.size ? `${selected.size} activité${selected.size > 1 ? 's' : ''}` : null, t.hotelPrice ? 'hôtel' : null].filter(Boolean);
  $('c-total-label').textContent = step === 5 ? 'Total de votre voyage' : parts.length ? parts.join(' + ') : 'Mon voyage';
  $('c-total').textContent = euro(step === 5 ? recapTotal() : t.total);
  const txt = STEP_TEXT[step];
  $('c-next').hidden = !txt.next;
  if (txt.next) $('c-next').textContent = `${txt.next} →`;
  const showSkip = txt.skip && ((step === 2 && !selected.size) || (step === 3 && !restos.size) || (step === 4 && !hotel.prix));
  $('c-skip').hidden = !showSkip;
  if (showSkip) $('c-skip').textContent = txt.skip;
}

function refresh() {
  renderFlight();
  renderHotel();
  updateFoot();
  if (step === 5) renderRecap();
}

function saveSelection() {
  try { localStorage.setItem(SEL_KEY, JSON.stringify([...selected])); } catch {}
}

// ---------------------------------------------------------------------------
// Étape 1 : le vol choisi
// ---------------------------------------------------------------------------
let flightsCache = [];
function renderFlight(flights) {
  if (flights) flightsCache = flights;
  const pax = paxGet();
  $('s1-pax').innerHTML = `👥 ${esc(paxLabel(pax))}${pax.children.length ? ` (${pax.children.map((a) => (a === 0 ? '< 1 an' : `${a} an${a > 1 ? 's' : ''}`)).join(', ')})` : ''} <span>Modifier</span>`;
  if (!trip) {
    $('t-s1').textContent = `Votre vol pour ${cityName}`;
    const best = flightsCache.length ? flightsCache.reduce((a, b) => (b.price < a.price ? b : a)) : null;
    $('s1-flight').innerHTML = `
      <div class="f-card f-empty">
        <p><b>Vous n'avez pas encore choisi de vol.</b>${best ? ` Vols directs depuis ${esc(origin.city)} dès ${best.price} € l'aller.` : ''}</p>
        <a class="btn btn-main" href="index.html">Choisir mon vol</a>
      </div>`;
    return;
  }
  $('t-s1').textContent = `Votre vol pour ${cityName}`;
  const dur = trip.dur ? `${Math.floor(trip.dur / 60)} h ${String(trip.dur % 60).padStart(2, '0')}` : '';
  const day = (d) => fmtDay.format(new Date(`${d}T12:00`));
  const n = paxCount(pax);
  $('s1-flight').innerHTML = `
    <div class="f-card">
      <p class="f-route">${esc(origin.city)} → ${esc(cityName)} · vol direct${dur ? ` · ${dur}` : ''}</p>
      <div class="f-leg"><span><b>Aller</b> · ${esc(day(trip.out))}</span><strong>${trip.vo ? euro(trip.vo) : ''}</strong></div>
      ${trip.ret ? `<div class="f-leg"><span><b>Retour</b> · ${esc(day(trip.ret))}</span><strong>${trip.vr ? euro(trip.vr) : ''}</strong></div>` : ''}
      <div class="f-leg f-sum"><span>${n} voyageur${n > 1 ? 's' : ''} × ${euro(trip.price)}</span><strong>${euro(trip.price * n)}</strong></div>
      <p class="f-small">Prix repérés par les voyageurs ; le prix exact s'affiche au moment de réserver.</p>
      <a class="f-change" href="index.html">Changer de vol ou de dates</a>
    </div>`;
}

// ---------------------------------------------------------------------------
// Étape 4 : récapitulatif, cases à cocher, réservation dans l'ordre
// ---------------------------------------------------------------------------
function loadBook() {
  try { return { vol: true, hotel: true, acts: true, done: {}, ...JSON.parse(localStorage.getItem(BOOK_KEY)) }; } catch { return { vol: true, hotel: true, acts: true, done: {} }; }
}
function saveBook() {
  try { localStorage.setItem(BOOK_KEY, JSON.stringify(book)); } catch {}
}

function recapTotal() {
  const t = totals();
  return (book.vol ? t.flight : 0) + (book.hotel ? t.hotelPrice : 0) + (book.acts ? t.acts : 0);
}

function kiwiLink(pax) {
  const p = new URLSearchParams({ from: origin.code, to: trip.airport, departure: trip.out, lang: 'fr', currency: 'EUR', stopNumber: '0', adults: pax.adults });
  if (trip.ret) p.set('return', trip.ret);
  if (pax.children.length) p.set('children', pax.children.filter((a) => a >= 2).length);
  if (pax.children.some((a) => a < 2)) p.set('infants', pax.children.filter((a) => a < 2).length);
  const url = `https://www.kiwi.com/deep?${p}`;
  return KIWI_AFFILIATE_TEMPLATE ? KIWI_AFFILIATE_TEMPLATE.replace('{url}', encodeURIComponent(url)) : url;
}

function hotelLink(pax) {
  const { inD, outD } = stayDates();
  const b = new URLSearchParams({ ss: `${hotel.nom}, ${cityName}`, checkin: inD, checkout: outD, group_adults: pax.adults, group_children: pax.children.length, no_rooms: '1', lang: 'fr', selected_currency: 'EUR' });
  for (const age of pax.children) b.append('age', age);
  return `https://www.booking.com/searchresults.fr.html?${b}`;
}

function renderRecap() {
  const t = totals();
  const pax = t.pax;
  const acts = guide.activites.filter((a) => selected.has(a.id));
  const n = paxCount(pax);
  const row = (key, on, icon, title, sub, amount, can = true) => `
    <label class="r-row${can ? '' : ' is-none'}">
      <input type="checkbox" data-book="${key}" ${on && can ? 'checked' : ''} ${can ? '' : 'disabled'}>
      <span class="r-main"><b>${icon} ${title}</b><small>${sub}</small></span>
      <strong>${amount}</strong>
    </label>`;
  const lines = [
    trip ? row('vol', book.vol, '✈', `Vols ${trip.ret ? 'aller-retour' : 'aller simple'}`, `${esc(fmtDay.format(new Date(`${trip.out}T12:00`)))}${trip.ret ? ` → ${esc(fmtDay.format(new Date(`${trip.ret}T12:00`)))}` : ''} · ${n} voyageur${n > 1 ? 's' : ''}`, euro(t.flight))
      : row('vol', false, '✈', 'Vol', 'pas encore choisi', '—', false),
    hotel.prix ? row('hotel', book.hotel, '🏨', esc(hotel.nom || 'Hôtel'), `${hotel.nuits || nights()} nuit${(hotel.nuits || nights()) > 1 ? 's' : ''}`, euro(t.hotelPrice))
      : row('hotel', false, '🏨', 'Hôtel', hotel.aucun ? 'vous avez déjà un logement' : 'pas choisi', '—', false),
    acts.length ? row('acts', book.acts, '🎟', `${acts.length} activité${acts.length > 1 ? 's' : ''}`, esc(acts.map((a) => a.nom).join(', ')), euro(t.acts))
      : row('acts', false, '🎟', 'Activités', 'aucune choisie', '—', false),
  ].join('');

  // Réservation dans l'ordre : le vol d'abord (son prix bouge le plus vite), puis l'hôtel, puis les activités.
  const steps = [];
  if (trip && book.vol) steps.push({ id: 'vol', title: 'Le vol', sub: 'sur Kiwi.com, voyageurs et dates déjà remplis', href: kiwiLink(pax), sponsored: true });
  if (hotel.prix && book.hotel) steps.push({ id: 'hotel', title: `L'hôtel · ${esc(hotel.nom || '')}`, sub: 'sur Booking.com, dates et voyageurs déjà remplis', href: hotelLink(pax) });
  if (acts.length && book.acts) {
    for (const a of acts.filter((x) => x.reservation !== 'libre')) {
      const partner = PARTNER_LINKS[a.id];
      const href = partner || a.site_officiel;
      if (href) steps.push({ id: `a-${a.id}`, title: esc(a.nom), sub: partner ? 'chez notre partenaire' : 'sur le site officiel', href, sponsored: Boolean(partner) });
    }
  }
  // Restaurants : rien à payer d'avance ; on réserve la table quand c'est conseillé.
  const rs = chosenRestos();
  for (const r of rs.filter((x) => x.reservation !== 'sur_place')) {
    steps.push({ id: `r-${r.id}`, title: `🍽️ ${esc(r.nom)}`, sub: `table à réserver${r.reservation_delai ? ` (${esc(r.reservation_delai)})` : ''}`, href: mapsLink(r) });
  }
  const walkIn = rs.filter((x) => x.reservation === 'sur_place');
  const free = acts.filter((a) => a.reservation === 'libre');
  $('s4').innerHTML = `
    <p class="c-sub">Décochez ce que vous ne voulez pas réserver maintenant.</p>
    <div class="r-list">${lines}</div>
    ${rs.length ? `
      <div class="r-food">
        <p class="r-food-h">🍽️ Vos restaurants <small>à régler sur place</small></p>
        <ul>${rs.map((r) => `<li><b>${esc(r.nom)}</b> · ${esc(r.quartier)}<span>${esc(r.prix)} / pers.</span></li>`).join('')}</ul>
      </div>` : ''}
    ${steps.length ? `
      <h3 class="r-h3">Réservez dans cet ordre</h3>
      <p class="c-sub">Chaque bouton ouvre le site du partenaire dans un nouvel onglet. Revenez ici ensuite et cochez « C'est réservé ».</p>
      <ol class="r-steps">${steps.map((x, i) => {
        const done = book.done[x.id];
        return `
        <li class="r-step${done ? ' is-done' : ''}">
          <span class="r-n">${done ? '✓' : i + 1}</span>
          <span class="r-main"><b>${x.title}</b><small>${x.sub}</small></span>
          <span class="r-actions">
            <a class="r-go" href="${esc(x.href)}" target="_blank" rel="${x.sponsored ? 'sponsored ' : ''}noopener">Réserver →</a>
            <button type="button" class="r-done" data-done="${esc(x.id)}">${done ? 'Annuler' : "C'est réservé"}</button>
          </span>
        </li>`;
      }).join('')}</ol>` : '<p class="c-note">Cochez au moins un élément à réserver.</p>'}
    ${walkIn.length ? `<p class="c-note">Restaurants sans réservation : ${esc(walkIn.map((r) => r.nom).join(', '))} (venez tôt).</p>` : ''}
    ${free.length && book.acts ? `<p class="c-note">Sans réservation : ${esc(free.map((a) => a.nom).join(', '))} (accès libre).</p>` : ''}
    <p class="a-legal">Chaque partenaire vous fait payer sa part directement. Prix indicatifs : le prix exact s'affiche chez le partenaire.</p>`;
  $('s4').onchange = (e) => {
    const k = e.target.dataset.book;
    if (!k) return;
    book[k] = e.target.checked;
    saveBook();
    renderRecap();
    updateFoot();
  };
  $('s4').onclick = (e) => {
    const d = e.target.closest('[data-done]');
    if (!d) return;
    book.done[d.dataset.done] = !book.done[d.dataset.done];
    saveBook();
    renderRecap();
  };
}

// ---------------------------------------------------------------------------
// Transports près d'un hôtel (api/transports.js, données OpenStreetMap)
// ---------------------------------------------------------------------------
async function loadTransit(h) {
  const box = () => $('h-transit');
  const key = `t:${h.lat.toFixed(3)},${h.lng.toFixed(3)}`;
  let data = null;
  try { data = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch {}
  if (!data) {
    try {
      const r = await fetch(`api/transports?c=${code}&lat=${h.lat.toFixed(4)}&lng=${h.lng.toFixed(4)}`);
      data = await r.json();
      if (!r.ok || data.status !== 'ok') throw new Error();
      try { sessionStorage.setItem(key, JSON.stringify(data)); } catch {}
    } catch {
      if (box()) box().innerHTML = '<span class="box-h">🚇 Transports à pied</span><span class="muted">Information indisponible pour le moment.</span>';
      return;
    }
  }
  if (!box() || !$('v-sheet').open) return;
  const rows = [];
  const line = (icon, label, x) => {
    if (!x) return;
    const lines = x.lines?.length ? ` <span class="t-lines">${x.lines.map((l) => `<i>${esc(l)}</i>`).join('')}</span>` : '';
    rows.push(`<tr><td>${icon} ${label}${x.name ? ` <b>${esc(x.name)}</b>` : ''}${lines}</td><td>${x.min} min</td></tr>`);
  };
  line('Ⓜ️', 'Métro', data.metro);
  line('🚆', 'Train', data.train);
  if (data.bus) rows.push(`<tr><td>🚌 Bus · ${data.busStops > 10 ? 'nombreux arrêts à moins de 5 min' : data.busStops > 1 ? `${data.busStops} arrêts à moins de 5 min` : 'arrêt le plus proche'}</td><td>${data.bus.min} min</td></tr>`);
  const verdict = data.metro && data.metro.min <= 5 ? '👍 Très bien desservi' : (data.metro && data.metro.min <= 10) || (data.bus && data.bus.min <= 3) ? 'Bien desservi' : 'Peu de transports tout près';
  box().innerHTML = rows.length
    ? `<span class="box-h">🚇 Transports à pied · ${verdict}</span><table>${rows.join('')}</table>`
    : '<span class="box-h">🚇 Transports à pied</span><span class="muted">Pas de station trouvée à moins de 15 minutes à pied.</span>';
}
