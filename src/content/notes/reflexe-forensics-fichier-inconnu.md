---
title: Reflex — Forensics — unknown file
date: 2026-08-26T00:00:00.000Z
summary: >-
  Handed a file with no explanation: the fixed order of checks that identifies
  it and surfaces what is hidden inside.
tags:
  - reflexe
  - forensics
  - forensics
draft: false
featured: false
source: CTF/03-Reflexes/Reflexe-Forensics-Fichier-Inconnu.md
topic: forensics
kind: reflex
---
# Reflex — I'm handed a file, figure it out

## ⚡ The ritual, in order, every time
```bash
file mystere            # 1. what is it REALLY (not the extension)
strings -n 8 mystere | less   # 2. any readable text? flags, urls, creds
strings -e l mystere    #    little-endian strings (Windows/UTF-16)
binwalk mystere         # 3. any HIDDEN files inside?
binwalk -e mystere      #    ...and extract them
exiftool mystere        # 4. metadata: GPS, author, comments
xxd mystere | head      # 5. magic bytes by hand (extension lying?)
```

## Magic bytes to know by heart
| Leading hex | Type | Note |
|---|---|---|
| `89 50 4E 47` | PNG | `IEND` marks the end — data after it = suspicious |
| `FF D8 FF` | JPEG | |
| `50 4B 03 04` | ZIP / docx / jar / apk | a .png starting with PK = zip in disguise |
| `52 61 72 21` | RAR | |
| `7F 45 4C 46` | ELF | Linux binary → pwn/rev category |
| `4D 5A` | Windows EXE | |
| `1F 8B` | gzip | |
| `25 50 44 46` | PDF | |

## By file type
| File | Tools |
|---|---|
| **image** | `zsteg` (PNG/BMP), `steghide extract` (JPG, try empty passphrase), stegsolve, check LSB |
| **audio** | Audacity → **spectrogram** (the flag is often drawn in it), `sonic-visualiser` |
| **pcap** | Wireshark: `File > Export Objects`, `Follow TCP Stream`, filter `http`, `tshark` |
| **memory (.raw/.vmem)** | `volatility3 -f dump windows.info` then `pslist`, `cmdline`, `filescan` |
| **disk** | `autopsy`, `testdisk`, `photorec` to recover deleted files |
| **protected zip** | `zip2john file.zip > h && john h` |
| **PDF** | `pdfdetach`, `pdf-parser`, `qpdf --decrypt` |

## 🚧 What blocks you
- `steghide` asks for a password → try **empty first**, then words found in the
  prompt/strings, then rockyou.
- `binwalk` finds a zip but extracts nothing → manual `dd` at the given offset.
- The flag is **split in two** across two layers — search for `flag{` AND `}` separately.

## ✅ I've won when
`strings extracted | grep -i flag` spits out the flag, or the spectrogram shows it.

## 🔗 Used in
-
