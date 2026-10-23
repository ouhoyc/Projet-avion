# Astuces ville par ville (photos, prix, avis)

Notes de terrain sorties de `CLAUDE.md` pour qu'il reste court. À lire seulement en cas de blocage
(« 429 », site illisible) ou pour s'inspirer d'une ville déjà faite. Ajouter 2-3 lignes à chaque nouvelle ville.

- Varsovie (oct. 2026) : l'API Wikipédia et `Special:FilePath?width=800` répondent aussi « 429 » ;
  ce qui marche : la recherche de catégories (`Special:Search` avec `ns14=1`), la page HTML de la
  catégorie, puis la vignette standard `upload.wikimedia.org/.../thumb/x/xy/NOM/960px-NOM`
  (ou l'original si le fichier est petit), lentement (1 s entre deux).
- Lisbonne (oct. 2026) : le plus rapide est la recherche de **fichiers** en HTML
  (`Special:Search` avec `ns6=1`), qui donne directement les vignettes ; l'id
  `fileinfotpl&#95;aut` de la page `File:` donne l'auteur.
- Bordeaux (oct. 2026) : la recherche de fichiers répondait « 429 » ; ce qui marche : la recherche de
  catégories (`ns14=1`), puis la page HTML de la catégorie (vignettes + `data-file-width`), lentement
  (3-4 s entre deux pages). Dans la page `File:`, les `_` des classes sont écrits `&#95;`.
- Vienne (oct. 2026) : la recherche de fichiers en HTML (`ns6=1`) marchait ; vignettes `960px-` (ou
  `1280px-`) à redemander quelques secondes plus tard si la première réponse n'est pas une image.
  Notes Google : ~115 listes Wanderlog « …-in-vienna » lues en suivant les liens d'une liste à l'autre.
- Dubaï (oct. 2026) : vignettes de la recherche en `120px-`/`500px-` aussi (remplacer toute taille par
  `960px-`) ; 6-8 s entre deux fichiers sinon « 429 ». Positions des lieux : Nominatim (OpenStreetMap),
  1 requête par seconde, User-Agent neutre. Wanderlog : ~150 listes « …-in-dubai ».
- Prague (oct. 2026) : la recherche de fichiers en HTML (`ns6=1`) marchait (1 à 2 s entre deux) ; prix
  officiels lisibles par `curl` sur `prague.eu/en/objevujte/<lieu>/` (hrad.cz bloque les robots).
- Istanbul (oct. 2026) : le plus fiable est l'API Commons (`api.php`, `generator=search`, `gsrnamespace=6`,
  `prop=imageinfo`, `iiurlwidth=960`) : licence, auteur et vignette en une requête ; quand d'autres conversations
  tournent en même temps, elle répond « 429 » par vagues de 10-30 min (attendre, ne pas insister). Requêtes en
  anglais et sans accents (les caractères turcs passaient mal).
  Wanderlog : 137 listes « …-in-prague » (géo 9620), 1 730 lieux.
- Paris (oct. 2026) : recherche de fichiers en HTML (`ns6=1`), planches de 8 vignettes par lieu pour choisir,
  puis vignette `960px-` ; ~3 min par lieu, l'ordinateur de travail redémarre toutes les ~5 h (relancer les
  scripts). Peu ou pas de photos libres de Disneyland Paris (pas de liberté de panorama en France).
  Wanderlog : ~220 listes « …-in-paris », 1 608 restaurants.
- Berlin (oct. 2026) : recherche de fichiers en HTML (`ns6=1`) et vignettes `960px-` (« 429 » fréquents : 20 s de pause
  puis réessayer) ; auteur et licence sur la page `File:`. Wanderlog : ~126 listes « …-in-berlin » (géo 9623).
- Amsterdam (oct. 2026) : catégories Commons (page HTML) puis recherche de fichiers (`ns6=1`) ; vignettes `960px-`
  très limitées (« 429 » toutes les 2-3 images : 30 s de pause, 8 s entre deux) avec un User-Agent qui donne l'adresse
  du site (sans e-mail). Prix Tiqets lisibles par `curl` (champ `"priceEur"` de la page produit). Wanderlog : 80 listes
  « …-in-amsterdam » (géo 9625), ~1 150 restaurants.
- Venise (oct. 2026) : l'API de Commons (`action=query&generator=search` + `prop=imageinfo&iiprop=extmetadata`)
  donne vignette, auteur et licence d'un coup ; avec 10 villes en parallèle elle répond souvent « 429 » :
  relancer lentement. Michelin : la page `guide.michelin.com/it/it/veneto/venezia/ristoranti/stelle-michelin`
  se lit par `curl` (attribut `data-dtm-distinction` de chaque carte). Wanderlog : 115 listes, 991 lieux.
- Rome (oct. 2026) : l'API Commons `action=query&prop=imageinfo&iiprop=extmetadata` répond (auteur, licence,
  vignette 960 px) ; pour une photo d'œuvre d'art, le photographe est dans `Credit` (« Own work … »), pas `Artist`.
  Wanderlog Rome : départ de la liste `geoCategory/72433`.
