// Transports en commun autour d'un point (fonction serverless Vercel), pour la fiche d'un
// hôtel : station de métro, train, tram et arrêt de bus les plus proches, à pied.
//
//   GET /api/transports?c=BCN&lat=41.3925&lng=2.1640
//
// Les stations viennent des « tuiles » du fond de carte du site (OpenFreeMap, données
// OpenStreetMap) : gratuit, sans clé, et toujours disponible puisque la carte en dépend.
// Réponses gardées 7 jours par Vercel : les stations ne bougent pas.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';

const TILEJSON = 'https://tiles.openfreemap.org/planet';
const Z = 14; // zoom le plus détaillé des tuiles : tous les arrêts y sont
const RADIUS = 1200; // mètres
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

let tileUrl = null;
async function tileTemplate() {
  if (!tileUrl) {
    const r = await fetch(TILEJSON, { signal: AbortSignal.timeout(8000) });
    tileUrl = (await r.json()).tiles[0];
  }
  return tileUrl;
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
  const lat = Math.round(Number(req.query.lat) * 1e4) / 1e4;
  const lng = Math.round(Number(req.query.lng) * 1e4) / 1e4;
  if (!zone || !(lat >= zone.minLat && lat <= zone.maxLat && lng >= zone.minLng && lng <= zone.maxLng)) {
    return send(res, 400, { error: 'lieu' }, CACHE_ERR);
  }

  try {
    const tpl = await tileTemplate();
    // Les tuiles qui couvrent un carré de ±RADIUS autour du point (1 à 4 tuiles).
    const dLat = RADIUS / 111320, dLng = RADIUS / (111320 * Math.cos(lat * Math.PI / 180));
    const [x0, y1] = tileXY(lat - dLat, lng - dLng), [x1, y0] = tileXY(lat + dLat, lng + dLng);
    const jobs = [];
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) jobs.push(readTile(tpl, x, y));
    const features = (await Promise.all(jobs)).flat();

    const here = { lat, lng };
    const items = [];
    for (const f of features) {
      const kind = kindOf(f.props);
      if (!kind) continue;
      const m = Math.round(meters(here, f));
      if (m > RADIUS) continue;
      const name = (f.props['name:latin'] || f.props.name || '').replace(/^Barcelona-/, '') || null;
      items.push({ kind, name, lines: [], m, min: walkMin(m) });
    }
    items.sort((a, b) => a.m - b.m);
    // Une même station est souvent enregistrée deux fois (métro + gare) : si une « gare » ou un
    // « tram » porte le nom d'une station de métro, on ne garde que le métro.
    const base = (n) => String(n || '').toLowerCase().replace(/^barcelona-|^estació d[e']\s*/g, '').replace(/[^a-zà-ü]/g, '');
    const metroNames = new Set(items.filter((x) => x.kind === 'metro').map((x) => base(x.name)));
    for (const it of items) if ((it.kind === 'train' || it.kind === 'tram') && metroNames.has(base(it.name))) it.kind = 'dup';
    const best = {};
    for (const it of items) if (!best[it.kind] && (it.name || it.kind === 'bus')) best[it.kind] = it;
    const busStops = items.filter((x) => x.kind === 'bus' && x.m <= 400).length;
    return send(res, 200, { status: 'ok', metro: best.metro || null, train: best.train || null, tram: best.tram || null, bus: best.bus || null, busStops }, CACHE_OK);
  } catch (err) {
    console.error('transports', err?.message);
    return send(res, 502, { error: 'provider' }, CACHE_ERR);
  }
}

// Sorte d'arrêt d'après les étiquettes OpenMapTiles (couche « poi »).
function kindOf(p) {
  const cls = p.class, sub = p.subclass;
  if (cls === 'bus' || sub === 'bus_stop' || sub === 'bus_station') return 'bus';
  if (sub === 'tram_stop') return 'tram';
  if (sub === 'subway') return 'metro';
  if (cls === 'railway' && (sub === 'station' || sub === 'halt')) return 'train';
  return null;
}

function tileXY(lat, lng) {
  const n = 2 ** Z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const r = lat * Math.PI / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n);
  return [x, y];
}

async function readTile(tpl, x, y) {
  const url = tpl.replace('{z}', Z).replace('{x}', x).replace('{y}', y);
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`tuile ${r.status}`);
  const tile = new VectorTile(new Pbf(new Uint8Array(await r.arrayBuffer())));
  const layer = tile.layers.poi;
  const out = [];
  if (!layer) return out;
  for (let i = 0; i < layer.length; i++) {
    const f = layer.feature(i);
    if (f.type !== 1) continue; // points seulement
    const g = f.toGeoJSON(x, y, Z).geometry;
    const [lngF, latF] = g.type === 'Point' ? g.coordinates : g.coordinates[0];
    out.push({ lat: latF, lng: lngF, props: f.properties });
  }
  return out;
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
