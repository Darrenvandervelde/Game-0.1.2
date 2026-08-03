# My Three.js Game – Basic Template

Clean starting point for a **Three.js** game using:

- **React + Vite**
- **Electron** (desktop)
- **Three.js**
- **JSON** for all game data
- **`.ini`** for settings

---

## Quick Start

```bash
cd my-threejs-game
npm install
```

### Run in browser (Vite only)
```bash
npm run dev
```
Open http://localhost:5173

### Run as Electron desktop app
```bash
npm run electron:dev
```

### Build production desktop app
```bash
npm run electron:build
```

---

## Project Structure

```
my-threejs-game/
├── electron/
│   ├── main.js          # Electron main process + settings IPC
│   └── preload.js       # Safe bridge to renderer
├── public/
├── src/
│   ├── components/      # React components (GameCanvas lives here)
│   ├── scenes/          # Future game scenes
│   ├── systems/         # Future systems (input, physics, audio…)
│   ├── data/            # All JSON data (gameConfig.json etc.)
│   ├── settings/
│   │   └── settings.ini # Editable settings
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## How Settings Work

- File: `src/settings/settings.ini`
- Loaded at startup via Electron IPC (`window.electronAPI.getSettings()`)
- You can also write settings back with `window.electronAPI.setSettings(obj)`

In pure browser mode (without Electron) a default object is used instead.

---

## How Data Works

All game data lives in `src/data/` as JSON files.  
Example: `gameConfig.json` is imported directly and passed into the canvas.

---

## Next Steps

1. Replace the demo cube with your own models / systems.
2. Add input handling, player controller, physics, etc.
3. Create new scenes in `src/scenes/`.
4. Put reusable logic in `src/systems/`.
5. Keep adding JSON files under `src/data/` for levels, items, enemies…
