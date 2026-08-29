---
title: Reflex — Crypto — first moves
date: 2026-08-26T00:00:00.000Z
summary: >-
  An unreadable blob and no context: how to identify the encoding or cipher and
  pick the first three things to try.
tags:
  - reflexe
  - crypto
  - crypto
draft: false
featured: false
source: CTF/03-Reflexes/Reflexe-Crypto-Premiers-Gestes.md
topic: crypto
kind: reflex
---
# Reflex — an unreadable blob, no context

## 🔍 When
You're handed a weird string and nothing else. Before crying "hard crypto", check that
it isn't just **encoding** (90% of beginners lose an hour here).

## ⚡ Battle order: encoding BEFORE encryption
1. **Identify**: only `A-Za-z0-9+/=` ending in `=` → base64. Only `0-9a-f` → hex.
   Only shifted letters → Caesar/ROT.
2. **Decode in cascade**: base64 → hex → … You often stack 3 layers.
3. **Only then**, consider real encryption.

## 🧰 Recognize at a glance
| Looks like | It's | Decode with |
|---|---|---|
| `SGVsbG8=` (ends with `=`) | base64 | `base64 -d` |
| `48656c6c6f` (0-9a-f) | hex | `xxd -r -p` |
| `Uryyb` (shifted text) | ROT13/Caesar | `tr` or brute the 25 |
| `.... . .-..` | Morse | dcode.fr |
| `01001000` | binary | groups of 8 bits |
| `%48%65` | URL encode | `urllib.parse.unquote` |
| numbers > 26, separated | decimal ASCII | `chr()` |
| `KBJA...` ends with `=`, alpha only | base32 | `base32 -d` |

## Real encryption
| Clue | Lead |
|---|---|
| `n`, `e`, `c` given | **RSA** → factordb, or e=3 cube root, or small n → factor it |
| reused key, XOR | **XOR** → if key length known, or crib-drag |
| "AES", an IV, ECB | **ECB** → identical blocks = identical text (ECB penguin) |
| a 5x5 grid | Playfair / Polybius |
| Vigenère announced | find the key length (Kasiski) → dcode |

## 🧰 Tools that do 80% of the work
```bash
# CyberChef "Magic" (magic wand) — auto multi-layer detection. Always start with this.
# https://gchq.github.io/CyberChef/

python3 -c "import base64;print(base64.b64decode('...'))"
echo -n "..." | xxd -r -p
# RSA:
python3 -c "from Crypto.Util.number import long_to_bytes; print(long_to_bytes(...))"
# factordb.com for n ; RsaCtfTool for the weak cases
```

## 🚧 What blocks you
- You attack RSA by hand when `n` has been on **factordb.com** since 2015. Check that
  first.
- The "unreadable" result after base64 might be gzip/zlib → `zlib.decompress`.

## ✅ I've won when
The `flag{}` shows up. Often after 2-3 decodings, no maths.

## 🔗 See also
- Course: S1/02-Cryptographie
- Used in:
