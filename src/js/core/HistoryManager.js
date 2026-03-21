/**
 * HistoryManager - 撤销/重做管理器
 * 记录操作历史，支持撤销和重做
 */
const HistoryManager = (() => {
    const undoStack = [];
    const redoStack = [];
    const MAX_HISTORY = 50;

    function push(action) {
        if (undoStack.length >= MAX_HISTORY) {
            undoStack.shift();
        }
        undoStack.push(action);
        redoStack.length = 0;
        EventBus.emit('history:changed', { canUndo: canUndo(), canRedo: canRedo() });
        Logger.debug('HistoryManager', `记录操作: ${action.type}`);
    }

    function undo() {
        if (undoStack.length === 0) {
            Toast.info('没有可撤销的操作');
            return;
        }

        const action = undoStack.pop();
        redoStack.push(action);

        try {
            switch (action.type) {
                case 'add':
                    SelectionManager.deselect();
                    SceneManager.removeObject(action.object);
                    break;
                case 'delete':
                    SceneManager.addObject(action.object);
                    break;
                case 'transform':
                    action.object.position.copy(action.oldPosition);
                    action.object.rotation.copy(action.oldRotation);
                    action.object.scale.copy(action.oldScale);
                    EventBus.emit('object:transformed');
                    break;
                case 'material':
                    if (action.object.material) {
                        action.object.material.color.setHex(action.oldColor);
                        action.object.material.roughness = action.oldRoughness;
                        action.object.material.metalness = action.oldMetalness;
                        action.object.material.opacity = action.oldOpacity;
                        action.object.material.transparent = action.oldOpacity < 1;
                    }
                    break;
            }
        } catch (err) {
            Logger.error('HistoryManager', `撤销失败: ${err.message}`);
        }

        EventBus.emit('history:changed', { canUndo: canUndo(), canRedo: canRedo() });
        Toast.info('已撤销');
    }

    function redo() {
        if (redoStack.length === 0) {
            Toast.info('没有可重做的操作');
            return;
        }

        const action = redoStack.pop();
        undoStack.push(action);

        try {
            switch (action.type) {
                case 'add':
                    SceneManager.addObject(action.object);
                    break;
                case 'delete':
                    SelectionManager.deselect();
                    SceneManager.removeObject(action.object);
                    break;
                case 'transform':
                    action.object.position.copy(action.newPosition);
                    action.object.rotation.copy(action.newRotation);
                    action.object.scale.copy(action.newScale);
                    EventBus.emit('object:transformed');
                    break;
                case 'material':
                    if (action.object.material) {
                        action.object.material.color.setHex(action.newColor);
                        action.object.material.roughness = action.newRoughness;
                        action.object.material.metalness = action.newMetalness;
                        action.object.material.opacity = action.newOpacity;
                        action.object.material.transparent = action.newOpacity < 1;
                    }
                    break;
            }
        } catch (err) {
            Logger.error('HistoryManager', `重做失败: ${err.message}`);
        }

        EventBus.emit('history:changed', { canUndo: canUndo(), canRedo: canRedo() });
        Toast.info('已重做');
    }

    function canUndo() { return undoStack.length > 0; }
    function canRedo() { return redoStack.length > 0; }

    function clear() {
        undoStack.length = 0;
        redoStack.length = 0;
        EventBus.emit('history:changed', { canUndo: false, canRedo: false });
    }

    return { push, undo, redo, canUndo, canRedo, clear };
})();
