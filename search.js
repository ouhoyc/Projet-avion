// Recherche : elle pilote toute la page (carte + liste des résultats), à partir des
// prix jour par jour (daily.json). Champs :
//   - aller-retour (par défaut) ou aller simple ;
//   - durée du séjour : 1 nuit / court séjour / une semaine / plus (choisie à l'arrivée) ;
//   - où (facultatif) : sans destination → meilleure option par ville ; avec → meilleures dates ;
//   - quand (facultatif) : sinon les 12 prochains mois ;
//   - budget max (facultatif).
// En aller-retour, on combine deux vols directs et on suggère d'autres durées moins chères.
// Les villes à plusieurs aéroports (Londres…) sont regroupées.
// Utilise les fonctions communes d'app.js (formatDay, fmtPrice, flag, showOnMap…).

const NIGHTS_SPREAD = 2;     // suggestions : jusqu'à 2 nuits de moins / de plus que la durée choisie
const MAX_DATE_OPTIONS = 8;  // dates proposées pour une destination précise
const PAGE_SIZE = 10;        // villes affichées avant « Voir plus »
const MONTHS_AHEAD = 12;     // barre des mois : mois en cours + 11 suivants
const STAY_KEY = 'vols-lyon-sejour'; // durée mémorisée dans le navigateur

const STAY_LABELS = { '1-1': 'une nuit', '2-4': 'court séjour', '5-8': 'une semaine', '9-21': '9 nuits et plus' };

const sEls = {
  form: $('search-form'),
  stay: $('s-stay'),
  country: $('s-country'),
  city: $('s-city'),
  cityField: $('s-city-field'),
  from: $('s-from'),
  to: $('s-to'),
  budget: $('s-budget'),
  results: $('search-results'),
  count: $('results-count'),
  refine: $('refine'),
  refineCountry: $('r-country'),
  sort: $('r-sort'),
  mapCaption: $('map-caption'),
  monthsBar: $('months-bar'),
  months: $('months'),
  legendLow: $('legend-low'),
  legendMid: $('legend-mid'),
  legendHigh: $('legend-high'),
};

// Résultats de la dernière recherche. `view` = indices affichés (après pays / tri).
// `base` = recherche sur toute la période ; `month` = mois choisi dans la barre ('' = tous).
const searchState = { results: [], view: [], query: null, base: null, daily: null, month: '', months: [], shown: 0, airlines: {}, firstMap: true };
const fmtMonthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
const fmtMonthLong = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

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

