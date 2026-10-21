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

const STAY_LABELS = { '1-1': 'une nuit', '2-4': 'court séjour', '5-8': 'une semaine', '9-21': '9 nuits et plus' };

const sEls = {
  form: $('search-form'),
  stay: $('s-stay'),
  exact: $('s-exact'),
  country: $('s-country'),
  city: $('s-city'),
  where: $('s-where'),
  whereList: $('s-where-list'),
  whereClear: $('s-where-clear'),
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
const searchState = { villes: {}, results: [], view: [], query: null, base: null, daily: null, month: '', months: [], shown: 0, airlines: {}, firstMap: true };
const fmtMonthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
const fmtMonthLong = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

// Fiches « donner envie » (photo, phrase, météo) : facultatives, le site marche sans.
let villesPromise = null;
function loadVilles() {
  villesPromise ||= fetch('villes.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  return villesPromise;
}

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
  updateFormHelp();

  // Choisir une durée ou changer de type de voyage relance la recherche tout de suite.
  sEls.form.addEventListener('change', (e) => {
    if (e.target.name === 'trip') {
      updateFormHelp();
      if (readyToSearch()) runSearch();
    }
    if (e.target.name === 'stay') {
      updateFormHelp();
      runSearch();
    }
    if (e.target === sEls.exact) {
      updateFormHelp();
      if (readyToSearch()) runSearch();
    }
  });

  // Entrée dans un panneau (ex. budget) : on ferme le panneau et on relance la recherche.
  sEls.form.addEventListener('submit', (e) => {
    e.preventDefault();
    closeFilters();
    runSearch();
  });

  // Pastilles « Durée », « Budget », « Une idée ? » : chacune ouvre son panneau.
  sEls.form.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-filter]');
    if (pill) {
      $(pill.dataset.filter).showModal();
      // « Une idée ? » : liste des pays tout de suite. Sur téléphone, pas de clavier d'office :
      // il ouvrait d'un coup et Safari faisait sauter la page ; on touche le champ pour écrire.
      if (pill.dataset.filter === 'f-where') {
        if (matchMedia('(pointer: fine)').matches) sEls.where.focus();
        else sEls.where.dispatchEvent(new Event('input'));
      }
      return;
    }
    if (e.target.closest('[data-filter-close]') || e.target.matches('.filter-sheet')) closeFilters();
  });
  sEls.budget.addEventListener('change', () => {
    updatePills();
    runSearch();
  });

  for (const el of [sEls.refineCountry, sEls.sort]) el.addEventListener('change', () => applyView(false));

  setupWhere();
  $('s-reset').addEventListener('click', resetFilters);

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
    const recap = e.target.closest('[data-recap]')?.dataset.recap;
    if (recap === 'pax') $('s-pax').click();
    else if (recap === 'when') $('s-when').click();
    else if (recap) $(recap).showModal();
    const stay = e.target.closest('[data-stay]');
    if (stay) {
      sEls.form.querySelector(`input[name="stay"][value="${stay.dataset.stay}"]`).checked = true;
      updateFormHelp();
      runSearch();
    }
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

  setupCredits();

  document.addEventListener('data-ready', () => {
    fillPlaces();
    updateFormHelp();
    // Durée vierge à l'arrivée : sans elle, pas de prix aller-retour. La page reste vide et
    // propose les 4 durées (« Choisissez une durée pour commencer »).
    updateFormHelp();
    runSearch();
  });
}

