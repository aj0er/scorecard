const players = document.getElementById("players");
const addPlayer = document.getElementById("player");
const holes = document.getElementById("holes");

const holeNumber = document.getElementById("holeNumber");
const holeRules = document.getElementById("holeRules");

let currentHole = -1;
let totalPointsElement = document.getElementById("totalPointsText");
let playerNodes = [];
let store = [];
let currentCourse = null;

let ended = false;
let startHole = 0;

const holeButton = document.getElementById("holeAction"); 
holeButton.addEventListener("click", () => {
    if(ended){
        endGame();
        return;
    }

    if(holeButton.innerText == "Fyll i slag"){
        startInput();

        if(currentHole == startHole - 1){
            ended = true;
            holeButton.innerText = "Avsluta spelet";
            return;
        }

        holeButton.innerText = "Nästa hål";
    } else {
        nextHole();
    }
});

document.getElementById("startButton").addEventListener("click", startGame);

function startGame(){
    startHole = parseInt(holeList.value);

    if(isNaN(startHole))
        startHole = 0;
    
    startHole -= 1;
    currentHole = startHole - 1;

    document.getElementById("game").style.display = "block";
    document.getElementById("start").style.display = "none";

    const players = [];
    for(let player of playerList.children){
        if(player.value == "")
            continue;

        players.push(player.value);
    }

    players.forEach(player => {
        addPlayerNode(player, true);
        store.push([]);
    });

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
}

function updatePlayerValue(playerIdx, hole, value){
    let node = playerNodes[playerIdx];
    let pointText = node.children[hole + 2].children[1].children[0];
    pointText.innerText = isNaN(value) ? "-" : value.toString();
}

function nextHole(){
    window.scrollTo(0, 0); // Scrolla till toppen så att användaren kan se regler för hålet
    currentHole++;
    
    if(currentHole == currentCourse.court.length){
        currentHole = 0;
    }

    let hole = currentCourse.court[currentHole];
    holeRules.innerText = hole.info;
    holeNumber.innerText = `Hål ${currentHole + 1}`;
    holeButton.innerText = "Fyll i slag";
}

function startInput(){
    let hole = currentCourse.court[currentHole];
    holes.insertBefore(createHole(currentHole + 1, hole.par), totalPointsElement);
    let holeIdx = holes.children.length - 4;

    for(let i=0;i<playerNodes.length;i++){
        let player = playerNodes[i];
        let playerHole = createPlayerHole();

        let holeEl = playerHole.hole;
        let input = playerHole.input;
        input.hole = currentHole;
        input.player = i;
        input.holeIdx = holeIdx;
        input.addEventListener("focusout", handleNumInput);

        player.insertBefore(holeEl, player.totalPoints);

        if(i == 0)
            input.focus(); // Fokusera på det första input-elementet

        store[i].push({
            hole: currentHole,
            value: 0,
        });
    }
}

function calculatePoints(strokes, par){
    if(isNaN(strokes))
        return NaN;

    return strokes - par;
}

function handleNumInput(e){
    let target = e.target;
    let value = parseInt(target.value);

    let player = target.player;
    let hole = target.hole;
    let holeIdx = target.holeIdx;

    let par = currentCourse.court[target.hole].par;

    store[player][holeIdx].value = value;

    let points = calculatePoints(value, par); 
    updatePlayerValue(player, holeIdx, points);

    let totalPointsElement = playerNodes[player].totalPoints.children[0]; // p-taggen inne i total points diven
    totalPointsElement.innerText = getTotalPoints(player);
}

function getTotalPoints(playerIdx){
    let total = 0;
    for(let holeInfo of store[playerIdx]){
        let strokes = holeInfo.value;
        let par = currentCourse.court[holeInfo.hole].par;

        let points = calculatePoints(strokes, par);
        total += isNaN(points) ? 0 : points;
    }

    return total;
}