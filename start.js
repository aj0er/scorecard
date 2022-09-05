const courseSelect = document.getElementById("courseSelect");
const courseSelected = document.getElementById("courseSelected");
const selectButton = document.getElementById("selectButton");

const holeList = document.getElementById("holeList");
const finish = document.getElementById("finish");
const course = document.getElementById("course");
const playerList = document.getElementById("playerList");
const removeSaved = document.getElementById("removeSaved");

selectButton.addEventListener("click", selectCourse);

async function selectCourse(){
    if(currentCourse == null){
        currentCourseUrl = courseSelect.value;
        currentCourse = await fetchCourseInfo(currentCourseUrl);

        courseSelected.innerText = currentCourse.name;
        holeList.style.display = "inline";
        selectButton.innerText = "Välj starthål";
        
        courseSelect.style.display = "none";

        holeList.replaceChildren(... currentCourse.court.map(hole => createHoleOption(hole.id)));
    } else {
        course.style.display = "none";
        courseSelected.innerText = currentCourse.name + " - Hål " + holeList.value;
        playerList.appendChild(createPlayerInput());
        finish.style.display = "block"; 
        startCourse(holeList.value);
    }
}

document.getElementById("startButton").addEventListener("click", prepareStart);

(async function(){
    restoreSavedGame();
})();

async function restoreSavedGame(){
    let savedGameStr = window.localStorage.getItem("savedGame");
    if(savedGameStr != null){
        let game = JSON.parse(savedGameStr);
        currentCourse = await fetchCourseInfo(game.course);
        currentCourseUrl = game.course;

        startGame(game.startHole, game.players, game.currentHole);

        removeSaved.style.display = "inline";
        removeSaved.addEventListener("click", () => {
            window.localStorage.removeItem("savedGame");
            location.reload();
        });
    }
}

function prepareStart(){
    playerList.removeChild(playerList.lastChild);
    startHole = parseInt(holeList.value);

    if(isNaN(startHole))
        startHole = 0;

    const players = [];
    let idCounter = 0;
    for(let input of playerList.children){
        if(input.value == "")
            continue;

        players.push({
            id: idCounter,
            name: input.value,
            store: [],
        });

        idCounter++;
    }

    startGame(startHole, players);
}

function startCourse(id){
    for(let el of playerList.children){
       el.addEventListener("input", onPlayerInput);
    }
}  

function onPlayerInput(e){
    let element = e.target;
    let children = Array.from(playerList.children); 
    let index = children.indexOf(element);

    if(index == children.length - 1){
        playerList.appendChild(createPlayerInput());
    } else if(index == children.length - 2){
        let lastChild = children[children.length - 1];
        if(element.value == "" && lastChild.value == ""){
            playerList.removeChild(lastChild);
        }
    }
}

function createPlayerInput(){
    let input = document.createElement("input");
    input.placeholder = "Ange förnamn";
    input.autocomplete = false;
    input.addEventListener("input", onPlayerInput);
    return input;
}

function createHoleOption(id){
    let option = document.createElement("option");
    option.value = id;
    option.innerText = "Hål " + id;
    return option;
}

async function fetchCourseInfo(url){
    let res = await fetch(url);
    if(!res.ok){
        alert("Kunde inte hämta golfbanan, är du ansluten till internet?");
        return;
    }

    return await res.json();
}