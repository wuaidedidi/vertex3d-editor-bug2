/**
 * Modal - 模态框组件
 * 替代原生confirm/prompt，提供统一的对话框体验
 */
const Modal = (() => {
    const overlay = document.getElementById('modal-overlay');

    function show({ title, content, buttons = [], onClose }) {
        if (!overlay) return;

        const modal = document.createElement('div');
        modal.className = 'modal';

        let footerHtml = '';
        if (buttons.length > 0) {
            const btnsHtml = buttons.map((btn, i) =>
                `<button class="btn ${btn.class || 'btn-secondary'}" data-btn-index="${i}">${_escapeHtml(btn.label)}</button>`
            ).join('');
            footerHtml = `<div class="modal-footer">${btnsHtml}</div>`;
        }

        modal.innerHTML = `
            <div class="modal-header">
                <span class="modal-title">${_escapeHtml(title)}</span>
                <button class="modal-close" aria-label="关闭">&times;</button>
            </div>
            <div class="modal-body">${content}</div>
            ${footerHtml}
        `;

        overlay.innerHTML = '';
        overlay.appendChild(modal);
        overlay.classList.remove('hidden');

        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => close(onClose));

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(onClose);
        });

        const btnElements = modal.querySelectorAll('[data-btn-index]');
        btnElements.forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.btnIndex);
                const btn = buttons[idx];
                if (btn && btn.onClick) {
                    btn.onClick();
                }
                if (!btn || !btn.keepOpen) {
                    close();
                }
            });
        });

        document.addEventListener('keydown', _escHandler);
        Logger.debug('Modal', `Opened: ${title}`);
    }

    function close(callback) {
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.innerHTML = '';
        }
        document.removeEventListener('keydown', _escHandler);
        if (callback) callback();
    }

    function _escHandler(e) {
        if (e.key === 'Escape') close();
    }

    function confirm({ title, message, confirmLabel = '确认', cancelLabel = '取消', danger = false }) {
        return new Promise((resolve) => {
            show({
                title,
                content: `<p class="confirm-message">${_escapeHtml(message)}</p>`,
                buttons: [
                    { label: cancelLabel, class: 'btn-secondary', onClick: () => resolve(false) },
                    { label: confirmLabel, class: danger ? 'btn-danger' : 'btn-primary', onClick: () => resolve(true) }
                ],
                onClose: () => resolve(false)
            });
        });
    }

    function showAbout() {
        show({
            title: '关于 Vertex 3D',
            content: `
                <div class="about-content">
                    <div class="about-logo">
                        <svg width="64" height="64" viewBox="0 0 32 32">
                            <polygon points="16,2 28,10 28,22 16,30 4,22 4,10" fill="#4A9EFF" stroke="#fff" stroke-width="1"/>
                            <polygon points="16,6 24,11 24,21 16,26 8,21 8,11" fill="#1a1a2e" stroke="#4A9EFF" stroke-width="0.5"/>
                        </svg>
                    </div>
                    <div class="about-version">Vertex 3D v1.0.0</div>
                    <p class="about-desc">
                        基于 WebGL 的浏览器端三维建模工具<br>
                        使用 Three.js 渲染引擎<br>
                        支持基础图元创建、变换操作、材质编辑和场景管理
                    </p>
                </div>
            `,
            buttons: [
                { label: '关闭', class: 'btn-primary' }
            ]
        });
    }

    function showShortcuts() {
        const shortcuts = [
            ['选择工具', 'W'],
            ['移动', 'G'],
            ['旋转', 'R'],
            ['缩放', 'S'],
            ['删除选中', 'Delete / X'],
            ['撤销', 'Ctrl+Z'],
            ['重做', 'Ctrl+Shift+Z'],
            ['复制', 'Ctrl+D'],
            ['全选', 'A'],
            ['聚焦选中', 'Numpad .'],
            ['透视/正交', 'Numpad 5'],
            ['前视图', 'Numpad 1'],
            ['右视图', 'Numpad 3'],
            ['顶视图', 'Numpad 7'],
            ['线框模式', 'Z'],
            ['新建场景', 'Ctrl+N'],
            ['保存场景', 'Ctrl+S'],
            ['打开场景', 'Ctrl+O'],
        ];

        const listHtml = shortcuts.map(([label, keys]) => `
            <div class="shortcut-item">
                <span class="shortcut-item-label">${label}</span>
                <span class="shortcut-item-keys">
                    ${keys.split(' / ').map(k => `<span class="kbd">${k}</span>`).join(' ')}
                </span>
            </div>
        `).join('');

        show({
            title: '快捷键',
            content: `<div class="shortcut-list">${listHtml}</div>`,
            buttons: [{ label: '关闭', class: 'btn-primary' }]
        });
    }

    function _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { show, close, confirm, showAbout, showShortcuts };
})();
