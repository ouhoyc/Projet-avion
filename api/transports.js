// Transports en commun autour d'un point (fonction serverless Vercel), pour la fiche d'un
// hôtel : station de métro, train, tram et arrêt de bus les plus proches, à pied.
//
//   GET /api/transports?c=BCN&lat=41.3925&lng=2.1640
//
// Données OpenStreetMap, lues via Overpass (gratuit, sans clé). Réponses gardées 7 jours par
// Vercel : les stations ne bougent pas, et deux hôtels voisins partagent la même réponse.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const CACHE_OK = 'public, s-maxage=604800, stale-while-revalidate=86400'; // 7 jours
const CACHE_ERR = 'public, s-maxage=300';
const ALLOWED_ORIGINS = [/^https:\/\/[a-z0-9-]+\.vercel\.app$/, /^https:\/\/ouhoyc\.github\.io$/, /^http:\/\/localhost(:\d+)?$/];

// Zone autorisée par ville : autour de ses quartiers (comme api/hotels.js).
const zones = {};
function cityZone(code) {
  if (!(code in zones)) {
    try {
      const qs = JSON.parse(readFileSync(join(process.cwd(), 'guides', `${code}.json`), 'utf8')).quartiers || [];
      zones[code] = qs.length ? {
        minLat: Math.min(...qs.map((q) => q.lat)) - 0.08, maxLat: Math.max(...qs.map((q) => q.lat)) + 0.08,
        minLng: Math.min(...qs.map((q) => q.lng)) - 0.08, maxLng: Math.max(...qs.map((q) => q.lng)) + 0.08,
      } : null;
    } catch {
      zones[code] = null;
    }
  }
  return zones[code];
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.some((re) => re.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  if (req.method !== 'GET') return send(res, 405, { error: 'method' }, CACHE_ERR);
  const code = String(req.query.c || '').toUpperCase();
  const zone = /^[A-Z]{3}$/.test(code) ? cityZone(code) : null;
  // Arrondi à ~100 m : les hôtels voisins partagent la même réponse (et le même cache).
  const lat = Math.round(Number(req.query.lat) * 1000) / 1000;
  const lng = Math.round(Number(req.query.lng) * 1000) / 1000;
  if (!zone || !(lat >= zone.minLat && lat <= zone.maxLat && lng >= zone.minLng && lng <= zone.maxLng)) {
    return send(res, 400, { error: 'lieu' }, CACHE_ERR);
  }

  const q = `[out:json][timeout:20];(
    node(around:1200,${lat},${lng})[station=subway];
    node(around:1200,${lat},${lng})[railway=station];
    node(around:1200,${lat},${lng})[railway=tram_stop];
    node(around:500,${lat},${lng})[highway=bus_stop];
  );out body;`;
  let elements = null;
  for (const url of OVERPASS) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'ProjetAvion/1.0 (https://projet-avion-ouhoyc.vercel.app)' },
        body: `data=${encodeURIComponent(q)}`,
        signal: AbortSignal.timeout(12000),
      });
      if (!r.ok) continue;
      elements = (await r.json()).elements || [];
      break;
    } catch {
      // serveur suivant
    }
  }
  if (!elements) return send(res, 502, { error: 'provider' }, CACHE_ERR);

  const here = { lat, lng };
  const items = elements.map((e) => {
    const t = e.tags || {};
    const kind = t.highway === 'bus_stop' ? 'bus'
      : t.railway === 'tram_stop' || t.tram === 'yes' ? 'tram'
        : t.station === 'subway' || t.subway === 'yes' ? 'metro' : 'train';
    const lines = String(t.route_ref || t.line || t['route_ref:metro'] || '').split(/[;,]/).map((x) => x.trim()).filter(Boolean).slice(0, 6);
    const m = Math.round(meters(here, { lat: e.lat, lng: e.lon }));
    return { kind, name: t.name || null, lines, m, min: walkMin(m) };
  }).filter((x) => x.name || x.kind === 'bus');

  // Le plus proche de chaque sorte (une station a souvent plusieurs points : on garde le plus près).
  const best = {};
  for (const it of items.sort((a, b) => a.m - b.m)) if (!best[it.kind]) best[it.kind] = it;
  const busStops = items.filter((x) => x.kind === 'bus' && x.m <= 400).length;
  return send(res, 200, { status: 'ok', metro: best.metro || null, train: best.train || null, tram: best.tram || null, bus: best.bus || null, busStops }, CACHE_OK);
}

function meters(a, b) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Minutes à pied : distance à vol d'oiseau + 30 % (les rues ne sont pas droites), 80 m par minute.
function walkMin(m) {
  return Math.max(1, Math.round((m * 1.3) / 80));
}

function send(res, status, body, cache) {
  res.setHeader('Cache-Control', cache);
  res.status(status).json(body);
}