function setupSearchForm() {
  setupCalendar();

  // Choisir une durée ou changer de type de voyage relance la recherche tout de suite.
  sEls.form.addEventListener('change', (e) => {
    if (e.target.name === 'trip') {
      sEls.stay.hidden = tripType() === 'ow';
      if (tripType() === 'ow' || stayValue()) runSearch();
    }
    if (e.target.name === 'stay') {
      try { localStorage.setItem(STAY_KEY, e.target.value); } catch { /* navigation privée */ }
      updateStayHint();
      runSearch();
    }
  });

  sEls.form.addEventListener('submit', (e) => {
    e.preventDefault();
    runSearch();
  });

  for (const el of [sEls.refineCountry, sEls.sort]) el.addEventListener('change', () => applyView(false));

  // Pays puis ville (facultative) : la recherche se relance aussitôt.
  sEls.country.addEventListener('change', () => {
    fillCities();
    if (tripType() === 'ow' || stayValue()) runSearch();
  });
  sEls.city.addEventListener('change', () => {
    if (tripType() === 'ow' || stayValue()) runSearch();
  });

  // « Voir » (liste ou bulle de la carte) : panneau de réservation avec vérification en direct.
  document.addEventListener('click', (e) => {
    const book = e.target.closest('[data-trip]');
    if (book) openTripSheet(JSON.parse(book.dataset.trip));
  });

  sEls.results.addEventListener('click', (e) => {
    // Pastille « 3 nuits · 62 € » : devient l'option affichée de la fiche.
    const chip = e.target.closest('[data-pick]');
    if (chip) {
      const [cityIndex, optionIndex] = chip.dataset.pick.split(':').map(Number);
      const city = searchState.results[cityIndex];
      city.selected = optionIndex;
      chip.closest('.card').outerHTML = cityCardHtml(city, cityIndex);
      updateMap(false);
      return;
    }
    if (e.target.closest('[data-more]')) renderMore();
  });

  // Ordinateur : survoler une fiche allume son point sur la carte.
  sEls.results.addEventListener('mouseover', (e) => {
    const card = e.target.closest('[data-result]');
    if (!card || card.classList.contains('is-hovered')) return;
    sEls.results.querySelector('.is-hovered')?.classList.remove('is-hovered');
    card.classList.add('is-hovered');
    highlightOnMap(Number(card.dataset.result));
  });
  sEls.results.addEventListener('mouseleave', () => {
    sEls.results.querySelector('.is-hovered')?.classList.remove('is-hovered');
    highlightOnMap(-1);
  });

  // Barre des mois : toucher un mois, les flèches, ou glisser la liste à gauche / à droite.
  sEls.months.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-month]');
    if (btn) selectMonth(btn.dataset.month);
  });
  sEls.monthsBar.addEventListener('click', (e) => {
    const arrow = e.target.closest('[data-month-step]');
    if (arrow) stepMonth(Number(arrow.dataset.monthStep));
  });
  let touch = null;
  sEls.results.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touch = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
  }, { passive: true });
  sEls.results.addEventListener('touchend', (e) => {
    if (!touch || sEls.monthsBar.hidden) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.x;
    const dy = t.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) stepMonth(dx < 0 ? 1 : -1);
  });

  document.addEventListener('data-ready', () => {
    fillCountries();
    // Durée déjà choisie lors d'une visite précédente : on lance directement la recherche.
    let saved = null;
    try { saved = localStorage.getItem(STAY_KEY); } catch { /* indisponible */ }
    const radio = saved && sEls.form.querySelector(`input[name="stay"][value="${saved}"]`);
    if (radio) { radio.checked = true; updateStayHint(); runSearch(); }
  });
}

// Pays (ordre alphabétique) ; la liste des villes apparaît quand un pays est choisi.
function fillCountries() {
  const countries = [...new Set(data.destinations.map((d) => d.country).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'fr'));
  for (const c of countries) sEls.country.add(new Option(c, c));
}

function fillCities() {
  const country = sEls.country.value;
  const cities = new Map();
  for (const d of data.destinations) {
    if (d.country === country && !cities.has(d.city_code)) cities.set(d.city_code, d);
  }
  const sorted = [...cities.values()].sort((a, b) => a.city.localeCompare(b.city, 'fr'));
  sEls.city.innerHTML = '<option value="">Toutes les villes</option>'
    + sorted.map((d) => `<option value="${escapeHtml(d.city_code)}">${escapeHtml(d.city)}</option>`).join('');
  sEls.cityField.hidden = !country;
}

const STAY_HINTS = { '1-1': '1 nuit sur place', '2-4': '2 à 4 nuits sur place', '5-8': '5 à 8 nuits sur place', '9-21': '9 nuits ou plus sur place' };
function updateStayHint() {
  $('stay-hint').textContent = STAY_HINTS[stayValue()] || 'Choisis une durée pour voir les prix';
}

function tripType() {
  return sEls.form.elements.trip.value;
}

function stayValue() {
  return sEls.form.elements.stay.value;
}

