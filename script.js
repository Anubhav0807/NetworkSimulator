var selected;
var offsetX, offsetY;

function handleDragStart(e) {
    this.style.opacity = '0.4';
    selected = e.target;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
    console.log(`${offsetX} ${offsetY}`);
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
    this.appendChild(newImg);

    selected = null;
    return false;
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    selected = null;
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