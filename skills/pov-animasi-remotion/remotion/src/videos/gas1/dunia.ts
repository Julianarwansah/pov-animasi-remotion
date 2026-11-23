// LAST GAS STATION — Part 1. Dunia 3D (toko pom bensin malam), tokoh 3D berbentuk tetap (kepala bulat, leher kecil,
// badan kotak setinggi 1 kepala, lengan/kaki tabung, tangan bulat, sepatu pipih, ±4,4 kepala, lengan baju pendek),
// tangan POV orang pertama, dan kamera per shot. update(f, cam) murni fungsi frame.
// Sumbu: +z = ke kaca depan / jalan raya, -z = ke belakang toko (lorong toilet). Satuan meter.
import * as THREE from "three";
import TL from "./timeline.json";

export const FPS = 30;
type V3 = [number, number, number];
type Line = { id: string; scene: string; who: string | null; text: string | null; start: number; end: number; mulut: number[] };
export const LINES = (TL as unknown as { baris: Line[] }).baris;
export const TOTAL = (TL as unknown as { total: number }).total;
const L = (id: string) => LINES.find((l) => l.id === id)!;
export const S0 = (id: string) => L(id).start;
export const FREEZE = S0("g14") - 1;
/** cold open (sebelum baris pertama): kilasan wajah peniru di jendela pintu toilet */
export const COLD = Math.max(0, S0("g01") - 4);
export const coldFrame = (f: number) => S0("g12") + 40 + Math.floor(f * 0.6);

// ---------------- util ----------------
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerp3 = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const hh = (i: number, s = 1) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
const span = (f: number, a: number, b: number) => clamp01((f - a) / Math.max(1, b - a));

