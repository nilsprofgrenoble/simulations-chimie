import { useState } from "react";
import { ChoixListe } from "../ChoixListe";
import { cardStyle, KIT, styleBouton, stylePetitBouton, styleBoite, ORANGE_GUIDE, ARetenir, avecIndices, exParam } from "../commun";
import { useSuivi } from "../suivi";
import { txtVec } from "./FigureVecteurs";
import { FAMILLES, GROUPES, verifier, reponseAttendue } from "./AtelierRealiserBanque";
import { Pic } from "../Pictos";

// ====================================================
//  SIM 36 — ATELIER « RÉALISER » (compétence S'APP : réaliser)
// ====================================================
// Démarche travaillée : mettre en œuvre un calcul sans erreur : unités et conversions, manipulation d'une relation,
// chiffres significatifs, fonctions usuelles, saisie à la calculatrice. Exploration seule, énoncés tirés au hasard.

const Verdict = ({ ok, children }) => (
  <div style={{ fontSize: 14, marginTop: 6, fontWeight: 700, color: ok ? '#15803d' : '#b91c1c' }}>{ok ? '✅ ' : '❌ '}{children}</div>
);
const Correction = ({ children }) => (
  <div style={{ fontSize: 13.5, marginTop: 6, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 8px', color: KIT.txt, lineHeight: 1.7 }}>{children}</div>
);

export function SimulationAtelierRealiser() {
  const depart = (() => { const p = exParam(); return FAMILLES.some(f => f.id === p) ? p : 'simple'; })();
  const [choix, setChoix] = useState(depart);
  const [exo, setExo] = useState(() => FAMILLES.find(f => f.id === depart).gen());
  const [rep, setRep] = useState({});
  const [chk, setChk] = useState({});
  const [vu, setVu] = useState({});
  const [etp, setEtp] = useState(0);
  const [indice, setIndice] = useState({});
  const Q = exo.questions;

  const charger = id => { try { document.activeElement?.blur?.(); } catch { /* sans effet */ } setExo(FAMILLES.find(f => f.id === id).gen()); setRep({}); setChk({}); setVu({}); setEtp(0); setIndice({}); };
  const resultat = q => (q.type === 'qcm' ? { ok: rep[q.id] === q.bonne, msg: '' } : verifier(q, rep[q.id] ?? ''));
  const corriger = (id, vue = false) => { if (vue) suivi.vue(); else suivi.etape(resultat(Q.find(q => q.id === id)).ok); setChk(c => ({ ...c, [id]: true })); };
  const fini = Q.every(q => (chk[q.id] && resultat(q).ok) || vu[q.id]) && Q.every(q => chk[q.id]);
  const reussi = Q.every(q => chk[q.id] && resultat(q).ok);
  const suivi = useSuivi(`36:${choix}`, reussi);

  const carte = (q, i) => {
    const affichee = !!chk[q.id], r = resultat(q), bon = r.ok;
    return (
      <div key={q.id} data-q={q.id} style={styleBoite}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: KIT.txt, marginBottom: 6, lineHeight: 1.6 }}>{i + 1}. {q.q}</div>
        {q.type === 'qcm' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {q.options.map((o, k) => (
              <button key={k} data-ok={k === q.bonne ? 'true' : 'false'} onClick={() => { setRep(x => ({ ...x, [q.id]: k })); setChk(c => ({ ...c, [q.id]: false })); }}
                style={{ ...styleBouton(rep[q.id] === k, '#0ea5e9'), textAlign: 'left', padding: '6px 10px' }}>{txtVec(o)}</button>))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input aria-label={`Réponse ${q.id}`} data-vrai={q.vrai} placeholder="?" value={rep[q.id] ?? ''}
              onChange={e => { setRep(x => ({ ...x, [q.id]: e.target.value })); setChk(c => ({ ...c, [q.id]: false })); }}
              onKeyDown={e => { if (e.key === 'Enter') corriger(q.id); }}
              style={{ fontSize: 15, padding: '4px 8px', border: `1.5px solid ${KIT.bord}`, borderRadius: 6, width: 150, color: KIT.txt, background: 'white' }}/>
            <span style={{ fontSize: 14, color: KIT.txt2 }}>{avecIndices(q.unite || '')}</span>
          </div>)}
        {indice[q.id] && q.aide && <Correction><Pic n="bulb"/>{txtVec(avecIndices(q.aide))}</Correction>}
        {affichee && <Verdict ok={bon}>{bon ? 'Bravo !' : 'Pas encore.'}</Verdict>}
        {affichee && !bon && !r.msg && !vu[q.id] && <div style={{ fontSize: 13.5, color: '#9a3412', marginTop: 4 }}>Pour trouver où ça coince, clique sur « voir le calcul pas à pas ».</div>}
        {affichee && !bon && r.msg && <div style={{ fontSize: 13.5, color: '#9a3412', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: 6, padding: '4px 8px', marginTop: 4 }}>{txtVec(r.msg)}</div>}
        {((vu[q.id] && !bon) || (affichee && bon)) && <Correction>{q.type === 'num' && !bon ? <>Réponse attendue : <b>{reponseAttendue(q)}</b>. </> : null}{q.expl}</Correction>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
          <button onClick={() => corriger(q.id)} style={styleBouton(true, '#16a34a')}>✓ Corriger</button>
          {!(affichee && bon) && <button onClick={() => { corriger(q.id, true); setVu(x => ({ ...x, [q.id]: true })); }}
            style={{ fontSize: 12.5, background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer' }}>voir le calcul pas à pas</button>}
          {q.aide && !indice[q.id] && <button onClick={() => setIndice(x => ({ ...x, [q.id]: true }))} style={stylePetitBouton(false)}><Pic n="bulb"/>Indice</button>}
          {(bon || vu[q.id]) && chk[q.id] && i === etp && i < Q.length - 1 && <button onClick={() => setEtp(e => e + 1)} style={styleBouton(true, ORANGE_GUIDE)}>Question suivante ▶</button>}
        </div>
      </div>);
  };

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>REA : réaliser un calcul</h2>
      </div>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10 }}>Compétence travaillée : <b>Réaliser</b> (REA) — mettre en œuvre un calcul sans erreur : unités et conversions, manipulation d’une relation, chiffres significatifs, fonctions de la calculatrice.</div>
      <div style={{ ...styleBoite, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 14, flex: '1 1 260px', minWidth: 0 }}>Exercice :
          <ChoixListe ariaLabel="Choix de l’exercice" titre="Choisir un exercice" valeur={choix} onChoisir={v => { setChoix(v); charger(v); }}
            groupes={GROUPES.map(g => ({ label: g, items: FAMILLES.filter(f => f.groupe === g).map(f => ({ value: f.id, label: f.titre })) }))}/>
        </div>
        <button onClick={() => charger(choix)} style={stylePetitBouton(false)}>🎲 Nouvel exercice</button>
      </div>
      <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ ...styleBoite, fontSize: 14.5, color: KIT.txt, lineHeight: 1.65 }}>{txtVec(exo.intro)}</div>
        {exo.figure}
        {Q.slice(0, etp + 1).map((q, i) => carte(q, i))}
        {fini && exo.retenir && <ARetenir titre="À RETENIR"><ul style={{ margin: 0, paddingLeft: 18 }}>{exo.retenir.map((t, i) => <li key={i}>{txtVec(t)}</li>)}</ul></ARetenir>}
      </div>
    </div>
  );
}
