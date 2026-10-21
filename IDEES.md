# Idées et décisions en attente

Liste de travail du projet « Vols directs depuis Lyon ». On traite les points un par un.
Statuts : 💡 idée · ❓ questions à trancher · 🛠 en cours · ✅ fait · ⏸ en pause

## Le cap du site
Pour les gens **qui aiment partir mais ne savent pas où aller**. On part de leur période, leur
budget et leurs envies, depuis leur aéroport, en vol direct ; le site leur donne des idées de
destinations, puis prépare le séjour (activités selon leurs goûts, quartier idéal pour dormir,
hôtels). Revenus : commissions à chaque étape (vol, hôtel, activités…).

## Problèmes à régler (tous d'un coup, plus tard)

**Météo incomplète ou approximative (fiches villes)**
- Ensoleillement absent : Sétif, Koutaïssi, Batna (pas de pluie non plus), Béjaïa (décembre).
  → pas de type de temps affiché ces mois-là, seulement la température.
- Jours de pluie retirés (source au seuil ≥ 0,1 mm, trop « pluvieux ») : Bruxelles, Vilnius.
- Jours de pluie au seuil ≥ 0,1 mm gardés (un peu surestimés) : Francfort, Düsseldorf, Belgrade,
  Istanbul, Tel Aviv.
- Seuil non précisé dans la source : Athènes, Corfou, Tanger, Oslo, Prague (jours de pluie),
  Amman, Sétif.
- Sources plus faibles ou anciennes : Beyrouth (période inconnue), Corfou et Athènes (1955–2010),
  Tanger (1961–1990), Sétif (1976–2005).
- Piste : une source unique pour toutes les villes (ex. Open-Meteo, normales calculées).

**Photos à améliorer**
- Photos prises hors de la ville : Batna (Timgad), Sétif (Djémila), Biskra (palmeraie de la
  région), Héraklion (lagon de Balos, ouest de la Crète), Brest (pointe Saint-Mathieu),
  Marseille (calanque d'En-Vau, Cassis).
- Moins réussies / basse résolution : Djeddah, Bucarest, Essaouira (pas de plage), Annaba.
- Monuments italiens (Colisée, Duomo…) : la loi italienne demande une autorisation pour un usage
  commercial des images de biens culturels → à remplacer si le site devient commercial.
- Las Palmas : photo recadrée → préciser « recadrée » dans les crédits (licence CC BY).

**Fonctionnement**
- Une nouvelle destination n'a pas de fiche automatiquement (photo, texte, météo) : à faire à la
  main à chaque fois. Piste : script qui signale les villes sans fiche.
- Fiches Oslo, Ajaccio, Annaba, Brest : enregistrées mais pas encore vues à l'écran (pas de vol
  au moment du test).
- Prix rares au-delà de 2-3 mois (limite des données gratuites, voir point 8).

**Incident à retenir**
- Deux assistants ont envoyé une fois l'adresse e-mail du propriétaire dans une requête vers
  Wikimedia (User-Agent). Corrigé aussitôt ; consigne ajoutée pour les suivants.

## À faire

### 16. 💡 Tester le site avec des clients simulés
Le propriétaire veut voir où des clients sans aucun contexte bloquent. Version conseillée :
6 profils variés (famille, senior, étudiant…), lecture du texte de la page + quelques captures,
modèle moins cher, ~20-30 min et ~1,5-3 millions de tokens ; bloquer `api/prix` (crédits Ignav).
Rapport : liste des blocages classés par gravité. À lancer dans une conversation à part.


### 11. ⏸ Nom et logo (mis de côté le 16/10/2026)
On reprendra quand la vision « voyage clé en main » et l'application seront plus claires
(le nom doit coller à tout le voyage, pas seulement aux vols).
- Souhait : un mot inventé, court, facile à dire dans toutes les langues, qui « sonne classe »
  (comme Amazon, Rolex) ; le sens viendra du logo et du slogan. **Le .com doit être libre.**
- Constat : tous les mots agréables de 5 lettres sont pris en .com → viser 6-7 lettres.
- Écartés : Envolo (.com pris, trop français), Voloko (.com pris depuis 2016),
  Voloco (.com pris, et appli de chant très connue).
- Libres en .com et .fr le 16/10/2026 : Livaka (cache « vaca(nces) »), Tovako, Vantoli,
  Lozava, Zolako, Jonura, Volokko, Voluko, Volakko.