// « Où ? » : on tape une ville ou un pays ; la liste propose les correspondances (sans tenir
// compte des accents). Champ vide ou croix = « N'importe où ».
let places = [];
const normText = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function fillPlaces() {
  const countries = new Map();
  const cities = new Map();
  for (const d of data.destinations) {
    if (!d.country) continue;
    if (!countries.has(d.country)) countries.set(d.country, { type: 'country', label: d.country, country: d.country, cc: d.country_code });
    if (!cities.has(d.city_code)) cities.set(d.city_code, { type: 'city', label: d.city, country: d.country, cc: d.country_code, code: d.city_code });
  }
  places = [...countries.values(), ...cities.values()]
    .map((p) => ({ ...p, key: normText(p.label) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}

function whereLabel() {
  if (sEls.city.value) {
    const p = places.find((x) => x.type === 'city' && x.code === sEls.city.value);
    return p ? `${p.label} (${p.country})` : '';
  }
  return sEls.country.value;
}

function setupWhere() {
  const input = sEls.where;
  const list = sEls.whereList;
  let shown = [];
  let active = -1;

  const open = (isOpen) => {
    list.hidden = !isOpen;
    input.setAttribute('aria-expanded', String(isOpen));
  };
  const paint = () => {
    [...list.children].forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));
    list.children[active]?.scrollIntoView({ block: 'nearest' });
  };
  const render = () => {
    const q = normText(input.value);
    if (!q) {
      shown = places.filter((p) => p.type === 'country'); // champ vide : tous les pays
    } else {
      // Ordre : pays puis villes dont le nom commence par la saisie, villes de ces pays,
      // puis les noms qui contiennent la saisie ailleurs.
      const rank = (p) => {
        const starts = p.key.startsWith(q) || p.key.includes(` ${q}`);
        if (starts) return p.type === 'country' ? 0 : 1;
        if (p.type === 'city' && normText(p.country).startsWith(q)) return 2;
        return p.key.includes(q) ? 3 : -1;
      };
      shown = places.map((p) => [rank(p), p]).filter(([r]) => r >= 0)
        .sort((a, b) => a[0] - b[0]).map(([, p]) => p);
    }
    active = q && shown.length ? 0 : -1;
    list.innerHTML = shown.length
      ? shown.map((p, i) => `<li role="option" id="where-opt-${i}" data-i="${i}">${flag(p.cc)}<span>${escapeHtml(p.label)}</span><small>${
        p.type === 'country' ? 'Pays' : escapeHtml(p.country)}</small></li>`).join('')
      : '<li class="where-empty">Aucun vol direct vers ce lieu</li>';
    paint();
    open(true);
  };
  const choose = (p) => {
    sEls.country.value = p ? p.country : '';
    sEls.city.value = p && p.type === 'city' ? p.code : '';
    input.value = whereLabel();
    sEls.whereClear.hidden = !input.value;
    open(false);
    updatePills();
    $('f-where').close();
    if (readyToSearch()) runSearch();
  };

  input.addEventListener('focus', () => { if (places.length) { input.select(); render(); } });
  input.addEventListener('input', () => {
    sEls.whereClear.hidden = !input.value;
    render();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (list.hidden) render();
      active = clamp(active + (e.key === 'ArrowDown' ? 1 : -1), 0, shown.length - 1);
      paint();
    } else if (e.key === 'Enter') {
      e.preventDefault(); // ne pas lancer le formulaire
      if (!input.value.trim()) choose(null);
      else if (shown[active]) choose(shown[active]);
      input.blur();
    } else if (e.key === 'Escape') {
      input.value = whereLabel();
      open(false);
      input.blur();
    }
  });
  // En quittant le champ : saisie vide = « N'importe où » ; saisie non choisie = on remet le choix.
  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (!input.value.trim() && (sEls.country.value || sEls.city.value)) choose(null);
      else input.value = whereLabel();
      sEls.whereClear.hidden = !input.value;
      open(false);
    }, 150);
  });
  list.addEventListener('mousedown', (e) => e.preventDefault()); // garde le champ actif pendant le clic
  list.addEventListener('click', (e) => {
    const li = e.target.closest('[data-i]');
    if (li) { choose(shown[Number(li.dataset.i)]); input.blur(); }
  });
  sEls.whereClear.addEventListener('mousedown', (e) => e.preventDefault());
  sEls.whereClear.addEventListener('click', () => {
    choose(null);
    input.blur();
  });
}

const STAY_NIGHTS = { '1-1': '1 nuit', '2-4': '2 à 4 nuits', '5-8': '5 à 8 nuits', '9-21': '9 nuits ou plus' };

// Aide sous les dates et la durée : on cherche le vol le moins cher DANS la période, pour la
// durée choisie. Avant le choix : encadré sous la durée ; après : phrase récap avant le bouton.
// Case « dates exactes » cochée : aller le 1er jour, retour le dernier, la durée disparaît.
function updateFormHelp() {
  const roundTrip = tripType() === 'rt';
  const from = sEls.from.value;
  const to = sEls.to.value;
  const range = Boolean(from && to && from !== to);
  $('s-exact-field').hidden = !(roundTrip && range);
  const exact = exactDates();
  sEls.stay.hidden = !roundTrip || exact;

  const recap = $('s-exact-recap');
  recap.hidden = !exact;
  if (exact) {
    const nights = nightsBetween(from, to);
    recap.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#i-plane"/></svg> Aller ${escapeHtml(formatDayShortWeek(from))} · Retour ${escapeHtml(formatDayShortWeek(to))}<small>${nights} nuit${nights > 1 ? 's' : ''} sur place</small>`;
  }

  // Même mois : « 2 » et « 7 nov. » ; sinon « 30 nov. » et « 4 déc. »
  const day = (d) => formatDayShort(d).replace(' ', '\u00a0'); // « 7 nov. » jamais coupé
  const first = range && from.slice(0, 7) === to.slice(0, 7) ? String(Number(from.slice(8))) : from && day(from);
  const period = range ? `entre le ${first} et le ${day(to)}`
    : from ? `au départ du ${day(from)}` : 'sur les 12 prochains mois';
  const stay = roundTrip && !exact ? stayValue() : '';
  $('stay-legend').textContent = stay && range
    ? `Combien de nuits, du ${first} au ${day(to)}\u00a0?`
    : 'Combien de nuits sur place\u00a0?';
  $('stay-hint').innerHTML = `On cherche l'aller-retour <b>le moins cher</b> ${escapeHtml(period)}, ${stay ? `pour <b>${STAY_NIGHTS[stay]}</b> sur place` : 'pour la durée que vous choisissez'}.`;
  updatePills();
}

// Texte des pastilles : ce qui est choisi, ou le nom du filtre. Une pastille réglée passe en foncé.
function updatePills() {
  const ow = tripType() === 'ow';
  $('p-stay').textContent = ow ? 'Aller simple' : exactDates() ? 'Dates exactes' : STAY_NIGHTS[stayValue()] || 'Durée\u00a0?';
  const budget = Number(sEls.budget.value);
  $('p-budget').textContent = budget ? `${fmtPrice.format(budget)} max` : 'Budget';
  // Pastille : le nom seul (« Barcelone », « Italie »), le pays est dans le panneau.
  const city = sEls.city.value && places.find((x) => x.type === 'city' && x.code === sEls.city.value);
  $('p-where').textContent = city ? city.label : sEls.country.value || 'Une idée\u00a0?';
  sEls.form.querySelector('[data-filter="f-budget"]').classList.toggle('has-value', Boolean(budget));
  sEls.form.querySelector('[data-filter="f-where"]').classList.toggle('has-value', Boolean(sEls.country.value));
  const pax = typeof paxGet === 'function' ? paxGet() : { adults: 1, children: [] };
  $('s-reset').hidden = !(sEls.from.value || stayValue() || budget || sEls.country.value || pax.adults > 1 || pax.children.length);
}

