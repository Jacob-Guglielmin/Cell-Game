"use strict";

let canvas = document.getElementById("mainCanvas"),
    renderer = canvas.getContext("2d"),
    backgroundCanvas = document.getElementById("backgroundCanvas"),
    backgroundRenderer = backgroundCanvas.getContext("2d"),

    cellSize = 30,

    placedCells = [],

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
    backgroundCanvas.width = canvas.width;
    backgroundCanvas.height = canvas.height;

    //Sets the size of the map in cells
    mapWidth = canvas.width / cellSize;
    mapHeight = canvas.height / cellSize;

    drawBackground();

    createMap(true);
}

function step() {
    for (let cell of placedCells) {
        switch (cell.type) {
            case CELLS.PUSHER:
                let pushLoopIndex = 1,
                    toPush = [cell.id],
                    moreCells = true;
                while (true) {
                    let nextPush = undefined;
                    switch (mod(cell.rotation, 4)) {
                        case 0:
                            if (cell.y - pushLoopIndex >= 0) {
                                nextPush = getCell(cell.x, cell.y - pushLoopIndex);
                            }
                            break;

                        case 1:
                            if (cell.x + pushLoopIndex < mapWidth) {
                                nextPush = getCell(cell.x + pushLoopIndex, cell.y);
                            }
                            break;

                        case 2:
                            if (cell.y + pushLoopIndex < mapHeight) {
                                nextPush = getCell(cell.x, cell.y + pushLoopIndex);
                            }
                            break;

                        case 3:
                            if (cell.x - pushLoopIndex >= 0) {
                                nextPush = getCell(cell.x - pushLoopIndex, cell.y);
                            }
                            break;
                    }
                    if (nextPush && placedCells[nextPush].type == CELLS.IMMOBILE) {
                        break;
                    } else {
                        if (nextPush == undefined) {
                            for (let cellPushing of toPush) {
                                switch (mod(cell.rotation, 4)) {
                                    case 0:
                                        placedCells[cellPushing].y--;
                                        break;
                                    case 1:
                                        placedCells[cellPushing].x++;
                                        break;
                                    case 2:
                                        placedCells[cellPushing].y++;
                                        break;
                                    case 3:
                                        placedCells[cellPushing].x--;
                                        break;
                                }
                            }
                            break;
                        } else if (placedCells[nextPush].type == CELLS.PUSHER) {
                            if (placedCells[nextPush].rotation == mod(cell.rotation + 2, 4)) {
                                break;
                            } else if (placedCells[nextPush].rotation == cell.rotation) {
                                moreCells = false;
                            } else {
                                toPush.push(nextPush);
                            }
                        } else {
                            if (moreCells) {
                                toPush.push(nextPush);
                            }
                        }
                    }
                    pushLoopIndex++;
                }
                break;

            default:
                break;
        }
    }
    drawMap();
}

/**
 * Populates the map with cells
 * 
 * @param border Whether there should be a border or not
 */
function createMap(border) {
    for (let i = 0; i < mapHeight; i++) {
        for (let o = 0; o < mapWidth; o++) {
            if (border && (o == 0 || o == mapWidth - 1 || i == 0 || i == mapHeight - 1)) {
                placedCells.push({ x: o, y: i, type: CELLS.IMMOBILE, rotation: 0, id: placedCells.length });
            }
        }
    }

    placedCells.push({ x: 2, y: 4, type: CELLS.PUSHER, rotation: 1, id: placedCells.length });
    placedCells.push({ x: 3, y: 4, type: CELLS.PUSHER, rotation: 1, id: placedCells.length });
    placedCells.push({ x: 4, y: 4, type: CELLS.PASSIVE, rotation: 0, id: placedCells.length });
    placedCells.push({ x: 4, y: 3, type: CELLS.PUSHER, rotation: 2, id: placedCells.length });
    placedCells.push({ x: 4, y: 5, type: CELLS.PUSHER, rotation: 0, id: placedCells.length });
    placedCells.push({ x: 5, y: 4, type: CELLS.PASSIVE, rotation: 0, id: placedCells.length });

    drawMap();
}

/**
 * Draws the cells onto the canvas
 */
function drawMap() {
    clearMap();
    for (let cell of placedCells) {
        drawMapCell(cell.x, cell.y, cell.type, cell.rotation, renderer);
    }
}

/**
 * Draws a cell on the map
 * 
 * @param x The zero-based map coordinate for the cell
 * @param y The zero-based map coordinate for the cell
 * @param spritePosition The y position on the spritesheet of the cell
 * @param rotation The rotation id of the cell
 * @param canvasRenderer The renderer to use
 */
function drawMapCell(x, y, spritePosition, rotation = 0, canvasRenderer) {
    if (rotation == 0) {
        canvasRenderer.drawImage(document.getElementById("cells"), 0, spritePosition, 20, 20, Math.floor(x * cellSize), Math.floor(y * cellSize), cellSize, cellSize);
    } else {
        canvasRenderer.setTransform(1, 0, 0, 1, (x + 1) * cellSize - Math.floor(cellSize / 2), (y + 1) * cellSize - Math.floor(cellSize / 2));
        canvasRenderer.rotate(getRotation(rotation));
        canvasRenderer.drawImage(document.getElementById("cells"), 0, spritePosition, 20, 20, -Math.floor(cellSize / 2), -Math.floor(cellSize / 2), cellSize, cellSize);
        canvasRenderer.setTransform(1, 0, 0, 1, 0, 0);
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
 * Gets a cell at coordinates
 * 
 * @return The index of the cell in placedCells (cell ID)
 */
function getCell(x, y) {
    for (let cell in placedCells) {
        if (placedCells[cell].x == x && placedCells[cell].y == y) {
            return parseInt(cell);
        }
    }
}

/**
 * Draws the background
 */
function drawBackground() {
    for (let i = 0; i < mapHeight; i++) {
        for (let o = 0; o < mapWidth; o++) {
            drawMapCell(o, i, CELLS.EMPTY, 0, backgroundRenderer);
        }
    }
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