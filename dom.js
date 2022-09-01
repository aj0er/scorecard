function createPlayerHole(){
    let valueDiv = document.createElement("div");
    valueDiv.className = "flex";

    let input = createNum();

    valueDiv.appendChild(createTextDiv(input));
    let points = createText("-");
    points.id = "points";

    valueDiv.appendChild(createTextDiv(points));
    return {
        hole: valueDiv,
        input: input,
    };
}

function createTextDiv(value){
    let div = document.createElement("div");
    div.className = "f cn";
    div.appendChild(value);
    return div;
}

function createText(value){
    let p = document.createElement("p");
    p.innerText = value;

    return p;
}

function createNum(){
    let input = document.createElement("input");
    input.type = "number";

    return input;
}