// Foto profil kanal "3AM Choices": wajah peniru di jendela pintu (ikon serial) + jam digital merah 3:00.
// Dirancang untuk dipotong lingkaran (TikTok/YouTube/IG): isi penting di tengah 70 %.
import React, { useEffect, useState } from "react";
import { registerRoot, Composition, AbsoluteFill, staticFile, delayRender, continueRender } from "remotion";
import { loadFont } from "@remotion/fonts";

const INK = "#140c16";
const Profil: React.FC = () => {
  const [h] = useState(() => delayRender("font"));
  useEffect(() => { loadFont({ family: "Fredoka", url: staticFile("fonts/Fredoka-Bold.ttf"), weight: "700" }).then(() => continueRender(h), () => continueRender(h)); }, [h]);
  const S = 1024;
  return (
    <AbsoluteFill style={{ background: "#07080f" }}>
      <svg width={S} height={S} viewBox="0 0 1024 1024">
        <defs>
          <radialGradient id="bg" cx="50%" cy="45%" r="62%">
            <stop offset="0" stopColor="#3a1216" /><stop offset="0.55" stopColor="#1a0a10" /><stop offset="1" stopColor="#07060c" />
          </radialGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#d8d2c4" stopOpacity="0.55" /><stop offset="1" stopColor="#d8d2c4" stopOpacity="0" />
          </radialGradient>
          <clipPath id="win"><rect x="338" y="208" width="348" height="314" rx="6" /></clipPath>
          <linearGradient id="door" x1="0" x2="1">
            <stop offset="0" stopColor="#3f5a4b" /><stop offset="1" stopColor="#2c4236" />
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#bg)" />
        {/* pintu */}
        <rect x="232" y="118" width="560" height="980" rx="14" fill="url(#door)" stroke={INK} strokeWidth="14" />
        <rect x="262" y="148" width="500" height="920" rx="8" fill="none" stroke="#26372d" strokeWidth="8" />
        {/* jendela + wajah */}
        <rect x="330" y="200" width="364" height="330" rx="10" fill="#050407" stroke={INK} strokeWidth="16" />
        <g clipPath="url(#win)">
          <ellipse cx="512" cy="372" rx="190" ry="160" fill="url(#glow)" />
          <ellipse cx="512" cy="400" rx="130" ry="185" fill="#cfc9bd" stroke={INK} strokeWidth="9" />
          <circle cx="462" cy="318" r="34" fill="#050307" /><circle cx="562" cy="318" r="34" fill="#050307" />
          <circle cx="470" cy="310" r="7" fill="#e8e2d6" /><circle cx="570" cy="310" r="7" fill="#e8e2d6" />
          <path d="M 402 402 Q 512 520 622 402 Q 512 470 402 402 Z" fill="#050307" stroke={INK} strokeWidth="6" />
          {[430, 462, 494, 526, 558, 590].map((x) => <line key={x} x1={x} y1={410 + Math.abs(512 - x) * -0.12 + 8} x2={x} y2={445 - Math.abs(512 - x) * 0.25} stroke="#cfc9bd" strokeWidth="7" />)}
        </g>
        <rect x="330" y="200" width="364" height="330" rx="10" fill="#9cc4dd" opacity="0.08" />
        <line x1="352" y1="230" x2="420" y2="215" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="10" strokeLinecap="round" />
        {/* jam digital 3:00 */}
        <rect x="292" y="612" width="440" height="200" rx="26" fill="#0c0a10" stroke={INK} strokeWidth="14" />
        <text x="512" y="768" textAnchor="middle" fontFamily="Fredoka, Arial Black" fontWeight="700" fontSize="168" fill="#ff2e3a"
          style={{ filter: "drop-shadow(0 0 18px rgba(255,40,50,0.85))" }}>3:00</text>
        <text x="512" y="880" textAnchor="middle" fontFamily="Fredoka, Arial Black" fontWeight="700" fontSize="64" fill="#f4efe4"
          stroke={INK} strokeWidth="10" paintOrder="stroke" letterSpacing="6">CHOICES</text>
      </svg>
    </AbsoluteFill>
  );
};
const Root: React.FC = () => <Composition id="Profil3AM" component={Profil} durationInFrames={1} fps={30} width={1024} height={1024} />;
registerRoot(Root);
