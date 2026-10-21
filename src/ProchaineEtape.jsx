import { useState, useEffect, useMemo } from "react";
import { rest, toutLire } from "./serveur";
import { trierPourEleve, SEUIL_GUIDE_S } from "./devoirs";
import { etapesDevoir, prochaineSimulation } from "./profil";
import { nomsSim } from "./suivi";
import { ACCENT, ACCENT_CLAIR, TEXTE, TEXTE2 } from "./theme";
import { Pic, Emo } from "./Pictos";

// ═══════════════════════════════════════════════════════════════════════════
//  BANDEAU « OÙ J'EN SUIS » (élève connecté), en haut d'une simulation.
//  Il dit à l'élève où il en est dans le devoir de son professeur et ce qu'il doit faire ensuite (parcours guidé → défi → simulation
//  suivante), avec un bouton « Retour à mon profil ». Rien ne s'affiche si la simulation ne figure dans aucun devoir et que le parcours
//  guidé n'est pas terminé. Les données sont relues toutes les 30 s (le temps de parcours guidé s'enregistre au fil de l'eau).
// ═══════════════════════════════════════════════════════════════════════════
function cliquerSur(motif) {
  const zone = document.getElementById('zone-simulation');
  const b = zone && [...zone.querySelectorAll('button')].find(x => motif.test(x.textContent));
  if (b) { b.click(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
}

export function ProchaineEtape({ simId, naviguer }) {
  const [lignes, setLignes] = useState(null), [devoirs, setDevoirs] = useState([]), [ferme, setFerme] = useState(false);
  useEffect(() => {
    let vivant = true;
    const lire = () => {
      toutLire('activites?select=cle,reussi,duree_s,debut,maj&order=debut.desc').then(l => { if (vivant) setLignes(l); }).catch(() => {});
      rest('devoirs?select=id,titre,cles,echeance,cree_le&order=cree_le.desc').then(d => { if (vivant && Array.isArray(d)) setDevoirs(d); }).catch(() => {});
    };
    lire();
    const t = setInterval(lire, 30000);
    return () => { vivant = false; clearInterval(t); };
  }, [simId]);

  const info = useMemo(() => {
    if (!lignes) return null;
    const id = String(simId), cle = `sim:${id}`;
    const triés = trierPourEleve(devoirs, lignes).map(x => x.d);
    const concernes = triés.filter(d => (d.cles || []).includes(cle));
    const prochaine = prochaineSimulation(devoirs, lignes, trierPourEleve);
    const guideS = lignes.filter(l => l.cle === `sim:${id}:guide`).reduce((s, l) => s + (l.duree_s || 0), 0);
    // le devoir de cette simulation encore ouvert, sinon le premier qui la contient
    const parDevoir = concernes.map(d => ({ d, etapes: etapesDevoir(d, lignes).filter(e => e.sim === id) }));
    const ouvert = parDevoir.find(x => x.etapes.some(e => !e.fait)) || parDevoir[0];
    if (!ouvert) return guideS >= SEUIL_GUIDE_S ? { type: 'libre' } : null;
    const guide = ouvert.etapes.find(e => e.type === 'guide'), defisAFaire = ouvert.etapes.filter(e => e.type === 'defi' && !e.fait);
    if (guide && !guide.fait) return { type: 'guide', titre: ouvert.d.titre, min: Math.floor(Math.min(guide.guideS, SEUIL_GUIDE_S) / 60) };
    if (defisAFaire.length) return { type: 'defi', titre: ouvert.d.titre };
    return { type: 'fini', titre: ouvert.d.titre, prochaine: prochaine && String(prochaine.sim) !== id ? prochaine : null };
  }, [lignes, devoirs, simId]);

  if (!info || ferme) return null;
  const btn = { border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', background: ACCENT, color: '#fff' };
  const btn2 = { ...btn, background: '#fff', color: ACCENT, border: `2px solid ${ACCENT}`, padding: '6px 12px' };
  const [icone, texte, action] = info.type === 'guide'
    ? [<Pic n="compass" t={24}/>, <><b>Parcours guidé</b> : {info.min} / {SEUIL_GUIDE_S / 60} min. Suis les étapes, ton avancement est enregistré.</>, null]
    : info.type === 'defi'
      ? [<Pic n="ok" t={24}/>, <><b>Parcours guidé terminé, bravo !</b> Prochaine étape : réussir un défi.</>, <button style={btn} onClick={() => cliquerSur(/^\s*Défis?\s*$/)}>Aller au défi ▶</button>]
      : info.type === 'fini'
        ? [<Pic n="party" t={24}/>, <><b>Tout est fait ici !</b>{info.prochaine ? <> Prochaine simulation : <b>{nomsSim[info.prochaine.sim] || `n° ${info.prochaine.sim}`}</b>.</> : <> Ton devoir est à jour.</>}</>,
          info.prochaine ? <button style={btn} onClick={() => naviguer(Number(info.prochaine.sim))}>Y aller ▶</button> : null]
        : [<Pic n="ok" t={24}/>, <><b>Parcours guidé terminé !</b> Relève un défi, explore librement, ou retourne à ton profil.</>, <button style={btn} onClick={() => cliquerSur(/^\s*Défis?\s*$/)}>Voir les défis ▶</button>];
  return (
    <div role="status" data-prochaine-etape style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '0 0 12px', padding: '10px 14px', borderRadius: 14,
      background: ACCENT_CLAIR, border: '1px solid #b9cfe0', color: TEXTE, fontSize: 14.5, textAlign: 'left' }}>
      <span aria-hidden="true" style={{ fontSize: 22 }}>{icone}</span>
      <span style={{ flex: '1 1 260px', lineHeight: 1.45 }}>
        {info.titre && <span style={{ display: 'block', fontSize: 12.5, color: TEXTE2, fontWeight: 700 }}><Pic n="pin"/>{info.titre}</span>}{texte}</span>
      {action}
      <button style={btn2} onClick={() => naviguer(39)}>Mon profil</button>
      <button aria-label="Masquer" onClick={() => setFerme(true)} style={{ background: 'none', border: 'none', fontSize: 20, color: TEXTE2, cursor: 'pointer', padding: '0 4px' }}>×</button>
    </div>);
}
