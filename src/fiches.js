// ═════════════════════════════════════════════════════════════════════════
//  « MES FICHES » : la collection des cartes « À retenir » rencontrées par l'élève.
//  Quand une carte « À retenir » s'affiche (parcours guidé, exploration…), on en garde un instantané nettoyé (texte, formules, schémas) :
//  une clé « fiche-<simulation>-<empreinte> » par carte, dans le navigateur. Pour un élève connecté, ces clés sont aussi copiées dans son compte
//  (même mécanisme que la progression des parcours : etatsParcours.js), donc retrouvées sur tous ses appareils.
//  Hypothèses : une carte est « débloquée » quand elle s'est affichée ; l'empreinte ignore les chiffres, pour qu'une carte dont les valeurs
//  changent (valeur tirée au hasard) reste une seule carte ; si la carte change dans une nouvelle version du site, la plus récente remplace l'ancienne.
// ═════════════════════════════════════════════════════════════════════════
import { enregistrer, noterModification } from './etatsParcours';

export const PREFIXE_FICHE = 'fiche-';
const TAILLE_MAX_HTML = 24000;

const INTERDITS = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'form', 'input', 'button', 'textarea', 'select', 'audio', 'video', 'canvas', 'foreignobject'];

// Instantané « propre » : pas de script, pas de gestionnaire d'événement, pas de lien ou d'image venus d'ailleurs.
export function nettoyerHtml(html) {
  let doc;
  try { doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html'); } catch { return ''; }
  const racine = doc.body;
  racine.querySelectorAll('*').forEach(el => {
    if (INTERDITS.includes(el.tagName.toLowerCase())) { el.remove(); return; }
    [...el.attributes].forEach(a => {
      const nom = a.name.toLowerCase(), v = a.value.trim().toLowerCase();
      if (nom.startsWith('on') || nom === 'srcdoc' || nom === 'tabindex' || nom.startsWith('data-')) el.removeAttribute(a.name);
      else if ((nom === 'href' || nom === 'src' || nom === 'xlink:href') && !v.startsWith('#') && !v.startsWith('data:image/')) el.removeAttribute(a.name);
      else if (nom === 'style' && /expression|url\s*\(|javascript:/i.test(v)) el.removeAttribute(a.name);
    });
  });
  return racine.innerHTML;
}

function empreinte(texte) {
  let h = 5381;
  for (let i = 0; i < texte.length; i++) h = ((h << 5) + h + texte.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const ecouteurs = new Set();
export const surChangementFiches = f => { ecouteurs.add(f); return () => ecouteurs.delete(f); };
export const annoncerFiches = () => ecouteurs.forEach(f => f());

// Garde (ou met à jour) la carte affichée. Renvoie l'identifiant de la carte, ou null si elle n'a pas pu être gardée.
export function noterFiche({ sim, nomSim, etape, html, texte }) {
  if (!Number.isFinite(sim) || !html) return null;
  const propre = nettoyerHtml(html);
  if (!propre || propre.length > TAILLE_MAX_HTML) return null;
  const base = `${etape || ''}|${String(texte || '').replace(/[0-9]+([.,][0-9]+)?/g, '#').replace(/\s+/g, ' ').slice(0, 160)}`;
  const cle = `${PREFIXE_FICHE}${sim}-${empreinte(base)}`;
  let avant = null, brut = null;
  try { brut = window.localStorage.getItem(cle); avant = brut ? JSON.parse(brut) : null; } catch { /* illisible : on repart de zéro */ }
  if (avant && avant.html === propre && avant.nom === (nomSim || '') && avant.etape === (etape || '')) return cle;
  const fiche = { v: 1, sim, nom: nomSim || '', etape: etape || '', html: propre, t0: avant?.t0 || Date.now(), t: Date.now() };
  enregistrer(cle, brut !== null);
  try { window.localStorage.setItem(cle, JSON.stringify(fiche)); } catch { return null; }
  noterModification(cle);
  annoncerFiches();
  return cle;
}

// Toutes les cartes gardées sur cet appareil (et dans le compte de l'élève, une fois la synchronisation faite), de la plus récemment vue à la plus ancienne
export function listerFiches() {
  const L = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const cle = window.localStorage.key(i);
      if (!cle || !cle.startsWith(PREFIXE_FICHE)) continue;
      try { const f = JSON.parse(window.localStorage.getItem(cle)); if (f && f.html && Number.isFinite(f.sim)) L.push({ ...f, cle }); } catch { /* carte illisible : ignorée */ }
    }
  } catch { /* stockage indisponible */ }
  return L.sort((a, b) => (b.t || 0) - (a.t || 0));
}
