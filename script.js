class Node {
    constructor(img, name, limit, ipAddress=null, subnetMask=null) {
        this.img = img;
        this.name = name;
        this.limit = limit;
        this.connections = 0;
        this.ipAddress = ipAddress;
        this.subnetMask = subnetMask;

        // Forward property access to img
        return new Proxy(this, {
            get(target, prop) {
                if (prop in target) {
                    return target[prop]; // Access Node properties
                }
                if (prop in target.img) {
                    return target.img[prop]; // Access img properties
                }
            },
            set(target, prop, value) {
                if (prop in target) {
                    target[prop] = value; // Set Node properties
                } else if (prop in target.img) {
                    target.img[prop] = value; // Set img properties
                }
                return true;
            }
        });
    }
}

class AdjacencyMatrix {
    constructor() {
        this.length = 0;
        this.matrix = [];
        this.weightedMatrix = [];
    }

    increaseDimension() {
        for (let i=0; i<this.length; i++) {
            this.matrix[i].push(0);
            this.weightedMatrix[i].push(0);
        }
        this.length++;
        this.matrix.push(new Array(this.length).fill(0))
        this.weightedMatrix.push(new Array(this.length).fill(0));
        this.calcWeights();
    }

    remove(...nodeArr) {
        let copy = [];
        let weightedCopy = [];
        let idxArr = nodeArr.map(node => images.indexOf(node));
        for (let i=0; i<this.length; i++) {
            if (idxArr.includes(i)) continue;
            let weightedRow = [];
            let row = [];
            for (let j=0; j<this.length; j++) {
                if (idxArr.includes(j)) continue;
                row.push(this.matrix[i][j]);
                weightedRow.push(this.weightedMatrix[i][j]);
            }
            copy.push(row);
            weightedCopy.push(weightedRow);
        }
        this.matrix = copy;
        this.weightedMatrix = weightedCopy;
        this.length = this.matrix.length;
        this.calcWeights();
    }

    calcWeights() {
        for (let i=0; i<this.length; i++) {
            for (let j=0; j<this.length; j++) {
                if (this.matrix[i][j]) {
                    this.weightedMatrix[i][j] = this.calcDist(nodes[i], nodes[j]);
                } else {
                    this.weightedMatrix[i][j] = -1;
                }
            }
        }
    }

    calcDist(node1, node2) {
        let x1 = parseFloat(node1.style.left);
        let y1 = parseFloat(node1.style.top);
        let x2 = parseFloat(node2.style.left);
        let y2 = parseFloat(node2.style.top);
        return Math.sqrt((x1-x2)**2 + (y1-y2)**2);
    }

    set(i, j) {
        this.matrix[i][j] = 1;
        this.matrix[j][i] = 1;
        nodes[i].connections++;
        nodes[j].connections++;
    }

    clear(i, j) {
        this.matrix[i][j] = 0;
        this.matrix[j][i] = 0;
        nodes[i].connections--;
        nodes[j].connections--;
    }

    dijkstra(src, dest) {
        const distances = new Array(this.length).fill(Infinity);
        const visited = new Array(this.length).fill(false);
        const previous = new Array(this.length).fill(null);
        
        distances[src] = 0;
    
        for (let i = 0; i < this.length; i++) {
            let minDist = Infinity;
            let u = -1;
    
            // Find the unvisited node with the smallest distance
            for (let j = 0; j < this.length; j++) {
                if (!visited[j] && distances[j] < minDist) {
                    minDist = distances[j];
                    u = j;
                }
            }
    
            // If we couldn't find a valid node, break
            if (u === -1) break;
    
            // Mark node as visited
            visited[u] = true;
    
            // Update distances for neighbors
            for (let v = 0; v < this.length; v++) {
                if (this.weightedMatrix[u][v] >= 0 && !visited[v]) {
                    let newDist = distances[u] + this.weightedMatrix[u][v];
                    if (newDist < distances[v]) {
                        distances[v] = newDist;
                        previous[v] = u;
                    }
                }
            }
        }
    
        // If there's no path to the destination
        if (distances[dest] === Infinity) {
            return null;
        }
    
        // Reconstruct the shortest path
        const path = [];
        for (let at = dest; at !== null; at = previous[at]) {
            path.push(at);
        }
        path.reverse();
    
        return path;
    }