const RAMP = (() => {
  const t = new THREE.DataTexture(new Uint8Array([70, 150, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
const MAT = new Map<string, THREE.Material>();
const toon = (c: string) => {
  if (!MAT.has(c)) MAT.set(c, new THREE.MeshToonMaterial({ color: c, gradientMap: RAMP }));
  return MAT.get(c)!;
};
const glow = (c: string, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: true });
const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const BOXG = new THREE.BoxGeometry(1, 1, 1);
const CYLG = new THREE.CylinderGeometry(1, 1, 1, 20);
const SPHG = new THREE.SphereGeometry(1, 32, 20);
const box = (p: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material | string, x: number, y: number, z: number) => {
  const o = new THREE.Mesh(BOXG, typeof m === "string" ? toon(m) : m);
  o.scale.set(w, h, d); o.position.set(x, y, z); p.add(o); return o;
};
const ball = (p: THREE.Object3D, r: number, m: THREE.Material | string, x = 0, y = 0, z = 0) => {
  const o = new THREE.Mesh(SPHG, typeof m === "string" ? toon(m) : m);
  o.scale.setScalar(r); o.position.set(x, y, z); p.add(o); return o;
};
const UP = new THREE.Vector3(0, 1, 0);
/** tabung dari titik a ke b */
const tube = (p: THREE.Object3D, r: number, m: THREE.Material | string) => {
  const o = new THREE.Mesh(CYLG, typeof m === "string" ? toon(m) : m); o.userData.r = r; p.add(o); return o;
};
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
const setTube = (o: THREE.Mesh, a: V3, b: V3) => {
  _a.set(...a); _b.set(...b);
  const len = _a.distanceTo(_b);
  o.position.copy(_a).add(_b).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(UP, _b.sub(_a).normalize());
  o.scale.set(o.userData.r, len, o.userData.r);
};
const plane = (p: THREE.Object3D, w: number, h: number, m: THREE.Material, x: number, y: number, z: number, ry = 0) => {
  const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.y = ry; p.add(o); return o;
};
const signTex = (lines: string[], bg: string, fg: string, w = 512, h = 256, font = "bold 84px Arial Black, Arial", border = true) => canvasTex(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  if (border) { g.strokeStyle = fg; g.lineWidth = 12; g.strokeRect(10, 10, w - 20, h - 20); }
  g.fillStyle = fg; g.font = font; g.textAlign = "center"; g.textBaseline = "middle";
  lines.forEach((s, i) => g.fillText(s, w / 2, h / 2 + (i - (lines.length - 1) / 2) * (h / (lines.length + 0.6))));
});

// ---------------- tokoh (bentuk tetap) ----------------
const SKIN = "#ffe2c2";
const INKC = "#241726";
type Rupa = { shirt: string | THREE.Material; pants: string; shoes: string; skin?: string; armSkinL?: string; cap?: string; hair?: string; s?: number };
export class Orang {
  g = new THREE.Group();
  head: THREE.Group; mouth: THREE.Mesh; eyes: THREE.Mesh[] = []; brows: THREE.Mesh[] = [];
  armL = new THREE.Group(); armR = new THREE.Group(); legL = new THREE.Group(); legR = new THREE.Group();
  constructor(r: Rupa) {
    const g = this.g, skin = r.skin ?? SKIN;
    const shirt = typeof r.shirt === "string" ? toon(r.shirt) : r.shirt;
    for (const [leg, x] of [[this.legL, -0.1], [this.legR, 0.1]] as const) {
      leg.position.set(x, 0.84, 0); g.add(leg);
      const t = new THREE.Mesh(CYLG, toon(r.pants)); t.scale.set(0.058, 0.78, 0.058); t.position.y = -0.39; leg.add(t);
      box(leg, 0.15, 0.06, 0.27, r.shoes, 0, -0.81, 0.045);
    }
    box(g, 0.44, 0.44, 0.26, shirt, 0, 1.06, 0);
    const neck = new THREE.Mesh(CYLG, toon(skin)); neck.scale.set(0.04, 0.16, 0.04); neck.position.y = 1.35; g.add(neck);
    this.head = new THREE.Group(); this.head.position.y = 1.62; g.add(this.head);
    ball(this.head, 0.21, skin);
    for (const x of [-0.072, 0.072]) {
      const e = ball(this.head, 1, "#120c14", x, 0.025, 0.192); e.scale.set(0.028, 0.044, 0.016); this.eyes.push(e);
      const b = box(this.head, 0.07, 0.014, 0.01, "#120c14", x, 0.09, 0.19); this.brows.push(b);
    }
    this.mouth = ball(this.head, 1, "#3a0d18", 0, -0.085, 0.188); this.mouth.scale.set(0.05, 0.012, 0.012);
    if (r.cap) {
      const c = new THREE.Mesh(CYLG, toon(r.cap)); c.scale.set(0.215, 0.1, 0.215); c.position.y = 0.13; this.head.add(c);
      box(this.head, 0.3, 0.025, 0.2, r.cap, 0, 0.09, 0.23);
    }
    if (r.hair) { const h = ball(this.head, 1, r.hair, 0, 0.07, -0.02); h.scale.set(0.215, 0.17, 0.215); }
    for (const [arm, x, sk] of [[this.armL, -0.27, r.armSkinL ?? skin], [this.armR, 0.27, skin]] as const) {
      arm.position.set(x, 1.24, 0); g.add(arm);
      const sl = new THREE.Mesh(CYLG, shirt); sl.scale.set(0.07, 0.16, 0.07); sl.position.y = -0.06; arm.add(sl);
      const fa = new THREE.Mesh(CYLG, toon(sk)); fa.scale.set(0.047, 0.5, 0.047); fa.position.y = -0.33; arm.add(fa);
      ball(arm, 0.078, sk, 0, -0.6, 0);
    }
    g.scale.setScalar(r.s ?? 1);
  }
  /** wajah: buka mulut 0..1, takut 0..1 (alis miring, mata membesar) */
  wajah(open: number, takut = 0) {
    this.mouth.scale.set(0.05 - 0.012 * open, 0.012 + 0.06 * open, 0.012);
    this.eyes.forEach((e) => e.scale.set(0.028 + 0.01 * takut, 0.044 + 0.016 * takut, 0.016));
    this.brows.forEach((b, i) => { b.rotation.z = (i ? -1 : 1) * 0.45 * takut; b.position.y = 0.09 + 0.02 * takut; });
  }
}

// ---------------- dunia ----------------
const CW = 6, CZF = 5, CZB = -5, CH = 3; // toko: x -6..6, z -5..5, tinggi 3
const DOOR_Z = -9; // pintu toilet di ujung lorong
export const LOCK: V3 = [0.62, 1.12, 4.9];
const RADIO: V3 = [-4.75, 1.1, 1.0];

export class World {
  root = new THREE.Group();
  sky: THREE.Mesh;
  trucker: Orang;
  zombies: { o: Orang; x: number; z: number; ph: number; row: number }[] = [];
  pov = new THREE.Group();
  povArm: { up: THREE.Mesh; fo: THREE.Mesh; hand: THREE.Mesh }[] = [];
  watch: THREE.Mesh; chips: THREE.Mesh;
  feet: THREE.Group;
  radioDial: THREE.Mesh;
  canopyLights: { panel: THREE.Mesh; light: THREE.PointLight }[] = [];
  hallLight: THREE.PointLight; hallBulb: THREE.Mesh;
  roomLights: THREE.PointLight[] = [];
  panels: THREE.Mesh[] = [];
  doorPivot = new THREE.Group(); handle: THREE.Mesh; face = new THREE.Group(); fingers = new THREE.Group();
  underGlow: THREE.Mesh; feetShadow: THREE.Mesh[] = [];

  constructor() {
    const R = this.root;
    // langit malam
    const skyM = new THREE.ShaderMaterial({
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "varying vec3 vP; void main(){ float e = clamp(vP.y, 0.0, 1.0); vec3 c = mix(vec3(0.10,0.13,0.26), vec3(0.02,0.03,0.09), pow(e, 0.5)); gl_FragColor = vec4(c, 1.0); }",
      side: THREE.BackSide, depthWrite: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), skyM); this.sky.renderOrder = -1; R.add(this.sky);
    const moon = new THREE.Mesh(new THREE.CircleGeometry(6, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.2, 2.4), depthWrite: false }));
    moon.position.set(-60, 70, 220); moon.lookAt(0, 0, 0); R.add(moon);
    for (let i = 0; i < 90; i++) {
      const s = new THREE.Mesh(new THREE.CircleGeometry(0.5 + hh(i, 3) * 0.6, 6), new THREE.MeshBasicMaterial({ color: "#dfe6ff", depthWrite: false }));
      const a = (hh(i, 1) - 0.5) * 2.4, e = 0.15 + hh(i, 2) * 1.1;
      s.position.set(Math.sin(a) * Math.cos(e) * 300, Math.sin(e) * 300, Math.cos(a) * Math.cos(e) * 300); s.lookAt(0, 0, 0); R.add(s);
    }
    // cahaya
    R.add(new THREE.AmbientLight("#8a96c4", 0.28));
    R.add(new THREE.HemisphereLight("#e8dcc0", "#3a3550", 0.28));
    for (const [x, z] of [[-3.2, 0.5], [2.2, 0.5], [0, -3], [-3.2, 3.6], [2.6, 3.6]]) {
      const l = new THREE.PointLight("#ffe9c2", 4.2, 10, 1.3); l.position.set(x, 2.85, z); R.add(l); this.roomLights.push(l);
      this.panels.push(box(R, 1.4, 0.06, 0.32, glow("#fffbea", 2.2), x, 2.97, z));
    }
    // lantai toko (ubin)
    const tiles = canvasTex(512, 512, (g) => {
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? "#b8b09c" : "#a39b86"; g.fillRect(i * 64, j * 64, 64, 64); }
      g.strokeStyle = "rgba(60,50,40,0.35)"; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 512); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke(); }
    });
    tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping; tiles.repeat.set(4, 4);
    const floorM = new THREE.MeshToonMaterial({ map: tiles, gradientMap: RAMP });
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), floorM); fl.rotation.x = -Math.PI / 2; R.add(fl);
    const hallFl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 4.3), floorM); hallFl.rotation.x = -Math.PI / 2; hallFl.position.set(-0.9, 0.001, -7.1); R.add(hallFl);
    box(R, 12, 0.1, 10, "#b9b19c", 0, CH + 0.05, 0); // plafon
    // dinding
    const wall = "#c9bb98", wallLow = "#6a302b";
    box(R, 0.1, CH, 10, wall, -CW, CH / 2, 0); box(R, 0.1, CH, 10, wall, CW, CH / 2, 0);
    box(R, 0.1, 0.9, 10, wallLow, -CW + 0.06, 0.45, 0); box(R, 0.1, 0.9, 10, wallLow, CW - 0.06, 0.45, 0);
    box(R, 4.4, CH, 0.1, wall, (-CW + -1.6) / 2, CH / 2, CZB); // belakang kiri  (-6..-1.6)
    box(R, 6.2, CH, 0.1, wall, (-0.2 + CW) / 2, CH / 2, CZB); // belakang kanan (-0.2..6)
    box(R, 1.4, 0.8, 0.1, wall, -0.9, CH - 0.4, CZB); // ambang lorong
    // lorong ke toilet
    box(R, 0.1, CH, 4.2, wall, -1.6, CH / 2, -7.1); box(R, 0.1, CH, 4.2, wall, -0.2, CH / 2, -7.1);
    box(R, 1.5, 0.1, 4.2, "#d8d0bb", -0.9, CH - 0.25, -7.1);
    box(R, 1.6, CH, 0.1, "#cfc5a8", -0.9, CH / 2, DOOR_Z - 0.12).visible = false;
    box(R, 1.6, CH, 0.1, "#cfc5a8", -0.9, CH / 2, DOOR_Z + 0.06).scale.set(1.6, 0.0, 0.1);
    { const k = glow("#050407"); // ruang toilet gelap (berongga) di balik pintu
      box(R, 1.8, CH, 0.1, k, -0.9, CH / 2, DOOR_Z - 1.6); box(R, 0.1, CH, 1.5, k, -1.75, CH / 2, DOOR_Z - 0.85); box(R, 0.1, CH, 1.5, k, -0.05, CH / 2, DOOR_Z - 0.85);
      box(R, 1.8, 0.1, 1.5, k, -0.9, CH, DOOR_Z - 0.85); box(R, 1.8, 0.02, 1.5, k, -0.9, 0.0, DOOR_Z - 0.85); }
    box(R, 0.25, CH, 0.12, "#cfc5a8", -1.47, CH / 2, DOOR_Z); box(R, 0.25, CH, 0.12, "#cfc5a8", -0.33, CH / 2, DOOR_Z); box(R, 1.4, CH - 2.08, 0.12, "#cfc5a8", -0.9, 2.08 + (CH - 2.08) / 2, DOOR_Z);
    this.hallLight = new THREE.PointLight("#ffe7b0", 3.5, 6, 1.3); this.hallLight.position.set(-0.9, 2.55, -7.2); R.add(this.hallLight);
    this.hallBulb = ball(R, 0.07, glow("#fff1c4", 2.5), -0.9, 2.62, -7.2);
    // pintu toilet (engsel di kiri)
    this.doorPivot.position.set(-1.34, 0, DOOR_Z); R.add(this.doorPivot);
    // daun pintu dari 4 potong mengelilingi lubang jendela (x 0.29..0.59, y 1.49..1.75)
    const dc = "#5d7a6a";
    box(this.doorPivot, 0.29, 2.05, 0.06, dc, 0.145, 1.025, 0); box(this.doorPivot, 0.29, 2.05, 0.06, dc, 0.735, 1.025, 0);
    box(this.doorPivot, 0.3, 1.49, 0.06, dc, 0.44, 0.745, 0); box(this.doorPivot, 0.3, 0.3, 0.06, dc, 0.44, 1.9, 0);
    const sign = plane(this.doorPivot, 0.42, 0.3, new THREE.MeshBasicMaterial({ map: signTex(["OUT OF", "ORDER"], "#f4f1e6", "#c0262d", 512, 360, "bold 110px Arial Black, Arial", false) }), 0.44, 1.15, 0.035);
    sign.rotation.z = 0.06;
    plane(this.doorPivot, 0.3, 0.26, new THREE.MeshBasicMaterial({ color: "#a9c3d6", transparent: true, opacity: 0.12, depthWrite: false }), 0.44, 1.62, 0.0); // kaca jendela
    this.handle = box(this.doorPivot, 0.16, 0.035, 0.05, "#c9c3b2", 0.74, 1.0, 0.06);
    this.handle.geometry = new THREE.BoxGeometry(1, 1, 1).translate(-0.4, 0, 0);
    // wajah peniru di balik jendela (muncul di shot gagang)
    this.face.position.set(-0.9, 1.62, DOOR_Z - 0.13); R.add(this.face);
    const fh = ball(this.face, 1, new THREE.MeshBasicMaterial({ color: "#bdb8ae" }), 0, 0, 0); fh.scale.set(0.12, 0.17, 0.05);
    for (const x of [-0.045, 0.045]) { const e = ball(this.face, 1, "#050307", x, 0.04, 0.045); e.scale.set(0.028, 0.05, 0.01); }
    const fm = ball(this.face, 1, "#050307", 0, -0.09, 0.045); fm.scale.set(0.05, 0.11, 0.01); fm.name = "mulut";
    this.face.visible = false;
    // jari panjang pucat di tepi pintu
    this.fingers.position.set(0.9, 1.25, 0.0); this.doorPivot.add(this.fingers);
    for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(CYLG, toon("#e4e0d6")); t.scale.set(0.024, 0.2, 0.024); t.rotation.z = Math.PI / 2 - 0.12 + i * 0.07; t.position.set(-0.05, i * 0.07, 0.045); this.fingers.add(t); }
    this.fingers.visible = false;
    // cahaya di bawah pintu + bayangan kaki
    this.underGlow = plane(R, 0.86, 0.5, new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd98a").multiplyScalar(1.3), transparent: true, opacity: 0.85, depthWrite: false }), -0.9, 0.004, DOOR_Z + 0.3);
    this.underGlow.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 2; i++) {
      const s = plane(R, 0.16, 0.42, new THREE.MeshBasicMaterial({ color: "#120c10", transparent: true, opacity: 0.9, depthWrite: false }), -0.9, 0.006, DOOR_Z + 0.3);
      s.rotation.x = -Math.PI / 2; this.feetShadow.push(s);
    }
    // pintu gudang
    box(R, 1.0, 2.1, 0.06, "#8a6a4c", 3.5, 1.05, CZB + 0.06);
    plane(R, 0.7, 0.32, new THREE.MeshBasicMaterial({ map: signTex(["STOCKROOM"], "#f2e9cf", "#2b2230", 512, 220, "bold 76px Arial Black, Arial") }), 3.5, 1.75, CZB + 0.1);
    box(R, 0.05, 0.05, 0.08, "#c9c3b2", 3.88, 1.0, CZB + 0.1);
    // poster dinding belakang kiri
    plane(R, 1.1, 0.75, new THREE.MeshBasicMaterial({ map: signTex(["ICE COLD", "SODA 99¢"], "#2f6fb5", "#ffffff", 512, 350, "bold 80px Arial Black, Arial") }), -3.6, 2.0, CZB + 0.06);
    // meja kasir
    box(R, 3.2, 1.0, 0.8, "#a6402f", -4.0, 0.5, 1.0);
    box(R, 3.3, 0.06, 0.9, "#ece3cc", -4.0, 1.03, 1.0);
    box(R, 0.5, 0.25, 0.4, "#3b3a44", -3.2, 1.19, 1.0); // mesin kasir
    box(R, 0.36, 0.2, 0.05, "#22303a", -3.2, 1.42, 0.86);
    // radio tua
    box(R, 0.42, 0.24, 0.18, "#6b4b35", RADIO[0], RADIO[1] + 0.12, RADIO[2]);
    this.radioDial = plane(R, 0.16, 0.08, new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffbf5a").multiplyScalar(1.6) }), RADIO[0] + 0.08, RADIO[1] + 0.15, RADIO[2] - 0.095, Math.PI);
    ball(R, 0.06, "#2a2026", RADIO[0] - 0.11, RADIO[1] + 0.12, RADIO[2] - 0.08);
    const ant = new THREE.Mesh(CYLG, toon("#b8b8c0")); ant.userData.r = 0.006; R.add(ant); setTube(ant, [RADIO[0] + 0.15, RADIO[1] + 0.24, RADIO[2]], [RADIO[0] + 0.32, RADIO[1] + 0.7, RADIO[2] + 0.1]);
    // kursi kasir
    box(R, 0.5, 0.08, 0.5, "#2c2a33", -4.0, 0.6, -0.15); box(R, 0.08, 0.6, 0.08, "#2c2a33", -4.0, 0.3, -0.15);
    // rak camilan
    const snack = ["#e0442f", "#f2b632", "#3a8fd9", "#45b25a", "#8e4fc9", "#f07a28", "#d8366e"];
    for (const z of [-1.2, 1.4]) {
      box(R, 3.4, 1.5, 0.08, "#5b6170", 2.0, 0.75, z);
      for (const y of [0.2, 0.62, 1.04, 1.46]) {
        box(R, 3.4, 0.04, 0.7, "#7b8190", 2.0, y, z);
        if (y > 1.4) continue;
        for (let i = 0; i < 11; i++) for (const side of [-1, 1]) {
          const k = i * 7 + Math.round(y * 10) + (side + 1) * 31 + Math.round(z * 3);
          const h = 0.18 + hh(k, 2) * 0.16;
          box(R, 0.22, h, 0.22, snack[Math.floor(hh(k, 1) * snack.length)], 0.45 + i * 0.3, y + 0.02 + h / 2, z + side * 0.2);
        }
      }
    }
    // kulkas minuman di dinding kanan
    box(R, 0.9, 2.3, 4.6, "#3d4350", CW - 0.5, 1.15, 1.6);
    for (let i = 0; i < 4; i++) {
      plane(R, 1.05, 1.95, new THREE.MeshBasicMaterial({ color: new THREE.Color("#bfe9ff").multiplyScalar(1.15) }), CW - 0.96, 1.2, -0.08 + i * 1.12, -Math.PI / 2);
      for (let r = 0; r < 4; r++) for (let b = 0; b < 4; b++)
        box(R, 0.06, 0.26, 0.12, snack[(i + r + b) % snack.length], CW - 0.99, 0.45 + r * 0.45, -0.08 + i * 1.12 - 0.36 + b * 0.24);
    }
    // dinding depan: dasar + kaca + bingkai + pintu kaca
    box(R, 12, 0.5, 0.15, wallLow, 0, 0.25, CZF);
    box(R, 12, 0.12, 0.15, "#2b2a30", 0, CH - 0.06, CZF);
    const glass = new THREE.MeshBasicMaterial({ color: "#9cc4dd", transparent: true, opacity: 0.1, depthWrite: false });
    plane(R, 12, CH - 0.6, glass, 0, 0.5 + (CH - 0.6) / 2, CZF);
    for (const x of [-5.9, -4, -2, -0.85, 0.85, 2, 4, 5.9]) box(R, 0.09, CH, 0.14, "#2b2a30", x, CH / 2, CZF);
    box(R, 1.7, 0.09, 0.14, "#2b2a30", 0, 2.25, CZF);
    box(R, 0.1, 0.18, 0.08, "#2b2a30", 0, 1.1, CZF - 0.02); // gagang pintu
    box(R, 0.1, 0.12, 0.06, "#c9b98a", LOCK[0], LOCK[1], LOCK[2]); // kunci slot
    this.lockKnob = box(R, 0.03, 0.09, 0.04, "#8a7a52", LOCK[0], LOCK[1], LOCK[2] - 0.05);
    plane(R, 0.9, 0.36, new THREE.MeshBasicMaterial({ map: signTex(["OPEN 24H"], "#120a10", "#ff4a5c", 512, 200, "bold 96px Arial Black, Arial") }), -3.0, 2.1, CZF - 0.03, Math.PI);
    // halaman depan + kanopi + pompa
    const lot = new THREE.Mesh(new THREE.PlaneGeometry(60, 18), toon("#4a4d57")); lot.rotation.x = -Math.PI / 2; lot.position.set(0, -0.01, 14); R.add(lot);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 9), toon("#26282f")); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.0, 27.5); R.add(road);
    for (let i = -12; i <= 12; i++) box(R, 2.2, 0.01, 0.18, "#d9b43a", i * 5, 0.012, 27.5);
    const field = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), toon("#1c2421")); field.rotation.x = -Math.PI / 2; field.position.set(0, -0.02, 150); R.add(field);
    for (let i = 0; i < 26; i++) {
      const x = -70 + i * 5.6 + hh(i, 4) * 3, z = 44 + hh(i, 5) * 14, h = 5 + hh(i, 6) * 5;
      const c = new THREE.Mesh(new THREE.ConeGeometry(h * 0.32, h, 7), toon("#141b1a")); c.position.set(x, h / 2, z); R.add(c);
    }
    box(R, 14, 0.5, 8, "#e9e7e2", 0, 4.75, 13); box(R, 14.1, 0.25, 8.1, "#c23a2e", 0, 4.75, 13);
    for (const x of [-5.5, 5.5]) box(R, 0.35, 4.5, 0.35, "#e9e7e2", x, 2.25, 13);
    for (const [x, z] of [[-3, 11], [3, 11], [-3, 15], [3, 15]]) {
      const panel = plane(R, 2.2, 1.0, new THREE.MeshBasicMaterial({ color: new THREE.Color("#e9f3ff").multiplyScalar(2.4) }), x, 4.49, z);
      panel.rotation.x = Math.PI / 2;
      const l = new THREE.PointLight("#dbe9ff", 18, 16, 1.2); l.position.set(x, 4.2, z); R.add(l);
      this.canopyLights.push({ panel, light: l });
    }
    for (const x of [-3, 3]) {
      box(R, 1.6, 0.25, 0.9, "#9b9a98", x, 0.12, 13);
      box(R, 0.7, 1.6, 0.5, "#d8d4c9", x, 1.05, 13); box(R, 0.72, 0.3, 0.52, "#c23a2e", x, 1.95, 13);
      plane(R, 0.4, 0.3, new THREE.MeshBasicMaterial({ color: new THREE.Color("#a6ffcf").multiplyScalar(1.1) }), x, 1.35, 13.26);
    }
    // papan nama
    box(R, 0.3, 7, 0.3, "#5a5a60", 9, 3.5, 19);
    plane(R, 4, 1.8, new THREE.MeshBasicMaterial({ map: signTex(["ROUTE 9", "FUEL"], "#c23a2e", "#fff6e0", 512, 230, "bold 92px Arial Black, Arial") }), 9, 7.4, 18.84, Math.PI);
    // trucker
    const plaid = new THREE.MeshToonMaterial({ gradientMap: RAMP, map: canvasTex(256, 256, (g) => {
      g.fillStyle = "#b8322b"; g.fillRect(0, 0, 256, 256); g.fillStyle = "rgba(20,10,15,0.55)";
      for (let i = 0; i < 4; i++) { g.fillRect(i * 64 + 20, 0, 22, 256); g.fillRect(0, i * 64 + 20, 256, 22); }
    }) });
    this.trucker = new Orang({ shirt: plaid, pants: "#33456b", shoes: "#3a2a22", cap: "#2f5fae", armSkinL: "#b9c79e", s: 1.08 });
    // perban di lengan kiri
    const band = new THREE.Mesh(CYLG, toon("#efe9dc")); band.scale.set(0.056, 0.2, 0.056); band.position.y = -0.36; this.trucker.armL.add(band);
    const stain = ball(this.trucker.armL, 1, "#5e6b3b", 0.03, -0.38, 0.04); stain.scale.set(0.03, 0.06, 0.03);
    R.add(this.trucker.g);
    // gerombolan zombie di jalan
    const zs = ["#5f7266", "#6e5a62", "#56627a", "#6d6650"];
    for (let i = 0; i < 18; i++) {
      const o = new Orang({ shirt: zs[i % 4], pants: "#2a2c33", shoes: "#1d1a1e", skin: "#8fa38c", hair: i % 3 ? "#2a2226" : undefined, s: 0.95 + hh(i, 9) * 0.15 });
      o.armL.rotation.x = -1.35 - hh(i, 7) * 0.2; o.armR.rotation.x = -1.2 - hh(i, 8) * 0.3;
      o.g.rotation.y = Math.PI + (hh(i, 6) - 0.5) * 0.4;
      const LANE = [-4.7, -1.6, 1.6, 4.7, -0.4, 0.8], row = Math.floor(i / 6);
      R.add(o.g); this.zombies.push({ o, x: LANE[i % 6] + (hh(i, 1) - 0.5) * 0.3, z: 10.6 + row * 4.2 + hh(i, 2) * 1.2 + (i % 6 > 3 ? 1.8 : 0), ph: hh(i, 3), row });
    }
    // kaki POV di atas meja kasir (shot kasir/radio)
    this.feet = new THREE.Group(); R.add(this.feet);
    for (const x of [-4.14, -3.88]) {
      const leg = tube(this.feet, 0.065, "#3b4f7a"); setTube(leg, [x, 0.66, -0.05], [x + 0.02, 1.12, 0.78]);
      const sh = box(this.feet, 0.16, 0.26, 0.12, "#f1efe7", x + 0.02, 1.2, 0.92); sh.rotation.x = -0.25;
      box(this.feet, 0.17, 0.05, 0.14, "#c23a2e", x + 0.02, 1.08, 0.95);
    }
    // tangan POV (ruang kamera)
    R.add(this.pov);
    for (let i = 0; i < 2; i++) {
      const up = tube(this.pov, 0.06, "#c8302c"), fo = tube(this.pov, 0.04, SKIN), hand = ball(this.pov, 0.06, SKIN);
      this.povArm.push({ up, fo, hand });
    }
    this.watch = plane(this.pov, 0.11, 0.08, new THREE.MeshBasicMaterial({ map: canvasTex(256, 180, (g) => {
      g.fillStyle = "#1b1d22"; g.fillRect(0, 0, 256, 180); g.fillStyle = "#7dff9a"; g.font = "bold 92px Courier New, monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("3:07", 128, 78);
      g.font = "bold 40px Courier New, monospace"; g.fillText("AM", 128, 148);
    }) }), 0, 0, 0);
    this.chips = box(this.pov, 0.16, 0.22, 0.06, "#f2b632", 0, 0, 0);
    this.chips.material = new THREE.MeshToonMaterial({ gradientMap: RAMP, map: signTex(["CHIPS"], "#f2b632", "#c0262d", 256, 256, "bold 64px Arial Black, Arial") });
  }
  lockKnob: THREE.Mesh;

  // ---------------- per frame ----------------
  update(f: number, cam: THREE.PerspectiveCamera) {
    const c = camAt(f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.04; cam.far = 600; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    this.sky.position.copy(cam.position);
    const t = f / FPS;
    // lampu kanopi: satu padam di shot kanopi
    const off = f >= S0("g03") + 10;
    this.canopyLights.forEach((k, i) => {
      let on = 1;
      if (i === 1 && f >= S0("g03")) on = off ? 0 : (Math.floor(f / 3) % 2 ? 0.15 : 1);
      if (i === 3 && f >= S0("g11")) on = Math.floor(f / 4) % 3 === 0 ? 0.2 : 1;
      k.light.intensity = 18 * on; (k.panel.material as THREE.MeshBasicMaterial).color.set("#e9f3ff").multiplyScalar(0.2 + 2.2 * on);
    });
    // radio mati di akhir baris radio
    const radioOn = f < L("g02").end - 4;
    (this.radioDial.material as THREE.MeshBasicMaterial).color.set(radioOn ? "#ffbf5a" : "#2a1d14").multiplyScalar(radioOn ? 1.6 : 1);
    // lampu lorong berkedip
    const dark = f >= S0("g12") ? (f < S0("g12") + 8 ? (Math.floor(f / 2) % 2 ? 0.1 : 1) : 0.12 * (hh(Math.floor(f / 3), 8) > 0.9 ? 3 : 1)) : 1;
    this.roomLights.forEach((l) => (l.intensity = 4.2 * dark));
    this.panels.forEach((m) => (m.material as THREE.MeshBasicMaterial).color.set("#fffbea").multiplyScalar(0.15 + 2.05 * dark));
    const hall = f >= S0("g08") ? (hh(Math.floor(f / 2), 5) > 0.82 ? 0.15 : 1) : 1;
    this.hallLight.intensity = 3.5 * hall; (this.hallBulb.material as THREE.MeshBasicMaterial).color.set("#fff1c4").multiplyScalar(0.3 + 2.2 * hall);
    // bayangan kaki di bawah pintu: bergeser saat garukan, diam saat menirukan suara
    const scratching = f >= S0("g08") && f < S0("g10");
    this.feetShadow.forEach((s, i) => {
      const dx = scratching ? 0.12 * Math.sin(t * 5 + i * 1.7) : 0.0;
      s.position.x = -0.9 + (i ? 0.14 : -0.14) + dx; s.visible = f >= S0("g08");
    });
    // pintu toilet: gagang berputar, wajah meregang, pintu terbuka sedikit
    const gA = S0("g12");
    const turn = f >= gA ? Math.sin(Math.min(1, (f - gA) / 30) * Math.PI * 3) * 0.6 * (f < gA + 30 ? 1 : 0) + (f >= gA + 30 ? -0.7 : 0) : 0;
    this.handle.rotation.z = turn;
    this.face.visible = f >= gA + 8 && f < S0("g13");
    if (this.face.visible) { const u = span(f, gA + 8, gA + 60); this.face.scale.set(1 - 0.12 * u, 1 + 0.6 * u, 1); this.face.position.y = 1.62 - 0.06 * u; this.face.position.z = DOOR_Z - 0.4 + 0.27 * ease(span(f, gA + 8, gA + 14)); }
    const ajar = f >= S0("g13") ? ease(span(f, S0("g13"), S0("g13") + 20)) * 0.55 : 0;
    this.doorPivot.rotation.y = ajar;
    this.fingers.visible = f >= S0("g13") + 10;
    // kunci pintu depan diputar di shot kunci
    this.lockKnob.rotation.z = f >= S0("g06") + 12 && f < S0("g07") ? 0.0 : 0;
    // trucker
    this.poseTrucker(f, t);
    // zombie
    const zOn = f >= S0("g11");
    for (const z of this.zombies) {
      z.o.g.visible = zOn;
      if (!zOn) continue;
      const tt = (f - S0("g11")) / FPS, gone = f >= S0("g13");
      const zmin = (gone ? 5.85 : 6.3) + z.row * 0.95 + (Math.abs(z.x) < 1.2 && !gone ? 0.2 : 0);
      const zz = Math.max(zmin, z.z - 1.6 * tt), at = zz <= zmin + 0.01;
      z.o.g.position.set(z.x + 0.1 * Math.sin(tt * 1.5 + z.ph * 6), 0.03 * Math.abs(Math.sin(tt * 4 + z.ph * 6)), zz + (at ? 0.05 * Math.abs(Math.sin(tt * 8 + z.ph * 5)) : 0));
      if (at) { z.o.armL.rotation.x = -1.9 + 0.25 * Math.abs(Math.sin(tt * 8 + z.ph * 5)); z.o.armR.rotation.x = -2.0 + 0.25 * Math.abs(Math.sin(tt * 8 + z.ph * 7)); }
      z.o.legL.rotation.x = 0.4 * Math.sin(tt * 4 + z.ph * 6); z.o.legR.rotation.x = -z.o.legL.rotation.x;
      z.o.head.rotation.z = 0.25 * Math.sin(z.ph * 9); z.o.wajah(0.6, 0);
    }
    // kaki POV
    this.feet.visible = false;
    this.posePov(f, t, cam);
  }

  poseTrucker(f: number, t: number) {
    const T = this.trucker, g = T.g;
    g.visible = f >= S0("g04") && f < S0("g13");
    if (!g.visible) return;
    const a = S0("g04");
    const slam = ease(span(f, a, a + 5));
    const pound = f < S0("g06") || (f >= S0("g11") && f < FREEZE) ? Math.abs(Math.sin(t * 9)) : 0;
    g.position.set(0.15, 0, lerp(7.5, 5.64, slam) - 0.06 * pound);
    g.rotation.set(-0.05, Math.PI, 0);
    T.armR.rotation.set(-2.62, 0, 0.15);
    let hide = 0;
    if (f >= S0("g07")) hide = ease(span(f, S0("g07"), S0("g07") + 10)) * (f < S0("g08") ? 1 : 0.6);
    T.armL.rotation.set(lerp(-2.62, 0.55, hide), 0, lerp(-0.15, 0.25, hide));
    T.head.rotation.set(0.12, f >= S0("g11") && f < S0("g11") + 14 ? 0.6 : 0, 0);
    T.legL.rotation.x = 0; T.legR.rotation.x = 0;
    T.wajah(mouthAt("trucker", f) * 0.9 + 0.1, 1);
  }

  posePov(f: number, t: number, cam: THREE.PerspectiveCamera) {
    this.pov.position.copy(cam.position); this.pov.quaternion.copy(cam.quaternion); this.pov.updateMatrixWorld();
    const p = povAt(f, t, (v) => { const w = new THREE.Vector3(...v); this.pov.worldToLocal(w); return [w.x, w.y, w.z]; });
    const sh: V3[] = [[0.3, -0.5, 0.05], [-0.3, -0.5, 0.05]];
    [p.R, p.L].forEach((h, i) => {
      const A = this.povArm[i];
      const on = !!h;
      A.up.visible = A.fo.visible = A.hand.visible = on;
      if (!h) return;
      const el = lerp3(sh[i], h, 0.4);
      setTube(A.up, sh[i], el); setTube(A.fo, el, h); A.hand.position.set(...h);
    });
    this.watch.visible = !!p.L && !!p.watch;
    if (p.L && p.watch) { const w = lerp3(lerp3(sh[1], p.L, 0.4), p.L, 0.75); this.watch.position.set(w[0], w[1] + 0.02, w[2] + 0.055); }
    this.chips.visible = !!p.R && !!p.chips;
    if (p.R && p.chips) { this.chips.position.set(p.R[0] - 0.02, p.R[1] + 0.12, p.R[2] - 0.04); this.chips.rotation.set(0.1, -0.3, 0.12); }
  }
}

