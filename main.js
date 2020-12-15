"use strict";

let canvas = document.getElementById("mainCanvas"),
renderer = canvas.getContext("2d"),

cellSize = 30,

map = [],

mapWidth,
mapHeight,

newCellId = 0,

//Cell types
CELLS = {
    EMPTY: 0,
    EMPTY_PLACEABLE: 20,
    IMMOBILE: 40,
    PASSIVE: 60,
    PUSHER: 80
};

/**
 * Fix for the javascript modulo operator
 */
function mod(n, m) {
    return ((n % m) + m) % m;
}

/**
 * Starts the game
 */
function init() {
    //Resizes the canvas
    canvas.width = 300;
    canvas.height = 300;

    //Sets the size of the map in cells
    mapWidth = canvas.width / cellSize,
    mapHeight = canvas.height / cellSize,

    createMap(true);
}

function step() {
    let newMap = deepCopy(map);
    for (let i in map) {
        for (let o in map[i]) {
            switch (map[i][o].type) {
                case CELLS.PUSHER:
                    let pushLoopIndex = 1,
                    toPush = [map[i][o]],
                    moreCells = true;
                    while (true) {
                        let nextPush = undefined;
                        switch (mod(map[i][o].rotation, 4)) {
                            case 0:
                                if (map[parseInt(i) - pushLoopIndex]) {
                                    nextPush = map[parseInt(i) - pushLoopIndex][o];
                                }
                                break;

                            case 1:
                                if (map[i][parseInt(o) + pushLoopIndex]) {
                                    nextPush = map[i][parseInt(o) + pushLoopIndex];
                                }
                                break;

                            case 2:
                                if (map[parseInt(i) + pushLoopIndex]) {
                                    nextPush = map[parseInt(i) + pushLoopIndex][o];
                                }
                                break;

                            case 3:
                                if (map[i][parseInt(o) - pushLoopIndex]) {
                                    nextPush = map[i][parseInt(o) - pushLoopIndex];
                                }
                                break;
                        }
                        if (nextPush && nextPush.type != CELLS.IMMOBILE) {
                            if (nextPush.type == CELLS.EMPTY || nextPush.type == CELLS.EMPTY_PLACEABLE) {
                                for (let cell of toPush) {
                                    switch (mod(map[i][o].rotation, 4)) {
                                        case 0:
                                            newMap[cell.y - 1][cell.x].type = cell.type;
                                            newMap[cell.y - 1][cell.x].rotation = cell.rotation;
                                            newMap[cell.y - 1][cell.x].id = cell.id;
                                            break;
                                        case 1:
                                            newMap[cell.y][cell.x + 1].type = cell.type;
                                            newMap[cell.y][cell.x + 1].rotation = cell.rotation;
                                            newMap[cell.y][cell.x + 1].id = cell.id;
                                            break;
                                        case 2:
                                            newMap[cell.y + 1][cell.x].type = cell.type;
                                            newMap[cell.y + 1][cell.x].rotation = cell.rotation;
                                            newMap[cell.y + 1][cell.x].id = cell.id;
                                            break;
                                        case 3:
                                            newMap[cell.y][cell.x - 1].type = cell.type;
                                            newMap[cell.y][cell.x - 1].rotation = cell.rotation;
                                            newMap[cell.y][cell.x - 1].id = cell.id;
                                            break;
                                    }
                                }
                                if (newMap[map[i][o].y][map[i][o].x].id == map[i][o].id) {
                                    newMap[map[i][o].y][map[i][o].x].type = CELLS.EMPTY;
                                    newMap[map[i][o].y][map[i][o].x].rotation = 0;
                                    newMap[map[i][o].y][map[i][o].x].id = newCellId;
                                    newCellId++;
                                }
                                break;
                            } else if (nextPush.type == CELLS.PUSHER) {
                                moreCells = false;
                            } else {
                                if (moreCells) {
                                    toPush.push(nextPush);
                                }
                            }
                        } else {
                            break;
                        }
                        pushLoopIndex++;
                    }
                    break;

                default:
                    break;
            }
        }
    }
    map = deepCopy(newMap);
    drawMap();
}

/**
 * Populates the map array
 * @param border Whether there should be a border or not
 */
function createMap(border) {
    for (let i = 0; i < mapHeight; i++) {
        map.push([]);
        for (let o = 0; o < mapWidth; o++) {
            let cellType = CELLS.EMPTY;
            if (border && (o == 0 || o == mapWidth - 1 || i == 0 || i == mapHeight - 1)) {
                cellType = CELLS.IMMOBILE;
            }
            map[i].push({x: o, y: i, type: cellType, rotation: 0, id: newCellId});
            newCellId++;
        }
    }
    map[4][2].type = CELLS.PUSHER;
    map[4][2].rotation = 1;
    map[4][3].type = CELLS.PUSHER;
    map[4][3].rotation = 1;
    map[4][4].type = CELLS.PASSIVE;
    map[4][5].type = CELLS.PASSIVE;
    map[5][4].type = CELLS.PUSHER;
    map[5][4].rotation = 0;
    drawMap();
}

/**
 * Draws the map array onto the canvas
 */
function drawMap() {
    clearMap();
    for (let i in map) {
        for (let o in map[i]) {
            drawMapCell(map[i][o].x, map[i][o].y, map[i][o].type, map[i][o].rotation);
        }
    }
}

/**
 * Draws a cell on the map
 * @param x The zero-based map coordinate for the cell
 * @param y The zero-based map coordinate for the cell
 * @param spritePosition The y position on the spritesheet of the cell
 * @param rotation The rotation id of the cell
 */
function drawMapCell(x, y, spritePosition, rotation = 0) {
    if (rotation == 0) {
        renderer.drawImage(document.getElementById("cells"), 0, spritePosition, 20, 20, Math.floor(x * cellSize), Math.floor(y * cellSize), cellSize, cellSize);
    } else {
        renderer.setTransform(1, 0, 0, 1, (x + 1) * cellSize - Math.floor(cellSize / 2), (y + 1) * cellSize - Math.floor(cellSize / 2));
        renderer.rotate(getRotation(rotation));
        renderer.drawImage(document.getElementById("cells"), 0, spritePosition, 20, 20, -Math.floor(cellSize / 2), -Math.floor(cellSize / 2), cellSize, cellSize);
        renderer.setTransform(1, 0, 0, 1, 0, 0);
    }
}

/**
 * Clears the whole map
 */
function clearMap() {
    renderer.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Gets the rotation in radians for a rotation id - 0 is up, 1 is right, 2 is down, 3 is left
 */
function getRotation(rotation) {
    return Math.PI / 2 * mod(rotation, 4);
}

/**
 * Deep copies an array or object
 */
function deepCopy(toCopy) {
    return JSON.parse(JSON.stringify(toCopy));
}

/**
 * Starts the game once the cells are loaded
 */
let loadInterval = setInterval(() => {
    if (imageLoaded) {
        clearInterval(loadInterval);
        init();
    }
}, 10);