    display() {
        console.log("Matrix:");
        console.table(this.matrix);
        console.log("Weighted Matrix:")
        console.table(this.weightedMatrix);
    }
}

var selected;
var selectedR;    // Selected Node with Right Click
var selectedT = { // Selected Node with Open Terminal
    node: null,
    initX: NaN,
    initY: NaN
};
var selectedItem;

var offsetX, offsetY;
var nodes = [];
var images = [];
var cables = [];
var adjMatrix = new AdjacencyMatrix();
var firstNode = true;
var nodeCount = 0;

var selection;
var selectionStart = {x: NaN, y:NaN};
var selectedLst = [];
var offsetLst = [];

var terminal;
var screenClone;
var isModalOpen = false;
var isTerminalOpen = false;

function increaseNodeCount() {
    if (++nodeCount == 1) {
        fallbackMsg.style.transitionDuration = '0s';
        fallbackMsg.style.color = 'rgba(0, 0, 0, 0)';
    }
}

function decreaseNodeCount() {
    if (--nodeCount == 0) {
        fallbackMsg.style.transitionDuration = '1s';
        fallbackMsg.style.color = 'rgba(0, 0, 0, 0.2)';
    }
}

async function sendMsg(src, dest) {
    let i = images.indexOf(src);
    let j = images.indexOf(dest);
    let path = adjMatrix.dijkstra(i, j);
    if (path == null) return;

    // Send Message
    let msg = document.createElement('img');
    msg.classList.add('msg-transfer');
    msg.src = 'assets/images/envelope.png';
    workspace.appendChild(msg);

    for (let i=0; i<path.length; i++) {
        msg.style.top = parseFloat(images[path[i]].style.top) + 16 + 'px';
        msg.style.left = parseFloat(images[path[i]].style.left) + 16 + 'px';
        await new Promise(r => setTimeout(r, 1000));
    }
    await new Promise(r => setTimeout(r, 500));
    workspace.removeChild(msg);

    // Send Acknowledgement
    let ack = document.createElement('img');
    ack.classList.add('msg-transfer');
    ack.src = 'assets/images/ack.png';
    workspace.appendChild(ack);

    for (let i=path.length-1; i>=0; i--) {
        ack.style.top = parseFloat(images[path[i]].style.top) + 16 + 'px';
        ack.style.left = parseFloat(images[path[i]].style.left) + 16 + 'px';
        await new Promise(r => setTimeout(r, 1000));
    }
    await new Promise(r => setTimeout(r, 500));
    workspace.removeChild(ack);
}

function selectItem(item) {
    if (selectedItem) {
        selectedItem.classList.remove('selected');
    }
    selectedItem = item;
    selectedItem.classList.add('selected');
    workspace.style.cursor = 'crosshair';
    if (selectedItem.classList.contains('msg')) {
        nodes.forEach((node) => node.style.cursor = 'crosshair');
    }
}

function deselectItem() {
    if (selectedItem == null) return;
    if (selectedItem.classList.contains('msg')) {
        nodes.forEach((node) => node.style.cursor = 'pointer');
    }
    selectedItem.classList.remove('selected');
    selectedItem = null;
    workspace.style.cursor = '';
}

function handleClick(e) {
    if (e.button != 0) return;
    e.stopPropagation();
    selectItem(e.target)
    workspace.removeEventListener('mouseenter', handleMouseEnter);
    workspace.removeEventListener('mousemove', handleMouseMoveA);
    workspace.removeEventListener('mouseleave', handleMouseLeave);
    selected = null;
    firstNode = true;
}

function handleDragStart(e) {
    this.style.opacity = '0.4';
    selected = e.target;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
    closeContextMenu();
    deselectItem();
    workspace.removeEventListener('mouseenter', handleMouseEnter);
    workspace.removeEventListener('mousemove', handleMouseMoveA);
    workspace.removeEventListener('mouseleave', handleMouseLeave);
    firstNode = true;
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
    fallbackMsg.innerText = 'Now, release the mouse to drop';
}