export const mouthAt = (who: string, f: number) => {
  const l = LINES.find((x) => x.who === who && f >= x.start && f < x.end);
  return l ? l.mulut[f - l.start] ?? 0 : 0;
};

// ---------------- kamera per shot ----------------
type Cam = { pos: V3; look: V3; fov: number; roll: number };
const shake = (f: number, amp: number, sp = 1): V3 => [amp * (hh(Math.floor(f * sp), 1) - 0.5), amp * (hh(Math.floor(f * sp), 2) - 0.5), amp * (hh(Math.floor(f * sp), 3) - 0.5)];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const breathe = (t: number, k = 1): V3 => [0.012 * k * Math.sin(t * 1.3), 0.018 * k * Math.sin(t * 2.1), 0];

export const camAt = (fIn: number): Cam => {
  const f = Math.min(fIn, FREEZE), t = f / FPS, fov = 104;
  const sc = sceneAt(f);
  const D = DOOR_Z;
  switch (sc) {
    case "kasir": {
      const u = ease(span(f, 0, 110));
      return { pos: add([-4.0, 1.18, -0.3], breathe(t)), look: lerp3([-3.3, 0.85, 1.6], [-0.5, 1.4, 5.0], u), fov, roll: 0.02 };
    }
    case "radio": {
      const a = S0("g02"), u = ease(span(f, a, a + 20));
      return { pos: add(lerp3([-4.0, 1.18, -0.3], [-4.25, 1.22, 0.0], u), breathe(t)), look: lerp3([-1.5, 1.2, 4], [RADIO[0], RADIO[1] + 0.05, RADIO[2]], u), fov, roll: -0.03 };
    }
    case "kanopi": {
      const a = S0("g03"), u = ease(span(f, a, a + 40));
      return { pos: add([-4.0, 1.2, -0.25], breathe(t)), look: lerp3([-2, 2.0, 6], [-1.2, 3.6, 12], u), fov, roll: 0.0 };
    }
    case "gedor": {
      const a = S0("g04"), k = Math.max(0, 1 - (f - a - 4) / 20);
      return { pos: add([-3.9, 1.3, -0.1], shake(f, f >= a + 4 ? 0.12 * k : 0)), look: add([0.15, 1.55, 5.2], shake(f + 7, 0.3 * k)), fov, roll: 0.06 * k * Math.sin(f) };
    }
    case "kaca": {
      const a = S0("g05"), u = ease(span(f, a, L("g05").end));
      return { pos: add(lerp3([-2.6, 1.62, 1.2], [-0.35, 1.62, 3.85], u), add(breathe(t, 2), [0, 0.03 * Math.sin(t * 9), 0])), look: [0.15, 1.72, 5.4], fov, roll: 0.0 };
    }
    case "kunci": {
      const a = S0("g06"), u = ease(span(f, a, a + 15));
      return { pos: add([-0.3, 1.62, 3.95], breathe(t)), look: lerp3([0.15, 1.7, 5.4], [LOCK[0] - 0.1, LOCK[1], LOCK[2]], u), fov, roll: -0.04 };
    }
    case "lengan": {
      const a = S0("g07"), u = ease(span(f, a, a + 18));
      return { pos: add([-0.4, 1.6, 3.85], breathe(t)), look: lerp3([LOCK[0], LOCK[1] + 0.2, 5], [-0.2, 1.15, 5.4], u), fov, roll: 0.0 };
    }
    case "lorong": {
      const a = S0("g08"), u = ease(span(f, a, a + 50));
      const ang = lerp(0, Math.PI, u), cx = -0.4, cz = 3.7;
      return { pos: add([cx, 1.6, cz], breathe(t)), look: [cx + Math.sin(ang) * -0.6 + lerp(0, -0.5, u), lerp(1.3, 1.1, u), cz + Math.cos(ang) * 4], fov, roll: 0 };
    }
    case "toilet": {
      const a = S0("g09"), u = ease(span(f, a, S0("g10")));
      return { pos: add(lerp3([-0.6, 1.6, 2.6], [-0.85, 1.55, -1.6], u), breathe(t, 1.5)), look: [-0.9, 0.6, D], fov, roll: 0.015 * Math.sin(t) };
    }
    case "toilet_dekat": {
      const a = S0("g10"), u = ease(span(f, a, S0("g11")));
      return { pos: add(lerp3([-0.85, 1.55, -2.6], [-0.9, 1.52, -4.6], u), breathe(t, 0.6)), look: [-0.9, lerp(0.6, 1.3, u), D], fov, roll: 0 };
    }
    case "gerombolan": {
      const a = S0("g11"), u = ease(span(f, a, a + 6)), k = Math.max(0, 1 - (f - a) / 12);
      return { pos: add([-0.5, 1.6, 2.2], shake(f, 0.05 * k)), look: lerp3([-0.9, 1.3, -9], [0.0, 1.6, 14], u), fov, roll: 0 };
    }
    case "gagang": {
      const a = S0("g12"), u = ease(span(f, a, a + 6)), z = ease(span(f, a + 10, S0("g13")));
      const punch = f >= a + 14 ? ease(span(f, a + 14, a + 20)) : 0;
      return { pos: add(lerp3(lerp3([-0.7, 1.6, -0.5], [-0.9, 1.62, -7.4], z), [-0.9, 1.62, -7.9], punch), shake(f, 0.015 + 0.03 * punch * Math.max(0, 1 - (f - a - 20) / 20))), look: lerp3([0.0, 1.5, 12], [-0.9, lerp(1.0, 1.6, z), D], u), fov, roll: 0 };
    }
    default: { // mundur
      const a = S0("g13");
      const p = lerp3([-0.9, 1.62, -7.9], [-0.85, 1.6, -4.6], ease(span(f, a, a + 26)));
      const look = f < a + 14 ? lerp3([-0.9, 1.5, D], [0.2, 1.4, 5], ease(span(f, a, a + 8))) : lerp3([0.2, 1.4, 5], [-0.9, 1.2, D], ease(span(f, a + 22, a + 34)));
      return { pos: add(p, shake(f, 0.03)), look, fov, roll: 0.03 * Math.sin(t * 3) };
    }
  }
};

