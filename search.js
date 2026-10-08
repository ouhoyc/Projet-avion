// Recherche « Où ? / Quand ? / Combien de nuits ? » à partir des prix jour par jour
// (daily.json). Tous les champs sont facultatifs :
//   - sans destination  → « où partir ? » : meilleure option pour chaque destination ;
//   - avec destination  → « quand partir ? » : meilleures dates pour cette destination ;
//   - sans dates        → sur les 12 prochains mois.
// En aller-retour, on combine deux vols directs (aller + retour) et on propose aussi
// d'autres durées de séjour si elles sont moins chères.
// Utilise les fonctions communes définies dans app.js (formatDay, fmtPrice, flag…).

const NIGHTS_SPREAD = 3; // suggestions : jusqu'à 3 nuits de moins ou de plus
const MAX_DATE_OPTIONS = 8; // nombre de dates proposées pour une destination précise

const sEls = {
  form: $('search-form'),
  dest: $('s-dest'),
  from: $('s-from'),
  to: $('s-to'),
  nights: $('s-nights'),
  nightsField: $('s-nights-field'),
  results: $('search-results'),
};

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
    const n = clamp(Number(sEls.nights.value || 4) + Number(step.dataset.step), 1, 21);
    sEls.nights.value = n;
  });

  sEls.form.addEventListener('submit', (e) => {
    e.preventDefault();
    runSearch();
  });

  // Résultat : ouvrir le panneau de réservation (aller seul ou aller + retour).
  sEls.results.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-trip]');
    if (btn) openTripSheet(JSON.parse(btn.dataset.trip));
  });

  // La liste des destinations n'est connue qu'une fois data.json chargé (app.js).
  const fill = () => {
    if (!data) return setTimeout(fill, 150);
    const sorted = [...data.destinations].sort((a, b) => a.city.localeCompare(b.city, 'fr'));
    for (const d of sorted) sEls.dest.add(new Option(`${d.city} (${d.code}) – ${d.country}`, d.code));
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

  const query = {
    type: tripType(),
    dest: sEls.dest.value,
    start: sEls.from.value || isoDay(new Date()),
    end: sEls.to.value || isoDay(addDays(new Date(), 365)),
    nights: clamp(Number(sEls.nights.value) || 4, 1, 21),
  };
  if (query.end < query.start) [query.start, query.end] = [query.end, query.start];

  const codes = query.dest ? [query.dest] : Object.keys(daily.dests);
  const results = [];
  for (const code of codes) {
    const prices = daily.dests[code];
    const dest = data.destinations.find((d) => d.code === code);
    if (!prices || !dest) continue;
    const options = query.type === 'ow' ? oneWayOptions(prices, query) : roundTripOptions(prices, query);
    if (options.length) results.push({ dest, options });
  }

  renderResults(results, query, daily);
  sEls.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Aller simple : les jours de départ les moins chers dans la période.
function oneWayOptions(prices, q) {
  return Object.entries(prices.o)
    .filter(([day]) => day >= q.start && day <= q.end)
    .map(([day, info]) => ({ total: info[0], out: leg(day, info), nights: null }))
    .sort((a, b) => a.total - b.total)
    .slice(0, q.dest ? MAX_DATE_OPTIONS : 1);
}

// Aller-retour : toutes les combinaisons aller + retour direct qui tiennent dans la
// période, pour la durée demandée et jusqu'à ±3 nuits.
function roundTripOptions(prices, q) {
  const minN = Math.max(1, q.nights - NIGHTS_SPREAD);
  const maxN = q.nights + NIGHTS_SPREAD;
  const combos = [];
  for (const [day, outInfo] of Object.entries(prices.o)) {
    if (day < q.start || day > q.end) continue;
    for (let n = minN; n <= maxN; n++) {
      const back = isoDay(addDays(parseDay(day), n));
      if (back > q.end) break;
      const retInfo = prices.r[back];
      if (!retInfo) continue;
      combos.push({ total: outInfo[0] + retInfo[0], nights: n, out: leg(day, outInfo), ret: leg(back, retInfo) });
    }
  }
  if (!combos.length) return [];
  combos.sort((a, b) => a.total - b.total);

  const wanted = combos.filter((c) => c.nights === q.nights);
  // Meilleure combinaison pour chaque autre durée, gardée seulement si elle est moins chère.
  const bestByNights = new Map();
  for (const c of combos) if (!bestByNights.has(c.nights)) bestByNights.set(c.nights, c);

  if (q.dest) {
    // Destination précise : plusieurs dates possibles pour la durée demandée.
    const main = (wanted.length ? wanted : combos).slice(0, MAX_DATE_OPTIONS);
    main.alternatives = cheaperAlternatives(bestByNights, q.nights, main[0]);
    return main;
  }
  const best = wanted[0] || combos[0];
  const result = [best];
  result.alternatives = cheaperAlternatives(bestByNights, q.nights, best);
  return result;
}

function cheaperAlternatives(bestByNights, wantedNights, reference) {
  return [...bestByNights.values()]
    .filter((c) => c.nights !== wantedNights && c.total < reference.total)
    .sort((a, b) => a.total - b.total)
    .slice(0, 3);
}

function leg(day, info) {
  const [price, airline, duration, time, seen] = info;
  return { day, price, airline, duration, time, seen };
}

// ---------------------------------------------------------------------------
// Affichage des résultats
// ---------------------------------------------------------------------------
function renderResults(results, q, daily) {
  const roundTrip = q.type === 'rt';
  const period = sEls.from.value || sEls.to.value
    ? `du ${formatDayShort(q.start)} au ${formatDayShort(q.end)}`
    : 'sur les 12 prochains mois';

  if (!results.length) {
    sEls.results.innerHTML = `
      <div class="empty">
        <svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>
        <p>Aucun vol direct${roundTrip ? ' aller-retour' : ''} repéré ${escapeHtml(period)}.</p>
        <p class="hint">Élargis la période ou change le nombre de nuits : ces prix viennent des recherches récentes des voyageurs, certains jours n'en ont pas.</p>
      </div>`;
    return;
  }

  results.sort((a, b) => a.options[0].total - b.options[0].total);
  const airlineName = (code) => daily.airlines?.[code] || code;
  const title = q.dest
    ? `Meilleures dates pour ${escapeHtml(results[0].dest.city)}`
    : `${results.length} destination${results.length > 1 ? 's' : ''} ${roundTrip ? 'en aller-retour direct' : 'en vol direct'}`;

  const optionHtml = (dest, o, primary) => {
    const trip = { code: dest.code, out: o.out.day, ret: o.ret?.day || null, outPrice: o.out.price, retPrice: o.ret?.price ?? null };
    return `
      <div class="option ${primary ? 'primary' : ''}">
        <div class="legs">
          ${legHtml('Aller', o.out, airlineName)}
          ${o.ret ? legHtml('Retour', o.ret, airlineName) : ''}
        </div>
        <div class="option-side">
          ${o.nights ? `<span class="nights-badge">${o.nights} nuit${o.nights > 1 ? 's' : ''}</span>` : ''}
          <strong class="option-total">${fmtPrice.format(o.total)}</strong>
          <button type="button" class="btn btn-primary btn-small" data-trip='${escapeHtml(JSON.stringify(trip))}'>Voir</button>
        </div>
      </div>`;
  };

  sEls.results.innerHTML = `
    <div class="section-head"><h2>${title}</h2><p class="result-count">${escapeHtml(period)}</p></div>
    <ul class="cards">
      ${results.map(({ dest, options }) => `
        <li class="card result ${priceTier(options[0].total / (roundTrip ? 2 : 1))}">
          <div class="card-top">
            <span class="flag" aria-hidden="true">${flag(dest.country_code)}</span>
            <div class="card-title">
              <h3 class="card-city">${escapeHtml(dest.city)}<span class="code">${escapeHtml(dest.code)}</span></h3>
              <p class="card-sub">${escapeHtml(dest.country)}${roundTrip ? ' · total aller + retour' : ''}</p>
            </div>
          </div>
          ${options.map((o, i) => optionHtml(dest, o, i === 0)).join('')}
          ${options.alternatives?.length ? `
            <div class="alternatives">
              <p class="alt-title">Moins cher avec une autre durée :</p>
              ${options.alternatives.map((o) => optionHtml(dest, o, false)).join('')}
            </div>` : ''}
        </li>`).join('')}
    </ul>
    <p class="disclaimer"><svg class="icon" aria-hidden="true"><use href="#i-info"/></svg>
      <span>Derniers prix repérés par les voyageurs. Touche « Voir » pour vérifier les prix en direct avant de réserver.</span></p>`;
}

function legHtml(label, l, airlineName) {
  const seen = l.seen ? ` · vu ${seenLabel(l.seen)}` : '';
  return `
    <p class="leg">
      <span class="leg-label">${label}</span>
      <span class="leg-main">${escapeHtml(formatDay(l.day))}${l.time ? ` · ${escapeHtml(l.time)}` : ''}</span>
      <span class="leg-sub">${fmtPrice.format(l.price)} · ${escapeHtml(airlineName(l.airline))}${escapeHtml(seen)}</span>
    </p>`;
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
