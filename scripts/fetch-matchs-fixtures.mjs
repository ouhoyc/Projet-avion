// Calendrier des matchs, source de secours : fixturedownload.com (gratuit, sans clé, sans protection anti-robots).
// Lancé tout seul par fetch-matchs.mjs quand SofaScore refuse la machine (erreur 403), ou à la main.
//
// Il met à jour seulement les grands championnats de foot et les coupes d'Europe (liste SLUGS ci-dessous) :
// leurs anciens matchs sont remplacés, tous les autres (basket, rugby, petits pays) restent comme ils sont.
// Un match est rattaché à une ville si son stade est à moins de RAYON_KM du centre (comme fetch-matchs.mjs).
// Les stades sont localisés dans OpenStreetMap une seule fois (gardés dans matchs-cache.json, clé `stades_fd`).

import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs';

const RAYON_KM = 25;
const HORIZON_JOURS = 365;
const FETCH_UA = 'ProjetAvion/1.0 (site de voyage, calendrier des matchs)';

// Fichier fixturedownload → nom de la compétition sur le site (identique à SofaScore), niveau, pays du championnat.
const SLUGS = {
  'epl-2026': { competition: 'Premier League', niveau: 1, pays: 'gb' },
  'championship-2026': { competition: 'Championship', niveau: 2, pays: 'gb' },
  'la-liga-2026': { competition: 'LaLiga', niveau: 1, pays: 'es' },
  'serie-a-2026': { competition: 'Serie A', niveau: 1, pays: 'it' },
  'bundesliga-2026': { competition: 'Bundesliga', niveau: 1, pays: 'de' },
  'ligue-1-2026': { competition: 'Ligue 1', niveau: 1, pays: 'fr' },
  'ligue-2-2026': { competition: 'Ligue 2', niveau: 2, pays: 'fr' },
  'primeira-liga-2026': { competition: 'Liga Portugal Betclic', niveau: 1, pays: 'pt' },
  'eredivisie-2026': { competition: 'VriendenLoterij Eredivisie', niveau: 1, pays: 'nl' },
  'super-lig-2026': { competition: 'Trendyol Süper Lig', niveau: 1, pays: 'tr' },
  'scottish-premiership-2026': { competition: 'Scottish Premiership', niveau: 1, pays: 'gb' },
  'champions-league-2026': { competition: 'UEFA Champions League', niveau: 1, pays: '' },
  'europa-league-2026': { competition: 'UEFA Europa League', niveau: 2, pays: '' },
  'conference-league-2026': { competition: 'UEFA Conference League', niveau: 2, pays: '' },
};
const RESERVE = /\s(II|B|U\d\d)$|^Jong\s|\bFutures\b|^Young Violets|\bAmateure\b|\bReserves?\b/i;

const FUSEAUX = {
  AE: 'Asia/Dubai', AL: 'Europe/Tirane', AM: 'Asia/Yerevan', AT: 'Europe/Vienna', BE: 'Europe/Brussels',
  CA: 'America/Toronto', CH: 'Europe/Zurich', CZ: 'Europe/Prague', DE: 'Europe/Berlin', DK: 'Europe/Copenhagen',
  DZ: 'Africa/Algiers', EG: 'Africa/Cairo', ES: 'Europe/Madrid', FR: 'Europe/Paris', GB: 'Europe/London',
  GE: 'Asia/Tbilisi', GR: 'Europe/Athens', HR: 'Europe/Zagreb', HU: 'Europe/Budapest', IE: 'Europe/Dublin',
  IL: 'Asia/Jerusalem', IT: 'Europe/Rome', JO: 'Asia/Amman', LB: 'Asia/Beirut', LT: 'Europe/Vilnius',
  MA: 'Africa/Casablanca', MT: 'Europe/Malta', NL: 'Europe/Amsterdam', NO: 'Europe/Oslo', PL: 'Europe/Warsaw',
  PT: 'Europe/Lisbon', RO: 'Europe/Bucharest', RS: 'Europe/Belgrade', SE: 'Europe/Stockholm', SN: 'Africa/Dakar',
  TN: 'Africa/Tunis', TR: 'Europe/Istanbul',
};
const FUSEAUX_VILLES = { LPA: 'Atlantic/Canary', TCI: 'Atlantic/Canary', ACE: 'Atlantic/Canary', FUE: 'Atlantic/Canary', PDL: 'Atlantic/Azores' };
function local(iso, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { jour: `${p.year}-${p.month}-${p.day}`, heure: `${p.hour}:${p.minute}` };
}

