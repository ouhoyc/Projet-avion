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
  - Titre : « Pas d'idée de destination ? Faites le tour des possibles. », sur 4 lignes
    régulières (classes `.h1-line`).
  - Formulaire : Où / Quand êtes-vous libre / durée / budget.
  - Carte, liste, panneau « Voir », calendrier, dialogue « Crédits et mentions ».
- `app.js` : en-tête, carte MapLibre (fond OpenFreeMap en français, pastilles de prix dès le
  zoom de départ), outils communs (`flag()` = images de drapeaux dans `img/drapeaux/`).
- `search.js` : moteur de recherche (prix jour par jour, combinaisons aller-retour), barre des
  mois, fiches villes (vignette, météo, durée de vol), panneau « Voir » :
  - la vérification du prix en direct se fait **seulement sur le bouton** ;
  - le résultat est gardé 30 min dans le navigateur.
- `ville.html` + `ville.js` + `ville.css` : page guide d'une ville (`ville.html?c=BCN`), qui lit
  `guides/CODE.json` (activités : prix, réservation, durée, position…). Les villes qui ont un
  guide sont listées dans `GUIDES` (`search.js`) ; liens partenaires dans `PARTNER_LINKS` (`ville.js`).
  `guides/BCN-relecture.html` : page de relecture des activités pour le propriétaire.
  Chaque activité a des `tarifs` (adulte + règles enfants [âge max, prix]) pour le devis.
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
- Les villes sans fiche s'affichent quand même, simplement sans photo ni texte.

## Prochaines étapes prévues
1. **Nom et logo : en pause** (voir point 11 d'`IDEES.md` : critères, noms écartés, noms libres).
   Priorité du propriétaire : la vision **voyage clé en main** (point 4) et une **application
   sur les stores** (point 12).
2. Régler la liste « Problèmes à régler » d'`IDEES.md` en une fois, quand il le demande.
3. Ensuite, piste « donner envie » : choisir par envies (soleil, ville, fête…), « Surprends-moi ».
4. Affiliation Kiwi.com en attente chez Travelpayouts (lien partenaire à mettre dans
   `KIWI_AFFILIATE_TEMPLATE`, dans `app.js`).
