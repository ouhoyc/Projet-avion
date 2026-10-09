// Diagnostic : compare plusieurs façons d'interroger Travelpayouts pour voir laquelle
// donne le plus de jours avec un prix en vol direct, mois par mois.
// Lancé à la main depuis GitHub (onglet Actions → « Diagnostic des sources de prix »).
// N'affiche que des nombres, jamais le jeton.

const TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
if (!TOKEN) { console.error('TRAVELPAYOUTS_TOKEN manquant'); process.exit(1); }

const ORIGIN = 'LYS';
const ROUTES = ['BCN', 'LIS', 'LGW', 'TIA', 'AGP', 'NAP'];
const MONTHS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + i);
  return d.toISOString().slice(0, 7);
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path, params) {
  const url = `https://api.travelpayouts.com/${path}?${new URLSearchParams(params)}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { 'X-Access-Token': TOKEN, 'Accept-Encoding': 'gzip' } });
    await sleep(400);
    if (res.status === 429) { await sleep(10000); continue; }
    if (!res.ok) return { error: res.status };
    return res.json();
  }
  return { error: 429 };
}

// Chaque variante renvoie l'ensemble des jours (YYYY-MM-DD) ayant un prix direct ce mois-là.
const VARIANTS = {
  'grouped fr (actuel)': async (from, to, month) => {
    const j = await get('aviasales/v3/grouped_prices', { origin: from, destination: to, departure_at: month, group_by: 'departure_at', direct: 'true', currency: 'eur', market: 'fr' });
    return Object.keys(j.data || {});
  },
  'grouped sans market': async (from, to, month) => {
    const j = await get('aviasales/v3/grouped_prices', { origin: from, destination: to, departure_at: month, group_by: 'departure_at', direct: 'true', currency: 'eur' });
    return Object.keys(j.data || {});
  },
  'prices_for_dates x1000': async (from, to, month) => {
    const j = await get('aviasales/v3/prices_for_dates', { origin: from, destination: to, departure_at: month, direct: 'true', one_way: 'true', unique: 'false', sorting: 'price', limit: '1000', currency: 'eur' });
    return (j.data || []).map((t) => (t.departure_at || '').slice(0, 10));
  },
  'month-matrix tous': async (from, to, month) => {
    const j = await get('v2/prices/month-matrix', { origin: from, destination: to, month: `${month}-01`, show_to_affiliates: 'false', currency: 'eur' });
    return (j.data || []).filter((t) => t.number_of_changes === 0).map((t) => t.depart_date);
  },
  'v1 calendar': async (from, to, month) => {
    const j = await get('v1/prices/calendar', { origin: from, destination: to, depart_date: month, calendar_type: 'departure_date', currency: 'eur' });
    return Object.values(j.data || {}).filter((t) => t.transfers === 0).map((t) => (t.departure_at || '').slice(0, 10));
  },
  'latest tous (1 aller)': async (from, to, month) => {
    const j = await get('v2/prices/latest', { origin: from, destination: to, period_type: 'month', beginning_of_period: `${month}-01`, one_way: 'true', show_to_affiliates: 'false', limit: '1000', currency: 'eur' });
    return (j.data || []).filter((t) => t.number_of_changes === 0).map((t) => t.depart_date);
  },
};

const totals = Object.fromEntries(Object.keys(VARIANTS).map((v) => [v, Object.fromEntries(MONTHS.map((m) => [m, 0]))]));
const errors = {};

for (const to of ROUTES) {
  console.log(`\n=== ${ORIGIN} → ${to} (jours avec un prix direct, par mois) ===`);
  console.log(['variante'.padEnd(24), ...MONTHS.map((m) => m.slice(2))].join(' | '));
  for (const [name, fn] of Object.entries(VARIANTS)) {
    const row = [];
    for (const month of MONTHS) {
      let n = 0;
      try {
        const days = new Set((await fn(ORIGIN, to, month)).filter((d) => d && d.startsWith(month)));
        n = days.size;
      } catch (e) { errors[name] = String(e.message || e).slice(0, 80); }
      totals[name][month] += n;
      row.push(String(n).padStart(5));
    }
    console.log([name.padEnd(24), ...row].join(' | '));
  }
}

console.log('\n=== TOTAL toutes routes ===');
console.log(['variante'.padEnd(24), ...MONTHS.map((m) => m.slice(2))].join(' | '));
for (const [name, byMonth] of Object.entries(totals)) {
  console.log([name.padEnd(24), ...MONTHS.map((m) => String(byMonth[m]).padStart(5))].join(' | '));
}
if (Object.keys(errors).length) console.log('\nErreurs :', errors);
