import { useState, useEffect } from "react";
import { useSignalerMode, declarerDefis } from "../suivi";
import { cardStyle, CarteParcours, useEtatPersistant, KIT, styleBouton, stylePetitBouton, styleBoite, Section,
  BoutonsModes, ARetenir, ExempleResolu, lireNombre, proche } from "../commun";
import { fr, chauffe, C_EAU } from "./elecModele";
import { BLEU, VERMILLON, alea } from "./elecOutils";
import { Curseur, VoletDefiGen, Graphe } from "./elecCommun";

// ====================================================
//  SIM 71 — PUISSANCE, EFFET JOULE ET RENDEMENT (1G spé PC, « Aspects énergétiques des phénomènes électriques »)
//  P = U·I, W = P·Δt, coût (kWh) ; effet Joule Q = R·I²·Δt ; pertes en ligne ; rendement d'un convertisseur ; AE calorimètre (W_élec = U·I·Δt, Q = m·C·Δθ).
//  Hypothèses : tension du secteur 220 V (comme dans le cours), tarif 0,20 €/kWh, régime continu, énergies comptées positivement,
//  rendements d'ordre de grandeur, ligne monophasée simplifiée de résistance 0,1 Ω/km, calorimètre : capacité des accessoires 40 J/K et pertes 0,15 W/K.
// ====================================================

const SIM = 71;
declarerDefis(SIM, [
  ['cout', 'Énergie et coût'],
  ['joule', 'Effet Joule'],
  ['ligne', 'Pertes en ligne'],
  ['rendement', 'Rendement'],
]);
const TITRES = { cout: 'Énergie et coût', joule: 'Effet Joule', ligne: 'Pertes en ligne', rendement: 'Rendement' };
const U_SECTEUR = 220, TARIF = 0.20;
const APPAREILS = [['Lampe LED', 5], ['Ordinateur portable', 60], ['Radiateur', 500], ['Aspirateur', 1500], ['Bouilloire', 2000]];
const CONVERTISSEURS = [
  ['res', 'Résistance chauffante (bouilloire)', 1.00, 'transfert thermique Q', 'aucune perte : tout est converti en chaleur utile'],
  ['moteur', 'Moteur de trottinette', 0.85, 'travail mécanique', 'chaleur dissipée dans le moteur'],
  ['led', 'Lampe LED', 0.30, 'rayonnement visible', 'chaleur'],
  ['inc', 'Lampe à incandescence', 0.05, 'rayonnement visible', 'chaleur (rayonnement infrarouge)'],
];
const fE = J => (J >= 1e6 ? `${fr(J / 1e6, 2)} MJ` : J >= 1e3 ? `${fr(J / 1e3, 1)} kJ` : `${fr(J, 0)} J`);
const fP = W => (W >= 1e6 ? `${fr(W / 1e6, 2)} MW` : W >= 1e3 ? `${fr(W / 1e3, 2)} kW` : `${fr(W, W < 10 ? 1 : 0)} W`);

// ---------- barre de bilan (utile / pertes) ----------
function Bilan({ Pe, rho, utile, pertes }) {
  const w = 520, u = rho * w;
  return (
    <svg viewBox="0 0 560 200" width="100%" role="img" aria-label={`Bilan de puissance : ${fr(rho * 100, 0)} % utile, ${fr((1 - rho) * 100, 0)} % de pertes`} style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, maxWidth: 640 }}>
      <text x="20" y="28" fontSize="14" fontWeight="800" fill="#0f172a">Puissance électrique reçue : P<tspan fontSize="11" dy="3">élec</tspan><tspan dy="-3"> = {fP(Pe)}</tspan></text>
      <rect x="20" y="40" width={w} height="36" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2"/><text x="280" y="64" fontSize="15" fontWeight="800" textAnchor="middle" fill="#0f172a">{fP(Pe)} reçus</text>
      <text x="20" y="100" fontSize="12.5" fontWeight="700" fill={GRIS_T}>↓ elle se répartit en :</text>
      <rect x="20" y="108" width={Math.max(u, 0.5)} height="40" fill={BLEU}/>
      <rect x={20 + u} y="108" width={w - u} height="40" fill="#fff" stroke={VERMILLON} strokeWidth="3" strokeDasharray="6 4"/>
      {u > 90 && <text x={20 + u / 2} y="133" fontSize="14" fontWeight="800" textAnchor="middle" fill="#fff">utile : {fP(rho * Pe)}</text>}
      {w - u > 110 && <text x={20 + u + (w - u) / 2} y="133" fontSize="14" fontWeight="800" textAnchor="middle" fill={VERMILLON}>pertes : {fP((1 - rho) * Pe)}</text>}
      <text x="20" y="176" fontSize="13.5" fontWeight="700" fill={BLEU}>■ puissance utile ({utile}) : {fP(rho * Pe)}</text>
      <text x="20" y="194" fontSize="13.5" fontWeight="700" fill={VERMILLON}>▭ puissance perdue ({pertes}) : {fP((1 - rho) * Pe)}</text>
    </svg>);
}
const GRIS_T = '#475569';

