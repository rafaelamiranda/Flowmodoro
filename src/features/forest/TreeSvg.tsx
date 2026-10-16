import type { Species } from "./species";

type Props = {
  species: Species;
  stage: 0 | 1 | 2 | 3 | 4;
  withered?: boolean;
  className?: string;
  title?: string;
  /** Balanço suave (desligado automaticamente com prefers-reduced-motion). */
  sway?: boolean;
};

const GROUND = 112;
const TRUNK_H = [0, 16, 30, 42, 50];
const CROWN_SCALE = [0, 0.3, 0.5, 0.78, 1];

const PALETTE: Record<Species, { trunk: string; crown: string; crown2: string }> = {
  carvalho: { trunk: "#7a5230", crown: "#3f8f4b", crown2: "#5fb062" },
  pinheiro: { trunk: "#6e4a2b", crown: "#25664a", crown2: "#348060" },
  cerejeira: { trunk: "#6b4530", crown: "#e59ab4", crown2: "#f3bccf" },
  "bétula": { trunk: "#ebe6d6", crown: "#7fb347", crown2: "#a3cf6b" },
  palmeira: { trunk: "#9a7440", crown: "#2f9157", crown2: "#4fb673" },
};
const WITHERED = { trunk: "#6f6450", crown: "#8f7d52", crown2: "#a8956a" };

function Crown({ species, c1, c2 }: { species: Species; c1: string; c2: string }) {
  switch (species) {
    case "carvalho":
      return (
        <>
          <circle cx={-15} cy={4} r={17} fill={c1} />
          <circle cx={15} cy={4} r={17} fill={c1} />
          <circle cx={0} cy={-12} r={22} fill={c2} />
          <circle cx={-6} cy={-16} r={7} fill={c1} opacity={0.35} />
        </>
      );
    case "pinheiro":
      return (
        <>
          <polygon points="0,-48 -24,-8 24,-8" fill={c1} />
          <polygon points="0,-34 -29,6 29,6" fill={c2} />
          <polygon points="0,-18 -34,20 34,20" fill={c1} />
        </>
      );
    case "cerejeira":
      return (
        <>
          <circle cx={-17} cy={4} r={16} fill={c1} />
          <circle cx={17} cy={4} r={16} fill={c1} />
          <circle cx={0} cy={-10} r={21} fill={c2} />
          <circle cx={-9} cy={-4} r={3} fill="#fff" opacity={0.6} />
          <circle cx={11} cy={-14} r={3} fill="#fff" opacity={0.6} />
          <circle cx={4} cy={9} r={2.5} fill="#fff" opacity={0.6} />
        </>
      );
    case "bétula":
      return (
        <>
          <ellipse cx={0} cy={-8} rx={17} ry={30} fill={c1} />
          <ellipse cx={-5} cy={-14} rx={8} ry={16} fill={c2} opacity={0.7} />
        </>
      );
    case "palmeira":
      return (
        <>
          {[-70, -35, 0, 35, 70].map((a) => (
            <ellipse key={a} cx={0} cy={-18} rx={5} ry={22} fill={a % 2 === 0 ? c1 : c2} transform={`rotate(${a} 0 0)`} />
          ))}
          <ellipse cx={-26} cy={6} rx={5} ry={20} fill={c1} transform="rotate(-100 0 0)" />
          <ellipse cx={26} cy={6} rx={5} ry={20} fill={c2} transform="rotate(100 0 0)" />
        </>
      );
  }
}

export function TreeSvg({ species, stage, withered = false, className, title, sway = false }: Props) {
  const p = withered ? WITHERED : PALETTE[species];
  const trunkH = TRUNK_H[stage];
  const top = GROUND - trunkH;
  const scale = CROWN_SCALE[stage] * (withered ? 0.8 : 1);
  const trunkW = species === "palmeira" ? 6 : stage >= 3 ? 9 : 6;
  return (
    <svg viewBox="0 0 100 120" role="img" aria-label={title} className={className}>
      {title && <title>{title}</title>}
      <ellipse cx={50} cy={GROUND + 2} rx={30} ry={6} fill="#7a6a45" opacity={0.28} />
      <path d="M22 114 Q50 96 78 114 Z" fill={withered ? "#8d7a55" : "#6f9a4d"} opacity={0.9} />
      <g className={sway && !withered ? "tree-sway" : undefined} transform={withered ? "rotate(7 50 112)" : undefined}>
        {stage === 0 ? (
          <ellipse cx={50} cy={106} rx={5} ry={3.5} fill={withered ? WITHERED.trunk : "#8a5a2b"} />
        ) : (
          <>
            <path
              d={`M${50 - trunkW / 2} ${GROUND} L${50 - trunkW / 3} ${top} L${50 + trunkW / 3} ${top} L${50 + trunkW / 2} ${GROUND} Z`}
              fill={p.trunk}
            />
            {species === "bétula" && stage >= 2 &&
              [0.25, 0.5, 0.75].map((f) => (
                <rect key={f} x={50 - trunkW / 2} y={GROUND - trunkH * f} width={trunkW * 0.55} height={1.8} fill="#3d3a33" opacity={0.7} />
              ))}
            {stage === 1 ? (
              <>
                <ellipse cx={43} cy={top + 2} rx={8} ry={4.5} fill={p.crown} transform={`rotate(-30 43 ${top + 2})`} />
                <ellipse cx={57} cy={top + 2} rx={8} ry={4.5} fill={p.crown2} transform={`rotate(30 57 ${top + 2})`} />
              </>
            ) : (
              <g
                className="grow"
                transform={`translate(50 ${top + (species === "pinheiro" ? 0 : 4)}) scale(${scale})`}
              >
                <Crown species={species} c1={p.crown} c2={p.crown2} />
              </g>
            )}
          </>
        )}
      </g>
    </svg>
  );
}
