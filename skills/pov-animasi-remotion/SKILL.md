---
name: pov-animasi-remotion
description: Membuat Shorts/Reels/TikTok animasi horor 3D sudut pandang orang pertama (POV fisheye, garis tinta, tangan pemain terlihat, dialog emosional VoxCPM2) yang diakhiri kartu pilihan "What would you do?", dirender dengan three.js di Remotion. Pakai saat user meminta animasi POV, horor fisheye, serial pilihan A/B, episode lanjutan Last Gas Station, atau video "seperti pom bensin".
---

# Animasi POV fisheye (Remotion + three.js + VoxCPM2)

Hasil: video 1080x1920, 30 fps, sekitar 45 detik, -14 LUFS. Contoh lengkap: *Last Gas Station Part 1* (`contoh/gas1`, `remotion/src/videos/gas1`).
Buat cerita, tokoh, dan monster orisinal; video acuan hanya untuk format, jangan disalin adegannya.

## Isi
| Path | Fungsi |
|---|---|
| `remotion/` | proyek Remotion siap pakai: `src/videos/gas1/` (`dunia.ts` dunia+tokoh+kamera+tangan, `Film.tsx` lapisan 2D, `fisheye.ts`, `ink.ts`), `src/entries/`, `scripts/stills.mjs` |
| `suara/` | `vox_ep.py` (dialog), `cek_vo.py` (pengecekan), `buat_timeline.py`, `mix.py` |
| `contoh/gas1/` | naskah JSON, isyarat efek suara, rancangan cerita |

## Pasang (sekali)
- Node 20+, ffmpeg dengan filter rubberband, Google Chrome. `cd remotion && npm install`.
- Python 3.11, venv suara: `pip install voxcpm soundfile numpy`. Pengecekan (boleh venv lain): `pip install faster-whisper librosa`.
- `CHROME_PATH` bila Chrome tidak di lokasi bawaan; `REMOTION_TMP` untuk folder sementara.

## Alur kerja
1. **Naskah** `naskah/epN.json` (salin `contoh/gas1/gas1.json`). Hook kejutan di 1,5 detik pertama (`awal: 1.5`), dialog pendek, satu ketegangan yang naik, akhir menggantung, lalu baris pilihan 6 detik. Kedua pilihan harus sama-sama berisiko.
2. **Tata adegan dulu** dengan timeline perkiraan: `python suara/buat_timeline.py naskah/epN.json - epN`.
3. **Suara**: `python suara/vox_ep.py naskah/epN.json vox_epN` (CPU: sekitar 1–3 menit per baris, jalankan di latar belakang), lalu `python suara/cek_vo.py naskah/epN.json vox_epN`. Semua kata harus terucap. Kirim contoh audio ke user **sebelum** render.
4. **Timeline final**: `python suara/buat_timeline.py naskah/epN.json vox_epN epN`, salin `epN/timeline.json` ke `remotion/src/videos/epN/`.
5. **Visual**: salin `src/videos/gas1` menjadi `epN` dan buat `src/entries/<Id>.tsx`. Semua gerak murni fungsi frame dan diikat ke baris lewat `S0("id")`, jadi tetap pas kalau suara berubah.
6. **Cek stills** di awal, tengah, dan akhir setiap shot: `node scripts/stills.mjs <Id> out/s 15,80,... 0.5`. Baca gambarnya sendiri dengan daftar periksa di bawah. Shot dengan gerakan cepat dicek tiap 3–5 frame.
7. **Mix**: `python suara/mix.py epN epN/sfx.py --lufs -14`.
8. **Render**: `npx remotion render src/entries/<Id>.tsx <Id> out/v.mp4 --gl=angle --concurrency=4 --crf=18`, lalu `ffmpeg -i out/v.mp4 -i epN/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k out/final.mp4`. Cek durasi, jumlah frame, LUFS, dan lembar kontak video jadi.

## Daftar periksa: tidak ada aset menembus
- Tangan tokoh di kaca: hitung jangkauan. Lengan sepanjang ±0,73 m dengan `rotation.x = θ` menjangkau `-sin(θ)·0,73` ke depan. Tambah jari-jari tangan 0,08 m.
- Saat menggedor, gerakkan badan sedikit, jangan ayunkan lengan ke depan.
- Sosok di balik jendela pintu: pintu harus benar-benar berlubang (4 potong), sosoknya di belakang daun pintu.
- Pintu yang berayun tidak boleh masuk ke kotak padat. Ruang gelap dibuat berongga (dinding tipis), bukan satu kotak hitam.
- Gerombolan: beri jalur x tetap yang tidak melewati pompa/tiang, beri batas `zmin` per baris supaya berhenti di depan kaca.
- Tangan POV: lepas dari benda sebelum benda itu bergeser; jaga ±0,6 m antara kamera dan dinding/rak.
- Wajah/ikon 2D juga dipotong rapi (clipPath), termasuk di foto profil.

## Resep ketegangan
Cold open wajah monster + kilat; lampu berkedip lalu padam; kamera menyentak maju (6 frame) saat kejutan; detak jantung dan vinyet merah yang makin cepat; tokoh yang tadi ada tiba-tiba hilang; suara pemain ditirukan dari tempat yang salah.

## Pelajaran suara
- VoxCPM2: rancang suara dasar tiap tokoh sekali, lalu kloning per baris dengan arahan emosi berbahasa Inggris. Ini yang disetujui.
- Kokoro ditolak karena datar. Memotong per kalimat, menggeser nada, vibrato, dan bitcrusher membuat suara putus-putus dan aneh.
- Baris kurang pas: ganti `seed`/`arah` baris itu, hapus klipnya, jalankan lagi.

## Bentuk tokoh
Kepala bulat, leher kecil, badan kotak setinggi satu kepala, lengan/kaki tabung, tangan bulat, sepatu pipih, ±4,4 kepala, lengan baju pendek yang langsung ke kulit. Bedakan tokoh lewat baju, warna, dan aksesori.