// ---------- défis ----------
function nouveauDefi(type) {
  const base = { type, reps: {}, verifie: false, solution: false };
  if (type === 'cout') { const P = alea([500, 1000, 1500, 2000]), dt = alea([10, 30, 60, 120, 240]), c = P / 1000 * dt / 60 * TARIF; return { ...base, P, dt, kWh: P / 1000 * dt / 60, cout: c }; }
  if (type === 'joule') { const R = alea([10, 22, 47, 100]), I = alea([0.5, 1, 2, 3]), dt = alea([30, 60, 120]); return { ...base, R, I, dt, Q: R * I * I * dt }; }
  if (type === 'ligne') for (;;) { const P = alea([50, 100, 200]), U = alea([100, 200, 400]), L = alea([100, 200, 500]), I = P * 1e6 / (U * 1e3), r = 0.1 * L, Pj = r * I * I / 1e6; if (Pj < 0.4 * P) return { ...base, P, U, L, I, r, Pj }; }
  const Pe = alea([100, 200, 500, 1000]), rho = alea([0.6, 0.7, 0.75, 0.8, 0.9]), v = alea(['rho', 'utile']);
  return { ...base, Pe, rho, v, Pu: Pe * rho };
}
function evaluer(d) {
  const x = lireNombre(d.reps.v);
  if (d.type === 'cout') { const ok = isFinite(x) && Math.abs(x - d.cout) <= Math.max(0.006, 0.03 * d.cout); return { ok, lignes: [[ok, ok ? 'Coût correct.' : 'Revois : énergie = P × Δt en kWh (P en kW, Δt en h), puis coût = énergie × 0,20 €/kWh.']] }; }
  if (d.type === 'joule') { const ok = isFinite(x) && proche(x, d.Q, 0.015); return { ok, lignes: [[ok, ok ? 'Transfert thermique correct.' : 'Revois : Q = R × I² × Δt (attention : I est au carré), Q en joules, Δt en secondes.']] }; }
  if (d.type === 'ligne') { const ok = isFinite(x) && proche(x, d.Pj, 0.03); return { ok, lignes: [[ok, ok ? 'Puissance perdue correcte.' : 'Revois : I = P / U (en A, avec P en W et U en V), puis P_perdue = r × I² avec r = 0,1 Ω/km × longueur.']] }; }
  const cible = d.v === 'rho' ? d.rho * 100 : d.Pu, ok = isFinite(x) && proche(x, cible, 0.015);
  return { ok, lignes: [[ok, ok ? 'Bonne réponse.' : 'Revois : ρ = puissance utile / puissance consommée (en % : × 100).']] };
}
const enonce = (d, { champ }) => {
  if (d.type === 'cout') return <>🎯 Un appareil de puissance <strong>{d.P} W</strong> fonctionne pendant <strong>{d.dt} min</strong>. Quel est le coût de l’énergie consommée, sachant que le kWh est facturé <strong>0,20 €</strong> ?<div style={{ marginTop: 6 }}>{champ('v', '€')}</div></>;
  if (d.type === 'joule') return <>🎯 Un conducteur ohmique de résistance <strong>R = {d.R} Ω</strong> est parcouru par un courant d’intensité <strong>I = {fr(d.I, 1)} A</strong> pendant <strong>Δt = {d.dt} s</strong>. Quel transfert thermique Q est produit par effet Joule ?<div style={{ marginTop: 6 }}>{champ('v', 'J')}</div></>;
  if (d.type === 'ligne') return <>🎯 Une ligne électrique de <strong>{d.L} km</strong> (résistance <strong>0,1 Ω par km</strong>) transporte une puissance <strong>P = {d.P} MW</strong> sous une tension <strong>U = {d.U} kV</strong>. Quelle puissance est perdue par effet Joule dans la ligne ? (en MW)<div style={{ marginTop: 6 }}>{champ('v', 'MW')}</div></>;
  return d.v === 'rho' ? <>🎯 Un moteur reçoit une puissance électrique de <strong>{d.Pe} W</strong> et fournit une puissance mécanique de <strong>{fr(d.Pu, 0)} W</strong>. Quel est son rendement ρ ? (en %)<div style={{ marginTop: 6 }}>{champ('v', '%')}</div></>
    : <>🎯 Un moteur de rendement <strong>ρ = {fr(d.rho * 100, 0)} %</strong> reçoit une puissance électrique de <strong>{d.Pe} W</strong>. Quelle puissance mécanique fournit-il ?<div style={{ marginTop: 6 }}>{champ('v', 'W')}</div></>;
};
const solution = d => d.type === 'cout' ? <>E = P × Δt = {fr(d.P / 1000, 3)} kW × {fr(d.dt / 60, 3)} h = {fr(d.kWh, 3)} kWh ; coût = {fr(d.kWh, 3)} × 0,20 = <strong>{fr(d.cout, 3)} €</strong>.</>
  : d.type === 'joule' ? <>Q = R × I² × Δt = {d.R} × {fr(d.I, 1)}² × {d.dt} = <strong>{fr(d.Q, 0)} J</strong>.</>
  : d.type === 'ligne' ? <>I = P / U = {d.P}·10⁶ / {d.U}·10³ = {fr(d.I, 0)} A ; r = 0,1 × {d.L} = {fr(d.r, 0)} Ω ; P<sub>perdue</sub> = r × I² = {fr(d.r, 0)} × {fr(d.I, 0)}² = <strong>{fr(d.Pj, 2)} MW</strong> ({fr(d.Pj / d.P * 100, 1)} % de la puissance transportée).</>
  : d.v === 'rho' ? <>ρ = P<sub>utile</sub> / P<sub>consommée</sub> = {fr(d.Pu, 0)} / {d.Pe} = {fr(d.rho, 2)} = <strong>{fr(d.rho * 100, 0)} %</strong>.</>
  : <>P<sub>utile</sub> = ρ × P<sub>consommée</sub> = {fr(d.rho, 2)} × {d.Pe} = <strong>{fr(d.Pu, 0)} W</strong>.</>;

