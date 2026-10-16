// Page « guide » d'une ville : ville.html?c=BCN (&out=…&ret=…&vol=… quand on vient d'un vol)
// Lit la fiche de la ville (villes.json), ses activités (guides/CODE.json) et le prix du
// vol direct le moins cher repéré (data.json). Le visiteur coche des activités : un devis
// est calculé pour son groupe (adultes + enfants, voir voyageurs.js).

// Liens partenaires par activité (Tiqets…), à remplir quand les liens seront créés dans
// Travelpayouts. Sans lien, seul le bouton « Site officiel » s'affiche.
const PARTNER_LINKS = {
  // 'sagrada-familia': 'https://…',
};

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
  pins[id]?.classList.toggle('is-on', selected.has(id));
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
  return { pax, lines, acts, flight, total: acts + (flight || 0) };
}

function updateBar() {
  const n = selected.size;
  $('v-bar').hidden = n === 0;
  document.body.classList.toggle('has-bar', n > 0);
  if (!n) return;
  const q = quote();
  $('bar-count').textContent = `Mon séjour · ${n} activité${n > 1 ? 's' : ''}`;
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
        <span class="v-emoji" aria-hidden="true">${a.emoji}</span>
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
    <div class="a-top" aria-hidden="true">${a.emoji}<button type="button" class="a-close" data-close aria-label="Fermer">×</button></div>
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
        ${q.lines.map((l) => `
          <li><span><b>${l.a.emoji} ${esc(l.a.nom)}</b><small>${esc(l.detail)}${l.estimation ? ' · estimation' : ''}</small></span><strong>${l.total === 0 ? 'Gratuit' : euro(l.total)}</strong>
          <button type="button" class="q-remove" data-remove="${esc(l.a.id)}" aria-label="Retirer ${esc(l.a.nom)}">×</button></li>`).join('')}
      </ul>
      ${q.flight == null ? '<p class="q-hint">Pour ajouter les vols au devis, choisissez vos dates sur la page des vols puis touchez « Que faire à … ? ».</p>' : ''}
      <p class="q-total"><span>Total${q.flight != null ? '' : ' des activités'}</span><strong>${euro(q.total)}</strong></p>
      <p class="a-legal">Estimation pour votre groupe, d'après les prix publics${est ? ' (certains prix sont des moyennes)' : ''}. L'hébergement viendra bientôt.</p>
      <button type="button" class="btn btn-line" data-close>Continuer à choisir</button>
    </div>`);
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
      ${p ? `<p class="c-item"><b>Photo</b>${esc(p.alt || '')} : ${esc(p.author)}, licence ${esc(p.license)}${p.page ? ` · <a href="${esc(p.page)}" target="_blank" rel="noopener">voir sur Wikimedia Commons</a>` : ''}</p>` : ''}
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
    const map = new maplibregl.Map({
      container: 'v-map', style, bounds, fitBoundsOptions: { padding: 30 },
      attributionControl: false, dragRotate: false, pitchWithRotate: false, cooperativeGestures: true,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
    // Le « i » de la mention OpenStreetMap démarre replié (MapLibre l'ouvre au chargement).
    map.on('load', () => map.getContainer().querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show'));
    for (const a of acts) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `v-pin${selected.has(a.id) ? ' is-on' : ''}`;
      el.textContent = a.emoji;
      el.setAttribute('aria-label', a.nom);
      el.addEventListener('click', () => openSheet(a.id));
      pins[a.id] = el;
      new maplibregl.Marker({ element: el }).setLngLat([a.lng, a.lat]).addTo(map);
    }
  } catch (err) {
    console.warn('Carte indisponible :', err);
    $('v-map').innerHTML = '<p style="padding:16px">La carte ne peut pas s\'afficher sur cet appareil.</p>';
  }
}