- Avant de choisir : vérifier les marques (INPI, EUIPO) et la disponibilité du nom sur
  l'App Store et Google Play.
- Logo : 3 pistes déjà dessinées pour Envolo (pastille ronde, traînée en « E », étiquette de
  bagage) ; à refaire avec le nom retenu.

### 12. 💡 Application sur les stores (App Store, Google Play)
Le propriétaire compte sortir une vraie application. À décider : comment la fabriquer à partir
du site actuel, et à quel moment (avant ou après le « clé en main »).

### 10. 💡 Donner envie (inspiration)
Pour quelqu'un qui ne sait pas où aller, un prix ne suffit pas. Pistes :
- choisir par **envie** plutôt que par pays : soleil & plage, ville, nature, fête, culture,
  dépaysement… ;
- sur chaque fiche : une **photo**, une phrase « pourquoi y aller », la **météo** du mois choisi,
  la durée de vol ;
- un mode « Surprends-moi ».
- 🛠 (21/10/2026) `envies.json` : les 95 villes classées par envie (soleil, ville, gastronomie, nature,
  fête ; « ville » remplacée par « culture » = Culture et histoire). Maquettes A/B/C du formulaire montrées (destination en dernier, en filtre,
  ou remplacée par « Vous avez envie de quoi ? ») : choix du propriétaire en attente.

### 1. ✅ Recherche par jour / fourchette de dates
Pouvoir chercher un jour précis ou une fourchette (« du 10 au 15 nov. ») au lieu du mois entier.
- Plan proposé : le script récupère le prix le moins cher **par jour de départ** et par destination
  (Travelpayouts `grouped_prices`, vols directs) ; sur le site, un bloc « Quand ? » avec dates
  « du … au … » + raccourcis (ce week-end, mois…).
- Limite : certains jours n'auront pas de prix repéré (données issues des recherches des voyageurs).
- Questions : horizon **6 ou 12 mois** ?

### 2. ✅ Allers-retours en vols directs
- Plan proposé : aller-retour = **deux vols directs séparés** (Lyon → X, puis X → Lyon), comme
  vendent les low-cost. Le script récupère aussi les prix jour par jour dans le sens retour.
- Le site combine le meilleur aller + le meilleur retour selon les critères, affiche le total et le
  détail des deux vols. Destinations sans retour direct masquées en mode aller-retour.
- Vérification en direct au clic sur les **deux** vols ; lien Kiwi.com en aller-retour.
- Questions : durée sur place en **nuits** (« 2 à 4 nuits ») ou fourchette de dates de retour ?
  Mode par défaut : aller simple ou aller-retour ?

### 3. ✅ (première version) Deux façons de chercher : « période d'abord » ou « destination d'abord »
- **J'ai des vacances (la période prime)** : je donne ma période (ex. 2 semaines), je veux partir
  à coup sûr pendant ce créneau, peu importe où → toutes les destinations dont l'aller **et le
  retour** tiennent dans la période, triées du moins cher au plus cher.
- **J'ai une destination en tête (le prix prime)** : je choisis la destination, je suis flexible
  sur les dates → un calendrier des prix sur les mois à venir pour repérer les jours les moins
  chers (et la meilleure combinaison aller + retour pour une durée donnée).
- **Les deux combinés** : « pendant mes 2 semaines de vacances, quand partir à Lisbonne pour
  payer le moins cher ? » → je donne la destination, la période (aller et retour doivent y tenir)
  et le nombre de nuits voulu ; le site donne la meilleure combinaison aller + retour et son prix.
- **Suggestions d'autres durées** : proposer aussi des séjours un peu plus courts ou plus longs
  (toujours dans la période) s'ils sont moins chers. Ex. « 5 nuits : 120 € · 4 nuits : 85 € ».
- Idée d'interface : **un seul formulaire** qui couvre tous les cas — destination (facultative),
  période (du … au …), nuits souhaitées. Sans destination = « où partir ? » ; période large =
  « quand partir ? » ; les deux = combinaison.
- **Sans période (« je pars quand je veux »)** : pour ceux qui sont totalement flexibles →
  destination facultative, aucune date : le site trouve les meilleures combinaisons sur tout
  l'horizon (avec la durée de séjour souhaitée).
- Dépend des points 1 et 2 (prix jour par jour, retours).
- ✅ Validé par toi : la compréhension des deux modes est bonne.

