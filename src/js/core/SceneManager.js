/**
 * SceneManager - 3D场景核心管理器
 * 负责Three.js场景、相机、渲染器、灯光、网格的初始化和管理
 */
const SceneManager = (() => {
  let scene, camera, renderer, orbitControls, transformControls;
  let gridHelper, axisHelper;
  let canvas;
  let animationId;
  let isPerspective = true;
  let isWireframe = false;
  let isGridVisible = true;
  let snapEnabled = false;
  let frameCount = 0;
  let lastFpsTime = performance.now();
  let currentFps = 60;

  const sceneObjects = [];
  const GRID_SIZE = 20;
  const GRID_DIVISIONS = 20;

  function init(canvasElement) {
    canvas = canvasElement;
    Logger.info("SceneManager", "初始化3D场景");

    _initRenderer();
    _initScene();
    _initCamera();
    _initLights();
    _initGrid();
    _initControls();
    _initTransformControls();

    window.addEventListener("resize", _onResize);
    _onResize();
    _animate();

    Logger.info("SceneManager", "场景初始化完成");
  }

  function _initRenderer() {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.outputEncoding = THREE.LinearEncoding;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0x2a2a3e, 1);
  }

  function _initScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x2a2a3e, 0.015);
  }

  function _initCamera() {
    const container = canvas.parentElement;
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    camera.position.set(8, 6, 8);
    camera.lookAt(0, 0, 0);
  }

  function _initLights() {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x223344, 0x6688cc, 0.4);
    scene.add(hemiLight);
  }

  function _initGrid() {
    gridHelper = new THREE.GridHelper(GRID_SIZE, GRID_DIVISIONS, 0x4a4a6a, 0x3a3a5a);
    gridHelper.material.opacity = 0.6;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    axisHelper = new THREE.AxesHelper(0.1);
    scene.add(axisHelper);
  }

  function _initControls() {
    orbitControls = new THREE.OrbitControls(camera, canvas);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.08;
    orbitControls.screenSpacePanning = true;
    orbitControls.minDistance = 0.1;
    orbitControls.maxDistance = 500;
    orbitControls.maxPolarAngle = Math.PI * 0.95;
    orbitControls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.PAN,
    };
  }

  function _initTransformControls() {
    transformControls = new THREE.TransformControls(camera, canvas);
    transformControls.setSize(0.8);
    scene.add(transformControls);

    transformControls.addEventListener("dragging-changed", (event) => {
      orbitControls.enabled = !event.value;
      if (!event.value) {
        EventBus.emit("transform:end");
      } else {
        EventBus.emit("transform:start");
      }
    });

    transformControls.addEventListener("change", () => {
      EventBus.emit("transform:change");
    });

    transformControls.addEventListener("objectChange", () => {
      EventBus.emit("object:transformed");
    });
  }

  function _animate() {
    animationId = requestAnimationFrame(_animate);
    orbitControls.update();
    renderer.render(scene, camera);

    frameCount++;
    const now = performance.now();
    if (now - lastFpsTime >= 1000) {
      currentFps = Math.round((frameCount * 1000) / (now - lastFpsTime));
      frameCount = 0;
      lastFpsTime = now;
      const fpsEl = document.getElementById("viewport-fps");
      if (fpsEl) fpsEl.textContent = currentFps + " FPS";
    }
  }

  function _onResize() {
    const container = canvas.parentElement;
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;

    if (camera.isPerspectiveCamera) {
      camera.aspect = w / h;
    } else {
      const frustumSize = 10;
      camera.left = (-frustumSize * (w / h)) / 2;
      camera.right = (frustumSize * (w / h)) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
    }
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function addObject(mesh) {
    scene.add(mesh);
    sceneObjects.push(mesh);
    EventBus.emit("scene:objectAdded", mesh);
    _updateObjectCount();
    Logger.info("SceneManager", `添加对象: ${mesh.name}`);
  }

  function removeObject(mesh) {
    if (transformControls.object === mesh) {
      transformControls.detach();
    }
    scene.remove(mesh);
    const idx = sceneObjects.indexOf(mesh);
    if (idx !== -1) sceneObjects.splice(idx, 1);

    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }

    EventBus.emit("scene:objectRemoved", mesh);
    _updateObjectCount();
    Logger.info("SceneManager", `移除对象: ${mesh.name}`);
  }

  function clearScene() {
    const toRemove = [...sceneObjects];
    toRemove.forEach((obj) => removeObject(obj));
    Logger.info("SceneManager", "场景已清空");
  }

  function attachTransformControls(object) {
    if (object) {
      transformControls.attach(object);
    } else {
      transformControls.detach();
    }
  }

  function setTransformMode(mode) {
    if (["translate", "rotate", "scale"].includes(mode)) {
      transformControls.setMode(mode);
      Logger.debug("SceneManager", `变换模式: ${mode}`);
    }
  }

  function toggleProjection() {
    const container = canvas.parentElement;
    const aspect = container.clientWidth / container.clientHeight;
    const pos = camera.position.clone();
    const target = orbitControls.target.clone();

    if (isPerspective) {
      const frustumSize = 10;
      camera = new THREE.OrthographicCamera(
        (-frustumSize * aspect) / 2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.1,
        1000,
      );
      camera.position.copy(pos);
      camera.lookAt(target);
    } else {
      camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
      camera.position.copy(pos);
      camera.lookAt(target);
    }

    isPerspective = !isPerspective;
    orbitControls.object = camera;
    transformControls.camera = camera;
    orbitControls.update();

    const modeEl = document.getElementById("viewport-mode");
    if (modeEl) modeEl.textContent = isPerspective ? "透视视图" : "正交视图";

    EventBus.emit("view:projectionChanged", isPerspective);
    Logger.info("SceneManager", `切换到${isPerspective ? "透视" : "正交"}视图`);
  }

  function setViewAngle(direction) {
    const distance = camera.position.distanceTo(orbitControls.target);
    const target = orbitControls.target.clone();
    let newPos;

    switch (direction) {
      case "front":
        newPos = new THREE.Vector3(0, 0, distance);
        break;
      case "back":
        newPos = new THREE.Vector3(0, 0, -distance);
        break;
      case "right":
        newPos = new THREE.Vector3(distance, 0, 0);
        break;
      case "left":
        newPos = new THREE.Vector3(-distance, 0, 0);
        break;
      case "top":
        newPos = new THREE.Vector3(0, distance, 0.001);
        break;
      case "bottom":
        newPos = new THREE.Vector3(0, -distance, 0.001);
        break;
      default:
        return;
    }

    newPos.add(target);
    _animateCamera(newPos, target);
    Logger.info("SceneManager", `切换到${direction}视图`);
  }

  function focusSelected(object) {
    if (!object) return;
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2.5;

    const direction = camera.position.clone().sub(orbitControls.target).normalize();
    const newPos = center.clone().add(direction.multiplyScalar(distance));

    _animateCamera(newPos, center);
  }

  function _animateCamera(targetPos, targetLookAt) {
    const startPos = camera.position.clone();
    const startTarget = orbitControls.target.clone();
    const duration = 400;
    const startTime = performance.now();

    function update() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = Math.pow(t, 10);

      camera.position.lerpVectors(startPos, targetPos, ease);
      orbitControls.target.lerpVectors(startTarget, targetLookAt, ease);
      orbitControls.update();

      if (t < 1) requestAnimationFrame(update);
    }
    update();
  }

  function toggleWireframe() {
    isWireframe = !isWireframe;
    sceneObjects.forEach((obj) => {
      if (obj.material && !obj.userData.isLight) {
        obj.material.wireframe = isWireframe;
      }
    });
    EventBus.emit("view:wireframeChanged", isWireframe);
    return isWireframe;
  }

  function toggleGrid() {
    isGridVisible = !isGridVisible;
    gridHelper.visible = isGridVisible;
    axisHelper.visible = isGridVisible;
    EventBus.emit("view:gridChanged", isGridVisible);
    return isGridVisible;
  }

  function toggleSnap() {
    snapEnabled = !snapEnabled;
    if (snapEnabled) {
      transformControls.setTranslationSnap(0.5);
      transformControls.setRotationSnap(THREE.MathUtils.degToRad(90));
      transformControls.setScaleSnap(0.1);
    } else {
      transformControls.setTranslationSnap(null);
      transformControls.setRotationSnap(null);
      transformControls.setScaleSnap(null);
    }
    EventBus.emit("view:snapChanged", snapEnabled);
    return snapEnabled;
  }

  function _updateObjectCount() {
    const el = document.getElementById("viewport-objects-count");
    if (el) el.textContent = `对象: ${sceneObjects.length}`;
  }

  function getScene() {
    return scene;
  }
  function getCamera() {
    return camera;
  }
  function getRenderer() {
    return renderer;
  }
  function getOrbitControls() {
    return orbitControls;
  }
  function getTransformControls() {
    return transformControls;
  }
  function getSceneObjects() {
    return sceneObjects;
  }
  function getCanvas() {
    return canvas;
  }
  function isSnapEnabled() {
    return snapEnabled;
  }
  function getIsPerspective() {
    return isPerspective;
  }
  function getIsWireframe() {
    return isWireframe;
  }

  function dispose() {
    cancelAnimationFrame(animationId);
    window.removeEventListener("resize", _onResize);
    clearScene();
    orbitControls.dispose();
    transformControls.dispose();
    renderer.dispose();
    Logger.info("SceneManager", "场景已销毁");
  }

  return {
    init,
    dispose,
    addObject,
    removeObject,
    clearScene,
    attachTransformControls,
    setTransformMode,
    toggleProjection,
    setViewAngle,
    focusSelected,
    toggleWireframe,
    toggleGrid,
    toggleSnap,
    getScene,
    getCamera,
    getRenderer,
    getOrbitControls,
    getTransformControls,
    getSceneObjects,
    getCanvas,
    isSnapEnabled,
    getIsPerspective,
    getIsWireframe,
  };
})();
