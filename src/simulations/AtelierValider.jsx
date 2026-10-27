import { ChoixListe } from "../ChoixListe";
import { useState, useMemo } from "react";
import { cardStyle, KIT, styleBouton, stylePetitBouton, styleBoite, ORANGE_GUIDE, ARetenir, ExempleResolu, avecIndices, exParam, venantDuDevoir, lireNombre, proche } from "../commun";
import { useSuivi } from "../suivi";
import { parDomaine } from "./ordreDomaines";
import { Pic } from "../Pictos";
import { FAMILLES, NIVEAUX, METHODE_PLAUSIBLE, METHODE_COMPAT } from "./AtelierValiderBanque";

// ====================================================
//  SIM 77 — ATELIER « VALIDER » (compétence VAL)
// ====================================================
// Deux entraînements : juger si un résultat est plausible (comparaison à des repères donnés à l'écran) et décider si une mesure
// est compatible avec une référence (écart ≤ 2·u). L'élève n'a besoin d'aucune connaissance du sujet : repères et règle sont affichés.

const COULEUR = '#b45a1f';
const NB = ' ';
const T = s => (typeof s === 'string'
  ? avecIndices(s.replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NB}`).replace(/(\d) (?=[A-Za-zµ°%€Ωθ²³]|h\b)/g, `$1${NB}`).replace(/ ([:;?!])/g, `${NB}$1`))
  : s);
const melange = n => { const a = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const VERT = '#15803d', ROUGE = '#b91c1c';
const Verdict = ({ ok, children }) => (
  <div style={{ fontSize: 14, marginTop: 8, fontWeight: 700, color: ok ? VERT : ROUGE }}>{ok ? '✅ ' : '❌ '}{children}</div>
);
const Expl = ({ ok, children }) => (
  <div style={{ fontSize: 13.5, marginTop: 3, marginLeft: 4, color: ok == null ? KIT.txt : ok ? '#166534' : '#991b1b', lineHeight: 1.5 }}>{children}</div>
);
const lien = { fontSize: 12.5, background: 'none', border: 'none', color: KIT.txt2, textDecoration: 'underline', cursor: 'pointer' };
const choix = (actif, etat) => ({
  ...styleBouton(actif, COULEUR), textAlign: 'left', padding: '6px 10px', fontWeight: 600, lineHeight: 1.45,
  ...(etat === 'bon' ? { background: '#dcfce7', borderColor: VERT, color: '#14532d' } : {}),
  ...(etat === 'faux' ? { background: '#fee2e2', borderColor: ROUGE, color: '#7f1d1d' } : {}),
  ...(etat === 'manque' ? { background: 'white', border: `2px dashed ${ORANGE_GUIDE}`, color: KIT.txt } : {}),
});

function Qcm({ o, perm, val, set, chk, vu }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {perm.map(i => {
        const etat = (chk || vu) && val === i ? (o[i][1] ? 'bon' : 'faux') : vu && o[i][1] ? 'manque' : null;
        return (
          <div key={`${i}-${o[i][0]}`}>
            <button data-ok={o[i][1] ? 'true' : 'false'} onClick={() => set(i)} style={{ ...choix(val === i && !etat, etat), width: '100%' }}>{T(o[i][0])}</button>
            {((chk && val === i) || vu) && <Expl ok={o[i][1]}>{o[i][1] ? '✔ ' : '✘ '}{T(o[i][2])}</Expl>}
          </div>);
      })}
    </div>);
}

function Saisie({ e, val, set, chk, vu }) {
  const bon = chk && e.ok(val);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <input aria-label={e.titre} inputMode="decimal" value={val ?? ''} onChange={ev => set(ev.target.value)} placeholder="ta valeur"
          style={{ fontSize: 15, padding: '5px 8px', width: 120, borderRadius: 6, border: `1.5px solid ${chk ? (bon ? VERT : ROUGE) : KIT.bord}`, color: KIT.txt, background: 'white' }}/>
        <span style={{ fontSize: 14.5, color: KIT.txt }}>{T(e.unite)}</span>
      </div>
      {(vu) && <Expl ok={null}>Réponse attendue : <b>{T(String(e.attendu).replace('.', ','))} {T(e.unite)}</b>. {T(e.expl)}</Expl>}
    </div>);
}

// ── Étapes d'un exercice ──
function etapesDe(fam, it) {
  if (fam === 'plausible') return [
    { id: 'verdict', type: 'qcm', fixe: true, titre: 'Ton verdict', q: 'Compare le résultat de l’élève aux repères. Est-il plausible ?', o: it.verdict,
      aide: 'Mets le résultat dans une unité qui te parle (km/h, bar, minutes…) puis compare-le à un repère : est-ce du même ordre de grandeur ?' },
    { id: 'pourquoi', type: 'qcm', titre: it.plausible ? 'Aller plus loin' : 'Trouver l’erreur', q: it.q2, o: it.options,
      aide: 'Refais mentalement le calcul avec des nombres ronds, ou cherche quelle erreur de puissance de 10 correspond à l’écart entre le résultat et ce que tu attendais.' },
  ];
  const ecart = { id: 'ecart', type: 'num', titre: 'Calculer l’écart', q: `Calcule l’écart |x − x_ref| entre la mesure et la référence (en ${it.uEcart}).`, attendu: it.ecart, unite: it.uEcart,
    ok: v => { const x = lireNombre(v); return Number.isFinite(x) && proche(x, it.ecart, 0.03); },
    expl: 'On soustrait les deux valeurs, sans tenir compte du signe.', aide: 'Soustrais la plus petite valeur de la plus grande, en gardant la même unité pour les deux.' };
  return [
    ecart,
    ...(it.uc != null ? [{ id: 'uc', type: 'num', titre: 'Composer les incertitudes', q: `Calcule l’incertitude composée u_c = √(u₁² + u₂²) (en ${it.uEcart}, arrondie à 2 chiffres).`, attendu: it.uc, unite: it.uEcart,
      ok: v => { const x = lireNombre(v); return Number.isFinite(x) && proche(x, it.uc, 0.03); },
      expl: 'On additionne les carrés des deux incertitudes puis on prend la racine carrée.', aide: 'Élève u₁ et u₂ au carré, additionne, puis touche √ sur la calculatrice.' }] : []),
    { id: 'verdict', type: 'qcm', fixe: true, titre: 'Comparer à 2·u', q: it.uc != null ? 'Compare l’écart à 2·u_c. Les deux valeurs sont-elles compatibles ?' : 'Compare l’écart à 2·u. La mesure est-elle compatible avec la référence ?',
      o: [['Compatible', it.compatible, it.expl], ['Non compatible', !it.compatible, it.expl]],
      aide: 'Règle : écart ≤ 2·u ⇒ compatible ; écart > 2·u ⇒ non compatible. Calcule d’abord 2·u.' },
    { id: 'conclusion', type: 'qcm', titre: it.compatible ? 'Conclure' : 'Chercher une cause', q: it.q4, o: it.options,
      aide: it.compatible ? 'Compatible ne veut pas dire « identique » ni « démontré ».' : 'Regarde le sens de l’écart (mesure plus grande ou plus petite que la référence) : l’explication doit aller dans le même sens.' },
  ];
}
const permsDe = etapes => Object.fromEntries(etapes.map(e => [e.id, e.type === 'qcm' ? (e.fixe ? e.o.map((_, i) => i) : melange(e.o.length)) : null]));

const EXEMPLES = {
  plausible: (
    <ExempleResolu titre="Exemple résolu">
      Un élève calcule la masse d’un seau de 10 L d’eau et trouve m = 1,0×10⁴ kg. <b>Repère :</b> 1 L d’eau a une masse d’environ 1 kg. <b>Comparaison :</b> 10 L devraient peser environ 10 kg, or 1,0×10⁴ kg font 10 tonnes, soit 1 000 fois plus : le résultat n’est <b>pas plausible</b>. <b>Cause probable :</b> litres confondus avec millilitres (10 L = 1,0×10⁴ mL), puis 1 g par mL traité comme 1 kg.
    </ExempleResolu>),
  compat: (
    <ExempleResolu titre="Exemple résolu">
      Un élève mesure la masse volumique de l’éthanol : ρ = 0,795 g·cm⁻³ avec u = 0,006 g·cm⁻³. Référence : 0,789 g·cm⁻³. <b>Écart :</b> |0,795 − 0,789| = 0,006. <b>Seuil :</b> 2·u = 0,012. Comme 0,006 ≤ 0,012, la mesure est <b>compatible</b> avec la référence : l’écart s’explique par l’incertitude.
    </ExempleResolu>),
};

export function SimulationAtelierValider({ naviguer }) {
  const [duDevoir] = useState(venantDuDevoir);
  const depart = (() => { const [f, i] = (exParam() || '').split('.'); const fa = FAMILLES.find(x => x.id === f); const k = fa ? fa.liste.findIndex(x => x.id === i) : -1; return { f: fa ? f : 'plausible', i: Math.max(0, k) }; })();
  const [fam, setFam] = useState(depart.f);
  const famille = FAMILLES.find(f => f.id === fam);
  const [idx, setIdx] = useState(depart.i);
  const it = famille.liste[Math.min(idx, famille.liste.length - 1)];
  const etapes = useMemo(() => etapesDe(fam, it), [fam, it]);
  const [graine, setGraine] = useState(0);
  const perms = useMemo(() => permsDe(etapes), [etapes, graine]); // eslint-disable-line react-hooks/exhaustive-deps
  const [rep, setRep] = useState({});
  const [chk, setChk] = useState({});
  const [vu, setVu] = useState({});
  const [aide, setAide] = useState({});
  const [etp, setEtp] = useState(0);

  const charger = (f, i) => { try { document.activeElement?.blur?.(); } catch { /* sans effet */ } setFam(f); setIdx(i); setRep({}); setChk({}); setVu({}); setAide({}); setEtp(0); setGraine(g => g + 1); };
  const suivant = () => charger(fam, (idx + 1) % famille.liste.length);
  const hasard = () => { const n = famille.liste.length; let j = idx; if (n > 1) while (j === idx) j = Math.floor(Math.random() * n); charger(fam, j); };
  const majRep = (id, v) => { setRep(r => ({ ...r, [id]: v })); setChk(c => ({ ...c, [id]: false })); };

  const resultat = e => {
    const r = rep[e.id];
    if (e.type === 'qcm') return { ok: r != null && e.o[r][1], msg: r == null ? 'Choisis une réponse.' : '' };
    return { ok: e.ok(r), msg: r == null || r === '' ? 'Écris une valeur.' : 'Vérifie ton calcul et l’unité.' };
  };
  const fini = etapes.every(e => chk[e.id] && (resultat(e).ok || vu[e.id]));
  const reussi = etapes.every(e => chk[e.id] && resultat(e).ok);
  const suivi = useSuivi(`77:${fam}:${it.id}`, reussi);

  const carte = (e, k) => {
    const r = resultat(e), c = !!chk[e.id], v = !!vu[e.id];
    return (
      <div key={e.id} data-etape={e.id} style={styleBoite}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: COULEUR, letterSpacing: 0.3, textTransform: 'uppercase' }}>{`Étape ${k + 1} / ${etapes.length} — `}{e.titre}</div>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: KIT.txt, margin: '4px 0 8px', lineHeight: 1.5 }}>{T(e.q)}</div>
        {e.type === 'qcm' && <Qcm o={e.o} perm={perms[e.id]} val={rep[e.id]} set={i => majRep(e.id, i)} chk={c} vu={v}/>}
        {e.type === 'num' && <Saisie e={e} val={rep[e.id]} set={x => majRep(e.id, x)} chk={c} vu={v}/>}
        {aide[e.id] && <div data-aide style={{ fontSize: 13.5, color: '#92400e', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '4px 8px', marginTop: 6 }}><Pic n="bulb"/>{T(e.aide)}</div>}
        {c && <Verdict ok={r.ok}>{r.ok ? 'Bravo !' : 'Pas encore.'}{!r.ok && r.msg ? <span style={{ fontWeight: 500, color: KIT.txt }}> {T(r.msg)}</span> : null}</Verdict>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
          {!(c && r.ok) && <button onClick={() => { suivi.etape(r.ok); setChk(x => ({ ...x, [e.id]: true })); }} style={styleBouton(true, '#16a34a')}>✓ Corriger</button>}
          {!aide[e.id] && !(c && r.ok) && <button onClick={() => setAide(x => ({ ...x, [e.id]: true }))} style={stylePetitBouton(false)}><Pic n="bulb"/>Coup de pouce</button>}
          {c && !v && <button onClick={() => { suivi.vue(); setVu(x => ({ ...x, [e.id]: true })); }} style={lien}>{r.ok ? 'voir toutes les explications' : 'voir la correction'}</button>}
          {(r.ok || v) && c && k === etp && k < etapes.length - 1 && <button onClick={() => setEtp(x => x + 1)} style={styleBouton(true, ORANGE_GUIDE)}>Étape suivante ▶</button>}
        </div>
      </div>);
  };

  const methode = fam === 'plausible' ? METHODE_PLAUSIBLE : METHODE_COMPAT;
  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 18, color: KIT.txt, fontWeight: 700 }}>VAL : valider un résultat</h2>
      <div style={{ fontSize: 13.5, color: KIT.txt2, marginBottom: 10 }}>Compétence travaillée : <b>Valider</b> (VAL) — garder un regard critique sur un résultat : est-il vraisemblable ? est-il compatible avec la référence ? <b>Tu n’as rien à apprendre par cœur : les repères sont donnés.</b></div>
      <div style={{ ...styleBoite, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 14, flex: '1 1 240px', minWidth: 0 }}>Entraînement :
          <ChoixListe ariaLabel="Type d’entraînement" titre="Type d’entraînement" valeur={fam} onChoisir={v => charger(v, 0)}
            groupes={[{ items: FAMILLES.map(f => ({ value: f.id, label: f.titre })) }]}/>
        </div>
        <div style={{ fontSize: 14, flex: '1 1 260px', minWidth: 0 }}>Exercice :
          <ChoixListe ariaLabel="Choix de l’exercice" titre="Choisir un exercice" valeur={it.id} onChoisir={v => charger(fam, famille.liste.findIndex(x => x.id === v))}
            groupes={parDomaine(famille.liste).map(([d, l]) => ({ label: d, items: l.map(x => ({ value: x.id, label: `${'★'.repeat(x.niveau)} ${x.titre}` })) }))}/>
        </div>
        <button onClick={hasard} style={stylePetitBouton(false)}>🎲 Au hasard</button>
        <div style={{ flexBasis: '100%', fontSize: 13, color: KIT.txt2 }}>{famille.aide}</div>
      </div>
      <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <details data-methode style={{ ...styleBoite, fontSize: 13.5, color: KIT.txt }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>La démarche et un exemple résolu</summary>
          <ol style={{ margin: '6px 0 0', paddingLeft: 20, lineHeight: 1.55 }}>{methode.map((m, i) => <li key={i}>{T(m)}</li>)}</ol>
          {EXEMPLES[fam]}
        </details>
        <div style={{ ...styleBoite, background: 'white' }}>
          <div style={{ fontSize: 12.5, color: KIT.txt2, fontWeight: 700 }}>{it.domaine} · {NIVEAUX[it.niveau]}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: KIT.txt, margin: '2px 0 6px' }}>{it.titre}</div>
          <div style={{ fontSize: 15, color: KIT.txt, lineHeight: 1.65 }}>{T(it.enonce || it.contexte)}</div>
        </div>
        <div data-reperes style={{ ...styleBoite, background: '#fff7ed', border: '1.5px solid #fdba74' }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: COULEUR, marginBottom: 4 }}><Pic n="book"/>REPÈRES (à ta disposition, inutile de les apprendre)</div>
          <table style={{ borderCollapse: 'collapse', fontSize: 14, color: KIT.txt, width: '100%' }}>
            <tbody>{it.reperes.map(([a, b]) => <tr key={a}><td style={{ padding: '2px 10px 2px 0', color: KIT.txt2, verticalAlign: 'top' }}>{T(a)}</td><td style={{ padding: '2px 0', fontWeight: 700 }}>{T(b)}</td></tr>)}</tbody>
          </table>
        </div>
        {etapes.slice(0, etp + 1).map((e, k) => carte(e, k))}
        {fini && (
          <ARetenir titre="À RETENIR">
            <ol style={{ margin: 0, paddingLeft: 20 }}>{methode.map((m, i) => <li key={i}>{T(m)}</li>)}</ol>
            {fam === 'plausible' && <div style={{ marginTop: 4 }}>« Plausible » ne veut pas dire « exact » : le test de vraisemblance repère les grosses erreurs.</div>}
            {fam === 'compat' && <div style={{ marginTop: 4 }}>« Compatible » ne veut pas dire « identique » : l’écart est simplement du même ordre que l’incertitude.</div>}
          </ARetenir>)}
        {fini && (duDevoir && naviguer
          ? <button onClick={() => naviguer(39)} style={{ ...styleBouton(true, '#334155'), alignSelf: 'flex-start' }}>↩ Retour à mon devoir</button>
          : <button onClick={suivant} style={{ ...styleBouton(true, '#334155'), alignSelf: 'flex-start' }}>Exercice suivant ▶</button>)}
      </div>
    </div>
  );
}
