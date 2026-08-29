---
title: Reflex — Recon — an open port
date: 2026-08-26T00:00:00.000Z
summary: >-
  nmap has finished and the ports are listed. What to actually do with each one,
  in priority order.
tags:
  - reflexe
  - recon
draft: false
featured: false
source: CTF/03-Reflexes/Reflexe-Recon-Port-Ouvert.md
topic: network
kind: reflex
---
# Reflex — nmap is done, now what?

## 🔍 When
You have an IP and a list of ports. This is the moment where 90% of the time is won or lost.

## ⚡ The first 3 things

1. **Kick off a full scan in the background** while you work on the fast one:
   `nmap -p- -T4 --min-rate 2000 <ip> -oN nmap/all-ports.txt`
   The port that unlocks everything is very often above 10000.
2. **`-sC -sV` on the found ports**, never on `-p-` directly (too slow).
3. **The weirdest port first.** 22 and 80 are rarely the way in. 8080, 3306,
   6379, 2049, 5985 are.

## 🧰 Commands

```bash
mkdir -p nmap loot exploits && cd nmap        # discipline: always the same tree
nmap -sC -sV -oN initial.txt <ip>
nmap -p- -T4 --min-rate 2000 -oN all.txt <ip>
nmap -sU --top-ports 20 -oN udp.txt <ip>       # UDP: SNMP(161) and TFTP(69) are gifts
```

## 🗺 Decision table by port

| Port | Service | First move |
|---|---|---|
| 21 | FTP | login `anonymous:anonymous` — works more often than you'd think |
| 22 | SSH | note the version, but look for creds elsewhere first |
| 25/110/143 | SMTP/POP/IMAP | `VRFY` to enumerate users |
| 53 | DNS | `dig axfr @<ip> <domain>` — zone transfer |
| 80/443 | HTTP(S) | `whatweb`, page source, `/robots.txt`, then gobuster |
| 111/2049 | NFS | `showmount -e <ip>` → mount the share |
| 139/445 | SMB | `smbclient -L //<ip>/ -N` then `enum4linux-ng` |
| 161 | SNMP | `snmpwalk -v2c -c public <ip>` — default `public` community |
| 1433/3306/5432 | MSSQL/MySQL/Postgres | default creds, then creds found elsewhere |
| 3389 | RDP | note it, it's an end-of-chain target |
| 5985/5986 | WinRM | `evil-winrm` as soon as you have a user/pass pair |
| 6379 | Redis | `redis-cli -h <ip>` unauthenticated = frequent RCE |
| 8080/8000/8888 | HTTP alt | often Tomcat/Jenkins → default creds |
| 27017 | MongoDB | often no auth |

## 🚧 What blocks you
- You spend 40 min on port 80 while the `-p-` found an 8983 (Solr) 5 min after the
  start. **Always look at the full scan when it finishes.**
- A filtered service ≠ closed. `filtered` = a firewall → there's something behind it.

## ✅ I've won when
You have a written hypothesis: *"the way in is probably port X, because Y"*.

## 🔗 Used in
-
