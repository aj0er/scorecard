const playersElement = document.getElementById("players");
const addPlayer = document.getElementById("player");
const holes = document.getElementById("holes");
const info = document.getElementById("info");
const win = document.getElementById("win");
const scores = document.getElementById("scores");

const holeNumber = document.getElementById("holeNumber");
const holeRules = document.getElementById("holeRules");
const holePar = document.getElementById("holePar");

const scoreTable = ["Double Bogey", "Bogey", "Par", "Birdie", "Eagle", "Hole-in-one"];
const scoreTerms = { "0": "Par", "1": "Bogey", "2": "Double Bogey", "-1": "Birdie", "-2": "Eagle"};

const strokesText = "Slag";
const pointsText = "Poäng";

let currentHole = 0;
let totalPointsElement = document.getElementById("totalPointsText");
let currentCourse = null;
let currentCourseUrl = "";
let shortTextMode = false;

let ended = false;
let startHole = 0;

let playerNodes = {};
let players = [];

const holeButton = document.getElementById("holeAction"); 
holeButton.addEventListener("click", () => {
    switch(holeButton.innerText){
        case "Avsluta spelet":{
            endGame();
            break;
        }

        case "Fyll i slag":{
            startInput();

            if(checkEnd())
                return;

            holeButton.innerText = "Nästa hål";
            break;
        }

        default: {
            nextHole();
        }
    }
});

function checkEnd(){
    if(!hasCurrentInput())
        return;

    if(currentHole == startHole - 1 || (currentHole == currentCourse.court.length - 1 && startHole == 0)){
        holeButton.innerText = "Avsluta spelet";
        return true;
    } 
    
    return false;
}

function startGame(start, gamePlayers, currentHoleSaved = undefined){
    let isRestored = currentHoleSaved != undefined;

    start -= 1;
    
    // Började där det sparade spelet var senast eller i starthålet om inget sparat spel finns
    if(!isRestored){
        currentHole = start; 
    } else {
        currentHole = currentHoleSaved; 
    }

    startHole = start;
    players = gamePlayers;

    if(players.length >= 4){ // Det finns många spelare i spelet, använd kortare text för att spara plats
        shortTextMode = true;

        let holeText = document.getElementById("holeText");
        let parText = document.getElementById("parText");

        holeText.innerText = holeText.innerText.substring(0, 1);
        parText.innerText = parText.innerText.substring(0, 1);
    }

    document.getElementById("game").style.display = "block";
    document.getElementById("start").style.display = "none";

    players.forEach((player, i) => {
        addPlayerNode(player);

        if(isRestored){
            restorePlayer(player, i);
        }
    });

    scrollToTop();

    updateHoleInfo(currentHole);
    checkEnd();
    saveState();
}

function restorePlayer(player, idx){
    let holes = player.store;
    
    for(let i in holes){
        let holeIdx = parseInt(i);
        let hole = holes[holeIdx];
        let holeId = hole.hole;
        let holeValue = hole.value;

        if(idx == 0) // Lägg till hål för första spelaren då antalet hål är samma för alla spelare
            addHole(hole.hole);

        let input = addPlayerInput(player.id, holeId, holeIdx);
        input.value = holeValue;

        let points = calculatePoints(holeValue, currentCourse.court[holeId].par); 
        updatePlayerPointsText(player.id, holeIdx, points);
    }

    updateTotalPoints(player);
}

function endGame(){
    if(ended)
        return;

    ended = true;
    window.localStorage.removeItem("savedGame"); // Ta bort det sparade spelet då det inte behövs längre

    scrollToTop();

    info.style.display = "none";

    for(let node of Object.values(playerNodes)){ // Inaktivera alla inputrutor
        for(let input of node.querySelectorAll("input")){
            input.disabled = true;
        }
    }

    holeButton.disabled = true;

    let prev = 0;
    let winningPlayer = null;
    for(let i in players){ // Hitta spelaren med minst poäng (bäst resultat)
        let player = players[i];
        let points = getTotalPoints(player);

        if(i == 0 || points <= prev){
            prev = points;
            winningPlayer = player;
        }
    }

    document.getElementById("winnerName").innerText = `${winningPlayer.name} vann!`;
    win.style.display = "block";

    // Lägg till alla spelares "golftermer", t.ex. "Birdie", "Hole-in-one"
    for(let player of players){
        const scoreMap = calculateScoreTerms(player);

        let main = document.createElement("div");
        main.appendChild(createTextDiv(createText(player.name)));

        for(let i = 0; i<scoreTable.length; i++){
            let score = scoreMap[scoreTable[i]] ?? 0;
            main.appendChild(createTextDiv(createText(score)));
        }

        scores.appendChild(main);
    }
}

