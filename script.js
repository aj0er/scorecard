const playersElement = document.getElementById("players");
const addPlayer = document.getElementById("player");
const holes = document.getElementById("holes");
const info = document.getElementById("info");
const win = document.getElementById("win");
const scores = document.getElementById("scores");
const table = document.getElementById("table");

const holeNumber = document.getElementById("holeNumber");
const holeRules = document.getElementById("holeRules");
const holePar = document.getElementById("holePar");

const scoreTable = ["Double Bogey", "Bogey", "Par", "Birdie", "Eagle", "Hole-in-one"];
const scoreTerms = { "0": "Par", "1": "Bogey", "2": "Double Bogey", "-1": "Birdie", "-2": "Eagle"};

const strokesText = "Slag";
const pointsText = "Poäng";

const a11yGame = document.getElementById("a11y-game");

let currentHole = 0;
let totalPointsElement = document.getElementById("totalPointsText");
let currentCourse = null;
let currentCourseUrl = "";
let shortTextMode = false;

let ended = false;
let startHole = 0;

let playerNodes = {};
let players = [];
let largeInputs = false;

const endGameButton = document.getElementById("endGame");
endGameButton.addEventListener("click", endGame);

const holeButton = document.getElementById("holeAction"); 
holeButton.addEventListener("click", () => {
    switch(holeButton.innerText){
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
        holeButton.remove();
        return true;
    } 
    
    return false;
}

/**
 * Startar spelet. Skapar alla spelarkolumner och utför andra DOM-operationer för att sätta upp spelet.
 * Återställer ett tidigare spel om sådant finns sparat.
 * @param {*} start Hålet att börja på
 * @param {*} gamePlayers Lista med spelare som spelet ska innehålla
 * @param {*} largeBoxes Om spelet ska köra i a11y-läge med stora inputrutor
 * @param {*} currentHoleSaved Det nuvarande hålet (används då spelet återställs)
 */
function startGame(start, gamePlayers, largeBoxes, currentHoleSaved = undefined){
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
    largeInputs = largeBoxes;

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

/**
 * Återställer en spelare från tidigare spel. 
 * @param {*} player Spelare att återställa.
 * @param {*} idx Spelarens index i huvudlistan.
 */
function restorePlayer(player, idx){
    let holes = player.store;
    
    for(let i in holes){
        let holeIdx = parseInt(i);
        let hole = holes[holeIdx];
        let holeId = hole.hole;
        let holeValue = hole.value;

        if(idx == 0) // Lägg till hål för första spelaren då antalet hål är samma för alla spelare
            addHole(hole.hole);

        let input = addPlayerInput(player.id);
        input.value = holeValue;
        attachInputInfo(input, player.id, holeId, holeIdx);
        addInputHandler(input);

        let points = calculatePoints(holeValue, currentCourse.court[holeId].par); 
        updatePlayerPointsText(player.id, holeIdx, points);
    }

    updateTotalPointsElement(player);
}

function addInputHandler(input){
    input.addEventListener("change", (e) => handleNumInput(e.target));
}

function endGame(){
    if(ended)
        return;

    if(!confirm("Vill du verkligen avsluta spelet?"))
        return;

    ended = true;
    window.localStorage.removeItem("savedGame"); // Ta bort det sparade spelet då det inte behövs längre

    restoreTableView();
    scrollToTop();

    info.style.display = "none";

    for(let node of Object.values(playerNodes)){ // Inaktivera alla inputrutor
        for(let input of node.querySelectorAll("input")){
            input.disabled = true;
        }
    }

    holeButton.remove();
    endGameButton.disabled = true;

    let prev = 0;
    let winningPlayer = null;
    for(let i in players){ // Hitta spelaren med minst poäng (bäst resultat)
        let player = players[i];
        let points = calculateTotalPointsAndStrokes(player)[0];

        if(i == 0 || points <= prev){
            prev = points;
            winningPlayer = player;
        }
    }

    document.getElementById("winnerName").innerText = `${winningPlayer.name} vann!`;
    win.style.display = "block";

    // Lägg till alla spelares "golftermer", t.ex. "Birdie", "Hole-in-one"
    for(let player of players){
        const scoreMap = generateScoreTermsMap(player);

        let main = document.createElement("div");
        main.appendChild(createTextDiv(createText(player.name)));

        for(let i = 0; i<scoreTable.length; i++){
            let score = scoreMap[scoreTable[i]] ?? 0;
            main.appendChild(createTextDiv(createText(score)));
        }

        scores.appendChild(main);
    }
}

/**
 * Skapar en ny spelarkolumn i tabellen. 
 * Denna innehåller allt om varje spelare, namn, ta bort-knapp, poänginput, totala poäng.
 * Lägger till lämpliga event listeners till olika element.
 * @param {*} player Spelare att skapa kolumn för.
 */
function addPlayerNode(player){
    let main = document.createElement("div");

    // Spelarens namndiv (namn + "ta bort"-knapp)
    let nameDiv = document.createElement("div");
    nameDiv.className = "flex flex-center border";

    let nameText = document.createElement("p");
    let text = document.createTextNode(player.name);
    let removeBtn = document.createElement("b");
    removeBtn.innerText = "X";
    removeBtn.player = player.id;
    removeBtn.style.cursor = "pointer";
    removeBtn.style.marginLeft = "5px";
    removeBtn.addEventListener("click", handleRemovePlayer);

    nameText.appendChild(text);
    nameText.appendChild(removeBtn);

    nameDiv.appendChild(nameText);
    // --------

    // Slag + Poäng text
    let headerDiv = document.createElement("div");
    headerDiv.className = "flex flex-center";

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

function getPlayerHoleElement(playerId, hole){
    let node = playerNodes[playerId];
    return node.children[hole + 2];
}

function updatePlayerPointsText(playerId, hole, value){
    let pointText = getPlayerHoleElement(playerId, hole).children[1].children[0]; // Texten inne i poängdiven
    pointText.innerText = isNaN(value) ? "-" : value.toString();
}

function updatePlayerPointsValue(playerId, hole, value){
    let scoreInput = getPlayerHoleElement(playerId, hole).children[0].children[0];
    scoreInput.value = value;
}

/**
 * Advancerar spelet till nästa hål.
 * Sparar spelets status, scrollar till toppen, visar info om det nya hålet
 */
function nextHole(){
    if(largeInputs)
        restoreTableView();
    
    scrollToTop(); // Scrolla till toppen så att användaren kan se regler för hålet

    currentHole++;
    if(currentHole == currentCourse.court.length) // Börja om på hål 1 igen
        currentHole = 0;

    updateHoleInfo(currentHole);
    saveState();
}

/**
 * Uppdaterar hålinfo som par och regler, uppdaterar även knappen för antingen nästa hål eller fylla i slag. 
 * @param {*} idx Hålets index
 */
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

/**
 * @returns Om slag har fyllts i för det nuvarande hålet.
 */
function hasCurrentInput(){
    let first = players[0].store;
    if(first.length > 0){
        let last = first[first.length - 1];
        return last.hole == currentHole;
    }
    
    return false;
}

/**
 * Lägger till en input för spelaren i tabellen.
 * @param {*} playerId Spelarid att skapa input för.
 * @returns Input-element att mata in slag i.
 */
function addPlayerInput(playerId){
    let player = playerNodes[playerId];
    let playerHole = createPlayerHole();

    let holeEl = playerHole.hole;
    let input = playerHole.input;

    player.insertBefore(holeEl, player.totalPoints); // Lägg till elementet före "Totala poäng"-texten som alltid ska vara sist.
    return input;
}

/**
 * Lägger till information så att input-elementet kan mappas till rätt spelare och hål.
 */
function attachInputInfo(input, playerId, hole, holeIdx){
    input.hole = hole;
    input.player = playerId;
    input.holeIdx = holeIdx;
}

/**
 * Skapar en "hål-rad" vid sidan av poängtabellen med nummer/par
 * @param {*} currentHole Hålet att skapa element för
 */
function addHole(currentHole){
    let hole = currentCourse.court[currentHole];
    holes.insertBefore(createHole(currentHole + 1, hole.par), totalPointsElement);
}

/**
 * Hämtar en spelare beroende på id.
 * @param {*} id Spelarens id
 * @returns Funnen spelare eller null
 */
function getPlayerById(id){
    return players.find(p => p.id == id);
}

/**
 * Skapar ett stort inputelement i a11y-läge (plus/minus knappar)
 * @param {*} playerName Spelarens namn
 * @returns Input-fältet för att mata in poäng
 */
function addLargeInput(playerName){
    let elements = createLargeInput(playerName);
    let main = elements.main;
    let input = elements.input;
    a11yGame.appendChild(main);

    return input;
}

/**
 * Återställer vyn till tabellvyn då spelaret är i a11y-läge.
 */
function restoreTableView(){
    if(!largeInputs)
        return;

    table.style.display = "block";
    a11yGame.innerHTML = "";
}

/**
 * Påbörjar input genom att lägga till inputs för alla spelare.
 * Fokuserar/scrollar så att användaren kan se input-fältet.
 * Lägger till event listener då input ändras.
 */
function startInput(){
    addHole(currentHole);

    let first = true;
    for(let playerId of Object.keys(playerNodes)){
        let player = getPlayerById(playerId);
        let hole = currentHole;
        let holeIdx = holes.children.length - 4;

        let input;

        let normal = addPlayerInput(playerId);
        addInputHandler(normal);
        attachInputInfo(normal, playerId, hole, holeIdx);
        
        if(!largeInputs){
            input = normal; 
        } else {
            table.style.display = "none";
            input = addLargeInput(player.name);
            addInputHandler(input);
            attachInputInfo(input, playerId, hole, holeIdx);
        }

        if(first){
            if(!largeInputs){
                input.focus(); // Fokusera på det första input-elementet
            } else {
                setTimeout(() => {
                    window.scrollTo(0, 300);
                }, 215);
            }

            first = false;
        }

        player.store.push({
            hole: currentHole,
            value: 0,
        });
    }
}

/**
 * Hanterar input då spelaren matar in slag.
 * Detta läggs till på alla input-element i tabellen eller i a11y-läge.
 * 
 * Kalkylerar och uppdaterar spelarens poäng i minnet, uppdaterar lämpliga element i tabellen.
 * @param {*} target Input-element som ändrat värde
 */
function handleNumInput(target){
    let value = parseInt(target.value);

    let playerId = target.player;

    let hole = target.hole;
    let holeIdx = target.holeIdx;

    let par = currentCourse.court[hole].par;
    let player = getPlayerById(playerId);

    player.store[holeIdx].value = value;

    let points = calculatePoints(value, par); 

    if(largeInputs) // Uppdatera värdet i den faktiska tabellen
        updatePlayerPointsValue(playerId, holeIdx, value);

    updatePlayerPointsText(playerId, holeIdx, points);
    updateTotalPointsElement(player);

    saveState();
}

/**
 * Uppdaterar spelarens totala poäng-element genom att först kalkylera totala slag och poäng.
 * @param {*} player Spelare att uppdatera elementet för.
 */
function updateTotalPointsElement(player){
    let totalPointsElement = playerNodes[player.id].totalPoints.children[0]; // p-taggen inne i total points diven
    let totalPoints = calculateTotalPointsAndStrokes(player);
    totalPointsElement.innerText = `${totalPoints[0]} (${totalPoints[1]})`;
}

/**
 * Sparar spelets status i localStorage.
 */
function saveState(){
    let state = {
        players: players,
        startHole: startHole + 1,
        currentHole: currentHole,
        course: currentCourseUrl,
        largeInputs: largeInputs
    }

    window.localStorage.setItem("savedGame", JSON.stringify(state));
}

/**
 * Hanterar eventet då en spelare ska tas bor genom att klicka på knappen brevid hens namn.
 * Tar bort spelarens nod och tar bort hen från spelarlistan. 
 * @param {*} e Event
 */
function handleRemovePlayer(e){
    if(ended)
        return;

    if(players.length == 1){
        alert("Det måste finnas minst en spelare i spelet!");
        return;
    }

    const target = e.target;
    const playerId = target.player;

    let player = getPlayerById(playerId);
    if(!confirm(`Vill du verkligen ta bort spelaren ${player.name}?`))
        return;

    playersElement.removeChild(playerNodes[playerId]);
    delete playerNodes[playerId];
    players = players.filter(p => p.id != playerId);
    saveState();
}

/**
 * Kalkylerar en spelares totala poäng och totala slag genom att iterera över alla hål spelaren varit på.
 * @param {*} player Spelare att kalkylera för
 * @returns En array [totala poäng, totala slag]
 */
function calculateTotalPointsAndStrokes(player){
    let totalStrokes = 0;
    let totalPoints = 0;

    for(let holeInfo of player.store){
        let strokes = holeInfo.value;
        let par = currentCourse.court[holeInfo.hole].par;

        let points = calculatePoints(strokes, par);
        totalStrokes += isNaN(strokes) ? 0 : strokes;
        totalPoints  += isNaN(points) ? 0 : points;
    }

    return [totalPoints, totalStrokes];
}

/**
 * Genererar en map med golfterm -> antalet förekomster hos en viss spelare beroende på skillnaden mellan par.
 * T.ex. birdie = -1, bogey = 1
 * Specialfallet hole-in-one hanteras också.
 *  
 * @param {*} player Spelarobjekt att generera mappen för
 * @returns Lista med varje termsträng mappad till antalet förekomster hos spelarens slag
 */
function generateScoreTermsMap(player){
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