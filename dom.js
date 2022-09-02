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
    input.min = 1;

    return input;
}

function createHole(hole, par){
    let main = document.createElement("div");
    main.className = "flex";
    main.appendChild(createTextDiv(createText(hole)));
    main.appendChild(createTextDiv(createText(par)));
    return main;
}