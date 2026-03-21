/**
 * OutlinerPanel - 场景大纲面板
 * 显示场景中所有对象的层级列表
 */
const OutlinerPanel = (() => {
    let container;

    const TYPE_ICONS = {
        Box: '<svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="2" width="10" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
        Sphere: '<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
        Cylinder: '<svg width="14" height="14" viewBox="0 0 14 14"><ellipse cx="7" cy="4" rx="4" ry="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="3" y1="4" x2="3" y2="10" stroke="currentColor" stroke-width="1.2"/><line x1="11" y1="4" x2="11" y2="10" stroke="currentColor" stroke-width="1.2"/><ellipse cx="7" cy="10" rx="4" ry="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
        Cone: '<svg width="14" height="14" viewBox="0 0 14 14"><polygon points="7,2 12,12 2,12" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
        Torus: '<svg width="14" height="14" viewBox="0 0 14 14"><ellipse cx="7" cy="7" rx="5" ry="3" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
        Plane: '<svg width="14" height="14" viewBox="0 0 14 14"><polygon points="1,10 7,4 13,10 7,12" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
        PointLight: '<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="2.5" fill="currentColor" opacity="0.5"/><line x1="7" y1="1" x2="7" y2="3.5" stroke="currentColor" stroke-width="1"/><line x1="7" y1="10.5" x2="7" y2="13" stroke="currentColor" stroke-width="1"/><line x1="1" y1="7" x2="3.5" y2="7" stroke="currentColor" stroke-width="1"/><line x1="10.5" y1="7" x2="13" y2="7" stroke="currentColor" stroke-width="1"/></svg>',
        SpotLight: '<svg width="14" height="14" viewBox="0 0 14 14"><polygon points="5,2 9,2 12,12 2,12" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
        Unknown: '<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2,1"/></svg>'
    };

    function init() {
        container = document.getElementById('outliner-body');
        _bindEvents();
        Logger.info('OutlinerPanel', '大纲面板初始化完成');
    }

    function _bindEvents() {
        EventBus.on('scene:objectAdded', refresh);
        EventBus.on('scene:objectRemoved', refresh);
        EventBus.on('selection:changed', _updateSelection);

        const header = document.querySelector('[data-collapse="outliner"]');
        if (header) {
            header.addEventListener('click', () => {
                header.closest('.panel-section').classList.toggle('collapsed');
            });
        }

        const addBtn = document.getElementById('btn-add-object');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                _showAddMenu(addBtn);
            });
        }
    }

    function _showAddMenu(anchor) {
        const existing = document.querySelector('.context-menu');
        if (existing) existing.remove();

        const menu = document.createElement('div');
        menu.className = 'context-menu';

        const items = [
            { label: '立方体', action: 'cube' },
            { label: '球体', action: 'sphere' },
            { label: '圆柱体', action: 'cylinder' },
            { label: '圆锥体', action: 'cone' },
            { label: '圆环体', action: 'torus' },
            { label: '平面', action: 'plane' },
        ];

        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'context-menu-item';
            el.textContent = item.label;
            el.addEventListener('click', () => {
                EventBus.emit('add:' + item.action);
                menu.remove();
            });
            menu.appendChild(el);
        });

        const rect = anchor.getBoundingClientRect();
        menu.style.top = rect.bottom + 4 + 'px';
        document.body.appendChild(menu);
        const menuWidth = menu.getBoundingClientRect().width;
        menu.style.left = (rect.right - menuWidth) + 'px';

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

    function refresh() {
        if (!container) return;
        const objects = SceneManager.getSceneObjects();
        const selected = SelectionManager.getSelected();

        if (objects.length === 0) {
            container.innerHTML = '<div class="outliner-empty">场景为空，请添加对象</div>';
            return;
        }

        container.innerHTML = '';
        objects.forEach(obj => {
            const item = _createItem(obj, obj === selected);
            container.appendChild(item);
        });
    }

    function _createItem(obj, isSelected) {
        const item = document.createElement('div');
        item.className = 'outliner-item' + (isSelected ? ' selected' : '');
        item.dataset.objectId = obj.userData.id;

        const iconSvg = TYPE_ICONS[obj.userData.type] || TYPE_ICONS.Unknown;

        item.innerHTML = `
            <span class="outliner-item-icon">${iconSvg}</span>
            <span class="outliner-item-name">${_escapeHtml(obj.name)}</span>
            <span class="outliner-item-actions">
                <button class="outliner-item-btn visibility${obj.visible ? '' : ' hidden-obj'}" title="${obj.visible ? '隐藏' : '显示'}">
                    <svg width="12" height="12" viewBox="0 0 12 12"><path d="${obj.visible ? 'M6 3C3 3 1 6 1 6s2 3 5 3 5-3 5-3-2-3-5-3zm0 5a2 2 0 110-4 2 2 0 010 4z' : 'M1 1l10 10M6 3C3 3 1 6 1 6s.8 1.2 2.2 2.2M6 9c1.2 0 2.3-.5 3.2-1.2'}" fill="none" stroke="currentColor" stroke-width="1"/></svg>
                </button>
                <button class="outliner-item-btn delete" title="删除">
                    <svg width="12" height="12" viewBox="0 0 12 12"><line x1="3" y1="3" x2="9" y2="9" stroke="currentColor" stroke-width="1.5"/><line x1="9" y1="3" x2="3" y2="9" stroke="currentColor" stroke-width="1.5"/></svg>
                </button>
            </span>
        `;

        item.addEventListener('click', (e) => {
            if (e.target.closest('.outliner-item-btn')) return;
            SelectionManager.select(obj);
        });

        item.addEventListener('dblclick', (e) => {
            if (e.target.closest('.outliner-item-btn')) return;
            _startRename(item, obj);
        });

        const visBtn = item.querySelector('.visibility');
        visBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            obj.visible = !obj.visible;
            refresh();
        });

        const delBtn = item.querySelector('.delete');
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            HistoryManager.push({ type: 'delete', object: obj });
            if (SelectionManager.getSelected() === obj) {
                SelectionManager.deselect();
            }
            SceneManager.removeObject(obj);
            Toast.success(`已删除: ${obj.name}`);
        });

        return item;
    }

    function _startRename(itemEl, obj) {
        const nameSpan = itemEl.querySelector('.outliner-item-name');
        const oldName = obj.name;
        nameSpan.innerHTML = `<input type="text" value="${_escapeHtml(oldName)}" />`;
        const input = nameSpan.querySelector('input');
        input.focus();
        input.select();

        const finish = () => {
            const newName = input.value.trim() || oldName;
            obj.name = newName;
            nameSpan.textContent = newName;
            EventBus.emit('object:renamed', obj);
        };

        input.addEventListener('blur', finish);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') {
                input.value = oldName;
                input.blur();
            }
        });
    }

    function _updateSelection(obj) {
        if (!container) return;
        container.querySelectorAll('.outliner-item').forEach(item => {
            const id = item.dataset.objectId;
            item.classList.toggle('selected', obj && obj.userData.id === id);
        });
    }

    function _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { init, refresh };
})();