function handleDragOver(e) {
    e.preventDefault();
    return;
}

function handleDragLeave(e) {
    if (e.target.id != 'workspace') return;
    this.classList.remove('drag-over');
    fallbackMsg.innerText = 'Drag the componets into the workspace to begin';
}

function handleDrop(e) {
    e.stopPropagation(); // stops the browser from redirecting
    this.classList.remove('drag-over');
    fallbackMsg.innerText = 'Drag the componets into the workspace to begin';

    let newImg = document.createElement('img');
    newImg.classList.add('component');
    newImg.classList.add(findType(selected)['name']);
    newImg.src = selected.src;
    newImg.draggable = false;
    newImg.style.top  = e.clientY - offsetY + 'px';
    newImg.style.left = e.clientX - offsetX + 'px';
    newImg.addEventListener('mousedown', handleMouseDown);
    newImg.addEventListener('mouseup', handleMouseUp);
    newImg.addEventListener('contextmenu', handleContextMenu);
    newImg.addEventListener('dragstart', e => e.preventDefault());
    this.appendChild(newImg);
    images.push(newImg);
    let nodeType = findType(selected);
    let node = new Node(newImg, titleCase(nodeType['name']), nodeType['limit']);
    nodes.push(node);
    adjMatrix.increaseDimension();
    increaseNodeCount();

    selected = null;
    return false;
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    selected = null;
}

function resizeCanvas() {
    canvas.width = workspace.offsetWidth;
    canvas.height = workspace.offsetHeight;
    cables.forEach((cable) => {
        drawCable(cable);
    })
}

function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawCable(cable) {
    ctx.beginPath();
    ctx.moveTo(parseFloat(getComputedStyle(cable[0]).left)+32, parseFloat(getComputedStyle(cable[0]).top)+32);
    ctx.lineTo(parseFloat(getComputedStyle(cable[1]).left)+32, parseFloat(getComputedStyle(cable[1]).top)+32);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function refreshCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cables.forEach((cable) => {
        drawCable(cable);
    })
}

function isDuplicate(newCable) {
    let duplicate = false;
    cables.forEach((cable) => {
        if (newCable[0] == cable[0] && newCable[1] == cable[1]) {
            duplicate = true;
        }else if (newCable[0] == cable[1] && newCable[1] == cable[0]) {
            duplicate = true;
        }
    });
    return duplicate;
}

function handleMouseDown(e) {
    if (e.button != 0) return;
    e.stopPropagation();
    if (selected) return;
    if (selectedLst.length == 0) {
        selected = e.target;
        offsetX = e.offsetX;
        offsetY = e.offsetY;
    } else {
        selectedLst.forEach((node) => {
            offsetLst.push({
                x: e.clientX - parseInt(node.style.left) - 2,
                y: e.clientY - parseInt(node.style.top) - 2  // 2px for border width
            })
        });
    }
    if (selectedItem == null) {
        document.addEventListener('mousemove', handleMouseMoveB);
        document.addEventListener('mouseup', handleMouseUpOutside);
    }
    closeContextMenu();
}

