/* =====================================
   グローバル変数と状態管理
===================================== */
const canvas = document.getElementById('canvas');
const svgLayer = document.getElementById('svgLayer');

let mode = 'select';
let selectedElement = null;

let activeDragElement = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

let activeResizeElement = null;
let startWidth = 0;
let startHeight = 0;
let startMouseX = 0;
let startMouseY = 0;

let isDrawingLine = false;
let currentLineGroup = null;

let activeLineHandle = null;
let lineHandles = [];

/* =====================================
   ゲート・要素の追加
===================================== */
function addGate(type) {
    mode = 'select';
    
    const gate = document.createElement('div');
    gate.className = 'gate';
    gate.style.left = '50px';
    gate.style.top = '50px';

    let svgContent = '';
    let defaultWidth = '100px';
    let defaultHeight = '60px';
    
    const svgAttr = 'viewBox="0 0 100 60" preserveAspectRatio="none" style="width: 100%; height: 100%; display: block;"';

    if (type === 'AND') {
        svgContent = `<svg ${svgAttr}><path d="M 30,10 L 60,10 A 20,20 0 0,1 60,50 L 30,50 Z" fill="white" stroke="black" stroke-width="2"/></svg>`;
    } else if (type === 'OR') {
        svgContent = `<svg ${svgAttr}><path d="M 30,10 C 50,10 70,25 80,30 C 70,35 50,50 30,50 C 40,30 40,30 30,10 Z" fill="white" stroke="black" stroke-width="2"/></svg>`;
    } else if (type === 'NOT') {
        svgContent = `<svg ${svgAttr}><polygon points="30,10 60,30 30,50" fill="white" stroke="black" stroke-width="2"/><circle cx="65" cy="30" r="5" fill="white" stroke="black" stroke-width="2"/></svg>`;
    } else if (type === 'NAND') {
        svgContent = `<svg ${svgAttr}><path d="M 30,10 L 60,10 A 20,20 0 0,1 60,50 L 30,50 Z" fill="white" stroke="black" stroke-width="2"/><circle cx="85" cy="30" r="5" fill="white" stroke="black" stroke-width="2"/></svg>`;
    } else if (type === 'NOR') {
        // NORゲートの追加
        svgContent = `<svg ${svgAttr}><path d="M 30,10 C 50,10 70,25 80,30 C 70,35 50,50 30,50 C 40,30 40,30 30,10 Z" fill="white" stroke="black" stroke-width="2"/><circle cx="85" cy="30" r="5" fill="white" stroke="black" stroke-width="2"/></svg>`;
    } else if (type === 'XOR') {
        svgContent = `<svg ${svgAttr}><path d="M 40,10 C 60,10 80,25 90,30 C 80,35 60,50 40,50 C 50,30 50,30 40,10 Z" fill="white" stroke="black" stroke-width="2"/><path d="M 30,10 C 40,30 40,30 30,50" fill="none" stroke="black" stroke-width="2"/></svg>`;
    } else if (type === 'JUNCTION') {
        defaultWidth = '10px';
        defaultHeight = '10px';
        svgContent = `<svg viewBox="0 0 20 20" preserveAspectRatio="none" style="width: 100%; height: 100%; display: block;"><circle cx="10" cy="10" r="8" fill="black" stroke="black" stroke-width="1"/></svg>`;
    } else if (type === 'WHITE_JUNCTION') {
        defaultWidth = '10px';
        defaultHeight = '10px';
        svgContent = `<svg viewBox="0 0 20 20" preserveAspectRatio="none" style="width: 100%; height: 100%; display: block;"><circle cx="10" cy="10" r="8" fill="white" stroke="black" stroke-width="2"/></svg>`;
    } else if (type === 'OR_ARC') {
        defaultWidth = '20px';
        defaultHeight = '40px';
        svgContent = `<svg viewBox="0 0 40 40" preserveAspectRatio="none" style="width: 100%; height: 100%; display: block;"><path d="M 15,5 C 30,20 30,20 15,35" fill="none" stroke="black" stroke-width="2"/></svg>`;
    } else if (type === 'TEXT') {
        defaultWidth = '60px';
        defaultHeight = '30px';
        gate.innerHTML = `<div contenteditable="true" class="editable-text">Text</div>`;
    }

    if (type !== 'TEXT') {
        gate.innerHTML = svgContent;
    }

    gate.style.width = defaultWidth;
    gate.style.height = defaultHeight;

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    gate.appendChild(resizeHandle);

    canvas.appendChild(gate);
    setupGateEvents(gate, resizeHandle);
}

