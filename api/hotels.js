// Hôtels avec leur prix EN DIRECT autour d'un point (fonction serverless Vercel), pour la
// partie « Où dormir ? » des pages guides.
//
//   GET /api/hotels?c=BCN&lat=41.39&lng=2.16&r=4000&in=2026-11-27&out=2026-11-30&adults=2&children=8,4&gamme=confort
//
// r = rayon de recherche en mètres (500 à 6000, 1500 par défaut) : toute la ville d'un coup.
//
// La clé du fournisseur (LiteAPI) reste ici, côté serveur : elle est lue dans la variable
// d'environnement LITEAPI_KEY et n'est jamais envoyée au navigateur. Réponses gardées
// 30 min par Vercel : plusieurs visiteurs avec la même recherche = une seule demande.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const LITEAPI_URL = 'https://api.liteapi.travel/v3.0/hotels/rates';
const CACHE_OK = 'public, s-maxage=1800, stale-while-revalidate=600'; // 30 min
const CACHE_ERR = 'public, s-maxage=60';
const ALLOWED_ORIGINS = [/^https:\/\/[a-z0-9-]+\.vercel\.app$/, /^https:\/\/ouhoyc\.github\.io$/, /^http:\/\/localhost(:\d+)?$/];

// Gammes du site → étoiles demandées.
const STARS = { dormir: [1, 2], confort: [3], haut: [4], luxe: [5] };

// Zone autorisée par ville : autour de ses quartiers (évite qu'on utilise la fonction ailleurs).
const zones = {};
function cityZone(code) {
  if (!(code in zones)) {
    try {
      const g = JSON.parse(readFileSync(join(process.cwd(), 'guides', `${code}.json`), 'utf8'));
      const qs = g.quartiers || [];
      zones[code] = qs.length ? {
        minLat: Math.min(...qs.map((q) => q.lat)) - 0.05, maxLat: Math.max(...qs.map((q) => q.lat)) + 0.05,
        minLng: Math.min(...qs.map((q) => q.lng)) - 0.05, maxLng: Math.max(...qs.map((q) => q.lng)) + 0.05,
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

  // Contrôles stricts sur tout ce qui est demandé.
  const code = String(req.query.c || '').toUpperCase();
  const zone = /^[A-Z]{3}$/.test(code) ? cityZone(code) : null;
  const lat = Number(req.query.lat), lng = Number(req.query.lng);
  if (!zone || !(lat >= zone.minLat && lat <= zone.maxLat && lng >= zone.minLng && lng <= zone.maxLng)) {
    return send(res, 400, { error: 'lieu' }, CACHE_ERR);
  }
  const checkin = String(req.query.in || ''), checkout = String(req.query.out || '');
  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
  const nights = (new Date(checkout) - new Date(checkin)) / 86400000;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkin) || !/^\d{4}-\d{2}-\d{2}$/.test(checkout)
    || checkin < today || checkout > maxDate || !(nights >= 1 && nights <= 30)) {
    return send(res, 400, { error: 'dates' }, CACHE_ERR);
  }
  const adults = Number(req.query.adults);
  const children = String(req.query.children || '').split(',').filter((x) => x !== '').map(Number);
  if (!(Number.isInteger(adults) && adults >= 1 && adults <= 9) || children.length > 8
    || children.some((a) => !(Number.isInteger(a) && a >= 0 && a <= 17))) {
    return send(res, 400, { error: 'voyageurs' }, CACHE_ERR);
  }
  const radius = req.query.r == null ? 1500 : Math.round(Number(req.query.r));
  if (!(radius >= 500 && radius <= 6000)) return send(res, 400, { error: 'rayon' }, CACHE_ERR);
  const stars = STARS[String(req.query.gamme || 'confort')];
  if (!stars) return send(res, 400, { error: 'gamme' }, CACHE_ERR);

  const key = process.env.LITEAPI_KEY;
  if (!key) return send(res, 503, { error: 'not_configured' }, CACHE_ERR);

  try {
    const response = await fetch(LITEAPI_URL, {
      method: 'POST',
      headers: { 'X-API-Key': key, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        latitude: Math.round(lat * 1e4) / 1e4,
        longitude: Math.round(lng * 1e4) / 1e4,
        radius,
        checkin, checkout,
        occupancies: [{ adults, children }],
        currency: 'EUR',
        guestNationality: 'FR',
        starRating: stars,
        maxRatesPerHotel: 1,
        limit: radius > 2000 ? 200 : 60,
        timeout: 8,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.error('LiteAPI', response.status, (await response.text()).slice(0, 300));
      return send(res, 502, { error: 'provider' }, CACHE_ERR);
    }
    const json = await response.json();
    const info = new Map((json.hotels || []).map((h) => [h.id, h]));
    const hotels = [];
    for (const r of json.data || []) {
      const h = info.get(r.hotelId);
      const total = cheapest(r);
      if (!h || total == null || h.latitude == null) continue;
      hotels.push({
        id: r.hotelId,
        name: h.name,
        lat: h.latitude,
        lng: h.longitude,
        stars: h.stars ?? null,
        rating: h.rating ?? null,
        reviews: h.review_count ?? null,
        photo: h.thumbnail || h.main_photo || null,
        address: h.address || null,
        total: Math.round(total),
      });
    }
    hotels.sort((a, b) => a.total - b.total);
    return send(res, 200, { status: 'ok', nights, hotels, checked_at: new Date().toISOString() }, CACHE_OK);
  } catch (err) {
    console.error('LiteAPI', err?.message);
    return send(res, 502, { error: 'provider' }, CACHE_ERR);
  }
}

// Prix total le moins cher proposé pour un hôtel (toutes chambres confondues).
function cheapest(r) {
  let best = null;
  for (const room of r.roomTypes || []) {
    const offer = room.offerRetailRate?.amount;
    const rate = room.rates?.[0]?.retailRate?.total?.[0]?.amount;
    for (const v of [offer, rate]) if (typeof v === 'number' && (best == null || v < best)) best = v;
  }
  return best;
}

function send(res, status, body, cache) {
  res.setHeader('Cache-Control', cache);
  res.status(status).json(body);
}