function handleMouseUp(e) {
    if (e.button != 0) return;
    if (selectedLst.length > 0) {
        selectedLst.forEach((node) => {
            node.style.cursor = 'pointer';
        });
    }
    if (selected == null) return;
    if (selected.style.cursor == 'move') {
        selected.style.cursor = 'pointer';
        selected = null;
        adjMatrix.calcWeights();
    } else {
        if (selectedR == null) {
            if (firstNode) {
                if (selectedItem) {
                    selected.classList.add('selected');
                } else {
                    workspace.addEventListener('mouseenter', handleMouseEnter);
                    workspace.addEventListener('mousemove', handleMouseMoveA);
                    workspace.addEventListener('mouseleave', handleMouseLeave);
                }
                firstNode = false;
            } else if (selection == null) {
                if (selectedItem) {
                    sendMsg(selected, e.target);
                    selected.classList.remove('selected');
                    selected = null;
                    firstNode = true;
                    deselectItem();
                } else {
                    if (selected != e.target) {
                        let i = images.indexOf(selected);
                        let j = images.indexOf(e.target);
                        if (nodes[i].connections < nodes[i].limit && nodes[j].connections < nodes[j].limit) {
                            adjMatrix.set(i, j);
                            adjMatrix.calcWeights();
                            let cable = [selected, e.target];
                            if (!isDuplicate(cable)) {
                                cables.push(cable);
                            }
                        }
                    }
                    refreshCanvas();
                    
                    if (e.ctrlKey) {
                        selected = e.target;
                    } else if (e.shiftKey) {
                        // Do nothing :)
                    } else {
                        workspace.removeEventListener('mouseenter', handleMouseEnter);
                        workspace.removeEventListener('mousemove', handleMouseMoveA);
                        workspace.removeEventListener('mouseleave', handleMouseLeave);
                        selected = null;
                        firstNode = true;
                    }
                }
            }
        }
    }
    document.removeEventListener('mousemove', handleMouseMoveB);
    document.removeEventListener('mouseup', handleMouseUpOutside);
}

function handleMouseUpOutside(e) {
    if (selected) {
        selected.style.cursor = 'pointer';
        selected = null;
    } else {
        selectedLst.forEach((node) => {
            node.style.cursor = 'pointer';
        });
        removeSelection();
    }
    document.removeEventListener('mousemove', handleMouseMoveB);
    document.removeEventListener('mouseup', handleMouseUpOutside);
}

function handleMouseEnter(e) {
    workspace.addEventListener('mousemove', handleMouseMoveA);
}

function handleMouseMoveA(e) {
    // Creating a new cable
    refreshCanvas();
    drawLine(parseFloat(selected.style.left)+32, parseFloat(selected.style.top)+32, e.clientX-8, e.clientY-8);
}

function handleMouseMoveB(e) {
    // Moving an existing node(s)
    let rect = workspace.getBoundingClientRect();

    if (selected) {
        selected.style.cursor = 'move';

        selected.style.left = e.clientX - offsetX + 'px';
        if (parseFloat(selected.style.left) < 8) {
            selected.style.left = '8px';
        } else if (parseFloat(selected.style.left) > rect.width - 60) {
            selected.style.left = rect.width - 60 + 'px';
        }
        
        selected.style.top = e.clientY - offsetY + 'px';
        if (parseFloat(selected.style.top) < 8) {
            selected.style.top = '8px';
        } else if (parseFloat(selected.style.top) > rect.height - 60) {
            selected.style.top = rect.height - 60 + 'px';
        }
    } else {
        let min = {x: rect.width, y:rect.height, xIdx:-1, yIdx:-1};
        let max = {x: 0, y: 0, xIdx: -1, yIdx:-1};
        for (let i=0; i<selectedLst.length; i++) {
            selectedLst[i].style.cursor = 'move';
            let nodeX = parseInt(selectedLst[i].style.left);
            let nodeY = parseInt(selectedLst[i].style.top);
            if (nodeX < min.x) {
                min.x = nodeX;
                min.xIdx = i;
            }
            if (nodeX > max.x) {
                max.x = nodeX;
                max.xIdx = i;
            }
            if (nodeY < min.y) {
                min.y = nodeY;
                min.yIdx = i;
            };
            if (nodeY > max.y) {
                max.y = nodeY;
                max.yIdx = i;
            }
        }

        // Find the correction
        let correction = {x: 0, y: 0};
        if (e.clientX - offsetLst[min.xIdx].x < 8) {
            correction.x = 8 + offsetLst[min.xIdx].x - e.clientX;
        } else if (e.clientX - offsetLst[max.xIdx].x > rect.width - 60) {
            correction.x = rect.width + offsetLst[max.xIdx].x - e.clientX - 60;
        }
        if (e.clientY - offsetLst[min.yIdx].y < 8) {
            correction.y = 8 + offsetLst[min.yIdx].y - e.clientY;
        } else if (e.clientY - offsetLst[max.yIdx].y > rect.height - 60) {
            correction.y = rect.height + offsetLst[max.yIdx].y - e.clientY - 60;
        }

        // Move all the selected images and apply correction
        for (let i=0; i<selectedLst.length; i++) {
            selectedLst[i].style.left = e.clientX - offsetLst[i].x + correction.x + 'px';
            selectedLst[i].style.top = e.clientY - offsetLst[i].y + correction.y +'px';
        }
    }

    refreshCanvas();
}

