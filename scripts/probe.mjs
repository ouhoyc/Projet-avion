// Test ponctuel : forme des réponses « prix par jour » (à supprimer ensuite).
const token = process.env.TRAVELPAYOUTS_TOKEN;
const base = 'https://api.travelpayouts.com/aviasales/v3/grouped_prices';
async function call(params) {
  const t = Date.now();
  const res = await fetch(`${base}?${new URLSearchParams({ currency: 'eur', market: 'fr', direct: 'true', group_by: 'departure_at', ...params })}`, { headers: { 'X-Access-Token': token } });
  const text = await res.text();
  console.log(JSON.stringify(params), res.status, `${Date.now() - t}ms`, [...res.headers].filter(([k]) => /limit|retry/i.test(k)));
  try { const j = JSON.parse(text); const days = Object.keys(j.data || {}); console.log('  days:', days.length, days.slice(0, 5)); console.log('  sample:', JSON.stringify(j.data?.[days[0]])); } catch { console.log(text.slice(0, 300)); }
}
await call({ origin: 'LYS', destination: 'LGW', departure_at: '2026-11' });
await call({ origin: 'LGW', destination: 'LYS', departure_at: '2026-11' });
await call({ origin: 'LYS', destination: 'LIS', departure_at: '2026-11' });
await call({ origin: 'LIS', destination: 'LYS', departure_at: '2026-11' });
await call({ origin: 'LYS', destination: 'LON', departure_at: '2026-11' });
await call({ origin: 'LYS', destination: 'BCN', departure_at: '2027-06' });
// rafale pour voir les limites
const t = Date.now(); let codes = {};
await Promise.all(Array.from({ length: 30 }, async () => { const r = await fetch(`${base}?origin=LYS&destination=BCN&departure_at=2026-12&direct=true&currency=eur`, { headers: { 'X-Access-Token': token } }); codes[r.status] = (codes[r.status] || 0) + 1; }));
console.log('burst 30:', codes, `${Date.now() - t}ms`);