### 4. 💡 VISION FINALE — préparer tout le voyage, pas seulement le vol
Reproduire et automatiser ta façon de préparer un voyage :
1. trouver la période / la destination → 2. trouver le vol → 3. repérer les activités à faire
(aujourd'hui : TikTok, forums, points sur Google Maps) → 4. choisir l'hébergement dans la zone
la plus proche de toutes les activités (« pile au milieu »).
- **Activités par ville**, préparées à l'avance pour chaque destination et livrées « prêtes ».
- **Sur-mesure selon les préférences** du voyageur :
  - centres d'intérêt : musées / culture, sport, tournée des bars, restaurants, … ;
  - gamme d'activités : haut de gamme, moyenne gamme, gratuites ;
  - **kids friendly** (adapté aux enfants) ;
  - gamme d'hôtel : haut, moyen, bas de gamme.
- **Carte** : les activités choisies en points, et la **zone idéale pour dormir** calculée au
  centre de ces points, avec des hébergements proposés dans cette zone.
- À découper en étapes (activités d'abord, puis zone + hébergement, puis préférences).
- 🛠 **Décidé le 16/10/2026 : on commence par Barcelone.** Organisation retenue : une **page
  guide par ville** (vol, incontournables, carte, quartiers, hôtels) avec, dedans, un bouton
  « Préparer mon séjour sur mesure » qui lance le parcours en 3 étapes (envies → activités
  cochées → quartier idéal + hôtels).
- Chaque activité affiche son **prix** et s'il faut **réserver à l'avance** (et combien de temps
  avant). Fiche détaillée : prix détaillés, conseils pratiques, bouton « Réserver » (partenaire,
  commission) **et** bouton « Site officiel » (pour garder la confiance).
- Le propriétaire connaît bien Barcelone : il relira la liste des activités avant mise en ligne.
- Commissions activités (via Travelpayouts) : **Tiqets accepté** ✅ ; GetYourGuide refusé pour
  l'instant (pas assez de trafic) → redemander quand les pages guides auront des visiteurs ;
  Viator à tenter.
- 🛠 **Page guide en ligne (première version)** : `ville.html?c=BCN`, accessible depuis le
  panneau « Voir » de Barcelone. Liste filtrable, fiche par activité (réservation, prix,
  pratique, site officiel), carte des activités. Liens Tiqets à ajouter dans `PARTNER_LINKS`
  (`ville.js`). Le bouton « Préparer mon séjour sur mesure » est marqué « Bientôt ».
- 🛠 **Devis (16/10/2026)** : on coche les activités (+), une barre « Mon séjour » donne le
  total ; le devis compte les **voyageurs** (adultes + âge de chaque enfant, choisis dans le
  formulaire de l'accueil, champ « Voyageurs ») avec les tarifs enfants (`tarifs` dans
  `guides/BCN.json`) et, si on vient d'un vol, le prix repéré du vol × voyageurs.
  Carte = même style que la carte des vols. Crédits photo dans « Crédits et mentions ».
- ✅ Les 12 prix douteux vérifiés sur les sites officiels (16/10/2026) ; tarifs enfants complétés
  quand le site les donne (sinon l'enfant est compté au prix adulte). Photo libre pour chaque
  activité, crédits dans « Crédits et mentions » > Photos > Photos des activités.
- 🛠 **Hôtels (16/10/2026)** : partie « Où dormir ? » sur la page guide. Quartier idéal = celui
  qui a le plus d'activités cochées à moins de 20 min à pied (cercle sur la carte), 5 quartiers
  dans `guides/BCN.json` (ne pas parler de quartiers « à éviter »). Gammes en mots : Juste pour
  dormir / Confort / Haut de gamme / Grand luxe. Dates = celles du vol (sinon à choisir).
  Prix réels aux dates : carte Stay22 (option C) dès que le propriétaire aura son identifiant
  `aid` (à mettre dans `STAY22_AID`, `ville.js`) ; en attendant, bouton vers Booking déjà rempli
  (dates, voyageurs, âges, étoiles), sans commission. Le prix de l'hôtel choisi se note à la
  main dans le devis (une carte externe ne peut pas renvoyer son prix au site).
- 🛠 **Hôtels en direct, « comme pour les vols »** : `api/hotels.js` (Vercel) interroge LiteAPI
  (clé dans la variable Vercel `LITEAPI_KEY`, à créer par le propriétaire) : hôtels autour du
  quartier, aux dates et pour les voyageurs (âges des enfants), filtrés par gamme (étoiles).
  Sur la carte : activités choisies en couleur, les autres en gris ; hôtels en pastilles de prix
  par nuit vert / orange / rouge (tiers les moins chers / milieu / plus chers). On touche un
  hôtel → « Choisir cet hôtel » → son prix entre tout seul dans le devis. Recherche seulement sur
  le bouton « Voir les hôtels », gardée 30 min. Sans clé : lien Booking déjà rempli.
  À faire ensuite : bouton « Réserver » (site de réservation LiteAPI à nos couleurs = commission).
- Travelpayouts « Drive » (script qui ajoute tout seul des liens et encarts partenaires) :
  **pas pour l'instant** (perte de contrôle sur le design, script tiers à déclarer pour les
  cookies, peu utile sans trafic). On place les liens Tiqets à la main.

### 13. 🛠 Matchs et événements pendant le séjour
- ✅ (18/10/2026) **Matchs faits** : foot, basket, rugby dans toutes les destinations, source
  gratuite SofaScore (MatchEnDirect et Flashscore n'ont pas d'API ; TheSportsDB gratuit ne donne
  qu'un match ; ESPN n'a pas la Pologne), via `matchs/CODE.json`, mis à jour à la main depuis une session Claude (SofaScore bloque GitHub). Les
  matchs du séjour apparaissent dans « Sport » comme des activités (prix estimé, lien billets).
  Reste : F1/MotoGP, tennis, et les grandes fêtes ci-dessous.
- ✅ (19/10/2026) **Mise à jour automatique** : tâche Claude programmée chaque lundi (Sonnet), car
  SofaScore bloque GitHub et Vercel (403) et l'offre gratuite d'API-Sports ne donne que
  hier/aujourd'hui/demain (payant ≈ 19 $/mois par sport : à reconsidérer si le site rapporte).
  Matchs reportés ou annulés : **retirés** du site (choix du propriétaire : « on n'est pas un site
  de foot »). **Pas de promesse** du genre « d'autres matchs seront annoncés »
  (refusé par le propriétaire).
Sur la page d'une ville, selon les dates du voyageur : « Pendant votre séjour : Barça – Real,
sam. 14 nov. ». À Barcelone : FC Barcelona et Espanyol (foot), Barça et Joventut Badalona
(basket) ; plus F1/MotoGP à Montmeló, tennis en avril. Le match devient une activité à cocher.
- ❓ Source des calendriers : le propriétaire veut **éviter un abonnement payant**.
  Testé : TheSportsDB gratuit = trop limité (5 matchs), complet ≈ 9 $/mois ;
  football-data.org gratuit = foot seulement (clé gratuite à mettre dans les secrets GitHub).
  Pistes gratuites à étudier : calendriers publiés par les clubs/ligues (fichiers .ics),
  sites de calendriers téléchargeables, Euroligue (site officiel).
- À faire **après** la page Barcelone.
- Aussi les **grandes fêtes** aux dates du séjour : Thanksgiving, marchés de Noël (Alsace,
  Allemagne, Europe de l'Est), 14 juillet, Fallas, Oktoberfest…

### 14. 💡 Idées notées après le test du circuit (propriétaire et sa femme)
- **Passeport et documents** nécessaires selon la destination (ex. Londres : passeport +
  autorisation ETA), à afficher dans « Mon voyage ».
- **Restaurants** classés par **moyenne bayésienne** (méthode IMDb, déjà utilisée par le
  propriétaire pour Lyon) : score = v/(v+m) × R + m/(v+m) × C, avec R = note Google,
  v = nombre d'avis, C = note moyenne de l'échantillon (≈ 4,5), m = avis « de référence »
  (≈ 1 000 à 1 500). Peu d'avis → ramené vers C ; beaucoup d'avis → la vraie note compte.
  Exigence : couvrir **presque tous** les restaurants, au minimum tous ceux de plus de
  2 000-3 000 avis (pas seulement une vingtaine de recherches comme pour Lyon).
  Piste : Google Places « Nearby Search » sur une grille qui couvre toute la ville, cases
  redécoupées là où c'est dense ; lancé par une GitHub Action (clé dans les secrets GitHub,
  jamais dans le code) ; attention aux règles Google (mention « Google », pas de stockage
  durable des notes → rafraîchir chaque mois).
  **Méthode retenue (oct. 2026, Barcelone) :** le classement brut favorise les restaurants qui
  demandent des avis en masse (grills argentins, pizzerias touristiques). On part donc des
  adresses **réputées** (guides, Michelin Bib Gourmand, presse), on garde celles dont la note
  Google est bonne (≥ 4,4 en général), et le propriétaire choisit le top 10 à la main. Pas
  d'étoiles Google affichées sur le site ; mise à jour une fois par an.
  Précision du propriétaire : c'est un site de **voyage**, pas un guide culinaire → privilégier
  les adresses **connues et photogéniques** (Instagram, TikTok), avec la note comme garde-fou ;
  3 gammes de prix × 3 restaurants, pas deux restaurants du même genre dans une gamme, pas de
  tapas dans les trois gammes.
- À proposer au fur et à mesure, quand c'est pertinent.

### 5. 💡 Changer d'aéroport de départ (Genève, Marseille…)
Déjà prévu dans le script (variable `ORIGIN`), reste à l'exposer sur le site.

### 6. 💡 Alertes de baisse de prix
Être prévenu quand un prix baisse sur une destination ou une période suivie.

### 7. 💡 Protéger le site (usage perso)
Mot de passe simple à l'ouverture, pour éviter que des inconnus consomment les recherches Ignav.

### 8. 💡 Combler les trous au-delà de 2-3 mois
Les prix « repérés » (Travelpayouts) sont nombreux sur les 2-3 prochains mois, puis rares
(ex. 252 prix aller en novembre, 19 en avril, 2 en août). Idée : pour une destination + une
période courte, un bouton « Chercher en direct sur toute la période » qui interroge Ignav jour
par jour (aller + retour). Coût : environ 2 recherches par jour de la période
(ex. 14 jours ≈ 28 recherches ≈ 0,06 $).

### 9. 🛠 Direction artistique
Pop retenu et appliqué par défaut, version épurée : 3 couleurs (encre bleu nuit, papier
crème, accent corail), avion qui décolle à la place du soleil. Les autres essais restent
visibles via ?da=… (barre d'essai seulement dans ce cas) ; à supprimer une fois validé.

## En attente d'un tiers

- ⏸ **Affiliation Kiwi.com** : demande en cours d'examen chez Travelpayouts (plusieurs jours).
  Si acceptée : coller le modèle de lien dans `KIWI_AFFILIATE_TEMPLATE` (app.js).
  Pas bloquant : le site est pour un usage perso pour l'instant.

## À surveiller

- Ryanair : la vérification en direct (Ignav) n'a pas trouvé le vol Ryanair Lyon → Dublin
  (Aer Lingus proposé à la place). Couverture Ryanair à confirmer.
- Crédit Ignav : 1 000 recherches gratuites, puis ~2 $ / 1 000.

## Fait

- ✅ (22/10/2026) **Nouvel accueil « agence de voyage »** (retour testeurs : on croyait à un comparateur,
  on ne voyait pas les résultats ni le « séjour complet ») : titre « Où partir depuis Lyon ? »,
  destinations affichées dès l'arrivée, filtres en pastilles, fiches « Séjour clé en main » pour
  toutes les villes, carte gardée. Le propriétaire ajustera au fur et à mesure.
- ✅ (21/10/2026) Formulaire, maquette A retenue : la destination passe en dernier, « Une idée de
  destination ? (facultatif) ». Accroche sous le titre : 3 propositions montrées, choix en attente.
- ✅ (21/10/2026) Liens Tiqets sur Varsovie (POLIN, Vodka), Lisbonne (Hiéronymites, Belém, Pena, croisière,
  fado in Chiado, arc de la rue Augusta) et Bordeaux (Cité du Vin, Bassins des Lumières, croisière, musée du Vin,
  Médoc, Saint-Émilion). Pas d'offre Tiqets au bon prix pour : château royal, Insurrection, Copernic, Wilanów
  (visite privée seulement), château Saint-Georges, Océanarium (combinés seulement). → à couvrir avec Viator.
- ✅ (21/10/2026) Londres : liens Tiqets sur 8 activités (Westminster, Tour de Londres, Tower Bridge,
  Saint-Paul, Kew, Harry Potter avec bus, Tamise, Windsor). Sans lien : London Eye et Churchill War Rooms
  (Tiqets = formules plus chères), Greenwich, Arsenal, comédie musicale ; musées et Sky Garden gratuits.
- ✅ (21/10/2026) Liens affiliés Tiqets en ligne sur 12 activités de Barcelone (bouton « Réserver »).
  Sans lien : Picasso (Tiqets = visite guidée plus chère), téléphérique de Montjuïc et Tibidabo (absents de Tiqets).
- ✅ (18/10/2026) Prix des vols **pour tout le groupe** (choix « Voyageurs ») : pastilles de la carte,
  légende, liste, barre des mois, panneau « Voir » et budget max ; « soit X € / pers. » en petit,
  et « / pers. » sur le prix de chaque vol. Les bébés (moins de 2 ans, sur les genoux) ne sont pas
  comptés dans le prix du vol. Changer les voyageurs relance la recherche. (Le propriétaire avait
  cru à 162 € pour 4 alors que c'était 162 € par personne.)

- ✅ (21/10/2026) **Page guide de Dubaï** (`guides/DXB.json`), préparée en autonomie : 29 activités
  (3 tendance : Aura Skypool, Kite Beach et la vue sur Burj Al Arab, Miracle Garden ; excursions à Abou Dhabi,
  Hatta, safari ; courses de Meydan à la place d'un club de foot, peu suivi), 18 restaurants (note pondérée,
  C = 4,53, ~1 600 restaurants lus via Wanderlog ; Michelin 2026 : Orfali Bros 2 étoiles, Tasca et 11 Woodfire
  1 étoile ; 3Fils, Al Khayma, Shabestan, Bait Maryam, Kinoya, Hawkerboi Bib Gourmand), 5 quartiers.
  Prix convertis à 1 € ≈ 4,1 AED. **Contexte à connaître** : guerre États-Unis/Israël – Iran en 2026 (aéroport
  de Dubaï touché en mars) ; France Diplomatie : « vigilance renforcée » (10/09/2026), pas de déconseil.
  Beaucoup de lieux ont fermé ou réduit leur activité : **musée du Futur fermé jusqu'au 1er trimestre 2027**
  et Ain Dubai (ouverture incertaine) écartés ; restaurants fermés écartés (Ossiano, Al Muntaha, Hakkasan…).
  Saisonniers : Miracle Garden (8 oct.-31 mai), Global Village (14 oct.-mai), Meydan (6 nov.-27 mars).
  Ravi et Al Mallah (institutions) écartés : note Google 4,0 ; Bu Qtair (4,2) aussi.
  **Réseaux sociaux non lancés** (crédit Apify du mois épuisé) : badges « Tendance » d'après le web
  (classement Instagram 2026, guides photo) ; à relancer en novembre (Dubai / Dubaï).
  Prix à confirmer (`a_verifier`) : Burj Khalifa, aquarium, Al Shindagha, Etihad, mosquée de Jumeirah,
  Dubai Frame, The View, Aura, Burj Al Arab, safari, mosquée Cheikh Zayed, Hatta, Miracle Garden, Ski Dubai,
  Aquaventure, Meydan. Restaurants : prix et délais estimés ; vérifier qu'Al Hadheerah et At.mosphere sont ouverts.
  Positions : Nominatim (OpenStreetMap) ; 3Fils, Kinoya, 11 Woodfire et Arabian Tea House placés à la main.
- ✅ (21/10/2026) **Page guide de Vienne** (`guides/VIE.json`), préparée en autonomie : 28 activités
  (6 tendance : KHM pour son café sous la coupole, salle d'apparat de la Bibliothèque nationale, maison
  Hundertwasser, Karlskirche, canal du Danube, Palmenhaus et maison des papillons ; match du Rapid), 18 restaurants
  (note pondérée, C = 4,39, 860 restaurants lus via Wanderlog ; Michelin 2026 : Steirereck et Amador 3 étoiles,
  Konstantin Filippou 2 étoiles, JOLA 1 étoile, Mochi et Chez Bernard Bib Gourmand), 5 quartiers. Saisonniers :
  marché de Noël (13 nov.-26 déc. 2026), Schweizerhaus (mi-mars à fin oct.), Wachau en bateau (avril-oct.),
  baignade (été). Musée Sissi fermé jusqu'au 18/11/2026 (noté dans la fiche).
  Réseaux sociaux (Apify, 21/10, après rechargement du compte) : Demel (3 sources, ~30 citations) remplace
  Ilona Stüberl (aucune), Chez Bernard (2 sources) remplace Tian Bistro (aucune), Palmenhaus et papillons
  (3 sources) remplace la Maison de la Musique (aucune). Tendance restaurants : Café Central, Demel, Figlmüller,
  Chez Bernard, Das LOFT. Écartés malgré le buzz : Café Sacher (note 3,9), Onyx (TikTok seulement).
  Pièges relevés : vendeurs de concerts déguisés en Mozart (déjà dans la fiche concert), file chez Demel.
  Prix confirmés : Schönbrunn (30 €, dépliant officiel 2026), Belvédère (23 €), Hofburg (20 €). Les autres sont
  marqués `a_verifier`. Restaurants : prix et délais estimés, à vérifier.
- ✅ (19/10/2026) **Page guide de Bordeaux** (`guides/BOD.json`), préparée en autonomie : 24 activités
  (3 tendance : miroir d'eau, Vieux Bordeaux et Grosse Cloche, Chartrons ; match de l'UBB, rugby), 18 restaurants
  (note pondérée, C = 4,39, 488 restaurants lus via Wanderlog ; Michelin 2026 : Pressoir d'Argent et Maison
  Nouvelle 2 étoiles, Gabriel, Cent 33 et Soléna 1 étoile, Mets Mots Bib Gourmand), 5 quartiers.
  Réseaux sociaux : TikTok n'a rien rendu cette fois, signal faible (Instagram, YouTube, Reddit) → peu de badges.
  Écartés : tour Pey-Berland (fermée jusqu'à nouvel ordre, foudre), musée des Beaux-Arts (travaux), Girondins
  (descendus en National 2). Flèche Saint-Michel rouverte en juin 2026 (avril à octobre).
  Prix à confirmer (`a_verifier`) : Cité du Vin, Bassins des Lumières, flèche Saint-Michel, Grand-Théâtre, musées
  (Aquitaine, CAPC, MADD, Muséum, Vin et Négoce), croisière, École du vin, UBB, Saint-Émilion, Pilat, Médoc.
  Photos des restaurants : surtout des photos d'illustration (seule La Tupina a une vraie photo libre).
- ✅ (19/10/2026) **Page guide de Londres** (`guides/LON.json`), préparée en autonomie : 28 activités
  (4 tendance : Horizon 22, Camden, Primrose Hill, St Dunstan in the East), 18 restaurants (note pondérée,
  C = 4,53, ~1 900 lieux lus via Wanderlog ; Michelin 2026 : The Ledbury et Sketch 3 étoiles, Brat et St. John
  1 étoile, Padella, BAO, Kiln et Berenjak Bib Gourmand), 5 quartiers. Prix convertis à 1 £ ≈ 1,15 €.
  Réseaux sociaux : TikTok n'a rien renvoyé ce jour-là (Instagram, YouTube et Reddit seulement).
  Prix à confirmer (`a_verifier`) : abbaye de Westminster, Tour de Londres, Tower Bridge, Saint-Paul,
  London Eye, Churchill War Rooms, Greenwich, Kew, studios Harry Potter, comédie musicale, bateau, Arsenal, Windsor.
  Fish and chips : The Golden Hind (institution, note 4,3 seulement ; Poppies écarté, 4,1-4,2).
- ✅ (19/10/2026) **Page guide de Lisbonne** (`guides/LIS.json`), préparée en autonomie : 27 activités
  (5 tendance : MAAT, LX Factory, belvédères de Senhora do Monte et Santa Luzia, Pilier 7), 18 restaurants
  (note pondérée, C = 4,42, 852 restaurants lus via Wanderlog ; Michelin 2026 : Belcanto et Fifty
  Seconds 2 étoiles, Encanto et Sála 1 étoile, Pigmeu et Canalha Bib Gourmand), 5 quartiers.
  Écartés car fermés : ascenseur de Santa Justa et funiculaires de la Glória, de Bica et du Lavra
  (arrêtés depuis l'accident de 2025), musée de l'Azulejo et musée d'Art ancien (travaux).
  Prix confirmés sur les sites officiels : château (17 €), Padrão (10 €), Cristo Rei (10 €), fado (23 €).
  Prix à confirmer (`a_verifier`) : Hiéronymites, tour de Belém, MAAT, Océanarium, Carmo, Gulbenkian,
  Pena, Cascais, croisière, Pilier 7, Benfica, téléphérique, surf, arc de la rue Augusta.
  Restaurants à surveiller : Casa do Alentejo et Taberna da Rua das Flores (très connus mais note 4,2).
- ✅ (18/10/2026) **Page guide de Varsovie** (`guides/WAW.json`), préparée en autonomie (le
  propriétaire ne connaît pas la ville) : 26 activités sans activité « manger » (3 tendance : Varso
  Tower, jardin de la BUW, musée du Néon), 18 restaurants (note pondérée, C = 4,51, notes Google
  lues via Wanderlog), 5 quartiers. Musée Chopin écarté (fermé toute l'année 2026).
  Recoupé ensuite avec TikTok, Instagram, YouTube et Reddit (Apify, ~2 $) : Bar Bambino et Lekko
  entrent, Prasowy et Vege Miasto sortent (le match du Legia, retiré par erreur, est remis : un match du club populaire dans chaque ville), badges « Tendance » limités aux lieux
  vus sur 2 sources. À revoir : Babka (cuisine polonaise, Koneser, très partagée mais pas de note
  fiable), Włoski Strajk (risque d'expulsion du local).
  Prix à confirmer sur place (`a_verifier`) : tour Sainte-Anne, terrasse du Palais de la Culture,
  musée d'art moderne, visite Nysa.

- ✅ (18/10/2026) « Rechercher » fait défiler jusqu'aux résultats (iPhone : la carte puis la liste ;
  PC : la liste), un testeur croyait que le bouton ne faisait rien.
- ✅ (17/10/2026) « Où ? » : on tape une ville ou un pays (sans se soucier des accents), liste de
  suggestions avec drapeaux (un pays montre aussi ses villes), croix pour revenir à « N'importe où ».
- ✅ (17/10/2026) Point 15, dates et durée : les dates passent avant la durée ; encadré « On cherche
  l'aller-retour le moins cher entre le 2 et le 7 nov., pour la durée que vous choisissez » tant
  que la durée n'est pas choisie, puis phrase récap au-dessus de « Rechercher » ; case « Partir et
  revenir à ces dates exactes » (aller-retour avec une période seulement) : aller le 1er jour,
  retour le dernier, durée cachée.
- ✅ (16-17/10/2026) Circuit « Mon voyage » de Barcelone en 5 étapes : Vol → Activités → Restos →
  Hôtel → Réserver ; flèche de retour ; 18 restaurants (3 gammes, badges, photos libres) ;
  Chök et Mirablau ajoutés aux activités ; carte avec seulement les lieux choisis ; hôtels dans
  toute la ville ; transports à pied dans la fiche hôtel ; noms des rues sur la carte.
- ✅ (17/10/2026) Accueil : formule « Vol + Activités + Restos + Hôtel = le prix total » à la place
  des 4 cases (qui ressemblaient à des boutons).
- ✅ (17/10/2026) Recherche : une ville n'apparaît que si un séjour a la durée choisie (avant,
  Koutaïssi sortait avec 4 nuits pour « une semaine »). Les suggestions « Moins cher : 4 nuits »
  restent sous le résultat principal.
- ✅ Site statique + carte + liste + filtres, mise à jour quotidienne (GitHub Actions)
- ✅ Carte en français, design refait (mobile d'abord)
- ✅ Prix « vu il y a X jours », préférence pour les prix récents
- ✅ Vérification du prix en direct au clic (Vercel + Ignav) et réservation sur Kiwi.com
- ✅ Barre de recherche (option A) : aller-retour / aller simple, où (facultatif), quand
  (facultatif, 12 mois), nuits ; suggestions d'autres durées moins chères ; vérification en
  direct des deux vols ; section « Les meilleures affaires » retirée
- ✅ Une seule recherche pilote toute la page : carte + liste suivent l'aller-retour / aller simple
  (prix total A/R sur la carte), durée choisie à l'arrivée (1 nuit / court séjour / semaine / plus,
  mémorisée), pays + tri au-dessus des résultats ; anciens filtres mois/budget retirés
- ✅ « Où ? » : pays (ordre alphabétique) puis ville facultative
- ✅ Fiches « donner envie » pour les 88 villes (photo, texte vendeur, météo du mois, durée de vol)
- ✅ Carte refaite avec MapLibre seul (points fixes au zoom, couleurs du site)
- ✅ Barre des mois au-dessus des destinations (quand « Quand ? » est vide) : meilleur prix de
  chaque mois, on touche un mois ou on glisse la liste pour changer de mois sans toucher aux
  réglages. Utilise seulement les prix déjà repérés (aucune recherche en direct en plus).