function handleMouseDownSelection(e) {
    if (e.button != 0) return;
    workspace.addEventListener('mousemove', handleMouseMoveSelection);
}

function handleMouseMoveSelection(e) {
    if (selection == null) {
        selection = document.createElement('div');
        selection.classList.add('selection');
        selection.style.pointerEvents = 'none';
        selection.style.position = 'absolute';
        selection.style.left = e.clientX + 'px';
        selection.style.top = e.clientY + 'px';
        this.appendChild(selection);
        selectionStart = {x:e.clientX, y:e.clientY};
    }
    if (e.clientX < selectionStart.x) {
        selection.style.left = e.clientX + 'px';
        selection.style.width = selectionStart.x - e.clientX + 'px';
    } else {
        selection.style.width = e.clientX - selectionStart.x + 'px';
    }
    if (e.clientY < selectionStart.y) {
        selection.style.top = e.clientY + 'px';
        selection.style.height = selectionStart.y - e.clientY + 'px';
    } else {
        selection.style.height = e.clientY - selectionStart.y + 'px';
    }
}

function handleMouseUpSelection(e) {
    if (e.button != 0) return;
    if (selection) {
        if (selectedLst.length > 0) {
            removeSelection();
        }
        if (selected) {
            images.forEach((node) => {
                if (selected != node && checkCollisiion(selection, node)) {
                    let i = images.indexOf(selected);
                    let j = images.indexOf(node);
                    if (nodes[i].connections < nodes[i].limit && nodes[j].connections < nodes[j].limit) {
                        adjMatrix.set(i, j);
                        adjMatrix.calcWeights();
                        let cable = [selected, node];
                        if (!isDuplicate(cable)) {
                            cables.push(cable);
                        }
                    }
                }
            });
            workspace.removeEventListener('mouseenter', handleMouseEnter);
            workspace.removeEventListener('mousemove', handleMouseMoveA);
            workspace.removeEventListener('mouseleave', handleMouseLeave);
            selected = null;
            firstNode = true;
            refreshCanvas();
        } else {
            images.forEach((node) => {
                if (checkCollisiion(selection, node)) {
                    node.style.borderColor = 'black';
                    selectedLst.push(node);
                } else {
                    node.style.borderColor = 'transparent';
                }
            })
        }
        this.removeChild(selection);
        selection = null;
        selectionStart = {x:NaN, y:NaN};
    } else {
        removeSelection();
    }
    workspace.removeEventListener('mousemove', handleMouseMoveSelection);
}

function handleMouseLeave(e) {
    refreshCanvas();
    workspace.removeEventListener('mousemove', handleMouseMoveA);
}

function openContextMenu(e) {
    contextMenu.innerHTML = '';
    actions = ['Properties', 'Open Terminal', 'Disconnect', 'Delete'];
    for (let i=0; i<actions.length; i++) {

        // Properties and Open Terminal only available for a single node
        if (['Properties', 'Open Terminal'].includes(actions[i]) && selectedLst.length > 0) continue;

        // Open Terminal only available for computers
        if (actions[i] == 'Open Terminal' && !e.target.classList.contains('computer')) continue;

        // Disconnect only available for connected images
        if (actions[i] == 'Disconnect') {
            let found = false;
            if (selectedLst.length == 0) {
                for (let k=0; k<cables.length; k++) {
                    if (cables[k].includes(e.target)) {
                        found = true;
                        break;
                    }
                }
            } else {
                for (let j=0; j<selectedLst.length; j++) {
                    for (let k=0; k<cables.length; k++) {
                        if (cables[k].includes(selectedLst[j])) {
                            found = true;
                            break;
                        }
                    }
                    if (found) break;
                }
            }
            if (!found) continue;
        }

        // Add the new action into the contextMenu
        let newDiv = document.createElement('div');
        newDiv.innerHTML = actions[i];
        newDiv.addEventListener('click', handleMenuItem);
        contextMenu.appendChild(newDiv);
    }
    contextMenu.classList.add('active');
    selectedR = e.target;
}

