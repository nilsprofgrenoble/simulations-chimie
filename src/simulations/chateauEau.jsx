import { Cadre, KIT, fmt } from "../commun";

// ====================================================
// MAQUETTE COMMUNE DU CHÂTEAU D'EAU
// Partagée par « Régulation de niveau » (évolution dans le temps) et « Point de fonctionnement » (équilibre) :
// mêmes grandeurs (H en m, débits en m³/h, Kp en %/m), même schéma, mêmes couleurs.
// ====================================================

export const H_FOND = 30, H_TROP = 36;      // m, fond et trop-plein du réservoir
export const COUL = { eau: '#2563eb', pompe: '#16a34a', puisage: '#dc2626', consigne: '#ea580c', seuil: '#7c3aed' };
const yH = h => 300 - (h - 26) * 22;        // 26 m → 300 px ; 38 m → 36 px

// Schéma : réservoir (A), pompe (B), abonnés (C).
// H : hauteur d'eau (m) ; Y : commande de la pompe (%) ; regul : 'tor' | 'p' | 'pi' ;
// t : instant affiché (h), ou null si le schéma ne représente pas un instant précis.
export function SchemaChateau({ regul, hHaut, hBas, consigne, H, Y, t = null, perdu = 0, penurie = 0, hl = () => false }) {
  const Hc = H, Yc = Y;
  return (
    <svg viewBox="0 0 232 400" role="img" aria-label="Château d'eau, pompe et habitations" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {[28, 30, 32, 34, 36, 38].map(h => (
        <g key={h}><line x1="30" y1={yH(h)} x2="36" y2={yH(h)} stroke={KIT.txt2}/><text x="26" y={yH(h) + 4} fontSize="13.5" fill={KIT.txt2} textAnchor="end">{h}</text></g>
      ))}
      <text x="4" y="24" fontSize="13.5" fill={KIT.txt2}>h (m)</text>
      {/* réservoir */}
      <rect x="58" y={yH(H_TROP)} width="100" height={yH(H_FOND) - yH(H_TROP)} fill="#f1f5f9" stroke={KIT.txt} strokeWidth="2.5"/>
      <rect x="60" y={yH(Math.min(H_TROP, Hc))} width="96" height={Math.max(0, yH(H_FOND) - yH(Math.min(H_TROP, Hc)))} fill="#93c5fd"/>
      <line x1="58" y1={yH(Hc)} x2="158" y2={yH(Hc)} stroke={COUL.eau} strokeWidth="2"/>
      {regul === 'tor' ? [[hHaut, 'seuil haut'], [hBas, 'seuil bas']].map(([h, n]) => (
        <g key={n}><line x1="50" y1={yH(h)} x2="166" y2={yH(h)} stroke={COUL.seuil} strokeWidth="1.5" strokeDasharray="4 3"/>
          <text x="168" y={yH(h) + 4} fontSize="13" fill={COUL.seuil}>{n}</text></g>
      )) : (
        <g><line x1="50" y1={yH(consigne)} x2="166" y2={yH(consigne)} stroke={COUL.consigne} strokeWidth="1.5" strokeDasharray="4 3"/>
          <text x="168" y={yH(consigne) + 4} fontSize="13" fill={COUL.consigne}>consigne</text></g>
      )}
      <text x="116" y={yH(H_TROP) - 6} fontSize="14.5" fontWeight="700" fill={KIT.txt} textAnchor="middle">A · réservoir</text>
      {/* tour et canalisations */}
      <rect x="93" y={yH(H_FOND)} width="30" height={360 - yH(H_FOND)} fill="#e2e8f0" stroke={KIT.txt} strokeWidth="1.5"/>
      <polyline points={`54,360 48,360 48,${yH(H_TROP) - 10} 70,${yH(H_TROP) - 10} 70,${yH(H_TROP) + 8}`} fill="none" stroke={Yc > 0 ? COUL.pompe : '#94a3b8'} strokeWidth="4"/>
      <polyline points={`142,${yH(H_FOND)} 142,360 200,360 200,344`} fill="none" stroke={COUL.puisage} strokeWidth="4"/>
      {/* pompe */}
      <circle cx="40" cy="360" r="13" fill={Yc > 0 ? '#dcfce7' : 'white'} stroke={KIT.txt} strokeWidth="2"/>
      <text x="40" y="365" fontSize="14.5" fontWeight="800" fill={KIT.txt} textAnchor="middle">B</text>
      <text x="40" y="390" fontSize="13.5" fill={KIT.txt} textAnchor="middle">{regul === 'tor' ? (Yc > 0 ? 'pompe ON' : 'pompe OFF') : `pompe ${fmt(Yc, 0)} %`}</text>
      {/* maison et robinet */}
      <polygon points="182,320 200,304 218,320" fill="#fed7aa" stroke={KIT.txt} strokeWidth="1.5"/>
      <rect x="185" y="320" width="30" height="24" fill="#fff7ed" stroke={KIT.txt} strokeWidth="1.5"/>
      <text x="200" y="337" fontSize="13.5" fontWeight="800" fill={KIT.txt} textAnchor="middle">C</text>
      <text x="200" y="390" fontSize="13.5" fill={KIT.txt} textAnchor="middle">abonnés</text>
      {t != null && <text x="116" y="378" fontSize="13" fill={KIT.txt2} textAnchor="middle">t = {fmt(t, 0)} h</text>}
      {perdu > 20 && <text x="108" y={yH(H_TROP) - 20} fontSize="13.5" fontWeight="800" fill="#b91c1c" textAnchor="middle">débordement !</text>}
      {penurie > 1 && <text x="108" y={yH(H_FOND) + 16} fontSize="13.5" fontWeight="800" fill="#b91c1c" textAnchor="middle">réservoir vide !</text>}
      <Cadre actif={hl('reservoir')} x={46} y={yH(H_TROP) - 22} w={130} h={yH(H_FOND) - yH(H_TROP) + 30}/>
      <Cadre actif={hl('pompe')} x={14} y={340} w={54} h={58}/>
      <Cadre actif={hl('maison')} x={176} y={296} w={54} h={102}/>
    </svg>
  );
}

// ── Passage d'une simulation à l'autre : on emporte les réglages ──
// (consigne, Kp, Qmax, Qp) sont déposés dans la session du navigateur, et lus une seule fois par la simulation d'arrivée.
const CLE = 'chateau-eau-transfert';
export function ecrireTransfert(p) { try { window.sessionStorage.setItem(CLE, JSON.stringify(p)); } catch { /* stockage indisponible : on continue sans */ } }
export function lireTransfert() {
  try { const b = window.sessionStorage.getItem(CLE); return b ? JSON.parse(b) : null; } catch { return null; }
}
export function effacerTransfert() { try { window.sessionStorage.removeItem(CLE); } catch { /* sans importance */ } }
