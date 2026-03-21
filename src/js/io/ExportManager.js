/**
 * ExportManager - 导入导出管理器
 * 处理场景文件的保存、加载和导出
 */
const ExportManager = (() => {

    function saveScene() {
        try {
            const data = SceneSerializer.serialize();
            const json = JSON.stringify(data, null, 2);
            _downloadFile(json, 'vertex3d-scene.json', 'application/json');
            Toast.success('场景已保存');
            Logger.info('ExportManager', '场景保存成功');
        } catch (err) {
            Toast.error('保存失败: ' + err.message);
            Logger.error('ExportManager', '保存失败: ' + err.message);
        }
    }

    function loadScene() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const data = JSON.parse(evt.target.result);
                    if (SceneSerializer.deserialize(data)) {
                        Toast.success(`场景已加载: ${data.objects.length} 个对象`);
                        HistoryManager.clear();
                    } else {
                        Toast.error('场景文件格式无效');
                    }
                } catch (err) {
                    Toast.error('加载失败: 文件格式错误');
                    Logger.error('ExportManager', '加载失败: ' + err.message);
                }
            };
            reader.onerror = () => {
                Toast.error('文件读取失败');
            };
            reader.readAsText(file);
        });
        input.click();
    }

    function exportOBJ() {
        try {
            const objects = SceneManager.getSceneObjects();
            const meshes = objects.filter(o => !o.userData.isLight && o.geometry);

            if (meshes.length === 0) {
                Toast.info('场景中没有可导出的网格对象');
                return;
            }

            let objContent = '# Vertex 3D OBJ Export\n';
            objContent += `# Objects: ${meshes.length}\n`;
            objContent += `# Date: ${new Date().toISOString()}\n\n`;

            let vertexOffset = 0;

            meshes.forEach(mesh => {
                objContent += `o ${mesh.name}\n`;

                const geometry = mesh.geometry;
                const position = geometry.attributes.position;
                const normal = geometry.attributes.normal;
                const index = geometry.index;

                const worldMatrix = mesh.matrixWorld;

                for (let i = 0; i < position.count; i++) {
                    const v = new THREE.Vector3(
                        position.getX(i),
                        position.getY(i),
                        position.getZ(i)
                    ).applyMatrix4(worldMatrix);
                    objContent += `v ${v.x.toFixed(6)} ${v.y.toFixed(6)} ${v.z.toFixed(6)}\n`;
                }

                if (normal) {
                    const normalMatrix = new THREE.Matrix3().getNormalMatrix(worldMatrix);
                    for (let i = 0; i < normal.count; i++) {
                        const n = new THREE.Vector3(
                            normal.getX(i),
                            normal.getY(i),
                            normal.getZ(i)
                        ).applyMatrix3(normalMatrix).normalize();
                        objContent += `vn ${n.x.toFixed(6)} ${n.y.toFixed(6)} ${n.z.toFixed(6)}\n`;
                    }
                }

                if (index) {
                    for (let i = 0; i < index.count; i += 3) {
                        const a = index.getX(i) + 1 + vertexOffset;
                        const b = index.getX(i + 1) + 1 + vertexOffset;
                        const c = index.getX(i + 2) + 1 + vertexOffset;
                        if (normal) {
                            objContent += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
                        } else {
                            objContent += `f ${a} ${b} ${c}\n`;
                        }
                    }
                } else {
                    for (let i = 0; i < position.count; i += 3) {
                        const a = i + 1 + vertexOffset;
                        const b = i + 2 + vertexOffset;
                        const c = i + 3 + vertexOffset;
                        objContent += `f ${a} ${b} ${c}\n`;
                    }
                }

                vertexOffset += position.count;
                objContent += '\n';
            });

            _downloadFile(objContent, 'vertex3d-export.obj', 'text/plain');
            Toast.success(`已导出 ${meshes.length} 个对象为 OBJ`);
            Logger.info('ExportManager', `OBJ导出成功: ${meshes.length} 个对象`);
        } catch (err) {
            Toast.error('导出失败: ' + err.message);
            Logger.error('ExportManager', '导出失败: ' + err.message);
        }
    }

    function exportJSON() {
        saveScene();
    }

    function newScene() {
        SceneManager.clearScene();
        SelectionManager.deselect();
        HistoryManager.clear();
        Toast.success('已创建新场景');
        Logger.info('ExportManager', '新建场景');
    }

    function _downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return { saveScene, loadScene, exportOBJ, exportJSON, newScene };
})();
