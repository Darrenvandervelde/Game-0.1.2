import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { PlayerController } from '../systems/PlayerController';

/**
 * GameCanvas
 * ----------
 * Main Three.js entry point.
 * Creates renderer, scene, lights, ground, and the player controller.
 */
function GameCanvas({ settings, config }) {
  const mountRef = useRef(null);
  const frameIdRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ==================================================
    // 1. RENDERER
    // ==================================================
    const antialias = settings?.graphics?.antialias !== false;
    const pixelRatio = Number(settings?.graphics?.pixelRatio) || window.devicePixelRatio || 1;

    const renderer = new THREE.WebGLRenderer({
      antialias,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(pixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(config.world?.fogColor || '#0a0a0a');
    renderer.shadowMap.enabled = settings?.graphics?.shadows !== false;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.appendChild(renderer.domElement);

    // ==================================================
    // 2. SCENE + FOG
    // ==================================================
    const scene = new THREE.Scene();

    if (config.world) {
      scene.fog = new THREE.Fog(
        config.world.fogColor || '#0a0a0a',
        config.world.fogNear || 10,
        config.world.fogFar || 100
      );
    }

    // ==================================================
    // 3. CAMERA
    // ==================================================
    const camConfig = config.camera || {};
    const camera = new THREE.PerspectiveCamera(
      camConfig.fov || 75,
      mount.clientWidth / mount.clientHeight,
      camConfig.near || 0.1,
      camConfig.far || 1000
    );
    // Starting position will be controlled by PlayerController

    // ==================================================
    // 4. LIGHTS
    // ==================================================
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

    // ==================================================
    // 5. GROUND
    // ==================================================
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

    // Grid for visual reference
    const grid = new THREE.GridHelper(groundSize, groundSize / 2, 0x333333, 0x222222);
    scene.add(grid);

    // ==================================================
    // 6. PLAYER CONTROLLER
    // ==================================================
    const player = new PlayerController(scene, camera, config);
    player.enable();

    // Click anywhere on the canvas to lock the mouse (for looking around)
    const onCanvasClick = () => {
      player.requestPointerLock(renderer.domElement);
    };
    renderer.domElement.addEventListener('click', onCanvasClick);

    // ==================================================
    // 7. RESIZE
    // ==================================================
    const handleResize = () => {
      if (!mount) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // ==================================================
    // 8. ANIMATION LOOP
    // ==================================================
    const clock = new THREE.Clock();

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();

      // Update player movement + camera follow
      player.update(delta);

      renderer.render(scene, camera);
    };
    animate();

    // ==================================================
    // 9. CLEANUP
    // ==================================================
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', onCanvasClick);

      player.disable();

      // Dispose geometries / materials
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
        cursor: 'pointer', // shows the user they can click
      }}
      title="Click to capture mouse – WASD to move, mouse to look, Shift to sprint"
    />
  );
}

export default GameCanvas;
