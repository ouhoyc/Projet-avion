// Récupère les vols DIRECTS les moins chers depuis un aéroport de départ
// (Lyon par défaut) via l'API Data de Travelpayouts / Aviasales,
// puis écrit le résultat dans data.json (lu par le site).
//
// Lancer :  node scripts/fetch-prices.mjs
// Changer d'aéroport :  ORIGIN=GVA node scripts/fetch-prices.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// 1. Configuration
// ---------------------------------------------------------------------------

loadDotEnv(join(ROOT, '.env'));

const CONFIG = {
  origin: (process.env.ORIGIN || 'LYS').toUpperCase(), // code IATA du départ
  currency: 'eur',
  market: 'fr',         // données issues des recherches du marché français
  monthsAhead: 12,      // nombre de mois explorés à partir du mois en cours
  token: process.env.TRAVELPAYOUTS_TOKEN,
  marker: process.env.TRAVELPAYOUTS_MARKER,
  output: join(ROOT, 'data.json'),
  dailyOutput: join(ROOT, 'daily.json'), // prix jour par jour, aller ET retour

};

const API = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates';
const API_DAILY = 'https://api.travelpayouts.com/aviasales/v3/grouped_prices';
const REF = 'https://api.travelpayouts.com/data/fr';
// Version « marché français » d'Aviasales : prix en euros.
const AVIASALES = 'https://www.aviasales.fr';

// Les prix viennent du cache Aviasales (recherches des derniers jours). On
// préfère les prix vus il y a au plus MAX_AGE_DAYS jours, plus fiables ;
// les plus anciens ne servent que s'il n'y a rien de plus récent.
const MAX_AGE_DAYS = 2;

// Corrections de quelques noms de villes mal traduits dans les fichiers de
// référence Travelpayouts (clé = code IATA de la ville).
const CITY_NAMES = {
  MAD: 'Madrid',
  BUD: 'Budapest',
  TCI: 'Tenerife',
  LPA: 'Las Palmas de Gran Canaria',
  FEZ: 'Fès',
  FNC: 'Funchal (Madère)',
  PMI: 'Palma de Majorque',
};

// ---------------------------------------------------------------------------
// 2. Programme principal
// ---------------------------------------------------------------------------

async function main() {
  if (!CONFIG.token) fail('TRAVELPAYOUTS_TOKEN est vide : ajoute ton jeton dans .env (ou dans les secrets GitHub).');
  if (!CONFIG.marker) fail('TRAVELPAYOUTS_MARKER est vide.');

  console.log(`✈️  Départ : ${CONFIG.origin}`);
  console.log('📚 Téléchargement des fichiers de référence (villes, pays, aéroports, compagnies)…');
  const ref = await loadReferences();

  const months = nextMonths(CONFIG.monthsAhead);
  const tickets = [];

  // Une requête sans date (les moins chers toutes dates confondues),
  // puis une par mois pour alimenter le filtre « mois de départ ».
  for (const month of [null, ...months]) {
    const found = await fetchCheapestDirect(month);
    console.log(`   ${month ?? 'toutes dates'} : ${found.length} destinations`);
    tickets.push(...found);
  }

  const destinations = buildDestinations(tickets, ref);
  if (destinations.length === 0) {
    // On ne remplace pas un data.json existant par un fichier vide.
    fail('Aucun vol direct trouvé : data.json n’a pas été modifié.');
  }

  const originAirport = ref.airports.get(CONFIG.origin);
  const originCity = ref.cities.get(originAirport?.city_code || CONFIG.origin);
  const data = {
    origin: {
      code: CONFIG.origin,
      city: CITY_NAMES[originCity?.code] || nameOf(originCity) || nameOf(originAirport) || CONFIG.origin,
      country: nameOf(ref.countries.get(originCity?.country_code)),
      lat: (originAirport || originCity)?.coordinates?.lat ?? null,
      lon: (originAirport || originCity)?.coordinates?.lon ?? null,
    },
    currency: 'EUR',
    updated_at: new Date().toISOString(),
    months,
    count: destinations.length,
    destinations,
  };

  writeFileSync(CONFIG.output, JSON.stringify(data, null, 2) + '\n');
  console.log(`✅ ${destinations.length} destinations écrites dans data.json`);

  // Prix jour par jour, dans les deux sens, pour la recherche par dates.
  console.log('📅 Prix jour par jour (aller et retour) sur 12 mois…');
  const daily = await buildDaily(destinations.map((d) => d.code), months, ref);
  writeFileSync(CONFIG.dailyOutput, JSON.stringify(daily) + '\n');
  console.log(`✅ daily.json : ${daily.stats.out} prix aller, ${daily.stats.ret} prix retour`);
}

// ---------------------------------------------------------------------------
// 3. Appels à l'API
// ---------------------------------------------------------------------------

