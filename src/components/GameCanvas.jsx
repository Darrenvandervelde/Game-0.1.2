/*
  Import
  Imported the playercontroller that contains the class constructor for the player.
*/
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { PlayerController } from '../system/PlayerController';

/*
  GameCanvas
  Main Three.js entry point.
  Creates renderer, scene, lights, ground, and the player controller.
*/
function GameCanvas({ settings, config }) {
  const mountRef = useRef(null);
  const frameIdRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    /*
      Enable antialiasing unless explicitly disabled in settings (smoother edges)
    */
    const antialias = settings?.graphics?.antialias !== false;

    /*
      Use configured pixel ratio, or fall back to devicePixelRatio, defaulting to 1.
      Will be capped at 2 later to avoid excessive GPU load on high-DPI displays.
    */
    const pixelRatio = Number(settings?.graphics?.pixelRatio) || window.devicePixelRatio || 1;

    /*
      Create the WebGL renderer
    */
    const renderer = new THREE.WebGLRenderer({
      antialias, /* MSAA for smoother edges (performance cost) */
      alpha: false, /* Opaque canvas (no transparency) */
      powerPreference: 'high-performance', /* Prefer discrete GPU when available */
    });

    /*
      Limit pixel ratio to 2x max for performance (especially on retina / high-DPI screens)
    */
    renderer.setPixelRatio(Math.min(pixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(config.world?.fogColor || '#0a0a0a');
    renderer.shadowMap.enabled = settings?.graphics?.shadows !== false;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    /*
      2. SCENE + FOG
      Create the main scene and optional fog from config
    */
    const scene = new THREE.Scene();
    if (config.world) {
      scene.fog = new THREE.Fog(
        config.world.fogColor || '#0a0a0a',
        config.world.fogNear || 10,
        config.world.fogFar || 100
      );
    }

    /*
      3. CAMERA
      Perspective camera with FOV / near / far taken from config (with sensible defaults)
    */
    const camConfig = config.camera || {};
    const camera = new THREE.PerspectiveCamera(
      camConfig.fov || 75,
      mount.clientWidth / mount.clientHeight,
      camConfig.near || 0.1,
      camConfig.far || 1000
    );
    /* Starting position will be controlled by PlayerController */

    /*
      4. LIGHTS
      Soft ambient fill + directional key light with soft shadows
    */
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(12, 18, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    scene.add(dirLight);

    /*
      5. GROUND
      Large dark plane that receives shadows + a subtle grid for orientation
    */
    const groundSize = 80;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    /* Grid for visual reference */
    const grid = new THREE.GridHelper(groundSize, groundSize / 2, 0x333333, 0x222222);
    scene.add(grid);

    /*
      6. PLAYER CONTROLLER
      Instantiates the player, enables input, and locks pointer on click
    */
    const player = new PlayerController(scene, camera, config);
    player.enable();

    /* Click anywhere on the canvas to lock the mouse (for looking around) */
    const onCanvasClick = () => {
      player.requestPointerLock(renderer.domElement);
    };
    renderer.domElement.addEventListener('click', onCanvasClick);

    /*
      7. RESIZE
      Keep camera aspect ratio and renderer size in sync with the container
    */
    const handleResize = () => {
      if (!mount) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    /*
      8. ANIMATION LOOP
      Continuous render loop driven by requestAnimationFrame.
      Updates player movement / camera follow each frame.
    */
    const clock = new THREE.Clock();
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      /* Update player movement + camera follow */
      player.update(delta);

      renderer.render(scene, camera);
    };
    animate();

    /*
      9. CLEANUP
      Cancel animation, remove listeners, dispose GPU resources, and detach canvas
    */
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', onCanvasClick);
      player.disable();

      /* Dispose geometries / materials */
      groundGeo.dispose();
      groundMat.dispose();
      renderer.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [settings, config]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: 'pointer', /* shows the user they can click */
      }}
      title="Click to capture mouse – WASD to move, mouse to look, Shift to sprint"
    />
  );
}

export default GameCanvas;
