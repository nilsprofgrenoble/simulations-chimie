// ====================================================
//  STATISTIQUES DE FRÉQUENTATION ANONYMES (GoatCounter)
// ====================================================
// Pour activer : créer un compte gratuit sur https://www.goatcounter.com (choisir un « code », par exemple « labochimie »),
// puis écrire ce code ci-dessous entre les guillemets. Tant que le code est vide, RIEN n'est envoyé et aucun script externe n'est chargé.
//
// Ce qui est compté : les consultations de chaque simulation, et les clics sur les modes (parcours guidé, exploration, défi).
// Ce qui n'est PAS fait : aucun cookie, aucun compte, aucun nom, aucun suivi d'un élève en particulier ; GoatCounter ne conserve que des
// chiffres agrégés (voir https://www.goatcounter.com/help/gdpr). Rien n'est envoyé depuis un ordinateur local (localhost), ni si le
// navigateur envoie « Do Not Track ».
export const CODE_GOATCOUNTER = 'labochimie';

export const STATS_ACTIVES = CODE_GOATCOUNTER !== '';
// Comptage par « pixel » (une image de 1×1 demandée à GoatCounter) : aucun script extérieur n'est chargé dans le site,
// ce qui protège les sessions des élèves connectés (un script extérieur aurait accès à la page entière).

function peutCompter() {
  if (!STATS_ACTIVES || typeof window === 'undefined') return false;
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1' || h === '') return false;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return false;
  return true;
}

// Compte une page vue (event = false) ou un événement (event = true)
export function compter(path, title, event = false) {
  if (!peutCompter()) return;
  try {
    const q = new URLSearchParams({ p: path, t: title || '', e: event ? 'true' : 'false', rnd: Math.random().toString(36).slice(2) });
    if (!event) q.set('s', `${window.screen.width},${window.screen.height},${window.devicePixelRatio || 1}`);
    if (navigator.webdriver) q.set('b', '153');
    const img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.src = `https://${CODE_GOATCOUNTER}.goatcounter.com/count?${q}`;
  } catch { /* les statistiques ne doivent jamais gêner le site */ }
}
