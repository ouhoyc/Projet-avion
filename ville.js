// Page « guide » d'une ville : ville.html?c=BCN (&out=…&ret=…&vol=… quand on vient d'un vol)
// Lit la fiche de la ville (villes.json), ses activités (guides/CODE.json) et le prix du
// vol direct le moins cher repéré (data.json). Le visiteur coche des activités : un devis
// est calculé pour son groupe (adultes + enfants, voir voyageurs.js).

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
const trip = params.get('out') ? { out: params.get('out'), ret: params.get('ret'), price: Number(params.get('vol')) || 0 } : null;
const SEL_KEY = `sejour-${code}`;

let guide = null;
let ville = {};
let cityName = code;
let filter = 'all';
let selected = new Set(loadSelection());
const pins = {};
const HOTEL_KEY = `hotel-${code}`;
let hotel = loadHotel();
let quartierChoisi = null; // null = quartier idéal calculé
let map = null;
let hotelsOn = false;       // le visiteur a demandé à voir les hôtels
let hotelResults = null;    // dernière liste reçue { hotels, nights, key }


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
  const flights = (data?.destinations || []).filter((d) => d.city_code === code);
  cityName = flights[0]?.city || code;

  document.title = `Que faire à ${cityName} ? · Vols directs depuis Lyon`;
  $('v-city').textContent = cityName;
  $('v-country').textContent = flights[0]?.country || '';
  if (ville.pitch) $('v-pitch').textContent = ville.pitch;
  if (ville.photo?.src) $('v-hero').style.backgroundImage = `url("${ville.photo.src}")`;
  $('t-acts').textContent = `Que faire à ${cityName} ?`;

  if (trip) {
    $('v-flight').innerHTML = `
      <span><b>✈ Votre vol direct</b><small>${esc(fmtDay.format(new Date(trip.out + 'T12:00')))}${trip.ret ? ` → ${esc(fmtDay.format(new Date(trip.ret + 'T12:00')))}` : ''} · changer de dates</small></span>
      <span class="price">${trip.ret ? 'aller-retour' : 'aller simple'}<strong>${euro(trip.price)}</strong></span>`;
    $('v-flight').hidden = false;
  } else if (flights.length) {
    const best = flights.reduce((a, b) => (b.price < a.price ? b : a));
    const dur = best.duration ? ` · ${Math.floor(best.duration / 60)} h ${String(best.duration % 60).padStart(2, '0')}` : '';
    $('v-flight').innerHTML = `
      <span><b>✈ Vol direct depuis ${esc(data.origin.city)}${dur}</b><small>Voir les dates et les prix</small></span>
      <span class="price">aller simple dès<strong>${best.price} €</strong></span>`;
    $('v-flight').hidden = false;
  }

  $('v-foot').textContent = `Prix des activités vérifiés le ${new Date(guide.verifie_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  $('open-credits').addEventListener('click', openCredits);
  $('open-quote').addEventListener('click', openQuote);

  renderChips();
  renderList();
  setupHotel();
  updateBar();
  setupMap();
  $('v-list').addEventListener('click', (e) => {
    const t = e.target.closest('[data-toggle]');
    if (t) return toggle(t.dataset.toggle);
    const b = e.target.closest('[data-act]');
    if (b) openSheet(b.dataset.act);
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
  updateBar();
  paintPins();
  renderHotel();
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

function quote() {
  const pax = paxGet();
  const lines = guide.activites.filter((a) => selected.has(a.id)).map((a) => ({ a, ...groupCost(a, pax) }));
  const acts = lines.reduce((s, l) => s + l.total, 0);
  const flight = trip ? trip.price * paxCount(pax) : null;
  const hotelPrice = hotel.prix > 0 ? hotel.prix : null;
  return { pax, lines, acts, flight, hotelPrice, total: acts + (flight || 0) + (hotelPrice || 0) };
}

function updateBar() {
  const n = selected.size;
  const show = n > 0 || hotel.prix > 0;
  $('v-bar').hidden = !show;
  document.body.classList.toggle('has-bar', show);
  if (!show) return;
  const q = quote();
  $('bar-count').textContent = `Mon séjour · ${n ? `${n} activité${n > 1 ? 's' : ''}` : 'hôtel'}${n && q.hotelPrice ? ' + hôtel' : ''}`;
  $('bar-pax').textContent = paxLabel(q.pax);
  $('bar-total').textContent = euro(q.total);
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
          <span class="tag tag-${a.reservation}">${BOOKING[a.reservation]}</span>
        </span>
        <span class="v-act-price">${priceLabel(a)}</span>
      </button>
      <button type="button" class="v-check" data-toggle="${esc(a.id)}" aria-pressed="${on}" aria-label="${on ? 'Retirer' : 'Ajouter'} ${esc(a.nom)} ${on ? 'de' : 'à'} mon séjour">${on ? '✓' : '+'}</button>
    </li>`;
  }).join('');
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
    <div class="a-top${a.photo ? ' has-photo' : ''}">${a.photo
      ? `<img src="${esc(a.photo.src)}" alt="${esc(a.nom)}"${a.photo.pos ? ` style="object-position:${esc(a.photo.pos)}"` : ''}>`
      : `<span aria-hidden="true">${a.emoji}</span>`}<button type="button" class="a-close" data-close aria-label="Fermer">×</button></div>
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

