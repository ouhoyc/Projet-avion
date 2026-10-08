// Recherche « Où ? / Quand ? / Combien de nuits ? » à partir des prix jour par jour
// (daily.json). Tous les champs sont facultatifs :
//   - sans destination  → « où partir ? » : meilleure option pour chaque ville ;
//   - avec destination  → « quand partir ? » : meilleures dates pour cette ville ;
//   - sans dates        → sur les 12 prochains mois.
// En aller-retour, on combine deux vols directs (aller + retour) et on propose aussi
// d'autres durées de séjour si elles sont moins chères.
// Les villes à plusieurs aéroports (Londres, Paris, Milan…) sont regroupées.
// Utilise les fonctions communes définies dans app.js (formatDay, fmtPrice, flag…).

const NIGHTS_SPREAD = 3;     // suggestions : jusqu'à 3 nuits de moins ou de plus
const MAX_DATE_OPTIONS = 8;  // dates proposées pour une destination précise
const PAGE_SIZE = 10;        // villes affichées avant « Voir plus »

const sEls = {
  form: $('search-form'),
  dest: $('s-dest'),
  from: $('s-from'),
  to: $('s-to'),
  nights: $('s-nights'),
  nightsField: $('s-nights-field'),
  budget: $('s-budget'),
  results: $('search-results'),
};

// Résultats de la dernière recherche (pour « Voir plus » et les pastilles de durée).
const searchState = { results: [], query: null, shown: 0, airlines: {} };

let dailyPromise = null;
function loadDaily() {
  dailyPromise ||= fetch('daily.json', { cache: 'no-cache' }).then((r) => {
    if (!r.ok) throw new Error(r.status);
    return r.json();
  });
  return dailyPromise;
}

// ---------------------------------------------------------------------------
// Formulaire
// ---------------------------------------------------------------------------
setupSearchForm();

function setupSearchForm() {
  const today = isoDay(new Date());
  const max = isoDay(addDays(new Date(), 365));
  for (const input of [sEls.from, sEls.to]) { input.min = today; input.max = max; }

  sEls.from.addEventListener('change', () => {
    if (sEls.from.value) sEls.to.min = sEls.from.value;
    if (sEls.to.value && sEls.to.value < sEls.from.value) sEls.to.value = sEls.from.value;
  });

  sEls.form.addEventListener('change', (e) => {
    if (e.target.name === 'trip') sEls.nightsField.hidden = tripType() === 'ow';
  });

  sEls.form.addEventListener('click', (e) => {
    const step = e.target.closest('[data-step]');
    if (!step) return;
    sEls.nights.value = clamp(Number(sEls.nights.value || 4) + Number(step.dataset.step), 1, 21);
  });

  sEls.form.addEventListener('submit', (e) => {
    e.preventDefault();
    runSearch();
  });

  sEls.results.addEventListener('click', (e) => {
    // « Voir » : panneau de réservation avec vérification en direct.
    const book = e.target.closest('[data-trip]');
    if (book) return openTripSheet(JSON.parse(book.dataset.trip));

    // Pastille « 3 nuits · 62 € » : devient l'option affichée de la fiche.
    const chip = e.target.closest('[data-pick]');
    if (chip) {
      const [cityIndex, optionIndex] = chip.dataset.pick.split(':').map(Number);
      const city = searchState.results[cityIndex];
      city.selected = optionIndex;
      chip.closest('.card').outerHTML = cityCardHtml(city, cityIndex);
      return;
    }

    if (e.target.closest('[data-more]')) renderMore();
  });

  // Liste des villes (une seule entrée par ville, même avec plusieurs aéroports).
  const fill = () => {
    if (!data) return setTimeout(fill, 150);
    const cities = new Map();
    for (const d of data.destinations) {
      if (!cities.has(d.city_code)) cities.set(d.city_code, d);
    }
    const sorted = [...cities.values()].sort((a, b) => a.city.localeCompare(b.city, 'fr'));
    for (const d of sorted) sEls.dest.add(new Option(`${d.city} – ${d.country}`, d.city_code));
  };
  fill();
}