// « Tout remettre à zéro » : dates, durée, voyageurs (1 adulte), budget, lieu, mois et tri.
function resetFilters() {
  sEls.from.value = sEls.to.value = '';
  sEls.exact.checked = false;
  for (const r of sEls.form.querySelectorAll('input[name="stay"]')) r.checked = false;
  sEls.budget.value = '';
  sEls.country.value = sEls.city.value = '';
  sEls.where.value = '';
  sEls.whereClear.hidden = true;
  if (typeof paxSave === 'function') { paxSave({ adults: 1, children: [] }); showPax(); }
  searchState.month = '';
  sEls.refineCountry.value = '';
  sEls.sort.value = 'price';
  updateWhenLabel();
  updateFormHelp();
  runSearch();
}

function closeFilters() {
  for (const d of sEls.form.querySelectorAll('.filter-sheet[open]')) d.close();
}

// Case cochée et visible (aller-retour avec une vraie période).
function exactDates() {
  return sEls.exact.checked && !$('s-exact-field').hidden;
}

function readyToSearch() {
  return tripType() === 'ow' || Boolean(stayValue()) || exactDates();
}

function nightsBetween(from, to) {
  return Math.round((parseDay(to) - parseDay(from)) / 86400000);
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
  if (!readyToSearch()) {
    showStayPrompt();
    return;
  }

  document.body.classList.remove('needs-stay');
  sEls.results.innerHTML = '<div class="live-loading"><span class="spinner" aria-hidden="true"></span>Recherche des meilleures dates…</div>';
  let daily;
  try {
    [daily, searchState.villes] = await Promise.all([loadDaily(), loadVilles()]);
  } catch {
    sEls.results.innerHTML = '<p class="empty">Les prix jour par jour ne sont pas encore disponibles. Réessayez un peu plus tard.</p>';
    return;
  }

  const exact = type === 'rt' && exactDates();
  let [minN, maxN] = (stayValue() || '1-1').split('-').map(Number);
  if (exact) minN = maxN = nightsBetween(sEls.from.value, sEls.to.value);
  const query = {
    type,
    minN,
    maxN,
    exact,
    stay: stayValue(),
    country: sEls.country.value,
    city: sEls.city.value,
    start: sEls.from.value || isoDay(new Date()),
    end: sEls.to.value || isoDay(addDays(new Date(), 365)),
    budget: Number(sEls.budget.value) || Infinity,
    datesGiven: Boolean(sEls.from.value || sEls.to.value),
  };
  if (query.end < query.start) [query.start, query.end] = [query.end, query.start];
  query.outEnd = exact ? query.start : query.end; // dernier jour de départ possible

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

// Pas encore de durée : page vide (carte, mois et tri cachés), avec seulement l'invitation
// « Choisissez une durée pour commencer » et les 4 durées.
function showStayPrompt() {
  searchState.base = null;
  document.body.classList.add('needs-stay');
  sEls.monthsBar.hidden = true;
  sEls.refine.hidden = true;
  sEls.mapCaption.textContent = '';
  showOnMap([], false);
  const choices = [...sEls.form.querySelectorAll('input[name="stay"]')]
    .map((r) => `<button type="button" class="pill" data-stay="${r.value}">${escapeHtml(r.nextElementSibling.textContent)}<small>${STAY_NIGHTS[r.value]}</small></button>`).join('');
  sEls.results.innerHTML = `
    <div class="stay-prompt">
      <p class="stay-prompt-title">Choisissez une durée pour commencer</p>
      <p>Combien de nuits voulez-vous partir&nbsp;? On vous montre ensuite toutes les destinations et leurs prix.</p>
      <div class="stay-prompt-choices">${choices}</div>
    </div>`;
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
      <span class="month-price">${price == null ? '—' : fmtGroup(price)}</span>
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
      if (c.total * seats() > q.budget) continue;
      c.code = dest.code;
      (q.type === 'ow' || (c.nights >= q.minN && c.nights <= q.maxN) ? wanted : others).push(c);
    }
  }
  // Aller-retour : la ville n'apparaît que si un séjour a la durée choisie (ex. « une semaine » =
  // 5 à 8 nuits). Les durées voisines ne servent qu'aux suggestions « Moins cher ».
  if (!wanted.length) return null;
  wanted.sort((a, b) => a.total - b.total);
  others.sort((a, b) => a.total - b.total);

  // Destination précise : plusieurs dates ; sinon : la meilleure option.
  const main = wanted.slice(0, q.city ? MAX_DATE_OPTIONS : 1);
  const reference = main[0];

  // Suggestions : meilleure combinaison pour chaque durée voisine, si elle est moins chère.
  const bestByNights = new Map();
  for (const c of others) if (!bestByNights.has(c.nights)) bestByNights.set(c.nights, c);
  const alternatives = [...bestByNights.values()]
    .filter((c) => c !== reference && c.total < reference.total)
    .sort((a, b) => a.total - b.total)
    .slice(0, 3);

  const dest = airports.find((a) => a.code === reference.code) || airports[0];
  return { dest, airports, options: [...main, ...alternatives], mainCount: main.length, selected: 0, exactNights: true };
}

