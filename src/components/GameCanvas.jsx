import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * GameCanvas
 * ----------
 * This is the main Three.js entry point.
 * It creates the renderer, scene, camera, and a simple demo scene.
 * All game logic will later expand from here (or from systems/scenes).
 */
function GameCanvas({ settings, config }) {
  const mountRef = useRef(null);
  const frameIdRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ---------- Renderer ----------
    const antialias = settings?.graphics?.antialias !== false;
    const pixelRatio = Number(settings?.graphics?.pixelRatio) || window.devicePixelRatio || 1;

    const renderer = new THREE.WebGLRenderer({
      antialias,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(pixelRatio, 2)); // Cap for performance
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(config.world?.fogColor || '#0a0a0a');
    renderer.shadowMap.enabled = settings?.graphics?.shadows !== false;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.appendChild(renderer.domElement);

    // ---------- Scene ----------
    const scene = new THREE.Scene();

    // Fog (from gameConfig.json)
    if (config.world) {
      scene.fog = new THREE.Fog(
        config.world.fogColor || '#0a0a0a',
        config.world.fogNear || 10,
        config.world.fogFar || 100
      );
    }

    // ---------- Camera ----------
    const camConfig = config.camera || {};
    const camera = new THREE.PerspectiveCamera(
      camConfig.fov || 75,
      mount.clientWidth / mount.clientHeight,
      camConfig.near || 0.1,
      camConfig.far || 1000
    );
    const [cx, cy, cz] = camConfig.position || [0, 5, 10];
    camera.position.set(cx, cy, cz);
    camera.lookAt(0, 0, 0);

    // ---------- Lights ----------
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);

    // ---------- Demo objects (safe to delete later) ----------
    // Ground
    const groundGeo = new THREE.PlaneGeometry(40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper
    const grid = new THREE.GridHelper(40, 40, 0x333333, 0x222222);
    scene.add(grid);

    // Spinning cube (demo)
    const cubeGeo = new THREE.BoxGeometry(2, 2, 2);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x4fc3f7,
      roughness: 0.4,
      metalness: 0.3,
    });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    cube.position.y = 1.5;
    cube.castShadow = true;
    scene.add(cube);

    // ---------- Resize handler ----------
    const handleResize = () => {
      if (!mount) return;
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // ---------- Animation loop ----------
    const clock = new THREE.Clock();

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Simple demo animation – replace with real game systems later
      cube.rotation.x = elapsed * 0.6;
      cube.rotation.y = elapsed * 0.9;
      cube.position.y = 1.5 + Math.sin(elapsed * 2) * 0.3;

      renderer.render(scene, camera);
    };
    animate();

    // ---------- Cleanup ----------
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('resize', handleResize);

      // Dispose Three.js resources
      groundGeo.dispose();
      groundMat.dispose();
      cubeGeo.dispose();
      cubeMat.dispose();
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
      }}
    />
  );
}

export default GameCanvas;