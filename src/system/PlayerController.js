import * as THREE from 'three';

/**
 * PlayerController
 * ----------------
 * Handles:
 *  - Player mesh creation
 *  - WASD movement (camera-relative)
 *  - Sprint (Shift)
 *  - Third-person camera follow + mouse look
 *
 * This is a plain class (not React) so it can be used inside the
 * Three.js animation loop without React re-render issues.
 */
export class PlayerController {
  constructor(scene, camera, config) {
    this.scene = scene;
    this.camera = camera;
    this.config = config;

    // ---- Player config from JSON ----
    const p = config.player || {};
    this.moveSpeed = p.moveSpeed ?? 8;
    this.sprintMultiplier = p.sprintMultiplier ?? 1.6;
    this.playerHeight = p.height ?? 1.8;
    this.playerRadius = p.radius ?? 0.4;

    // ---- Camera config from JSON ----
    const c = config.camera || {};
    this.followDistance = c.followDistance ?? 6;
    this.followHeight = c.followHeight ?? 2.5;
    this.lookAtHeight = c.lookAtHeight ?? 1.4;
    this.mouseSensitivity = c.mouseSensitivity ?? 0.002;

    // ---- Internal state ----
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.spherical = new THREE.Spherical(); // for mouse orbit
    this.spherical.radius = this.followDistance;
    this.spherical.phi = Math.PI / 2.5;   // vertical angle
    this.spherical.theta = 0;             // horizontal angle

    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
    };

    this.isPointerLocked = false;

    // Create the visual player
    this.mesh = this._createPlayerMesh();
    this.scene.add(this.mesh);

    // Bind methods so they keep correct `this` when used as event listeners
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);
  }

  // --------------------------------------------------
  // Public API
  // --------------------------------------------------

  /** Call once after creating the controller to enable input */
  enable() {
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);

    // Click the canvas to lock the mouse (standard FPS/TPS behaviour)
    // We attach this on the renderer.domElement later from GameCanvas
  }

  /** Call on cleanup */
  disable() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);

    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  /** Request pointer lock (call this from a click handler) */
  requestPointerLock(domElement) {
    if (domElement && !this.isPointerLocked) {
      domElement.requestPointerLock();
    }
  }

  /**
   * Main update – call every frame
   * @param {number} delta  seconds since last frame
   */
  update(delta) {
    this._updateMovement(delta);
    this._updateCamera();
  }

  // --------------------------------------------------
  // Private helpers
  // --------------------------------------------------

  _createPlayerMesh() {
    // Simple capsule-like shape using a cylinder + two spheres
    // (Three.js r152+ has CapsuleGeometry, but we stay compatible)
    const group = new THREE.Group();

    const bodyGeo = new THREE.CylinderGeometry(
      this.playerRadius,
      this.playerRadius,
      this.playerHeight - this.playerRadius * 2,
      16
    );
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x4fc3f7,
      roughness: 0.4,
      metalness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = this.playerHeight / 2;
    body.castShadow = true;
    group.add(body);

    // Head (just a sphere on top so it looks more like a character)
    const headGeo = new THREE.SphereGeometry(this.playerRadius * 0.85, 16, 12);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = this.playerHeight - this.playerRadius * 0.3;
    head.castShadow = true;
    group.add(head);

    // Small "nose" so you can see which way the player is facing
    const noseGeo = new THREE.BoxGeometry(0.15, 0.15, 0.3);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xff9800 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, this.playerHeight - 0.3, this.playerRadius * 0.9);
    group.add(nose);

    group.position.set(0, 0, 0);
    return group;
  }

  _onKeyDown(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = true;
        break;
    }
  }

  _onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = false;
        break;
    }
  }

  _onMouseMove(e) {
    if (!this.isPointerLocked) return;

    // Horizontal rotation (left/right)
    this.spherical.theta -= e.movementX * this.mouseSensitivity;

    // Vertical rotation (up/down) – clamped so we don't flip upside down
    this.spherical.phi -= e.movementY * this.mouseSensitivity;
    this.spherical.phi = Math.max(0.2, Math.min(Math.PI / 1.6, this.spherical.phi));
  }

  _onPointerLockChange() {
    this.isPointerLocked = document.pointerLockElement !== null;
  }

  _updateMovement(delta) {
    // Build direction vector from keys
    this.direction.set(0, 0, 0);

    if (this.keys.forward) this.direction.z -= 1;
    if (this.keys.backward) this.direction.z += 1;
    if (this.keys.left) this.direction.x -= 1;
    if (this.keys.right) this.direction.x += 1;

    if (this.direction.lengthSq() > 0) {
      this.direction.normalize();

      // Make movement relative to the camera's yaw (so W goes where you look)
      const cameraYaw = this.spherical.theta;
      const sin = Math.sin(cameraYaw);
      const cos = Math.cos(cameraYaw);

      const moveX = this.direction.x * cos + this.direction.z * sin;
      const moveZ = this.direction.z * cos - this.direction.x * sin;

      const speed = this.keys.sprint
        ? this.moveSpeed * this.sprintMultiplier
        : this.moveSpeed;

      this.mesh.position.x += moveX * speed * delta;
      this.mesh.position.z += moveZ * speed * delta;

      // Rotate the player mesh so it faces the movement direction
      // (or face camera direction – here we face movement for better feel)
      if (moveX !== 0 || moveZ !== 0) {
        const targetAngle = Math.atan2(moveX, moveZ);
        // Smooth rotation
        const currentAngle = this.mesh.rotation.y;
        let diff = targetAngle - currentAngle;
        // Normalize angle difference to [-PI, PI]
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.mesh.rotation.y += diff * Math.min(1, 10 * delta);
      }
    }
  }

  _updateCamera() {
    // Convert spherical coords → cartesian offset from player
    const offset = new THREE.Vector3().setFromSpherical(this.spherical);

    // Desired camera position = player position + offset
    const targetPos = new THREE.Vector3(
      this.mesh.position.x + offset.x,
      this.mesh.position.y + this.followHeight + offset.y * 0.3, // slight vertical influence
      this.mesh.position.z + offset.z
    );

    // Smooth follow (lerp)
    this.camera.position.lerp(targetPos, 0.15);

    // Always look at a point slightly above the player's feet
    const lookAt = new THREE.Vector3(
      this.mesh.position.x,
      this.mesh.position.y + this.lookAtHeight,
      this.mesh.position.z
    );
    this.camera.lookAt(lookAt);
  }
}
