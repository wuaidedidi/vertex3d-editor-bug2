/**
 * PropertiesPanel - 属性面板
 * 显示和编辑选中对象的变换属性
 */
const PropertiesPanel = (() => {
    let container;
    let currentObject = null;
    let isUpdating = false;

    function init() {
        container = document.getElementById('properties-body');
        _bindEvents();
        Logger.info('PropertiesPanel', '属性面板初始化完成');
    }

    function _bindEvents() {
        EventBus.on('selection:changed', _onSelectionChanged);
        EventBus.on('object:transformed', _onObjectTransformed);
        EventBus.on('object:renamed', _onObjectRenamed);

        const header = document.querySelector('[data-collapse="properties"]');
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

    function _onObjectTransformed() {
        if (currentObject && !isUpdating) {
            _updateValues();
        }
    }

    function _onObjectRenamed() {
        if (currentObject) {
            const nameInput = container.querySelector('.property-name-input');
            if (nameInput) nameInput.value = currentObject.name;
        }
    }

    function _render() {
        if (!container) return;

        if (!currentObject) {
            container.innerHTML = '<div class="properties-empty">未选中任何对象</div>';
            return;
        }

        const obj = currentObject;
        const isLight = obj.userData.isLight;

        container.innerHTML = `
            <div class="property-group">
                <div class="property-group-title">对象信息</div>
                <div class="property-row">
                    <span class="property-label">名称</span>
                    <input class="property-name-input" type="text" value="${_escapeHtml(obj.name)}" data-prop="name" />
                </div>
                <div class="property-row">
                    <span class="property-label">类型</span>
                    <span style="color: var(--text-muted); font-size: var(--font-size-sm);">${obj.userData.type}</span>
                </div>
            </div>

            <div class="property-group">
                <div class="property-group-title">位置</div>
                <div class="property-row">
                    <span class="property-label">位置</span>
                    <div class="property-inputs">
                        ${_createAxisInput('px', 'X', obj.position.x)}
                        ${_createAxisInput('py', 'Y', obj.position.y)}
                        ${_createAxisInput('pz', 'Z', obj.position.z)}
                    </div>
                </div>
            </div>

            <div class="property-group">
                <div class="property-group-title">旋转</div>
                <div class="property-row">
                    <span class="property-label">旋转</span>
                    <div class="property-inputs">
                        ${_createAxisInput('rx', 'X', THREE.MathUtils.radToDeg(obj.rotation.x))}
                        ${_createAxisInput('ry', 'Y', THREE.MathUtils.radToDeg(obj.rotation.y))}
                        ${_createAxisInput('rz', 'Z', THREE.MathUtils.radToDeg(obj.rotation.z))}
                    </div>
                </div>
            </div>

            <div class="property-group">
                <div class="property-group-title">缩放</div>
                <div class="property-row">
                    <span class="property-label">缩放</span>
                    <div class="property-inputs">
                        ${_createAxisInput('sx', 'X', obj.scale.x)}
                        ${_createAxisInput('sy', 'Y', obj.scale.y)}
                        ${_createAxisInput('sz', 'Z', obj.scale.z)}
                    </div>
                </div>
            </div>

            ${isLight ? _renderLightProperties(obj) : ''}
        `;

        _bindInputs();
    }

    function _renderLightProperties(light) {
        let html = `
            <div class="property-group">
                <div class="property-group-title">光源属性</div>
                <div class="material-row">
                    <span class="material-label">颜色</span>
                    <input class="material-color-input" type="color" value="#${light.color.getHexString()}" data-light-prop="color" />
                </div>
                <div class="material-row">
                    <span class="material-label">强度</span>
                    <div class="material-slider-group">
                        <input class="material-slider" type="range" min="0" max="5" step="0.1" value="${light.intensity}" data-light-prop="intensity" />
                        <span class="material-slider-value">${light.intensity.toFixed(1)}</span>
                    </div>
                </div>
        `;

        if (light.distance !== undefined) {
            html += `
                <div class="material-row">
                    <span class="material-label">距离</span>
                    <div class="material-slider-group">
                        <input class="material-slider" type="range" min="0" max="50" step="1" value="${light.distance}" data-light-prop="distance" />
                        <span class="material-slider-value">${light.distance}</span>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    function _createAxisInput(prop, axis, value) {
        const axisLower = axis.toLowerCase();
        return `
            <div class="property-input-group">
                <span class="axis-label ${axisLower}">${axis}</span>
                <input type="number" step="0.1" value="${value.toFixed(3)}" data-prop="${prop}" />
            </div>
        `;
    }

    function _bindInputs() {
        const nameInput = container.querySelector('[data-prop="name"]');
        if (nameInput) {
            nameInput.addEventListener('change', () => {
                if (currentObject) {
                    currentObject.name = nameInput.value.trim() || currentObject.name;
                    EventBus.emit('object:renamed', currentObject);
                    OutlinerPanel.refresh();
                }
            });
        }

        const transformInputs = container.querySelectorAll('[data-prop^="p"], [data-prop^="r"], [data-prop^="s"]');
        transformInputs.forEach(input => {
            input.addEventListener('change', () => _applyTransformFromInput(input));
            input.addEventListener('input', () => _applyTransformFromInput(input));
        });

        const lightInputs = container.querySelectorAll('[data-light-prop]');
        lightInputs.forEach(input => {
            input.addEventListener('input', () => _applyLightProperty(input));
            input.addEventListener('change', () => _applyLightProperty(input));
        });
    }

    function _applyTransformFromInput(input) {
        if (!currentObject) return;
        isUpdating = true;

        const prop = input.dataset.prop;
        const val = parseFloat(input.value);
        if (isNaN(val)) { isUpdating = false; return; }

        const oldPos = currentObject.position.clone();
        const oldRot = currentObject.rotation.clone();
        const oldScale = currentObject.scale.clone();

        switch (prop) {
            case 'px': currentObject.position.z = val; break;
            case 'py': currentObject.position.y = val; break;
            case 'pz': currentObject.position.x = val; break;
            case 'rx': currentObject.rotation.x = THREE.MathUtils.degToRad(val); break;
            case 'ry': currentObject.rotation.y = THREE.MathUtils.degToRad(val); break;
            case 'rz': currentObject.rotation.z = THREE.MathUtils.degToRad(val); break;
            case 'sx': currentObject.scale.x = val; break;
            case 'sy': currentObject.scale.y = val; break;
            case 'sz': currentObject.scale.z = val; break;
        }

        isUpdating = false;
    }

    function _applyLightProperty(input) {
        if (!currentObject || !currentObject.userData.isLight) return;
        const prop = input.dataset.lightProp;
        const val = input.value;

        switch (prop) {
            case 'color':
                currentObject.color.set(val);
                break;
            case 'intensity':
                currentObject.intensity = parseFloat(val);
                const intLabel = input.parentElement.querySelector('.material-slider-value');
                if (intLabel) intLabel.textContent = parseFloat(val).toFixed(1);
                break;
            case 'distance':
                currentObject.distance = parseFloat(val);
                const distLabel = input.parentElement.querySelector('.material-slider-value');
                if (distLabel) distLabel.textContent = val;
                break;
        }
    }

    function _updateValues() {
        if (!currentObject || !container) return;

        const inputs = {
            px: currentObject.position.x,
            py: currentObject.position.y,
            pz: currentObject.position.z,
            rx: THREE.MathUtils.radToDeg(currentObject.rotation.x),
            ry: THREE.MathUtils.radToDeg(currentObject.rotation.y),
            rz: THREE.MathUtils.radToDeg(currentObject.rotation.z),
            sx: currentObject.scale.x,
            sy: currentObject.scale.y,
            sz: currentObject.scale.z
        };

        Object.entries(inputs).forEach(([prop, val]) => {
            const input = container.querySelector(`[data-prop="${prop}"]`);
            if (input && document.activeElement !== input) {
                input.value = val.toFixed(3);
            }
        });
    }

    function _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    return { init };
})();
