// Vue 3D d'un des deux carbones asymétriques voisins d'un stéréoisomère (simulation « Stéréoisomères ») : on choisit le stéréoisomère et le carbone,
// puis on tourne la molécule, on place le n°4 derrière et on lit R ou S. Le calcul est celui de Carbone3D (chiraliteModele.js, carbone3dModele.js).
import { useState, lazy, Suspense } from "react";
import { KIT, stylePetitBouton } from "../commun";
import * as M from "./stereoisomeresModele";

const Carbone3D = lazy(() => import("./Carbone3D"));

// mol : molécule à deux centres ; options : [{ lettre: 'A', s: stéréoisomère }, …] ; devoiler : affiche le sens et la lettre
export default function Couple3D({ mol, options, devoiler = true }) {
  const [i, setI] = useState(0), [k, setK] = useState(0);
  const opt = options[Math.min(i, options.length - 1)], c = [mol.chaine.c1, mol.chaine.c2][k];
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 6 }}>
        {options.map((o, j) => <button key={o.lettre} onClick={() => setI(j)} aria-pressed={i === j} style={stylePetitBouton(i === j, '#0f766e')}>Stéréoisomère {o.lettre} {M.nomDesc(mol, o.s.desc)}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 }}>
        {[0, 1].map(j => <button key={j} onClick={() => setK(j)} aria-pressed={k === j} style={stylePetitBouton(k === j, '#0369a1')}>Carbone {mol.nomsCentres[j]}</button>)}
      </div>
      <Suspense fallback={<div style={{ padding: 20, fontSize: 14, textAlign: 'center' }}>Chargement de la 3D…</div>}>
        <Carbone3D key={`${opt.lettre}${k}`} mol={mol} c={c} aff={opt.s.affs[k]} rangs devoiler={devoiler} nom={`Vue 3D du carbone ${mol.nomsCentres[k]} du stéréoisomère ${opt.lettre} de ${mol.nom}, à tourner à la souris ou au doigt`} />
      </Suspense>
      <div style={{ textAlign: 'center', fontSize: 13, color: KIT.txt2, marginTop: 4 }}>Les deux carbones asymétriques se regardent l'un après l'autre : choisissez le carbone, mettez le n°4 derrière, lisez 1 → 2 → 3.</div>
    </div>);
}