function closeContextMenu() {
    contextMenu.classList.remove('active');
    contextMenu.classList.remove('hover-effect');
    if (!isModalOpen && !isTerminalOpen) selectedR = null;
    refreshCanvas();
}

function handleContextMenu(e) {
    e.preventDefault();
    if (selectedR && selectedR == e.target) {
        closeContextMenu();
        return;
    } else {
        workspace.removeEventListener('mouseenter', handleMouseEnter);
        workspace.removeEventListener('mousemove', handleMouseMoveA);
        workspace.removeEventListener('mouseleave', handleMouseLeave);
        selected = null;
        firstNode = true;
        refreshCanvas();

        if (contextMenu.classList.contains('active')) {
            let oldDuration = contextMenu.style.transitionDuration;
            contextMenu.style.transitionDuration = '0s';
            contextMenu.classList.remove('active');
            getComputedStyle(contextMenu).transform; // Force Layout Update
            contextMenu.style.transitionDuration = oldDuration;
        }
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top  = e.clientY + 'px';   
        openContextMenu(e);
    }
    if (!selectedLst.includes(e.target)) {
        removeSelection();
    }
}

function handleMenuItem(e) {
    if (e.target.innerText == 'Properties') {
        openModal();
    } else if (e.target.innerText == 'Open Terminal') {
        openInTerminal(selectedR);
    } else if (e.target.innerText == 'Disconnect') {
        if (selectedLst.length > 0) {
            disconnectNode(...selectedLst);
            removeSelection();
        } else {
            disconnectNode(selectedR);
        }
    } else if (e.target.innerText == 'Delete') {
        if (selectedLst.length > 0) {
            deleteNode(...selectedLst);
            removeSelection();
        } else {
            deleteNode(selectedR);
        }
    }
}

