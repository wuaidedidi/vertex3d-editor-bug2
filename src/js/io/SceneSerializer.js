/**
 * SceneSerializer - 场景序列化/反序列化
 * 将场景数据转换为JSON格式，支持保存和加载
 */
const SceneSerializer = (() => {

    function serialize() {
        const objects = SceneManager.getSceneObjects();
        const data = {
            version: '1.0.0',
            generator: 'Vertex3D',
            timestamp: Date.now(),
            objects: objects.map(obj => _serializeObject(obj))
        };
        Logger.info('SceneSerializer', `序列化 ${objects.length} 个对象`);
        return data;
    }

    function _serializeObject(obj) {
        const data = {
            name: obj.name,
            type: obj.userData.type,
            isLight: obj.userData.isLight,
            position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
            rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
            scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
            visible: obj.visible
        };

        if (obj.userData.isLight) {
            data.light = {
                color: obj.color.getHex(),
                intensity: obj.intensity
            };
            if (obj.distance !== undefined) data.light.distance = obj.distance;
            if (obj.angle !== undefined) data.light.angle = obj.angle;
        } else if (obj.material) {
            data.material = {
                color: obj.material.color.getHex(),
                roughness: obj.material.roughness,
                metalness: obj.material.metalness,
                opacity: obj.material.opacity,
                side: obj.material.side,
                flatShading: obj.material.flatShading,
                wireframe: obj.material.wireframe
            };

            if (obj.geometry) {
                const params = obj.geometry.parameters;
                if (params) {
                    data.geometry = { ...params };
                }
            }
        }

        return data;
    }

    function deserialize(data) {
        if (!data || !data.objects) {
            Logger.error('SceneSerializer', '无效的场景数据');
            return false;
        }

        SceneManager.clearScene();
        SelectionManager.deselect();

        let loadedCount = 0;
        data.objects.forEach(objData => {
            try {
                const obj = _deserializeObject(objData);
                if (obj) {
                    SceneManager.addObject(obj);
                    loadedCount++;
                }
            } catch (err) {
                Logger.error('SceneSerializer', `反序列化对象失败: ${err.message}`);
            }
        });

        Logger.info('SceneSerializer', `加载了 ${loadedCount} 个对象`);
        return true;
    }

    function _deserializeObject(data) {
        let obj;

        const typeMap = {
            'Box': 'cube',
            'Sphere': 'sphere',
            'Cylinder': 'cylinder',
            'Cone': 'cone',
            'Torus': 'torus',
            'Plane': 'plane',
            'PointLight': 'pointlight',
            'SpotLight': 'spotlight'
        };

        const factoryType = typeMap[data.type];
        if (!factoryType) {
            Logger.warn('SceneSerializer', `未知类型: ${data.type}`);
            return null;
        }

        const options = { name: data.name };

        if (data.material) {
            options.color = data.material.color;
        }
        if (data.light) {
            options.color = data.light.color;
            options.intensity = data.light.intensity;
            if (data.light.distance) options.distance = data.light.distance;
            if (data.light.angle) options.angle = data.light.angle;
        }
        if (data.geometry) {
            Object.assign(options, data.geometry);
        }

        obj = ObjectFactory.create(factoryType, options);
        if (!obj) return null;

        obj.position.set(data.position.x, data.position.y, data.position.z);
        obj.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        obj.scale.set(data.scale.x, data.scale.y, data.scale.z);
        obj.visible = data.visible !== false;

        if (!data.isLight && obj.material && data.material) {
            obj.material.roughness = data.material.roughness;
            obj.material.metalness = data.material.metalness;
            obj.material.opacity = data.material.opacity;
            obj.material.transparent = data.material.opacity < 1;
            obj.material.side = data.material.side;
            obj.material.flatShading = data.material.flatShading || false;
            obj.material.wireframe = data.material.wireframe || false;
            if (data.material.flatShading) obj.material.needsUpdate = true;
        }

        return obj;
    }

    return { serialize, deserialize };
})();
