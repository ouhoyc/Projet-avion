# ✈️ Vols directs depuis Lyon

Site statique qui affiche toutes les destinations en **vol direct** depuis l'aéroport
de Lyon-Saint Exupéry (LYS), avec le prix le moins cher pour chacune.

## Comment ça marche

```
GitHub Action (1×/jour)
   └─ node scripts/fetch-prices.mjs   ← utilise le jeton (secret)
         ├─ API Travelpayouts : aviasales/v3/prices_for_dates (direct=true)
         ├─ fichiers de référence en français : cities / countries / airports / airlines
         └─ écrit data.json
Site (index.html + app.js)  ← lit seulement data.json, aucun jeton
```

| Fichier | Rôle |
|---|---|
| `scripts/fetch-prices.mjs` | Récupère les prix et génère `data.json` |
| `data.json` | Les données affichées par le site (généré automatiquement) |
| `index.html`, `style.css`, `app.js` | Le site (carte Leaflet + liste + filtres) |
| `.github/workflows/update-prices.yml` | Mise à jour automatique quotidienne |
| `.env` | Tes secrets en local (**jamais** envoyé sur GitHub) |
| `.env.example` | Modèle de `.env` |

## Lancer en local

Prérequis : [Node.js](https://nodejs.org) 20 ou plus (aucune dépendance à installer).

```bash
cp .env.example .env          # puis colle ton jeton dans .env
node scripts/fetch-prices.mjs # crée data.json
npx serve .                   # ou : python3 -m http.server 8000
```

Puis ouvre l'adresse affichée (ex. http://localhost:8000).
⚠️ Ouvrir `index.html` en double-cliquant ne marche pas : le navigateur bloque la lecture de `data.json` sans serveur.

## Mettre en ligne (GitHub Pages, gratuit)

1. **Secrets** : sur GitHub, dépôt → *Settings* → *Secrets and variables* → *Actions* → *New repository secret* :
   - `TRAVELPAYOUTS_TOKEN` = ton jeton API
   - `TRAVELPAYOUTS_MARKER` = `787111`
2. **Premier lancement** : onglet *Actions* → « Mise à jour des prix » → *Run workflow*.
   Au bout d'une minute, un commit « Mise à jour des prix » ajoute `data.json`.
3. **Pages** : *Settings* → *Pages* → *Source : Deploy from a branch* → branche `main`, dossier `/ (root)` → *Save*.
4. Après 1 à 2 minutes, le site est en ligne sur `https://<ton-pseudo>.github.io/<nom-du-depot>/`.
   Ensuite, il se met à jour tout seul chaque matin.

## Changer d'aéroport de départ (plus tard)

Le script lit la variable `ORIGIN` (par défaut `LYS`) ; le titre du site s'adapte tout seul.

- En local : `ORIGIN=GVA node scripts/fetch-prices.mjs` (Genève), `MRS` (Marseille)…
- Sur GitHub : *Settings* → *Secrets and variables* → *Actions* → onglet *Variables* → `ORIGIN` = `GVA`.

## Notes

- Les prix viennent du cache Aviasales (recherches des derniers jours) : ils sont **indicatifs**.
- Les liens « Voir les vols » contiennent ton marker d'affiliation, jamais ton jeton.