const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
function km(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// Destinations et centres (déjà calculés par fetch-matchs.mjs, gardés dans matchs-cache.json).
const data = JSON.parse(readFileSync('data.json', 'utf8'));
const cache = JSON.parse(readFileSync('matchs-cache.json', 'utf8'));
const stadesFd = Object.fromEntries(Object.entries(cache.stades_fd || {}).filter(([k]) => k.startsWith('v3|')));
const villes = new Map();
for (const d of data.destinations) {
  if (villes.has(d.city_code)) continue;
  villes.set(d.city_code, { code: d.city_code, iso: d.country_code, centre: cache.centres?.[d.city_code] || { lat: d.lat, lng: d.lon } });
}

// Stades que la recherche automatique place mal (homonymes, noms trop différents) : position vérifiée à la main,
// seulement pour les destinations du site. À compléter ici si un grand stade manque (nom exact de fixturedownload.com).
const POSITIONS = {
  'Arsenal Stadium': [51.5549, -0.1084], 'Emirates Stadium': [51.5549, -0.1084], 'Stamford Bridge': [51.4817, -0.1910],
  'Stadio San Siro': [45.4781, 9.1240], 'Giuseppe Meazza': [45.4781, 9.1240],
  'Stade Vélodrome': [43.2698, 5.3959], 'Olimpico': [41.9340, 12.4547], 'Stadio Olimpico': [41.9340, 12.4547],
  'Pier Luigi Penzo': [45.4393, 12.3636], 'An der Alten Försterei': [52.4573, 13.5685],
  'Johan Cruyff Arena': [52.3142, 4.9419], 'Estadio Metropolitano': [40.4362, -3.5995], 'Riyadh Air Metropolitano': [40.4362, -3.5995],
  'La Cartuja de Sevilla': [37.4140, -6.0050], 'AEK Arena': [38.0319, 23.7870],
  'Olympic Athletic Center of Athens "Spyros Louis"': [38.0361, 23.7875],
  'Besiktas Stadium': [41.0391, 28.9948], 'Besiktas Park': [41.0391, 28.9948], 'Tüpraş Stadyumu': [41.0391, 28.9948],
  'Camp de Mestalla': [39.4747, -0.3583], 'Stade Charléty': [48.8206, 2.3463],
  'Giulesti Stadium': [44.4530, 26.0520], 'Republican Stadium after Vazgen Sargsyan': [40.1750, 44.5300],
};
const POSITIONS_SIMPLES = new Map(Object.entries(POSITIONS).map(([k, v]) => [k.trim().toLowerCase(), [{ lat: v[0], lng: v[1] }]]));

// Position d'un stade dans OpenStreetMap, gardée d'une fois sur l'autre. Deux recherches : le nom du stade et le nom du
// club (« Olympique de Marseille stadium » → Orange Vélodrome), car le nom du stade seul tombe parfois sur un homonyme
// (« Olimpico » → Turin). Si elles ne se rejoignent pas, le résultat trouvé par le club l'emporte.
// Un pays sans résultat est retenté sans filtre (Monaco n'est pas en France).
const VUE = ['stadium', 'sports_centre', 'pitch', 'track'];
async function demander(q, pays) {
  for (let essai = 1; essai <= 4; essai++) {
    await sleep(1100 * essai * essai); // règle de Nominatim : 1 demande par seconde au plus ; on ralentit si elle refuse
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=8${pays ? `&countrycodes=${pays}` : ''}&q=${encodeURIComponent(q)}`,
        { headers: { 'User-Agent': FETCH_UA } });
      if (r.status !== 200) throw new Error(`Nominatim ${r.status}`);
      return (await r.json()).filter((x) => ['leisure', 'building', 'amenity'].includes(x.class));
    } catch (e) {
      if (essai === 4) console.log(`  stade ${q} : ${e.message}`);
    }
  }
  return null;
}
async function premierStade(q, pays) {
  for (const p of pays ? [pays, ''] : ['']) {
    const res = await demander(q, p);
    if (!res) return undefined; // Nominatim ne répond pas
    const x = res.find((r) => r.type === 'stadium');
    if (x) return { lat: +(+x.lat).toFixed(5), lng: +(+x.lon).toFixed(5) };
  }
  return null;
}
async function candidats(lieu, pays, equipe) {
  if (POSITIONS_SIMPLES.has(lieu.trim().toLowerCase())) return POSITIONS_SIMPLES.get(lieu.trim().toLowerCase());
  const cle = `v3|${lieu}|${pays}`;
  if (stadesFd[cle]) return stadesFd[cle];
  const parNom = await premierStade(lieu, pays);
  const parClub = await premierStade(`${equipe} stadium`, pays);
  if (parNom === undefined || parClub === undefined) return []; // rien n'est gardé : on réessaiera au prochain lancement
  let choix = parClub && (!parNom || km(parNom, parClub) > 3) ? parClub : parNom || parClub;
  if (!choix) { // dernier recours : un terrain ou une salle de sport au nom du stade
    const x = (await demander(lieu, pays))?.find((r) => VUE.includes(r.type));
    if (x) choix = { lat: +(+x.lat).toFixed(5), lng: +(+x.lon).toFixed(5) };
  }
  stadesFd[cle] = choix ? [choix] : [];
  return stadesFd[cle];
}

// Ville dont le centre est à moins de RAYON_KM d'un des candidats ; le plus proche l'emporte.
function villeProche(liste) {
  let meilleur = null;
  for (const c of liste) for (const v of villes.values()) {
    const d = km(v.centre, c);
    if (d <= RAYON_KM && (!meilleur || d < meilleur.d)) meilleur = { v, c, d };
  }
  return meilleur;
}

// Anciens matchs (tous sports) : on garde ceux des compétitions que cette source ne couvre pas.
const remplacees = new Set(Object.values(SLUGS).map((s) => s.competition));
const gardes = {};
let anciensCouverts = 0;
const maintenant = new Date().toISOString();
for (const f of readdirSync('matchs')) {
  if (!f.endsWith('.json')) continue;
  const code = f.replace('.json', '');
  for (const m of JSON.parse(readFileSync(`matchs/${f}`, 'utf8')).matchs || []) {
    if (m.sport === 'football' && remplacees.has(m.competition)) { if (m.debut > maintenant) anciensCouverts++; continue; }
    (gardes[code] ||= []).push(m);
  }
}

// Nouveaux matchs.
const limite = new Date(Date.now() + HORIZON_JOURS * 86400000).toISOString();
const nouveaux = {};
const manques = new Set();
let lus = 0, cours = 0;
for (const [slug, s] of Object.entries(SLUGS)) {
  let liste;
  try {
    const r = await fetch(`https://fixturedownload.com/feed/json/${slug}`, { headers: { 'User-Agent': FETCH_UA } });
    if (r.status !== 200) throw new Error(`erreur ${r.status}`);
    liste = await r.json();
  } catch (e) {
    console.log(`${slug} : ${e.message} (anciens matchs gardés)`);
    remplacees.delete(s.competition);
    continue;
  }
  cours++;
  const a_venir = liste.filter((m) => m.DateUtc.replace(' ', 'T') > maintenant && m.DateUtc.replace(' ', 'T') < limite
    && m.Location && m.Location !== 'TBA' && !RESERVE.test(m.HomeTeam) && !RESERVE.test(m.AwayTeam));
  lus += a_venir.length;
  const lieux = new Map(); // lieu → ville (ou null), une recherche par stade
  for (const m of a_venir) {
    if (!lieux.has(m.Location)) lieux.set(m.Location, villeProche(await candidats(m.Location, s.pays, m.HomeTeam)));
    const ici = lieux.get(m.Location);
    if (!ici) continue;
    const iso = new Date(m.DateUtc.replace(' ', 'T')).toISOString();
    (nouveaux[ici.v.code] ||= []).push({
      id: `fd-${slug}-${m.MatchNumber}`,
      sport: 'football',
      competition: s.competition,
      niveau: s.niveau,
      domicile: m.HomeTeam,
      exterieur: m.AwayTeam,
      debut: iso,
      ...local(iso, FUSEAUX_VILLES[ici.v.code] || FUSEAUX[ici.v.iso] || 'Europe/Paris'),
      stade: m.Location,
      lat: ici.c.lat,
      lng: ici.c.lng,
    });
  }
  console.log(`${s.competition} : ${a_venir.length} matchs à venir, ${[...lieux.values()].filter(Boolean).length}/${lieux.size} stades dans une destination`);
}

const total = Object.values(nouveaux).reduce((n, l) => n + l.length, 0);
console.log(`${lus} matchs lus, ${total} dans une destination (avant : ${anciensCouverts} pour les mêmes compétitions)`);
if (!cours) throw new Error('fixturedownload.com ne répond pas : on garde les anciens fichiers.');
if (total < anciensCouverts / 2) throw new Error('Trop peu de matchs trouvés par rapport à avant : on garde les anciens fichiers.');

// Écriture : un fichier par ville, anciens matchs gardés + nouveaux, triés par date.
const codes = new Set([...Object.keys(gardes), ...Object.keys(nouveaux)]);
mkdirSync('matchs', { recursive: true });
for (const f of readdirSync('matchs')) if (f.endsWith('.json')) rmSync(`matchs/${f}`);
for (const code of codes) {
  const tous = [...(gardes[code] || []), ...(nouveaux[code] || [])].sort((a, b) => a.debut.localeCompare(b.debut));
  if (!tous.length) continue;
  writeFileSync(`matchs/${code}.json`, JSON.stringify({ updated_at: maintenant, source: 'SofaScore, fixturedownload.com', matchs: tous }) + '\n');
}
writeFileSync('matchs-cache.json', JSON.stringify({ ...cache, stades_fd: stadesFd }) + '\n');
