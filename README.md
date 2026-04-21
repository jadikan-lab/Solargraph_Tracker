# Solargraph Tracker — prototype

Prototype local (PWA) pour enregistrer tes sténopés avec photo et géolocalisation, et les visualiser sur une carte OpenStreetMap.

Fonctionnalités MVP:
- Ajouter un sténopé : photo initiale, géoloc, type boîte, diamètre trou, notes
- Stockage local (IndexedDB via localforage)
- Carte : Leaflet + OpenStreetMap
- Marquer récupéré (date)
- Prototype offline (service worker basique)

Installation et lancement local :

```bash
cd solargraph-tracker
npm install
npm run dev
```

Puis ouvrir l'URL donnée par Vite (ex: http://localhost:5173).

Notes:
- C'est volontairement sans backend pour un usage personnel. Si tu veux sauvegarder sur Firebase/storage, je peux ajouter l'intégration.
- Les photos sont stockées en base64 dans IndexedDB pour le prototype. Pour un usage long terme, il vaut mieux uploader vers un stockage cloud.

Déploiement rapide via Netlify
--------------------------------

Si tu veux un lien HTTPS accessible depuis ton téléphone, tu peux déployer ce dossier sur Netlify en important le repo GitHub :

1. Assure-toi que ce dossier (`solargraph-tracker`) est poussé sur GitHub (branche `main` ou `master`).
2. Dans Netlify : "New site from Git" → choisis GitHub et autorise l'accès au repo.
3. Choisis le repo `solargraph-tracker`.
4. Dans la configuration de déploiement :
	- Branch to deploy: `main` (ou `master` selon ton repo)
	- Build command: laisse vide
	- Publish directory: `.`
5. Déployer. Le site servira `index.html` (qui redirige vers `quick.html`).

Si Netlify exige une commande de build, mets `echo "no build"` comme Build command et `.` comme Publish directory.

Après le déploiement tu auras une URL en `https://*.netlify.app` que tu pourras ouvrir sur ton téléphone. La caméra et la géolocalisation fonctionneront correctement car le site est servi en HTTPS.