/* =====================================
   ゲートのイベント設定
===================================== */
function setupGateEvents(gate, resizeHandle) {
    gate.addEventListener('mousedown', (e) => {
        if (e.target === resizeHandle || mode !== 'select') return;
        
        if (e.target.classList.contains('editable-text') && document.activeElement === e.target) {
            return; 
        }
        
        activeDragElement = gate;
        const rect = gate.getBoundingClientRect();
        
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        
        selectElement(gate);
        e.stopPropagation();
    });

    resizeHandle.addEventListener('mousedown', (e) => {
        if (mode !== 'select') return;
        
        activeResizeElement = gate;
        startWidth = parseInt(window.getComputedStyle(gate).width, 10);
        startHeight = parseInt(window.getComputedStyle(gate).height, 10);
        startMouseX = e.clientX;
        startMouseY = e.clientY;
        
        selectElement(gate);
        e.stopPropagation();
    });
}

/* =====================================
   線のイベント設定（共通化）
===================================== */
function setupLineEvents(lineGroup) {
    lineGroup.addEventListener('mousedown', (evt) => {
        if (mode !== 'select') return;
        
        activeDragElement = evt.currentTarget;
        const vLine = activeDragElement.querySelector('.visible-line');
        
        activeDragElement.startX1 = parseFloat(vLine.getAttribute('x1'));
        activeDragElement.startY1 = parseFloat(vLine.getAttribute('y1'));
        activeDragElement.startX2 = parseFloat(vLine.getAttribute('x2'));
        activeDragElement.startY2 = parseFloat(vLine.getAttribute('y2'));
        
        const cRect = canvas.getBoundingClientRect();
        activeDragElement.startMouseX = evt.clientX - cRect.left;
        activeDragElement.startMouseY = evt.clientY - cRect.top;
        
        selectElement(evt.currentTarget);
        evt.stopPropagation();
    });
}

/* =====================================
   線ツール
==================================== */
function startLineTool() {
    mode = 'line';
    clearSelection();
}

function updateLineCoords(group, x1, y1, x2, y2) {
    const vLine = group.querySelector('.visible-line');
    const hLine = group.querySelector('.hit-line');
    
    if (x1 !== null && y1 !== null) {
        vLine.setAttribute('x1', x1);
        vLine.setAttribute('y1', y1);
        hLine.setAttribute('x1', x1);
        hLine.setAttribute('y1', y1);
    }
    if (x2 !== null && y2 !== null) {
        vLine.setAttribute('x2', x2);
        vLine.setAttribute('y2', y2);
        hLine.setAttribute('x2', x2);
        hLine.setAttribute('y2', y2);
    }
}

/* =====================================
   キャンバスのイベント管理
===================================== */
canvas.addEventListener('mousedown', (e) => {
    const canvasRect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;

    if (mode === 'select') {
        if (e.target === canvas || e.target === svgLayer) {
            clearSelection();
        }
    } else if (mode === 'line') {
        isDrawingLine = true;
        
        currentLineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        currentLineGroup.classList.add('draw-line-group');
        
        const visibleLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        visibleLine.setAttribute('stroke', 'black');
        visibleLine.setAttribute('stroke-width', '2');
        visibleLine.classList.add('visible-line');
        
        const hitLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hitLine.setAttribute('stroke', 'rgba(0,0,0,0)');
        hitLine.setAttribute('stroke-width', '15'); 
        hitLine.style.pointerEvents = 'stroke'; 
        hitLine.classList.add('hit-line');
        hitLine.style.cursor = 'pointer';
        
        currentLineGroup.appendChild(visibleLine);
        currentLineGroup.appendChild(hitLine);
        svgLayer.appendChild(currentLineGroup);
        
        updateLineCoords(currentLineGroup, mouseX, mouseY, mouseX, mouseY);
        setupLineEvents(currentLineGroup);
    }
});