// ---------------------------------------------------------------------------
// Moteur de recherche
// ---------------------------------------------------------------------------
async function runSearch() {
  if (!data) return;
  const type = tripType();
  if (type === 'rt' && !stayValue()) {
    sEls.results.innerHTML = '<p class="empty start-hint">Choisis d\'abord combien de temps tu veux partir.</p>';
    sEls.stay.classList.add('attention');
    sEls.stay.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => sEls.stay.classList.remove('attention'), 1200);
    return;
  }

  sEls.results.innerHTML = '<div class="live-loading"><span class="spinner" aria-hidden="true"></span>Recherche des meilleures dates…</div>';
  let daily;
  try {
    daily = await loadDaily();
  } catch {
    sEls.results.innerHTML = '<p class="empty">Les prix jour par jour ne sont pas encore disponibles. Réessaie un peu plus tard.</p>';
    return;
  }

  const [minN, maxN] = (stayValue() || '1-1').split('-').map(Number);
  const query = {
    type,
    minN,
    maxN,
    stay: stayValue(),
    country: sEls.country.value,
    city: sEls.city.value,
    start: sEls.from.value || isoDay(new Date()),
    end: sEls.to.value || isoDay(addDays(new Date(), 365)),
    budget: Number(sEls.budget.value) || Infinity,
    datesGiven: Boolean(sEls.from.value || sEls.to.value),
  };
  if (query.end < query.start) [query.start, query.end] = [query.end, query.start];
  query.outEnd = query.end; // dernier jour de départ possible

  // Sans dates : barre des mois, avec le meilleur prix de chaque mois.
  const months = [];
  if (!query.datesGiven) {
    const first = parseDay(query.start);
    for (let i = 0; i < MONTHS_AHEAD; i++) {
      const key = isoDay(new Date(first.getFullYear(), first.getMonth() + i, 1)).slice(0, 7);
      const found = findResults(monthQuery(query, key), daily);
      months.push({ key, best: found.length ? Math.min(...found.map((c) => bestOf(c).total)) : null });
    }
  }
  if (!months.some((m) => m.key === searchState.month)) searchState.month = '';
  Object.assign(searchState, { base: query, daily, months, airlines: daily.airlines || {} });
  showMonth(true);
}

// Recherche limitée aux départs d'un mois (le retour peut tomber le mois suivant).
function monthQuery(q, key) {
  const [y, m] = key.split('-').map(Number);
  const start = isoDay(new Date(y, m - 1, 1));
  const last = isoDay(new Date(y, m, 0));
  const end = isoDay(addDays(parseDay(last), q.type === 'rt' ? q.maxN + NIGHTS_SPREAD : 0));
  return { ...q, month: key, start: start > q.start ? start : q.start, outEnd: last, end: end < q.end ? end : q.end };
}

function selectMonth(key) {
  if (key === searchState.month) return;
  searchState.month = key;
  showMonth(false);
}

function stepMonth(step) {
  const keys = ['', ...searchState.months.map((m) => m.key)];
  const next = keys.indexOf(searchState.month) + step;
  if (next >= 0 && next < keys.length) selectMonth(keys[next]);
}

