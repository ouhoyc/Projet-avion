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
  Istanbul, Tel Aviv, Dubrovnik (et source ancienne : 1971–2000).
- Jours de pluie absents de la source : Stockholm → seulement la température.
- Montréal : jours de pluie seulement (neige non comptée), seuil ≥ 0,2 mm.
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


### 17. 💡 Assurance voyage en lien partenaire (noté le 25/10/2026, à faire plus tard)
Obligatoire en Géorgie depuis 2026 (carte Vitale et carte européenne d'assurance maladie non valables hors UE) ;
utile partout. Où l'afficher : dans l'encadré rouge « À savoir avant de partir » des pays où elle est obligatoire, et
une ligne « Assurance voyage » à l'étape 5 « Réserver » pour toutes les villes.
- **Chapka** (courtier français, groupe Aon) — conseillé : 10 % du prix, suivi 90 jours, relevé et virement mensuels ;
  demande à communication@chapka.com (guide de l'affiliation : chapka.fr/img/textes/1431.pdf).
- **EKTA** (dans Travelpayouts) : 20 %, 30 jours ; vente aux Français et site en français non vérifiés.
- **Heymondo** (site en français) : taux non publié, 30 jours.
- Règles : un statut est nécessaire (auto-entrepreneur, association, société) ; l'affilié n'a **pas le droit de vanter
  ni de vendre** l'assurance (profession réglementée, ORIAS), seulement dire qu'il faut être assuré et que des solutions
  existent ; mention « lien partenaire » / « publicité » à côté du lien.
- À faire par le propriétaire : s'inscrire (Chapka ou EKTA) et récupérer son lien ; ensuite affichage + captures.

### 11. ⏸ Nom et logo (mis de côté le 16/10/2026)
- **Piste du propriétaire (25/10/2026) : « Vaya »**, avec une nouvelle direction artistique (à venir). Domaines vérifiés
  le 25/10/2026 (registre Vercel) : **pris** vaya.com (Mada Communications, télécoms), vaya.fr, vaya.eu, vaya.travel,
  vaya.app, vaya.io, vaya.co, vaya.me, vaya.ai, getvaya.com, govaya.com, vayatravel.com, vayavoyage.com, vayavoyages.com,
  myvaya.com, heyvaya.com. **Libres** : vaya.voyage (≈ 10 $ la 1re année puis ≈ 52 $/an), vaya.vacations, vaya.holiday,
  vaya.guide, vaya.club, vaya.fun, vaya.flights, vaya-voyage.com et vaya-travel.com (≈ 11 $/an), vayavoyage.fr,
  vayavoyages.fr, vaya-voyages.fr, govaya.fr, vayaapp.fr, vayalyon.fr/.com. Rien acheté. Le critère « le .com doit être
  libre » n'est pas rempli pour vaya.com. À faire avant de choisir : marques (INPI, EUIPO), App Store et Google Play.
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
- Tunis (`guides/TUN.json`) : le 1er janvier 2027, les entrées des musées et sites tunisiens augmentent (Bardo 45 dinars,
  Carthage, El Jem et Kairouan 30, billet combiné Bardo + Carthage 70) : mettre à jour les prix de la fiche.

## Fait

- ✅ (24/10/2026) **Formalités « À savoir avant de partir »** étendues (validé par le propriétaire) : Londres (passeport +
  ETA 20 £), Tunis (passeport), Marrakech (passeport, tampon à vérifier), Dubaï (passeport 6 mois), Istanbul (carte
  d'identité ou passeport valable 150 jours), d'après France Diplomatie (pages du 15/09 et 05/10/2026). Étape ajoutée à la
  recette de `CLAUDE.md` pour les prochains guides hors Union européenne.
- ✅ (24/10/2026) Gammes de restaurants : la fourchette de prix affichée au-dessus de chaque gamme est calculée sur les
  restaurants de la ville (`gammeRange`, `ville.js`) au lieu d'être la même partout (« moins de 30 € », « à partir de 50 € ») :
  Annaba « 8 à 18 € » en gamme moyenne, Paris « 30 à 70 € ». Rien à faire pour les nouvelles villes.
- ✅ (24/10/2026) **Visa et prix des matchs** (validé par le propriétaire) : nouveau champ `avant_de_partir` du guide,
  affiché à l'étape Vol dans un encadré « À savoir avant de partir » ; rempli pour Alger, Annaba et Oran (visa
  obligatoire pour les Français, ≈ 110 €, dépôt au consulat, compter jusqu'à 3 semaines). `prix_match` ajouté à Tunis
  (8 €) et Tirana (4 €), comme le prix de l'activité du club local.
- ✅ (25/10/2026) **Forfait Vercel « Deployment storage » à 100 %** (10 Go gratuits ; une copie du site ≈ 180 Mo, plus de
  200 mises en ligne en octobre, et une copie gardée par branche GitHub). Fait : copies d'essai des branches désactivées
  (seule `main` est mise en ligne), photos recompressées (182 → 152 Mo, qualité 72). À faire par le propriétaire :
  supprimer sur GitHub les 9 vieilles branches (toutes inutiles : déjà dans `main` ou brouillons de villes terminées).
- ✅ (25/10/2026) **Dates fixes ou flexibles** : les clients croyaient donner leurs dates exactes alors que le site les
  prenait pour une période (Barcelone du 13 au 15 pour « 13 → 16 »). Choix du propriétaire (options A + B) : le
  calendrier demande « J'ai mes dates » ou « Je suis flexible » ; avec des dates fixes, on montre les vols à ces dates
  et on suggère moins cher à 1-2 jours près, sans l'imposer.
- ✅ (25/10/2026) **Parcours guidé à l'arrivée** (choix du propriétaire) : à chaque nouvelle visite, 1. dates ou
  période, 2. durée (si dates flexibles), 3. voyageurs, 4. budget (champ libre, facultatif), 5. une idée de lieu
  (facultatif), puis les résultats ; style actuel (à reprendre avec la direction artistique de Vaya).
- ✅ (25/10/2026) Encadré « À savoir avant de partir » en **fond rouge, texte blanc** (demande du propriétaire : l'orange
  pâle ne se remarquait pas). Koutaïssi : « assurance voyage » précisé (la carte Vitale ne marche pas en Géorgie).
- ✅ (25/10/2026) **Page guide de Koutaïssi** (`guides/KUT.json`, champ `ville` : pas de vol en ce moment), préparée en
  autonomie : 20 activités (Bagrati, Gelati, Motsameta, pont Blanc, fontaine de Colchide, téléphérique, musée, jardin
  botanique, quartier juif, dîner chez Baia ; grotte de Prométhée, Sataplia, canyons de Martvili et d'Okatse, Kinchkha,
  excursion organisée « canyons et grotte » ; sanatoriums et bain de la source n° 6 de Tskaltoubo ; Chiatoura et pilier de
  Katskhi ; match du Torpedo), 18 restaurants (note pondérée, C = 4,51, ~240 lieux lus sur Google Maps + 135 via 12 listes
  Wanderlog ; Gault & Millau Géorgie : Palaty 2 toques, Paolo sélection 2026 ; pas de Michelin en Géorgie), 5 quartiers,
  formalités (carte d'identité ou passeport, **assurance maladie obligatoire** depuis 2026, 30 000 lari). Prix des aires
  protégées relevés pour avril 2026 (Prométhée et Martvili 40 lari, Sataplia et Okatse 30, Kinchkha 20 ; 1 € ≈ 2,91 lari).
  **Réseaux sociaux (Apify) sautés** (petite destination) : badges tendance d'après les guides (Wander-Lush, Wanderlog).
  Écartés : Sisters et El Depo (note 4,2, service en baisse), Sormoni (fermé l'hiver, prix flous). Prix estimé : match du
  Torpedo (billetterie géorgienne illisible d'ici). Sanatorium Medea fermé depuis un accident en juillet 2026.
- ✅ (26/10/2026) **Page guide de Vilnius** (`guides/VNO.json`), préparée en autonomie : 23 activités (vieille ville et rue Pilies,
  cathédrale avec clocher et cryptes, palais des Grands-Ducs, tour de Gediminas, Užupis, Sainte-Anne, porte de l'Aurore, université,
  Saints-Pierre-et-Paul, colline des Trois-Croix, musée des Occupations (ex-KGB), MO Museum, tour de télévision, rue des Écrivains,
  jardin des Bernardins, cimetière de Rasos, musée litvak et synagogue chorale, prison de Lukiškės 2.0, vol en montgolfière (140 €),
  falaise de Pūčkoriai, Europos Parkas, château de Trakai ; basket : match du Rytas, club « Rytas Vilnius »), 18 restaurants (note
  pondérée, C = 4,41, ~430 restaurants lus via 84 listes Wanderlog ; Michelin 2026 : Džiaugsmas, Nineteen18 et Deep Roots 1 étoile,
  Gaspar's, El Gato Negro, Augustin et Le Travi Bib Gourmand), 5 quartiers, 2 liens Tiqets (clocher de la cathédrale : même prix ;
  Europos Parkas : 12 € au lieu de 14 €). Pas d'encadré formalités (Union européenne). **Réseaux sociaux (Apify) pas lancés** (crédit
  du mois épuisé) : badges tendance d'après les guides et blogs. Écartés : Demo (étoilé, mais absent du site Michelin et de Google Maps
  sous ce nom), musée du Jouet (horaires trop réduits), opéra et bières (pas de photo libre convenable), Kernavė (prix introuvable).
  Prix estimés : visite de Lukiškės (22 €, tarif 2025), billets du Rytas, tarifs enfants de Trakai et du musée juif. À savoir : clocher
  Saint-Jean fermé l'hiver et travaux dans la grande cour de l'université jusqu'à fin 2027 ; la salle du Rytas s'appelle désormais
  « Arena Vilnius » (Ozo g. 14).
- ✅ (25/10/2026) **Page guide de Dublin** (`guides/DUB.json`), préparée en autonomie : 28 activités (Trinity et Livre de Kells,
  Guinness, Temple Bar, Kilmainham, EPIC, cathédrales Saint-Patrick et Christ Church, musée d'archéologie, National Gallery,
  Little Museum, 14 Henrietta Street, MoLI, distilleries Jameson et Teeling, St Stephen's Green, Merrion Square, Phoenix Park, zoo,
  Glasnevin, Howth, phare de Poolbeg, Killiney et Dalkey, Malahide ; excursions Glendalough et falaises de Moher (Wild Rover Tours,
  43 et 75 €) ; Croke Park, match du Leinster (club « Leinster Rugby »), soirée musique traditionnelle), 18 restaurants (note
  pondérée, C = 4,41, ~1 000 restaurants lus via 250 listes Wanderlog ; Michelin 2026 : Chapter One et Patrick Guilbaud 2 étoiles,
  Variety Jones et Glovers Alley 1 étoile, Pichet et BIGFAN Bib Gourmand), 5 quartiers, 6 liens Tiqets (Guinness, EPIC,
  Saint-Patrick, Little Museum, MoLI, Teeling : même prix qu'en officiel ; Jameson et Christ Church plus chers sur Tiqets, sans lien).
  Pas d'encadré formalités (Union européenne : carte d'identité suffit). **Réseaux sociaux (Apify) pas lancés** : crédit du mois
  toujours épuisé (lancement du 25/10 refusé, 0 $ dépensé) ; badges tendance d'après les guides et la presse.
  Écartés car fermés : **château de Dublin et Chester Beatty** (fermés jusqu'au 31/12/2026 pour la présidence irlandaise de l'UE :
  **à ajouter en janvier 2027**), musée d'histoire naturelle (rénovation). Écartés : Leo Burdock (note 4,1), Gallaghers Boxty
  House (doublon de genre avec The Winding Stair). Prix estimés : billets du Leinster, tarifs enfants du Livre de Kells, du Little
  Museum, de MoLI et de Glasnevin (non publiés).
- ✅ (25/10/2026) **Liste complète des vols directs** (`routes.json`, `scripts/fetch-routes.mjs`) : lue chaque matin sur
  Wikipédia (en anglais, page de l'aéroport, tableau des compagnies), codes IATA via Wikidata, gratuit. Les villes sans
  prix repéré (Koutaïssi, lignes d'été…) apparaissent quand même : dans « Une idée ? » et en bas de la liste (« N autres
  vols directs, prix pas encore repérés »), avec « Voir les prix » (recherche Aviasales aux dates choisies). 143 lignes
  connues le 25/10/2026, dont ~60 villes sans prix. Prochaine étape possible : prix complets avec Ignav (≈ 50 $/mois).
- ✅ (24/10/2026) **Page guide de Bruxelles** (`guides/BRU.json`), préparée en autonomie : 27 activités (tendance :
  Grand-Place, Atomium, fresques BD ; musées Old Masters, Magritte, Horta, BD, MIM, Sciences naturelles ; Cantillon,
  Belgian Beer World, Toone ; match d'Anderlecht ; excursions Bruges, Gand, Waterloo), 18 restaurants (note pondérée,
  C = 4,28, ~950 restaurants lus via 107 listes Wanderlog ; Michelin 2026 : Bozar 2 étoiles, Comme chez Soi, Villa in the
  Sky, Kamo, Humus x Hortense 1 étoile, Selecto, Osteria Bolognese, Nénu Bib Gourmand ; tendance : Fin de Siècle,
  Noordzee), 5 quartiers, 3 liens Tiqets (Atomium, Mini-Europe, Belgian Beer World, même prix qu'en officiel).
  **Réseaux sociaux (Apify) pas lancés** : crédit du mois épuisé (« Monthly usage hard limit exceeded » au lancement
  d'Oran) ; badges tendance décidés d'après les guides et la presse. Écartés : Maison Antoine et Maison Dandoy (note
  Google 4,1 et 3,8), Chez Léon et Aux Armes de Bruxelles (rue des Bouchers, 3,9 et 4,1), La Villa Lorraine (étoile
  perdue en 2026), Autoworld (prix incertain). À savoir : restaurant du MIM fermé (rénovation), Mini-Europe fermé en
  janvier-février, Osteria Bolognese fermée jusqu'au 2 novembre 2026. Prix des Beaux-Arts et de Magritte (13 €,
  combiné 20 €) lus via la presse (site du musée inaccessible d'ici).
- ⏳ **Tendances à faire plus tard** (au renouvellement du crédit Apify) : Bruxelles, Dublin, Vilnius.
- ✅ (24/10/2026) **Page guide d'Oran** (`guides/ORN.json`), préparée en autonomie : 18 activités (tendance d'après les réseaux
  sociaux, 2 sources au moins : Santa Cruz, front de mer, place d'Armes, Sidi El Houari, cathédrale-bibliothèque du Sacré-Cœur,
  mosquée Ben-Badis, musée Zabana, Médina Jdida, corniche d'Aïn El Turck, Andalouses, Madagh, bateau vers l'île Plane ; promenade
  de Létang, Kristel, théâtre Abdelkader-Alloula, visite guidée à pied, excursion à Tlemcen ; match du Mouloudia, club « MC Oran »),
  18 restaurants, 5 quartiers (centre, front de mer, Gambetta, Akid Lotfi, Canastel : tous à moins de 6 km), pas de lien Tiqets.
  Pas de champ `ville` (vols Transavia en ce moment) ; `prix_match` 4 €. **Wanderlog ne donne presque rien pour Oran** (page
  `placePageGeos` vide, 9 listes et ~90 lieux) : notes et positions relevées sur Google Maps (quadrillage, ~1 670 lieux), moyenne
  pondérée de la ville C = 4,03. Prix : 1 € ≈ 151 DA ; Santa Cruz 60 à 110 DA, musée Zabana 200 DA (gratuit moins de 16 ans),
  théâtre ≈ 300-500 DA ; prix des restaurants estimés (rarement publiés en Algérie : avis, vidéos, moyenne Numbeo d'un dîner
  ≈ 1 500 DA). Écartés : Les Jumelles (très partagé sur TikTok mais note 3,2), El Bey (l'adresse semble être devenue « Fish
  house »), MAMO (souvent fermé d'après les avis récents), îles Habibas (réserve, débarquement non autorisé), téléphérique de
  Santa Cruz (à l'arrêt). Mosquée du Pacha (fermée depuis 2004) et palais du Bey (restauration) : vus de l'extérieur dans
  Sidi El Houari. Le Mouloudia est revenu au stade Ahmed-Zabana en 2025 (certains matchs à Miloud-Hadefi).
- ✅ (24/10/2026) **Page guide d'Annaba** (`guides/AAE.json`), préparée en autonomie : 18 activités (tendance d'après les
  réseaux sociaux, 2 sources au moins : Hippone et son musée, basilique Saint-Augustin, Cours de la Révolution, corniche
  et plage Chapuis, plage d'Aïn Achir, Cap de Garde, téléphérique, Seraïdi ; vieille ville et mosquées, cascades de
  l'Edough, criques en kayak, parapente, théâtre Azzedine-Medjoubi ; match de l'USM Annaba, club « USM Annaba » ;
  excursions Chetaïbi, parc national d'El Kala, Guelma + cascade de Hammam Debagh), 18 restaurants, 5 quartiers,
  pas de lien Tiqets (rien en Algérie). Champ `"ville": "Annaba"` (pas de vol Lyon–Annaba en ce moment) et `prix_match` 4 €.
  **Wanderlog ne connaît que 2 lieux à Annaba** : les notes et les positions viennent d'un quadrillage de Google Maps
  (affichage limité, mais notes et nombre d'avis lisibles) — ~550 lieux relevés, moyenne pondérée de la ville C = 3,92
  (encore plus bas qu'Alger : garde-fou à 4,0). Prix : 1 € ≈ 151 DA ; billet du site + musée d'Hippone ≈ 200 DA
  (gratuit moins de 16 ans), téléphérique 50 DA le trajet (remis en service en juillet 2025), parapente à partir de
  6 000 DA, dîner de trois plats ≈ 2 150 DA en moyenne dans la ville. Écartés : El Hadja à Seraïdi (très connu mais
  note 3,7), Village de Neige (3,4) et Donatella (3,5) malgré leur succès sur TikTok, citadelle hafside (restauration
  relancée, fermée au public). Réseaux sociaux lancés une fois (Apify).
- ✅ (24/10/2026) **Page guide d'Alger** (`guides/ALG.json`), préparée en autonomie : 22 activités (tendance d'après les
  réseaux sociaux, 2 sources au moins : Casbah, Palais des Raïs, Notre-Dame d'Afrique, Maqam Echahid, Jardin d'Essai,
  Beaux-Arts, Bardo, Grande Mosquée, Tipaza ; Dar Mustapha Pacha, mosquées de la place des Martyrs, musée des Antiquités,
  MaMa, Grande Poste et boulevards, Sablettes, Théâtre national / Opéra, Sidi Fredj, Tamentfoust, visite guidée ; match du
  Mouloudia, club « MC Alger » ; excursions Tipaza + Tombeau de la Chrétienne, Cherchell, Chréa), 18 restaurants (note
  pondérée, C = 4,03, 662 fiches de lieux Wanderlog lues une par une ; pas de Michelin ni de 50 Best en Algérie ; Mim du
  chef Rabah Ourrad distingué par La Liste 2023 ; tendance : Le Roi de la Loubia, Le Fidélia, Sapori, La Presqu'île,
  Sfindja ; institutions : Roi de la Loubia, Milk Bar, El Djenina, Auberge du Moulin, El Daqdaq), 5 quartiers, pas de lien
  Tiqets (rien à Alger). Réseaux sociaux lancés une fois (Apify ; Reddit hors sujet). Prix : 1 € ≈ 151 DA au taux
  officiel ; musées nationaux ≈ 200 DA (gratuit moins de 16 ans), Palais des Raïs 200 DA (fermé le dimanche), Tipaza
  110 DA, téléphériques ≈ 30 DA. Les notes Google d'Alger sont basses (moyenne 4,03) : garde-fou ramené à ≈ 4,0.
  Les sites officiels algériens (.dz) ne répondent pas d'ici et les prix des restaurants sont rarement publiés :
  fourchettes tirées des avis récents et des vidéos (ex. Fidélia plats 1 000-2 500 DA). Montée au minaret de la Grande
  Mosquée : tarif introuvable, fiche « à demander à l'accueil ». Nouveau champ `prix_match` du guide (billet de foot
  moyen du pays, 4 € à Alger) : sans lui les matchs affichaient 25 €. Corrigé aussi : « Près d'Alger-Centre » et
  « Photo d'Alger » (élision). Écartés : Citadelle (encore en partie en travaux), café Malakoff (ouverture non confirmée),
  hammam (aucune adresse fiable pour un visiteur), Sidi Fredj comme quartier d'hôtels (trop loin : la recherche « dans
  toute la ville » est limitée à 6 km). À dire aux clients : visa obligatoire pour les Français.
- ✅ (23/10/2026) **Page guide de Tirana** (`guides/TIA.json`), préparée en autonomie : 24 activités (tendance d'après les
  réseaux sociaux : Pyramide, téléphérique du Dajti, mosquée Namazgah, soirée Albanian Night ; Bunk'Art 1 et 2, Maison des
  Feuilles, Blloku et Postbllok, Nouveau Bazar, château, Grand Parc, Mère Albanie ; match du KF Tirana, club « KF Tirana » ;
  excursions Bovilla, Krujë, Berat, Durrës, Pëllumbas, Shkodër ; visite à pied au pourboire), 18 restaurants (note pondérée,
  C = 4,56, ~900 lieux lus via 103 listes Wanderlog ; pas de Michelin en Albanie ; Mullixhiu sélection « 50 Best Discovery »,
  gardé malgré sa note 4,2 ; tendance : Salt, Mrizi i Zanave, Folium, Sky Club, In's ; institutions : Met Kodra, Oda, Era,
  Komiteti), 5 quartiers, pas de lien Tiqets (rien à Tirana). Réseaux sociaux lancés une fois (Apify). Prix (1 € ≈ 91 lek) :
  Bunk'Art 900 lek (espèces), Maison des Feuilles 700 lek (moins de 12 ans gratuit), Dajti 1 500 lek A/R (fermé le mardi),
  Albanian Night 3 800 lek (6 000 avec dîner), Onufri à Berat 400 lek (musées fermés le lundi de novembre à avril), KF Tirana
  300 à 1 000 lek. Écartés : musée national d'histoire (fermé jusqu'en 2028) et Galerie nationale (fermée pour travaux),
  château de Petrela et marché aux puces (infos invérifiables), OPA (chaîne). Bati, très bien noté, est en fait un milieu de
  gamme (carte relevée) : pas retenu, Kripë dhe Piper couvre le poisson.
- ✅ (23/10/2026) **Page guide de Lanzarote** (`guides/ACE.json`), préparée en autonomie : première **île** du site
  (`"ile": true` : hôtels cherchés autour du lieu choisi, « Autres lieux », « voiture de location » ; nom « Lanzarote »
  au lieu d'« Arrecife » dans `data.json` et `CITY_NAMES`). 27 activités (6 tendance d'après les réseaux sociaux :
  Timanfaya, El Golfo, Jameos del Agua, Papagayo, La Graciosa, LagOmar ; centres de César Manrique, Los Hervideros,
  Janubio, La Geria et El Grifo, Teguise et son marché du dimanche, surf à Famara, plongée au Museo Atlántico, catamaran,
  Caldera Blanca, excursion à Fuerteventura, Rancho Texas pour les enfants), 18 restaurants (note pondérée, C = 4,39,
  ~1 150 lieux lus via 93 listes Wanderlog ; Michelin : Kamezí 1 étoile, Lilium, Tacande, SeBE, Colacho et Palacio Ico
  sélectionnés ; Soleil Repsol : Lilium, Palacio Ico ; soletes Repsol pour les petits prix), 5 lieux pour dormir
  (Puerto del Carmen, Playa Blanca, Costa Teguise, Arrecife, Caleta de Famara). Pas de match : l'UD Lanzarote joue
  dans les divisions inférieures. Réseaux sociaux (Apify, un seul lancement) : signal net pour les sites, faible pour les restaurants
  (Casa Rafa et Kamezí seulement). Écartés pour note trop basse : El Diablo (4,1, cité dans la fiche Timanfaya),
  Bar Stop (4,1), El Risco (4,2), Bogavante (4,2).
  Prix officiels relevés : Timanfaya 30 € (billets en ligne seulement, créneau fixe), Jameos et Cueva de los Verdes 17 €,
  Mirador del Río et jardin de cactus 9 €, château de San José 5,40 € (enfants 7-12 ans à moitié prix, moins de 7 ans
  gratuit), fondation Manrique et maison de Haría 10 € (combiné 17 €), El Grifo 15 €, ferry de La Graciosa 29 € A/R,
  catamaran Catlanza 85 €, Museo Atlántico dès 115 €, Rancho Texas 45 €, LagOmar 10 €, Papagayo 3 € par voiture.
  `a_verifier` à false partout. Pas encore de liens Tiqets (`PARTNER_LINKS`).

- ✅ (23/10/2026) **Page guide d'Ajaccio** (`guides/AJA.json`), préparée en autonomie : 22 activités (tendance d'après les
  réseaux sociaux, 2 sources au moins : vieille ville et marché, pointe de la Parata, coucher de soleil en mer, A Cupulatta,
  Capo di Feno, rive sud Isolella / plage d'Argent ; excursions en bateau Sanguinaires, Scandola-Girolata-Piana et Bonifacio
  (Nave Va), train de Vizzavona, Piana et Tolla par la route ; concert de polyphonies à Saint-Érasme), 18 restaurants (note
  pondérée, C = 4,42, ~250 lieux lus via Wanderlog, 16 listes ; Michelin 2026 : Le Charlie à Porticcio 1 étoile, Terrasse du
  Fesch, A Nepita, L'Écrin, Le Petit Restaurant et Chez Séraphin sélectionnés ; tendance : Le 20123, Via Roma, La Mostra,
  L'Ardoise, Chez Séraphin ; institution : Le Bilboq, langouste aux spaghettis 79 €), 5 quartiers, pas de lien Tiqets (rien à
  Ajaccio). Réseaux sociaux lancés une fois (Apify). Prix relevés sur les sites officiels (musée Fesch 9 €, maison Bonaparte
  10 € via Affluences/RMN, A Cupulatta 15 €, Nave Va : Sanguinaires dès 36 €, Scandola dès 70 €, navette Porticcio 6/10 €,
  polyphonies 20 € sur la billetterie de l'office de tourisme). Pas de match : l'AC Ajaccio, exclu des compétitions nationales
  en 2025, joue en régional. Écartés : Milelli (ouverture non confirmée), NapoRama (pas de photo libre), U Papacionu (avis
  d'intoxication). À savoir : la Terrasse du Fesch ne sert le dîner que d'avril à octobre ; Chez Séraphin ne prend pas la carte
  bancaire ; A Cupulatta fermé du 12 novembre au 29 mars. Le guide porte le nom de la ville (`ville`) : sans vol Lyon–Ajaccio
  (ligne saisonnière), la page affichait « AJA » ; `ville.js` le prend en secours.
- ✅ (23/10/2026) **Page guide de Tunis** (`guides/TUN.json`), préparée en autonomie : 24 activités (tendance d'après les
  réseaux sociaux, 2 sources au moins : médina, Bardo, Carthage, Sidi Bou Saïd, avenue Bourguiba, plage de La Marsa, El Jem,
  Hammamet, Bizerte ; match de l'Espérance, club « Espérance Sportive De Tunis » ; Festival de Carthage en juillet-août ;
  excursions Dougga, Kairouan, El Jem, Cap Bon, Hammamet-Nabeul, Zaghouan, Bizerte), 18 restaurants (note pondérée, C = 4,07,
  ~370 lieux lus via Wanderlog ; pas de guide Michelin en Tunisie ; Le Golfe 46e du MENA's 50 Best 2026), 5 quartiers, pas de
  lien Tiqets (rien à Tunis). Réseaux sociaux lancés une fois (Apify). Prix : nouvelle grille des musées et sites du 1er avril
  2026 (Bardo 30 dinars, Carthage 20, billet combiné 45, Dougga/Thuburbo/Kerkouane 8, Zitouna et Tourbet el Bey 5 ; nouvelle
  hausse au 1er janvier 2027 : Bardo 45, Carthage 30, combiné 70 → à mettre à jour en janvier), horaires sur
  patrimoinedetunisie.com.tn, palais Ennejma Ezzahra 10 dinars (cmam.tn), 1 € ≈ 3,37 dinars. Écartés : musée Dar Ben Abdallah
  (fermé depuis des années), Acropolium (fermé pour travaux), sources chaudes de Korbous (route abîmée, éboulements
  sept. 2026), café des Délices (piège à touristes d'après Reddit : mention dans la fiche de Sidi Bou Saïd).
- ✅ (23/10/2026) **Page guide de Marrakech** (`guides/RAK.json`), reprise du brouillon de la branche
  `claude/project-thread-wgcv4a` : 25 activités (tendance : Majorelle, médersa Ben Youssef, Dar el Bacha, montgolfière,
  Agafay ; excursions Ourika, Ouzoud, Aït-Ben-Haddou, Essaouira, Imlil), 18 restaurants (MENA's 50 Best 2026 : La Grande
  Table Marocaine 19e, Le Petit Cornichon 21e, Sesamo 24e, +61 31e ; pas de guide Michelin restaurants au Maroc), 5 quartiers.
  Réseaux sociaux (Apify) lancés une seule fois, pendant le brouillon. Prix vérifiés : Majorelle 170 DH (combiné 330),
  musée YSL 140 DH (fermé le mercredi), Bahia 100 DH, Dar el Bacha 60 DH (fermé le lundi), Jardin Secret 100 DH (+40 la tour),
  Ben Youssef 50 DH, hammam en spa 150-450 DH, montgolfière ≈ 130-190 €, navette gratuite du jardin Anima depuis la Koutoubia.
  `a_verifier` à false partout. Photos : 43 sur 43, 16 restaurants en photo d'illustration (peu de photos libres des
  restaurants de Marrakech sur Commons). Pas encore de `matchs/RAK.json` : la tâche du lundi le créera s'il y a des matchs.
- ✅ (23/10/2026) **Page guide de Séville** (`guides/SVQ.json`), préparée en autonomie : 26 activités
  (4 tendance d'après les réseaux sociaux, 2 sources au moins : Plaza de España, Setas, Santa Cruz, Triana ; matchs du Séville FC,
  club « Sevilla », et du Betis, club « Real Betis » ; visite des toits de la cathédrale ; flamenco au musée du Baile Flamenco ;
  excursions Cordoue, Itálica, Cadix), 18 restaurants (note pondérée, C = 4,37, 614 restaurants lus via 90 listes Wanderlog ;
  Michelin 2026 : Abantal et Cañabota 1 étoile, Az-Zait et Lalola Bib Gourmand, Sobretablas et Basque sélectionnés ;
  tendance : El Comercio, Las Columnas, Fatouch, marché de Triana, Casa Ruperto, El Rinconcillo, Lama La Uva, Cañabota), 5 quartiers.
  Réseaux sociaux (Apify, un seul lancement). Écartés : Las Teresas (note 3,9), Confitería La Campana (4,0), Río Grande (ouvert en 2023,
  pas une institution), Hospital de la Caridad (église fermée pour travaux en 2026).
  Prix officiels relevés : Alcázar 15,50 €, cathédrale 13 € en ligne (14 € au guichet, toits 20 €), Setas 16 €, Dueñas 15 €,
  Pilatos 12 € (+6 € l'étage), Lebrija 15 €, Maestranza 12 €, musée du Flamenco 29 €, Aire 68 €, mosquée de Cordoue 15 €.
  `a_verifier` à false partout. Photos : 44 sur 44, 16 d'illustration (restaurants surtout, et les bains Aire).
  `matchs/SVQ.json` n'existe pas encore (Séville est une destination récente) : la tâche du lundi le créera.
  Pas encore de liens Tiqets (`PARTNER_LINKS`).
- ✅ (23/10/2026) **Page guide de Porto** (`guides/OPO.json`), préparée en autonomie : 28 activités
  (5 tendance d'après les réseaux sociaux, 2 sources au moins : Ribeira, pont Dom Luís I, jardin du Morro et Serra do Pilar,
  librairie Lello, gare de São Bento ; match du FC Porto, club « FC Porto », et visite du musée et du stade ; excursions
  vallée du Douro en train jusqu'à Pinhão, Guimarães, Braga et Bom Jesus, Aveiro et Costa Nova), 18 restaurants (note
  pondérée, C = 4,47, 905 restaurants lus via 140 listes Wanderlog ; Michelin 2026 : Antiqvvm, The Yeatman et Casa de Chá
  da Boa Nova 2 étoiles, Pedro Lemos et Euskalduna Studio 1 étoile, Cafeína sélectionné ; aucun Bib Gourmand à Porto ;
  tendance : Café Santiago, Casa Guedes, Gazela, Manteigaria, Bolhão, Taberna dos Mercadores, O Gaveto, Euskalduna), 5 quartiers.
  Réseaux sociaux (Apify, un seul lancement) ; Reddit insiste sur Matosinhos pour le poisson (Gaveto, grills de la rue Heróis
  de França). Écartés : Majestic Café (note 4,1, cité dans la fiche de la chapelle des Âmes), Cantinho do Avillez (4,3).
  Prix officiels relevés : Clérigos 10 €, Bourse 14 €, Serralves 24 €, Casa da Música 12 €, téléphérique 7 €, tram 6 €,
  Lello 10 € (déduit d'un livre), menus Antiqvvm 185-265 €, Yeatman 260-300 €, Boa Nova 205-295 €, Pedro Lemos 150-180 €,
  Euskalduna 160 €. `a_verifier` à false partout. Photos : 45 sur 46 (WOW sans photo libre), 14 d'illustration.
  Pas encore de liens Tiqets (`PARTNER_LINKS`).
- ✅ (22/10/2026) **Page guide de Paris** (`guides/PAR.json`), préparée en autonomie : 29 activités
  (5 tendance d'après les réseaux sociaux, 2 sources au moins : Montmartre et le Sacré-Cœur, croisière sur la Seine,
  coupole des Galeries Lafayette, jardin du Petit Palais, salle Ovale de la BnF ; match du PSG, club
  « Paris Saint-Germain » ; Versailles, Disneyland et Giverny en excursions), 18 restaurants (note pondérée,
  C = 4,43, 1 608 restaurants lus via ~220 listes Wanderlog ; Michelin 2026 : Arpège et Le Cinq 3 étoiles,
  Jules Verne 2 étoiles, Septime 1 étoile, Kodawari et Clamato Bib Gourmand ; Arpège et Septime aussi au
  World's 50 Best 2025), 5 quartiers. Écartés pour note trop basse : Chartier historique, Relais de l'Entrecôte,
  Paul Bert, Girafe. Lieux fermés écartés : tour Montparnasse (fermée depuis le 31/03/2026 pour des années),
  Centre Pompidou (fermé jusqu'en 2030) ; Fondation Louis Vuitton non retenue (pas de photo libre possible).
  Catacombes rouvertes au printemps 2026 ; salle de l'Opéra Garnier fermée de mi-2027 à mi-2029 (note dans la fiche) ;
  Giverny ouvert du 1er avril au 1er novembre. Prix officiels relevés (Tour Eiffel 36,70 € au sommet, Louvre 22 €
  pour l'Europe et 32 € hors Europe, Orsay 16 €, Versailles 32 €…) ; les autres sont `a_verifier` ; restaurants :
  prix et délais estimés. Photos : 45 sur 47 (Disneyland et Septime sans photo libre utilisable : Disneyland
  n'a presque pas de photos sur Commons, pas de liberté de panorama en France) ; 7 photos d'illustration (restaurants).
  Liens Tiqets : Orsay, Orangerie, Bourse de Commerce, Arc de Triomphe, croisière, Versailles.
- ✅ (22/10/2026) **Page guide d'Istanbul** (`guides/IST.json`), préparée en autonomie : 28 activités
  (5 tendance : citerne Basilique, Balat, Kadıköy et Moda, tour de Léandre, Ortaköy ; match de Galatasaray,
  club « Galatasaray », carte Passolig obligatoire), 18 restaurants (note pondérée, C = 4,345, 983 restaurants
  lus via Wanderlog ; Michelin 2026 : TURK Fatih Tutak 2 étoiles, Mikla, Nicole, Sankai 1 étoile, Pandeli,
  Ali Ocakbaşı et Karaköy Lokantası Bib Gourmand, Yeni Lokanta sélection ; tendance : Seven Hills), 5 quartiers
  (Sultanahmet, Sirkeci, Karaköy, Beyoğlu, Kadıköy). Réseaux sociaux (Apify, un seul lancement, ~0,75 $) : signal
  faible côté restaurants. Écartés pour note trop basse : Çiya, Hamdi, bateaux à balık ekmek d'Eminönü.
  Prix en livres turques convertis (1 € ≈ 55,5 TL, inflation forte : à revoir souvent). À vérifier (`a_verifier`) :
  18 activités sur 28 (Topkapı, citerne, Galata, Dolmabahçe, hammam, derviches, musées, îles, match…).
  Restaurants : prix et délais estimés ; 15 photos d'illustration (peu de photos libres des lieux) ; Mikla sans photo (Commons refusait le téléchargement, à ajouter : « The Marmara Pera Hotel Istanbul.jpg », domaine public).
  Pas encore de liens Tiqets (`PARTNER_LINKS`).
- ✅ (22/10/2026) **Page guide d'Amsterdam** (`guides/AMS.json`), préparée en autonomie : 26 activités
  (4 tendance : A'DAM Lookout et sa balançoire, NDSM et musée STRAAT, Moco, Jordaan ; match de l'Ajax), 18 restaurants
  (note pondérée, C = 4,42, ~1 150 restaurants lus via Wanderlog ; Michelin 2026 : Ciel Bleu et 212 2 étoiles, De Kas et
  RIJKS 1 étoile, Brasserie Marie Bib Gourmand ; Amsterdam n'a gagné aucune étoile cette année, Daalder a perdu la sienne),
  5 quartiers. 9 liens Tiqets au prix officiel (Van Gogh, Stedelijk, Moco, Rembrandt, église cachée, musée maritime, NEMO,
  Heineken, croisière) ; pas de lien pour le Rijksmuseum (Tiqets = visite guidée plus chère) ni le palais royal.
  Saisonnier : Keukenhof (mi-mars à mi-mai). Musée Van Gogh : travaux prévus seulement à l'automne 2028.
  Réseaux sociaux (Apify : Instagram, YouTube, Reddit, puis TikTok relancé le 22/10 : 120 vidéos) : tendance pour
  Fabel Friet, Van Dobben, De Kas, Moeders, A'DAM Lookout, Moco, Jordaan, NDSM. Écartés : CHUN (note 4,2), Sea Palace (4,2).
  Prix confirmés sur les sites officiels : Rijksmuseum (25 €), Anne Frank (16,50 €), Stedelijk (22,50 €), Rembrandt
  (23,50 €), église cachée (18 €), palais royal (13,50 €), musée maritime (20 €), NEMO (21,50 €), STRAAT (21,50 €),
  A'DAM Lookout (16,50 €), ARTIS (29,50 €), Hortus (14,75 €), Heineken (24,95 €), Keukenhof (21 €).
  À confirmer (`a_verifier`) : Van Gogh (27 € d'après Tiqets et un guide de sept. 2026), Moco, croisière, Ajax,
  tarifs enfants du musée maritime et de l'Hortus. Restaurants : prix et délais estimés, à vérifier.
- ✅ (22/10/2026) **Page guide de Berlin** (`guides/BER.json`), préparée en autonomie (en deux fois : la première
  conversation s'est arrêtée sur la limite d'usage, reprise ensuite) : 28 activités (5 tendance : tour de télévision,
  East Side Gallery, Sanssouci, Mauerpark le dimanche, Hackesche Höfe ; match de l'Union, club « 1. FC Union Berlin »),
  18 restaurants (note pondérée, C = 4,455, 1 403 restaurants lus via ~126 listes Wanderlog ; Michelin 2026 : Rutz
  3 étoiles, Tim Raue et CODA 2 étoiles, Cookies Cream 1 étoile, Barra et November Brasserie Bib Gourmand), 5 quartiers.
  Réseaux sociaux (Apify, un seul lancement, ~0,75 $) : tendance restos Mustafa, Annelies, Zeit für Brot, Henne,
  Clärchens Ballhaus, Barra, Café am Neuen See, Rutz, Tim Raue, Sphere. Reddit : file de Mustafa « entretenue »
  (venir entre 12 h et 17 h), Checkpoint Charlie et restos du Hackescher Markt jugés décevants (notes dans les fiches).
  Pergame fermé jusqu'au 4 juin 2027 ; coupole du Reichstag fermée du 19 au 30 octobre 2026 ; marché de Noël du
  Gendarmenmarkt du 23 novembre au 31 décembre 2026.
  Prix à confirmer (`a_verifier`) : Neues Museum, cathédrale, tour de télévision, Charlottenburg, Colonne de la Victoire,
  croisière, zoo (prix variables), Philharmonie, Berghain, Teufelsberg, Neue Nationalgalerie, Union, marché de Noël.
  Restaurants : prix et délais estimés ; 11 photos d'illustration. Pas encore de liens Tiqets (`PARTNER_LINKS`).
- ✅ (22/10/2026) **Page guide de Venise** (`guides/VCE.json`), préparée en autonomie : 28 activités
  (5 tendance d'après les réseaux sociaux, 2 sources au moins : pont du Rialto, gondole, Burano, librairie Acqua Alta,
  Scala Contarini del Bovolo ; match du Venezia FC, dernière saison au stade Penzo), 18 restaurants (note pondérée,
  C = 4,40, 392 restaurants lus via Wanderlog ; Michelin 2026 : Glam 2 étoiles, Local, Oro, Wistèria et Venissa
  1 étoile ; aucun Bib Gourmand à Venise), 6 quartiers dont Mestre (petit budget). Florian, Harry's Bar et Quadri
  écartés : note Google trop basse (3,6 à 3,8). Saisonniers : Biennale (jusqu'au 22/11/2026), carnaval (fin janv.
  au 9 févr. 2027), Lido (été), Venissa (avril à novembre). Prix confirmés : palais des Doges (30 € en ligne
  1 mois avant, 35 € sinon), basilique (6 € en ligne), campanile (12 €), Accademia (20 €), Guggenheim (17 €),
  Biennale (30 €), gondole (90 € la gondole de jour). Les autres sont marqués `a_verifier` ; restaurants : prix et
  délais estimés, à vérifier. Droit d'entrée des visiteurs à la journée : seulement certains jours d'avril à
  juillet, les clients d'un hôtel en sont exemptés.
- ✅ (22/10/2026) **Page guide de Prague** (`guides/PRG.json`), préparée en autonomie : 29 activités
  (6 tendance : Klementinum, mur Lennon et Kampa, Vyšehrad, Letná, Maison dansante, tête de Kafka ; match du
  Sparta ou du Slavia ; excursions à Kutná Hora, Český Krumlov, Karlštejn), 18 restaurants (note pondérée,
  C = 4,46, 1 730 lieux lus via Wanderlog ; Michelin 2026 : La Degustation, Field, Casa de Carli, Štangl
  1 étoile, Alma Bib Gourmand), 5 quartiers. Réseaux sociaux lancés (Apify, un passage) : tendance =
  au moins 2 sources (Kantýna, Lokál, Café Louvre, Kuchyň, Pasta Fresca). Prix officiels (prague.eu, oct. 2026) :
  château 450 Kč, horloge 350 Kč, Klementinum 380 Kč, Petřín 250 Kč, Strahov 220 Kč, Maison municipale 320 Kč,
  zoo 330 Kč (1 € ≈ 24,3 Kč). Saisonniers : jardins Wallenstein (avril-oct.), marché de Noël (28 nov. 2026 -
  6 janv. 2027, à confirmer). Château fermé le 28/10/2026 dès 15 h. Funiculaire de Petřín rouvert le 22/09/2026.
  À vérifier (`a_verifier`) : Josefov, Saint-Nicolas, croisière, Maison dansante, Mucha, concert, opéra, Žižkov,
  Musée national, musée du communisme, marché de Noël, match, excursions. Restaurants : prix et délais estimés.
- ✅ (22/10/2026) **Page guide de Madrid** (`guides/MAD.json`), préparée en autonomie : 28 activités
  (4 tendance : Temple de Debod, Retiro et Palais de cristal, terrasse du Círculo de Bellas Artes, rooftop du Riu ;
  visite du Bernabéu, matchs du Real et de l'Atlético ; excursions à Tolède, Ségovie, l'Escurial), 18 restaurants
  (note pondérée, C = 4,39, ~1 100 lieux lus via Wanderlog ; Michelin 2026 : DiverXO 3 étoiles, Coque et DSTAgE
  2 étoiles, Bacira Bib Gourmand ; tendance : San Ginés, Botín, marché de San Miguel, Bel Mondo), 5 quartiers.
  Réseaux sociaux lancés (Apify, un passage). Écartés car fermés : téléphérique (jusqu'en 2027), musée Sorolla
  (travaux). Photo du hammam : celui de Málaga, même enseigne (« Photo d'illustration »).
  Tout vérifié en autonomie (sources officielles quand elles existent : BOE 2025 pour les prix du Patrimonio
  Nacional, esmadrid.com, TheFork pour DSTAgE) : l'Escurial coûte 14 € (pas 18), le Villa Rosa s'appelle
  désormais Tablao Flamenco 1911, Takos al Pastor est calle de la Abada 13. Délais de réservation des
  restaurants : jugés d'après les avis et la notoriété.
- ✅ (22/10/2026) **Page guide de Copenhague** (`guides/CPH.json`), préparée en autonomie : 28 activités
  (4 tendance : Tivoli, Nyhavn, Tour Ronde, flèche de l'église du Sauveur ; Petite Sirène regroupée avec Kastellet,
  car la statue est encore protégée par le droit d'auteur et n'a pas de photo libre ; sauna CopenHot, bain du port,
  CopenHill, GoBoat ; match du FC Copenhague ; excursions au musée Louisiana et à Kronborg), 18 restaurants
  (note pondérée, C = 4,34, 1 400 lieux lus via Wanderlog, 116 listes ; Michelin 2026 : Geranium 3 étoiles,
  Alchemist et Kong Hans Kælder 2 étoiles, Marv & Ben Bib Gourmand ; tendance : Torvehallerne, Juno, Gasoline Grill,
  Kødbyens Fiskebar), 5 quartiers, 3 liens Tiqets (Tivoli, Musée national, zoo ; croisière Stromma et Carlsberg
  plus chers sur Tiqets, donc sans lien). Réseaux sociaux lancés (Apify, un passage).
  Prix relevés sur les sites officiels (1 € ≈ 7,46 DKK). Écartés : Noma (réouvert en août 2026 sans étoiles, saison
  courte, direction contestée), Reffen (doublon avec Torvehallerne). À savoir : Tivoli fermé du 2 au 12 nov. 2026 et
  du 4 janv. au 18 mars 2027 ; Palmehus du jardin botanique en travaux (parties fermées) ; zoo 260 DKK (230 de nov. à
  fév.). Délais de réservation des restaurants : jugés d'après les avis et la notoriété.
- ✅ (22/10/2026) **Fiches des 7 villes qui n'en avaient pas** : Caen, Dubrovnik, La Rochelle, Louxor,
  Montréal, Pau, Stockholm (photo libre Commons, texte vendeur, météo). 95 fiches en tout.

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

- ✅ (22/10/2026) **Page guide de Budapest** (`guides/BUD.json`), préparée en autonomie : 27 activités
  (5 tendance : bastion des Pêcheurs, citadelle rouverte au printemps 2026, croisière du soir, bains Széchenyi,
  bars en ruines ; nouveau type « Bains thermaux » dans `TYPES` de `ville.js` : Széchenyi et Rudas, 14 ans et plus ;
  Gellért fermé pour travaux jusqu'en 2028, pas mis ; match de Ferencváros ; excursions collines de Buda et coude
  du Danube ; marché de Noël de mi-novembre au 31 décembre), 18 restaurants (note pondérée, C = 4,50, 1 759 lieux
  lus via Wanderlog ; Michelin Hongrie 2025 : Stand 2 étoiles, Rumour, Babel, Borkonyha 1 étoile, N28 Bib Gourmand),
  5 quartiers. Réseaux sociaux (Apify, 1 passage) : tendance pour Retro Lángos, Bors, Gettó Gulyás. Prix en forints
  convertis (1 € ≈ 363 Ft), à vérifier ; 14 photos de restaurants sur 18 sont des illustrations.
- ✅ (22/10/2026) **Page guide d'Athènes** (`guides/ATH.json`), préparée en autonomie : 26 activités
  (5 tendance : Plaka et Anafiotika, mont Lycabette, lac de Vouliagmeni, Monastiraki, stade panathénaïque ;
  match de l'Olympiakos ; excursions Sounion, Égine, Delphes), 18 restaurants (note pondérée, C = 4,45, 704 restaurants
  lus via Wanderlog ; Michelin 2026 annoncé en oct. : Tudor Hall, Aleria (nouvelle), Soil, Spondi 1 étoile, Nolan
  Bib Gourmand ; Delta passe de 2 à 1 étoile), 5 quartiers. Réseaux sociaux (Apify, 1 passage) : tendance pour
  Kostas, Lukumades, Little Kook, Atlantikos, Avli, Klimataria (2 sources au moins). Saisonniers : Odéon d'Hérode
  Atticus (juin-sept.), cinéma Thission (mai-oct.), baignade et Égine (avril-oct.). Kerameikos fermé depuis mai 2025
  (pas mis). Prix confirmés : Acropole 30 € (gratuit moins de 18 ans et moins de 25 ans UE). Les autres sont
  `a_verifier` (Agora et temple de Zeus 20 € d'après un guide d'août 2026, musée national 20 € depuis janv. 2026).
  Restaurants : prix et délais estimés ; 17 photos sur 18 sont des illustrations (seul Little Kook est photographié).
- ✅ (22/10/2026) **Page guide de Rome** (`guides/ROM.json`), préparée en autonomie : 30 activités
  (5 tendance : fontaine de Trevi, Trastevere, Pincio, trou de serrure de l'Aventin, galerie Sciarra ; match de
  l'AS Roma ; excursions à Ostie et Tivoli), 18 restaurants (note pondérée, C = 4,41, ~990 restaurants lus via
  Wanderlog ; Michelin 2026 : La Pergola 3 étoiles, Acquolina 2 étoiles, Imàgo et Glass Hostaria 1 étoile ;
  tendance : Supplì Roma, Trapizzino, Giolitti, Roscioli, Da Enzo), 5 quartiers.
  **Nouveautés 2026 à connaître** : fontaine de Trevi payante (2 €, 9 h-22 h, depuis le 2 février) ; Panthéon
  passé à 7 € et château Saint-Ange à 18 € (juillet 2026). Bonci Pizzarium, Da Baffetto, Piperno et Nonna Betta
  écartés (note Google ≤ 4,2) ; Tonnarello écarté (avis en masse). **Réseaux sociaux** (Apify, 1 passage) :
  120 TikTok, 60 Instagram, 40 YouTube, 30 Reddit. Prix confirmés : Vatican (20 + 5 €), Panthéon, Trevi,
  Saint-Ange, Caracalla, Capitole (15 €, 16,50 € avec exposition). Les autres sont marqués `a_verifier`.
  Photos des restaurants : aucune photo libre des salles → photos de plats (`illustration`).
- ✅ (21/10/2026) **Page guide de Dubaï** (`guides/DXB.json`), préparée en autonomie : 30 activités
  (6 tendance : Sky Views, Al Fahidi, Dubai Frame, Kite Beach, Miracle Garden, Global Village ; excursions à Abou Dhabi,
  Hatta, safari ; courses de Meydan à la place d'un club de foot, peu suivi), 18 restaurants (note pondérée,
  C = 4,53, ~1 600 restaurants lus via Wanderlog ; Michelin 2026 : Orfali Bros 2 étoiles, Tasca et 11 Woodfire
  1 étoile ; 3Fils, Al Khayma, Shabestan, Bait Maryam, Kinoya, Hawkerboi Bib Gourmand), 5 quartiers.
  Prix convertis à 1 € ≈ 4,1 AED. **Contexte à connaître** : guerre États-Unis/Israël – Iran en 2026 (aéroport
  de Dubaï touché en mars) ; France Diplomatie : « vigilance renforcée » (10/09/2026), pas de déconseil.
  Beaucoup de lieux ont fermé ou réduit leur activité : **musée du Futur fermé jusqu'au 1er trimestre 2027**
  et Ain Dubai (ouverture incertaine) écartés ; restaurants fermés écartés (Ossiano, Al Muntaha, Hakkasan…).
  Saisonniers : Miracle Garden (8 oct.-31 mai), Global Village (14 oct.-mai), Meydan (6 nov.-27 mars).
  Ravi et Al Mallah (institutions) écartés : note Google 4,0 ; Bu Qtair (4,2) aussi.
  **Réseaux sociaux** (Apify, relancé après paiement, ~0,9 $) : 120 TikTok, 60 Instagram, 40 YouTube,
  30 Reddit. Badge « Tendance » si 2 sources : Sky Views (ajouté, toboggan de verre + Edge Walk ; pas de
  photo libre → illustration), Arabian Tea House et Tasca côté restos ; retiré à Aura Skypool et SALT
  (1 seule source). Signal restos faible (#dubaifood = comptes de reprise). Le plafond TikTok du script
  (0,45 $) était sous le minimum Apify (0,50 $) : corrigé, et choix `reseaux` pour relancer un seul réseau.
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
