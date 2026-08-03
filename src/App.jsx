import React, { useEffect, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import gameConfig from './data/gameConfig.json';

function App() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        // Try to load from Electron (works in Electron)
        if (window.electronAPI) {
          const iniSettings = await window.electronAPI.getSettings();
          setSettings(iniSettings);
        } else {
          // Fallback for browser-only (vite dev without Electron)
          setSettings({
            window: { width: 1280, height: 720, fullscreen: false },
            graphics: { antialias: true, shadows: true, pixelRatio: 1 },
            audio: { masterVolume: 0.8, musicVolume: 0.6, sfxVolume: 0.9, muted: false },
            gameplay: { difficulty: 'normal', showFPS: true, language: 'en' },
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        setSettings({});
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        background: '#0a0a0a',
        color: '#aaa',
        fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <GameCanvas settings={settings} config={gameConfig} />

      {/* Simple controls help overlay */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'rgba(0,0,0,0.65)',
        color: '#ccc',
        padding: '10px 14px',
        borderRadius: 8,
        fontSize: 13,
        lineHeight: 1.5,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        <div><strong>Click</strong> the screen to capture mouse</div>
        <div><strong>WASD</strong> – Move &nbsp;|&nbsp; <strong>Shift</strong> – Sprint</div>
        <div><strong>Mouse</strong> – Look around</div>
        <div style={{ marginTop: 4, opacity: 0.7 }}>Esc to release mouse</div>
      </div>
    </div>
  );
}

export default App;
