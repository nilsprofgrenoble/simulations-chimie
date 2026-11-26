// Visuels 3D animés pour les exercices du BTS (types de schéma « add3d », « br3d », « sn3d ») : un curseur et un bouton Lecture font avancer la réaction ;
// les lettres R/S et les résultats ne sont jamais affichés (ce sont les questions des exercices).
import { useState, useEffect, lazy, Suspense } from "react";
import { BarreLecture } from "./ongletsSim";

const Add3D = lazy(() => import("./Add3D"));
const Br3D = lazy(() => import("./Br3D"));
const Sn3D = lazy(() => import("./Sn3D"));

function Anime({ children }) {
  const [u, setU] = useState(0), [lecture, setLecture] = useState(false);
  useEffect(() => {
    if (!lecture) return;
    let raf, t0 = null; const u0 = u >= 0.999 ? 0 : u;
    const pas = ts => { if (t0 === null) t0 = ts; const nv = Math.min(1, u0 + (ts - t0) / 6000); setU(nv); if (nv >= 1) { setLecture(false); return; } raf = requestAnimationFrame(pas); };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [lecture]);   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Suspense fallback={<div style={{ padding: 20, fontSize: 14, textAlign: 'center' }}>Chargement de la 3D…</div>}>{children(u)}</Suspense>
      <BarreLecture lecture={lecture} setLecture={setLecture} u={u} setU={setU} />
    </div>);
}
export const Add3DExo = ({ alc, re }) => <Anime>{u => <Add3D alc={alc} re={re} u={u} devoiler={false} />}</Anime>;
export const Br3DExo = ({ alc, face = 'dessus' }) => <Anime>{u => <Br3D alc={alc} face={face} syn={false} u={u} devoiler={false} />}</Anime>;
export const Sn3DExo = ({ meca, re }) => <Anime>{u => <Sn3D meca={meca} u={u} sub="sec" re={re} devoiler={false} />}</Anime>;
