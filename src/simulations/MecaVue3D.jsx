// Vue 3D (three.js) de la simulation « Mécanismes réactionnels ». Chargée à la demande (React.lazy) : three.js est une grosse bibliothèque.
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { geom3D, V3 } from "./mecaModele";

const COUL = { C: 0x475569, H: 0xf1f5f9, Br: 0x9a3412 };
const RAYON = { C: 0.36, H: 0.22, Br: 0.5 };   // rayons d'affichage (non à l'échelle) pour garder la scène lisible

const vec = p => new THREE.Vector3(p[0], p[1], p[2]);

// Positionne un cylindre entre deux points
function placerCylindre(m, a, b, ep) {
  const d = new THREE.Vector3().subVectors(b, a), L = d.length();
  m.position.copy(a).addScaledVector(d, 0.5);
  m.scale.set(ep, Math.max(L, 1e-4), ep);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
}

export default function MecaVue3D({ u, face = 1, lobes = true }) {
  const hote = useRef(null);
  const etat = useRef({});
  const [erreur, setErreur] = useState(null);

  // Création de la scène (une seule fois)
  useEffect(() => {
    const el = hote.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { setErreur('Votre navigateur ne permet pas l’affichage 3D.'); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(3.5, -4.2, 9.5);
    camera.up.set(0, 1, 0);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0.9, 0.2, 1.6);
    controls.enableDamping = false;
    controls.minDistance = 4; controls.maxDistance = 22;
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const lum = new THREE.DirectionalLight(0xffffff, 1.0); lum.position.set(4, 6, 10); scene.add(lum);

    const geoS = new THREE.SphereGeometry(1, 28, 20), geoC = new THREE.CylinderGeometry(1, 1, 1, 12);
    const atomes = {}, liaisons = [];
    // atomes : créés à la demande lors de la 1re mise à jour
    const groupe = new THREE.Group(); scene.add(groupe);
    const matLobe = new THREE.MeshStandardMaterial({ color: 0x2563eb, transparent: true, opacity: 0.4, depthWrite: false });
    const lobesDoublets = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(geoS, matLobe.clone()); groupe.add(m); return m; });
    const pi = [1, -1].map(() => { const m = new THREE.Mesh(geoS, new THREE.MeshStandardMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.3, depthWrite: false })); groupe.add(m); return m; });
    const vac = new THREE.Group(); groupe.add(vac);
    const plan = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false }));
    const cadre = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.1, 1.1)), new THREE.LineBasicMaterial({ color: 0x1d4ed8, transparent: true }));
    vac.add(plan, cadre);
    // plan moléculaire (repère visuel discret)
    const grille = new THREE.Mesh(new THREE.PlaneGeometry(7, 4.6), new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false }));
    grille.renderOrder = -1;
    grille.position.set(1.0, 0, 0); groupe.add(grille);

    etat.current = { renderer, scene, camera, controls, atomes, liaisons, geoS, geoC, groupe, lobesDoublets, pi, vac, plan, cadre };
    let sale = true;
    const demander = () => { sale = true; };
    controls.addEventListener('change', demander);
    etat.current.demander = demander;
    const taille = () => {
      const w = el.clientWidth || 300, h = el.clientHeight || 300;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); sale = true;
    };
    const ro = new ResizeObserver(taille); ro.observe(el); taille();
    let raf;
    const boucle = () => { raf = requestAnimationFrame(boucle); if (sale) { controls.update(); renderer.render(scene, camera); sale = false; } };
    boucle();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
      scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
      geoS.dispose(); geoC.dispose(); renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  // Mise à jour à chaque changement de u / face
  useEffect(() => {
    const s = etat.current;
    if (!s.scene) return;
    const g = geom3D(u, face);
    for (const [nom, a] of Object.entries(g.atomes)) {
      let m = s.atomes[nom];
      if (!m) {
        m = new THREE.Mesh(s.geoS, new THREE.MeshStandardMaterial({ color: COUL[a.el], roughness: 0.45 }));
        m.scale.setScalar(RAYON[a.el]); s.groupe.add(m); s.atomes[nom] = m;
      }
      m.position.copy(vec(a.p));
    }
    // liaisons : un cylindre plein + 6 petits cylindres pour la version pointillée
    g.liaisons.forEach((l, i) => {
      let o = s.liaisons[i];
      if (!o) {
        o = { plein: new THREE.Mesh(s.geoC, new THREE.MeshStandardMaterial({ color: 0x64748b, transparent: true })), pts: [] };
        for (let k = 0; k < 6; k++) { const p = new THREE.Mesh(s.geoC, new THREE.MeshStandardMaterial({ color: 0x16a34a, transparent: true })); s.groupe.add(p); o.pts.push(p); }
        s.groupe.add(o.plein); s.liaisons[i] = o;
      }
      const A = vec(g.atomes[l.a].p), B = vec(g.atomes[l.b].p);
      o.plein.visible = l.op > 0.02; o.plein.material.opacity = l.op; placerCylindre(o.plein, A, B, 0.07);
      o.pts.forEach((p, k) => {
        p.visible = l.opPoint > 0.02;
        if (!p.visible) return;
        p.material.opacity = l.opPoint;
        const t0 = (k + 0.15) / 6, t1 = (k + 0.65) / 6;
        placerCylindre(p, A.clone().lerp(B, t0), A.clone().lerp(B, t1), 0.06);
      });
    });
    // doublets non liants de Br (lobes) : visibles quand Br est un ion ou en cours de réaction
    const br = vec(g.atomes.Br.p);
    g.doublets.forEach((d, k) => {
      const m = s.lobesDoublets[k];
      m.visible = lobes && d.op > 0.02;
      m.material.opacity = 0.42 * d.op;
      m.position.copy(br).addScaledVector(vec(d.dir), 0.82);
      m.scale.set(0.2, 0.2, 0.36);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), vec(d.dir));
    });
    // nuage π : deux lobes de part et d'autre du plan, centrés sur la liaison C2=C3
    const c2 = vec(g.atomes.C2.p), c3 = vec(g.atomes.C3.p), mid = c2.clone().lerp(c3, 0.5);
    s.pi.forEach((m, k) => {
      const sg = k === 0 ? 1 : -1;
      m.visible = g.piOp > 0.02;
      m.material.opacity = 0.34 * g.piOp;
      m.position.set(mid.x, mid.y, sg * 0.5);
      m.scale.set(0.95, 0.3, 0.38);
      m.rotation.set(0, 0, Math.atan2(c3.y - c2.y, c3.x - c2.x));
    });
    // lacune du carbocation : carré translucide perpendiculaire au plan, du côté attaqué
    s.vac.visible = g.vac.op > 0.02;
    s.vac.position.set(0, 0, g.face * 0.8);
    s.plan.material.opacity = 0.28 * g.vac.op; s.cadre.material.opacity = g.vac.op;
    s.demander();
  }, [u, face, lobes]);

  if (erreur) return <div style={{ padding: 16, fontSize: 14, color: '#b45309' }}>{erreur} La vue 2D reste disponible.</div>;
  return <div ref={hote} role="img" aria-label="Vue 3D du mécanisme, orbitable à la souris ou au doigt" style={{ width: '100%', height: 340, borderRadius: 12, background: 'linear-gradient(#f8fafc,#e2e8f0)', touchAction: 'none' }} />;
}