// Aller simple : chaque jour de départ dans la période.
function oneWayCombos(prices, q) {
  return Object.entries(prices.o)
    .filter(([day]) => day >= q.start && day <= q.outEnd)
    .map(([day, info]) => ({ total: info[0], nights: null, out: leg(day, info) }));
}

// Aller-retour : aller + retour direct dans la période, durée choisie ± 2 nuits
// (dates exactes : seulement aller le 1er jour et retour le dernier).
function roundTripCombos(prices, q) {
  const minN = q.exact ? q.minN : Math.max(1, q.minN - NIGHTS_SPREAD);
  const maxN = q.exact ? q.maxN : q.maxN + NIGHTS_SPREAD;
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
  const parts = [q.type === 'rt' ? `aller-retour, ${q.exact ? 'dates exactes' : STAY_LABELS[q.stay] || ''}` : 'aller simple'];
  if (q.country && !q.city) parts.push(q.country);
  if (q.month) parts.push(`départ en ${fmtMonthLong.format(parseDay(`${q.month}-01`))}`);
  else if (q.exact) parts.push(`${formatDayShortWeek(q.start)} → ${formatDayShortWeek(q.end)}`);
  else parts.push(q.datesGiven ? `meilleures dates entre le ${formatDayShort(q.start)} et le ${formatDayShort(q.end)}` : '12 prochains mois');
  if (seats() > 1) parts.push(`${seats()} voyageurs`);
  if (Number.isFinite(q.budget)) parts.push(`${fmtPrice.format(q.budget)} max`);
  return parts.join(' · ');
}

function renderResults() {
  const { results, view, query: q } = searchState;
  const roundTrip = q.type === 'rt';
  searchState.shown = 0;
  sEls.count.textContent = '';

  if (!view.length) {
    sEls.results.innerHTML = `
      <div class="empty">
        <svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>
        <p>Aucun vol direct${roundTrip ? ' aller-retour' : ''} repéré (${escapeHtml(describeQuery(q))}).</p>
        <p class="hint">${q.exact
          ? 'Aucun prix repéré pour ces deux jours précis. Décochez « Partir et revenir à ces dates exactes » pour chercher le meilleur départ et retour dans toute la période.'
          : q.month
          ? 'Aucun prix repéré ce mois-ci. Ces prix viennent des recherches récentes des voyageurs : au-delà de 2-3 mois, il y en a peu. Essayez un autre mois.'
          : 'Élargissez la période, le budget ou changez la durée : ces prix viennent des recherches récentes des voyageurs, certains jours n\'en ont pas.'}</p>
      </div>`;
    return;
  }

  const title = q.city ? `<p class="results-intro">Meilleures dates pour <strong>${escapeHtml(results[view[0]].dest.city)}</strong></p>` : '';
  sEls.results.innerHTML = `
    ${title}
    ${recapHtml(q)}
    <ul class="cards result-list" id="result-list"></ul>
    <button type="button" class="btn btn-secondary-wide" data-more hidden></button>
    <p class="disclaimer"><svg class="icon" aria-hidden="true"><use href="#i-info"/></svg>
      <span>Derniers prix repérés par les voyageurs${roundTrip ? ', aller + retour compris' : ''}${groupLabel() ? `, ${groupLabel().trim()}` : ''}. Touchez « Préparer mon séjour » pour vérifier le prix du vol en direct.</span></p>`;
  renderMore();
}

