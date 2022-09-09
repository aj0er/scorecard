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

function createLargeInput(name){
    let main = document.createElement("div");
    let div = document.createElement("div");
    div.className = "flex";

    let input = createNum();
    input.placeholder = "Slag för " + name;

    let addBtn = document.createElement("div");
    addBtn.className = "largeButton";
    addBtn.innerText = "+";
    addBtn.addEventListener("click", () => {
        let val = parseInt(input.value);
        input.value = isNaN(val) ? 1 : val + 1;
        input.dispatchEvent(new Event("change"));
    });

    let removeBtn = document.createElement("div");
    removeBtn.className = "largeButton";
    removeBtn.innerText = "-";
    removeBtn.addEventListener("click", (e) => {
        let val = parseInt(input.value);
        input.value = isNaN(val) ? -1 : val - 1;
        input.dispatchEvent(new Event("change"));
    });

    div.appendChild(addBtn);
    div.appendChild(input);
    div.appendChild(removeBtn);

    main.appendChild(createText(name));
    main.appendChild(div);

    return {
        main: main,
        input: input
    };
}

function createTextDiv(value){
    let div = document.createElement("div");
    div.className = "flex border";
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

function scrollToTop(){
    window.scrollTo(0, 0);
}

function calculatePoints(strokes, par){
    if(isNaN(strokes))
        return NaN;

    return strokes - par;
}