// Collecte ce que disent les réseaux sociaux (TikTok, Instagram, YouTube, Reddit) sur une ville,
// pour repérer les restaurants et les activités « tendance ». Lancé à la main par la GitHub Action
// .github/workflows/social-buzz.yml. Les résultats restent PRIVÉS : ils vont dans un dossier
// rendu comme pièce jointe de l'Action, jamais dans le site.
//
// Clé Apify : variable d'environnement APIFY_TOKEN (secret GitHub), jamais dans le code.
// Chaque robot a un plafond de dépense (maxTotalChargeUsd) : le compte gratuit (5 $/mois) ne peut
// pas être dépassé par un lancement.

import { mkdirSync, writeFileSync } from 'node:fs';

const TOKEN = process.env.APIFY_TOKEN;
if (!TOKEN) throw new Error('APIFY_TOKEN manquant (secret GitHub).');

const SUJET = process.env.SUJET || 'restos';          // restos | activites
const EN = process.env.VILLE_EN || 'Warsaw';
const FR = process.env.VILLE_FR || 'Varsovie';
const LOCALES = (process.env.REQUETES_LOCALES || '').split(';').map((s) => s.trim()).filter(Boolean);
const TAGS = (process.env.HASHTAGS || '').split(';').map((s) => s.trim().replace(/^#/, '')).filter(Boolean);
const OUT = 'buzz';
mkdirSync(OUT, { recursive: true });

const Q = SUJET === 'restos'
  ? {
    tiktok: [`best restaurants ${EN}`, `where to eat in ${EN}`, `meilleurs restaurants ${FR}`, ...LOCALES],
    youtube: [`what to eat in ${EN}`, `${EN} food tour`],
    reddit: [`${EN} restaurant recommendations`, `${EN} where to eat`],
  }
  : {
    tiktok: [`things to do in ${EN}`, `${EN} hidden gems`, `que faire à ${FR}`, ...LOCALES],
    youtube: [`things to do in ${EN}`, `${EN} travel guide`],
    reddit: [`${EN} things to do`, `${EN} tourist trap`],
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
    searchQueries: Q.tiktok, resultsPerPage: 25,
    downloadSubtitlesOptions: 'DOWNLOAD_SUBTITLES', shouldDownloadCovers: false, shouldDownloadVideos: false,
  }, 25 * Q.tiktok.length, 0.6),
  instagram: () => (TAGS.length ? run('apify~instagram-hashtag-scraper', {
    hashtags: TAGS, resultsType: 'posts', resultsLimit: 30,
  }, 30 * TAGS.length, 0.4) : { items: [], usd: 0 }),
  youtube: () => run('streamers~youtube-scraper', {
    searchQueries: Q.youtube, maxResults: 15, maxResultsShorts: 5, maxResultStreams: 0,
  }, 20 * Q.youtube.length, 0.25),
  reddit: () => run('trudax~reddit-scraper-lite', {
    searches: Q.reddit, searchPosts: true, searchComments: false, sort: 'relevance',
    maxItems: 60, maxPostCount: 15, maxComments: 15, skipUserPosts: true, skipCommunity: true,
  }, 60, 0.3),
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
