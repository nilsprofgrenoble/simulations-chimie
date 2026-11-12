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
// Une carte n'entre dans la collection qu'une fois le parcours guidé de la simulation TERMINÉ (dernière étape atteinte), pas seulement commencé.
const CLE_FINI = 'fiches-fini-';
export const marquerTermine = sim => { try { if (Number.isFinite(sim) && !window.localStorage.getItem(CLE_FINI + sim)) { window.localStorage.setItem(CLE_FINI + sim, String(Date.now())); annoncerFiches(); } } catch { /* ignoré */ } };
export const estTermine = sim => { try { return !!window.localStorage.getItem(CLE_FINI + sim); } catch { return false; } };

// ── Schéma de la simulation, joint à sa fiche : le dessin principal de l'écran (SVG, graphique ou canevas), recopié en petite image ──
const PREFIXE_FIGURE = 'ficfig-';
const TAILLE_MAX_FIGURE = 58000;
const PROPRIETES = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'fill-opacity', 'stroke-opacity', 'font-family', 'font-size', 'font-weight', 'text-anchor', 'dominant-baseline', 'visibility', 'display'];
function inlinerStyles(source, copie) {
  const a = [source, ...source.querySelectorAll('*')], b = [copie, ...copie.querySelectorAll('*')];
  a.forEach((el, i) => { const cs = window.getComputedStyle(el); const t = b[i]; if (!t) return;
    PROPRIETES.forEach(pr => { const v = cs.getPropertyValue(pr); if (v) t.style.setProperty(pr, v); }); });
}
export async function capturerFigure() {
  try {
    const zone = document.getElementById('zone-simulation'); if (!zone) return null;
    // Graphique Plotly (2D ou 3D, dont WebGL) : Plotly sait lui-même en faire une image
    const gd = [...zone.querySelectorAll('.js-plotly-plot')].filter(el => !el.closest('[data-carte-parcours], [data-retenir], [hidden]') && el.getBoundingClientRect().width >= 220)
      .sort((x, y) => y.getBoundingClientRect().height * y.getBoundingClientRect().width - x.getBoundingClientRect().height * x.getBoundingClientRect().width)[0];
    if (gd && window.Plotly && window.Plotly.toImage) {
      const rg = gd.getBoundingClientRect(), L = Math.min(720, Math.round(rg.width));
      for (const q of [1, 0.7]) {
        const d = await window.Plotly.toImage(gd, { format: 'jpeg', width: Math.round(L * q), height: Math.round(rg.height * L * q / rg.width) });
        if (d && d.length < TAILLE_MAX_FIGURE) return d;
      }
      return null;
    }
    const candidats = [...zone.querySelectorAll('svg, canvas')].filter(el => {
      if (el.closest('[data-carte-parcours], [data-retenir], button, [hidden]')) return false;
      const r = el.getBoundingClientRect(); return r.width >= 220 && r.height >= 130;
    }).sort((x, y) => { const rx = x.getBoundingClientRect(), ry = y.getBoundingClientRect(); return ry.width * ry.height - rx.width * rx.height; });
    const el = candidats[0]; if (!el) return null;
    const r = el.getBoundingClientRect();
    const W = Math.min(720, Math.round(r.width)), H = Math.round(r.height * W / r.width);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    if (el.tagName.toLowerCase() === 'canvas') ctx.drawImage(el, 0, 0, W, H);
    else {
      const copie = el.cloneNode(true); inlinerStyles(el, copie);
      copie.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); copie.setAttribute('width', r.width); copie.setAttribute('height', r.height);
      if (!copie.getAttribute('viewBox')) copie.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
      copie.querySelectorAll('foreignObject, script').forEach(x => x.remove());
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(copie));
      const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = url; });
      ctx.drawImage(img, 0, 0, W, H);
    }
    for (const q of [0.72, 0.55, 0.4]) { const d = cv.toDataURL('image/jpeg', q); if (d.length < TAILLE_MAX_FIGURE) return d; }
    return null;
  } catch { return null; }
}
export function noterFigure(sim, dataUrl) {
  if (!Number.isFinite(sim) || !dataUrl || !dataUrl.startsWith('data:image/')) return;
  const cle = PREFIXE_FIGURE + sim;
  let brut = null; try { brut = window.localStorage.getItem(cle); } catch { /* ignoré */ }
  enregistrer(cle, brut !== null);
  try { window.localStorage.setItem(cle, JSON.stringify({ v: 1, sim, img: dataUrl, t: Date.now() })); } catch { return; }
  noterModification(cle);
  annoncerFiches();
}
export function lireFigure(sim) {
  try { const f = JSON.parse(window.localStorage.getItem(PREFIXE_FIGURE + sim) || 'null'); return f && typeof f.img === 'string' && f.img.startsWith('data:image/') ? f.img : null; } catch { return null; }
}
export const aFigure = sim => { try { return !!window.localStorage.getItem(PREFIXE_FIGURE + sim); } catch { return false; } };

