const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const gates = [];

document.getElementById("addAnd").addEventListener("click", () => {
    gates.push({
        x: 100,
        y: 100,
        width: 80,
        height: 50,
        label: "AND"
    });

    draw();
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    gates.forEach(gate => {
        ctx.strokeRect(gate.x, gate.y, gate.width, gate.height);

        ctx.font = "20px Arial";
        ctx.fillText(
            gate.label,
            gate.x + 15,
            gate.y + 30
        );
    });
}