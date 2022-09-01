const players = document.getElementById("players");
const addPlayer = document.getElementById("player");
const holes = document.getElementById("holes");

const holeNumber = document.getElementById("holeNumber");
const holeRules = document.getElementById("holeRules");

let currentHole = -1;
let activeInputs = [];
let totalPointsElement = document.getElementById("totalPointsText");
let playerNodes = [];
let store = [];
let currentCourse = null;

const holeButton = document.getElementById("holeAction"); 
holeButton.addEventListener("click", () => {
    if(holeButton.innerText == "Fyll i slag"){
        startInput();
        holeButton.innerText = "Nästa hål";
    } else {
        nextHole();
    }
});

document.getElementById("startButton").addEventListener("click", startGame);

function startGame(){
    document.getElementById("game").style.display = "block";
    document.getElementById("start").style.display = "none";

    const players = [];
    for(let player of playerList.children){
        if(player.value == "")
            continue;

        players.push(player.value);
    }

    players.forEach(player => addPlayerNode(player, true));
    nextHole();
}

function addPlayerNode(name, first){
    let main = document.createElement("div");
    let nameDiv = document.createElement("div");
    nameDiv.className = "cn flex";
    nameDiv.appendChild(createText(name));
    
    let headerDiv = document.createElement("div");
    headerDiv.className = "flex";
    headerDiv.appendChild(createTextDiv(createText("Slag")));
    let points = createTextDiv(createText("Poäng"));
    headerDiv.appendChild(points);

    main.appendChild(nameDiv);
    main.appendChild(headerDiv);

    let totalPoints = createTextDiv(createText("0"));
    main.totalPoints = totalPoints;
    main.appendChild(totalPoints);

    players.appendChild(main);
    playerNodes.push(main);
    store.push([]);
}

function updatePlayerValue(playerIdx, hole, value){
    let node = playerNodes[playerIdx];
    let pointText = node.children[hole + 2].children[1].children[0];
    pointText.innerText = isNaN(value) ? "-" : value.toString();
}

function createHole(hole, par){
    let main = document.createElement("div");
    main.className = "flex";
    main.appendChild(createTextDiv(createText(hole)));
    main.appendChild(createTextDiv(createText(par)));
    return main;
}

function nextHole(){
    currentHole++;

    if(currentCourse.court.length == currentHole){
        alert("Slut!");
        return;
    }

    let hole = currentCourse.court[currentHole];
    holeRules.innerText = hole.info;
    holeNumber.innerText = `Hål ${currentHole + 1}`;
    holeButton.innerText = "Fyll i slag";
}

function startInput(){
    let hole = currentCourse.court[currentHole];
    holes.insertBefore(createHole(currentHole + 1, hole.par), totalPointsElement);

    activeInputs = [];
    for(let i=0;i<playerNodes.length;i++){
        let player = playerNodes[i];
        let playerHole = createPlayerHole();

        let holeEl = playerHole.hole;
        let input = playerHole.input;
        input.hole = currentHole;
        input.player = i;

        activeInputs.push(input);
        input.addEventListener("focusout", handleNumInput);
        player.insertBefore(holeEl, player.totalPoints);
        store[i].push(0);
    }

    activeInputs[0].focus();
}

function calculatePoints(strokes, par){
    if(isNaN(strokes))
        return NaN;

    return strokes - par;
}

function handleNumInput(e){
    let target = e.target;
    let index = activeInputs.indexOf(target);
    if(index != -1){
        if(index != activeInputs.length - 1){
            activeInputs[index + 1].focus();
        } else {
            // Rensa inputfälten då vi nått slutet av raden, vi vill inte börja om från början om man vill ändra individuella fält.
            activeInputs = [];
        }
    }

    value = parseInt(target.value);

    store[target.player][target.hole] = isNaN(value) ? 0 : value;

    let par = currentCourse.court[target.hole].par;
    let points = calculatePoints(value, par); 
    updatePlayerValue(target.player, target.hole, points);

    playerNodes[target.player].totalPoints.children[0].innerText = getTotalPoints(target.player);
}

function getTotalPoints(playerIdx){
    let total = 0;
    for(let hole in store[playerIdx]){
        strokes = store[playerIdx][hole];
        total += calculatePoints(strokes, currentCourse.court[hole].par);
    }

    return total;
}