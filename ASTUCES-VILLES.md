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
- Alger (oct. 2026) : recherche de fichiers Commons en HTML (`ns6=1`) puis `commons.wikimedia.org/w/thumb.php?f=NOM&w=330`
  (planches) et `w=960`, rapide et sans « 429 ». Les sites en `.dz` (musées, mosquée, ministère) ne répondent pas d'ici.
  Wanderlog : peu de listes (départ `geoCategory/205463`), mais la page `wanderlog.com/placePageGeos/79369/algiers`
  donne 662 fiches de lieux (`/place/details/ID/nom`) avec note, avis et position : les lire une par une (1 s entre deux).
  Positions des sites : Nominatim. Attention aux photos de stade : banderoles d'un club rival (USMA au 5-Juillet).
- Annaba (oct. 2026) : Wanderlog est vide pour Annaba (géo 80074, 2 lieux seulement) et Restaurant Guru / TripAdvisor bloquent.
  Ce qui marche : **Google Maps en « affichage limité »** avec Playwright (`/maps/search/<mot>/@lat,lng,16z?hl=fr`) — la colonne
  de résultats donne nom, note, nombre d'avis, catégorie et position (`!3d…!4d…` dans le lien) ; quadrillage de ~80 points sur
  la ville, 3 mots-clés en parallèle, ~550 lieux en 1 h. Une recherche qui ne renvoie qu'un seul lieu ouvre une fiche qui reste
  vide : toujours interroger un mot générique (restaurant, pizzeria, café…), jamais un nom précis.
  Photos Commons : recherche HTML (`ns6=1`) + `commons.wikimedia.org/w/thumb.php?f=NOM&w=330` / `w=960`, rapide et sans « 429 » ;
  peu de photos de restaurants algériens, prendre des photos de plats (`illustration: true`). Presse algérienne pour les prix
  (les `.dz` ne répondent pas) ; `combien-coute.net` donne un ordre de grandeur utile (dîner 3 plats ≈ 2 150 DA à Annaba).
- Oran (oct. 2026) : Wanderlog presque vide (géo 79421) mais 9 listes `geoCategory` (départ 205503) donnent ~90 lieux avec un
  résumé des avis (`generatedDescription`), utile pour écrire les fiches. Google Maps en affichage limité : **mettre un User-Agent
  de Chrome normal** (avec celui de Chromium sans tête, le nombre d'avis n'apparaît pas) ; un mot générique (« forno »,
  « paella ») renvoie une liste là où un nom exact ouvre une fiche vide. Penser à couvrir la côte (Canastel, Aïn El Turck).
  Photos Commons : `thumb.php?w=960` échoue sur les petits fichiers, réessayer en `w=800` puis `Special:FilePath`.
- Bruxelles (oct. 2026) : l'API Commons répondait « 429 » ; recherche de fichiers en HTML (`ns6=1`) puis
  `commons.wikimedia.org/w/thumb.php?f=NOM&w=330` (planches) et `w=960`, sans « 429 ». Wanderlog : départ
  `geoCategory/59964` (géo 9649), 107 listes, ~1 700 lieux. Sites bloqués d'ici : fine-arts-museum.be (Beaux-Arts,
  Magritte), minieurope.com (403) ; Michelin renvoie 202 (passer par la presse : DH, La Libre). Tiqets Bruxelles :
  `activites-attractions-bruxelles-c60843`. Musée Horta : prix seulement dans la billetterie (JavaScript).
- Koutaïssi (oct. 2026) : recherche de fichiers Commons en HTML (`ns6=1`) + `thumb.php?w=330/960` ; des recherches renvoient
  0 résultat par vagues (« 429 » masqué) : relancer plus tard. Wanderlog : départ `geoCategory/199455`, seulement 12 listes ;
  compléter par Google Maps en affichage limité (quadrillage 7×11 points). Prix : site officiel `kutaisi.travel` (musées,
  horaires), menus en lari sur Glovo (`glovoapp.com/en/ge/kutaisi/stores/<nom>`, champ `\"price\"`), aires protégées via
  maspindzeli.ge / thegeorgianguide.com (apa.gov.ge illisible). Gault & Millau Géorgie : `ge.gaultmillau.com` (Playwright).
- Dublin (oct. 2026) : recherche de fichiers Commons en HTML (`ns6=1`) + `thumb.php?w=330/960`, sans « 429 » (~1 min par planche).
  Wanderlog : départ `geoCategory/74230` (géo 9633), 250 listes, ~2 200 lieux. Prix : sites officiels lisibles avec Playwright
  (heritageireland.ie, stpatrickscathedral.ie, christchurchcathedral.ie, crokepark.ie, teelingdistillery.com, wildrovertours.com) ;
  la billetterie du Livre de Kells renvoie 403. Tiqets Dublin : `activites-attractions-dublin-c68616` (prix : `"priceEur"` par `curl`).
