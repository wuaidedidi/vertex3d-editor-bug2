/**
 * SelectionManager - 对象选择管理器
 * 处理鼠标拾取、选择状态、多选等
 */
const SelectionManager = (() => {
    let selectedObject = null;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isEnabled = true;

    function init() {
        const canvas = SceneManager.getCanvas();
        canvas.addEventListener('pointerdown', _onPointerDown);
        Logger.info('SelectionManager', '选择管理器初始化完成');
    }

    function _onPointerDown(event) {
        if (!isEnabled) return;
        if (event.button !== 0) return;

        const tc = SceneManager.getTransformControls();
        if (tc.dragging) return;

        const canvas = SceneManager.getCanvas();
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, SceneManager.getCamera());
        const objects = SceneManager.getSceneObjects();
        const intersects = raycaster.intersectObjects(objects, true);

        if (intersects.length > 0) {
            let target = intersects[0].object;
            while (target.parent && !objects.includes(target)) {
                target = target.parent;
            }
            if (objects.includes(target)) {
                select(target);
            }
        } else {
            deselect();
        }
    }

    function select(object) {
        if (!object) return;
        if (selectedObject === object) return;

        if (selectedObject) {
            _removeHighlight(selectedObject);
        }

        selectedObject = object;
        _addHighlight(object);
        SceneManager.attachTransformControls(object);

        EventBus.emit('selection:changed', object);
        Logger.debug('SelectionManager', `选中: ${object.name}`);
    }

    function deselect() {
        if (selectedObject) {
            _removeHighlight(selectedObject);
            selectedObject = null;
            SceneManager.attachTransformControls(null);
            EventBus.emit('selection:changed', null);
            Logger.debug('SelectionManager', '取消选择');
        }
    }

    function selectAll() {
        const objects = SceneManager.getSceneObjects();
        if (objects.length > 0) {
            select(objects[objects.length - 1]);
            Toast.info(`场景中共 ${objects.length} 个对象`);
        }
    }

    function _addHighlight(object) {
        if (object.material && !object.userData.isLight) {
            object.userData._originalEmissive = object.material.emissive ? object.material.emissive.getHex() : 0;
            if (object.material.emissive) {
                object.material.emissive.setHex(0xff6600);
            }
        }
    }

    function _removeHighlight(object) {
        if (object.material && !object.userData.isLight && object.material.emissive) {
            object.material.emissive.setHex(object.userData._originalEmissive || 0);
        }
    }

    function getSelected() {
        return selectedObject;
    }

    function setEnabled(enabled) {
        isEnabled = enabled;
    }

    function deleteSelected() {
        if (!selectedObject) {
            Toast.info('请先选择要删除的对象');
            return;
        }
        const name = selectedObject.name;
        SceneManager.removeObject(selectedObject);
        selectedObject = null;
        EventBus.emit('selection:changed', null);
        Toast.success(`已删除: ${name}`);
    }

    function duplicateSelected() {
        if (!selectedObject) {
            Toast.info('请先选择要复制的对象');
            return;
        }
        const clone = ObjectFactory.duplicateObject(selectedObject);
        if (clone) {
            SceneManager.addObject(clone);
            select(clone);
            Toast.success(`已复制: ${clone.name}`);
            HistoryManager.push({
                type: 'add',
                object: clone
            });
        }
    }

    return {
        init, select, deselect, selectAll,
        getSelected, setEnabled,
        deleteSelected, duplicateSelected
    };
})();
