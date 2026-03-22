/**
 * ObjectFactory - 3D对象工厂
 * 负责创建各种基础几何体和光源
 */
const ObjectFactory = (() => {
    let objectCounter = 0;

    const DEFAULT_MATERIAL_PARAMS = {
        color: 0x6688cc,
        roughness: 0.5,
        metalness: 0.1
    };

    function _createMaterial(params = {}) {
        return new THREE.MeshStandardMaterial({
            ...DEFAULT_MATERIAL_PARAMS,
            ...params
        });
    }

    function _setupMesh(mesh, name) {
        objectCounter++;
        mesh.name = name || `Object_${objectCounter}`;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = {
            id: 'obj_' + Date.now() + '_' + objectCounter,
            type: mesh.geometry ? mesh.geometry.type.replace('BufferGeometry', '').replace('Geometry', '') : 'Unknown',
            isLight: false,
            createdAt: Date.now()
        };
        return mesh;
    }

    function createCube(options = {}) {
        const { width = 1, height = 1, depth = 1, color } = options;
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = _createMaterial(color ? { color } : {});
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, height / 2, 0);
        return _setupMesh(mesh, options.name || `立方体_${objectCounter + 1}`);
    }

    function createSphere(options = {}) {
        const { radius = 0.6, widthSegments = 32, heightSegments = 24, color } = options;
        const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
        const material = _createMaterial(color ? { color } : { color: 0x66aacc });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, radius, 0);
        return _setupMesh(mesh, options.name || `球体_${objectCounter + 1}`);
    }

    function createCylinder(options = {}) {
        const { radiusTop = 0.5, radiusBottom = 0.5, height = 1.5, segments = 32, color } = options;
        const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
        const material = _createMaterial(color ? { color } : { color: 0xcc8866 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(2, height / 2, 0);
        return _setupMesh(mesh, options.name || `圆柱体_${objectCounter + 1}`);
    }

    function createCone(options = {}) {
        const { radius = 0.6, height = 1.5, segments = 32, color } = options;
        const geometry = new THREE.ConeGeometry(radius, height, segments);
        const material = _createMaterial(color ? { color } : { color: 0xaacc66 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, height / 2, 0);
        return _setupMesh(mesh, options.name || `圆锥体_${objectCounter + 1}`);
    }

    function createTorus(options = {}) {
        const { radius = 0.6, tube = 0.2, radialSegments = 16, tubularSegments = 48, color } = options;
        const geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
        const material = _createMaterial(color ? { color } : { color: 0xcc66aa });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, radius + tube, 0);
        return _setupMesh(mesh, options.name || `圆环体_${objectCounter + 1}`);
    }

    function createPlane(options = {}) {
        const { width = 2, height = 2, color } = options;
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = _createMaterial(color ? { color } : { color: 0x888899 });
        material.side = THREE.DoubleSide;
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(0, 0.01, 0);
        mesh.receiveShadow = true;
        return _setupMesh(mesh, options.name || `平面_${objectCounter + 1}`);
    }

    function createPointLight(options = {}) {
        const { color = 0xffffff, intensity = 1, distance = 20 } = options;
        const light = new THREE.PointLight(color, intensity, distance);
        light.position.set(0, 3, 0);
        light.castShadow = true;

        const helper = new THREE.PointLightHelper(light, 0.3);
        light.add(helper);

        objectCounter++;
        light.name = options.name || `点光源_${objectCounter}`;
        light.userData = {
            id: 'obj_' + Date.now() + '_' + objectCounter,
            type: 'PointLight',
            isLight: true,
            createdAt: Date.now()
        };

        return light;
    }

    function createSpotLight(options = {}) {
        const { color = 0xffffff, intensity = 1, distance = 20, angle = Math.PI / 6 } = options;
        const light = new THREE.SpotLight(color, intensity, distance, angle);
        light.position.set(0, 5, 0);
        light.castShadow = true;

        const helper = new THREE.SpotLightHelper(light);
        light.add(helper);

        objectCounter++;
        light.name = options.name || `聚光灯_${objectCounter}`;
        light.userData = {
            id: 'obj_' + Date.now() + '_' + objectCounter,
            type: 'SpotLight',
            isLight: true,
            createdAt: Date.now()
        };

        return light;
    }

    function duplicateObject(source) {
        if (!source) return null;

        let clone;
        if (source.userData.isLight) {
            if (source.isPointLight) {
                clone = createPointLight({
                    color: source.color.getHex(),
                    intensity: source.intensity,
                    distance: source.distance
                });
            } else if (source.isSpotLight) {
                clone = createSpotLight({
                    color: source.color.getHex(),
                    intensity: source.intensity,
                    distance: source.distance,
                    angle: source.angle
                });
            }
        } else {
            clone = source.clone();
            clone.material = source.material.clone();
            objectCounter++;
            clone.name = source.name + '_副本';
            clone.userData = {
                ...source.userData,
                id: 'obj_' + Date.now() + '_' + objectCounter,
                createdAt: Date.now()
            };
        }

        if (clone) {
            clone.position.copy(source.position);
            clone.position.x += 1.5;
        }

        return clone;
    }

    const CREATORS = {
        cube: createCube,
        sphere: createSphere,
        cylinder: createCylinder,
        cone: createCone,
        torus: createTorus,
        plane: createPlane,
        pointlight: createPointLight,
        spotlight: createSpotLight
    };

    function create(type, options = {}) {
        const creator = CREATORS[type];
        if (!creator) {
            Logger.warn('ObjectFactory', `未知对象类型: ${type}`);
            return null;
        }
        return creator(options);
    }

    return {
        create, duplicateObject,
        createCube, createSphere, createCylinder,
        createCone, createTorus, createPlane,
        createPointLight, createSpotLight
    };
})();
