// TEMPORAIRE : teste si SofaScore répond aux serveurs de Vercel (fetch, puis en-têtes de navigateur).
export default async function handler(req, res) {
  const urls = ['https://api.sofascore.com/api/v1/sport/football/categories',
    'https://www.sofascore.com/api/v1/sport/football/categories',
    'https://api.sofascore.com/api/v1/unique-tournament/202/season/76477/events/next/0'];
  const out = [];
  for (const u of urls) for (const h of [{}, { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', Accept: 'application/json', Referer: 'https://www.sofascore.com/', Origin: 'https://www.sofascore.com' }]) {
    try { const r = await fetch(u, { headers: h }); const t = await r.text(); out.push({ u, nav: !!h.Accept, status: r.status, taille: t.length, debut: t.slice(0, 80) }); }
    catch (e) { out.push({ u, erreur: String(e) }); }
  }
  res.setHeader('Cache-Control', 'no-store');
  res.json(out);
}
