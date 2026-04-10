# embed.html — Embedding Guide

`embed.html` is a self-contained, single-file version of the password generator. All CSS and JavaScript are inlined — no external dependencies, no build step required. It works as a standalone web page, as an `<iframe>` inside any existing site, or served from any static host.

---

## File overview

| File | Purpose |
|---|---|
| `extension/embed.html` | Single-file embeddable version (this guide) |
| `extension/popup.html` | Chrome extension popup (requires separate CSS/JS files) |

`embed.html` differs from `popup.html` in the following ways:

- All assets inlined — no external `popup.css`, `wordlist.js`, `i18n.js`, or `popup.js`
- Fluid layout — `max-width: 360px` on the container instead of a fixed `320px` body width
- Clipboard fallback — uses `document.execCommand('copy')` on plain HTTP when `navigator.clipboard` is unavailable
- Safe `localStorage` access — all calls are wrapped in `try/catch` so the page does not throw inside sandboxed iframes

---

## Usage options

### 1. Standalone web page

Drop `embed.html` into any static host and open it directly in a browser. No server configuration is needed for the JS-only mode. If you want WASM acceleration, see the WASM section below.

```
https://yoursite.com/embed.html
```

### 2. iframe embed

Place this snippet wherever you want the generator to appear. Adjust `width` and `height` to fit your layout.

```html
<iframe
  src="embed.html"
  width="380"
  height="520"
  style="border: none; border-radius: 12px; overflow: hidden;"
  title="Password Generator"
></iframe>
```

The container adapts to the iframe width. A width of 320–400 px gives the best result.

### 3. GitHub Pages / Netlify / Vercel

Upload the `extension/` folder (or just `embed.html`) to any static host. No build step, no server-side code, no framework.

---

## WASM acceleration (optional)

The JS fallback generators are cryptographically sound and active by default. WASM provides faster execution for long passwords and large batches, but it is entirely optional.

To enable WASM:

1. Build the WASM binary (requires Go):

   ```bash
   GOOS=js GOARCH=wasm go build -o extension/main.wasm ./cmd/wasm/
   cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" extension/
   ```

2. Place `main.wasm` and `wasm_exec.js` in the same directory as `embed.html`.

3. Serve the directory from a web server that sends the correct MIME type for `.wasm` files (`application/wasm`). Most servers do this automatically. Python's built-in `http.server` does not — use a proper server or add a MIME override.

If WASM fails to load for any reason (wrong MIME type, missing file, network error), the page silently falls back to the JS generators. Nothing breaks.

---

## Clipboard behavior

| Context | Method used |
|---|---|
| HTTPS or `localhost` | `navigator.clipboard.writeText()` |
| Plain HTTP | `document.execCommand('copy')` via a temporary off-screen `<textarea>` |

Both paths show the same "Copied!" feedback. If both fail silently, the password is still visible in the input field and can be copied manually.

---

## localStorage and sandboxed iframes

Language preference (`pgLang`) is persisted via `localStorage`. In iframes with a restrictive `sandbox` attribute (e.g. `sandbox="allow-scripts"` without `allow-same-origin`), storage access throws. All calls are wrapped in `try/catch` so the page continues to work — it just defaults to English on every load.

To preserve language preference across reloads inside an iframe, the iframe must include `allow-same-origin` in its `sandbox` attribute:

```html
<iframe src="embed.html" sandbox="allow-scripts allow-same-origin" ...></iframe>
```

---

## Integrity check caveat

The cryptographic integrity badge verifies that `crypto.getRandomValues` has not been overridden and runs a chi-square uniformity test on 2560 random bytes. This check is informational — it does not block generation.

Some browser developer tools or extensions may cause a false warning on the `[native code]` inspection. This is a known limitation of the check and does not affect the security of generated passwords.

---

## Serving with Python (development only)

Python's `http.server` does not set the correct MIME type for `.wasm` files, so WASM will not load. Use this wrapper for local development:

```python
# serve.py
import http.server, socketserver

class Handler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        if path.endswith('.wasm'):
            return 'application/wasm'
        return super().guess_type(path)

with socketserver.TCPServer(('', 8080), Handler) as httpd:
    httpd.serve_forever()
```

```bash
python serve.py
# open http://localhost:8080/embed.html
```

The JS fallback works fine with the default `python -m http.server` — only WASM requires the MIME fix.

---

## Security notes

- All randomness comes from `crypto.getRandomValues`, which is the browser's native cryptographic RNG.
- No passwords are sent over the network. Generation is entirely client-side.
- No analytics, no external scripts, no CDN dependencies.
- The integrity badge is a best-effort check, not a security guarantee.
