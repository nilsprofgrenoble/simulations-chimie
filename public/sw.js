// Service worker de la Paillasse virtuelle : permet l'installation et un usage hors connexion.
// - pages (HTML) : le réseau d'abord (on voit toujours la dernière version), le cache si hors connexion ;
// - fichiers du site (scripts, styles, polices, bibliothèques) : le cache d'abord, ils portent un nom unique par version ;
// - tout ce qui vient d'ailleurs (comptes élèves, statistiques) n'est jamais mis en cache.
const VERSION = 'paillasse-v2';
// À l'installation : on garde tout de suite la page d'accueil et les fichiers qu'elle charge (hors connexion dès la première visite)
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    try {
      const c = await caches.open(VERSION);
      const racine = new URL('./', self.location).href;
      const rep = await fetch(racine, { cache: 'reload' });
      const html = await rep.clone().text();
      await c.put(racine, rep);
      const fichiers = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css|svg|png|webmanifest))"/g)].map(m => new URL(m[1], racine).href);
      await Promise.all(fichiers.map(f => c.add(f).catch(() => {})));
    } catch { /* hors connexion : on réessaiera à la prochaine visite */ }
    self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(rep => {
      const copie = rep.clone();
      caches.open(VERSION).then(c => c.put(new URL('./', self.location).href, copie));   // une seule page : l'application lit ?sim= et ?ex= elle-même
      return rep;
    }).catch(() => caches.match(new URL('./', self.location).href)));
    return;
  }
  e.respondWith(caches.match(req).then(en => en || fetch(req).then(rep => {
    if (rep.ok) { const copie = rep.clone(); caches.open(VERSION).then(c => c.put(req, copie)); }
    return rep;
  })));
});
