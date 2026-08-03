import * as THREE from 'three';

export class PlayerController {
  constructor(scene, camera, config = {}) {
    this.scene = scene;
    this.camera = camera;
    this.config = config;

    this.enabled = false;
    this._pointerLocked = false;

    // Simple internal state for a placeholder controller
    this._velocity = new THREE.Vector3();
    this._direction = new THREE.Vector3();

    // Bindings
    this._onPointerLockChange = this._onPointerLockChange.bind(this);
    this._onPointerLockError = this._onPointerLockError.bind(this);

    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('pointerlockchange', this._onPointerLockChange);
      document.addEventListener('pointerlockerror', this._onPointerLockError);
    }
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  requestPointerLock(element) {
    if (!element) return;
    if (element.requestPointerLock) {
      element.requestPointerLock();
    } else if (element.mozRequestPointerLock) {
      element.mozRequestPointerLock();
    }
  }

  _onPointerLockChange() {
    this._pointerLocked = !!(
      document.pointerLockElement ||
      document.mozPointerLockElement ||
      document.webkitPointerLockElement
    );
  }

  _onPointerLockError() {
    this._pointerLocked = false;
    // swallow errors for the stub
  }

  update(delta) {
    if (!this.enabled) return;

    // Placeholder behavior: keep the camera at a follow distance above the origin
    const camCfg = (this.config && this.config.camera) || {};
    const fd = Number(camCfg.followDistance) || 6;
    const fh = Number(camCfg.followHeight) || 2.5;
    const lookAtH = Number(camCfg.lookAtHeight) || 1.4;

    // Simple, smooth follow towards the desired position
    const desiredPos = new THREE.Vector3(0, fh, fd);
    this.camera.position.lerp(desiredPos, Math.min(1, delta * 3));
    this.camera.lookAt(new THREE.Vector3(0, lookAtH, 0));
  }

  dispose() {
    if (typeof document !== 'undefined' && document.removeEventListener) {
      document.removeEventListener('pointerlockchange', this._onPointerLockChange);
      document.removeEventListener('pointerlockerror', this._onPointerLockError);
    }
  }
}
