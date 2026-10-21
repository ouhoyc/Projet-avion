// Collecte ce que disent les réseaux sociaux (TikTok, Instagram, YouTube, Reddit) sur une ville,
// pour repérer les restaurants et les activités « tendance » (les deux en un seul lancement, ~0,75 $). Lancé à la main par la GitHub Action
// .github/workflows/social-buzz.yml. Les résultats restent PRIVÉS : ils vont dans un dossier
// rendu comme pièce jointe de l'Action, jamais dans le site.
//
// Clé Apify : variable d'environnement APIFY_TOKEN (secret GitHub), jamais dans le code.
// Chaque robot a un plafond de dépense (maxTotalChargeUsd) : le compte gratuit (5 $/mois) ne peut
// pas être dépassé par un lancement.

import { mkdirSync, writeFileSync } from 'node:fs';

const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) throw new Error('APIFY_TOKEN manquant (secret GitHub).');

const EN = process.env.VILLE_EN || 'Warsaw';
const FR = process.env.VILLE_FR || 'Varsovie';
const LOCALES = (process.env.REQUETES_LOCALES || '').split(';').map((s) => s.trim()).filter(Boolean);
// 2 hashtags au plus (un « food », un « voyage ») : les hashtags larges (#vienna) coûtent cher pour peu de noms.
const TAGS = (process.env.HASHTAGS || '').split(';').map((s) => s.trim().replace(/^#/, '')).filter(Boolean).slice(0, 2);
const OUT = 'buzz';
mkdirSync(OUT, { recursive: true });

// Un seul lancement par ville : restaurants et activités ensemble (avant : 2 lancements, ~2,2 $ par ville).
const Q = {
  tiktok: [`best restaurants ${EN}`, `things to do in ${EN}`, `meilleurs restaurants ${FR}`, `que faire à ${FR}`,
    ...LOCALES.slice(0, 4)],
  youtube: [`what to eat in ${EN}`, `things to do in ${EN}`],
  reddit: [`${EN} restaurant recommendations`, `${EN} things to do`, `${EN} tourist trap`],
};

// Robot Apify → résultats (attend la fin, plafond de dépense, nombre max de résultats).
async function run(actor, input, maxItems, maxUsd) {
  const h = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
  const start = await fetch(`https://api.apify.com/v2/acts/${actor}/runs?maxItems=${maxItems}&maxTotalChargeUsd=${maxUsd}`, {
    method: 'POST', headers: h, body: JSON.stringify(input),
  });
  if (!start.ok) throw new Error(`${actor} : ${start.status} ${await start.text()}`);
  let r = (await start.json()).data;
  while (['READY', 'RUNNING'].includes(r.status)) {
    await new Promise((ok) => setTimeout(ok, 10000));
    r = (await (await fetch(`https://api.apify.com/v2/actor-runs/${r.id}`, { headers: h })).json()).data;
  }
  const items = await (await fetch(`https://api.apify.com/v2/datasets/${r.defaultDatasetId}/items?clean=1&limit=${maxItems}`, { headers: h })).json();
  console.log(`${actor} : ${r.status}, ${items.length} résultats, ${(r.usageTotalUsd ?? 0).toFixed(3)} $`);
  return { items, usd: r.usageTotalUsd ?? 0 };
}

const jobs = {
  tiktok: () => run('clockworks~tiktok-scraper', {
    searchQueries: Q.tiktok, resultsPerPage: 15,
    downloadSubtitlesOptions: 'DOWNLOAD_SUBTITLES', shouldDownloadCovers: false, shouldDownloadVideos: false,
  }, 15 * Q.tiktok.length, 0.45),
  instagram: () => (TAGS.length ? run('apify~instagram-hashtag-scraper', {
    hashtags: TAGS, resultsType: 'posts', resultsLimit: 30,
  }, 30 * TAGS.length, 0.2) : { items: [], usd: 0 }),
  youtube: () => run('streamers~youtube-scraper', {
    searchQueries: Q.youtube, maxResults: 15, maxResultsShorts: 5, maxResultStreams: 0,
  }, 20 * Q.youtube.length, 0.15),
  reddit: () => run('trudax~reddit-scraper-lite', {
    searches: Q.reddit, searchPosts: true, searchComments: false, sort: 'relevance',
    maxItems: 30, maxPostCount: 10, maxComments: 15, skipUserPosts: true, skipCommunity: true,
  }, 30, 0.2),
};

let total = 0;
for (const [nom, job] of Object.entries(jobs)) {
  try {
    const { items, usd } = await job();
    total += usd;
    writeFileSync(`${OUT}/${nom}.json`, JSON.stringify(items, null, 1));
  } catch (e) {
    console.log(`${nom} : échec (${e.message.slice(0, 200)})`);
  }
}
console.log(`Total dépensé : ${total.toFixed(3)} $`);
