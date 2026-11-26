// Visuel 3D d'un carbone asymétrique pour les exercices de chiralité (type de schéma « cram3d ») : l'élève tourne la molécule et regarde où est le groupe n°4,
// ou compare une molécule et son image dans un miroir. La lettre R/S n'est jamais affichée (c'est la question de l'exercice).
import { useMemo, lazy, Suspense } from "react";
import * as M from "./chiraliteModele";
import { KIT } from "../commun";

const Carbone3D = lazy(() => import("./Carbone3D"));

// mol : identifiant du catalogue ; n4 : 'devant' | 'derriere' | null (position du groupe de priorité 4 sur le dessin de Cram) ; conf : 'R' | 'S' | null ; miroir : montre aussi l'image dans un miroir
export default function Cram3DExo({ mol = 'lactique', n4 = null, conf = null, miroir = false, legende }) {
  const m = M.parId(mol), c = M.centresAsym(m)[0];
  const aff = useMemo(() => {
    const j4 = M.classementCIP(m.g, c).ordre[3].j;
    const liste = M.toutesLesAff(m, c).filter(a => (conf ? M.configuration(m.g, c, a) === conf : true) && (n4 === 'devant' ? a.W === j4 : n4 === 'derriere' ? a.D === j4 : true));
    return liste[0];
  }, [m, c, n4, conf]);
  return (
    <div style={{ background: '#fff', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: 8 }}>
      <Suspense fallback={<div style={{ padding: 20, fontSize: 14, textAlign: 'center' }}>Chargement de la 3D…</div>}>
        <Carbone3D mol={m} c={c} aff={aff} rangs devoiler={false} miroir={miroir} nom="Vue 3D d’un carbone asymétrique, à tourner à la souris ou au doigt" />
      </Suspense>
      {legende && <div style={{ textAlign: 'center', fontSize: 13, color: KIT.txt2, marginTop: 4 }}>{legende}</div>}
    </div>);
}
