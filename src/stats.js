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
const file = [];
let pret = false, demarre = false;

function peutCompter() {
  if (!STATS_ACTIVES || typeof window === 'undefined') return false;
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1' || h === '') return false;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return false;
  return true;
}

function vider() {
  while (file.length) { try { window.goatcounter.count(file.shift()); } catch (e) { /* les statistiques ne doivent jamais gêner le site */ } }
}

function demarrer() {
  if (demarre) return;
  demarre = true;
  window.goatcounter = { no_onload: true, endpoint: `https://${CODE_GOATCOUNTER}.goatcounter.com/count` };
  const s = document.createElement('script');
  s.async = true; s.src = 'https://gc.zgo.at/count.js';
  s.onload = () => { pret = true; vider(); };
  document.head.appendChild(s);
}

// Compte une page vue (event = false) ou un événement (event = true)
export function compter(path, title, event = false) {
  if (!peutCompter()) return;
  file.push({ path, title, event, no_session: event });
  demarrer();
  if (pret) vider();
}