document.addEventListener('mousemove', (e) => {
    const canvasRect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;

    if (activeDragElement) {
        if (activeDragElement.classList.contains('draw-line-group')) {
            const dx = mouseX - activeDragElement.startMouseX;
            const dy = mouseY - activeDragElement.startMouseY;
            
            updateLineCoords(
                activeDragElement,
                activeDragElement.startX1 + dx,
                activeDragElement.startY1 + dy,
                activeDragElement.startX2 + dx,
                activeDragElement.startY2 + dy
            );
            
            if (selectedElement === activeDragElement) {
                showLineHandles(activeDragElement);
            }
        } else {
            activeDragElement.style.left = (mouseX - dragOffsetX) + 'px';
            activeDragElement.style.top = (mouseY - dragOffsetY) + 'px';
        }
    } 
    else if (activeResizeElement) {
        const newWidth = Math.max(10, startWidth + (e.clientX - startMouseX));
        const newHeight = Math.max(10, startHeight + (e.clientY - startMouseY));
        activeResizeElement.style.width = newWidth + 'px';
        activeResizeElement.style.height = newHeight + 'px';
    } 
    else if (isDrawingLine && currentLineGroup) {
        let endX = mouseX;
        let endY = mouseY;
        
        const vLine = currentLineGroup.querySelector('.visible-line');
        const startX = parseFloat(vLine.getAttribute('x1'));
        const startY = parseFloat(vLine.getAttribute('y1'));

        if (e.shiftKey) {
            endY = startY;
        } else if (e.ctrlKey) {
            endX = startX;
        }
        
        updateLineCoords(currentLineGroup, null, null, endX, endY);
    }
    else if (activeLineHandle) {
        let targetX = mouseX;
        let targetY = mouseY;
        const lineGroup = activeLineHandle.lineGroupRef;
        const vLine = lineGroup.querySelector('.visible-line');
        
        if (activeLineHandle.isStart) {
            const endX = parseFloat(vLine.getAttribute('x2'));
            const endY = parseFloat(vLine.getAttribute('y2'));
            if (e.shiftKey) {
                targetY = endY;
            } else if (e.ctrlKey) {
                targetX = endX;
            }
            activeLineHandle.setAttribute('cx', targetX);
            activeLineHandle.setAttribute('cy', targetY);
            updateLineCoords(lineGroup, targetX, targetY, null, null);
        } else {
            const startX = parseFloat(vLine.getAttribute('x1'));
            const startY = parseFloat(vLine.getAttribute('y1'));
            if (e.shiftKey) {
                targetY = startY;
            } else if (e.ctrlKey) {
                targetX = startX;
            }
            activeLineHandle.setAttribute('cx', targetX);
            activeLineHandle.setAttribute('cy', targetY);
            updateLineCoords(lineGroup, null, null, targetX, targetY);
        }
    }
});

document.addEventListener('mouseup', () => {
    activeDragElement = null;
    activeResizeElement = null;
    activeLineHandle = null;

    if (isDrawingLine) {
        isDrawingLine = false;

        if (currentLineGroup) {
            const vLine = currentLineGroup.querySelector('.visible-line');
            const x1 = parseFloat(vLine.getAttribute('x1'));
            const y1 = parseFloat(vLine.getAttribute('y1'));
            const x2 = parseFloat(vLine.getAttribute('x2'));
            const y2 = parseFloat(vLine.getAttribute('y2'));
            
            const distance = Math.hypot(x2 - x1, y2 - y1);
            if (distance < 5) { 
                currentLineGroup.remove();
            }
        }
        
        currentLineGroup = null;
        mode = 'select';
    }
});

