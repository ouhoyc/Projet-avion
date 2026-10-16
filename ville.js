// Page « guide » d'une ville : ville.html?c=BCN
// Lit la fiche de la ville (villes.json), ses activités (guides/CODE.json) et le prix du
// vol direct le moins cher repéré (data.json).

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
  indispensable: 'Réserver à l\'avance',
  conseille: 'Réserver conseillé',
  sur_place: 'Sur place possible',
  libre: 'Accès libre',
};

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtEuro = (v) => {
  if (typeof v !== 'number') return esc(v) + (/\d/.test(v) && !/€|pièce|personne/.test(v) ? ' €' : '');
  return (Number.isInteger(v) ? v : v.toFixed(2).replace('.', ',')) + ' €';
};

let guide = null;
let filter = 'all';

init();

async function init() {
  const code = (new URLSearchParams(location.search).get('c') || 'BCN').toUpperCase().replace(/[^A-Z]/g, '');
  const [villes, g, data] = await Promise.all([
    getJson('villes.json'), getJson(`guides/${code}.json`), getJson('data.json'),
  ]);
  if (!g) {
    $('v-city').textContent = 'Guide pas encore disponible';
    return;
  }
  guide = g;
  const ville = villes?.[code] || {};
  const flights = (data?.destinations || []).filter((d) => d.city_code === code);
  const name = flights[0]?.city || code;

  document.title = `Que faire à ${name} ? · Vols directs depuis Lyon`;
  $('v-city').textContent = name;
  $('v-country').textContent = flights[0]?.country || '';
  if (ville.pitch) $('v-pitch').textContent = ville.pitch;
  if (ville.photo?.src) $('v-hero').style.backgroundImage = `url("${ville.photo.src}")`;
  $('t-acts').textContent = `Que faire à ${name} ?`;

  if (flights.length) {
    const best = flights.reduce((a, b) => (b.price < a.price ? b : a));
    const dur = best.duration ? ` · ${Math.floor(best.duration / 60)} h ${String(best.duration % 60).padStart(2, '0')}` : '';
    $('v-flight').innerHTML = `
      <span><b>✈ Vol direct depuis ${esc(data.origin.city)}${dur}</b><small>Voir les dates et les prix</small></span>
      <span class="price">aller simple dès<strong>${best.price} €</strong></span>`;
    $('v-flight').hidden = false;
  }

  const photoCredit = ville.photo ? `Photo : ${esc(ville.photo.author)} (${esc(ville.photo.license)}). ` : '';
  $('v-foot').innerHTML = `${photoCredit}Prix des activités vérifiés le ${esc(new Date(guide.verifie_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }))} : ils peuvent changer, vérifiez avant de réserver.`;

  renderChips();
  renderList();
  setupMap();
  $('v-list').addEventListener('click', (e) => {
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

// Filtres : « Tout », « Gratuit », puis les types présents dans la liste.
function renderChips() {
  const present = [...new Set(guide.activites.map((a) => a.type))].filter((t) => TYPES[t]);
  const chips = [['all', 'Tout'], ['free', 'Gratuit'], ...Object.keys(TYPES).filter((t) => present.includes(t)).map((t) => [t, TYPES[t]])];
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
  return `<small>dès</small>${fmtEuro(a.prix)}`;
}

function renderList() {
  const acts = guide.activites.filter((a) => filter === 'all' || (filter === 'free' ? a.prix === 0 : a.type === filter));
  $('v-list').innerHTML = acts.map((a) => `
    <li><button type="button" class="v-act" data-act="${esc(a.id)}">
      <span class="v-emoji" aria-hidden="true">${a.emoji}</span>
      <span class="v-act-main">
        <span class="v-act-name">${esc(a.nom)}</span>
        <span class="v-act-meta">${esc(TYPES[a.type] || '')} · ${esc(a.duree)}</span>
        <span class="tag tag-${a.reservation}">${BOOKING[a.reservation]}</span>
      </span>
      <span class="v-act-price">${priceLabel(a)}</span>
    </button></li>`).join('');
}

function openSheet(id) {
  const a = guide.activites.find((x) => x.id === id);
  if (!a) return;
  const partner = PARTNER_LINKS[a.id];
  const boxClass = a.reservation === 'indispensable' ? 'box-warn' : a.reservation === 'conseille' ? 'box-mid' : '';
  const booking = a.reservation === 'libre'
    ? 'Accès libre, rien à réserver.'
    : `<b>${BOOKING[a.reservation]}</b>${a.reservation_delai ? ` : ${esc(a.reservation_delai)}` : ''}`;
  $('v-sheet').innerHTML = `
    <div class="a-top" aria-hidden="true">${a.emoji}<button type="button" class="a-close" data-close aria-label="Fermer">×</button></div>
    <div class="a-body">
      <p class="a-kicker">${esc(TYPES[a.type] || '')} · ${esc(a.quartier)}</p>
      <h2 id="a-title">${esc(a.nom)}</h2>
      <p class="a-text">${esc(a.texte)}</p>
      <div class="box ${boxClass}"><span class="box-h">🗓 Réservation</span>${booking}</div>
      <div class="box"><span class="box-h">💶 Prix</span><table>${a.prix_detail.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${fmtEuro(v)}</td></tr>`).join('')}</table></div>
      <div class="box"><span class="box-h">⏱ Pratique</span>${esc(a.duree)} · ${esc(a.moment)}</div>
      ${a.note ? `<p class="a-note">ℹ️ ${esc(a.note)}</p>` : ''}
      ${partner ? `<a class="btn btn-main" href="${esc(partner)}" target="_blank" rel="sponsored noopener">Réserver</a>` : ''}
      ${a.site_officiel ? `<a class="btn ${partner ? 'btn-line' : 'btn-main'}" href="${esc(a.site_officiel)}" target="_blank" rel="noopener">Site officiel</a>` : ''}
      ${partner ? '<p class="a-legal">Le bouton « Réserver » passe par notre partenaire : nous touchons une petite commission, sans frais en plus pour vous.</p>' : ''}
    </div>`;
  const sheet = $('v-sheet');
  sheet.querySelector('[data-close]').onclick = () => sheet.close();
  sheet.onclick = (e) => { if (e.target === sheet) sheet.close(); };
  sheet.showModal();
}

// Carte de la ville : les activités en points (sans les excursions lointaines).
async function setupMap() {
  if (!window.maplibregl) return;
  try {
    const res = await fetch(MAP_STYLE);
    const style = await res.json();
    for (const layer of style.layers) {
      const field = layer.layout?.['text-field'];
      if (layer.type === 'symbol' && field && JSON.stringify(field).includes('name')) {
        layer.layout['text-field'] = ['coalesce', ['get', 'name:fr'], ['get', 'name:latin'], ['get', 'name']];
      }
    }
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
      el.className = 'v-pin';
      el.textContent = a.emoji;
      el.setAttribute('aria-label', a.nom);
      el.addEventListener('click', () => openSheet(a.id));
      new maplibregl.Marker({ element: el }).setLngLat([a.lng, a.lat]).addTo(map);
    }
  } catch (err) {
    console.warn('Carte indisponible :', err);
    $('v-map').innerHTML = '<p style="padding:16px">La carte ne peut pas s\'afficher sur cet appareil.</p>';
  }
}
