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
};

const API = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates';
const REF = 'https://api.travelpayouts.com/data/fr';
const AVIASALES = 'https://www.aviasales.com';

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
      city: originCity?.name || originAirport?.name || CONFIG.origin,
      country: ref.countries.get(originCity?.country_code)?.name || '',
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
    const months = {};
    for (const t of list) {
      const m = t.departure_at.slice(0, 7);
      if (!months[m] || t.price < months[m].price) months[m] = formatTicket(t, ref);
    }
    const best = Object.values(months).reduce((a, b) => (b.price < a.price ? b : a));

    destinations.push({
      code,
      city_code: city?.code || list[0].destination,
      city: city?.name || airport?.name || code,
      airport: airport?.name || '',
      country_code: city?.country_code || airport?.country_code || '',
      country: ref.countries.get(city?.country_code || airport?.country_code)?.name || '',
      lat: point.lat,
      lon: point.lon,
      ...best,       // prix minimum, date, compagnie, durée, lien
      months,
    });
  }

  return destinations.sort((a, b) => a.price - b.price);
}

function formatTicket(t, ref) {
  return {
    price: Math.round(t.price),
    date: t.departure_at,                          // ex. 2026-11-14T07:05:00+01:00
    airline_code: t.airline,
    airline: ref.airlines.get(t.airline)?.name || t.airline,
    flight_number: t.flight_number ? `${t.airline}${t.flight_number}` : null,
    duration: t.duration_to || t.duration || null, // en minutes, si disponible
    link: affiliateLink(t.link),
  };
}

// Lien vers Aviasales avec le marker d'affiliation (pas le jeton !).
function affiliateLink(path) {
  const url = new URL(path || '/', AVIASALES);
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