function openQuote() {
  const q = quote();
  const est = q.lines.some((l) => l.estimation);
  showDialog($('quote-sheet'), `
    <div class="a-body q-body">
      <button type="button" class="a-close q-close" data-close aria-label="Fermer">×</button>
      <p class="a-kicker">${esc(cityName)}</p>
      <h2 id="q-title">Mon séjour</h2>
      <button type="button" class="q-pax" id="q-pax">👥 ${esc(paxLabel(q.pax))}${q.pax.children.length ? ` (${q.pax.children.map((a) => (a === 0 ? '< 1 an' : `${a} an${a > 1 ? 's' : ''}`)).join(', ')})` : ''} <span>Modifier</span></button>
      <ul class="q-lines">
        ${q.flight != null ? `
          <li><span><b>✈ Vols ${trip.ret ? 'aller-retour' : 'aller simple'}</b><small>${paxCount(q.pax)} × ${euro(trip.price)} · prix repéré, à vérifier sur Kiwi.com</small></span><strong>${euro(q.flight)}</strong></li>` : ''}
        <li class="q-hotel"><span><b>🏨 Hôtel${hotelSummary() ? ` · ${esc(hotelSummary())}` : ''}</b><small>${hotel.nom ? 'Prix total trouvé pour vos dates' : 'Choisissez un hôtel sur la carte, ou notez son prix'}</small></span>
          <label class="q-hotel-in"><input type="number" id="q-hotel" min="0" step="1" inputmode="numeric" placeholder="—" value="${q.hotelPrice ?? ''}"> €</label></li>
        ${q.lines.map((l) => `
          <li><span><b>${l.a.emoji} ${esc(l.a.nom)}</b><small>${esc(l.detail)}${l.estimation ? ' · estimation' : ''}</small></span><strong>${l.total === 0 ? 'Gratuit' : euro(l.total)}</strong>
          <button type="button" class="q-remove" data-remove="${esc(l.a.id)}" aria-label="Retirer ${esc(l.a.nom)}">×</button></li>`).join('')}
      </ul>
      ${q.flight == null ? '<p class="q-hint">Pour ajouter les vols au devis, choisissez vos dates sur la page des vols puis touchez « Que faire à … ? ».</p>' : ''}
      <p class="q-total"><span>Total${q.flight != null || q.hotelPrice ? '' : ' des activités'}</span><strong>${euro(q.total)}</strong></p>
      ${q.total && paxCount(q.pax) > 1 ? `<p class="q-per">soit ${euro(Math.round(q.total / paxCount(q.pax)))} par personne</p>` : ''}
      <p class="a-legal">Estimation pour votre groupe, d'après les prix publics${est ? ' (certains prix sont des moyennes)' : ''}. Le prix de l'hôtel est celui que vous avez noté.</p>
      <button type="button" class="btn btn-line" data-close>Continuer à choisir</button>
    </div>`);
  $('q-hotel').onchange = (e) => {
    hotel.prix = Math.max(0, Number(e.target.value) || 0);
    if (!hotel.prix) { delete hotel.nom; delete hotel.id; }
    saveHotel();
    updateBar();
    openQuote();
  };
  $('q-pax').onclick = () => paxOpen($('pax-sheet'), () => { updateBar(); openQuote(); });
  $('quote-sheet').querySelectorAll('[data-remove]').forEach((b) => {
    b.onclick = () => {
      toggle(b.dataset.remove);
      if (selected.size) openQuote();
      else $('quote-sheet').close();
    };
  });
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

async function setupMap() {
  if (!window.maplibregl) return;
  try {
    const style = await buildMapStyle();
    const acts = guide.activites.filter((a) => a.lat && a.type !== 'nature');
    const bounds = new maplibregl.LngLatBounds();
    acts.forEach((a) => bounds.extend([a.lng, a.lat]));
    map = new maplibregl.Map({
      container: 'v-map', style, bounds, fitBoundsOptions: { padding: 30 },
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
    <button type="button" class="btn btn-main" id="h-search">Voir les hôtels et leurs prix · ${esc(q.nom)}</button>
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

async function loadHotels(q, inD, outD, pax, g) {
  const p = new URLSearchParams({ c: code, lat: q.lat.toFixed(4), lng: q.lng.toFixed(4), in: inD, out: outD, adults: pax.adults, children: pax.children.join(','), gamme: g.id });
  const key = p.toString();
  if (hotelResults?.key === key) return showHotels();
  $('h-hotels').innerHTML = `<p class="h-loading">Recherche des hôtels à ${esc(q.nom)} pour vos dates…</p>`;
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
  if (stayDates().inD !== inD || currentQuartier().q.id !== q.id) return; // la recherche a changé entre-temps
  if (!data.hotels?.length) return bookingFallback(q, inD, outD, pax, g, `Aucun hôtel « ${g.nom} » trouvé ici pour vos dates.`);
  hotelResults = { key, ...data };
  showHotels();
  document.getElementById('t-map').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  $('h-list').innerHTML = list.slice(0, 12).map((h) => hotelCard(h, tierOf(h, t))).join('');
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
      <button type="button" class="btn ${on ? 'btn-line' : 'btn-ink'}" id="h-choose">${on ? '✓ Hôtel choisi · retirer' : 'Choisir cet hôtel pour mon séjour'}</button>
      <p class="a-legal">Prix trouvé à l'instant pour vos dates ; il peut changer au moment de réserver.</p>
    </div>`);
  $('h-choose').onclick = () => {
    if (on) hotel = { gamme: hotel.gamme, prix: 0 };
    else hotel = { gamme: hotel.gamme, prix: h.total, nom: h.name, id: h.id, nuits: n };
    saveHotel();
    updateBar();
    showHotels();
    openHotel(h.id);
  };
}

// Activités sur la carte : celles choisies en couleur, les autres en gris.
function paintPins() {
  for (const [id, el] of Object.entries(pins)) {
    el.classList.toggle('is-on', selected.has(id));
    el.classList.toggle('is-off', selected.size > 0 && !selected.has(id));
  }
}