- Vilnius (oct. 2026) : recherche de fichiers Commons en HTML (`ns6=1`) + `thumb.php?w=330/960`, sans « 429 ». Wanderlog : départ
  `geoCategory/40370` (géo 9695), 84 listes seulement, ~900 lieux. Michelin : la page de la ville renvoie 202 à `curl`, mais Playwright
  lit les fiches (`/en/vilnius-region/vilnius_1985479/restaurant/<nom>`, ~3 fiches puis il faut ralentir). Très bon guide récent et précis :
  `lovevilnius.com/see-do/…` (Playwright). Prix officiels lisibles avec Playwright (valdovurumai.lt, lnm.lt, olkm.lt, mo.lt, tvbokstas.lt,
  trakaimuziejus.lt, bpmuziejus.lt). Tiqets Vilnius : `activites-attractions-vilnius-c73352`.
- Édimbourg (oct. 2026) : recherche de fichiers Commons en HTML (`ns6=1`) + `thumb.php?w=330/1280`, puis l'API `extmetadata` pour
  l'auteur et la licence (« 429 » par moments : réessayer après 20 s). Catégorie utile : `Category:Edinburgh_Vaults`. Wanderlog : départ
  `geoCategory/74233` (géo 9636), 127 listes, ~1 700 lieux. Michelin : `guide.michelin.com/gb/en/city-of-edinburgh/edinburgh/restaurants`
  lisible avec Playwright (`data-dtm-distinction`). Sites bloqués : rct.uk (Holyrood, Cloudflare), dynamicearth.co.uk ; lisibles avec
  Playwright : edinburghcastle.scot/visit/tickets, realmarykingsclose.com/tickets-prices, royalyachtbritannia.co.uk, nts.org.uk,
  mercattours.com/daily-tour-timetable. Tiqets Édimbourg : `activites-attractions-edimbourg-c21` (prix : `"priceEur"` du `"product"`).
- Bucarest (oct. 2026) : recherche de fichiers Commons en HTML (`ns6=1`) + `thumb.php?w=330/1280` ; l'API `extmetadata` répondait « 429 »
  par vagues : lire l'auteur (`fileinfotpl_aut`) et la licence (`licensetpl_short`) sur la page `File:`. Wanderlog : départ
  `geoCategory/90305`, 97 listes, ~1 200 lieux ; compléter par Google Maps en affichage limité (quadrillage 8×7 points, 20 résultats
  par point). Sites bloqués d'ici : cic.cdep.ro (Parlement, 503), mnar.ro (Cloudflare), filarmonicaenescu.ro (lisible avec Playwright,
  prix sur oveit.com). Cartes des restaurants du groupe City Grill (Caru' cu Bere, Manuc, Pescăruș, Hanu' Berarilor) en PDF image :
  `pdftoppm` puis lire l'image. Taux du leu : `ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml` (bnr.ro bloque).
- Bastia (oct. 2026) : Wanderlog géo 11237, seulement 12 listes (~175 lieux, départ `geoCategory/199670`) ; compléter par Google Maps en
  affichage limité (quadrillage 67 points, mots « restaurant », « pizzeria », « glacier », « bar à vin »). Michelin Corse lisible avec
  Playwright (`/fr/fr/corse/<commune>/restaurants`). Prix : bastia.corsica/musee, lepetittrainbastia.corsica, train-corse.com/fr/tarifs
  (calculateur, Playwright), billetterie SC Bastia (articles « biglietteria »), speedmare.com (navettes Lotu/Saleccia). Commons : recherche
  HTML (`ns6=1`) + `thumb.php`, « 429 » masqués par vagues (0 résultat) : attendre 8 s entre deux recherches ; `Category:Views_of_Bastia`.
- Munich (oct. 2026) : Wanderlog géo 9645 (départ `geoCategory/76025`), 126 listes, ~1 840 lieux : ne suivre que les liens dont l'adresse
  finit par « …-in-munich » (sinon le robot part dans toutes les villes voisines). Michelin : la page « alle Sternerestaurants 2026 » et
  `guide.michelin.com/de/de/bayern/mnchen/restaurants/bib-gourmand` lisibles avec Playwright. Prix officiels lisibles avec Playwright
  (residenz-muenchen.de, schloss-nymphenburg.de, neuschwanstein.de `…/eintritt.htm`, alterpeter.de, bmw-welt.com, zugspitze.de) ;
  cartes des restaurants via `speisekarte.de/münchen/restaurant/<nom>/speisekarte` (par `curl`). Commons : `thumb.php`, « 429 » masqués
  (0 résultat) sur les recherches avec « München » : réessayer en anglais (« Munich ») quelques minutes plus tard.
