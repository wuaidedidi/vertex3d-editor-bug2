/**
 * DropdownMenu - 下拉菜单管理
 */
const DropdownMenu = (() => {
    const container = document.getElementById('dropdown-menus');
    let activeMenu = null;

    const MENUS = {
        file: [
            { label: '新建场景', shortcut: 'Ctrl+N', action: 'scene:new' },
            { type: 'separator' },
            { label: '打开场景...', shortcut: 'Ctrl+O', action: 'scene:open' },
            { label: '保存场景', shortcut: 'Ctrl+S', action: 'scene:save' },
            { label: '另存为...', shortcut: 'Ctrl+Shift+S', action: 'scene:saveAs' },
            { type: 'separator' },
            { label: '导出 OBJ', action: 'export:obj' },
            { label: '导出 JSON', action: 'export:json' },
        ],
        edit: [
            { label: '撤销', shortcut: 'Ctrl+Z', action: 'history:undo' },
            { label: '重做', shortcut: 'Ctrl+Shift+Z', action: 'history:redo' },
            { type: 'separator' },
            { label: '复制', shortcut: 'Ctrl+D', action: 'object:duplicate' },
            { label: '删除', shortcut: 'Delete', action: 'object:delete' },
            { type: 'separator' },
            { label: '全选', shortcut: 'A', action: 'selection:all' },
            { label: '取消选择', action: 'selection:none' },
        ],
        add: [
            { label: '立方体', action: 'add:cube' },
            { label: '球体', action: 'add:sphere' },
            { label: '圆柱体', action: 'add:cylinder' },
            { label: '圆锥体', action: 'add:cone' },
            { label: '圆环体', action: 'add:torus' },
            { label: '平面', action: 'add:plane' },
            { type: 'separator' },
            { label: '点光源', action: 'add:pointlight' },
            { label: '聚光灯', action: 'add:spotlight' },
        ],
        view: [
            { label: '透视/正交切换', shortcut: 'Num 5', action: 'view:toggleProjection' },
            { type: 'separator' },
            { label: '前视图', shortcut: 'Num 1', action: 'view:front' },
            { label: '右视图', shortcut: 'Num 3', action: 'view:right' },
            { label: '顶视图', shortcut: 'Num 7', action: 'view:top' },
            { type: 'separator' },
            { label: '线框模式', shortcut: 'Z', action: 'view:wireframe' },
            { label: '显示/隐藏网格', action: 'view:toggleGrid' },
            { label: '聚焦选中', shortcut: 'Num .', action: 'view:focus' },
        ],
        help: [
            { label: '快捷键', action: 'help:shortcuts' },
            { label: '关于 Vertex 3D', action: 'help:about' },
        ]
    };

    function open(menuKey, anchorEl) {
        close();
        const items = MENUS[menuKey];
        if (!items) return;

        const menu = document.createElement('div');
        menu.className = 'dropdown-menu';

        items.forEach(item => {
            if (item.type === 'separator') {
                menu.appendChild(_createSeparator());
            } else {
                menu.appendChild(_createItem(item));
            }
        });

        const rect = anchorEl.getBoundingClientRect();
        menu.style.left = rect.left + 'px';
        menu.style.top = rect.bottom + 'px';

        container.appendChild(menu);
        activeMenu = menu;

        const menuRect = menu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            menu.style.left = (window.innerWidth - menuRect.width - 4) + 'px';
        }

        setTimeout(() => {
            document.addEventListener('click', _outsideClickHandler);
            document.addEventListener('keydown', _escHandler);
        }, 0);
    }

    function close() {
        if (activeMenu) {
            activeMenu.remove();
            activeMenu = null;
        }
        document.removeEventListener('click', _outsideClickHandler);
        document.removeEventListener('keydown', _escHandler);

        document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    }

    function _createItem(item) {
        const el = document.createElement('div');
        el.className = 'dropdown-item' + (item.disabled ? ' disabled' : '');
        el.innerHTML = `
            <span>${item.label}</span>
            ${item.shortcut ? `<span class="dropdown-item-shortcut">${item.shortcut}</span>` : ''}
        `;
        el.addEventListener('click', () => {
            if (!item.disabled && item.action) {
                EventBus.emit(item.action);
                close();
            }
        });
        return el;
    }

    function _createSeparator() {
        const el = document.createElement('div');
        el.className = 'dropdown-separator';
        return el;
    }

    function _outsideClickHandler(e) {
        if (activeMenu && !activeMenu.contains(e.target)) {
            close();
        }
    }

    function _escHandler(e) {
        if (e.key === 'Escape') close();
    }

    function init() {
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const menuKey = btn.dataset.menu;
                if (activeMenu) {
                    close();
                } else {
                    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    open(menuKey, btn);
                }
            });

            btn.addEventListener('mouseenter', () => {
                if (activeMenu) {
                    const menuKey = btn.dataset.menu;
                    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    open(menuKey, btn);
                }
            });
        });
    }

    return { init, open, close };
})();
