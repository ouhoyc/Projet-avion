// Calendrier des matchs (foot, basket, rugby) joués dans chaque destination, pour l'étape
// « Activités » des pages guides. Lancé par la GitHub Action .github/workflows/update-matchs.yml,
// qui publie matchs/CODE.json (comme data.json pour les prix).
//
// Source : l'interface publique de SofaScore (gratuite, sans clé, tous pays et tous sports).
// Méthode : pour chaque pays desservi, on prend les principaux championnats (et les coupes
// d'Europe), on lit les matchs à venir et on garde ceux dont le stade est à moins de RAYON_KM
// du centre d'une destination. Les centres des villes viennent d'OpenStreetMap (Nominatim).
// Sortie : matchs/CODE.json (un petit fichier par ville, lu par la page guide) et
// matchs-cache.json (centres, noms des villes, stades des clubs : cherchés une seule fois).

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

// Plusieurs adresses de la même interface : on garde la première qui répond depuis la machine.
const BASES = ['https://api.sofascore.com/api/v1', 'https://www.sofascore.com/api/v1', 'https://api.sofascore.app/api/v1'];
let API = BASES[0];
let PROXY = ''; // proxy Apify si SofaScore bloque la machine (serveurs de GitHub)
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const RAYON_KM = 25;
const HORIZON_JOURS = 365;
const PAUSE_MS = 300;

// Pays du site (codes ISO) → catégories SofaScore (le Royaume-Uni est découpé en 4).
const CATEGORIES_PAYS = { GB: ['EN', 'SX', 'WA', 'NI'] };
// Combien de compétitions garder par pays, dans l'ordre d'importance de SofaScore.
const SPORTS = {
  football: { championnats: 2, coupe: true },
  basketball: { championnats: 1, coupe: false },
};
// Compétitions internationales de clubs (catégories « Europe », « International »).
const INTERNATIONAL = { football: ['Europe'], basketball: ['International', 'Europe'] };
// Rugby : tout est rangé dans une catégorie mondiale, d'où une liste fixe (id SofaScore → niveau).
const RUGBY = { 423: 1, 424: 1, 420: 1, 401: 1, 419: 1, 752: 2, 1147: 2, 566: 2, 1357: 2 };
const EXCLUS = /women|féminin|feminin|u\d\d|youth|junior|reserve|amateur|qualif/i;
const COUPE = /cup|copa|coupe|coppa|pokal|puchar|taça|taca|beker|kupa|cupa/i;

// Fuseau horaire de chaque pays (heure locale des matchs) ; quelques villes à part.
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

// Cherche un chemin qui marche : adresse directe, sinon proxy Apify (clé APIFY_TOKEN, secret GitHub).
async function choisirAcces() {
  const essai = async () => {
    try {
      const { stdout } = await run('curl', ['-sS', '--fail-with-body', '--compressed', '-m', '30', '-A', UA, '-H', 'Accept: application/json',
        ...(PROXY ? ['--proxy', PROXY] : []), `${API}/sport/football/categories`], { maxBuffer: 20 * 1024 * 1024 });
      return (JSON.parse(stdout).categories || []).length > 50; // de vraies données, pas une page vide
    } catch (e) {
      console.log(`  essai ${API}${PROXY ? ` (proxy ${PROXY.split(':')[1].slice(2)})` : ''} : ${String(e.stderr || e.message).slice(0, 160).replace(/:[^:@]*@proxy/, ':***@proxy')}`);
      return false;
    }
  };
  const proxies = [''];
  if (process.env.APIFY_TOKEN) {
    try {
      const me = await (await fetch('https://api.apify.com/v2/users/me', { headers: { Authorization: `Bearer ${process.env.APIFY_TOKEN}` } })).json();
      const mdp = me?.data?.proxy?.password;
      console.log(mdp ? 'Proxy Apify disponible.' : 'Proxy Apify indisponible pour ce compte.');
      if (mdp) proxies.push(`http://auto:${mdp}@proxy.apify.com:8000`, `http://groups-RESIDENTIAL:${mdp}@proxy.apify.com:8000`);
    } catch (e) {
      console.log(`Apify : ${e.message}`);
    }
  }
  for (const p of proxies) {
    for (const b of BASES) {
      PROXY = p; API = b;
      if (await essai()) {
        console.log(`Accès SofaScore : ${b}${p ? ` via le proxy Apify (${p.split(':')[1].slice(2)})` : ' en direct'}`);
        return true;
      }
    }
  }
  return false;
}