- Francfort (nov. 2026) : Wanderlog géo 9655 (départ `geoCategory/29625`), ne suivre que les adresses finissant par « -in-frankfurt »
  (96 listes, ~1 470 lieux). Michelin : `guide.michelin.com/de/de/hessen/frankfurt-am-main/restaurants` (+ `/page/2`) avec Playwright.
  Prix lisibles avec Playwright : maintower.de/eintrittspreise-oeffnungszeiten, staedelmuseum.de/de/besuch, dommuseum-frankfurt.de
  (tour), primus-linie.de ; Palmengarten : tarifs cachés dans un menu dépliant (lire le HTML de la page avec Playwright). Cartes des
  restaurants : speisekarte.de (prix dans `"price" content=`). Pages `File:` de Commons sans `fileinfotpl_aut` : lire la ligne « Author ».
- Tenerife (nov. 2026) : île entière sur Wanderlog géo 9632 (départ `geoCategory/74437`) en suivant les listes des communes (Adeje, Arona,
  Puerto de la Cruz, La Laguna…) et en gardant les codes postaux 380xx-386xx : 288 listes, ~2 040 restaurants. L'API Commons répondait 429 :
  recherche HTML (`Special:Search`, `ns6=1`) + `thumb.php`. Site officiel du tourisme en français : `webtenerifefr.com` (sitemap.xml lisible) ;
  prix du téléphérique sur `volcanoteide.com/en/teide_cable_car/prices_and_opening_times`, Loro Parque sur `etickets.pa-community.com`.
- Cracovie (nov. 2026) : Wanderlog géo 9640 (départ `geoCategory/76021`), suivre seulement les listes « …-in-krakow » liées à la
  nourriture (~1 360 lieux). La page Michelin de la ville ne marche pas (redirige vers Riga) : lire les fiches une par une
  (`guide.michelin.com/en/lesser-poland/krakow/restaurant/<nom>`) ; liste 2026 complète sur `krakow.pl` (article « Kulinarne perełki »).
  Prix lisibles avec Playwright : wawel.krakow.pl (`/trasa/…`, `/wystawa-stala/…`), katedra-wawelska.pl (zaplanuj-wizyte), mnk.pl,
  muzeumkrakowa.pl (`textContent`, onglets cachés), wieliczka-saltmine.com (cliquer « Tourist route »), maius.uj.edu.pl/zwiedzanie,
  kopieckosciuszki.pl/cennik-2, mocak.pl/bilety ; Auschwitz : PDF `auschwitz.org/gfx/auschwitz/userfiles/_public/visit/62_en.pdf`.
  Commons : recherche HTML (`ns6=1`) + `thumb.php`, « 429 » masqués (0 résultat) au bout de ~30 recherches : attendre quelques minutes.