// « Vos réglages » au début de la liste : les choix utilisés pour la recherche, là où l'on
// regarde en descendant (une testeuse n'avait pas vu les pastilles du haut). Chaque réglage
// se touche et ouvre son panneau.
function recapHtml(q) {
  const icon = (n) => `<svg class="icon" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const item = (key, ic, text) => `<button type="button" class="recap-item" data-recap="${key}">${icon(ic)}${escapeHtml(text)}</button>`;
  const items = [
    item('pax', 'users', typeof paxGet === 'function' ? paxLabel(paxGet()) : '1 adulte'),
    item('when', 'calendar', $('s-when-label').textContent),
    item('f-stay', 'moon', $('p-stay').textContent),
  ];
  if (Number.isFinite(q.budget)) items.push(item('f-budget', 'wallet', `${fmtPrice.format(q.budget)} max`));
  if (q.country) items.push(item('f-where', 'pin', $('p-where').textContent));
  if (q.month) items.push(`<span class="recap-item is-static">${icon('calendar')}Départ en ${escapeHtml(fmtMonthLong.format(parseDay(`${q.month}-01`)).replace(/ \d{4}$/, ''))}</span>`);
  return `
    <div class="recap">
      <p class="recap-title">Vos réglages</p>
      <div class="recap-items">${items.join('')}</div>
      <p class="recap-help">Touchez un réglage pour le changer.</p>
    </div>`;
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
  // Paliers de couleur par personne ; la légende les donne pour tout le groupe, comme les pastilles.
  const n = seats();
  const [low, high] = roundTrip ? [80, 160] : [40, 80];
  sEls.legendLow.textContent = `≤ ${fmtPrice.format(low * n)}`;
  sEls.legendMid.textContent = `${low * n + 1}–${fmtPrice.format(high * n)}`;
  sEls.legendHigh.textContent = `> ${fmtPrice.format(high * n)}`;
  // À plusieurs, les prix sont pour tout le groupe : on le dit en gros, sinon 3 000 € fait peur.
  sEls.mapCaption.innerHTML = n > 1
    ? `<span class="group-pill">Total pour ${n} voyageurs</span>${roundTrip ? ' aller + retour' : ''}`
    : (roundTrip ? 'prix total aller + retour' : 'prix aller simple') + groupLabel();

  showOnMap(view.map((i) => {
    const city = results[i];
    const o = bestOf(city);
    const trip = tripData(o);
    return {
      resultIndex: i,
      dest: city.dest,
      price: o.total * n,
      tierPrice: roundTrip ? o.total / 2 : o.total,
      popup: `
        <div class="popup-city">${flag(city.dest.country_code)} ${escapeHtml(city.dest.city)}</div>
        <div class="popup-meta">${escapeHtml(formatDayShortWeek(o.out.day))}${o.ret ? ` → ${escapeHtml(formatDayShortWeek(o.ret.day))} · ${o.nights} nuit${o.nights > 1 ? 's' : ''}` : ''}</div>
        <div class="popup-price"><small>${roundTrip ? 'aller + retour' : 'prix repéré'}${groupLabel()}</small> ${fmtGroup(o.total)}</div>
        ${perPersonHtml(o.total)}
        <button type="button" class="btn btn-primary" data-trip='${escapeHtml(JSON.stringify(trip))}'>Voir</button>`,
    };
  }), fit);
}

function tripData(o) {
  return { code: o.code, out: o.out.day, ret: o.ret?.day || null, outPrice: o.out.price, retPrice: o.ret?.price ?? null, dur: o.out.duration || null };
}

// Fiche « Séjour clé en main » : grande photo, ce qui est compris, prix du vol et bouton.
function cityCardHtml(city, index) {
  const q = searchState.query;
  const roundTrip = q.type === 'rt';
  const { dest, options } = city;
  const multiAirport = city.airports.length > 1;

  // Destination précise : plusieurs dates au choix ; sinon : une option + pastilles de durée.
  let mainOptions = q.city ? options.slice(0, city.mainCount) : [options[city.selected]];
  if (q.city && city.selected >= city.mainCount) mainOptions = [options[city.selected], ...mainOptions];
  const chips = options
    .map((o, i) => ({ o, i }))
    .filter(({ o, i }) => o.nights && (q.city ? i >= city.mainCount : i !== city.selected));
  const best = bestOf(city);
  const photo = searchState.villes[dest.city_code]?.photo;

  return `
    <li class="card result trip-card" data-result="${index}">
      <div class="tc-photo">
        ${photo ? `<img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt || dest.city)}" loading="lazy" decoding="async">` : `<span class="tc-noimg" aria-hidden="true">${flag(dest.country_code)}</span>`}
        <span class="tc-ribbon"><svg class="icon" aria-hidden="true"><use href="#i-sparkles"/></svg> Séjour clé en main</span>
      </div>
      <div class="tc-body">
        <h3 class="card-city">${flag(dest.country_code)} ${escapeHtml(dest.city)}</h3>
        <p class="card-sub">${escapeHtml(dest.country)}${multiAirport ? ` · ${city.airports.length} aéroports` : ''} · <span class="card-route">${escapeHtml(data.origin.code)} <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg> ${escapeHtml(best.code)}</span></p>
        ${factsHtml(dest, best.out.day, best.out.duration, false)}
        <ul class="tc-inc" aria-label="Compris dans le séjour"><li><svg class="icon" aria-hidden="true"><use href="#i-plane"/></svg> Vol</li><li><svg class="icon" aria-hidden="true"><use href="#i-ticket"/></svg> Activités</li><li><svg class="icon" aria-hidden="true"><use href="#i-utensils"/></svg> Restos</li><li><svg class="icon" aria-hidden="true"><use href="#i-bed"/></svg> Hôtel</li></ul>
        ${mainOptions.map((o) => tripOptionHtml(o, city, roundTrip)).join('')}
        ${chips.length ? `
          <div class="chips-alt">
            <span class="alt-title">${city.exactNights && chips.every(({ o }) => o.total < best.total) ? 'Moins cher :' : 'Autres durées :'}</span>
            ${chips.map(({ o, i }) => `
              <button type="button" class="chip chip-alt${o.total < best.total ? '' : ' is-pricier'}" data-pick="${index}:${i}">
                ${o.nights} nuit${o.nights > 1 ? 's' : ''} · <strong>${fmtGroup(o.total)}</strong>
              </button>`).join('')}
          </div>` : ''}
      </div>
    </li>`;
}

// Une option de vol : dates, prix (pour tout le groupe) et « Préparer mon séjour ».
function tripOptionHtml(o, city, roundTrip) {
  const airport = city.airports.length > 1 ? (city.airports.find((a) => a.code === o.code)?.airport || o.code) : '';
  const dates = `${escapeHtml(formatDayShortWeek(o.out.day))}${o.ret ? ` → ${escapeHtml(formatDayShortWeek(o.ret.day))}` : ''}`;
  return `
    <div class="tc-option">
      <p class="tc-dates"><svg class="icon" aria-hidden="true"><use href="#i-calendar"/></svg> ${dates}${o.nights ? ` · ${o.nights} nuit${o.nights > 1 ? 's' : ''}` : ''}${airport ? `<small>Aéroport : ${escapeHtml(airport)}</small>` : ''}</p>
      <div class="tc-foot">
        <p class="tc-price"><small>${roundTrip ? 'Vol aller-retour' : 'Vol aller simple'} pour <button type="button" class="tc-pax" data-recap="pax">${escapeHtml(typeof paxGet === 'function' ? paxLabel(paxGet()) : '1 adulte')}</button></small><strong>${fmtGroup(o.total)}</strong>${perPersonHtml(o.total)}</p>
        <button type="button" class="btn btn-primary tc-go" data-trip='${escapeHtml(JSON.stringify(tripData(o)))}'>Préparer mon séjour <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></button>
      </div>
    </div>`;
}

// Fiche « donner envie » : vignette photo sur la carte de résultat ; grande photo et
// « pourquoi y aller » dans le panneau « Voir ».
const MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function photoHtml(dest) {
  const p = searchState.villes[dest.city_code]?.photo;
  if (!p) return '';
  return `
    <figure class="sheet-photo">
      <img src="${escapeHtml(p.src)}" alt="${escapeHtml(p.alt || dest.city)}" decoding="async">
    </figure>`;
}

// Temps typique d'un mois (nom de l'icône + texte), d'après les heures de soleil par jour et les jours de pluie.
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function monthWeather(c, m) {
  const rain = c.pluie?.[m];
  const sun = c.soleil?.[m] != null ? c.soleil[m] / DAYS_IN_MONTH[m] : null;
  if (sun == null || rain == null) return { icon: 'thermo', label: '' };
  if (sun >= 8 && rain <= 7) return { icon: 'sun', label: 'ensoleillé' };
  if (sun >= 6 && rain <= 10) return { icon: 'cloud-sun', label: 'plutôt ensoleillé' };
  if (sun >= 5.5 && rain > 10) return { icon: 'cloud-sun-rain', label: 'soleil et averses' };
  if (rain >= 11 || (rain >= 10 && sun < 4)) return { icon: 'cloud-rain', label: 'pluvieux' };
  if (sun >= 5) return { icon: 'cloud-sun', label: 'soleil et nuages' };
  if (sun >= 3.5) return { icon: 'cloud', label: 'plutôt nuageux' };
  return { icon: 'cloud', label: 'gris' };
}

// Météo moyenne du mois du départ + durée de vol. `long` : version détaillée (panneau).
function factsHtml(dest, day, duration, long) {
  const facts = [];
  const c = searchState.villes[dest.city_code]?.climate;
  if (c) {
    const m = parseDay(day).getMonth();
    const w = monthWeather(c, m);
    const lo = c.min ? Math.round(c.min[m]) : null;
    const hi = Math.round(c.max[m]);
    const temps = lo != null ? `${lo} à ${hi} °C` : `${hi} °C`;
    const rain = c.pluie?.[m] != null ? Math.round(c.pluie[m]) : null;
    const text = long
      ? `En ${MONTH_NAMES[m]}, en moyenne : ${w.label ? `${w.label}, ` : ''}${temps}${rain != null ? `, ${rain} jours de pluie` : ''}`
      : `${w.label ? capitalize(w.label) + ' · ' : ''}${lo != null ? `${lo}–${hi}°` : `${hi}°`} en ${fmtMonthShort.format(parseDay(day))}`;
    facts.push(`<span title="Moyennes ${escapeHtml(c.source || '')}"><svg class="icon" aria-hidden="true"><use href="#i-${w.icon}"/></svg> ${escapeHtml(text)}</span>`);
  }
  if (duration) facts.push(`<span><svg class="icon" aria-hidden="true"><use href="#i-plane"/></svg> ${escapeHtml(formatDuration(duration))}${long ? ' de vol' : ''}</span>`);
  return facts.length ? `<p class="${long ? 'sheet-facts' : 'card-facts'}">${facts.join('')}</p>` : '';
}

// Prix du vol pour tout le groupe (choix « Voyageurs ») : les prix repérés sont par personne.
function seats() {
  return typeof paxGet === 'function' ? paxSeats(paxGet()) : 1;
}
function fmtGroup(perPerson) {
  return fmtPrice.format(perPerson * seats());
}
function groupLabel() {
  const n = seats();
  const babies = typeof paxGet === 'function' && paxGet().children.some((age) => age < 2);
  return n > 1 || babies ? ` pour ${n} voyageur${n > 1 ? 's' : ''}${babies ? ' (bébé sur les genoux en plus)' : ''}` : '';
}
function perPersonHtml(perPerson) {
  return seats() > 1 ? `<small class="per-person">soit ${fmtPrice.format(perPerson)} / pers.</small>` : '';
}
function perPersonSuffix() {
  return seats() > 1 ? '<small class="pp"> / pers.</small>' : '';
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
// Villes qui ont une page guide (ville.html?c=CODE, activités dans guides/CODE.json).
const GUIDES = ['BCN', 'WAW', 'LIS', 'LON', 'BOD', 'VIE', 'DXB'];

// Lien vers le circuit « Mon voyage » (ville.html), avec le vol choisi : aéroport, dates,
// prix repérés par personne (aller, retour) et durée du vol.
function guideLink(cityCode, trip) {
  const p = new URLSearchParams({ c: cityCode, a: trip.code, out: trip.out, vo: String(trip.outPrice || 0) });
  if (trip.ret) { p.set('ret', trip.ret); p.set('vr', String(trip.retPrice || 0)); }
  if (trip.dur) p.set('dur', String(trip.dur));
  return `ville.html?${p}`;
}

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
      ${photoHtml(dest)}
      ${searchState.villes[dest.city_code]?.pitch ? `<p class="sheet-pitch">${escapeHtml(searchState.villes[dest.city_code].pitch)}</p>` : ''}
      ${factsHtml(dest, trip.out, trip.dur, true)}

      <div class="live" id="live-out" aria-live="polite">${legSeenHtml('Aller', trip.out, trip.outPrice)}</div>
      ${trip.ret ? `<div class="live" id="live-ret" aria-live="polite">${legSeenHtml('Retour', trip.ret, trip.retPrice)}</div>` : ''}
      ${trip.ret ? '<p class="sheet-total" id="live-total"></p>' : ''}

      <p class="sheet-seen">Prix repéré : <strong>${fmtGroup(repere)}</strong>${trip.ret ? ' aller + retour' : ''}${groupLabel()}${seats() > 1 ? ` (${fmtPrice.format(repere)} par personne)` : ''}</p>
      <button type="button" class="btn btn-secondary-wide" id="live-check">
        <svg class="icon" aria-hidden="true"><use href="#i-refresh"/></svg> Vérifier le prix en direct
      </button>

      ${GUIDES.includes(dest.city_code) ? `
      <a class="btn btn-primary btn-block" href="${escapeHtml(guideLink(dest.city_code, trip))}">
        Choisir ce vol et préparer mon voyage <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>
      </a>
      <p class="sheet-note">Ensuite, si vous le souhaitez : vos activités et votre hôtel, puis vous réservez tout à la fin.</p>
      <a class="sheet-only-flight" href="${escapeHtml(link)}" target="_blank" rel="sponsored noopener">Réserver seulement le vol sur Kiwi.com</a>` : `
      <a class="btn btn-primary btn-block" href="${escapeHtml(link)}" target="_blank" rel="sponsored noopener">
        Réserver sur Kiwi.com <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>
      </a>
      <p class="sheet-note">Vous serez redirigé vers Kiwi.com (en français, prix en euros) pour choisir vos vols et payer.</p>
      <p class="sheet-soon"><svg class="icon" aria-hidden="true"><use href="#i-sparkles"/></svg> Activités, restos et hôtel arrivent bientôt pour cette ville : vous pourrez préparer tout le séjour ici.</p>`}
    </div>`;
  sheet.showModal();
  const id = ++liveRequest;

  // La vérification en direct coûte une recherche par vol : seulement sur demande,
  // sauf si ces vols ont déjà été vérifiés récemment (gardé 30 min dans le navigateur).
  const legs = [['live-out', 'Aller', origin.code, dest.code, trip.out]];
  if (trip.ret) legs.push(['live-ret', 'Retour', dest.code, origin.code, trip.ret]);
  const button = $('live-check');
  const run = () => {
    button.hidden = true;
    runLiveChecks(legs, id);
  };
  button.addEventListener('click', run);
  if (legs.every(([, , from, to, day]) => liveCacheGet(from, to, day))) run();
}

