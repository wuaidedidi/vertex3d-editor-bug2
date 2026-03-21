/**
 * TransformManager - 变换操作管理器
 * 处理移动、旋转、缩放的交互逻辑
 */
const TransformManager = (() => {
    let currentMode = 'translate';

    function init() {
        _bindModeButtons();
        _bindKeyboard();
        setMode('translate');
        Logger.info('TransformManager', '变换管理器初始化完成');
    }

    function _bindModeButtons() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                if (mode) setMode(mode);
            });
        });
    }

    function _bindKeyboard() {
        // Keyboard bindings are handled in App.js
    }

    function setMode(mode) {
        if (!['translate', 'rotate', 'scale'].includes(mode)) return;
        currentMode = mode;
        SceneManager.setTransformMode(mode);

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        const labels = { translate: '移动', rotate: '旋转', scale: '缩放' };
        const statusEl = document.getElementById('status-text');
        if (statusEl) statusEl.textContent = labels[mode] + '模式';

        EventBus.emit('transform:modeChanged', mode);
    }

    function getMode() {
        return currentMode;
    }

    return { init, setMode, getMode };
})();