- Djeddah (nov. 2026) : Wanderlog géo 85959 (départ `geoCategory/30897`), 66 listes « …-jeddah », ~550 restaurants ; attention, mon
  analyseur a recopié des notes d'un lieu voisin (même nombre d'avis 16 234 pour plusieurs lieux) : revérifier sur Google Maps en
  affichage limité (mot générique + nom, ex. « Tamees restaurants »). Sources de prix : `sa.gaultmillau.com/en/restaurants?city=jeddah&page=N`
  (Playwright, cartes avec prix), Michelin `guide.michelin.com/sa/en/mecca-province/jeddah_2555048/restaurants`, fiches Visit Saudi
  (`visitsaudi.com/sitemap.xml`, prix d'entrée en clair). L'API Commons répondait 429 : recherche HTML (`ns6=1`) + `thumb.php`.

- Düsseldorf (nov. 2026) : Wanderlog géo 9738 (départ `geoCategory/74322`), listes « …-in-dusseldorf » : 51 listes, ~590 restaurants.
  Michelin : pages `guide.michelin.com/de/de/nordrhein-westfalen/dusseldorf/restaurants/sternerestaurants` et `/bib-gourmand` avec
  Playwright (Im Schiffchen encore listé mais fermé). Prix du château de Benrath : API publique de la billetterie
  `vivenu.com/api/public/events/<id>` (champ `tickets`). Rheinturm : `rheinturm.de/en/tickets.php`. Commons : l'API répondait 429 en
  continu ; la recherche HTML (`ns6=1`) + `thumb.php` passait, lentement (~2 min par recherche).
- Dubrovnik (nov. 2026) : Wanderlog géo 9704 (départ `geoCategory/76075`), listes « …-in-dubrovnik » : 57 listes, ~570 lieux ; les sources
  citées par lieu (`sources[].siteName`) aident à juger le « tendance ». Michelin : `guide.michelin.com/hr/en/dubrovnik-neretva/dubrovnik/restaurants`
  (Playwright). Prix officiels : `shop.citywallsdubrovnik.hr/en/webshop?location=…` (remparts, Lovrijenac, Ston), dumus.hr/en/entrance-tickets,
  dubrovnikpass.com, dubrovnikcablecar.com/timetable-and-prices, PDF tarifs et horaires sur lokrum.hr, libertasdubrovnik.hr/en/price-list (bus),
  dubrovnikwalks.com (visites, kayak). Commons : recherche HTML + `thumb.php` ; deux recherches en parallèle donnent des « 0 résultat » (429).
- Charm el-Cheikh (nov. 2026) : Wanderlog géo 79309 (départ `geoCategory/30711`), 19 listes « …-sharm-el-sheikh », seulement ~280 lieux ;
  compléter par Google Maps en affichage limité (72 points le long de la côte, mots « restaurant », « seafood restaurant », « café »).
  Les adresses très bien notées de Nabq sont souvent les « à la carte » des hôtels tout compris (Rixos…) : à écarter. GetYourGuide et
  Viator bloquent ; prix des excursions via l'outil Booking (attractions), Musement (page `charm-el-cheikh/activites-c`, par `curl`)
  et la grille officielle de Circle Divers (`circledivers.com/diving-in-sharm-el-sheikh/booking` : baptême, taxe du parc). Four Seasons
  bloque (Akamai). Codes plus de Google (« V78W+H39 ») : préfixe `7GVP` pour Charm, utile quand Nominatim ne connaît pas le lieu.

- Milan (nov. 2026) : Wanderlog géo 9624 (départ `geoCategory/90288`), listes « …-in-milan » : 87 listes, ~1 200 lieux. Michelin :
  `guide.michelin.com/it/it/lombardia/milano/ristoranti/1-stella-michelin/2-stelle-michelin/3-stelle-michelin` et `/bib-gourmand` (Playwright,
  `.card__menu`). Bloqués : billetterie du Duomo (pare-feu + file d'attente), Fondation Prada (Cloudflare), milanocastello.it (403) ; lisibles :
  cenacolovinciano.org/en/info, museoscala.org (`…/museo-e-teatro/orari-e-biglietti.html`), fondoambiente.it (villa Necchi). Nouveaux prix des
  musées municipaux (10/05/2026) : article mentelocale.it. Commons : recherche HTML (`ns6=1`) + `thumb.php` ; l'API répondait 429 : auteur et
  licence lus sur la page `File:` (remplacer `&#95;` par `_` avant de chercher `fileinfotpl_aut`).
- Hurghada (nov. 2026) : Wanderlog géo de `geoCategory/75333` (listes « …-in-hurghada » et « …-in-el-gouna », ~260 restaurants) ; les
  positions sont dans un bloc à part (`"placeId":"…","longitude":…,"latitude":…`). `businessStatus` repère les fermetures (Thai Garden,
  Corsini : « CLOSED_TEMPORARILY »). Google Maps en affichage limité : notes sans nombre d'avis, puis page vide après ~50 recherches.
  Prix : Musement (`hurghada/activites-c`, par `curl`), egymonuments.gov.eg (musée), hurghadagrandaquarium.com, cartes PDF sur
  cms.elgouna.com (Nihon). Sous-marin Sindbad écarté (accident de 2025). Commons : `?width=960` (taille standard) sinon « 429 ».
- Faro (nov. 2026) : Wanderlog départ `geoCategory/207246` (district de Faro) puis listes « …-in-faro », « …-in-tavira », « …-in-olhao »,
  « …-in-loule », « …-in-lagos », « …-in-albufeira »… (260 listes, ~2 400 lieux, positions dans `"placeId":…,"longitude":…,"latitude":…`).
  Michelin : la page Algarve ne répond pas d'ici ; le communiqué PDF 2026 (`espacioprensa.michelin.es`) et la presse (Postal, Barlavento)
  suffisent. Prix des excursions : outil Booking (attractions) + Tiqets (`"priceEur"` par `curl`). Le site de l'Ilha Deserta (ilhadeserta.com)
  est en JavaScript (Playwright) ; l'ancien domaine ilha-deserta.com redirige vers un site sans rapport. Commons : recherche HTML (`ns6=1`)
  + `thumb.php`, l'API répondait « 429 » (auteur et licence lus sur la page `File:`).
- Malte (nov. 2026) : Wanderlog départ `geoCategory/20989` (Valletta), puis listes « …-in-sliema », « …-in-saint-julians », « …-in-mdina »,
  « …-in-qawra », « …-in-victoria »… (~150 listes, ~1 600 lieux). Prix officiels lisibles par `curl` sur `heritagemalta.mt/explore/<site>/` (tous les
  sites d'État), wirtartna.org (Lascaris, batterie des saluts), popeyemalta.com ; la co-cathédrale bloque (Cloudflare). Michelin : la page
  `guide.michelin.com/en/mt/restaurants` liste tout Malte (Playwright, `.card__menu`). Commons : recherche HTML (`ns6=1`) + `thumb.php`, sans « 429 ».
- Batna (nov. 2026) : ville sans vol en ce moment (absente de `data.json`, champ `ville` du guide). Wanderlog vide (géo 79754) ; Google Maps en
  affichage limité donne ~700 lieux mais très peu d'avis (note moyenne pondérée ≈ 3,97, 250 avis au plus) : garde-fou des notes abaissé vers 4,0.
  **winrouh.com** (`/restaurants/batna` + catégories) : 43 fiches avec type de cuisine, extraits d'avis Google et position exacte (`lat:`/`lng:` dans
  la page), lisibles par `curl` — très utile pour l'Algérie. Overpass et pip refusés d'ici ; Nominatim et Commons (`thumb.php`) marchent.
  Tarif des sites antiques algériens : ≈ 200 DA (comme Hippone, Tipasa). Éclipse totale du 2 août 2027 au-dessus de Timgad (5 min 20 s).
- Funchal (nov. 2026) : Wanderlog géo 9735 (départ `geoCategory/74319`), ne suivre que les adresses finissant par « -in-funchal », « -in-madeira »,
  « -in-camara-de-lobos », « -in-calheta »… (92 listes, ~960 lieux ; sans cette règle le robot part vers Santa Cruz de Tenerife). Tarifs officiels
  des sentiers (PR), du jardin botanique et de Cabo Girão : portaria n.º 48/2026 en PDF sur ifcn.madeira.gov.pt (`pdftotext -layout`). Prix lisibles
  avec Playwright : madeiracablecar.com, carreirosdomonte.com, blandyswinelodge.com/en/tours (tarifs enfants dans `textContent`), portosantoline.pt,
  venturadomar.com. Commons : API `generator=search` + vignettes par `commons.wikimedia.org/w/thumb.php` (thumb.wikimedia.org répondait « 429 »).
- Marseille (nov. 2026) : Wanderlog géo 9675 (départ `geoCategory/74266`), listes finissant par « marseille » : 79 listes, ~1 200 lieux. Michelin :
  `guide.michelin.com/fr/fr/provence-alpes-cote-dazur/marseille/restaurants` (Playwright, étoiles = icônes `michelin-star` dans la carte). Prix lisibles par
  `curl` : mucem.org/infos-pratiques, chateau-if.fr, grotte-cosquer.com/infos-pratiques, musees.marseille.fr (fermetures en tête de chaque musée), flyer PDF des
  tarifs RTM sur lebateau-frioul-if.fr ; croisieres-marseille-calanques.com bloque (Cloudflare). Commons : API `generator=search` + `thumb.php`, « 0 résultat » par vagues (relancer).
- Alicante (nov. 2026) : ville sans vol en ce moment (champ `ville` du guide). Wanderlog géo 9772 (départ `geoCategory/74350`), listes finissant par
  « -in-alicante » : ~100 listes, 850 lieux. Prix officiels lisibles par `curl` sur `alicanteturismo.com/museos/…` et `/monumentos/…` (plan du site :
  `museos-sitemap.xml`), castillodesantabarbara.com, cruceroskontiki.com/horarios-y-precios (Tabarca) ; cuevasdecanelobre.com bloque (Cloudflare).
  Michelin : `guide.michelin.com/es/es/comunidad-valenciana/alacant/restaurantes` (Playwright ; « alicante » dans l'adresse ne donne rien).
  Commons : API `generator=search` + vignettes, ~1 min par lieu, « 0 résultat » par vagues (relancer avec d'autres mots, en anglais).
- Stockholm (nov. 2026) : ville sans vol en ce moment (champ `ville`). Wanderlog : listes trouvées dans le plan du site (`sitemap.xml`), puis en suivant
  les adresses finissant par « -in-stockholm » (108 listes, ~1 000 restaurants ; données dans `window.__MOBX_STATE__`, à lire avec `raw_decode`).
  Prix lisibles avec Playwright : vasamuseet.se (`/en/visit/hours--admission/`), skansen.se, kungligaslotten.se (`…/admission-charges.html`), stromma.com,
  abbathemuseum.com (`/en/prices-opening-hours`), hellasgarden.se/bastu, aviciiarena.se/en/skyview ; stadshuset.stockholm était en panne. Michelin :
  `guide.michelin.com/se/en/stockholm-region/stockholm/restaurants` (Playwright). Commons : l'API répondait « 429 » ; recherche HTML (`ns6=1`) avec les
  vignettes `250px-` de la page de résultats pour les planches, ne pas attendre quand une recherche ne donne rien (c'est normal, pas un blocage).
- Antalya (nov. 2026) : ville sans vol en ce moment (champ `ville`). Wanderlog géo de `geoCategory/6478`, ne suivre que les adresses anglaises
  finissant par « -in-antalya » (sinon le robot relit chaque liste dans 15 langues) : ~60 listes, 900 lieux, 430 restaurants. Prix officiels :
  `muze.gov.tr/muze-detay?SectionId=ASP01&DistId=ASP` (par `curl` : prix en euros, horaires, fermetures ; codes PRG01, PHS01, OLY01, MYR01, STN01,
  SDM01, ALN01, PMK01) ; parcs naturels : PDF « Ek-2 » du tarif annuel sur tarimorman.gov.tr (`pdftotext -layout`). Tiqets Antalya :
  `activites-attractions-antalya-c78987`. L'API Commons répondait « 429 » : recherche HTML (`ns6=1`, vignettes `250px-` de la page de résultats).
  Les sites des attractions privées (téléphérique, aquarium, Land of Legends) n'affichent pas leurs prix : passer par Tiqets et les revendeurs.
- Strasbourg (nov. 2026) : Wanderlog, départ `geoCategory/74334`, listes finissant par « -strasbourg » : 64 listes, ~900 lieux, 427 restaurants.
  Prix lisibles par `curl` : `strasbourg.eu/web/musees/tarifs-musees-de-strasbourg` et `/tous-les-horaires` (fermetures en bas de page), fiches
  `strasbourg.eu/lieu/-/entity/...` (plateforme de la cathédrale), batorama.com/fr/circuits/circuit-rouge, haut-koenigsbourg.fr, levaisseau.com,
  chateau-vodou.com/visites/…, europapark.de/fr/parc-de-loisirs/billets-et-offres, visiting.europarl.europa.eu. Michelin :
  `guide.michelin.com/fr/fr/grand-est/strasbourg/restaurants` (Playwright ; Bib Gourmand = image « symboleBibendum », étoile = « michelin-star »).
  Commons : l'API a répondu « 429 » après ~45 recherches ; la recherche HTML (`ns6=1`) a pris le relais sans blocage (vignettes `250px-` → `960px-`).
  Se méfier des homonymes : la recherche « Bains municipaux » donnait d'abord ceux de Colmar. Tiqets répondait 403.
- Oslo (nov. 2026) : Wanderlog, listes trouvées dans le plan du site (`sitemap*.txt`, adresses finissant par « -in-oslo », 98 listes en anglais,
  ~1 100 lieux ; données dans `window.__MOBX_STATE__`). Google Maps lisible avec Playwright (cookie `SOCS`, `div.F7nice` = note et avis). Michelin :
  `guide.michelin.com/no/en/oslo-region/oslo/restaurants` (Playwright ; « capital-region » ne donne que 4 adresses). Prix lisibles avec Playwright :
  munch.no (`/en/buy-tickets/entrance-ticket/regular/`), nasjonalmuseet.no, kon-tiki.no/besok, norskfolkemuseum.no/en/plan-your-visit,
  holmenkollen.com/en/apningstider/, brimexplorer.com/tours/silent-oslo-fjord-cruise, oslobadstuforening.no/en/book-single-ticket/ ; operaen.no
  bloque (Cloudflare), royalcourt.no vide. Cartes en PDF : Arakataka, Den Glade Gris (`pdftotext`). Commons : API « 429 », recherche HTML (`ns6=1`) sans souci.
- Héraklion / Crète (nov. 2026) : Wanderlog, départ `geoCategory/74394`, suivre les adresses finissant par « -in-heraklion », « -in-chania-town »,
  « -in-rethymnon », « -in-agios-nikolaos », « -in-elounda »… (ajouter `^/list/` pour ne pas relire chaque liste en 15 langues) : ~2 300 lieux,
  1 700 restaurants. Prix officiels des sites d'État grecs : `tickets.hh.gr/en/venues/search?q=<nom>` avec Playwright (hhticket.gr répond 403) ;
  aussi lisibles avec Playwright : historical-museum.gr (`/en/visit/wres-leitoirghias-eisitiria`), nhmc.uoc.gr, samaria-tickets.necca.gov.gr,
  cretandailycruises.com (`…/gramvousabalos/prices.en.html`), acquaplus.gr ; cretaquarium.gr n'affiche pas ses prix. Récompenses : pas de Michelin
  en Crète, palmarès FNL (`int.fnl-guide.com/int/en/fnl-best-restaurants/crete-bra-2026/`, Playwright) et Toques d'or. Google Maps (cookie `SOCS`)
  donne la note sans le nombre d'avis. Commons : l'API `generator=search` passe mais lentement (« 429 » par vagues, ~1 min par recherche).
- Las Palmas / Gran Canaria (nov. 2026) : Wanderlog, listes trouvées dans le plan du site (4 133 fichiers `sitemapN.txt`, garder les adresses anglaises
  finissant par « las-palmas-de-gran-canaria », « maspalomas », « playa-del-ingles », « mogan », « agaete »…) : 198 listes, ~2 000 lieux. Michelin : la page
  `guide.michelin.com/es/es/canarias/restaurantes` (+ `/page/N`, attribut `data-dtm-distinction`) couvre toutes les Canaries. Sites du Cabildo
  (`*.grancanaria.com` : Casa de Colón, Cueva Pintada, jardin canarien) bloqués (Incapsula) ; lisibles avec Playwright : catedraldecanarias.es (tarifs),
  palmitospark.es/precios, aqualand.es/maspalomas/tickets, arehucas.es/visitanos, fundacionmartinchirino.org/visitas (Castillo de la Luz), losguayres.com/menu,
  casaromanticaagaete.com/menu. Commons : l'API répondait « 429 » ; recherche HTML (`ns6=1`) + `thumb.php`, ~2 min par lieu.
- Djerba (nov. 2026) : Wanderlog géo 79357, listes trouvées par recherche web (`geoCategory/374484`, `205452`, `205588` Houmt Souk,
  `205553` Midoun…) puis en suivant les adresses finissant par « -djerba-island », « -houmt-souk », « -midoun » : 47 listes, 220 lieux seulement.
  Google Maps (cookie `SOCS`) donne note, horaires et fermetures (Djerba Lina fermé du 01/11/2026 au 01/03/2027). Prix officiels :
  patrimoinedetunisie.com.tn (Borj Ghazi Mustapha, musée du patrimoine, mosquée Fadhloun, déjà à la grille 2026), djerbaexplore.com/informations-pratiques ;
  excursions via Musement (`djerba/activites-c`) et l'outil Booking. Sites de Dar Dhiafa et du Bistrot Djerba piratés (pages de casino) : ne pas les mettre en lien.
  Commons : l'API répondait « 429 », la recherche HTML (`ns6=1`) marchait (~1 min par lieu). Pas d'Apify (destination moyenne) : badge tendance seulement Djerbahood.
- Naples (nov. 2026) : Wanderlog géo 9635 (attention à Naples en Floride : vérifier `"geo":{"id":9635`), départ `geoCategory/59953`, listes finissant
  par « -in-naples » : ~80 listes, 1 000 lieux, 430 restaurants (le robot s'arrêtait seul vers 80 listes : sauvegarder en cours de route). Michelin :
  `guide.michelin.com/it/it/campania/napoli/ristoranti` (Playwright, `.card__menu`, `data-dtm-distinction`). Beaucoup de sites `.it` coupent la connexion
  (« connection reset ») : prix pris sur pompeiisites.org (WebFetch), coopculture (MANN), monasterodisantachiara.it/orari, cimiterodellefontanelle.it,
  comune.napoli.it/maschioangioino, pages d'événements cultura.gov.it (tarifs des musées d'État), outil Booking (Galleria Borbonica). Commons : recherche HTML
  (`ns6=1`) + `thumb.php`, sans « 429 », ~1 min par lieu (deux recherches en parallèle passent).
- Nice (nov. 2026) : Wanderlog géo 9674 (départ `geoCategory/74265/restaurants`), listes finissant par « -nice » : 55 listes, ~1 000 lieux, 566 restaurants.
  Michelin : `guide.michelin.com/fr/fr/provence-alpes-cote-dazur/nice/restaurants` (Playwright, icônes `michelin-star` et Bib dans la carte). Prix officiels
  lisibles par `curl` sur `nice.fr/lieux/<musée>/` (grille des musées municipaux, fermetures). Flaveur affiche ses menus (restaurant-flaveur.com, Playwright).
  Commons : l'API répondait « 429 » après une trentaine de recherches ; la recherche HTML (`ns6=1`) + `thumb.php` a pris le relais.
- Fès (nov. 2026) : Wanderlog, départ `geoCategory/75331/where-to-eat-best-restaurants-in-fez`, listes finissant par « -fez » ou « -fes » (~110 listes,
  191 restaurants notés) ; les pages de listes n'ont pas les positions et certaines fiches lieu donnent une position par défaut (34.062347,-4.983029 ou
  34.066791,-4.978564) : vérifier avec Nominatim. Tarif officiel de Volubilis sur `e-services.minculture.gov.ma/fr/tickets/…` ; carte du Riad Fès en PDF
  (`riadfes.com/download/menugayza_…pdf`). Commons : recherche HTML (`ns6=1`) + `thumb.php` sans « 429 » ; peu de photos de restaurants de Fès.
- Dakar (nov. 2026) : Wanderlog géo 79354/90805, départ `geoCategory/208534` (« dakar-region »), listes finissant par « -dakar » ou « -dakar-region » : 33 listes,
  ~350 lieux seulement (pas de positions). Notes complétées par Google Maps (Playwright, cookie `SOCS` ; position dans l'adresse `!3d…!4d…`) : La Calebasse
  (Mamelles) y est « Définitivement fermé ». Notes plus basses qu'ailleurs (C = 4,09) : garde-fou abaissé à ~4,0. Prix moyens par restaurant sur
  `seneguide.com/restaurants/dakar` (+ `/2`, `/3`, `/senegalais`…, lisible par `curl`). Tarifs : chaloupe de Gorée 6 000 + 500 FCFA (Le Soleil, sept. 2026),
  Bandia et Madeleine sur au-senegal.com. Commons : recherche HTML (`ns6=1`) sans souci, mais `Special:FilePath` répond « 429 » par vagues (attendre et relancer).
- Béjaïa (nov. 2026) : Google Maps en affichage limité (méthode d'Annaba) : ~570 lieux, notes basses (C ≈ 3,98) ; winrouh.com (`/restaurants/bejaia/bejaia`,
  fiches `/restaurant/<nom>` avec avis et position) complète. Bordj Moussa fermé (restauration lancée en sept. 2025, 15 mois) ; Casbah rouverte en 2024,
  porte Sarrasine en juillet 2026, place du 1er-Novembre au printemps 2026. Le phare du cap Carbon est en zone militaire (vue depuis la route).
- Biskra (nov. 2026) : ville sans vol en ce moment (absente de `data.json`, pas de `matchs/BSK.json` : 404 sans conséquence). Très peu d'avis Google
  (C ≈ 4,08, souvent < 50 avis) ; article winrouh « meilleurs restaurants Biskra » utile. Commons : catégories `Cuisine_of_Biskra` (plats biskris,
  filigranes discrets), `M'Chouneche`, cartes postales anciennes (BnF, domaine public) pour le jardin Landon et Hammam Salihine. Attention : les photos
  « Hammame Salhine » de panoramio sont à Khenchela. France Diplomatie : Aurès en orange (El Kantara, M'Chouneche : de jour avec chauffeur).
- Málaga (nov. 2026) : Wanderlog géo 9681, départ `geoCategory/47497` + `104699`, listes finissant par « -in-malaga » : 86 listes, ~1 300 lieux (C = 4,40).
  Michelin : `guide.michelin.com/es/es/andalucia/malaga/restaurantes` (Playwright ; étoiles = icônes `michelin-star`). Prix officiels lisibles avec Playwright :
  alcazabaygibralfaro.malaga.eu (`/es/visitas/horarios-y-tarifas/` : 7 €, 10 € les deux), malagacatedral.com (`/visita-cultural/tarifas-y-horarios/`, toits
  suspendus pour travaux), museocasanatalpicasso.malaga.eu (onglets dans `textContent`), laconcepcion.malaga.eu/es/visitas/, caminitodelrey.info ; centrepompidou-malaga.eu
  et cuevadenerja.es (tarifs) ne répondent pas d'ici. Outil Booking (attractions) utile pour flamenco, catamaran, excursions. Apify a marché (crédit renouvelé).