function runLiveChecks(legs, id) {
  for (const [elId, label, , , day] of legs) $(elId).innerHTML = liveLoading(label, day);
  const checks = legs.map(([elId, label, from, to, day]) => checkLeg(elId, label, from, to, day, id));
  Promise.all(checks).then(([outPrice, retPrice]) => {
    const totalEl = $('live-total');
    if (id !== liveRequest || !totalEl || legs.length < 2) return;
    totalEl.innerHTML = outPrice != null && retPrice != null
      ? `Total vérifié : <strong>${fmtGroup(outPrice + retPrice)}</strong>${groupLabel()}`
      : '';
  });
}

function legSeenHtml(label, day, price) {
  return `<p class="live-leg">${label} · ${escapeHtml(formatDay(day))}</p>
    <p class="live-label muted">Prix repéré par les voyageurs</p>
    <p class="live-price">${price != null ? fmtPrice.format(price) + perPersonSuffix() : '—'}</p>`;
}

// Résultats déjà vérifiés : on ne repaie pas une recherche pour le même vol pendant 30 min.
const LIVE_CACHE_MS = 30 * 60 * 1000;
function liveCacheKey(from, to, day) { return `prix-direct:${from}-${to}-${day}`; }
function liveCacheGet(from, to, day) {
  try {
    const v = JSON.parse(sessionStorage.getItem(liveCacheKey(from, to, day)) || 'null');
    return v && Date.now() - v.at < LIVE_CACHE_MS ? v.result : null;
  } catch { return null; }
}
function liveCacheSet(from, to, day, result) {
  try { sessionStorage.setItem(liveCacheKey(from, to, day), JSON.stringify({ at: Date.now(), result })); } catch { /* navigation privée */ }
}