async function timelyUpdate(duration) {
    const FPS = 60;
    let delay = 1000/FPS;
    for (let i=0; i<duration; i+=delay) {
        refreshCanvas();
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
}

function disconnectNode(...nodeArr) {
    nodeArr.forEach((node) => {
        let i = images.indexOf(node);
        for (let j=0; j<adjMatrix.length; j++) {
            adjMatrix.clear(i, j);
        }
        let copy = []
        cables.forEach((cable) => {
            if (!cable.includes(node)) {
                copy.push(cable);
            }
        });
        cables = copy;
    });
    adjMatrix.calcWeights();
    refreshCanvas();
}

function deleteNode(...nodeArr) {
    disconnectNode(...nodeArr);
    nodeArr.forEach((node) => {
        node.classList.add('deleted');
    });
    setTimeout(() => {
        nodeArr.forEach((node) => {
            workspace.removeChild(node);
            decreaseNodeCount();
        });
        adjMatrix.remove(...nodeArr)
        images = images.filter(img => !img.classList.contains('deleted'));
        nodes = nodes.filter(node => !node.classList.contains('deleted'));
    }, 200);
}

function checkCollisiion(rect1, rect2) {
    let style1 = getComputedStyle(rect1);
    let style2 = getComputedStyle(rect2);

    let x1 = parseInt(style1.left);
    let y1 = parseInt(style1.top);
    let w1 = parseInt(style1.width);
    let h1 = parseInt(style1.height);

    let x2 = parseInt(style2.left);
    let y2 = parseInt(style2.top);
    let w2 = parseInt(style2.width);
    let h2 = parseInt(style2.height);

    return (
        x1+w1 >= x2 &&
        x1 <= x2+w2 &&
        y1+h1 >= y2 &&
        y1 <= y2+h2
    );
}

function findType(node) {
    if (node.classList.contains('computer'))
        return {'name': 'computer', 'limit': 1};
    if (node.classList.contains('switch'))
        return {'name': 'switch', 'limit': Infinity};
    if (node.classList.contains('router'))
        return {'name': 'router', 'limit': 2};
    if (node.classList.contains('msg'))
        return {'name': 'msg'};
}

function titleCase(str) {
    return str.toLowerCase().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function removeSelection() {
    selectedLst.forEach((node) => {
        node.style.borderColor = 'transparent';
    });
    selectedLst = [];
    offsetLst = [];
}

function openInTerminal(computer) {
    isTerminalOpen = true;
    selectedT.node = computer;
    selectedT.initX = computer.style.left;
    selectedT.initY = computer.style.top;
    let rect = workspace.getBoundingClientRect();
    computer.src = 'assets/images/monitor.png';
    computer.style.left = rect.width / 2 - 32 + 'px';
    computer.style.top = rect.height / 2 - 32 + 'px';
    computer.style.zIndex = '10';
    computer.style.transition = 'all 500ms ease-in-out';
    computer.classList.add('enlarge');
    timelyUpdate(500);
    document.getElementById('overlay').classList.add('darken');
    setTimeout(() => {
        if (!computer.classList.contains('enlarge')) return; // Terminal got closed
        screenClone = computer.cloneNode();
        screenClone.style.opacity = '0.2';
        screenClone.style.zIndex = '20';
        workspace.appendChild(screenClone);
        terminal = document.createElement('div');
        terminal.classList.add('terminal');
        terminal.style.top = parseFloat(computer.style.top) - 107 + 'px';
        terminal.style.left = parseFloat(computer.style.left) - 187 +'px';
        workspace.appendChild(terminal);
        setTimeout(() => {
            terminal.classList.add('darken');
        }, 50);
        setTimeout(() => {
            if (terminal == null) return; // Terminal got closed
            let loadingImg = document.createElement('img');
            loadingImg.src = 'assets/images/loading.gif';
            loadingImg.classList.add('loading');
            terminal.appendChild(loadingImg);
            setTimeout(() => {
                if (terminal == null) return; // Terminal got closed
                terminal.removeChild(loadingImg);
                let iFrame = document.createElement('iframe');
                iFrame.style.border = 'none';
                iFrame.src = 'terminal.html';
                iFrame.width = '100%';
                iFrame.height = '100%';
                terminal.appendChild(iFrame);
                iFrame.focus();
            }, 1200);
        }, 500);
    }, 500);
}

function closeTerminal() {
    if (!terminal) return;
    let computer = selectedT.node;
    if (!computer.classList.contains('enlarge')) return; // Terminal is already closed
    computer.style.left = selectedT.initX;
    computer.style.top = selectedT.initY;
    if (screenClone) workspace.removeChild(screenClone);
    if (terminal) workspace.removeChild(terminal);
    terminal = null;
    selectedT = {
        node: null,
        initX: NaN,
        initY: NaN
    };
    computer.classList.remove('enlarge');
    timelyUpdate(500);
    document.getElementById('overlay').classList.remove('darken');
    setTimeout(() => {
        computer.style.transition = 'transform 200ms ease-in-out';
        computer.src = 'assets/images/computer.png';
        computer.style.zIndex = '';
    }, 500);
    isTerminalOpen = false;
}

function openModal() {
    modal.style.display = 'block';
    isModalOpen = true;
    let node = nodes[images.indexOf(selectedR)];
    myform['component-name'].value = node.name;
    myform['ip-address'].value = node.ipAddress;
    myform['subnet-mask'].value = node.subnetMask;
}

function closeModal() {
    modal.style.display = 'none';
    selectedR = null;
    isModalOpen = false;
    myform.reset();
}

function isValidIPv4(ip) {
    const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|1?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|1?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|1?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|1?[0-9][0-9]?)$/;
    return ipv4Pattern.test(ip);
}

function getParentInfo() {
    let idx = images.indexOf(selectedR);
    let ipAddress = nodes[idx].ipAddress;
    let subnetMask = nodes[idx].subnetMask;
    if (ipAddress == null) {
        return 'IP Address not assigned to this computer.';
    }
    return `IPv4 Address. . . . . . . . . : ${ipAddress}\nSubnet Mask . . . . . . . . . : ${subnetMask}`;
}

function checkConnectivity(destIP) {
    let srcIdx = images.indexOf(selectedR);
    let destIdx = -1;
    for (let i=0; i<nodes.length; i++) {
        if (nodes[i].ipAddress == destIP) {
            destIdx = i;
            break;
        }
    }
    if (destIdx == -1) return false;

    return Boolean(adjMatrix.dijkstra(srcIdx, destIdx));
}

function getSubnetMask(ip) {
    let firstOctet = parseInt(ip.split('.')[0]);
    if (firstOctet >= 0 && firstOctet <= 127) return '255.0.0.0';  // Class A
    if (firstOctet >= 128 && firstOctet <= 191) return '255.255.0.0';  // Class B
    if (firstOctet >= 192 && firstOctet <= 223) return '255.255.255.0';  // Class C
    return '';
}

const items = document.querySelectorAll('.item');
    items.forEach(function (item) {
    item.addEventListener('click', handleClick);
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
});

const workspace = document.getElementById('workspace')
const myform = document.getElementById('myform');

workspace.addEventListener('dragenter', handleDragEnter);
workspace.addEventListener('dragover', handleDragOver);
workspace.addEventListener('drop', handleDrop);
workspace.addEventListener('dragleave', handleDragLeave);

workspace.addEventListener('mousedown', handleMouseDownSelection);
workspace.addEventListener('mouseup', handleMouseUpSelection);

const contextMenu = document.getElementById('context-menu');
contextMenu.addEventListener('contextmenu', closeContextMenu);
contextMenu.addEventListener('mousemove', (e) => {
    contextMenu.classList.add('hover-effect');
});

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

document.addEventListener('click', (e) => {
    closeContextMenu();
});

document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (!e.target.classList.contains('component')) {
        closeContextMenu();
    }
}, true);

