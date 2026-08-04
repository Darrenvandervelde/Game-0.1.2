/* 
  Importing GameCavas for the scene renderer and the camera to start up the app from the app.jsx file. 
  GameConfig file is storing the player, camera & World Data for the logic to make it more easier to 
  edit the information in the logic with out causing error in the code.
*/

import React, { useEffect, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import gameConfig from './data/gameConfig.json';

/*
  Implementing useStates to store configuration data for the settings 
  and the loading function as well.
*/

function App() {
  const [settings, setSettings] = useState(null); // Initialize settings state as null until data loads /* NO DATA YET INSIDE */
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        /*
          Bridge to connect the Electron backend and load settings.ini into the renderer
        */
        if (window.electronAPI) {
          /*
            Attempt to fetch saved configurations from the main process via IPC

            Reminder what IPC Standards for:
            inter-Process Communication, Infection Prevention and Control.

          */
          const iniSettings = await window.electronAPI.getSettings();
          setSettings(iniSettings);
        } else {
          /*
            This is a fallback in in run this framework outside of the electron application. For example if I ran this server as a web application 
            this will be the for fallback code that would run instead of the electron code setup thats in the electron/main.js file ( function called createWindow).
          */
          setSettings({
            window: { 
              width: 1280, // Screen Width
              height: 720, // Screen Height
              fullscreen: false // FullScreen Turned Off
            },
            graphics: { 
              antialias: true, 
              shadows: true, 
              pixelRatio: 1 
            },
            audio: { 
              masterVolume: 0.8, 
              musicVolume: 0.6, 
              sfxVolume: 0.9, 
              muted: false 
            },
            gameplay: { 
              difficulty: 'normal', 
              showFPS: true, 
              language: 'en' // language of the game.
            },
          });
        }
      } catch (err) {
        /*
          Catch any unexpected errors, log them to the console, and fall back to an empty settings state during initialization.
          **initialization means setting up or preparing something so it is ready to be used.**
        */
        console.error('Failed to load settings:', err);
        setSettings({});
      } finally {
        /*
          Ensure loading state is turned off regardless of success or failure
        */
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  /* 
    This state displays the loading screen while searching for and setting up the settings. 
  */
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

  /* 
    Render the main game view and help overlay once settings have finished loading. 
  */
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <GameCanvas settings={settings} config={gameConfig} />

      {/*
        Simple controls help overlay 
      */}
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
        {/* 
          Instruction for testing the controls for the game. 
        */}
        <div><strong>Click</strong> the screen to capture mouse</div>
        <div><strong>WASD</strong> – Move &nbsp;|&nbsp; <strong>Shift</strong> – Sprint</div>
        <div><strong>Mouse</strong> – Look around</div>
        <div style={{ marginTop: 4, opacity: 0.7 }}>Esc to release mouse</div>
      </div>
    </div>
  );
}

export default App;
