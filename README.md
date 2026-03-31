# Password Generator — Chrome Extension (Go)

A Chrome extension for generating secure passwords, functionally inspired by LastPass Password Generator. The core logic is written in **Go** (compiled to WebAssembly), with a minimal popup UI.

---

## Architecture Overview

```
passwordgenExtensionChrome/
│
├── cmd/
│   └── wasm/
│       └── main.go          # Go entry point — compiled to .wasm
│
├── internal/
│   └── generator/
│       └── generator.go     # Core password generation logic
│
├── extension/
│   ├── manifest.json        # Chrome Extension Manifest v3
│   ├── popup.html           # Extension popup UI
│   ├── popup.js             # Loads WASM, wires UI events
│   ├── popup.css            # Minimal styles
│   ├── wasm_exec.js         # Go WASM runtime bridge (from Go SDK)
│   └── main.wasm            # Compiled Go binary (output artifact)
│
├── Makefile                 # Build commands
└── README.md
```

---

## How It Works

```
 ┌─────────────────────────────────┐
 │         Chrome Browser          │
 │                                 │
 │  ┌───────────────────────────┐  │
 │  │      Extension Popup      │  │
 │  │  ┌─────────────────────┐  │  │
 │  │  │   popup.html / .css  │  │  │
 │  │  │   (Minimal UI)       │  │  │
 │  │  └────────┬────────────┘  │  │
 │  │           │ JS calls       │  │
 │  │  ┌────────▼────────────┐  │  │
 │  │  │     popup.js        │  │  │
 │  │  │  (WASM loader +     │  │  │
 │  │  │   UI event wiring)  │  │  │
 │  │  └────────┬────────────┘  │  │
 │  │           │ calls Go funcs │  │
 │  │  ┌────────▼────────────┐  │  │
 │  │  │    main.wasm        │  │  │
 │  │  │  (Go → WebAssembly) │  │  │
 │  │  │                     │  │  │
 │  │  │  generator.go:      │  │  │
 │  │  │  - GeneratePassword │  │  │
 │  │  │  - ScoreStrength    │  │  │
 │  │  └─────────────────────┘  │  │
 │  └───────────────────────────┘  │
 └─────────────────────────────────┘
```

---

## Core Features (Functional Spec)

| Feature | Description |
|---|---|
| Password length | Slider, range 4–64 characters |
| Uppercase letters | Toggle (A–Z) |
| Lowercase letters | Toggle (a–z) |
| Numbers | Toggle (0–9) |
| Symbols | Toggle (!@#$%^&* etc.) |
| Exclude ambiguous | Toggle (removes `0`, `O`, `l`, `1`, `I`) |
| Password strength meter | Visual bar: Weak / Fair / Strong / Very Strong |
| One-click copy | Copies generated password to clipboard |
| Regenerate | Generates a new password with current settings |

---

## UI Mockup (Pseudo-graphic)

```
┌────────────────────────────────────┐
│  🔐  Password Generator            │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────┐  [Copy]  │
│  │  xK9#mL2$vQ!rT5@nW   │         │
│  └──────────────────────┘         │
│                                    │
│  Strength: [====░░░] Strong        │
│                                    │
│  Length:  [────●──────────]  16    │
│                                    │
│  [x] Uppercase    [x] Lowercase    │
│  [x] Numbers      [x] Symbols      │
│  [ ] Exclude ambiguous chars       │
│                                    │
│           [↻ Generate]             │
└────────────────────────────────────┘
```

---

## Go → WASM Build

Go exposes generation functions to JavaScript via `js/syscall` bindings:

```go
// cmd/wasm/main.go
js.Global().Set("generatePassword", js.FuncOf(generatePassword))
js.Global().Set("scoreStrength",    js.FuncOf(scoreStrength))
```

**Build command:**
```bash
GOOS=js GOARCH=wasm go build -o extension/main.wasm ./cmd/wasm/
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" extension/
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Core logic | Go (compiled to WebAssembly) |
| Extension shell | Chrome Manifest v3 |
| UI | HTML + CSS (no frameworks) |
| JS ↔ Go bridge | `syscall/js` + `wasm_exec.js` |
| Build | `Makefile` + standard Go toolchain |

---

## File Responsibilities

### `internal/generator/generator.go`
- `GeneratePassword(length int, opts Options) string` — pure Go, crypto/rand
- `ScoreStrength(password string) int` — entropy-based scoring (0–4)

### `cmd/wasm/main.go`
- Registers Go functions into the JS global scope
- Keeps the WASM module alive via `select {}`

### `extension/popup.js`
- Instantiates the WASM module on popup open
- Reads UI state (toggles, slider) → calls `window.generatePassword()`
- Renders result and strength bar
- Handles clipboard copy via `navigator.clipboard.writeText()`

### `extension/manifest.json`
- Manifest v3
- `action.default_popup: "popup.html"`
- Permissions: `clipboardWrite`

---

## Development Setup

```bash
# 1. Clone repo
git clone <repo-url>
cd passwordgenExtensionChrome

# 2. Build WASM
make build

# 3. Load in Chrome
#    chrome://extensions → Enable Developer Mode → Load Unpacked → select /extension
```

---

## Out of Scope (v1)

- Password history / storage
- Auto-fill into web forms
- Firefox / Safari support
- Cloud sync