/* =====================================
   選択とハンドルの管理
===================================== */
function selectElement(el) {
    clearSelection();
    selectedElement = el;

    if (el.classList.contains('draw-line-group')) {
        const vLine = el.querySelector('.visible-line');
        vLine.setAttribute('stroke', '#ff0000');
        vLine.setAttribute('stroke-width', '3');
        showLineHandles(el);
    } else {
        el.classList.add('selected');
    }
}

function clearSelection() {
    if (selectedElement) {
        if (selectedElement.classList.contains('draw-line-group')) {
            const vLine = selectedElement.querySelector('.visible-line');
            vLine.setAttribute('stroke', 'black');
            vLine.setAttribute('stroke-width', '2');
        } else {
            selectedElement.classList.remove('selected');
        }
        selectedElement = null;
    }
    removeLineHandles();
}

function showLineHandles(lineGroup) {
    removeLineHandles();
    const vLine = lineGroup.querySelector('.visible-line');

    const createHandle = (x, y, isStart) => {
        const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        handle.setAttribute('cx', x);
        handle.setAttribute('cy', y);
        handle.setAttribute('r', 8); 
        handle.style.fill = "white";
        handle.style.stroke = "#0078ff";
        handle.style.strokeWidth = "2";
        handle.style.cursor = "pointer";
        handle.style.pointerEvents = "all";
        handle.classList.add('line-handle');
        
        handle.lineGroupRef = lineGroup;
        handle.isStart = isStart;

        handle.addEventListener('mousedown', (e) => {
            if (mode !== 'select') return;
            activeLineHandle = handle;
            e.stopPropagation();
        });

        svgLayer.appendChild(handle);
        return handle;
    };

    const h1 = createHandle(vLine.getAttribute('x1'), vLine.getAttribute('y1'), true);
    const h2 = createHandle(vLine.getAttribute('x2'), vLine.getAttribute('y2'), false);
    lineHandles.push(h1, h2);
}

function removeLineHandles() {
    lineHandles.forEach(h => h.remove());
    lineHandles = [];
}

/* =====================================
   キーボード操作 (削除・コピー)
===================================== */
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement) {
            selectedElement.remove();
            clearSelection();
        }
        return;
    }

    if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault(); 
        
        if (selectedElement) {
            if (selectedElement.classList.contains('gate')) {
                const clone = selectedElement.cloneNode(true);
                clone.classList.remove('selected');
                
                const currentLeft = parseFloat(selectedElement.style.left || 0);
                const currentTop = parseFloat(selectedElement.style.top || 0);
                clone.style.left = (currentLeft + 20) + 'px';
                clone.style.top = (currentTop + 20) + 'px';
                
                canvas.appendChild(clone);
                
                const resizeHandle = clone.querySelector('.resize-handle');
                setupGateEvents(clone, resizeHandle);
                
                selectElement(clone);
            } 
            else if (selectedElement.classList.contains('draw-line-group')) {
                const clone = selectedElement.cloneNode(true);
                const vLine = clone.querySelector('.visible-line');
                const offset = 20;
                const x1 = parseFloat(vLine.getAttribute('x1')) + offset;
                const y1 = parseFloat(vLine.getAttribute('y1')) + offset;
                const x2 = parseFloat(vLine.getAttribute('x2')) + offset;
                const y2 = parseFloat(vLine.getAttribute('y2')) + offset;
                
                updateLineCoords(clone, x1, y1, x2, y2);
                svgLayer.appendChild(clone);
                setupLineEvents(clone);
                selectElement(clone);
            }
        }
    }
});

/* =====================================
   ヘルプ（使用方法）モーダルの処理
===================================== */
function showHelp() {
    document.getElementById('helpModal').style.display = 'block';
}

function closeHelp() {
    document.getElementById('helpModal').style.display = 'none';
}

// ポップアップの背景（黒い部分）をクリックした時も閉じるようにする
window.addEventListener('click', (e) => {
    const modal = document.getElementById('helpModal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});