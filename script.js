const canvas = document.getElementById("canvas");

function addGate(type){

```
const gate = document.createElement("div");

gate.className = "gate";
gate.innerText = type;

gate.style.left = "100px";
gate.style.top = "100px";

canvas.appendChild(gate);

makeDraggable(gate);
```

}

function makeDraggable(element){

```
let offsetX = 0;
let offsetY = 0;
let dragging = false;

element.addEventListener("mousedown",(e)=>{

    dragging = true;

    offsetX = e.offsetX;
    offsetY = e.offsetY;
});

document.addEventListener("mousemove",(e)=>{

    if(!dragging) return;

    element.style.left =
        (e.pageX - canvas.offsetLeft - offsetX) + "px";

    element.style.top =
        (e.pageY - canvas.offsetTop - offsetY) + "px";
});

document.addEventListener("mouseup",()=>{

    dragging = false;
});
```

}
