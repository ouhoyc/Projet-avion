# Projet « Vols directs depuis Lyon » — notes pour Claude

Lis ce fichier en entier avant de travailler. Lis ensuite `IDEES.md` (cap du site, idées,
**problèmes à régler**, historique).

## Le propriétaire
- Francophone, **débutant** en code : réponds en français, simplement, sans jargon.
- Il veut voir avant de valider. Pour un changement de design ou un choix, montre des captures
  ou propose 2-3 options. Ne code pas une grosse fonctionnalité sans son accord quand il dit
  « on voit ensemble avant ».
- Il teste surtout sur **iPhone**, et parfois sur PC : vérifie **toujours les deux** (captures
  Playwright) avant de mettre en ligne.
- Sécurité :
  - ne demande **jamais** de jeton ou de clé dans le chat ;
  - ne mets jamais un jeton dans le code ;
  - ne mets jamais de donnée personnelle (e-mail…) dans une requête ou un en-tête.

## Le site
- **Cap :** aider les gens qui aiment partir mais **ne savent pas où aller** à voir les vols
  directs depuis Lyon, leurs prix, et donner envie. Plus tard : préparer le séjour (activités,
  quartier où dormir, hôtels). Le détail est dans `IDEES.md`.
- **En ligne (production) :** https://projet-avion-ouhoyc.vercel.app
  - projet Vercel `projet-avion`, équipe `team_3yacoAuURMeuqvOwb1pRQ2bN` ;
  - déploiement automatique à chaque push sur `main`, en 1 à 2 minutes.
- **Dépôt :** GitHub `ouhoyc/Projet-avion`, branche `main`. On pousse directement sur `main`.
- **Textes du site :** au **vouvoiement**.
- **Style :** « Pop » verrouillé (bleu nuit `#14213d`, papier crème, corail `#ff6b4a`), police
  **Outfit** partout. `themes.css` contient encore d'anciens styles d'essai, inutilisés.

## Fichiers
- `index.html` : la page.
  - **Accueil « agence de voyage »** (22/10/2026) : titre court « Où partir depuis Lyon ? » ; les
    destinations s'affichent **dès l'arrivée** (court séjour par défaut), sans formulaire à remplir.
  - Filtres en **pastilles** collées en haut (`.search` > `.filters-row`) : Quand (calendrier), Durée
    (panneau `#f-stay` : aller-retour/aller simple, case « dates exactes », nuits), Voyageurs, Budget
    (`#f-budget`), « Une idée ? » (`#f-where`, saisie libre ville ou pays, `setupWhere()`). Texte des
    pastilles : `updatePills()` ; aide « on cherche le vol le moins cher… » : `updateFormHelp()`.
  - Résultats = fiches **« ✨ Séjour clé en main »** (`cityCardHtml`, `.trip-card`) pour **toutes** les
    villes (choix du propriétaire : toutes auront leur guide avant la mise en ligne publique) :
    grande photo, bandeau, ce qui est compris, dates, prix du vol, bouton « Préparer mon séjour »
    (ouvre le panneau du vol ; sans guide, mention « arrivent bientôt »).
  - Carte gardée : sous les filtres sur téléphone, fixe à droite sur ordinateur.
  - Téléphone (< 760 px) : les 5 filtres en **boutons-icônes** sur une ligne (icône + texte sur 2 lignes
    max), tous visibles sans glisser ; garder « N'importe quand » en entier (dit qu'on est libre de
    ne pas choisir de dates) ; la pastille du lieu montre le nom seul (« Barcelone »).
  - **Pas d'aller simple** : le site prépare des séjours (champ caché `trip` = `rt`).
  - Titre de la liste **générique** « Votre séjour clé en main » (pas de nombre) : on accompagne
    le client pour choisir activités, restos et hôtel.
  - **Pas d'emojis dans l'interface** : icônes dessinées (trait style Lucide) dans le bloc
    `<symbol>` en haut d'`index.html` (`#i-moon`, `#i-wallet`, `#i-pin`, `#i-ticket`, `#i-utensils`,
    `#i-bed`, `#i-sparkles`, météo `#i-sun`, `#i-cloud-sun`…), utilisées avec `<use href="#i-…">`.
  - iPhone : `html:has(dialog[open])` bloque la page derrière un panneau ; « Une idée ? » ne met pas
    le curseur dans le champ d'office sur téléphone (le clavier faisait sauter la page) ; le calendrier
    fait défiler la liste des mois, pas la page.
  - Hauteurs des panneaux en **`dvh`** (avec `vh` en secours) : sur iPhone, `vh` compte la barre
    d'adresse de Safari et le haut des panneaux passait dessous (invisible dans Playwright).
  - Carte, liste, panneau « Voir », calendrier, dialogue « Crédits et mentions ».