const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
async function api(path) {
  for (let i = 0; i < 3; i++) {
    await sleep(PAUSE_MS);
    try {
      // Par curl : la protection anti-robots de SofaScore refuse le fetch de Node (erreur 403).
      const { stdout } = await run('curl', ['-s', '--compressed', '-m', '30', '-A', UA, '-H', 'Accept: application/json',
        ...(PROXY ? ['--proxy', PROXY] : []), '-w', '\n%{http_code}', `${API}/${path}`], { maxBuffer: 50 * 1024 * 1024 });
      const cut = stdout.lastIndexOf('\n');
      const status = Number(stdout.slice(cut + 1));
      if (status === 404) return null;
      if (status === 200) return JSON.parse(stdout.slice(0, cut));
      console.log(`  ${path} : ${status}`);
    } catch (e) {
      console.log(`  ${path} : ${e.message}`);
    }
    await sleep(2000 * (i + 1));
  }
  return null;
}

// Nom de ville comparable : minuscules, sans accents ni ponctuation (« Kraków » → « krakow »).
const simple = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').toLowerCase().replace(/[^a-z]/g, '');

function km(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

// Destinations : villes de data.json, avec leur centre (OpenStreetMap, gardé d'une fois sur l'autre).
const data = JSON.parse(readFileSync('data.json', 'utf8'));
const ancien = existsSync('matchs-cache.json') ? JSON.parse(readFileSync('matchs-cache.json', 'utf8')) : {};
const centres = ancien.centres || {};
const noms = ancien.noms || {};     // noms de chaque ville dans toutes les langues (OpenStreetMap)
const stades = ancien.stades || {}; // stade de chaque club qui reçoit (fiche du club SofaScore)
// Villes mal orthographiées dans data.json pour OpenStreetMap.
const RECHERCHE = { EDI: 'Édimbourg, Royaume-Uni' };
const villes = new Map();
for (const d of data.destinations) {
  if (!villes.has(d.city_code)) villes.set(d.city_code, { code: d.city_code, nom: d.city, pays: d.country, iso: d.country_code, aeroport: { lat: d.lat, lng: d.lon } });
}
for (const v of villes.values()) {
  if (!centres[v.code] || !noms[v.code]) {
    await sleep(1100); // règle de Nominatim : 1 demande par seconde au plus
    try {
      const q = RECHERCHE[v.code] || `${v.nom}, ${v.pays}`;
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&namedetails=1&accept-language=fr&q=${encodeURIComponent(q)}`,
        { headers: { 'User-Agent': 'ProjetAvion/1.0 (site de voyage, calendrier des matchs)' } });
      const [p] = await r.json();
      if (p) {
        centres[v.code] = { lat: +(+p.lat).toFixed(4), lng: +(+p.lon).toFixed(4) };
        const tous = Object.values(p.namedetails || {}).flatMap((n) => n.split(';'));
        noms[v.code] = [...new Set([v.nom, ...tous].map(simple).filter((n) => n.length > 2))];
      }
      console.log(`centre ${v.code} ${v.nom} :`, centres[v.code] || 'introuvable');
    } catch (e) {
      console.log(`centre ${v.code} : ${e.message}`);
    }
  }
  // Ville introuvable : on prend l'aéroport (souvent à 10-20 km du centre).
  v.centre = centres[v.code] || v.aeroport;
  v.noms = new Set(noms[v.code] || [simple(v.nom)]);
}
writeFileSync('matchs-cache.json', JSON.stringify({ ...ancien, centres, noms }) + '\n'); // gardés même si la suite échoue
if (!(await choisirAcces())) throw new Error('SofaScore refuse toutes les demandes depuis cette machine.');
const isos = new Set([...villes.values()].map((v) => v.iso));
const alpha2 = new Set([...isos].flatMap((iso) => CATEGORIES_PAYS[iso] || [iso]));

// Compétitions à suivre.
const tournois = new Map(); // id → { sport, nom, niveau }
for (const [sport, regle] of Object.entries(SPORTS)) {
  const cats = (await api(`sport/${sport}/categories`))?.categories || [];
  for (const c of cats) {
    const inter = INTERNATIONAL[sport].includes(c.name);
    if (!inter && !alpha2.has(c.alpha2)) continue;
    if (/amateur/i.test(c.name)) continue;
    const groupes = (await api(`category/${c.id}/unique-tournaments`))?.groups || [];
    const liste = groupes.flatMap((g) => g.uniqueTournaments || []).filter((u) => !EXCLUS.test(u.name));
    // Niveau 1 = le plus important (1re division, Ligue des champions…), 2 = le reste.
    const garder = inter ? liste.slice(0, 3).map((u, i) => [u, i === 0 ? 1 : 2]) : [
      ...liste.filter((u) => !COUPE.test(u.name)).slice(0, regle.championnats).map((u, i) => [u, i === 0 ? 1 : 2]),
      ...(regle.coupe ? liste.filter((u) => COUPE.test(u.name) && !/super/i.test(u.name)).slice(0, 1).map((u) => [u, 2]) : []),
    ];
    for (const [u, niveau] of garder) tournois.set(u.id, { sport, nom: u.name, niveau });
  }
}
for (const [id, niveau] of Object.entries(RUGBY)) tournois.set(Number(id), { sport: 'rugby', nom: '', niveau });
console.log(`${tournois.size} compétitions suivies`);

// Matchs à venir, gardés si le stade est près d'une destination.
const limite = Date.now() / 1000 + HORIZON_JOURS * 86400;
const parVille = {};
let vus = 0;
for (const [id, t] of tournois) {
  const saison = (await api(`unique-tournament/${id}/seasons`))?.seasons?.[0];
  if (!saison) continue;
  for (let page = 0; page < 15; page++) {
    const res = await api(`unique-tournament/${id}/season/${saison.id}/events/next/${page}`);
    const evts = res?.events || [];
    for (const e of evts) {
      vus++;
      if (e.startTimestamp > limite) continue;
      // Où se joue le match : le stade du match, sinon celui du club qui reçoit (sa fiche),
      // sinon seulement le nom de la ville (souvent le cas au basket).
      let c = e.venue?.venueCoordinates;
      let ville = e.venue?.city?.name;
      let nomStade = e.venue?.stadium?.name || e.venue?.name;
      let pays = e.venue?.country?.alpha2;
      if (!c && e.homeTeam?.id) {
        if (!(e.homeTeam.id in stades)) {
          const v = (await api(`team/${e.homeTeam.id}`))?.team?.venue;
          stades[e.homeTeam.id] = v ? {
            ville: v.city?.name || '', stade: v.stadium?.name || v.name || '', pays: v.country?.alpha2 || '',
            ...(v.venueCoordinates ? { lat: v.venueCoordinates.latitude, lng: v.venueCoordinates.longitude } : {}),
          } : null;
        }
        const st = stades[e.homeTeam.id];
        if (st?.lat != null) c = { latitude: st.lat, longitude: st.lng };
        ville ||= st?.ville;
        nomStade ||= st?.stade;
        pays ||= st?.pays;
      }
      if (!c && !ville) continue;
      const stade = c ? { lat: c.latitude, lng: c.longitude } : null;
      for (const v of villes.values()) {
        // Sans coordonnées : même nom de ville et même pays (Valencia d'Espagne, pas du Venezuela).
        const ici = stade ? v.centre && km(v.centre, stade) <= RAYON_KM : v.noms.has(simple(ville)) && (!pays || pays === v.iso);
        if (!ici) continue;
        const pos = stade || v.centre;
        (parVille[v.code] ||= []).push({
          id: e.id,
          sport: t.sport,
          competition: (e.tournament?.uniqueTournament?.name || t.nom).trim(),
          niveau: t.niveau,
          domicile: e.homeTeam?.name,
          exterieur: e.awayTeam?.name,
          debut: new Date(e.startTimestamp * 1000).toISOString(),
          ...local(new Date(e.startTimestamp * 1000).toISOString(), FUSEAUX_VILLES[v.code] || FUSEAUX[v.iso] || 'Europe/Paris'),
          stade: nomStade || '',
          lat: +pos.lat.toFixed(5),
          lng: +pos.lng.toFixed(5),
        });
      }
    }
    if (!res?.hasNextPage || !evts.length || evts[evts.length - 1].startTimestamp > limite) break;
  }
}

for (const code of Object.keys(parVille)) {
  const uniques = new Map(parVille[code].map((m) => [m.id, m]));
  parVille[code] = [...uniques.values()].sort((a, b) => a.debut.localeCompare(b.debut));
}
const total = Object.values(parVille).reduce((s, l) => s + l.length, 0);
console.log(`${vus} matchs lus, ${total} dans ${Object.keys(parVille).length} destinations`);
if (!total) throw new Error('Aucun match trouvé : SofaScore ne répond peut-être plus, on garde l\'ancien fichier.');

mkdirSync('matchs', { recursive: true });
for (const f of readdirSync('matchs')) if (f.endsWith('.json')) rmSync(`matchs/${f}`);
const maj = new Date().toISOString();
for (const [code, liste] of Object.entries(parVille)) {
  writeFileSync(`matchs/${code}.json`, JSON.stringify({ updated_at: maj, source: 'SofaScore', matchs: liste }) + '\n');
}
writeFileSync('matchs-cache.json', JSON.stringify({ updated_at: maj, rayon_km: RAYON_KM, centres, noms, stades }) + '\n');