- Madrid (oct. 2026) : `upload.wikimedia.org` (original) répondait « 429 » ; ce qui marche : la page `File:`
  pour l'auteur et la licence, puis la vignette `thumb.wikimedia.org/wikipedia/commons/thumb/x/xy/NOM/960px-NOM`
  (ou `commons.wikimedia.org/w/thumb.php?f=NOM&w=960` pour les petits fichiers), 4 s entre deux.
- Marrakech (oct. 2026) : l'API Commons répondait « 429 » ; la recherche de fichiers en HTML (`ns6=1`) marche mais trouve
  peu de restaurants (chercher aussi « Marrakesh » et les catégories `Restaurants_in_Marrakech`, `Food_in_Marrakech`).
- Porto (oct. 2026) : même méthode (recherche de fichiers `ns6=1` puis `thumb.wikimedia.org`, enlever le `?utm…`) ;
  l'auteur d'un modèle « Creator » est dans `<span class="fn">` (retirer d'abord les `<style>`). Wanderlog Porto : géo 9653,
  départ `geoCategory/70678`. Prix : beaucoup de sites officiels portugais se lisent par `curl` (tarifs en clair).
- Séville (oct. 2026) : même méthode Commons (planches de 8 vignettes, 4 s entre deux, aucun « 429 ») ; Wanderlog : départ
  `geoCategory/104665`, 90 listes « …-in-seville ». Michelin : la page du guide renvoie 202 (anti-robots), passer par la presse locale.
- Copenhague (oct. 2026) : l'API Commons (`generator=search`, `gsrnamespace=6`, `prop=imageinfo`) répondait, mais les
  vignettes répondaient « 429 » une fois sur deux (2-3 min par lieu pour une planche de 8 : lancer tôt, en tâche de
  fond). Beaucoup de sites officiels danois affichent leurs prix en JavaScript : les lire avec Playwright
  (`/opt/node-tools/node_modules/playwright`, `document.body.innerText`, ou `textContent` pour les onglets cachés).
  Michelin : `guide.michelin.com/dk/en/capital-region/copenhagen/restaurants/page/N`. Wanderlog : géo 9643, 116 listes.
  La Petite Sirène est protégée (sculpteur mort en 1959) : pas de photo de la statue.
- Lanzarote (oct. 2026) : l'API Commons et `upload.wikimedia.org` répondaient « 429 », et Python (`urllib`) était bloqué
  même quand `curl` passait. Ce qui marche : recherche de fichiers en HTML (`ns6=1`), vignettes calculées soi-même
  (`thumb.wikimedia.org/wikipedia/commons/thumb/x/xy/NOM/330px-NOM`, x/xy = MD5 du nom avec des `_`) pour les planches,
  page `File:` par `curl` pour l'auteur et la licence, puis la vignette **`1280px-`** (la `960px-` répondait « 429 »).
  Wanderlog répondait « servers overloaded » pendant ~20 min (sans doute une autre conversation) : attendre puis relancer.
  Wanderlog : départ `geoCategory/198762` (géo 9671), 93 listes, ~1 150 lieux.
- Tunis (oct. 2026) : l'API Commons répondait « 429 » dès le départ ; la recherche de fichiers en HTML (`ns6=1`) puis la vignette
  `upload.wikimedia.org/.../thumb/x/xy/NOM/960px-NOM` marchent (lentement). Prix et horaires officiels des monuments tunisiens :
  `patrimoinedetunisie.com.tn/fr/monuments|musees|sites/…/apercu/` (lisible par `curl` ; tarifs affichés = grille 2023, appliquer
  la grille d'avril 2026). Wanderlog Tunis : départ `geoCategory/208524`, ~370 lieux (Google Maps et Wanderlog `explore` bloqués).
  Positions : les « plus codes » Google des listes Wanderlog (`V8PF+5J7`) se décodent sans bibliothèque (référence Tunis).
- Ajaccio (oct. 2026) : l'API Commons et `upload.wikimedia.org` répondaient « 429 » ; la recherche de fichiers en HTML (`ns6=1`)
  marche (planches de 8 vignettes). Les listes Wanderlog donnent les positions dans `boardSections` (`"place":{…"longitude","latitude"}`).
  Michelin : `guide.michelin.com/fr/fr/corse/ajaccio/restaurants` (distinctions dans `data-dtm-distinction`, avec Playwright).
  Billetterie de l'office de tourisme (`reservation.ajaccio-tourisme.com`) : prix officiels des visites et concerts.
- Tirana (oct. 2026) : l'API Commons répondait « 429 » et les vignettes `upload.wikimedia.org` aussi par vagues ; ce qui marche
  bien et vite : recherche de fichiers en HTML (`ns6=1`) puis vignettes par `commons.wikimedia.org/w/thumb.php?f=NOM&w=330`
  (planches) et `w=960` (photo finale), ~40 s par planche. Prix et horaires : `albaniaguidebook.com` (relevés datés d'oct. 2026,
  sur les sites des exploitants). Wanderlog : départ `geoCategory/207293`, 103 listes, ~900 lieux (positions dans
  `"placeId":…,"longitude":…,"latitude":…`). Évitez les photos d'un fournisseur commercial (ex. « oakwoodfirepizza ») sur Commons.

