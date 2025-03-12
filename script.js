var selected;
var offsetX, offsetY;
var cables = [];
var firstNode = true;

function handleDragStart(e) {
    this.style.opacity = '0.4';
    selected = e.target;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
}

function handleDragEnter(e) {
    this.style.backgroundColor = '#F0FFFF';
}

function handleDragOver(e) {
    e.preventDefault();
    return;
}

function handleDragLeave(e) {
    this.style.backgroundColor = 'white';
}

function handleDrop(e) {
    e.stopPropagation(); // stops the browser from redirecting
    this.style.backgroundColor = 'white';

    let newImg = document.createElement('img');
    newImg.classList.add('component');
    newImg.src = selected.src;
    newImg.draggable = false;
    newImg.style.top  = e.clientY - offsetY + 'px';
    newImg.style.left = e.clientX - offsetX + 'px';
    newImg.addEventListener('mousedown', handleMouseDown);
    newImg.addEventListener('mouseup', handleMouseUp);
    this.appendChild(newImg);

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
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawCable(cable) {
    ctx.beginPath();
    ctx.moveTo(parseFloat(cable[0].style.left)+32, parseFloat(cable[0].style.top)+32);
    ctx.lineTo(parseFloat(cable[1].style.left)+32, parseFloat(cable[1].style.top)+32);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
}

function isDuplicate(newCable) {
    let duplicate = false;
    cables.forEach((cable) => {
        if (newCable[0] == cable[0] && newCable[1] == cable[1]) {
            duplicate = true;
            return;
        }
        if (newCable[0] == cable[1] && newCable[1] == cable[0]) {
            duplicate = true;
            return;
        }
    });
    return duplicate;
}

function handleMouseDown(e) {
    if (selected) return;
    selected = e.target;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
    document.addEventListener('mousemove', handleMouseMoveB);
    document.addEventListener('mouseup', handleMouseUpOutside);
}

function handleMouseUp(e) {
    if (selected.style.cursor == 'move') {
        selected.style.cursor = 'pointer';
        selected = null;
    } else {
        if (firstNode) {
            workspace.addEventListener('mouseenter', handleMouseEnter);
            workspace.addEventListener('mousemove', handleMouseMoveA);
            workspace.addEventListener('mouseleave', handleMouseLeave);
            firstNode = false;
        } else {
            if (selected != e.target) {
                let cable = [selected, e.target];
                if (!isDuplicate(cable)) {
                    cables.push(cable);
                }
            }
    
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            cables.forEach((cable) => {
                drawCable(cable);
            })
    
            workspace.removeEventListener('mouseenter', handleMouseEnter);
            workspace.removeEventListener('mousemove', handleMouseMoveA);
            workspace.removeEventListener('mouseleave', handleMouseLeave);
            selected = null;
            firstNode = true;
        }
    }
    document.removeEventListener('mousemove', handleMouseMoveB);
    document.removeEventListener('mouseup', handleMouseUpOutside);
}

function handleMouseUpOutside(e) {
    selected.style.cursor = 'pointer';
    selected = null;
    document.removeEventListener('mousemove', handleMouseMoveB);
    document.removeEventListener('mouseup', handleMouseUpOutside);
}

function handleMouseEnter(e) {
    workspace.addEventListener('mousemove', handleMouseMoveA);
}

function handleMouseMoveA(e) {
    // Creating a new cable
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cables.forEach((cable) => {
        drawCable(cable);
    })
    drawLine(parseFloat(selected.style.left)+32, parseFloat(selected.style.top)+32, e.clientX, e.clientY);
}

function handleMouseMoveB(e) {
    selected.style.cursor = 'move';
    let rect = workspace.getBoundingClientRect();

    // Moving an existing node
    selected.style.left = e.clientX - offsetX + 'px';
    if (parseFloat(selected.style.left) < 8) {
        selected.style.left = '8px';
    } else if (parseFloat(selected.style.left) > rect.width - 56) {
        selected.style.left = rect.width - 56 + 'px';
    }
    
    selected.style.top = e.clientY - offsetY + 'px';
    if (parseFloat(selected.style.top) < 8) {
        selected.style.top = '8px';
    } else if (parseFloat(selected.style.top) > rect.height - 56) {
        selected.style.top = rect.height - 56 + 'px';
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cables.forEach((cable) => {
        drawCable(cable);
    })
}

function handleMouseLeave(e) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cables.forEach((cable) => {
        drawCable(cable);
    })
    workspace.removeEventListener('mousemove', handleMouseMoveA);
}

let items = document.querySelectorAll('.item');
    items.forEach(function (item) {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
});

workspace = document.getElementById('workspace')
workspace.addEventListener('dragenter', handleDragEnter);
workspace.addEventListener('dragover', handleDragOver);
workspace.addEventListener('drop', handleDrop);
workspace.addEventListener('dragleave', handleDragLeave);

canvas = document.querySelector('canvas');
ctx = canvas.getContext('2d');
window.addEventListener("resize", resizeCanvas);
resizeCanvas();