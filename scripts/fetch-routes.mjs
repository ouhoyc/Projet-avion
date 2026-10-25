// Liste COMPLÈTE des vols directs depuis Lyon, même ceux qui n'ont aucun prix repéré
// (les prix gratuits de Travelpayouts ne couvrent que les vols cherchés récemment par
// des voyageurs : Lyon → Koutaïssi disparaissait du site dès qu'il n'y avait plus de prix).
//
// Source : le tableau « Airlines and destinations » de la page Wikipédia (en anglais) de
// l'aéroport, tenu à jour par des bénévoles avec des sources. Codes IATA via Wikidata,
// noms français, pays et positions via les fichiers de référence de Travelpayouts.
// Gratuit et sans clé. Écrit routes.json (lu par le site).
//
// Lancer :  node scripts/fetch-routes.mjs

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = (process.env.ORIGIN || 'LYS').toUpperCase();
const PAGES = { LYS: 'Lyon–Saint-Exupéry_Airport' }; // page Wikipédia de l'aéroport de départ
const UA = { 'User-Agent': 'ProjetAvion/1.0 (https://projet-avion-ouhoyc.vercel.app)' };
const REF = 'https://api.travelpayouts.com/data/fr';
// Mêmes corrections de noms que scripts/fetch-prices.mjs (clé = code IATA de la ville).
const CITY_NAMES = {
  MAD: 'Madrid', BUD: 'Budapest', TCI: 'Tenerife', ACE: 'Lanzarote', LPA: 'Las Palmas de Gran Canaria',
  FEZ: 'Fès', FNC: 'Funchal (Madère)', PMI: 'Palma de Majorque',
  BDS: 'Brindisi', SID: 'Sal (Cap-Vert)', JTR: 'Santorin', RUN: 'Saint-Denis (La Réunion)', EDI: 'Édimbourg',
  CLJ: 'Cluj-Napoca', PRN: 'Pristina', KIV: 'Chișinău',
};
// Vols sans droit de trafic local (escale d'une ligne long-courrier) : pas vendus depuis Lyon.
const EXCLUDE = new Set(['GVA']);

async function getJson(url) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { headers: UA });
    if (r.ok) return r.json();
    await new Promise((ok) => setTimeout(ok, 5000));
  }
  throw new Error(`${url} : échec`);
}

