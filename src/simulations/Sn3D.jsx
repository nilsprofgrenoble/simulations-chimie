// Vue 3D (three.js) de la substitution nucléophile sur le (R)-2-bromobutane : SN2 (inversion de Walden) ou SN1 (carbocation plan).
// L'avancement u vient de la simulation (curseur ou lecture) ; l'élève tourne la molécule pour voir l'attaque par l'arrière.
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { etat as etatSN, configuration } from "./sn3dModele";
import { vec, COUL_EL, RAYON_EL, placerCylindre, etiquette, liberer, ajouterBase, ajouterCharge, brancherGestes } from "./scene3d";
import { KIT, stylePetitBouton } from "../commun";


// meca : 'SN2' | 'SN1' | 'CAT' (carbocation plan attaqué par Br⁻, addition de HBr) ; groupes : [[étiquette, élément], ×3] pour d'autres carbocations ; produit : nom du produit formé (CAT)
export default function Sn3D({ meca, u, sub = 'sec', re = 'HO', devoiler = true, groupes: groupesPerso, produit }) {
  const hote = useRef(null);
  const s = useRef({});
  const [erreur, setErreur] = useState(null);
  const [face, setFace] = useState('droite');
  const e = etatSN(meca, u, face), conf = sub === 'sec' && devoiler ? configuration(e) : null;

  useEffect(() => {
    const el = hote.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch { Promise.resolve().then(() => setErreur('Votre navigateur ne permet pas l’affichage 3D.')); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const lum = new THREE.DirectionalLight(0xffffff, 1.0); lum.position.set(3, 5, 9); scene.add(lum);
    const racine = new THREE.Group(); scene.add(racine);
    racine.quaternion.setFromEuler(new THREE.Euler(0.35, -0.5, 0));
    const contenu = new THREE.Group(); racine.add(contenu);
    s.current = { renderer, scene, camera, racine, contenu, sale: true };
    const taille = () => {
      const w = el.clientWidth || 300, h = el.clientHeight || 300;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      camera.position.set(0, 0, 14 * (s.current.zf || 1) * Math.max(1, 1.45 / camera.aspect)); camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix(); s.current.sale = true;
    };
    const ro = new ResizeObserver(taille); ro.observe(el); taille();
    const dessus = brancherGestes(el, {
      tourner: (dx, dy) => { const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.011).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.011)); racine.quaternion.premultiply(q).normalize(); s.current.sale = true; },
      zoomer: f => { s.current.zf = Math.min(1.8, Math.max(0.5, (s.current.zf || 1) * f)); taille(); } });
    let raf;
    const boucle = () => { raf = requestAnimationFrame(boucle); if (s.current.sale) { renderer.render(scene, camera); s.current.sale = false; } };
    boucle();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      dessus();
      liberer(scene); renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  // Reconstruction à chaque changement d'avancement (la scène est petite : 6 sphères, 5 liaisons, 5 étiquettes)
  useEffect(() => {
    const st = s.current; if (!st.scene) return;
    const { contenu } = st;
    while (contenu.children.length) liberer(contenu.children.pop());
    const sphere = (p, el, coul, r) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r ?? RAYON_EL[el], 28, 20), new THREE.MeshStandardMaterial({ color: coul ?? COUL_EL[el], roughness: 0.45 }));
      m.position.copy(vec(p)); contenu.add(m); return m;
    };
    const liaison = (p, op, ep = 0.075) => {
      if (op < 0.03) return;
      const l = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 14), new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5, transparent: true, opacity: op }));
      const d = vec(p).normalize();
      placerCylindre(l, d.clone().multiplyScalar(0.3), vec(p).sub(d.clone().multiplyScalar(0.3)), ep); contenu.add(l);
    };
    const noyau = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 20), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }));
    contenu.add(noyau);
    const groupes = groupesPerso ?? { sec: [['CH₂CH₃', 'C'], ['CH₃', 'C'], ['H', 'H']], prim: [['C₃H₇', 'C'], ['H', 'H'], ['H', 'H']], tert: [['CH₃', 'C'], ['CH₃', 'C'], ['CH₃', 'C']] }[sub];
    e.subs.forEach((p, k) => {
      sphere(p, groupes[k][1]); liaison(p, 1);
      const et = etiquette(groupes[k][0]); const d = vec(p).normalize(); et.position.copy(vec(p).addScaledVector(d, 0.95)); contenu.add(et);
    });
    // groupe partant : Br (absent quand le carbocation est déjà formé)
    if (!e.sansLg) {
      sphere(e.lg, 'Br'); liaison(e.lg, e.lgOp);
      const eb = etiquette('Br', 0, '#9a3412'); eb.position.copy(vec(e.lg)).add(new THREE.Vector3(0, 0.95, 0)); contenu.add(eb);
    }
    // nucléophile : atomes réels et charge ; ses H s'éloignent du carbone (côté +x), O face au carbone
    if (meca === 'CAT') {
      sphere(e.nu, 'Br');
      const eb2 = etiquette('Br', 0, '#9a3412'); eb2.position.copy(vec(e.nu)).add(new THREE.Vector3(0, 0.95, 0)); contenu.add(eb2);
      if (e.nuOp < 0.5) ajouterCharge(contenu, e.nu, '−', 0.85);
    } else ajouterBase(contenu, re, e.nu, [1, 0, 0], [0, 0, 1], e.nuOp, 71, { HO: 'OH', tBuO: 'OtBu', H2O: 'OH₂⁺' }[re]);
    liaison(e.nu, e.nuOp);
    // charges : Br⁻ une fois parti, carbocation (SN1) quand Br est parti et le nucléophile pas encore lié
    if (!e.sansLg && e.lgOp < 0.5) ajouterCharge(contenu, e.lg, '−', 0.85);
    if ((meca === 'SN1' || meca === 'CAT') && !e.lgLie && !e.nuLie) ajouterCharge(contenu, [0, 0, 0], '+', 0.75);
    // plan des trois groupes quand ils sont dans un plan perpendiculaire à l'axe
    if (e.plan) {
      const pl = new THREE.Mesh(new THREE.CircleGeometry(2.0, 40), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }));
      pl.rotation.y = Math.PI / 2; contenu.add(pl);
    }
    st.sale = true;
  }, [e.xSub, e.lg[0], e.nu[0], e.lgOp, e.nuOp, e.plan, e.lgLie, e.nuLie, sub, re, groupesPerso?.map(g => g[0]).join('|')]);   // eslint-disable-line react-hooks/exhaustive-deps

  if (erreur) return <div style={{ padding: 16, fontSize: 14, color: '#b45309' }}>{erreur}</div>;
  const nomSub = { sec: '2-bromobutane', prim: '1-bromobutane', tert: '2-bromo-2-méthylpropane' }[sub];
  const texte = meca === 'CAT' ? (e.nuLie ? `${produit ?? 'Produit'} formé` : e.plan ? 'Carbocation : les trois groupes sont dans un plan' : 'Br⁻ se rapproche du carbocation…') : conf ? (e.lgLie ? `(${conf})-2-bromobutane` : `(${conf})-butan-2-ol`)
    : e.plan ? (meca === 'SN2' ? 'État de transition : les trois groupes sont dans un plan' : 'Carbocation : les trois groupes sont dans un plan')
      : (sub !== 'sec' || !devoiler) && e.lgLie ? nomSub : (sub !== 'sec' || !devoiler) && e.nuLie ? 'Produit de substitution formé' : 'Le carbone est en cours de transformation…';
  return (
    <div style={{ background: '#fff', border: `1px solid ${KIT.bord}`, borderRadius: 10, padding: 8 }}>
      <div ref={hote} role="img" aria-label={meca === 'CAT' ? 'Vue 3D d’un carbocation plan attaqué par l’ion bromure, à tourner à la souris ou au doigt' : `Vue 3D de la ${meca} sur le ${nomSub}, à tourner à la souris ou au doigt`}
        style={{ width: '100%', height: 280, borderRadius: 10, background: 'linear-gradient(#f8fafc,#e2e8f0)', touchAction: 'none', cursor: 'grab' }} />
      <div style={{ textAlign: 'center', fontSize: 13, color: KIT.txt2, margin: '6px 0' }}>Faites glisser pour tourner la molécule ; avancez la réaction avec le curseur.</div>
      {meca === 'CAT' && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt, alignSelf: 'center' }}>Br⁻ attaque :</span>
        <button onClick={() => setFace('gauche')} aria-pressed={face === 'gauche'} style={stylePetitBouton(face === 'gauche', '#0891b2')}>par une face</button>
        <button onClick={() => setFace('droite')} aria-pressed={face === 'droite'} style={stylePetitBouton(face === 'droite', '#0891b2')}>par l’autre face</button>
      </div>}
      {meca === 'SN1' && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT.txt, alignSelf: 'center' }}>Le nucléophile attaque :</span>
        <button onClick={() => setFace('gauche')} aria-pressed={face === 'gauche'} style={stylePetitBouton(face === 'gauche', '#0891b2')}>du côté où Br est parti</button>
        <button onClick={() => setFace('droite')} aria-pressed={face === 'droite'} style={stylePetitBouton(face === 'droite', '#0891b2')}>de l’autre côté</button>
      </div>}
      <div role="status" aria-live="polite" style={{ textAlign: 'center', fontSize: 14.5, fontWeight: 800, color: conf ? '#0f172a' : '#b45309' }}>{texte}</div>
      {devoiler && meca === 'SN2' && u >= 0.99 && <div style={{ textAlign: 'center', fontSize: 13.5, color: KIT.txt, marginTop: 4 }}>Le nucléophile est arrivé par l’arrière : les trois autres groupes se sont retournés, comme un parapluie par le vent.{sub === 'sec' ? <> La configuration est <strong>inversée</strong>.</> : ' Ce carbone n’est pas asymétrique : l’inversion n’a pas de conséquence sur le nom du produit.'}</div>}
      {devoiler && meca === 'SN1' && u >= 0.99 && <div style={{ textAlign: 'center', fontSize: 13.5, color: KIT.txt, marginTop: 4 }}>{sub === 'sec' ? <>Les deux faces du carbocation sont attaquées avec la même probabilité : on obtient les <strong>deux énantiomères</strong> (mélange racémique). Changez de face pour voir l’autre.</> : 'Le carbocation est plan : le nucléophile peut l’attaquer des deux côtés. Ce carbone n’est pas asymétrique : les deux attaques donnent le même produit.'}</div>}
    </div>
  );
}