document.addEventListener('keydown', (e) => {
    if (e.key == 'a' && e.ctrlKey) {
        e.preventDefault();
        images.forEach((node) => {
            node.style.borderColor = 'black';
        });
        selectedLst = images.slice(); // copy array
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key == 'Escape' || e.key == 'Control' || e.key == 'Shift') {  
        workspace.removeEventListener('mouseenter', handleMouseEnter);
        workspace.removeEventListener('mousemove', handleMouseMoveA);
        workspace.removeEventListener('mouseleave', handleMouseLeave);
        if (selected) {
            selected.style.cursor = 'pointer';
            selected = null;
            firstNode = true;
            document.removeEventListener('mousemove', handleMouseMoveB);
        }
        refreshCanvas();
        closeContextMenu();
        if (e.key == 'Escape') {
            removeSelection();
            closeTerminal();
            closeModal();
            deselectItem();
        }
    } else if (e.key == 'Delete') {
        deleteNode(...selectedLst);
        removeSelection();
    }
});

const fallbackMsg = document.getElementById('fallback');

const modal = document.getElementById('modal');
const componentNameInput = document.getElementById('component-name');
const ipAddressInput = document.getElementById('ip-address');
const subnetMaskInput = document.getElementById('subnet-mask');

// Close modal when clicking 'X'
document.getElementById('close-btn').addEventListener('click', (e) => {
    closeModal();
});

// Save button action
document.getElementById('save-btn').addEventListener('click', (e) => {
    if (isValidIPv4(ipAddressInput.value)) {
        let idx = images.indexOf(selectedR);
        nodes[idx].name = componentNameInput.value;
        nodes[idx].ipAddress = ipAddressInput.value;
        nodes[idx].subnetMask = subnetMaskInput.value;
        closeModal();
    } else {
        alert('Invalid IP');
    }
});

// Update subnet mask automatically
ipAddressInput.addEventListener('input', () => {
    subnetMaskInput.value = getSubnetMask(ipAddressInput.value);
});