function liveLoading(label, day) {
  return `<p class="live-leg">${label} · ${escapeHtml(formatDay(day))}</p>
    <div class="live-loading"><span class="spinner" aria-hidden="true"></span>Vérification du prix en direct…</div>`;
}

// Vérifie un vol en direct et renvoie son prix (ou null).
async function checkLeg(elId, label, from, to, day, id) {
  let result = liveCacheGet(from, to, day);
  if (!result) {
    try {
      const res = await fetch(`${LIVE_PRICE_URL}?from=${from}&to=${to}&date=${day}`);
      if (res.ok) result = await res.json();
    } catch { /* hors ligne ou service indisponible */ }
    if (result?.status === 'ok' || result?.status === 'none') liveCacheSet(from, to, day, result);
  }

  const el = $(elId);
  if (id !== liveRequest || !el) return null;
  const head = `<p class="live-leg">${label} · ${escapeHtml(formatDay(day))}</p>`;
  if (result?.status === 'ok') {
    const details = [result.airline, result.departure ? `départ ${String(result.departure).slice(11, 16)}` : null, result.duration ? formatDuration(result.duration) : null]
      .filter(Boolean).map(escapeHtml).join(' · ');
    el.innerHTML = `${head}
      <p class="live-label"><span class="live-dot" aria-hidden="true"></span>Prix vérifié à l'instant</p>
      <p class="live-price">${fmtPrice.format(result.price)}${perPersonSuffix()}</p>
      ${details ? `<p class="live-details">${details}</p>` : ''}`;
    return result.price;
  }
  el.innerHTML = result?.status === 'none'
    ? `${head}<p class="live-label warn">Plus de vol direct trouvé ce jour-là</p><p class="live-details">Kiwi.com vous proposera d'autres horaires ou dates.</p>`
    : `${head}<p class="live-label muted">Vérification en direct indisponible</p><p class="live-details">Le prix exact s'affichera sur Kiwi.com.</p>`;
  return null;
}