- `app.js` : en-tête, carte MapLibre (fond OpenFreeMap en français, pastilles de prix dès le
  zoom de départ), outils communs (`flag()` = images de drapeaux dans `img/drapeaux/`).
- `search.js` : moteur de recherche (prix jour par jour, combinaisons aller-retour), barre des
  mois, fiches villes (vignette, météo, durée de vol), panneau « Voir » :
  - la vérification du prix en direct se fait **seulement sur le bouton** ;
  - le résultat est gardé 30 min dans le navigateur.
- `ville.html` + `ville.js` + `ville.css` : page guide d'une ville (`ville.html?c=BCN`), qui lit
  `guides/CODE.json` (activités : prix, réservation, durée, position…). Les villes qui ont un
  guide sont listées dans `GUIDES` (`search.js`) ; liens partenaires dans `PARTNER_LINKS` (`ville.js`, par ville puis activité) : Tiqets =
  `tiqets('chemin de la page Tiqets')`, qui passe par le lien Travelpayouts `TIQETS_LINK` + `?u=`
  (un code de suivi neuf à chaque clic). Pas de lien si Tiqets n'a qu'une offre plus chère (ex. Picasso).
  Chaque activité a des `tarifs` (adulte + règles enfants [âge max, prix]) pour le devis.
  Partie « Où dormir ? » : `quartiers` dans le guide, `GAMMES` et `STAY22_AID` dans `ville.js`.
  Circuit en 5 étapes (#1 à #5) : Vol, Activités, Restos, Hôtel, Réserver. Restaurants dans
  `restaurants` du guide (gamme petit/moyen/haut, badges tendance/recompense/institution, prix,
  réservation) ; choix gardé dans `restos-CODE` ; pas compté dans le total (payé sur place).
  Photos des restaurants : `img/restos/CODE/ID.jpg` + `mini/`, libres (Commons) ; `illustration: true`
  quand la photo ne montre pas le lieu lui-même (mention « Photo d'illustration » sur la fiche).
  Carte des hôtels : seules les activités et restaurants choisis y apparaissent ; les hôtels sont
  cherchés dans toute la ville (`r` = rayon dans `api/hotels.js`).
- `api/hotels.js` : hôtels et prix en direct (LiteAPI, clé dans la variable Vercel `LITEAPI_KEY`) ;
  pendant les tests, la remplacer par de fausses données avec `page.route('**/api/hotels**', …)`.
- `voyageurs.js` + `voyageurs.css` : choix « Qui part ? » (adultes, âges des enfants), gardé
  dans le navigateur, utilisé par l'accueil (champ Voyageurs) et le devis des pages guides.
- `style.css` et `themes.css` : le style ; le Pop est dans `themes.css`.
- `villes.json` : fiches des **88 villes**, rangées par `city_code` :
  - `pitch` : texte vendeur ;
  - `photo` : src, auteur, licence, page Commons ;
  - `climate` : min, max, pluie, soleil (12 mois) et source.
- `img/villes/CODE.jpg` (photo 960 px) et `img/villes/mini/CODE.jpg` (vignette 160 px).
- `data.json` et `daily.json` : prix, régénérés chaque matin par la GitHub Action
  `.github/workflows/update-prices.yml`, qui lance `scripts/fetch-prices.mjs` (données gratuites
  Travelpayouts, rares au-delà de 2-3 mois).
- `matchs/CODE.json` (un fichier par ville) : matchs de foot, basket et rugby joués dans chaque
  destination (12 mois, champ `niveau` 1 = le plus important) ; `matchs-cache.json` garde les
  centres des villes, leurs noms en toutes langues et le stade de chaque club. Mise à jour **chaque lundi ~6 h par une tâche Claude programmée** (« Mise à jour des matchs »,
  modèle Sonnet) qui réveille la session dédiée « Mise à jour des matchs (chaque lundi) » (dépôt branché,
  sinon le push est refusé) : `node scripts/fetch-matchs.mjs` ~10-25 min, puis commit.
  SofaScore bloque GitHub et Vercel (403), le proxy Apify gratuit est refusé, et l'offre gratuite
  d'API-Sports ne donne que hier/aujourd'hui/demain (testé oct. 2026 ; payant ≈ 19 $/mois/sport) :
  l'Action `update-matchs.yml` reste seulement en lancement à la main.
  Source gratuite et sans clé : l'interface publique de SofaScore (par `curl` : le `fetch` de Node
  est bloqué par leur anti-robots). Pour chaque pays desservi : 2 championnats + la coupe de foot,
  1er championnat de basket, liste fixe pour le rugby (`RUGBY`), et les coupes d'Europe. Un match est rattaché à une ville si
  son stade est à moins de 25 km du centre (OpenStreetMap), sinon par le nom de la ville.
  `ville.js` (`addMatchs`) les ajoute aux activités « Sport » pendant les dates du séjour
  (10 au plus, prix estimé par sport, bouton « Trouver des billets ») ; ils remplacent l'activité générique
  du club (champ `club` dans le guide, ex. Legia). Rien à faire pour une nouvelle ville.
- `api/prix.js` : fonction Vercel pour le prix en direct (Ignav, clé dans la variable Vercel
  `IGNAV_API_KEY`). **Chaque appel coûte un crédit** : ne jamais lancer de vérification en direct
  pendant les tests ; les bloquer dans Playwright avec `page.route('**/api/prix**', r => r.abort())`.

## Méthodes qui marchent
- **Tester :** copier le site dans un dossier temporaire, lancer `python3 -m http.server`, puis
  Playwright (Chromium déjà installé). Faire des captures iPhone 13 et 1280×800, et regarder
  les images avant de dire que c'est bon.
- **Nouvelle fiche ville :**
  - la météo vient du tableau climat de Wikipédia, lu avec WebFetch ; ne pas utiliser curl sur
    wikipedia.org (bloqué) ;
  - la photo vient de Wikimedia Commons, sous licence libre uniquement ; la télécharger via
    `Special:FilePath/<fichier>?width=800`, puis la regarder recadrée en 16:7 ;
  - écrire un texte **vendeur**, qui vend l'atout de la ville plutôt que la liste des choses à faire ;
  - générer la vignette 160 px dans `img/villes/mini/`.
- **Photos des activités** (`img/activites/CODE/ID.jpg` 800 px + `mini/ID.jpg` 160 px carré ;
  auteur, licence, page dans `photo` de chaque activité, crédits dans « Crédits et mentions ») :
  l'API de recherche Commons répond souvent « 429 » d'ici ; passer par la photo principale de
  l'article Wikipédia (`/api/rest_v1/page/summary/…`, enlever `?utm…` de l'adresse) ou par la page
  HTML d'une catégorie Commons, puis lire la licence sur la page `File:` (classe
  `licensetpl&#95;short`, prendre une licence CC si le fichier est aussi en GFDL). User-Agent
  neutre, sans e-mail. Toujours regarder une planche recadrée avant de choisir.
  Varsovie (oct. 2026) : l'API Wikipédia et `Special:FilePath?width=800` répondent aussi « 429 » ;
  ce qui marche : la recherche de catégories (`Special:Search` avec `ns14=1`), la page HTML de la
  catégorie, puis la vignette standard `upload.wikimedia.org/.../thumb/x/xy/NOM/960px-NOM`
  (ou l'original si le fichier est petit), lentement (1 s entre deux).
  Lisbonne (oct. 2026) : le plus rapide est la recherche de **fichiers** en HTML
  (`Special:Search` avec `ns6=1`), qui donne directement les vignettes ; l'id
  `fileinfotpl&#95;aut` de la page `File:` donne l'auteur.
  Bordeaux (oct. 2026) : la recherche de fichiers répondait « 429 » ; ce qui marche : la recherche de
  catégories (`ns14=1`), puis la page HTML de la catégorie (vignettes + `data-file-width`), lentement
  (3-4 s entre deux pages). Dans la page `File:`, les `_` des classes sont écrits `&#95;`.
- Les villes sans fiche s'affichent quand même, simplement sans photo ni texte.

## Recette : préparer une nouvelle ville (méthode validée sur Barcelone, ville cobaye)
Tout va dans `guides/CODE.json` ; ajouter le code dans `GUIDES` (`search.js`). Une ville n'est
« prête » que si les 4 étapes du circuit marchent (vérifier iPhone + PC).
1. **Activités** (~25-30) : les incontournables + 2-3 lieux « réseaux sociaux » (badge `tendance`).
   Chaque activité : type, quartier, position, texte vendeur, prix + `prix_detail`, `tarifs`
   (adulte + enfants), réservation (+ délai), durée, moment, site officiel, photo libre Commons.
   **Pas d'activité « manger »** (halle, atelier cuisine, donuts…) : c'est le rôle de l'étape Restos.
   **Match de foot** du club local s'il est populaire (Camp Nou, Legia…), type `sport`, sans badge
   d'office : on le garde même si les réseaux sociaux en parlent peu (ils ne sont pas cherchés pour ça).
   Vérifier qu'aucun lieu n'est fermé pour travaux (le musée Chopin de Varsovie l'est toute l'année 2026).
2. **Restaurants** : **18 = 3 gammes × 6** (petit < 30 €, moyen 25-60 €, haut 50 € et +).
   - Site de **voyage**, pas guide culinaire : adresses **connues et photogéniques** (Instagram,
     TikTok) + tables **récompensées** (Michelin, World's 50 Best) + **institutions** historiques.
   - Pas deux restaurants du même genre dans une gamme ; pas de tapas (ou équivalent local) dans
     les trois gammes ; éviter les doublons avec les activités.
   - **Note pondérée (moyenne bayésienne, méthode IMDb)** pour comparer note et nombre d'avis :
     score = v/(v+m) × R + m/(v+m) × C, avec R = note Google, v = nombre d'avis,
     C = note moyenne des restaurants de la ville pondérée par les avis (Barcelone : 4,45),
     m = avis de référence (1 500). Peu d'avis → ramené vers C ; beaucoup d'avis → la vraie note
     compte. Collecte : quadrillage de toute la ville (cases ~1 km, 3 pages de 20 résultats) +
     recherche par nom des adresses réputées absentes ; retirer les chaînes (KFC, McDonald's…).
   - Le score **seul** ne suffit pas (il favorise les restaurants qui réclament des avis en masse :
     grills argentins, pizzerias touristiques) : il sert à **départager et écarter** les adresses
     réputées/tendance, pas à faire le classement. Garde-fou : note Google ≥ 4,3 environ. Le propriétaire a autorisé (une fois par an) la lecture
     des notes sur Google Maps depuis ici (Google Maps n'affiche pas les notes au navigateur
     automatique : les listes Wanderlog `wanderlog.com/list/geoCategory/ID` contiennent la note
     Google et le nombre d'avis, `"rating"` et `"numRatings"`, ~600 lieux pour Varsovie) ; ne **jamais** afficher les étoiles ni les avis Google
     sur le site. Se méfier des notes gonflées (restaurants qui réclament des avis en masse).
   - Vérifier l'adresse de chaque lieu (Sala Equis était à Madrid !).
   - Badges : `tendance` 🔥, `recompense` 🍽️ (+ texte `recompense`), `institution` 🏛️.
   - Photo : vraie photo libre Commons si possible, sinon photo libre du plat/de la vue avec
     `illustration: true`. **Jamais** de photo protégée, même si le propriétaire le propose.
   - Prix et délais de réservation = estimations, à faire vérifier par le propriétaire.
   - **Réseaux sociaux (Apify)** : lancer l'Action « Tendances réseaux sociaux »
     (`.github/workflows/social-buzz.yml`, `scripts/social-buzz.mjs`, secret `APIFY_TOKEN`, compte
     Apify gratuit partagé avec la veille IA : ~1 $ par lancement, plafonds dans le script) deux
     fois : `sujet=restos` puis `sujet=activites`, avec des recherches et hashtags dans la langue
     locale. Résultat = pièce jointe de l'Action (7 jours), à télécharger avec les outils GitHub ;
     **jamais** dans le dépôt ni sur le site (aucun chiffre, aucun nom de réseau affiché).
     Compter les citations par lieu et par réseau : badge `tendance` seulement si le lieu sort
     sur **2 sources** au moins (une seule vidéo, même virale, ne suffit pas ; se méfier des
     vidéos sponsorisées « zaproszenie », « współpraca », « AD »). Lire aussi Reddit pour les
     pièges à touristes (Varsovie : faux sites de billets → note dans les fiches).
3. **Hôtels** : `quartiers` dans le guide (5 environ, avec position et texte) ; la recherche se
   fait dans toute la ville (LiteAPI). Point conseillé (`idealQuartier`, `ville.js`) : le milieu
   des activités cochées s'il est à moins de 800 m d'un quartier du guide (« Près de … », hôtels
   triés par distance à ce point) ; sinon le quartier qui a le plus d'activités à pied. Les
   quartiers servent donc à nommer le point et de secours (point dans l'eau, en zone sans hôtels).
4. **Carte** : seuls les activités et restaurants choisis y apparaissent.

## Qualité d'abord (demande du propriétaire, 21/10/2026)
- **La qualité passe avant l'économie de tokens** : faire les recherches nécessaires, vérifier,
  creuser, plutôt que de répondre de mémoire. Il ne veut pas refaire le site plusieurs fois.
- Garder des captures utiles (vérifications iPhone + PC, et ce qu'il doit voir), sans en abuser.
- Une nouvelle conversation par grand sujet reste conseillée (les conversations très longues
  deviennent lentes et chères), mais ce n'est plus une contrainte.

## Prochaines étapes prévues
1. **Nom et logo : en pause** (voir point 11 d'`IDEES.md` : critères, noms écartés, noms libres).
   Priorité du propriétaire : la vision **voyage clé en main** (point 4) et une **application
   sur les stores** (point 12).
2. Régler la liste « Problèmes à régler » d'`IDEES.md` en une fois, quand il le demande.
3. Ensuite, piste « donner envie » : choisir par envies (soleil, ville, fête…), « Surprends-moi ».
4. Affiliation Kiwi.com en attente chez Travelpayouts (lien partenaire à mettre dans
   `KIWI_AFFILIATE_TEMPLATE`, dans `app.js`).