// Renvoie le billet direct le moins cher pour chaque destination
// (unique=true) au départ de CONFIG.origin, pour un mois donné ou toutes dates.
async function fetchCheapestDirect(month) {
  const results = [];
  const limit = 1000; // maximum autorisé par l'API
  for (let page = 1; page <= 5; page++) {
    const params = new URLSearchParams({
      origin: CONFIG.origin,
      direct: 'true',
      unique: 'true',
      one_way: 'true',
      sorting: 'price',
      currency: CONFIG.currency,
      market: CONFIG.market,
      limit: String(limit),
      page: String(page),
    });
    if (month) params.set('departure_at', month);

    const res = await fetch(`${API}?${params}`, {
      // Le jeton part dans un en-tête HTTP, jamais dans le site.
      headers: { 'X-Access-Token': CONFIG.token, 'Accept-Encoding': 'gzip' },
    });
    if (res.status === 401) fail('Jeton refusé par Travelpayouts (401). Vérifie TRAVELPAYOUTS_TOKEN.');
    if (!res.ok) fail(`Erreur API ${res.status} : ${(await res.text()).slice(0, 200)}`);

    const json = await res.json();
    if (!json.success) fail(`Réponse API en échec : ${JSON.stringify(json).slice(0, 200)}`);

    results.push(...json.data);
    if (json.data.length < limit) break;
    await sleep(300);
  }
  await sleep(300); // on reste poli avec l'API (limites de débit)
  return results;
}

async function loadReferences() {
  const get = async (name) => {
    const res = await fetch(`${REF}/${name}.json`);
    if (!res.ok) fail(`Impossible de télécharger ${name}.json (${res.status})`);
    return res.json();
  };
  const [cities, countries, airports, airlines] = await Promise.all(
    ['cities', 'countries', 'airports', 'airlines'].map(get),
  );
  const byCode = (list) => new Map(list.map((x) => [x.code, x]));
  return {
    cities: byCode(cities),
    countries: byCode(countries),
    airports: byCode(airports),
    airlines: byCode(airlines),
  };
}

// ---------------------------------------------------------------------------
// 3 bis. Prix jour par jour (aller : origine → destination, retour : destination → origine)
// ---------------------------------------------------------------------------

// Format compact pour un fichier léger sur iPhone :
// dests[code].o["2026-11-14"] = [prix, compagnie, durée (min), heure de départ, date où le prix a été vu]
// dests[code].r[...] = idem pour le vol retour vers l'origine.
async function buildDaily(codes, months, ref) {
  const jobs = [];
  for (const code of codes) {
    for (const month of months) {
      jobs.push({ code, dir: 'o', from: CONFIG.origin, to: code, month });
      jobs.push({ code, dir: 'r', from: code, to: CONFIG.origin, month });
    }
  }

  const dests = Object.fromEntries(codes.map((c) => [c, { o: {}, r: {} }]));
  const airlines = {};
  const today = new Date().toISOString().slice(0, 10);
  let done = 0;
  const diag = { calls: 0, empty: 0, keys: 0, kept: 0, past: 0, stops: 0 };

  // 5 requêtes en parallèle, ~9 par seconde au total (limite API : 600 / minute).
  await runPool(jobs, 5, async (job) => {
    const data = await fetchDaily(job);
    const entries = Object.entries(data);
    diag.calls++; diag.keys += entries.length; if (!entries.length) diag.empty++;
    for (const [day, t] of entries) {
      if (day < today) { diag.past++; continue; }
      if (t.transfers !== 0 || !t.price) { diag.stops++; continue; }
      diag.kept++;
      dests[job.code][job.dir][day] = [
        Math.round(t.price),
        t.airline,
        t.duration_to || t.duration || null,
        localTime(t.departure_at),
        foundAt(t),
      ];
      if (t.airline && !airlines[t.airline]) airlines[t.airline] = nameOf(ref.airlines.get(t.airline)) || t.airline;
    }
    if (++done % 200 === 0) console.log(`   ${done}/${jobs.length}`);
  });

  console.log(`   ${diag.calls} requêtes, ${diag.empty} sans aucun prix, ${diag.kept} prix gardés`);
  const count = (dir) => Object.values(dests).reduce((n, d) => n + Object.keys(d[dir]).length, 0);
  return {
    origin: CONFIG.origin,
    currency: 'EUR',
    updated_at: new Date().toISOString(),
    stats: { out: count('o'), ret: count('r') },
    airlines,
    dests,
  };
}

async function fetchDaily({ from, to, month }) {
  const params = new URLSearchParams({
    origin: from,
    destination: to,
    departure_at: month,
    group_by: 'departure_at',
    direct: 'true',
    currency: CONFIG.currency,
    market: CONFIG.market,
  });
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(`${API_DAILY}?${params}`, { headers: { 'X-Access-Token': CONFIG.token } });
    if (res.status === 429) { await sleep(15000 * attempt); continue; } // trop de requêtes : on patiente
    if (res.status === 401) fail('Jeton refusé par Travelpayouts (401).');
    if (!res.ok) { await sleep(2000); continue; }
    const json = await res.json();
    await sleep(550);
    return json.success ? json.data || {} : {};
  }
  return {}; // on abandonne ce mois-là plutôt que de bloquer toute la mise à jour
}