// ---------------------------------------------------------------------------
// Crédits et mentions (lien en bas de page)
// ---------------------------------------------------------------------------
function setupCredits() {
  const dialog = $('credits-sheet');
  $('open-credits').addEventListener('click', async () => {
    const villes = await loadVilles();
    const link = (url, text) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(text)}</a>`;
    const photos = Object.entries(villes)
      .filter(([, v]) => v?.photo)
      .map(([code, v]) => {
        const city = data?.destinations.find((d) => d.city_code === code)?.city || code;
        return `<li>${escapeHtml(city)} : ${link(v.photo.page, `photo de ${v.photo.author}`)}, licence ${escapeHtml(v.photo.license)}</li>`;
      }).join('');
    $('credits-list').innerHTML = `
      <h3>Prix des vols</h3>
      <p>Prix repérés : ${link('https://www.travelpayouts.com', 'Travelpayouts')} / Aviasales. Vérification en direct : ${link('https://ignav.com', 'Ignav')}. Réservation sur ${link('https://www.kiwi.com/fr/', 'Kiwi.com')} (les liens peuvent être des liens partenaires).</p>
      <h3>Carte</h3>
      <p>Fond de carte ${link('https://openfreemap.org', 'OpenFreeMap')} · © ${link('https://www.openstreetmap.org/copyright', 'contributeurs OpenStreetMap')} · affichage ${link('https://maplibre.org', 'MapLibre')}.</p>
      ${photos ? `<h3>Photos</h3><ul>${photos}</ul>` : ''}
      <h3>Météo</h3>
      <p>Moyennes mensuelles de l'Organisation météorologique mondiale (normales 1991–2020).</p>
      <h3>Drapeaux et police</h3>
      <p>Drapeaux ${link('https://flagcdn.com', 'flagcdn.com')} (domaine public) · police Outfit (${link('https://fonts.google.com/specimen/Outfit', 'Google Fonts')}).</p>`;
    dialog.showModal();
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('[data-credits-close]')) dialog.close();
  });
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
    const month = target?.closest('.cal-month');
    months.scrollTop = month ? month.offsetTop - months.offsetTop : 0; // pas scrollIntoView : il faisait défiler la page sur iPhone
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
    updateFormHelp();
    dialog.close();
    if (readyToSearch()) runSearch();
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
    ? 'Touchez le premier et le dernier jour où vous êtes libre : on cherche les meilleurs départs et retours dans cette période.'
    : !cal.end ? `À partir du ${formatDayShort(cal.start)} : touchez maintenant le dernier jour où vous êtes libre.`
    : `Du ${formatDayShort(cal.start)} au ${formatDayShort(cal.end)} : on cherche les meilleurs départs et retours dans cette période.`;
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

// ---------------------------------------------------------------------------
// Voyageurs (adultes + enfants) : gardés dans le navigateur, repris par les pages guides
// pour calculer le prix des activités du groupe.
// ---------------------------------------------------------------------------
// Pastille Voyageurs : « 1 adulte » et « 1 enfant » chacun sur sa ligne (sur téléphone).
function showPax() {
  $('s-pax-label').innerHTML = paxLabel(paxGet()).split(', ').map((t) => `<span class="pax-line">${escapeHtml(t)}</span>`).join('');
}

(function setupPax() {
  const btn = $('s-pax');
  if (!btn || typeof paxGet !== 'function') return;
  showPax();
  // Les prix affichés sont pour tout le groupe : on les recalcule si les voyageurs changent.
  btn.addEventListener('click', () => paxOpen($('pax-sheet'), () => { showPax(); updatePills(); if (searchState.base) runSearch(); }));
})();
