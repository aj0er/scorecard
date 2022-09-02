const players = document.getElementById("players");
const addPlayer = document.getElementById("player");
const holes = document.getElementById("holes");
const info = document.getElementById("info");
const win = document.getElementById("win");
const scores = document.getElementById("scores");

const holeNumber = document.getElementById("holeNumber");
const holeRules = document.getElementById("holeRules");
const scoreNames = ["Double Bogey", "Bogey", "Par", "Birdie", "Eagle", "Hole-in-one"];

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

        if(currentHole == startHole - 1 || (currentHole == currentCourse.court.length - 1 && startHole == 0)){
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

const playerNames = [];

let shortTextMode = false;

function startGame(){
    playerList.removeChild(playerList.lastChild);
    startHole = parseInt(holeList.value);

    if(isNaN(startHole))
        startHole = 0;
    
    startHole -= 1;
    currentHole = startHole - 1;

    if(playerList.children.length >= 4){ // Det finns många spelare i spelet, använd kortare text för att spara plats
        shortTextMode = true;
        document.getElementById("holeText").innerText = "H";
        document.getElementById("parText").innerText  = "P";
    }

    document.getElementById("game").style.display = "block";
    document.getElementById("start").style.display = "none";

    for(let player of playerList.children){
        if(player.value == "")
            continue;

        playerNames.push(player.value);
    }

    playerNames.forEach(player => {
        addPlayerNode(player, true);
        store.push([]);
    });

    nextHole();
}

function endGame(){
    info.style.display = "none";
    playerNodes.forEach(n => {
        for(let input of n.querySelectorAll("input")){
            input.disabled = true;
            holeButton.disabled = true;
        }
    });

    let winnerIdx = 0;
    let prev = 0;
    for(let playerIdx in playerNodes){
        let points = getTotalPoints(playerIdx);
        if(points < prev){
            prev = points;
            winnerIdx = playerIdx;
        }
    }

    document.getElementById("winnerName").innerText = `${playerNames[winnerIdx]} vann!`;

    for(let playerIdx=0;playerIdx<playerNodes.length;playerIdx++){
        const scoreMap = calculateScores(playerIdx);
        win.style.display = "block";

        let main = document.createElement("div");
        main.appendChild(createTextDiv(createText(playerNames[playerIdx])));

        for(let i=0;i<6;i++){
            let score = scoreMap[scoreNames[i]] ?? 0;
            main.appendChild(createTextDiv(createText(score)));
        }

        scores.appendChild(main);
    }
}

function addPlayerNode(name, first){
    let main = document.createElement("div");
    let nameDiv = document.createElement("div");
    nameDiv.className = "cn flex";

    let nameText = document.createElement("p");
    let text = document.createTextNode(name);
    let removeBtn = document.createElement("b");
    removeBtn.innerText = "X";
    removeBtn.style.cursor = "pointer";
    removeBtn.style.marginLeft = "5px";
    removeBtn.addEventListener("click", removePlayer);

    nameText.appendChild(text);
    nameText.appendChild(removeBtn);

    nameDiv.appendChild(nameText);
    
    let headerDiv = document.createElement("div");
    headerDiv.className = "flex";
    headerDiv.appendChild(createTextDiv(createText(shortTextMode ? "S" : "Slag")));
    let points = createTextDiv(createText(shortTextMode ? "P": "Poäng"));
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
        input.addEventListener("change", handleNumInput);

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

    let par = currentCourse.court[hole].par;

    store[player][holeIdx].value = value;

    let points = calculatePoints(value, par); 
    updatePlayerValue(player, holeIdx, points);

    let totalPointsElement = playerNodes[player].totalPoints.children[0]; // p-taggen inne i total points diven
    totalPointsElement.innerText = getTotalPoints(player);
}

function removePlayer(e){
    if(playerNodes.length == 1){
        alert("Du kan inte ta bort alla spelare!");
        return;
    }

    const target = e.target;
    const playerIdx = playerNodes.indexOf(target.parentNode.parentNode.parentNode);

    players.removeChild(playerNodes[playerIdx]);
    playerNodes.splice(playerIdx, 1);
    playerNames.splice(playerIdx, 1);
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

function calculateScores(playerIdx){
    let map = {};

    for(let holeInfo of store[playerIdx]){
        let strokes = holeInfo.value;
        let par = currentCourse.court[holeInfo.hole].par;

        let diff = strokes - par;
        let desc = ">=3";
        if(diff == 0){
            desc = "Par";
        } else if(diff == 1){
            desc = "Bogey";
        } else if(diff == 2){
            desc = "Double Bogey";
        } else if(strokes == 1){
            desc = "Hole-in-one";
        } else if(diff == -1){
            desc = "Birdie";
        } else if(diff == -2){
            desc = "Eagle";
        }

        map[desc] = (map[desc] ?? 0) + 1;
    }

    return map;
}