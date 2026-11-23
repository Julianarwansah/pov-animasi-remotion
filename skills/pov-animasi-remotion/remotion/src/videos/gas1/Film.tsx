// LAST GAS STATION — Part 1 (Shorts 1080x1920). Dunia 3D (dunia.ts) -> tinta (InkPass) -> tone mapping -> fisheye,
// lalu lapisan 2D: vinyet, kilat, caption per penutur, teks bunyi, judul, kartu pilihan A/B.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { loadFont } from "@remotion/fonts";
import { World, LINES, TOTAL, FREEZE, S0, FPS, COLD, coldFrame } from "./dunia";
import { InkPass, noInkFallback } from "./ink";
import { FisheyeEffect } from "./fisheye";

export const GAS1_FRAMES = TOTAL;
const W = 1080, H = 1920;

const Inner: React.FC<{ f: number }> = ({ f }) => {
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { color: "#241726", widthNear: 5.5, widthFar: 3.5, distNear: 2, distFar: 40 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    fish: new FisheyeEffect(0.36, W / H),
  }), [camera, scene]);
  world.update(f, camera as THREE.PerspectiveCamera);
  noInkFallback(world.root);
  return (
    <>
      <primitive object={world.root} dispose={null} />
      <EffectComposer multisampling={4}>
        <primitive object={fx.ink} dispose={null} />
        <primitive object={fx.tone} dispose={null} />
        <primitive object={fx.fish} dispose={null} />
      </EffectComposer>
    </>
  );
};

const FAMILY = "Fredoka";
let fontP: Promise<void> | null = null;
const useFont = () => {
  const [h] = useState(() => delayRender("font"));
  useEffect(() => { fontP ??= loadFont({ family: FAMILY, url: staticFile("fonts/Fredoka-Bold.ttf"), weight: "700" }); fontP.then(() => continueRender(h), () => continueRender(h)); }, [h]);
};

const STYLE: Record<string, { color: string; italic?: boolean }> = {
  sam: { color: "#ffffff" }, trucker: { color: "#ffd84a" }, radio: { color: "#8fd3ff", italic: true }, tiruan: { color: "#ff9ec4", italic: true },
};
const txt = (color: string, size: number, italic = false): React.CSSProperties => ({
  fontFamily: `${FAMILY}, Arial Black, sans-serif`, fontWeight: 700, fontSize: size, lineHeight: 1.12, color, fontStyle: italic ? "italic" : "normal",
  textAlign: "center", WebkitTextStroke: "3px #0b0710", paintOrder: "stroke fill", textShadow: "0 5px 14px rgba(0,0,0,0.85)",
});

/** caption tengah layar: potongan ≤ 4 kata yang sedang diucapkan, warna per penutur */
const Caption: React.FC<{ f: number }> = ({ f }) => {
  const l = LINES.find((x) => x.text && f >= x.start && f < x.end + 4);
  if (!l || !l.text) return null;
  const words = l.text.split(/\s+/), chunks: string[][] = [];
  for (let i = 0; i < words.length; i += 4) chunks.push(words.slice(i, i + 4));
  const u = Math.min(0.999, (f - l.start) / Math.max(1, l.end - l.start));
  const total = l.text.length; let acc = 0, k = 0;
  for (let i = 0; i < chunks.length; i++) { const len = chunks[i].join(" ").length + 1; if (acc / total <= u) k = i; acc += len; }
  const st = STYLE[l.who ?? "sam"] ?? STYLE.sam;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: H * 0.2 }}>
      <div style={{ ...txt(st.color, 66, st.italic), maxWidth: W * 0.82 }}>{chunks[k].join(" ")}</div>
    </AbsoluteFill>
  );
};

/** teks bunyi (merah, miring, sedikit bergetar) */
const BUNYI: { a: number; b: number; text: string }[] = [
  { a: S0("g04"), b: S0("g05") + 6, text: "BAM! BAM! BAM!" },
  { a: S0("g08"), b: S0("g09"), text: "KRRRK... KRRRK..." },
  { a: S0("g12") + 6, b: S0("g13"), text: "CLICK." },
];
const Bunyi: React.FC<{ f: number }> = ({ f }) => {
  const b = BUNYI.find((x) => f >= x.a && f < x.b);
  if (!b) return null;
  const j = (f % 4) - 1.5;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingTop: H * 0.2 }}>
      <div style={{ ...txt("#ff4a4a", 80, true), transform: `translate(${j * 2}px, ${-j * 1.5}px) rotate(-4deg)` }}>{b.text}</div>
    </AbsoluteFill>
  );
};

