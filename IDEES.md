# Idées et décisions en attente

Liste de travail du projet « Vols directs depuis Lyon ». On traite les points un par un.
Statuts : 💡 idée · ❓ questions à trancher · 🛠 en cours · ✅ fait · ⏸ en pause

## Le cap du site
Pour les gens **qui aiment partir mais ne savent pas où aller**. On part de leur période, leur
budget et leurs envies, depuis leur aéroport, en vol direct ; le site leur donne des idées de
destinations, puis prépare le séjour (activités selon leurs goûts, quartier idéal pour dormir,
hôtels). Revenus : commissions à chaque étape (vol, hôtel, activités…).

## À faire

### 10. 💡 Donner envie (inspiration)
Pour quelqu'un qui ne sait pas où aller, un prix ne suffit pas. Pistes :
- choisir par **envie** plutôt que par pays : soleil & plage, ville, nature, fête, culture,
  dépaysement… ;
- sur chaque fiche : une **photo**, une phrase « pourquoi y aller », la **météo** du mois choisi,
  la durée de vol ;
- un mode « Surprends-moi ».

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
- ✅ Carte refaite avec MapLibre seul (points fixes au zoom, couleurs du site)
- ✅ Barre des mois au-dessus des destinations (quand « Quand ? » est vide) : meilleur prix de
  chaque mois, on touche un mois ou on glisse la liste pour changer de mois sans toucher aux
  réglages. Utilise seulement les prix déjà repérés (aucune recherche en direct en plus).