export function listerFiches() {
  const L = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const cle = window.localStorage.key(i);
      if (!cle || !cle.startsWith(PREFIXE_FICHE)) continue;
      try { const f = JSON.parse(window.localStorage.getItem(cle)); if (f && f.html && Number.isFinite(f.sim) && estTermine(f.sim)) L.push({ ...f, cle }); } catch { /* carte illisible : ignorée */ }
    }
  } catch { /* stockage indisponible */ }
  return L.sort((a, b) => (b.t || 0) - (a.t || 0));
}

// ═════ RÉCOLTE : retrouver les cartes des simulations déjà travaillées ═════
// Le site ne garde pas le texte des cartes, seulement l'avancement. On rouvre donc chaque simulation travaillée dans un cadre invisible
// (adresse « ?sim=N&recolte=1 ») qui ne compte aucun temps et qui renvoie les cartes des étapes déjà atteintes à la page « Mes fiches ».
export const EN_RECOLTE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('recolte');
export const envoyerRecolte = fiche => { try { window.parent.postMessage({ type: 'fiche-recolte', fiche }, window.location.origin); } catch { /* sans parent : rien à faire */ } };
export const envoyerFigure = (sim, img) => { try { window.parent.postMessage({ type: 'fiche-figure', sim, img }, window.location.origin); } catch { /* idem */ } };
export const finRecolte = () => { try { window.parent.postMessage({ type: 'fiche-recolte-fin' }, window.location.origin); } catch { /* idem */ } };

export async function recolterFiches(ids, surAvancee) {
  let trouvees = 0;
  for (let i = 0; i < ids.length; i++) {
    if (surAvancee) surAvancee(i, ids.length);
    await new Promise(fini => {
      const cadre = document.createElement('iframe');
      cadre.setAttribute('aria-hidden', 'true'); cadre.tabIndex = -1;
      cadre.style.cssText = 'position:fixed;left:-9999px;top:0;width:1100px;height:900px;border:0;visibility:hidden';
      let fin = false;
      const terminer = () => { if (fin) return; fin = true; window.removeEventListener('message', ecouter); clearTimeout(garde); cadre.remove(); fini(); };
      const ecouter = e => {
        if (e.origin !== window.location.origin || e.source !== cadre.contentWindow || !e.data) return;
        if (e.data.type === 'fiche-recolte' && e.data.fiche) { if (noterFiche(e.data.fiche)) trouvees++; }
        else if (e.data.type === 'fiche-figure') { noterFigure(Number(e.data.sim), e.data.img); }
        else if (e.data.type === 'fiche-recolte-fin') terminer();
      };
      const garde = setTimeout(terminer, 15000);
      window.addEventListener('message', ecouter);
      cadre.src = `${window.location.pathname}?sim=${ids[i]}&recolte=1`;
      document.body.appendChild(cadre);
    });
  }
  return trouvees;
}
