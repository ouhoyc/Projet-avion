// Vérification du prix EN DIRECT d'un vol direct, appelée par le site quand un
// visiteur ouvre une destination (fonction serverless Vercel).
//
//   GET /api/prix?to=LGW&date=2026-10-31
//
// La clé du fournisseur de prix (Ignav) reste ici, côté serveur : elle est lue
// dans la variable d'environnement IGNAV_API_KEY et n'est jamais envoyée au navigateur.
// Les réponses sont mises en cache 30 min par Vercel : si plusieurs visiteurs
// ouvrent la même destination, une seule recherche est payée.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const IGNAV_URL = 'https://ignav.com/api/fares/one-way';
const CACHE_OK = 'public, s-maxage=1800, stale-while-revalidate=600'; // 30 min
const CACHE_ERR = 'public, s-maxage=60';

// Sites autorisés à appeler cette fonction (le site Vercel lui-même et GitHub Pages).
const ALLOWED_ORIGINS = [/^https:\/\/[a-z0-9-]+\.vercel\.app$/, /^https:\/\/ouhoyc\.github\.io$/, /^http:\/\/localhost(:\d+)?$/];

let destinations = null;
function knownData() {
  if (!destinations) {
    const data = JSON.parse(readFileSync(join(process.cwd(), 'data.json'), 'utf8'));
    destinations = { origin: data.origin.code, codes: new Set(data.destinations.map((d) => d.code)) };
  }
  return destinations;
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.some((re) => re.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  if (req.method !== 'GET') return send(res, 405, { error: 'method' }, CACHE_ERR);

  // Contrôles stricts : seulement les destinations du site et une date dans l'année
  // à venir (évite qu'on utilise la fonction — et ton crédit — pour autre chose).
  const { origin: from, codes } = knownData();
  const to = String(req.query.to || '').toUpperCase();
  const date = String(req.query.date || '');
  if (!codes.has(to)) return send(res, 400, { error: 'destination' }, CACHE_ERR);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return send(res, 400, { error: 'date' }, CACHE_ERR);
  const today = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
  if (date < today || date > maxDate) return send(res, 400, { error: 'date' }, CACHE_ERR);

  const key = process.env.IGNAV_API_KEY;
  if (!key) return send(res, 503, { error: 'not_configured' }, CACHE_ERR);

  try {
    const response = await fetch(IGNAV_URL, {
      method: 'POST',
      headers: { 'X-Api-Key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: from,
        destination: to,
        departure_date: date,
        adults: 1,
        max_stops: 0,     // vols directs uniquement
        market: 'FR',     // prix du marché français, en euros
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.error('Ignav', response.status, (await response.text()).slice(0, 300));
      return send(res, 502, { error: 'provider' }, CACHE_ERR);
    }
    const json = await response.json();
    const best = cheapest(json.itineraries || []);
    if (!best) return send(res, 200, { status: 'none', checked_at: new Date().toISOString() }, CACHE_OK);

    const seg = best.outbound?.segments?.[0] || {};
    return send(res, 200, {
      status: 'ok',
      price: best.price.amount,
      currency: best.price.currency,
      airline: seg.operating_carrier_name || best.outbound?.carrier || null,
      flight: seg.marketing_carrier_code && seg.flight_number ? `${seg.marketing_carrier_code}${seg.flight_number}` : null,
      departure: seg.departure_time_local || seg.departure_local || seg.departure_local_time || null,
      duration: best.outbound?.duration_minutes || null,
      checked_at: json.observed_at || new Date().toISOString(),
    }, CACHE_OK);
  } catch (err) {
    console.error('Ignav', err);
    return send(res, 502, { error: 'provider' }, CACHE_ERR);
  }
}

// Le moins cher parmi les itinéraires directs proposés.
function cheapest(itineraries) {
  return itineraries
    .filter((it) => typeof it?.price?.amount === 'number' && (it.outbound?.segments?.length ?? 1) === 1)
    .sort((a, b) => a.price.amount - b.price.amount)[0];
}

function send(res, status, body, cache) {
  res.setHeader('Cache-Control', cache);
  res.status(status).json(body);
}