async function runPool(items, size, worker) {
  let next = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (next < items.length) await worker(items[next++]);
  }));
}

// Heure locale de départ « HH:MM » (l'API la donne avec le fuseau de l'aéroport, ou en UTC).
function localTime(iso) {
  return /T(\d{2}:\d{2})/.exec(iso || '')?.[1] || null;
}

// ---------------------------------------------------------------------------
// 4. Mise en forme des données pour le site
// ---------------------------------------------------------------------------

function buildDestinations(tickets, ref) {
  const today = new Date().toISOString().slice(0, 10);
  const byAirport = new Map();

  for (const t of tickets) {
    if (t.transfers !== 0) continue;                      // sécurité : direct uniquement
    if (!t.price || !t.departure_at) continue;
    if (t.departure_at.slice(0, 10) < today) continue;    // vol déjà passé

    const code = t.destination_airport || t.destination;
    if (!byAirport.has(code)) byAirport.set(code, { code, tickets: [] });
    byAirport.get(code).tickets.push(t);
  }

  const destinations = [];
  for (const { code, tickets: list } of byAirport.values()) {
    const airport = ref.airports.get(code);
    const city = ref.cities.get(airport?.city_code || list[0].destination);
    const point = airport?.coordinates || city?.coordinates;
    if (!point) continue; // impossible de placer la destination sur la carte

    // Meilleur prix par mois de départ (pour le filtre « mois »).
    const byMonth = new Map();
    for (const t of list) {
      const m = t.departure_at.slice(0, 7);
      if (!byMonth.has(m)) byMonth.set(m, []);
      byMonth.get(m).push(t);
    }
    const months = {};
    for (const [m, monthTickets] of [...byMonth].sort()) {
      months[m] = formatTicket(cheapestRecent(monthTickets), ref);
    }
    const best = formatTicket(cheapestRecent(list), ref);

    destinations.push({
      code,
      city_code: city?.code || list[0].destination,
      city: CITY_NAMES[city?.code] || nameOf(city) || nameOf(airport) || code,
      airport: nameOf(airport),
      country_code: city?.country_code || airport?.country_code || '',
      country: nameOf(ref.countries.get(city?.country_code || airport?.country_code)),
      lat: point.lat,
      lon: point.lon,
      ...best,       // prix minimum, date, compagnie, durée, lien
      months,
    });
  }

  return destinations.sort((a, b) => a.price - b.price);
}

// Le moins cher parmi les prix récents (ou parmi tous s'il n'y en a aucun).
function cheapestRecent(tickets) {
  const limit = new Date(Date.now() - MAX_AGE_DAYS * 86400000).toISOString().slice(0, 10);
  const recent = tickets.filter((t) => (foundAt(t) || '') >= limit);
  const pool = recent.length ? recent : tickets;
  return pool.reduce((a, b) => (b.price < a.price ? b : a));
}

// Date à laquelle le prix a été vu sur Aviasales (search_date=JJMMAAAA dans le lien).
function foundAt(t) {
  const m = /search_date=(\d{2})(\d{2})(\d{4})/.exec(t.link || '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

// Nom en français si disponible, sinon en anglais.
function nameOf(item) {
  return item?.name || item?.name_translations?.en || '';
}

function formatTicket(t, ref) {
  return {
    price: Math.round(t.price),
    date: t.departure_at,                          // ex. 2026-11-14T07:05:00+01:00
    airline_code: t.airline,
    airline: nameOf(ref.airlines.get(t.airline)) || t.airline,
    flight_number: t.flight_number ? `${t.airline}${t.flight_number}` : null,
    duration: t.duration_to || t.duration || null, // en minutes, si disponible
    found_at: foundAt(t),                          // date où ce prix a été vu
    link: affiliateLink(t.link),
  };
}

// Lien vers Aviasales avec le marker d'affiliation (pas le jeton !).
function affiliateLink(path) {
  const url = new URL(path || '/', AVIASALES);
  url.searchParams.set('currency', 'eur');
  url.searchParams.set('marker', CONFIG.marker);
  return url.toString();
}

// ---------------------------------------------------------------------------
// 5. Petits utilitaires
// ---------------------------------------------------------------------------

function nextMonths(n) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    return d.toISOString().slice(0, 7); // AAAA-MM
  });
}

// Lit le fichier .env sans écraser les variables déjà définies
// (ex. secrets GitHub ou variables d'environnement du serveur).
function loadDotEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, '$2').trim();
    if (value && !process.env[m[1]]) process.env[m[1]] = value;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

main().catch((err) => fail(err.stack || String(err)));
