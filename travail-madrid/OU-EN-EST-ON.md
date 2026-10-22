# Fiche de Madrid : où en est-on (pause du 22/10/2026, 12 h 35 UTC)

Rien n'a été mis en ligne : le site n'a pas changé.

## Fait
- Réseaux sociaux (Apify, un passage, ~0,75 $) : lus. Badges « Tendance » retenus :
  activités Temple de Debod, Retiro (Palais de cristal), terrasse du Círculo de Bellas Artes, rooftop du Riu ;
  restaurants San Ginés, Botín, Mercado de San Miguel, Bel Mondo.
- Notes Google de ~1 100 restaurants (Wanderlog, C = 4,39) et guide Michelin 2026 (DiverXO 3 étoiles ;
  Coque, DSTAgE, Paco Roncero, Deessa, Ramón Freixa, Smoked Room 2 étoiles).
- 28 activités rédigées avec prix vérifiés (build/acts.py). Écartés car fermés : téléphérique (jusqu'en 2027),
  musée Sorolla (travaux).
- 18 restaurants rédigés (build/restos.py), 5 quartiers (build/build.py).
- Photos libres choisies pour les 46 fiches (picks.json) ; 12 photos d'activités téléchargées (photos-activites).

## Reste à faire
1. Télécharger les ~34 photos restantes : `python3 scripts/run_photos.py` (utilise thumb.wikimedia.org,
   upload.wikimedia.org répond « 429 »).
2. `python3 build/build.py` → guides/MAD.json, ajouter 'MAD' à GUIDES (search.js), liens Tiqets si besoin.
3. Captures iPhone + PC, puis commit sur main (git pull --rebase avant : 9 autres villes poussent aussi).
4. Notes dans CLAUDE.md / IDEES.md.