function tripType() {
  return sEls.form.elements.trip.value;
}

// ---------------------------------------------------------------------------
// Moteur de recherche
// ---------------------------------------------------------------------------
async function runSearch() {
  sEls.results.hidden = false;
  sEls.results.innerHTML = '<div class="live-loading"><span class="spinner" aria-hidden="true"></span>Recherche des meilleures dates…</div>';

  let daily;
  try {
    daily = await loadDaily();
  } catch {
    sEls.results.innerHTML = '<p class="empty">Les prix jour par jour ne sont pas encore disponibles. Réessaie un peu plus tard.</p>';
    return;
  }

  const budget = Number(sEls.budget.value) || Infinity;
  const query = {
    type: tripType(),
    city: sEls.dest.value,
    start: sEls.from.value || isoDay(new Date()),
    end: sEls.to.value || isoDay(addDays(new Date(), 365)),
    nights: clamp(Number(sEls.nights.value) || 4, 1, 21),
    budget,
    datesGiven: Boolean(sEls.from.value || sEls.to.value),
  };
  if (query.end < query.start) [query.start, query.end] = [query.end, query.start];

  // Regroupe les aéroports par ville (ex. Londres = Gatwick + Luton).
  const byCity = new Map();
  for (const dest of data.destinations) {
    if (query.city && dest.city_code !== query.city) continue;
    if (!daily.dests[dest.code]) continue;
    if (!byCity.has(dest.city_code)) byCity.set(dest.city_code, []);
    byCity.get(dest.city_code).push(dest);
  }

  const results = [];
  for (const airports of byCity.values()) {
    const city = searchCity(airports, daily, query);
    if (city) results.push(city);
  }
  results.sort((a, b) => a.options[0].total - b.options[0].total);

  Object.assign(searchState, { results, query, shown: 0, airlines: daily.airlines || {} });
  renderResults();
  sEls.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Toutes les options d'une ville (tous aéroports confondus), triées par prix.
function searchCity(airports, daily, q) {
  let wanted = [];   // durée demandée (ou aller simple)
  let others = [];   // autres durées, pour les suggestions
  for (const dest of airports) {
    const prices = daily.dests[dest.code];
    const combos = q.type === 'ow' ? oneWayCombos(prices, q) : roundTripCombos(prices, q);
    for (const c of combos) {
      if (c.total > q.budget) continue;
      c.code = dest.code;
      (q.type === 'ow' || c.nights === q.nights ? wanted : others).push(c);
    }
  }
  if (!wanted.length && !others.length) return null;
  wanted.sort((a, b) => a.total - b.total);
  others.sort((a, b) => a.total - b.total);

  // Destination précise : plusieurs dates ; sinon : la meilleure option.
  const main = (wanted.length ? wanted : others).slice(0, q.city ? MAX_DATE_OPTIONS : 1);
  const reference = main[0];

  // Suggestions : la meilleure combinaison pour chaque autre durée, si elle est moins chère.
  const bestByNights = new Map();
  for (const c of others) if (!bestByNights.has(c.nights)) bestByNights.set(c.nights, c);
  const alternatives = [...bestByNights.values()]
    .filter((c) => c !== reference && c.total < reference.total)
    .sort((a, b) => a.total - b.total)
    .slice(0, 3);

  const dest = airports.find((a) => a.code === reference.code) || airports[0];
  return { dest, airports, options: [...main, ...alternatives], mainCount: main.length, selected: 0, exactNights: wanted.length > 0 };
}

// Aller simple : chaque jour de départ dans la période.
function oneWayCombos(prices, q) {
  return Object.entries(prices.o)
    .filter(([day]) => day >= q.start && day <= q.end)
    .map(([day, info]) => ({ total: info[0], nights: null, out: leg(day, info) }));
}

// Aller-retour : aller + retour direct dans la période, durée demandée ±3 nuits.
function roundTripCombos(prices, q) {
  const minN = Math.max(1, q.nights - NIGHTS_SPREAD);
  const maxN = q.nights + NIGHTS_SPREAD;
  const combos = [];
  for (const [day, outInfo] of Object.entries(prices.o)) {
    if (day < q.start || day > q.end) continue;
    for (let n = minN; n <= maxN; n++) {
      const back = isoDay(addDays(parseDay(day), n));
      if (back > q.end) break;
      const retInfo = prices.r[back];
      if (retInfo) combos.push({ total: outInfo[0] + retInfo[0], nights: n, out: leg(day, outInfo), ret: leg(back, retInfo) });
    }
  }
  return combos;
}

function leg(day, info) {
  const [price, airline, duration, time, seen] = info;
  return { day, price, airline, duration, time, seen };
}

// ---------------------------------------------------------------------------
// Affichage des résultats
// ---------------------------------------------------------------------------
function renderResults() {
  const { results, query: q } = searchState;
  const roundTrip = q.type === 'rt';
  const period = q.datesGiven ? `du ${formatDayShort(q.start)} au ${formatDayShort(q.end)}` : 'sur les 12 prochains mois';
  const budgetText = Number.isFinite(q.budget) ? `, ${fmtPrice.format(q.budget)} max` : '';

  if (!results.length) {
    sEls.results.innerHTML = `
      <div class="empty">
        <svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>
        <p>Aucun vol direct${roundTrip ? ' aller-retour' : ''} repéré ${escapeHtml(period)}${escapeHtml(budgetText)}.</p>
        <p class="hint">Élargis la période, le budget ou change le nombre de nuits : ces prix viennent des recherches récentes des voyageurs, certains jours n'en ont pas.</p>
      </div>`;
    return;
  }

  const title = q.city
    ? `Meilleures dates pour ${escapeHtml(results[0].dest.city)}`
    : `${results.length} destination${results.length > 1 ? 's' : ''}`;

  sEls.results.innerHTML = `
    <div class="section-head">
      <h2>${title}</h2>
      <p class="result-count">${escapeHtml(period + budgetText)}</p>
    </div>
    <ul class="cards result-list" id="result-list"></ul>
    <button type="button" class="btn btn-secondary-wide" data-more hidden></button>
    <p class="disclaimer"><svg class="icon" aria-hidden="true"><use href="#i-info"/></svg>
      <span>Derniers prix repérés par les voyageurs${roundTrip ? ', aller + retour' : ''}. Touche « Voir » pour vérifier les prix en direct avant de réserver.</span></p>`;
  renderMore();
}

// Ajoute les 10 villes suivantes.
function renderMore() {
  const list = $('result-list');
  const { results } = searchState;
  const next = results.slice(searchState.shown, searchState.shown + PAGE_SIZE);
  list.insertAdjacentHTML('beforeend', next.map((city, i) => cityCardHtml(city, searchState.shown + i)).join(''));
  searchState.shown += next.length;

  const more = sEls.results.querySelector('[data-more]');
  const left = results.length - searchState.shown;
  more.hidden = left <= 0;
  more.textContent = `Voir ${Math.min(left, PAGE_SIZE)} destination${left > 1 ? 's' : ''} de plus`;
}

function cityCardHtml(city, index) {
  const q = searchState.query;
  const roundTrip = q.type === 'rt';
  const { dest, options } = city;
  const multiAirport = city.airports.length > 1;

  // Destination précise : liste de dates ; sinon : une option + pastilles de durée.
  let mainOptions = q.city ? options.slice(0, city.mainCount) : [options[city.selected]];
  if (q.city && city.selected >= city.mainCount) mainOptions = [options[city.selected], ...mainOptions];
  const chips = options
    .map((o, i) => ({ o, i }))
    .filter(({ o, i }) => o.nights && (q.city ? i >= city.mainCount : i !== city.selected));
  const best = options[city.selected];

  return `
    <li class="card result ${priceTier(best.total / (roundTrip ? 2 : 1))}">
      <div class="card-top">
        <span class="flag" aria-hidden="true">${flag(dest.country_code)}</span>
        <div class="card-title">
          <h3 class="card-city">${escapeHtml(dest.city)}</h3>
          <p class="card-sub">${escapeHtml(dest.country)}${multiAirport ? ` · ${city.airports.length} aéroports` : ''}</p>
        </div>
      </div>
      ${mainOptions.map((o) => optionHtml(o, city)).join('')}
      ${chips.length ? `
        <div class="chips-alt">
          <span class="alt-title">${city.exactNights ? 'Moins cher :' : `Pas de ${q.nights} nuits, autres durées :`}</span>
          ${chips.map(({ o, i }) => `
            <button type="button" class="chip chip-alt" data-pick="${index}:${i}">
              ${o.nights} nuit${o.nights > 1 ? 's' : ''} · <strong>${fmtPrice.format(o.total)}</strong>
            </button>`).join('')}
        </div>` : ''}
    </li>`;
}

function optionHtml(o, city) {
  const trip = { code: o.code, out: o.out.day, ret: o.ret?.day || null, outPrice: o.out.price, retPrice: o.ret?.price ?? null };
  const airport = city.airports.length > 1 ? (city.airports.find((a) => a.code === o.code)?.airport || o.code) : '';
  return `
    <div class="option">
      <div class="legs">
        ${legHtml('Aller', o.out)}
        ${o.ret ? legHtml('Retour', o.ret) : ''}
        ${airport ? `<p class="leg-airport">Aéroport : ${escapeHtml(airport)} (${escapeHtml(o.code)})</p>` : ''}
      </div>
      <div class="option-side">
        ${o.nights ? `<span class="nights-badge">${o.nights} nuit${o.nights > 1 ? 's' : ''}</span>` : ''}
        <strong class="option-total">${fmtPrice.format(o.total)}</strong>
        <button type="button" class="btn btn-primary btn-small" data-trip='${escapeHtml(JSON.stringify(trip))}'>Voir</button>
      </div>
    </div>`;
}

// Une ligne par vol : « Aller · lun. 2 nov. 15:40 · 38 € », puis compagnie et fraîcheur du prix.
function legHtml(label, l) {
  const airline = searchState.airlines[l.airline] || l.airline;
  const seen = l.seen ? ` · vu ${shortSeen(l.seen)}` : '';
  return `
    <p class="leg">
      <span class="leg-main"><span class="leg-label">${label}</span> ${escapeHtml(formatDayShortWeek(l.day))}${l.time ? ` ${escapeHtml(l.time)}` : ''} · <strong>${fmtPrice.format(l.price)}</strong></span>
      <span class="leg-sub">${escapeHtml(airline)}${escapeHtml(seen)}</span>
    </p>`;
}

const fmtDayShortWeek = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
function formatDayShortWeek(day) {
  return fmtDayShortWeek.format(parseDay(day));
}

// « aujourd'hui », « hier », « il y a 4 j »
function shortSeen(day) {
  const days = Math.round((parseDay(isoDay(new Date())) - parseDay(day)) / 86400000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  return `il y a ${days} j`;
}

// ---------------------------------------------------------------------------
// Panneau de réservation : vérifie l'aller (et le retour) en direct
// ---------------------------------------------------------------------------
function openTripSheet(trip) {
  const dest = data.destinations.find((d) => d.code === trip.code);
  if (!dest) return;
  const origin = data.origin;
  const link = kiwiLink(origin.code, dest.code, trip.out, trip.ret);
  const repere = (trip.outPrice || 0) + (trip.retPrice || 0);

  sheet.innerHTML = `
    <div class="sheet-body">
      <div class="sheet-grip" aria-hidden="true"></div>
      <button type="button" class="sheet-close" data-close aria-label="Fermer">
        <svg class="icon" aria-hidden="true"><use href="#i-close"/></svg>
      </button>
      <p class="sheet-route">${escapeHtml(origin.city)} <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg> ${escapeHtml(dest.code)}${trip.ret ? ' · aller-retour' : ''}</p>
      <h2 class="sheet-city">${flag(dest.country_code)} ${escapeHtml(dest.city)}</h2>

      <div class="live" id="live-out" aria-live="polite">${liveLoading('Aller', trip.out)}</div>
      ${trip.ret ? `<div class="live" id="live-ret" aria-live="polite">${liveLoading('Retour', trip.ret)}</div>` : ''}
      ${trip.ret ? '<p class="sheet-total" id="live-total"></p>' : ''}

      <p class="sheet-seen">Prix repéré : <strong>${fmtPrice.format(repere)}</strong>${trip.ret ? ' (aller + retour)' : ''}</p>

      <a class="btn btn-primary btn-block" href="${escapeHtml(link)}" target="_blank" rel="sponsored noopener">
        Réserver sur Kiwi.com <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>
      </a>
      <p class="sheet-note">Tu seras redirigé vers Kiwi.com (en français, prix en euros) pour choisir tes vols et payer.</p>
    </div>`;
  sheet.showModal();

  const id = ++liveRequest;
  const checks = [checkLeg('live-out', 'Aller', origin.code, dest.code, trip.out, id)];
  if (trip.ret) checks.push(checkLeg('live-ret', 'Retour', dest.code, origin.code, trip.ret, id));
  Promise.all(checks).then(([outPrice, retPrice]) => {
    const totalEl = $('live-total');
    if (id !== liveRequest || !totalEl) return;
    totalEl.innerHTML = outPrice != null && retPrice != null
      ? `Total vérifié : <strong>${fmtPrice.format(outPrice + retPrice)}</strong>`
      : '';
  });
}

function liveLoading(label, day) {
  return `<p class="live-leg">${label} · ${escapeHtml(formatDay(day))}</p>
    <div class="live-loading"><span class="spinner" aria-hidden="true"></span>Vérification du prix en direct…</div>`;
}

// Vérifie un vol en direct et renvoie son prix (ou null).
async function checkLeg(elId, label, from, to, day, id) {
  let result = null;
  try {
    const res = await fetch(`${LIVE_PRICE_URL}?from=${from}&to=${to}&date=${day}`);
    if (res.ok) result = await res.json();
  } catch { /* hors ligne ou service indisponible */ }

  const el = $(elId);
  if (id !== liveRequest || !el) return null;
  const head = `<p class="live-leg">${label} · ${escapeHtml(formatDay(day))}</p>`;
  if (result?.status === 'ok') {
    const details = [result.airline, result.departure ? `départ ${String(result.departure).slice(11, 16)}` : null, result.duration ? formatDuration(result.duration) : null]
      .filter(Boolean).map(escapeHtml).join(' · ');
    el.innerHTML = `${head}
      <p class="live-label"><span class="live-dot" aria-hidden="true"></span>Prix vérifié à l'instant</p>
      <p class="live-price">${fmtPrice.format(result.price)}</p>
      ${details ? `<p class="live-details">${details}</p>` : ''}`;
    return result.price;
  }
  el.innerHTML = result?.status === 'none'
    ? `${head}<p class="live-label warn">Plus de vol direct trouvé ce jour-là</p><p class="live-details">Kiwi.com te proposera d'autres horaires ou dates.</p>`
    : `${head}<p class="live-label muted">Vérification en direct indisponible</p><p class="live-details">Le prix exact s'affichera sur Kiwi.com.</p>`;
  return null;
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------
function isoDay(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseDay(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}
function addDays(d, n) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
