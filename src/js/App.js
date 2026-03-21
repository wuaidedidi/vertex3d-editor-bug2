/**
 * App - 应用主入口
 * 初始化所有模块，绑定全局事件和快捷键
 */
const App = (() => {
    let transformStartState = null;

    function init() {
        Logger.info('App', 'Vertex 3D 启动中...');

        try {
            _checkWebGL();
            SceneManager.init(document.getElementById('viewport-canvas'));
            SelectionManager.init();
            TransformManager.init();
            OutlinerPanel.init();
            PropertiesPanel.init();
            MaterialPanel.init();
            DropdownMenu.init();

            _bindMenuEvents();
            _bindToolbarEvents();
            _bindViewportToolbar();
            _bindKeyboard();
            _bindContextMenu();
            _bindTransformHistory();
            _bindNavCube();

            _addDefaultScene();

            Logger.info('App', 'Vertex 3D 启动完成');
            Toast.success('Vertex 3D 已就绪');
        } catch (err) {
            Logger.error('App', '启动失败: ' + err.message);
            Toast.error('启动失败: ' + err.message);
        }
    }

    function _checkWebGL() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (!gl) {
            throw new Error('您的浏览器不支持 WebGL，无法运行 3D 建模工具');
        }
        const rendererInfo = document.getElementById('status-renderer');
        if (rendererInfo) {
            rendererInfo.textContent = gl instanceof WebGL2RenderingContext ? 'WebGL 2.0' : 'WebGL 1.0';
        }
    }

    function _addDefaultScene() {
        const cube = ObjectFactory.createCube({ name: '默认立方体' });
        SceneManager.addObject(cube);
        HistoryManager.clear();
    }

    function _bindMenuEvents() {
        EventBus.on('scene:new', async () => {
            const confirmed = await Modal.confirm({
                title: '新建场景',
                message: '当前场景将被清空，未保存的更改将丢失。确定要新建场景吗？',
                confirmLabel: '新建',
                danger: true
            });
            if (confirmed) ExportManager.newScene();
        });

        EventBus.on('scene:open', () => ExportManager.loadScene());
        EventBus.on('scene:save', () => ExportManager.saveScene());
        EventBus.on('scene:saveAs', () => ExportManager.saveScene());
        EventBus.on('export:obj', () => ExportManager.exportOBJ());
        EventBus.on('export:json', () => ExportManager.exportJSON());

        EventBus.on('history:undo', () => HistoryManager.undo());
        EventBus.on('history:redo', () => HistoryManager.redo());
        EventBus.on('object:duplicate', () => SelectionManager.duplicateSelected());
        EventBus.on('object:delete', () => _deleteWithConfirm());
        EventBus.on('selection:all', () => SelectionManager.selectAll());
        EventBus.on('selection:none', () => SelectionManager.deselect());

        const addTypes = ['cube', 'sphere', 'cylinder', 'cone', 'torus', 'plane', 'pointlight', 'spotlight'];
        addTypes.forEach(type => {
            EventBus.on('add:' + type, () => _addObject(type));
        });

        EventBus.on('view:toggleProjection', () => SceneManager.toggleProjection());
        EventBus.on('view:front', () => SceneManager.setViewAngle('front'));
        EventBus.on('view:right', () => SceneManager.setViewAngle('right'));
        EventBus.on('view:top', () => SceneManager.setViewAngle('top'));
        EventBus.on('view:wireframe', () => {
            const state = SceneManager.toggleWireframe();
            document.getElementById('btn-wireframe').classList.toggle('active', state);
            Toast.info(state ? '线框模式已开启' : '线框模式已关闭');
        });
        EventBus.on('view:toggleGrid', () => {
            const state = SceneManager.toggleGrid();
            document.getElementById('btn-grid-toggle').classList.toggle('active', !state);
            Toast.info(state ? '网格已显示' : '网格已隐藏');
        });
        EventBus.on('view:focus', () => {
            const sel = SelectionManager.getSelected();
            if (sel) {
                SceneManager.focusSelected(sel);
            } else {
                Toast.info('请先选择一个对象');
            }
        });

        EventBus.on('help:shortcuts', () => Modal.showShortcuts());
        EventBus.on('help:about', () => Modal.showAbout());
    }

    function _bindToolbarEvents() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                if (!tool) return;

                if (tool === 'select') {
                    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    return;
                }

                if (tool.startsWith('add-')) {
                    const type = tool.replace('add-', '');
                    _addObject(type);
                }
            });
        });
    }

    function _bindViewportToolbar() {
        document.getElementById('btn-perspective').addEventListener('click', () => {
            SceneManager.toggleProjection();
            const isPerspective = SceneManager.getIsPerspective();
            Toast.info(isPerspective ? '透视视图' : '正交视图');
        });

        document.getElementById('btn-wireframe').addEventListener('click', () => {
            const state = SceneManager.toggleWireframe();
            document.getElementById('btn-wireframe').classList.toggle('active', state);
            Toast.info(state ? '线框模式已开启' : '线框模式已关闭');
        });

        document.getElementById('btn-grid-toggle').addEventListener('click', () => {
            const state = SceneManager.toggleGrid();
            document.getElementById('btn-grid-toggle').classList.toggle('active', !state);
        });

        document.getElementById('btn-snap').addEventListener('click', () => {
            const state = SceneManager.toggleSnap();
            document.getElementById('btn-snap').classList.toggle('active', state);
            Toast.info(state ? '吸附已开启' : '吸附已关闭');
        });

        document.getElementById('btn-focus').addEventListener('click', () => {
            const sel = SelectionManager.getSelected();
            if (sel) {
                SceneManager.focusSelected(sel);
            } else {
                Toast.info('请先选择一个对象');
            }
        });
    }

    function _bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;

            switch (e.key.toLowerCase()) {
                case 'g':
                    if (!ctrl) { TransformManager.setMode('translate'); e.preventDefault(); }
                    break;
                case 'r':
                    if (!ctrl) { TransformManager.setMode('rotate'); e.preventDefault(); }
                    break;
                case 's':
                    if (ctrl) {
                        e.preventDefault();
                        if (shift) ExportManager.saveScene();
                        else ExportManager.saveScene();
                    } else {
                        TransformManager.setMode('scale');
                        e.preventDefault();
                    }
                    break;
                case 'w':
                    if (!ctrl) {
                        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                        document.querySelector('[data-tool="select"]').classList.add('active');
                        e.preventDefault();
                    }
                    break;
                case 'delete':
                case 'x':
                    if (!ctrl && e.key === 'Delete') {
                        _deleteWithConfirm();
                        e.preventDefault();
                    } else if (!ctrl && e.key.toLowerCase() === 'x') {
                        _deleteWithConfirm();
                        e.preventDefault();
                    }
                    break;
                case 'z':
                    if (ctrl && shift) {
                        HistoryManager.redo();
                        e.preventDefault();
                    } else if (ctrl) {
                        HistoryManager.undo();
                        e.preventDefault();
                    } else {
                        const state = SceneManager.toggleWireframe();
                        document.getElementById('btn-wireframe').classList.toggle('active', state);
                        e.preventDefault();
                    }
                    break;
                case 'd':
                    if (ctrl) {
                        SelectionManager.duplicateSelected();
                        e.preventDefault();
                    }
                    break;
                case 'a':
                    if (!ctrl) {
                        SelectionManager.selectAll();
                        e.preventDefault();
                    }
                    break;
                case 'n':
                    if (ctrl) {
                        e.preventDefault();
                        EventBus.emit('scene:new');
                    }
                    break;
                case 'o':
                    if (ctrl) {
                        e.preventDefault();
                        ExportManager.loadScene();
                    }
                    break;
                case 'escape':
                    SelectionManager.deselect();
                    DropdownMenu.close();
                    break;
            }

            // Numpad keys for view
            if (e.code === 'Numpad5') {
                SceneManager.toggleProjection();
                e.preventDefault();
            } else if (e.code === 'Numpad1') {
                SceneManager.setViewAngle(shift ? 'back' : 'front');
                e.preventDefault();
            } else if (e.code === 'Numpad3') {
                SceneManager.setViewAngle(shift ? 'left' : 'right');
                e.preventDefault();
            } else if (e.code === 'Numpad7') {
                SceneManager.setViewAngle(shift ? 'bottom' : 'top');
                e.preventDefault();
            } else if (e.code === 'NumpadDecimal') {
                const sel = SelectionManager.getSelected();
                if (sel) SceneManager.focusSelected(sel);
                e.preventDefault();
            }
        });
    }

    function _bindContextMenu() {
        const canvas = SceneManager.getCanvas();
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            _showContextMenu(e.clientX, e.clientY);
        });
    }

    function _showContextMenu(x, y) {
        const existing = document.querySelector('.context-menu');
        if (existing) existing.remove();

        const selected = SelectionManager.getSelected();
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        const items = [];

        if (selected) {
            items.push({ label: '复制', action: () => SelectionManager.duplicateSelected() });
            items.push({ label: '删除', action: () => _deleteWithConfirm(), danger: true });
            items.push({ type: 'separator' });
            items.push({ label: '聚焦', action: () => SceneManager.focusSelected(selected) });
            items.push({ type: 'separator' });
        }

        items.push({ label: '添加立方体', action: () => _addObject('cube') });
        items.push({ label: '添加球体', action: () => _addObject('sphere') });
        items.push({ label: '添加圆柱体', action: () => _addObject('cylinder') });

        items.forEach(item => {
            if (item.type === 'separator') {
                const sep = document.createElement('div');
                sep.className = 'dropdown-separator';
                menu.appendChild(sep);
            } else {
                const el = document.createElement('div');
                el.className = 'context-menu-item' + (item.danger ? ' danger' : '');
                el.textContent = item.label;
                el.addEventListener('click', () => {
                    item.action();
                    menu.remove();
                });
                menu.appendChild(el);
            }
        });

        document.body.appendChild(menu);

        const menuRect = menu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            menu.style.left = (window.innerWidth - menuRect.width - 4) + 'px';
        }
        if (menuRect.bottom > window.innerHeight) {
            menu.style.top = (window.innerHeight - menuRect.height - 4) + 'px';
        }

        setTimeout(() => {
            const handler = (e) => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', handler);
                }
            };
            document.addEventListener('click', handler);
        }, 0);
    }

    function _bindTransformHistory() {
        EventBus.on('transform:start', () => {
            const sel = SelectionManager.getSelected();
            if (sel) {
                transformStartState = {
                    object: sel,
                    oldPosition: sel.position.clone(),
                    oldRotation: sel.rotation.clone(),
                    oldScale: sel.scale.clone()
                };
            }
        });

        EventBus.on('transform:end', () => {
            const sel = SelectionManager.getSelected();
            if (sel && transformStartState && transformStartState.object === sel) {
                const posChanged = !sel.position.equals(transformStartState.oldPosition);
                const rotChanged = sel.rotation.x !== transformStartState.oldRotation.x ||
                                   sel.rotation.y !== transformStartState.oldRotation.y ||
                                   sel.rotation.z !== transformStartState.oldRotation.z;
                const scaleChanged = !sel.scale.equals(transformStartState.oldScale);

                if (posChanged || rotChanged || scaleChanged) {
                    HistoryManager.push({
                        type: 'transform',
                        object: sel,
                        oldPosition: transformStartState.oldPosition,
                        oldRotation: transformStartState.oldRotation,
                        oldScale: transformStartState.oldScale,
                        newPosition: sel.position.clone(),
                        newRotation: sel.rotation.clone(),
                        newScale: sel.scale.clone()
                    });
                }
                transformStartState = null;
            }
        });
    }

    function _bindNavCube() {
        const navCube = document.getElementById('nav-cube');
        if (!navCube) return;

        navCube.querySelectorAll('.nav-cube-face').forEach(face => {
            face.addEventListener('click', () => {
                const viewMap = {
                    '前': 'front', '后': 'back',
                    '顶': 'top', '底': 'bottom',
                    '左': 'left', '右': 'right'
                };
                const direction = viewMap[face.textContent];
                if (direction) SceneManager.setViewAngle(direction);
            });
        });
    }

    function _addObject(type) {
        const obj = ObjectFactory.create(type);
        if (obj) {
            SceneManager.addObject(obj);
            SelectionManager.select(obj);
            HistoryManager.push({ type: 'add', object: obj });

            const typeNames = {
                cube: '立方体', sphere: '球体', cylinder: '圆柱体',
                cone: '圆锥体', torus: '圆环体', plane: '平面',
                pointlight: '点光源', spotlight: '聚光灯'
            };
            Toast.success(`已添加: ${typeNames[type] || type}`);
        }
    }

    async function _deleteWithConfirm() {
        const sel = SelectionManager.getSelected();
        if (!sel) {
            Toast.info('请先选择要删除的对象');
            return;
        }

        const confirmed = await Modal.confirm({
            title: '删除对象',
            message: `确定要删除 "${sel.name}" 吗？`,
            confirmLabel: '删除',
            danger: true
        });

        if (confirmed) {
            HistoryManager.push({ type: 'delete', object: sel });
            SelectionManager.deleteSelected();
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    return { init };
})();
