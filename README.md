# pov-animasi-remotion

Skill Claude Code untuk membuat Shorts horor 3D sudut pandang orang pertama: lensa fisheye, garis tinta, dialog emosional VoxCPM2, dan kartu pilihan "What would you do?". Visual dirender dengan three.js di dalam Remotion.

## Pasang

```bash
git clone https://github.com/Julianarwansah/pov-animasi-remotion.git
cp -r pov-animasi-remotion/skills/pov-animasi-remotion ~/.claude/skills/
```

Lalu minta di Claude Code, misalnya: "buat animasi POV horor baru". Cara kerja lengkap ada di [SKILL.md](skills/pov-animasi-remotion/SKILL.md).

## Coba contohnya

```bash
cd skills/pov-animasi-remotion/remotion
npm install
npm run studio
```

## Lisensi pihak ketiga

- `ink.ts` dan `scripts/stills.mjs` berasal dari proyek cartoon-3d-short (MIT), lihat [LICENSE-cartoon-3d-short.txt](LICENSE-cartoon-3d-short.txt).
- Font Fredoka: SIL Open Font License, lihat `remotion/public/fonts/OFL-Fredoka.txt`.
- Efek suara tidak disertakan; `mix.py` mengunduhnya dari Lots of Sounds. Periksa lisensi tiap suara.
- Remotion punya lisensi sendiri; perusahaan tertentu perlu lisensi berbayar.
