# Isyarat efek suara LAST GAS STATION Part 1 (dipakai mix.py). Semua rekaman CC0 (Lots of Sounds).
place("fs-119910", 0, -30, dur=TOTAL, loop=True, fin=0.5, fout=2.0, bus=bus_amb)                         # dengung lampu neon toko
place("fs-141139", t0("g02"), -31, dur=t0("g14") - t0("g02"), loop=True, fin=3, fout=0.5, bus=bus_amb)   # dengung seram
place("fs-534424", t0("g01") - 0.2, -24, dur=2.2, fin=0.05, fout=0.4)                                                # kresek keripik
place("fs-17804", t0("g02") - 0.3, -27, dur=t1("g02") - t0("g02") + 0.3, fin=0.1, fout=0.05)            # statis radio
place("fs-33684", t1("g02") - 0.1, -22, dur=0.5, fin=0.01, fout=0.1)                                     # radio mati (klik putar)
place("fs-232447", t0("g03") - 0.2, -24, dur=1.5, fin=0.05, fout=0.4)                                    # lampu kanopi berkedip padam
place("fs-444701", t0("g04"), -11, dur=2.4, fin=0.01, fout=0.4)                                          # gedoran kaca BAM BAM BAM
place("fs-271945", t0("g04") + 0.12, -15)                                                                # stinger saat gedor
place("fs-473558", t0("g05", 0.6), -20, dur=1.6, fin=0.02, fout=0.4)                                     # gedoran pelan saat memohon
place("fs-422852", t0("g06", 0.4), -16)                                                                  # tangan di kunci
place("fs-485323", t0("g08"), -15, dur=t0("g10") - t0("g08") - 0.4, loop=True, fin=0.3, fout=0.3)        # garukan di pintu toilet
place("fs-21409", t0("g09"), -21, dur=t0("g14") - t0("g09"), loop=True, fin=1.5, fout=0.2)              # detak jantung
place("fs-814048", t1("g10") - 0.2, -18, dur=3.0, fin=0.05, fout=1.0)                                    # sesudah peniru bicara
place("fs-336391", t0("g11"), -13, dur=2.4, fin=0.01, fout=0.4)                                          # gedoran lagi
place("fs-393749", t0("g11"), -21, dur=t0("g14") - t0("g11"), offset=3, fin=0.4, fout=0.2)              # erangan zombie mendekat
place("fs-448393", t0("g12") + 0.2, -12, dur=1.2)                                                        # gagang pintu CLICK
place("fs-513330", t0("g12") + 0.3, -14, dur=3.5, fin=0.02, fout=0.8)                                    # stinger wajah
place("fs-112557", t0("g12") + 0.6, -20, dur=t0("g14") - t0("g12"), fin=0.3, fout=0.2)                   # napas ketakutan
place("fs-351407", t0("g13"), -18, dur=1.5)                                                              # engsel pintu toilet
place("fs-473558", t0("g14"), -14)                                                                      # beku -> kartu pilihan
place("fs-141139", t0("g14") + 0.1, -24, dur=TOTAL - t0("g14"), fin=0.3, fout=0.4, st=-3)                # dengung pelan di kartu
place("fs-513330", 0.0, -12, dur=1.4, fin=0.01, fout=0.3)                                                # cold open: wajah di jendela
place("fs-473558", 1.15, -15)                                                                           # potong ke judul