const Judul: React.FC<{ f: number }> = ({ f }) => {
  if (f > 105) return null;
  const o = Math.min(1, f / 6) * Math.min(1, (105 - f) / 10);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 250, opacity: o }}>
      <div style={{ ...txt("#ffffff", 84), letterSpacing: 2 }}>LAST GAS STATION</div>
      <div style={{ ...txt("#ff5a4a", 52), marginTop: 8 }}>PART 1</div>
    </AbsoluteFill>
  );
};

const Tombol: React.FC<{ bg: string; icon: string; label: string; s: number }> = ({ bg, icon, label, s }) => (
  <div style={{ width: 880, padding: "34px 40px", borderRadius: 26, background: bg, display: "flex", alignItems: "center", gap: 30, transform: `scale(${s})`,
    boxShadow: "0 12px 0 rgba(0,0,0,0.35), inset 0 -8px 0 rgba(0,0,0,0.18), 0 0 0 5px rgba(255,255,255,0.85)" }}>
    <span style={{ fontSize: 76 }}>{icon}</span>
    <span style={{ ...txt("#ffffff", 64), textAlign: "left", WebkitTextStroke: "2px #0b0710" }}>{label}</span>
  </div>
);
const Pilihan: React.FC<{ f: number }> = ({ f }) => {
  const a = S0("g14");
  if (f < a) return null;
  const k = (f - a) / FPS, pop = (d: number) => Math.min(1, Math.max(0, (k - d) / 0.25)), sc = (d: number) => 0.6 + 0.4 * pop(d) + 0.05 * Math.sin(Math.min(1, pop(d)) * Math.PI);
  return (
    <AbsoluteFill style={{ background: `rgba(8,6,14,${0.55 * Math.min(1, k / 0.4)})`, alignItems: "center", justifyContent: "center", gap: 34 }}>
      <div style={{ ...txt("#ffffff", 104), opacity: pop(0), transform: `scale(${sc(0)})` }}>WHAT WOULD<br />YOU DO?</div>
      <div style={{ opacity: pop(0.35) }}><Tombol bg="#2f7fe0" icon="🚪" label="OPEN THE FRONT DOOR" s={sc(0.35)} /></div>
      <div style={{ ...txt("#ffd84a", 60), opacity: pop(0.6) }}>OR</div>
      <div style={{ opacity: pop(0.8) }}><Tombol bg="#d9342b" icon="📦" label="HIDE IN THE STOCKROOM" s={sc(0.8)} /></div>
      <div style={{ ...txt("#ffffff", 48), opacity: pop(1.3), marginTop: 20 }}>Comment below 👇<br /><span style={{ color: "#ffd84a", fontSize: 40 }}>Part 2 follows your choice</span></div>
    </AbsoluteFill>
  );
};

export const GasStation1: React.FC = () => {
  const f = useCurrentFrame();
  useFont();
  const cold = f < COLD;
  const f3 = cold ? coldFrame(f) : Math.min(f, FREEZE);
  // kilat putih saat gedoran dan saat wajah muncul, vinyet merah berdetak di akhir
  const flash = (a: number) => (f >= a && f < a + 4 ? [0.8, 0.5, 0.25, 0.1][f - a] : 0);
  const fl = Math.max(flash(0), flash(S0("g04") + 4), flash(S0("g12") + 8));
  const pulse = cold ? 0.6 : f >= S0("g09") && f < S0("g14") ? (f >= S0("g12") ? 0.55 : 0.3) * Math.pow(Math.abs(Math.sin((f / FPS) * Math.PI * (f >= S0("g12") ? 2.4 : 1.6))), 3) : 0;
  return (
    <AbsoluteFill style={{ background: "#05060c" }}>
      <ThreeCanvas width={W} height={H} gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 104, near: 0.04, far: 600 }}>
        <Inner f={f3} />
      </ThreeCanvas>
      <AbsoluteFill style={{ background: "#1c2a55", mixBlendMode: "multiply", opacity: 0.32 }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 62% at 50% 50%, rgba(0,0,0,0) 55%, rgba(3,2,8,0.7) 100%)" }} />
      {pulse > 0 ? <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 58% at 50% 50%, rgba(0,0,0,0) 45%, rgba(150,8,14,0.9) 100%)", opacity: pulse }} /> : null}
      {fl > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: fl }} /> : null}
      {cold && f >= COLD - 6 ? <AbsoluteFill style={{ background: "#000" }} /> : null}
      {cold ? null : <Judul f={f - COLD} />}
      {f < S0("g14") ? <Caption f={f} /> : null}
      {f < S0("g14") ? <Bunyi f={f} /> : null}
      <Pilihan f={f} />
    </AbsoluteFill>
  );
};