// Affiche les résultats du mois choisi (ou de toute la période) : barre, liste et carte.
function showMonth(fitMap) {
  const { base, daily } = searchState;
  const query = searchState.month ? monthQuery(base, searchState.month) : base;
  const results = findResults(query, daily);
  Object.assign(searchState, { results, query });
  renderMonths();

  // Filtre pays sous les résultats : inutile si un pays est déjà choisi dans la recherche.
  const current = sEls.refineCountry.value;
  const countries = [...new Set(results.map((r) => r.dest.country).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  sEls.refineCountry.innerHTML = '<option value="">Tous les pays</option>' + countries.map((c) => `<option>${escapeHtml(c)}</option>`).join('');
  if (countries.includes(current)) sEls.refineCountry.value = current;
  sEls.refineCountry.closest('.select').hidden = Boolean(query.country);
  sEls.refine.hidden = results.length < 2;

  applyView(fitMap);
}

// Toutes les villes qui ont au moins une option pour cette recherche.
// Les aéroports d'une même ville sont regroupés (ex. Londres = Gatwick + Luton).
function findResults(query, daily) {
  const byCity = new Map();
  for (const dest of data.destinations) {
    if (query.city && dest.city_code !== query.city) continue;
    if (query.country && dest.country !== query.country) continue;
    if (!daily.dests[dest.code]) continue;
    if (!byCity.has(dest.city_code)) byCity.set(dest.city_code, []);
    byCity.get(dest.city_code).push(dest);
  }
  const results = [];
  for (const airports of byCity.values()) {
    const city = searchCity(airports, daily, query);
    if (city) results.push(city);
  }
  return results;
}

// Barre des mois : « Tous » puis un bouton par mois avec son meilleur prix.
function renderMonths() {
  const { months, month } = searchState;
  sEls.monthsBar.hidden = !months.length;
  if (!months.length) return;
  const thisYear = new Date().getFullYear();
  const overall = months.reduce((min, m) => (m.best != null && (min == null || m.best < min) ? m.best : min), null);
  const button = (key, label, title, price) => `
    <button type="button" class="month${price == null ? ' is-empty' : ''}" data-month="${key}" aria-pressed="${key === month}" title="${escapeHtml(title)}">
      <span class="month-name">${escapeHtml(label)}</span>
      <span class="month-price">${price == null ? '—' : fmtPrice.format(price)}</span>
    </button>`;
  sEls.months.innerHTML = button('', 'Tous', '12 prochains mois', overall) + months.map((m) => {
    const date = parseDay(`${m.key}-01`);
    const name = capitalize(fmtMonthShort.format(date).replace('.', ''));
    const label = date.getFullYear() === thisYear ? name : `${name} ${String(date.getFullYear()).slice(2)}`;
    return button(m.key, label, capitalize(fmtMonthLong.format(date)), m.best);
  }).join('');
  const keys = ['', ...months.map((m) => m.key)];
  const index = keys.indexOf(month);
  sEls.monthsBar.querySelector('[data-month-step="-1"]').disabled = index <= 0;
  sEls.monthsBar.querySelector('[data-month-step="1"]').disabled = index >= keys.length - 1;
  // Garde le mois choisi visible dans la barre.
  const current = sEls.months.querySelector('[aria-pressed="true"]');
  if (current) {
    const bar = sEls.months.getBoundingClientRect();
    const btn = current.getBoundingClientRect();
    const left = sEls.months.scrollLeft + (btn.left - bar.left) - (bar.width - btn.width) / 2;
    sEls.months.scrollTo({ left, behavior: 'smooth' });
  }
}

// Toutes les options d'une ville (tous aéroports confondus), triées par prix.
function searchCity(airports, daily, q) {
  const wanted = [];   // durée choisie (ou aller simple)
  const others = [];   // durées voisines, pour les suggestions
  for (const dest of airports) {
    const prices = daily.dests[dest.code];
    const combos = q.type === 'ow' ? oneWayCombos(prices, q) : roundTripCombos(prices, q);
    for (const c of combos) {
      if (c.total > q.budget) continue;
      c.code = dest.code;
      (q.type === 'ow' || (c.nights >= q.minN && c.nights <= q.maxN) ? wanted : others).push(c);
    }
  }
  if (!wanted.length && !others.length) return null;
  wanted.sort((a, b) => a.total - b.total);
  others.sort((a, b) => a.total - b.total);

  // Destination précise : plusieurs dates ; sinon : la meilleure option.
  const main = (wanted.length ? wanted : others).slice(0, q.city ? MAX_DATE_OPTIONS : 1);
  const reference = main[0];

  // Suggestions : meilleure combinaison pour chaque durée voisine, si elle est moins chère.
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
    .filter(([day]) => day >= q.start && day <= q.outEnd)
    .map(([day, info]) => ({ total: info[0], nights: null, out: leg(day, info) }));
}

// Aller-retour : aller + retour direct dans la période, durée choisie ± 2 nuits.
function roundTripCombos(prices, q) {
  const minN = Math.max(1, q.minN - NIGHTS_SPREAD);
  const maxN = q.maxN + NIGHTS_SPREAD;
  const combos = [];
  for (const [day, outInfo] of Object.entries(prices.o)) {
    if (day < q.start || day > q.outEnd) continue;
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
// Affichage : liste + carte
// ---------------------------------------------------------------------------
const bestOf = (city) => city.options[city.selected];

// Applique le filtre pays et le tri, puis redessine la liste et la carte.
function applyView(fitMap) {
  const { results } = searchState;
  const country = searchState.query.country ? '' : sEls.refineCountry.value;
  const sorters = {
    price: (a, b) => bestOf(results[a]).total - bestOf(results[b]).total,
    date: (a, b) => bestOf(results[a]).out.day.localeCompare(bestOf(results[b]).out.day),
    city: (a, b) => results[a].dest.city.localeCompare(results[b].dest.city, 'fr'),
  };
  searchState.view = results
    .map((_, i) => i)
    .filter((i) => !country || results[i].dest.country === country)
    .sort(sorters[sEls.sort.value] || sorters.price);
  renderResults();
  updateMap(fitMap || searchState.firstMap);
  searchState.firstMap = false;
}

function describeQuery(q) {
  const parts = [q.type === 'rt' ? `aller-retour, ${STAY_LABELS[q.stay] || ''}` : 'aller simple'];
  if (q.country && !q.city) parts.push(q.country);
  if (q.month) parts.push(`départ en ${fmtMonthLong.format(parseDay(`${q.month}-01`))}`);
  else parts.push(q.datesGiven ? `du ${formatDayShort(q.start)} au ${formatDayShort(q.end)}` : '12 prochains mois');
  if (Number.isFinite(q.budget)) parts.push(`${fmtPrice.format(q.budget)} max`);
  return parts.join(' · ');
}

function renderResults() {
  const { results, view, query: q } = searchState;
  const roundTrip = q.type === 'rt';
  searchState.shown = 0;
  sEls.count.textContent = view.length ? `${view.length} destination${view.length > 1 ? 's' : ''}` : '';

  if (!view.length) {
    sEls.results.innerHTML = `
      <div class="empty">
        <svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>
        <p>Aucun vol direct${roundTrip ? ' aller-retour' : ''} repéré (${escapeHtml(describeQuery(q))}).</p>
        <p class="hint">${q.month
          ? 'Aucun prix repéré ce mois-ci. Ces prix viennent des recherches récentes des voyageurs : au-delà de 2-3 mois, il y en a peu. Essaie un autre mois.'
          : 'Élargis la période, le budget ou change la durée : ces prix viennent des recherches récentes des voyageurs, certains jours n\'en ont pas.'}</p>
      </div>`;
    return;
  }

  const title = q.city ? `<p class="results-intro">Meilleures dates pour <strong>${escapeHtml(results[view[0]].dest.city)}</strong></p>` : '';
  sEls.results.innerHTML = `
    ${title}
    <p class="results-query">${escapeHtml(describeQuery(q))}</p>
    <ul class="cards result-list" id="result-list"></ul>
    <button type="button" class="btn btn-secondary-wide" data-more hidden></button>
    <p class="disclaimer"><svg class="icon" aria-hidden="true"><use href="#i-info"/></svg>
      <span>Derniers prix repérés par les voyageurs${roundTrip ? ' (total aller + retour)' : ''}. Touche « Voir » pour vérifier les prix en direct avant de réserver sur Kiwi.com.</span></p>`;
  renderMore();
}

// Ajoute les 10 villes suivantes.
function renderMore() {
  const list = $('result-list');
  const { results, view } = searchState;
  const next = view.slice(searchState.shown, searchState.shown + PAGE_SIZE);
  list.insertAdjacentHTML('beforeend', next.map((i) => cityCardHtml(results[i], i)).join(''));
  searchState.shown += next.length;

  const more = sEls.results.querySelector('[data-more]');
  const left = view.length - searchState.shown;
  more.hidden = left <= 0;
  more.textContent = `Voir ${Math.min(left, PAGE_SIZE)} destination${left > 1 ? 's' : ''} de plus`;
}

// Carte : un point par ville, avec le prix de l'option affichée (total en aller-retour).
function updateMap(fit) {
  const { results, view, query: q } = searchState;
  const roundTrip = q.type === 'rt';
  // En aller-retour, la couleur se base sur le prix moyen par vol (total ÷ 2).
  sEls.legendLow.textContent = roundTrip ? '≤ 80 €' : '≤ 40 €';
  sEls.legendMid.textContent = roundTrip ? '81–160 €' : '41–80 €';
  sEls.legendHigh.textContent = roundTrip ? '> 160 €' : '> 80 €';
  sEls.mapCaption.textContent = roundTrip ? 'prix total aller + retour' : 'prix aller simple';

  showOnMap(view.map((i) => {
    const city = results[i];
    const o = bestOf(city);
    const trip = tripData(o);
    return {
      resultIndex: i,
      dest: city.dest,
      price: o.total,
      tierPrice: roundTrip ? o.total / 2 : o.total,
      popup: `
        <div class="popup-city">${flag(city.dest.country_code)} ${escapeHtml(city.dest.city)}</div>
        <div class="popup-meta">${escapeHtml(formatDayShortWeek(o.out.day))}${o.ret ? ` → ${escapeHtml(formatDayShortWeek(o.ret.day))} · ${o.nights} nuit${o.nights > 1 ? 's' : ''}` : ''}</div>
        <div class="popup-price"><small>${roundTrip ? 'aller + retour' : 'prix repéré'}</small> ${fmtPrice.format(o.total)}</div>
        <button type="button" class="btn btn-primary" data-trip='${escapeHtml(JSON.stringify(trip))}'>Voir</button>`,
    };
  }), fit);
}

function tripData(o) {
  return { code: o.code, out: o.out.day, ret: o.ret?.day || null, outPrice: o.out.price, retPrice: o.ret?.price ?? null };
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
  const best = bestOf(city);

  return `
    <li class="card result ${priceTier(best.total / (roundTrip ? 2 : 1))}" data-result="${index}">
      <div class="card-top">
        <span class="flag" aria-hidden="true">${flag(dest.country_code)}</span>
        <div class="card-title">
          <h3 class="card-city">${escapeHtml(dest.city)}</h3>
          <p class="card-sub">${escapeHtml(dest.country)}${multiAirport ? ` · ${city.airports.length} aéroports` : ''}</p>
          <p class="card-route">${escapeHtml(data.origin.code)} ✈ ${escapeHtml(best.code)}</p>
        </div>
      </div>
      ${mainOptions.map((o) => optionHtml(o, city)).join('')}
      ${chips.length ? `
        <div class="chips-alt">
          <span class="alt-title">${city.exactNights ? 'Moins cher :' : 'Autres durées :'}</span>
          ${chips.map(({ o, i }) => `
            <button type="button" class="chip chip-alt" data-pick="${index}:${i}">
              ${o.nights} nuit${o.nights > 1 ? 's' : ''} · <strong>${fmtPrice.format(o.total)}</strong>
            </button>`).join('')}
        </div>` : ''}
    </li>`;
}

function optionHtml(o, city) {
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
        <button type="button" class="btn btn-primary btn-small" data-trip='${escapeHtml(JSON.stringify(tripData(o)))}'>Voir</button>
      </div>
    </div>`;
}

// Une ligne par vol : « Aller · lun. 2 nov. 15:40 · 38 € », puis compagnie et fraîcheur du prix.
function legHtml(label, l) {
  const airline = searchState.airlines[l.airline] || l.airline;
  const seen = l.seen ? ` · vu ${shortSeen(l.seen)}` : '';
  return `
    <p class="leg">
      <span class="leg-label">${label}</span>
      <span class="leg-main">${escapeHtml(formatDayShortWeek(l.day))}${l.time ? ` · ${escapeHtml(l.time)}` : ''} · <strong>${fmtPrice.format(l.price)}</strong></span>
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
// Calendrier « Quand ? » (remplace le champ date du navigateur)
// ---------------------------------------------------------------------------
const fmtMonthTitle = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const cal = { start: '', end: '' };

function setupCalendar() {
  const dialog = $('cal-sheet');
  const months = $('cal-months');
  const today = new Date();

  // 12 mois à partir du mois en cours, semaines commençant le lundi.
  let html = '';
  for (let m = 0; m < 12; m++) {
    const first = new Date(today.getFullYear(), today.getMonth() + m, 1, 12);
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    const title = fmtMonthTitle.format(first);
    html += `<section class="cal-month"><h3>${title.charAt(0).toUpperCase() + title.slice(1)}</h3><div class="cal-grid">`;
    html += '<span></span>'.repeat(offset);
    for (let d = 1; d <= days; d++) {
      const iso = isoDay(new Date(first.getFullYear(), first.getMonth(), d, 12));
      const past = iso < isoDay(today);
      html += `<button type="button" class="cal-day" data-day="${iso}"${past ? ' disabled' : ''}>${d}</button>`;
    }
    html += '</div></section>';
  }
  months.innerHTML = html;

  $('s-when').addEventListener('click', () => {
    cal.start = sEls.from.value;
    cal.end = sEls.to.value;
    paintCalendar();
    dialog.showModal();
    const target = months.querySelector(`[data-day="${cal.start || isoDay(today)}"]`);
    target?.closest('.cal-month')?.scrollIntoView({ block: 'start' });
  });

  months.addEventListener('click', (e) => {
    const day = e.target.closest('.cal-day')?.dataset.day;
    if (!day) return;
    // 1er appui : début ; 2e appui : fin (ou nouveau début si la date est avant).
    if (!cal.start || cal.end || day < cal.start) { cal.start = day; cal.end = ''; }
    else cal.end = day;
    paintCalendar();
  });

  $('cal-clear').addEventListener('click', () => { cal.start = cal.end = ''; applyCalendar(); });
  $('cal-ok').addEventListener('click', applyCalendar);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('[data-cal-close]')) dialog.close();
  });

  function applyCalendar() {
    sEls.from.value = cal.start;
    sEls.to.value = cal.end || cal.start;
    updateWhenLabel();
    dialog.close();
    if (tripType() === 'ow' || stayValue()) runSearch();
  }
}

function paintCalendar() {
  for (const btn of $('cal-months').querySelectorAll('.cal-day')) {
    const d = btn.dataset.day;
    const end = cal.end || cal.start;
    btn.classList.toggle('is-start', d === cal.start);
    btn.classList.toggle('is-end', Boolean(cal.end) && cal.end !== cal.start && d === cal.end);
    btn.classList.toggle('has-end', Boolean(cal.end) && cal.end !== cal.start);
    btn.classList.toggle('in-range', Boolean(cal.start && cal.end) && d > cal.start && d < end);
    btn.setAttribute('aria-pressed', d === cal.start || d === cal.end);
  }
  const ok = $('cal-ok');
  $('cal-help').textContent = !cal.start
    ? 'Touche le premier jour possible, puis le dernier.'
    : !cal.end ? `À partir du ${formatDayShort(cal.start)} : touche maintenant le dernier jour possible.`
    : `Du ${formatDayShort(cal.start)} au ${formatDayShort(cal.end)} : départ et retour dans cette période.`;
  ok.textContent = cal.start ? 'Valider' : "N'importe quand";
}

function updateWhenLabel() {
  const from = sEls.from.value;
  const to = sEls.to.value;
  $('s-when-label').textContent = !from
    ? "N'importe quand"
    : from === to ? formatDayShortWeek(from) : `${formatDayShort(from)} → ${formatDayShort(to)}`;
  $('s-when').classList.toggle('has-value', Boolean(from));
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

// Démarrage (en dernier : toutes les constantes ci-dessus sont alors définies).
setupSearchForm();
