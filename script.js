var selected;
var offsetX, offsetY;
var cables = [];

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
    newImg.addEventListener('click', handleClick);
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
        drawDiagonal(cable[0], cable[1], cable[2], cable[3]);
    })
}

function drawDiagonal(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
}

function isDuplicate(newCable) {
    let duplicate = false;
    cables.forEach((cable) => {
        if (newCable[0] == cable[0] && newCable[1] == cable[1] && newCable[2] == cable[2] && newCable[3] == cable[3]) {
            duplicate = true;
            return;
        }
        if (newCable[0] == cable[2] && newCable[1] == cable[3] && newCable[2] == cable[0] && newCable[3] == cable[1]) {
            duplicate = true;
            return;
        }
    });
    return duplicate;
}

function handleClick(e) {
    if (selected) {
        
        if (selected != e.target) {
            let cable = [
                parseFloat(selected.style.left)+32, 
                parseFloat(selected.style.top)+32,
                parseFloat(e.target.style.left)+32,
                parseFloat(e.target.style.top)+32,
            ];
            if (!isDuplicate(cable)) {
                cables.push(cable);
            }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cables.forEach((cable) => {
            drawDiagonal(cable[0], cable[1], cable[2], cable[3]);
        })

        workspace.removeEventListener('mouseenter', handleMouseEnter);
        workspace.removeEventListener('mousemove', handleMouseMove);
        workspace.removeEventListener('mouseleave', handleMouseLeave);
        selected = null;

        return;
    }
    selected = e.target;
    workspace.addEventListener('mouseenter', handleMouseEnter);
    workspace.addEventListener('mousemove', handleMouseMove);
    workspace.addEventListener('mouseleave', handleMouseLeave);
}

function handleMouseEnter(e) {
    workspace.addEventListener('mousemove', handleMouseMove);
}

function handleMouseMove(e) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cables.forEach((cable) => {
        drawDiagonal(cable[0], cable[1], cable[2], cable[3]);
    })
    drawDiagonal(parseFloat(selected.style.left)+32, parseFloat(selected.style.top)+32, e.clientX, e.clientY);
}

function handleMouseLeave(e) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cables.forEach((cable) => {
        drawDiagonal(cable[0], cable[1], cable[2], cable[3]);
    })
    workspace.removeEventListener('mousemove', handleMouseMove);
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