function addPlayerNode(player){
    let main = document.createElement("div");

    // Spelarens namndiv (namn + "ta bort"-knapp)
    let nameDiv = document.createElement("div");
    nameDiv.className = "flex border";

    let nameText = document.createElement("p");
    let text = document.createTextNode(player.name);
    let removeBtn = document.createElement("b");
    removeBtn.innerText = "X";
    removeBtn.player = player.id;
    removeBtn.style.cursor = "pointer";
    removeBtn.style.marginLeft = "5px";
    removeBtn.addEventListener("click", removePlayer);

    nameText.appendChild(text);
    nameText.appendChild(removeBtn);

    nameDiv.appendChild(nameText);
    // --------

    // Slag + Poäng text
    let headerDiv = document.createElement("div");
    headerDiv.className = "flex";

    let strokes = createTextDiv(createText(shortTextMode ? strokesText.substring(0, 1) : strokesText));
    let points  = createTextDiv(createText(shortTextMode ? pointsText.substring(0, 1) : pointsText));
    headerDiv.appendChild(strokes);
    headerDiv.appendChild(points);
    // --------

    main.appendChild(nameDiv);
    main.appendChild(headerDiv);

    // Totala poäng-div, spara referens så att vi kan lägga till element före den
    let totalPoints = createTextDiv(createText("0"));
    main.totalPoints = totalPoints;
    main.appendChild(totalPoints);

    playersElement.appendChild(main);
    playerNodes[player.id] = main;
}

function updatePlayerPointsText(playerId, hole, value){
    let node = playerNodes[playerId];
    let pointText = node.children[hole + 2].children[1].children[0]; // Texten inne i poängdiven
    pointText.innerText = isNaN(value) ? "-" : value.toString();
}

function nextHole(){
    scrollToTop(); // Scrolla till toppen så att användaren kan se regler för hålet

    currentHole++;
    if(currentHole == currentCourse.court.length) // Börja om på hål 1 igen
        currentHole = 0;

    updateHoleInfo(currentHole);
    saveState();
}

function updateHoleInfo(idx){
    let hole = currentCourse.court[idx];
    holeRules.innerText = hole.info;
    holePar.innerText = `(Par ${hole.par})`;
    holeNumber.innerText = `Hål ${idx + 1}`;

    if(hasCurrentInput()){
        holeButton.innerText = "Nästa hål";
    } else {
        holeButton.innerText = "Fyll i slag";
    }
}

function hasCurrentInput(){
    // Kolla om det nuvarande hålet har textrutor, har fyllt i slag.
    let first = players[0].store;
    if(first.length > 0){
        let last = first[first.length - 1];
        return last.hole == currentHole;
    }
    
    return false;
}

function addPlayerInput(playerId, hole, holeIdx){
    let player = playerNodes[playerId];
    let playerHole = createPlayerHole();

    let holeEl = playerHole.hole;
    let input = playerHole.input;
    input.hole = hole;
    input.player = playerId;
    input.holeIdx = holeIdx;
    input.addEventListener("change", handleNumInput);

    player.insertBefore(holeEl, player.totalPoints); // Lägg till elementet före "Totala poäng"-texten som alltid ska vara sist.
    return input;
}

function addHole(currentHole){
    let hole = currentCourse.court[currentHole];
    holes.insertBefore(createHole(currentHole + 1, hole.par), totalPointsElement);
}

function getPlayerById(id){
    return players.find(p => p.id == id);
}

function startInput(){
    addHole(currentHole);

    let first = true;
    for(let playerId of Object.keys(playerNodes)){
        let input = addPlayerInput(playerId, currentHole, holes.children.length - 4);
        if(first){
            input.focus(); // Fokusera på det första input-elementet
            setTimeout(() => window.scrollBy(0, 300), 10);
            first = false;
        }

        getPlayerById(playerId).store.push({
            hole: currentHole,
            value: 0,
        });
    }
}

function handleNumInput(e){
    let target = e.target;
    let value = parseInt(target.value);

    let playerId = target.player;

    let hole = target.hole;
    let holeIdx = target.holeIdx;

    let par = currentCourse.court[hole].par;
    let player = getPlayerById(playerId);

    player.store[holeIdx].value = value;

    let points = calculatePoints(value, par); 
    updatePlayerPointsText(playerId, holeIdx, points);

    updateTotalPoints(player);
    saveState();
}

function updateTotalPoints(player){
    let totalPointsElement = playerNodes[player.id].totalPoints.children[0]; // p-taggen inne i total points diven
    totalPointsElement.innerText = getTotalPoints(player);
}

function saveState(){
    let state = {
        players: players,
        startHole: startHole + 1,
        currentHole: currentHole,
        course: currentCourseUrl
    }

    window.localStorage.setItem("savedGame", JSON.stringify(state));
}

function removePlayer(e){
    if(ended)
        return;

    if(players.length == 1){
        alert("Det måste finnas minst en spelare i spelet!");
        return;
    }

    const target = e.target;
    const playerId = target.player;

    playersElement.removeChild(playerNodes[playerId]);
    delete playerNodes[playerId];
    players = players.filter(p => p.id != playerId);
    saveState();
}

function getTotalPoints(player){
    let total = 0;

    for(let holeInfo of player.store){
        let strokes = holeInfo.value;
        let par = currentCourse.court[holeInfo.hole].par;

        let points = calculatePoints(strokes, par);
        total += isNaN(points) ? 0 : points;
    }

    return total;
}

function calculateScoreTerms(player){
    let map = {};

    for(let holeInfo of player.store){
        let strokes = holeInfo.value;
        let par = currentCourse.court[holeInfo.hole].par;

        let diff = strokes - par;

        let term;
        if(strokes == 1){
            term = "Hole-in-one";
        } else {
            term = scoreTerms[diff.toString()] ?? "";
        }

        map[term] = (map[term] ?? 0) + 1; // Incrementa det tidigare värdet eller lägg till ett nytt
    }

    return map;
}