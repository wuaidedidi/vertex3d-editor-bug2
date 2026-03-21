/**
 * MaterialPanel - 材质面板
 * 编辑选中对象的材质属性（颜色、粗糙度、金属度等）
 */
const MaterialPanel = (() => {
    let container;
    let currentObject = null;

    function init() {
        container = document.getElementById('material-body');
        _bindEvents();
        Logger.info('MaterialPanel', '材质面板初始化完成');
    }

    function _bindEvents() {
        EventBus.on('selection:changed', _onSelectionChanged);

        const header = document.querySelector('[data-collapse="material"]');
        if (header) {
            header.addEventListener('click', () => {
                header.closest('.panel-section').classList.toggle('collapsed');
            });
        }
    }

    function _onSelectionChanged(obj) {
        currentObject = obj;
        _render();
    }

    function _render() {
        if (!container) return;

        if (!currentObject || currentObject.userData.isLight) {
            container.innerHTML = '<div class="material-empty">未选中网格对象</div>';
            return;
        }

        const mat = currentObject.material;
        if (!mat) {
            container.innerHTML = '<div class="material-empty">该对象无材质</div>';
            return;
        }

        const colorHex = '#' + mat.color.getHexString();

        container.innerHTML = `
            <div class="property-group">
                <div class="property-group-title">表面</div>
                <div class="material-row">
                    <span class="material-label">颜色</span>
                    <input class="material-color-input" type="color" value="${colorHex}" data-mat="color" />
                    <span style="font-size: var(--font-size-xs); color: var(--text-muted); font-family: var(--font-mono);">${colorHex.toUpperCase()}</span>
                </div>
                <div class="material-row">
                    <span class="material-label">粗糙度</span>
                    <div class="material-slider-group">
                        <input class="material-slider" type="range" min="0" max="1" step="0.01" value="${mat.roughness}" data-mat="roughness" />
                        <span class="material-slider-value">${mat.roughness.toFixed(2)}</span>
                    </div>
                </div>
                <div class="material-row">
                    <span class="material-label">金属度</span>
                    <div class="material-slider-group">
                        <input class="material-slider" type="range" min="0" max="1" step="0.01" value="${mat.metalness}" data-mat="metalness" />
                        <span class="material-slider-value">${mat.metalness.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div class="property-group">
                <div class="property-group-title">透明度</div>
                <div class="material-row">
                    <span class="material-label">不透明</span>
                    <div class="material-slider-group">
                        <input class="material-slider" type="range" min="0" max="1" step="0.01" value="${mat.opacity}" data-mat="opacity" />
                        <span class="material-slider-value">${mat.opacity.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div class="property-group">
                <div class="property-group-title">渲染</div>
                <div class="material-row">
                    <span class="material-label">面</span>
                    <select class="material-select" data-mat="side">
                        <option value="0" ${mat.side === THREE.FrontSide ? 'selected' : ''}>正面</option>
                        <option value="1" ${mat.side === THREE.BackSide ? 'selected' : ''}>背面</option>
                        <option value="2" ${mat.side === THREE.DoubleSide ? 'selected' : ''}>双面</option>
                    </select>
                </div>
                <div class="material-checkbox-row">
                    <input class="material-checkbox" type="checkbox" id="mat-flatShading" ${mat.flatShading ? 'checked' : ''} data-mat="flatShading" />
                    <label for="mat-flatShading" style="font-size: var(--font-size-sm); color: var(--text-secondary); cursor: pointer;">平面着色</label>
                </div>
                <div class="material-checkbox-row">
                    <input class="material-checkbox" type="checkbox" id="mat-wireframe" ${mat.wireframe ? 'checked' : ''} data-mat="wireframe" />
                    <label for="mat-wireframe" style="font-size: var(--font-size-sm); color: var(--text-secondary); cursor: pointer;">线框显示</label>
                </div>
            </div>
        `;

        _bindInputs();
    }

    function _bindInputs() {
        container.querySelectorAll('[data-mat]').forEach(input => {
            const handler = () => _applyMaterial(input);
            input.addEventListener('input', handler);
            input.addEventListener('change', handler);
        });
    }

    function _applyMaterial(input) {
        if (!currentObject || !currentObject.material) return;
        const mat = currentObject.material;
        const prop = input.dataset.mat;
        const val = input.value;

        const oldState = {
            color: mat.color.getHex(),
            roughness: mat.roughness,
            metalness: mat.metalness,
            opacity: mat.opacity
        };

        switch (prop) {
            case 'color':
                mat.color.set(val);
                const hexLabel = input.parentElement.querySelector('span:last-child');
                if (hexLabel) hexLabel.textContent = val.toUpperCase();
                break;
            case 'roughness':
                mat.roughness = parseFloat(val);
                _updateSliderLabel(input, parseFloat(val).toFixed(2));
                break;
            case 'metalness':
                mat.metalness = parseFloat(val);
                _updateSliderLabel(input, parseFloat(val).toFixed(2));
                break;
            case 'opacity':
                mat.opacity = parseFloat(val);
                mat.transparent = parseFloat(val) < 1;
                _updateSliderLabel(input, parseFloat(val).toFixed(2));
                break;
            case 'side':
                mat.side = parseInt(val);
                break;
            case 'flatShading':
                mat.flatShading = input.checked;
                mat.needsUpdate = true;
                break;
            case 'wireframe':
                mat.wireframe = input.checked;
                break;
        }
    }

    function _updateSliderLabel(input, text) {
        const label = input.parentElement.querySelector('.material-slider-value');
        if (label) label.textContent = text;
    }

    return { init };
})();