// Tableau « Passenger » de la page Wikipédia → [{ article, airline, seasonal }]
async function readWikipedia() {
  const page = PAGES[ORIGIN];
  if (!page) throw new Error(`Pas de page Wikipédia connue pour ${ORIGIN}`);
  const r = await fetch(`https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(page)}&action=raw`, { headers: UA });
  if (!r.ok) throw new Error(`Wikipédia : ${r.status}`);
  let text = await r.text();
  const start = text.indexOf('===Passenger===');
  const end = text.indexOf('===Cargo===', start);
  if (start < 0) throw new Error('Tableau des destinations introuvable sur Wikipédia');
  text = text.slice(start, end > 0 ? end : undefined)
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const today = new Date().toISOString().slice(0, 10);
  const routes = [];
  // Une ligne du tableau : « | [[Compagnie]] | destinations », jusqu'à la ligne suivante.
  for (const row of text.split(/\n\|\s*(?=\{\{nowrap\||\[\[)/).slice(1)) {
    const [airlineCell, ...rest] = row.split(/\s\|\s/);
    const airline = /\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/.exec(airlineCell)?.[1];
    const cell = rest.join(' | ');
    if (!airline || !cell) continue;
    const seasonalAt = cell.search(/'''Seasonal/i);
    for (const m of cell.matchAll(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]([^[]*)/g)) {
      const note = m[2];
      // « (ends 30 March 2026) » déjà passé : ligne arrêtée.
      const ends = /\bends? (\d{1,2} \w+ \d{4})/i.exec(note);
      if (ends && new Date(`${ends[1]} UTC`).toISOString().slice(0, 10) < today) continue;
      routes.push({ article: m[1].trim(), airline, seasonal: seasonalAt >= 0 && m.index > seasonalAt });
    }
  }
  return routes;
}

// Article Wikipédia d'un aéroport → code IATA (Wikidata, propriété P238).
async function iataCodes(articles) {
  const items = new Map();
  for (let i = 0; i < articles.length; i += 50) {
    const titles = articles.slice(i, i + 50).join('|');
    const j = await getJson(`https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageprops&ppprop=wikibase_item&titles=${encodeURIComponent(titles)}`);
    // Titre final → titres demandés (plusieurs liens peuvent mener à la même page).
    const alias = new Map();
    const add = (to, from) => alias.set(to, [...(alias.get(to) || []), ...(alias.get(from) || [from])]);
    for (const n of j.query.normalized || []) add(n.to, n.from);
    for (const rd of j.query.redirects || []) add(rd.to, rd.from);
    for (const p of Object.values(j.query.pages)) {
      if (!p.pageprops?.wikibase_item) continue;
      for (const t of [p.title, ...(alias.get(p.title) || [])]) items.set(t, p.pageprops.wikibase_item);
    }
  }
  const codes = new Map();
  const ids = [...new Set(items.values())];
  const byId = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const j = await getJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${ids.slice(i, i + 50).join('|')}`);
    for (const [id, e] of Object.entries(j.entities)) {
      const iata = e.claims?.P238?.find((c) => c.rank !== 'deprecated')?.mainsnak?.datavalue?.value;
      if (iata) byId.set(id, iata.toUpperCase());
    }
  }
  for (const [article, id] of items) if (byId.has(id)) codes.set(article, byId.get(id));
  return codes;
}

const nameOf = (item) => item?.name_translations?.fr || item?.name || null;

async function main() {
  const rows = await readWikipedia();
  console.log(`📋 Wikipédia : ${rows.length} lignes (compagnie × destination)`);
  const codes = await iataCodes([...new Set(rows.map((r) => r.article))]);
  const [airports, cities, countries] = await Promise.all(['airports', 'cities', 'countries'].map((f) => getJson(`${REF}/${f}.json`)));
  const airportBy = new Map(airports.map((a) => [a.code, a]));
  const cityBy = new Map(cities.map((c) => [c.code, c]));
  const countryBy = new Map(countries.map((c) => [c.code, c]));

  const byCode = new Map();
  const missing = [];
  for (const r of rows) {
    const code = codes.get(r.article);
    const airport = code && airportBy.get(code);
    if (!airport) { missing.push(r.article); continue; }
    if (EXCLUDE.has(code)) continue;
    const city = cityBy.get(airport.city_code);
    const point = airport.coordinates || city?.coordinates;
    if (!point) { missing.push(r.article); continue; }
    if (!byCode.has(code)) {
      byCode.set(code, {
        code,
        city_code: city?.code || airport.city_code || code,
        city: CITY_NAMES[city?.code] || nameOf(city) || nameOf(airport) || code,
        airport: nameOf(airport),
        country_code: city?.country_code || airport.country_code || '',
        country: nameOf(countryBy.get(city?.country_code || airport.country_code)),
        lat: point.lat,
        lon: point.lon,
        airlines: [],
        seasonal: true,
      });
    }
    const d = byCode.get(code);
    if (!d.airlines.includes(r.airline)) d.airlines.push(r.airline);
    d.seasonal &&= r.seasonal; // saisonnière seulement si aucune compagnie ne vole toute l'année
  }
  if (missing.length) console.log(`⚠️  Sans code IATA ou sans position (ignorés) : ${[...new Set(missing)].join(', ')}`);
  const routes = [...byCode.values()].sort((a, b) => a.city.localeCompare(b.city, 'fr'));
  if (routes.length < 50) throw new Error(`Seulement ${routes.length} destinations : routes.json n'a pas été modifié.`);
  writeFileSync(join(ROOT, 'routes.json'), JSON.stringify({
    origin: ORIGIN,
    source: `Wikipédia (en), page ${PAGES[ORIGIN].replace(/_/g, ' ')}`,
    updated_at: new Date().toISOString(),
    count: routes.length,
    routes,
  }, null, 1) + '\n');
  console.log(`✅ routes.json : ${routes.length} destinations en vol direct`);
}

main().catch((e) => { console.error(`❌ ${e.message}`); process.exit(1); });