// ====================================================
export function SimulationPuissanceJoule() {
  const [mode, setMode] = useState('explore');
  useSignalerMode(mode);
  const [guide, setGuide] = useEtatPersistant('puissance-guide-v1', { etape: 0, reps: {}, verifs: {}, reussies: {} });
  const [defi, setDefi] = useState(null);
  const [atelier, setAtelier] = useState('dipole');
  const [A, setA] = useState({ k: 3, dt: 10, vu: false });
  const [J, setJ] = useState({ R: 47, I: 1, dt: 60 });
  const [L, setL] = useState({ P: 100, U: 400, L: 200 });
  const [Rd, setRd] = useState({ k: 'moteur', perso: 0.6, Pe: 100 });
  const [Ca, setCa] = useState({ U: 12.34, I: 1.98, m: 0.2, pertes: true, t: 300 });
  const [hypoOuv, setHypoOuv] = useState(false);
  const enGuide = mode === 'guide', enDefi = mode === 'defi' && !!defi, enExplore = mode === 'explore';
  const voir = (at, p) => { setAtelier(at); if (p) { if (at === 'dipole') setA(a => ({ ...a, ...p })); if (at === 'joule') setJ(j => ({ ...j, ...p })); if (at === 'rendement') setRd(r => ({ ...r, ...p })); if (at === 'ligne') setL(l => ({ ...l, ...p })); } };

  // calculs
  const PA = APPAREILS[A.k][1], IA = PA / U_SECTEUR, WA = PA * A.dt * 60, kWhA = PA / 1000 * A.dt / 60, coutA = kWhA * TARIF;
  const Pj = J.R * J.I * J.I, Uj = J.R * J.I;
  const IL = L.P * 1e6 / (L.U * 1e3), rL = 0.1 * L.L, PjL = rL * IL * IL / 1e6, pcL = PjL / L.P * 100;
  const conv = CONVERTISSEURS.find(c => c[0] === Rd.k), rho = conv ? conv[2] : Rd.perso;
  const pts = chauffe({ m: Ca.m, U: Ca.U, I: Ca.I, pertes: Ca.pertes }), ptC = pts[Math.round(Ca.t / 15)];
  const ymaxC = Math.ceil(pts[pts.length - 1].W / 2000) * 2;

  const ETAPES = [
    { id: 'travail', titre: 'Le travail électrique', depart: () => voir('dipole'),
      texte: <>Une pile alimente une lampe : la lampe <strong>reçoit</strong> de l’énergie de la pile, qui lui en <strong>cède</strong>. Cette énergie échangée s’appelle le <strong>travail électrique W<sub>élec</sub></strong> (en joules). Un dipôle qui <strong>fournit</strong> du travail électrique au reste du circuit fonctionne en <strong>générateur</strong> (pile) ; celui qui en <strong>reçoit</strong> fonctionne en <strong>récepteur</strong> (lampe, moteur, résistance chauffante).</>,
      tache: { type: 'qcm', q: 'Une bouilloire électrique, qui reçoit du travail électrique du secteur, fonctionne en…', options: ['récepteur', 'générateur', 'ni l’un ni l’autre', 'les deux à la fois'], bonne: 0, expl: 'Elle reçoit de l’énergie électrique : c’est un récepteur.' } },
    { id: 'puissance', titre: 'La puissance : un débit d’énergie', depart: () => voir('dipole', { k: 2, dt: 60 }),
      texte: <>La <strong>puissance P</strong> est l’énergie échangée par seconde : <strong>P = W / Δt</strong>, donc <strong>W = P × Δt</strong>. Son unité est le <strong>watt</strong> : 1 W = 1 J·s⁻¹. Un radiateur de 500 W reçoit 500 J chaque seconde. Attention : <strong>W</strong> en italique désigne un travail (en J), alors que <strong>W</strong> droit est le watt.
        <ExempleResolu>Radiateur de 500 W pendant 1 h : W = 500 × 3600 = <strong>1 800 000 J</strong> = 1,8 MJ. C’est énorme en joules… d’où une autre unité : 500 W × 1 h = <strong>500 W·h</strong> = 0,5 kWh.</ExempleResolu></>,
      tache: { type: 'qcm', q: 'Parmi ces unités, laquelle est une unité d’énergie ?', options: ['le W·h', 'le W', 'le J·s⁻¹', 'l’A'], bonne: 0, expl: 'Le W·h est une puissance × une durée : c’est une énergie (1 W·h = 3600 J).' } },
    { id: 'ui', titre: 'Puissance d’un dipôle : P = U × I', depart: () => voir('dipole', { k: 0 }),
      texte: <>Pour un dipôle soumis à la tension U et traversé par le courant I : <strong>P<sub>élec</sub> = U × I</strong> (W, V, A), donc <strong>W<sub>élec</sub> = U × I × Δt</strong>. Choisissez une lampe LED de 5 W sous 220 V et lisez l’intensité.
        <ExempleResolu>I = P / U = 5 / 220 = 0,0227 A = <strong>22,7 mA</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'Un aspirateur de 1500 W est alimenté sous 220 V. Quelle intensité (en A) le traverse ?', unite: 'A', vrai: 6.82, tol: 0.02, affiche: x => String(x).replace('.', ','), pieges: [[330000, 'Tu as multiplié : P = U × I donc I = P / U.']], expl: 'I = P / U = 1500 / 220 = 6,8 A.' } },
    { id: 'cout', titre: 'Le kilowattheure et le coût', depart: () => voir('dipole', { k: 3, dt: 10 }),
      texte: <>La facture se calcule en <strong>kWh</strong> : 1 kWh = 1 kW pendant 1 h = <strong>3,6·10⁶ J</strong>. Avec un tarif de 0,20 €/kWh :
        <ExempleResolu>Aspirateur de 1500 W pendant 10 min : W = 1,5 kW × (10/60) h = <strong>0,25 kWh</strong> ; coût = 0,25 × 0,20 = <strong>0,05 €</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'Un radiateur de 500 W fonctionne pendant 24 h. Quel est le coût (en €) à 0,20 €/kWh ?', unite: '€', vrai: 2.4, tol: 0.02, affiche: x => String(x).replace('.', ','), pieges: [[2400, 'Convertis d’abord en kWh : 500 W = 0,5 kW, 0,5 × 24 = 12 kWh.']], expl: 'E = 0,5 kW × 24 h = 12 kWh ; coût = 12 × 0,20 = 2,40 €.' } },
    { id: 'joule', titre: 'L’effet Joule', depart: () => setAtelier('joule'),
      texte: <>Dans un <strong>conducteur ohmique</strong>, tout le travail électrique reçu est converti en <strong>transfert thermique</strong> : c’est l’<strong>effet Joule</strong>. Avec U = R × I : <strong>P = R × I²</strong> et <strong>Q = W<sub>élec</sub> = R × I² × Δt</strong>. L’intensité est <strong>au carré</strong> : doublez I et la puissance est multipliée par 4 !
        <ExempleResolu>R = 47 Ω, I = 1 A, Δt = 60 s : P = 47 × 1² = 47 W ; Q = 47 × 60 = <strong>2820 J</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'Un résistor de 100 Ω est traversé par 0,50 A. Quelle puissance thermique (en W) dissipe-t-il ?', unite: 'W', vrai: 25, tol: 0.02, affiche: x => String(x), pieges: [[50, 'Attention : I est au carré, P = R × I² = 100 × 0,5².']], expl: 'P = R × I² = 100 × 0,50² = 25 W.' } },
    { id: 'ligne', titre: 'Pertes en ligne : pourquoi la haute tension ?', depart: () => setAtelier('ligne'),
      texte: <>Les câbles ne sont pas parfaits : ils ont une petite résistance (≈ 0,1 Ω/km) et dissipent de l’énergie par <strong>effet Joule</strong> : P<sub>perdue</sub> = r × I². Pour transporter une puissance P = U × I, on peut garder P en <strong>augmentant U</strong> : l’intensité I = P / U <strong>diminue</strong>, et les pertes diminuent comme I². D’où les lignes à <strong>400 000 V</strong> ! Essayez 100 kV puis 400 kV.</>,
      tache: { type: 'qcm', q: 'Pour réduire les pertes par effet Joule dans une ligne, on…', options: ['augmente la tension et diminue l’intensité', 'diminue la tension et augmente l’intensité', 'augmente l’intensité', 'allonge la ligne'], bonne: 0, expl: 'P = U × I fixée : U plus grande → I plus petite → pertes r × I² plus petites.' } },
    { id: 'rendement', titre: 'Le rendement d’un convertisseur', depart: () => voir('rendement', { k: 'moteur' }),
      texte: <>Un <strong>convertisseur</strong> transforme l’énergie reçue en énergie utile, avec des pertes (sous forme de chaleur). Le <strong>rendement</strong> est <strong>ρ = énergie utile / énergie consommée = P<sub>utile</sub> / P<sub>consommée</sub></strong> : un nombre sans unité, toujours ≤ 1 (souvent donné en %).
        <ExempleResolu>Moteur : W<sub>élec</sub> = 100 J reçus, W<sub>méca</sub> = 90 J fournis (10 J dissipés en chaleur) : ρ = 90 / 100 = <strong>0,90 = 90 %</strong>.</ExempleResolu></>,
      tache: { type: 'num', q: 'Un moteur reçoit 200 W et fournit 150 W de puissance mécanique. Quel est son rendement (en %) ?', unite: '%', vrai: 75, tol: 0.02, affiche: x => String(x), pieges: [[0.75, 'Exprime le rendement en pourcentage : 0,75 = 75 %.'], [133, 'Tu as inversé : ρ = utile / consommée.']], expl: 'ρ = 150 / 200 = 0,75 = 75 %.' } },
    { id: 'calo', titre: 'L’expérience : chauffer de l’eau', depart: () => setAtelier('calo'),
      texte: <>Une résistance chauffante plongée dans <strong>0,2 kg d’eau</strong> reçoit W<sub>élec</sub> = U × I × Δt (courbe bleue). L’eau reçoit Q = m × C × Δθ (courbe orange), avec C = 4180 J·kg⁻¹·K⁻¹. Si tout était transféré à l’eau, les deux courbes seraient confondues. Déplacez le curseur de temps : <strong>Q reste un peu en dessous de W<sub>élec</sub></strong>. Décochez « avec pertes » pour comparer.</>,
      tache: { type: 'qcm', q: 'Pourquoi le transfert thermique Q reçu par l’eau est-il un peu inférieur au travail électrique W_élec ?', options: ['Une partie de la chaleur chauffe le récipient et l’air ambiant (pertes)', 'L’énergie disparaît', 'La résistance consomme de l’eau', 'Q = W_élec exactement, c’est une erreur de mesure'], bonne: 0, expl: 'Le rendement est inférieur à 1 : une partie de l’énergie est perdue vers le récipient, le thermomètre et l’air.' } },
    { id: 'rho_calo', titre: 'Rendement de l’expérience', depart: () => { setAtelier('calo'); setCa(c => ({ ...c, t: 300, pertes: true })); },
      texte: <>À t = 300 s on mesure : Q = 6656 J et W<sub>élec</sub> = 7330 J. Le rendement du dispositif « résistance + eau » vaut ρ = Q / W<sub>élec</sub>.</>,
      tache: { type: 'num', q: 'Calculez ρ en % (Q = 6656 J ; W_élec = 7330 J).', unite: '%', vrai: 90.8, tol: 0.02, affiche: x => String(x).replace('.', ','), pieges: [[1.1, 'Tu as inversé : ρ = Q / W_élec (utile / consommée).']], expl: 'ρ = 6656 / 7330 = 0,908 = 90,8 %.' } },
    { id: 'fin', titre: 'Bravo ! Le bilan', depart: null,
      texte: <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
        <li><strong>P = W / Δt</strong> (W = J·s⁻¹) ; <strong>P<sub>élec</sub> = U × I</strong> ; W<sub>élec</sub> = U × I × Δt ; 1 kWh = 3,6·10⁶ J.</li>
        <li><strong>Effet Joule</strong> (conducteur ohmique) : Q = W<sub>élec</sub> = R × I² × Δt, P = R × I². Pertes en ligne ↓ si U ↑ et I ↓.</li>
        <li><strong>Rendement</strong> ρ = énergie utile / énergie consommée = P<sub>utile</sub> / P<sub>consommée</sub> ≤ 1.</li></ul></ARetenir>, tache: null },
  ];
  useEffect(() => {
    if (mode !== 'guide') return;
    const dep = ETAPES[Math.min(guide.etape, ETAPES.length - 1)].depart;
    if (dep) dep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, guide.etape]);

  function lancer(type) { setDefi(nouveauDefi(type)); }
  function changerMode(md) { setMode(md); if (md === 'defi') lancer(defi ? defi.type : 'cout'); else if (md === 'explore') setAtelier('dipole'); }

  const hypotheses = (
    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: KIT.txt, lineHeight: 1.55 }}>
      <li><strong>Secteur à 220 V</strong> (valeur du cours ; la tension nominale réelle est 230 V), régime <strong>continu</strong> (en alternatif, il faudrait parler de valeurs efficaces). <strong>Tarif</strong> : 0,20 €/kWh (ordre de grandeur, hors abonnement).</li>
      <li><strong>Énergies comptées positivement</strong>, comme en classe de Première : on ne distingue pas énergie reçue et énergie cédée par un signe.</li>
      <li><strong>Effet Joule</strong> : valable pour un conducteur ohmique (U = R × I), dont la résistance est supposée constante malgré l’échauffement.</li>
      <li><strong>Ligne</strong> : résistance de 0,1 Ω/km (valeur du cours), ligne monophasée simplifiée, facteur de puissance 1 ; on néglige la chute de tension devant U. La puissance transportée P = U × I est celle au départ de la ligne.</li>
      <li><strong>Rendements</strong> : ordres de grandeur arrondis (moteur 85 %, LED 30 % de lumière visible, incandescence 5 %). Ils varient selon les modèles.</li>
      <li><strong>Calorimètre</strong> : eau de capacité thermique massique 4180 J·kg⁻¹·K⁻¹, accessoires (cuve, résistance, thermomètre) de capacité 40 J·K⁻¹ qui chauffent aussi, pertes vers l’air de 0,15 W par kelvin d’écart avec l’air à 22 °C. Les valeurs initiales reproduisent l’expérience du chapitre (12,34 V ; 1,98 A ; 0,2 kg ; 25,9 °C).</li>
    </ul>);
  const panneauHypo = <div style={styleBoite}><Section titre="Hypothèses de travail" ouvert={hypoOuv} onBascule={() => setHypoOuv(o => !o)}>{hypotheses}</Section></div>;
  const carte = (titre, contenu) => <div style={{ background: '#f8fafc', border: `1px solid ${KIT.bord}`, borderRadius: 8, padding: '8px 10px', fontSize: 14.5, color: KIT.txt, lineHeight: 1.8, marginTop: 8 }}>{contenu}</div>;

  const atelierDipole = (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Appareil :</span>
        {APPAREILS.map(([n, p], k) => <button key={n} onClick={() => setA(a => ({ ...a, k }))} style={stylePetitBouton(A.k === k, '#0f766e')}>{n} ({p} W)</button>)}</div>
      <div style={{ marginTop: 8 }}><Curseur nom="Durée de fonctionnement Δt" val={A.dt} min={1} max={1440} pas={1} set={v => setA(a => ({ ...a, dt: v }))} unite=" min" fmt={v => `${v} (${fr(v / 60, 2)} h)`}/></div>
      {carte('', <>
        <div>Tension du secteur U = {U_SECTEUR} V ; puissance P = <strong>{PA} W</strong></div>
        <div>Intensité : I = P / U = {PA} / {U_SECTEUR} = <strong>{PA / U_SECTEUR < 1 ? `${fr(IA * 1000, 1)} mA` : `${fr(IA, 2)} A`}</strong></div>
        <div>Travail électrique : W<sub>élec</sub> = P × Δt = {PA} × {A.dt * 60} = <strong>{fE(WA)}</strong></div>
        <div>En kWh : {fr(PA / 1000, 3)} kW × {fr(A.dt / 60, 3)} h = <strong>{fr(kWhA, 3)} kWh</strong> → coût à 0,20 €/kWh : <strong>{fr(coutA, 3)} €</strong></div></>)}
    </div>);
  const atelierJoule = (
    <div>
      <svg viewBox="0 0 560 150" width="100%" role="img" aria-label="Résistor qui chauffe" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, maxWidth: 640 }}>
        <line x1="20" y1="75" x2="170" y2="75" stroke="#0f172a" strokeWidth="3"/><line x1="390" y1="75" x2="540" y2="75" stroke="#0f172a" strokeWidth="3"/>
        <rect x="170" y="40" width="220" height="70" fill={`rgb(255, ${Math.round(255 - Math.min(1, Pj / 150) * 200)}, ${Math.round(255 - Math.min(1, Pj / 150) * 230)})`} stroke="#0f172a" strokeWidth="3"/>
        <text x="280" y="82" fontSize="18" fontWeight="800" textAnchor="middle">R = {J.R} Ω</text>
        <text x="280" y="28" fontSize="13.5" fontWeight="800" textAnchor="middle" fill={VERMILLON}>chaleur dégagée : {fP(Pj)}</text>
        <text x="95" y="62" fontSize="13.5" fontWeight="800" textAnchor="middle" fill={VERMILLON}>I = {fr(J.I, 2)} A →</text><text x="465" y="62" fontSize="13.5" fontWeight="800" textAnchor="middle" fill={BLEU}>U = {fr(Uj, 1)} V</text>
        <text x="280" y="138" fontSize="12.5" fontWeight="700" textAnchor="middle" fill={GRIS_T}>plus la puissance est grande, plus le résistor est rouge</text>
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginTop: 8 }}>
        <Curseur nom="Résistance R" val={J.R} min={5} max={100} pas={1} set={v => setJ(j => ({ ...j, R: v }))} unite=" Ω"/>
        <Curseur nom="Intensité I" val={J.I} min={0.1} max={3} pas={0.1} set={v => setJ(j => ({ ...j, I: v }))} unite=" A"/>
        <Curseur nom="Durée Δt" val={J.dt} min={1} max={600} pas={1} set={v => setJ(j => ({ ...j, dt: v }))} unite=" s"/></div>
      {carte('', <>
        <div>Tension : U = R × I = {J.R} × {fr(J.I, 1)} = <strong>{fr(Uj, 1)} V</strong></div>
        <div>P<sub>élec</sub> = U × I = {fr(Uj, 1)} × {fr(J.I, 1)} = <strong>{fr(Pj, 1)} W</strong> = R × I² = {J.R} × {fr(J.I, 1)}² ✔</div>
        <div>Transfert thermique : Q = P × Δt = {fr(Pj, 1)} × {J.dt} = <strong>{fE(Pj * J.dt)}</strong> (= W<sub>élec</sub>)</div></>)}
    </div>);
  const atelierLigne = (
    <div>
      <svg viewBox="0 0 560 120" width="100%" role="img" aria-label="Ligne électrique entre une centrale et une ville" style={{ display: 'block', background: '#fff', border: `1.5px solid ${KIT.bord}`, borderRadius: 10, maxWidth: 640 }}>
        <rect x="20" y="40" width="90" height="46" rx="6" fill="#e0f2fe" stroke="#0f172a" strokeWidth="2.5"/><text x="65" y="68" fontSize="14" fontWeight="800" textAnchor="middle">centrale</text>
        <rect x="450" y="40" width="90" height="46" rx="6" fill="#e0f2fe" stroke="#0f172a" strokeWidth="2.5"/><text x="495" y="68" fontSize="14" fontWeight="800" textAnchor="middle">ville</text>
        <line x1="110" y1="63" x2="450" y2="63" stroke="#0f172a" strokeWidth={Math.max(2, Math.min(8, IL / 400))}/>
        <text x="280" y="50" fontSize="13.5" fontWeight="800" textAnchor="middle" fill={VERMILLON}>I = {fr(IL, 0)} A</text>
        <text x="280" y="92" fontSize="13" fontWeight="700" textAnchor="middle" fill={GRIS_T}>ligne de {L.L} km : r = {fr(rL, 0)} Ω</text>
        <text x="280" y="110" fontSize="13" fontWeight="800" textAnchor="middle" fill={pcL > 10 ? VERMILLON : BLEU}>pertes : {fr(PjL, 2)} MW ({fr(Math.min(pcL, 999), 1)} %)</text>
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginTop: 8 }}>
        <Curseur nom="Puissance transportée P" val={L.P} min={10} max={200} pas={10} set={v => setL(l => ({ ...l, P: v }))} unite=" MW"/>
        <Curseur nom="Tension de la ligne U" val={L.U} min={20} max={400} pas={10} set={v => setL(l => ({ ...l, U: v }))} unite=" kV"/>
        <Curseur nom="Longueur L" val={L.L} min={50} max={1000} pas={50} set={v => setL(l => ({ ...l, L: v }))} unite=" km"/></div>
      {carte('', <>
        <div>Intensité : I = P / U = {L.P}·10⁶ / {L.U}·10³ = <strong>{fr(IL, 0)} A</strong></div>
        <div>Pertes par effet Joule : P<sub>perdue</sub> = r × I² = {fr(rL, 0)} × {fr(IL, 0)}² = <strong>{fr(PjL, 2)} MW</strong>, soit <strong>{fr(pcL, 1)} %</strong> de la puissance transportée.</div>
        {PjL >= L.P && <div style={{ color: VERMILLON, fontWeight: 700 }}>⚠ Les pertes dépasseraient la puissance transportée : impossible ! Il faut augmenter la tension.</div>}</>)}
    </div>);
  const atelierRend = (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}><span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Convertisseur :</span>
        {CONVERTISSEURS.map(c => <button key={c[0]} onClick={() => setRd(r => ({ ...r, k: c[0] }))} style={stylePetitBouton(Rd.k === c[0], '#0f766e')}>{c[1]}</button>)}
        <button onClick={() => setRd(r => ({ ...r, k: 'perso' }))} style={stylePetitBouton(Rd.k === 'perso', '#7b2d8e')}>à régler</button></div>
      <Bilan Pe={Rd.Pe} rho={rho} utile={conv ? conv[3] : 'puissance utile'} pertes={conv ? conv[4] : 'chaleur'}/>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginTop: 8 }}>
        <Curseur nom="Puissance électrique reçue" val={Rd.Pe} min={10} max={1000} pas={10} set={v => setRd(r => ({ ...r, Pe: v }))} unite=" W"/>
        {Rd.k === 'perso' && <Curseur nom="Rendement ρ" val={Math.round(Rd.perso * 100)} min={0} max={100} pas={1} set={v => setRd(r => ({ ...r, perso: v / 100 }))} unite=" %"/>}</div>
      {carte('', <>ρ = P<sub>utile</sub> / P<sub>consommée</sub> = {fr(rho * Rd.Pe, 0)} / {Rd.Pe} = <strong>{fr(rho, 2)}</strong> = <strong>{fr(rho * 100, 0)} %</strong></>)}
    </div>);
  const atelierCalo = (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, alignItems: 'start' }}>
        <div>
          <Graphe pts={pts.map(p => [p.t, p.W / 1000])} series={[{ pts: pts.map(p => [p.t, p.Q / 1000]), couleur: VERMILLON }, { pts: [[ptC.t, ptC.W / 1000]], couleur: '#0f172a' }]} xmax={540} ymax={ymaxC} xlab="t (s)" ylab="énergie (kJ)" rayon={2.8} w={440} h={290}/>
          <div style={{ fontSize: 12.5, color: KIT.txt2, marginTop: 2 }}><span style={{ color: BLEU, fontWeight: 700 }}>● W<sub>élec</sub> = U·I·Δt</span> · <span style={{ color: VERMILLON, fontWeight: 700 }}>● Q = m·C·Δθ</span></div></div>
        <div>
          <Curseur nom="Temps t" val={Ca.t} min={0} max={540} pas={15} set={v => setCa(c => ({ ...c, t: v }))} unite=" s"/>
          <Curseur nom="Tension U" val={Ca.U} min={5} max={15} pas={0.01} set={v => setCa(c => ({ ...c, U: v }))} unite=" V"/>
          <Curseur nom="Intensité I" val={Ca.I} min={1} max={3} pas={0.01} set={v => setCa(c => ({ ...c, I: v }))} unite=" A"/>
          <Curseur nom="Masse d’eau m" val={Ca.m} min={0.1} max={0.4} pas={0.05} set={v => setCa(c => ({ ...c, m: v }))} unite=" kg" fmt={v => fr(v, 2)}/>
          <label style={{ fontSize: 13.5, fontWeight: 600, display: 'block', marginTop: 4 }}><input type="checkbox" checked={Ca.pertes} onChange={e => setCa(c => ({ ...c, pertes: e.target.checked }))}/> avec pertes (réaliste)</label></div></div>
      {carte('', <>
        <div>t = {Ca.t} s : θ = <strong>{fr(ptC.th, 1)} °C</strong> (Δθ = {fr(ptC.th - 25.9, 1)} °C)</div>
        <div>W<sub>élec</sub> = U × I × Δt = {fr(Ca.U, 2)} × {fr(Ca.I, 2)} × {Ca.t} = <strong>{fr(ptC.W, 0)} J</strong></div>
        <div>Q = m × C × Δθ = {fr(Ca.m, 2)} × {C_EAU} × {fr(ptC.th - 25.9, 1)} = <strong>{fr(ptC.Q, 0)} J</strong></div>
        <div>Rendement : ρ = Q / W<sub>élec</sub> = <strong>{ptC.W > 0 ? `${fr(ptC.Q / ptC.W * 100, 1)} %` : '—'}</strong></div></>)}
    </div>);
  const planche = (
    <div style={styleBoite}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt2 }}>Atelier :</span>
        {[['dipole', '🔌 Puissance et coût'], ['joule', '🔥 Effet Joule'], ['ligne', '🗼 Pertes en ligne'], ['rendement', '⚖️ Rendement'], ['calo', '🧪 Chauffer de l’eau']].map(([k, l]) => <button key={k} onClick={() => setAtelier(k)} style={stylePetitBouton(atelier === k, '#16a34a')}>{l}</button>)}</div>
      {atelier === 'dipole' && atelierDipole}{atelier === 'joule' && atelierJoule}{atelier === 'ligne' && atelierLigne}{atelier === 'rendement' && atelierRend}{atelier === 'calo' && atelierCalo}
    </div>);
  const aEssayer = (
    <div style={styleBoite}>
      <div style={{ fontSize: 15, fontWeight: 700, color: KIT.txt, marginBottom: 6 }}>À essayer</div>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: KIT.txt, lineHeight: 1.6 }}>
        <li>Quel appareil du catalogue coûte le plus cher pour 1 h ? Et pour 1 min ?</li>
        <li>Effet Joule : doublez I. Par combien la puissance est-elle multipliée ? Et si vous doublez R ?</li>
        <li>Pertes en ligne : à 100 kV puis 400 kV, comparez les pertes. Par combien sont-elles divisées ?</li>
        <li>Rendement : quel convertisseur est le plus efficace ? Où va la puissance perdue ?</li>
        <li>Calorimètre : décochez « avec pertes » : que deviennent les deux courbes ?</li>
      </ul>
    </div>);
  const retenir = <ARetenir><ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
    <li>P = U·I ; W = P·Δt ; Q = R·I²·Δt</li><li>ρ = P<sub>utile</sub> / P<sub>consommée</sub></li><li>Haute tension → moins de pertes en ligne</li></ul></ARetenir>;
  const finParcours = (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <button onClick={() => changerMode('explore')} style={styleBouton(true, '#334155')}>🔍 Explorer</button>
      <button onClick={() => changerMode('defi')} style={styleBouton(true, '#0ea5e9')}>🎯 Défis</button>
    </span>);

  return (
    <div style={{ ...cardStyle, textAlign: 'left' }}>
      <style>{`
        .pj-l1 { display: grid; align-items: start; gap: 12px; margin-bottom: 12px; grid-template-columns: minmax(0, 1fr); }
        .pj-l1.cote { grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr); }
        .pj-l2 { display: grid; gap: 12px; align-items: start; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-bottom: 12px; }
        @media (max-width: 900px) { .pj-l1.cote { grid-template-columns: minmax(0, 1fr); } }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: KIT.txt, fontWeight: 700 }}>Puissance, effet Joule et rendement</h2>
        <BoutonsModes mode={mode} setMode={changerMode}/>
      </div>
      <div style={{ fontSize: 14, color: KIT.txt2, marginBottom: 10, lineHeight: 1.55 }}>
        Quelle énergie consomme un appareil, combien ça coûte, où part l’énergie perdue ? Étudiez la <strong>puissance électrique</strong>, l’<strong>effet Joule</strong>, les <strong>pertes en ligne</strong> et le <strong>rendement</strong>, puis vérifiez par l’expérience du <strong>chauffage de l’eau</strong>.</div>
      <div className={`pj-l1${mode !== 'explore' ? ' cote' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {enDefi && <div style={styleBoite}><VoletDefiGen SIM={SIM} titres={TITRES} defi={defi} setDefi={setDefi} changerType={lancer} evaluer={evaluer} enonce={enonce} solution={solution}/></div>}
          {!enDefi && planche}
        </div>
        {enGuide ? <CarteParcours etapes={ETAPES} etat={guide} setEtat={setGuide} fin={finParcours}/> : enDefi ? panneauHypo : null}
      </div>
      {!enDefi && <div className="pj-l2">{panneauHypo}</div>}
      {enExplore && <div className="pj-l2">{aEssayer}{retenir}</div>}
    </div>
  );
}