export const sceneAt = (f: number) => {
  let s = LINES[0].scene;
  for (const l of LINES) if (f >= l.start - (l === LINES[0] ? 99 : 0)) s = l.scene;
  return s;
};

// ---------------- tangan POV per shot (ruang kamera: -z ke depan) ----------------
type Pov = { R: V3 | null; L: V3 | null; watch?: boolean; chips?: boolean };
const povAt = (fIn: number, t: number, toLocal: (v: V3) => V3): Pov => {
  const f = Math.min(fIn, FREEZE), sc = sceneAt(f);
  const tr = (k: number): V3 => [0.006 * k * Math.sin(t * 23), 0.006 * k * Math.sin(t * 19 + 1), 0];
  const low = (k = 0): { R: V3; L: V3 } => ({ R: add([0.26, -0.52, -0.56], tr(k)), L: add([-0.26, -0.52, -0.56], tr(k)) });
  const up = (k = 1): { R: V3; L: V3 } => ({ R: add([0.2, -0.26, -0.58], tr(k)), L: add([-0.2, -0.28, -0.58], tr(k)) });
  switch (sc) {
    case "kasir": {
      const u = ease(span(f, 12, 32)) * (1 - ease(span(f, 95, 120)));
      return { R: [0.24, -0.42, -0.58], L: lerp3([-0.3, -0.62, -0.5], [-0.05, -0.12, -0.5], u), watch: true, chips: true };
    }
    case "radio": return { R: [0.24, -0.42, -0.58], L: null, chips: true };
    case "kanopi": return { R: [0.26, -0.48, -0.56], L: null, chips: true };
    case "gedor": { const k = span(f, S0("g04") + 3, S0("g04") + 8); return { R: lerp3([0.26, -0.48, -0.42], [0.2, -0.25, -0.42], k), L: lerp3([-0.3, -0.6, -0.4], [-0.2, -0.27, -0.42], k), chips: false }; }
    case "kaca": return low(0.5);
    case "kunci": {
      const a = S0("g06"), u = ease(span(f, a + 4, a + 22));
      const lk = toLocal([LOCK[0] - 0.04, LOCK[1] - 0.03, LOCK[2] - 0.1]);
      return { R: lerp3([0.26, -0.5, -0.42], lk, u * 0.95), L: low().L };
    }
    case "lengan": {
      const a = S0("g07"), u = 1 - ease(span(f, a, a + 10));
      const lk = toLocal([LOCK[0] - 0.04, LOCK[1] - 0.03, LOCK[2] - 0.1]);
      return { R: lerp3([0.26, -0.5, -0.42], lk, u * 0.95), L: low().L };
    }
    case "lorong": case "toilet": case "toilet_dekat": return { R: low(1).R, L: add([-0.22, -0.4, -0.58], tr(1.5)) };
    case "gerombolan": return low(1);
    default: return up(2);
  }
};
