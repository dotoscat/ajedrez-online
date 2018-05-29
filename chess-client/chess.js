// Copyright (C) 2018  Oscar 'dotoscat' Garcia

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

'use strict';

const PieceMoves = {
    WHITE_PAWN: {
        type: 'pawn',
        moves: [
            [0, 1],
            [0, 2]
        ],
        attacks: [
            [1, 1],
            [-1, 1]
        ]
    },
    BLACK_PAWN: {
        type: 'pawn',
        moves: [
            [0, -1],
            [0, -2]
        ],
        attacks: [
            [1, -1],
            [-1, -1]
        ]
    },
    ROOK: {
        type: 'range',
        directions: [ 
            [1, 0],
            [-1, 0],
            [0, -1],
            [0, 1]
        ]
    },
    BISHOP: {
        type: 'range',
        directions: [ 
            [1, 1],
            [-1, -1],
            [1, -1],
            [-1, 1]
        ]
    },
    KING: {
        type: 'range',
        directions: [ 
            [1, 1],
            [-1, 1],
            [1, -1],
            [-1, -1],
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ],
        times: 1
    },
    QUEEN: {
        type: 'range',
        directions: [ 
            [1, 1],
            [-1, 1],
            [1, -1],
            [-1, -1],
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ],
    },
    KNIGHT: {
        type: 'knight',
        moves: [
            [1, 2],
            [-1, 2],
            [-1, -2],
            [1, -2],
            [2, 1],
            [-2, 1],
            [-2, -1],
            [2, -1],
        ]
    }
}

const WhitePiece = {
    KING: {text: "\u2654", moves: PieceMoves.KING},
    QUEEN: {text: "\u2655", moves: PieceMoves.QUEEN},
    ROOK: {text: "\u2656", moves: PieceMoves.ROOK},
    BISHOP: {text: "\u2657", moves: PieceMoves.BISHOP},
    KNIGHT: {text: "\u2658", moves: PieceMoves.KNIGHT},
    PAWN: {text: "\u2659", moves: PieceMoves.WHITE_PAWN},
};

const BlackPiece = {
    KING: {text: "\u265A", moves: PieceMoves.KING},
    QUEEN: {text: "\u265B", moves: PieceMoves.QUEEN},
    ROOK: {text: "\u265C", moves: PieceMoves.ROOK},
    BISHOP: {text: "\u265D", moves: PieceMoves.BISHOP},
    KNIGHT: {text: "\u265E", moves: PieceMoves.KNIGHT},
    PAWN: {text: "\u265F", moves: PieceMoves.BLACK_PAWN},
};

const FENConversion = {
    'K': WhitePiece.KING,
    'Q': WhitePiece.QUEEN,
    'R': WhitePiece.ROOK,
    'B': WhitePiece.BISHOP,
    'N': WhitePiece.KNIGHT,
    'P': WhitePiece.PAWN,
    'k': BlackPiece.KING,
    'q': BlackPiece.QUEEN,
    'r': BlackPiece.ROOK,
    'b': BlackPiece.BISHOP,
    'n': BlackPiece.KNIGHT,
    'p': BlackPiece.PAWN,
};

class Tile {
    constructor(file, rank) {
        this.name = file + rank;
        this.piece = null;
        this.x = 0;
        this.y = 0;
    }
}

function pawnMoves(x, y, piece, tiles) {
    const WHITE_PAWNS_ORIGIN = 1;
    const BLACK_PAWNS_ORIGIN = 6;
    const validMoves = [];
    for (let move of piece.moves.moves){
        const newX = x + move[0];
        const newY = y + move[1];
        console.log(newX, newY, move);
        if (!(newY >= 0 && newY < tiles.length
            && newX >= 0 && newX < tiles[newY].length)){
            continue;
        }
        if (tiles[newY][newX].piece === null){
            validMoves.push([newX, newY]);
            if ((piece === WhitePiece.PAWN && y !== WHITE_PAWNS_ORIGIN)
                || piece === BlackPiece.PAWN && y !== BLACK_PAWNS_ORIGIN){
                break;
            }
        }else{
            break;
        }
    }
    for (let attack of piece.moves.attacks){
        const newX = x + attack[0];
        const newY = y + attack[1];
        console.log(attack, newX, newY);
        if (!(newY >= 0 && newY < tiles.length
            && newX >= 0 && newX < tiles[newY].length)){
            continue;
        }
        if (tiles[newY][newX].piece === null){
            continue;
        }
        const otherPiece = tiles[newY][newX].piece;
        if (Object.values(WhitePiece).includes(otherPiece)
            !== Object.values(WhitePiece).includes(piece)){
                validMoves.push([newX, newY]);
            }
    }
    return validMoves;
}

function isWhitePiece(piece){
    return Object.values(WhitePiece).includes(piece);
}

function knightMoves(x, y, piece, tiles){
    const validMoves = [];
    for(let move of piece.moves.moves){
        const newX = x + move[0];
        const newY = y + move[1];
        if (!(newY >= 0 && newY < tiles.length
            && newX >= 0 && newX < tiles[newY].length)){
            continue;
        }
        const otherPiece = tiles[newY][newX].piece;
        
        if (otherPiece === null
            || (Object.values(WhitePiece).includes(otherPiece)
            !== Object.values(WhitePiece).includes(piece))){
                validMoves.push([newX, newY]);
        }
    }
    return validMoves;
}

function checkNextMove(x, y, direction, piece, tiles, validMoves, times){
    const newX = x + direction[0];
    const newY = y + direction[1];
    times = typeof times === "number" ? times : -1;
    if (times === 0){
        return validMoves;
    }
    if (!(0 <= newY && newY < tiles.length && 0 <= newX && newX < tiles[newY].length)){
        return validMoves;
    }
    const otherPiece = tiles[newY][newX].piece;
    const isPieceWhite = Object.values(WhitePiece).includes(piece);
    const isOtherPieceWhite = Object.values(WhitePiece).includes(otherPiece);
    if (otherPiece && isPieceWhite === isOtherPieceWhite){
        return validMoves;
    }else if (otherPiece && isPieceWhite !== isOtherPieceWhite){
        validMoves.push([newX, newY]);
        return validMoves;
    }
    validMoves.push([newX, newY]);
    return checkNextMove(newX, newY, direction, piece, tiles, validMoves, times-1);
}

function rankMoves(x, y, piece, tiles){
    const validMoves = [];
    for(let direction of piece.moves.directions){
        const times = typeof piece.moves.times === "number" ? piece.moves.times : -1;
        checkNextMove(x, y, direction, piece, tiles, validMoves, times);
        console.log("direction", direction);
    }
    return validMoves;
}

class Board {
    constructor(FENdata) {
        this.tiles = new Array(8);
        this.tileMap = new Map();
        const files = "abcdefgh";
        for (let y = 0; y < 8; y += 1){
            this.tiles[y] = new Array(8);
            for (let x = 0; x < 8; x += 1) {
                const tile = new Tile(files[x], y+1);
                this.tiles[y][x] = tile;
                tile.x = x;
                tile.y = y;
                this.tileMap.set(tile.name, tile); 
            }
        }
        if (typeof FENdata === "string"){
            this.setFromFEN(FENdata);
        }
    }
    
    setFromFEN(data){
        const positions = data.split(' ')[0];
        const ranks = positions.split('/').reverse();
        for (let y = 0; y < ranks.length; y += 1){
            const rank = ranks[y];
            for (let x = 0, r = 0; r < rank.length; r += 1) {
                const value = rank[r];
                const number = Number(value);
                if (Number.isNaN(number)) {
                    const piece = FENConversion[value];
                    this.tiles[y][x].piece = piece;
                    x += 1;
                } else {
                    for (let i = 0; i < number; x += 1, i += 1)
                        this.tiles[y][x].piece = null;
                }
            }
        }
    }
    
    getValidMovesOf(x, y){
        if (y < 0 || y >= this.tiles.length
            || x < 0 || x >= this.tiles[y].length){
            return null;
        }
        const piece = this.tiles[y][x].piece;
        if (piece === null || !piece.moves){
            return null;
        }
        let validMoves = null;
        console.log("getValidMovesOf", x, y)
        switch(piece.moves.type){
            case 'pawn':
                validMoves = pawnMoves(x, y, piece, this.tiles);
            break;
            case 'knight':
                validMoves = knightMoves(x, y, piece, this.tiles);
            break;
            case 'range':
                validMoves = rankMoves(x, y, piece, this.tiles);
            break;
        }
        return validMoves;
    }

    hasPiece(x, y) {
        if (y < 0 || y >= this.tiles.length
            || x < 0 || x >= this.tiles[y].length){
            return false;
        }
        return this.tiles[y][x].piece !== null;
    }

    takePiece(x, y){
        if (y < 0 || y >= this.tiles.length
            || x < 0 || x >= this.tiles[y].length){
            return null;
        }
        const piece = this.tiles[y][x].piece;
        this.tiles[y][x].piece = null;
        return piece;
    }

    putPiece(x, y, piece){
        const droppedPiece = this.takePiece(x, y);
        this.tiles[y][x].piece = piece;
        return droppedPiece;
    }

    movePiece(from, to){
        const piece = this.takePiece(from.x, from.y);
        return this.putPiece(to.x, to.y, piece);
    }

    getTile(x, y){
        return this.tiles[y][x];
    }

    getTileNameFromXY(x, y){
        return this.getTile(x, y).name;
    }

    getTileByName(name){
        return this.tileMap.get(name);
    }

}

class BoardViewer {
    constructor (drawarea, board, tileSize, conn) {
        this.conn = conn;
        this.board = board;
        this.tileSize = typeof tileSize !== "undefined" ? tileSize : 64;
        this.drawarea = drawarea;
        this.boardWidth = this.tileSize*8;
        this.boardHeight = this.tileSize*8;
        this.dragOrigin = null;
        this.dragPiece = null;
        this.validMoves = null;
        this.currentMoves = null;
        this.lastPos = null;
        this.newPos = null;
        this.block = true;
        this.assignedColor = null;
        drawarea.width = this.tileSize*8+this.tileSize/2.;
        drawarea.height = this.tileSize*8+this.tileSize/2.;
        drawarea.addEventListener("mousedown", this.onMouseDown.bind(this));
        drawarea.addEventListener("mousemove", this.onMouseMove.bind(this));
        drawarea.addEventListener("mouseup", this.onMouseUp.bind(this));
        drawarea.addEventListener("mouseleave", this.onMouseLeave.bind(this));
        this.drawarea.getContext("2d").font = this.tileSize + "px Verdana";
    }

    get height(){
        return this.drawarea.offsetHeight;
    }

    draw(){
        this.drawarea.getContext('2d')
        .clearRect(0, 0, this.drawarea.width, this.drawarea.height);
        this.drawBackground();
        this.drawPieces();
        this.drawValidMoves();
    }

    drawBackground() {
        const ctx = this.drawarea.getContext("2d");
        const colors = ["white", "darkgrey"];
        const tileSize = this.tileSize;
        for (let y = 0; y < 8; y += 1){
            for (let x = 0; x < 8; x += 1){
                const color = colors[0];
                ctx.fillStyle = color;
                ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
                colors.reverse();
            }
            colors.reverse();
        }
        ctx.strokeStyle = "black";
        ctx.moveTo(0, this.boardHeight);
        ctx.lineTo(this.boardWidth, this.boardHeight);
        ctx.lineTo(this.boardWidth, 0);
        ctx.stroke();
        const files = "abcdefgh";
        ctx.save();
        ctx.fillStyle = "black";
        const fontSize = this.tileSize/4;
        ctx.font = fontSize + "px Verdana";
        for (let i = 0; i < files.length; i += 1){
            ctx.fillText(files[i], i*this.tileSize, this.drawarea.height-(this.tileSize/2-fontSize));
        }
        for (let i = 0; i < this.board.tiles.length; i += 1){
            ctx.fillText(i+1, this.boardWidth, (this.drawarea.height-i*this.tileSize-fontSize)-fontSize);
        }
        ctx.restore();
    }

    drawPieces() {
        const tileSize = this.tileSize;
        const height = this.boardHeight;
        const ctx = this.drawarea.getContext("2d");
        const boardTiles = this.board.tiles;
        ctx.fillStyle = "black";
        if(this.newPos){
            ctx.save();
            ctx.fillStyle = "#0000FF77";
            ctx.fillRect(this.newPos.x*tileSize, height-this.newPos.y*tileSize-tileSize, tileSize, tileSize);
            ctx.restore();
        }
        for (let y = 0; y < 8; y += 1){
            for(let x = 0; x < 8; x += 1){
                const tile = boardTiles[y][x];
                if (tile.piece === null)
                    continue;
                ctx.fillText(tile.piece.text, x*tileSize, height-y*tileSize-tileSize/8.);
            }
        }
        if (this.lastPos){
            ctx.save();
            ctx.fillStyle = "#0000FF77";
            ctx.fillRect(this.lastPos.x*tileSize, height-this.lastPos.y*tileSize-tileSize, tileSize, tileSize);
            ctx.restore();
        }
    }

    drawValidMoves(){
        if (this.currentMoves === null){
            return;
        }
        const ctx = this.drawarea.getContext("2d");
        const tileSize = this.tileSize;
        const height = this.boardHeight;
        ctx.save();
        for (let move of this.currentMoves){
            if (move === null){
                continue;
            }
            const tile = this.board.getTileByName(move);
            if (!tile.piece){
                ctx.fillStyle = '#00FF0077';
            }else{
                ctx.fillStyle = '#FF000077';
            }
            ctx.fillRect(tile.x*tileSize, (height-tile.y*tileSize)-tileSize, tileSize, tileSize);
        }
        ctx.restore();
    }

    getMousePos(evt) {
        const rect = this.drawarea.getBoundingClientRect();
        //invert y coordinates
        return {
            x: evt.clientX - rect.left,
            y: this.boardHeight - (evt.clientY - rect.top)
        };
    }
    
    getMousePosTopLeft(evt) {
        const rect = this.drawarea.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    getTilePos(x, y) {
        return {
            x: parseInt(x/this.tileSize),
            y: parseInt(y/this.tileSize),
        };
    }

    onMouseLeave(evt){
        console.debug("on mouse leave");
        if (promotion.isVisible())
            return;
        this.restoreDraggedPiece();
    }

    onMouseDown(evt){
        if (this.block || this.dragOrigin)
            return;
        const pos = this.getMousePos(evt);
        const tilePos = this.getTilePos(pos.x, pos.y);
        const tile = this.board.getTile(tilePos.x, tilePos.y);
        if (!tile || (isWhitePiece(tile.piece) && this.assignedColor !== "WHITE")
        || (!isWhitePiece(tile.piece) && this.assignedColor === "WHITE")){
            return;
        }
        this.dragOrigin = tilePos;
        const name = this.board.getTileNameFromXY(tilePos.x, tilePos.y);
        if (this.validMoves)
            this.currentMoves = this.validMoves[name].moves;
        this.draw();
    }

    onMouseMove(evt){
        if (this.block || this.dragOrigin === null){
            return;
        } else if (this.dragPiece === null){
            const tilePos = this.dragOrigin;
            const validPiece = this.board.getTile(tilePos.x, tilePos.y).piece;
            if ((isWhitePiece(validPiece) && this.assignedColor !== "WHITE")
            || (!isWhitePiece(validPiece) && this.assignedColor === "WHITE")){
                return;
            }
            const piece = this.board.takePiece(tilePos.x, tilePos.y);
            this.dragPiece = piece;
            console.log("on start drag", tilePos, piece);
        }
        if (this.dragPiece === null){
            return;
        }
        this.draw();
        const pos = this.getMousePosTopLeft(evt);
        const ctx = this.drawarea.getContext("2d");
        ctx.fillText(this.dragPiece.text, pos.x - this.tileSize/2., pos.y + this.tileSize/2.);
    }

    onMouseUp(evt) {
        if (this.block)
            return;
        const pos = this.getMousePos(evt);
        const tilePos = this.getTilePos(pos.x, pos.y);
        if (this.dragPiece !== null && this.dragOrigin !== null){
            const tile = this.board.getTile(tilePos.x, tilePos.y);
            const isValidMove = this.currentMoves.find((name) => {
                const tile = this.board.getTileByName(name);
                return tile.x === tilePos.x && tile.y === tilePos.y;
            });
            if (!tile || (tilePos.x === this.dragOrigin.x && tilePos.y === this.dragOrigin.y)
                || !isValidMove){
                this.board.putPiece(this.dragOrigin.x, this.dragOrigin.y, this.dragPiece);
                this.dragPiece = null;
                this.currentMoves = null;
                console.log("Nothing...");
            }else{
                this.lastPos = this.dragOrigin;
                this.newPos = tilePos;
                const lastTile = this.board.getTile(this.lastPos.x, this.lastPos.y);
                const currentTile = this.board.getTile(tilePos.x, tilePos.y);
                if ((this.dragPiece === WhitePiece.PAWN
                    || this.dragPiece === BlackPiece.PAWN)
                    && (tilePos.y === 0 || tilePos.y === 7)){
                        console.debug("promotion", this.assignedColor);
                        promotion.show(lastTile.name, currentTile.name,
                            this.lastPos, tilePos,
                            this.assignedColor);
                        return;
                    }
                const piece = this.board.putPiece(tilePos.x, tilePos.y, this.dragPiece);
                this.addToCounterPiece(piece);
                this.dragPiece = null;
                this.currentMoves = null;
                sendUCI(this.conn, lastTile.name,
                    currentTile.name,
                    this.lastPos, this.newPos,
                    this.assignedColor);
                console.log("Send move to server");
            }
        }
        this.dragOrigin = null;
        this.draw();
    }
    
    pushMove(from, to){
        this.lastPos = from;
        this.newPos = to;
        const piece = this.board.movePiece(from, to);
        this.addToCounterPiece(piece);
        this.draw();
        return piece;
    }

    quitLastPieceMove(){
        this.lastPos = null;
        this.newPos = null;
    }

    unselectCurrentPiece(){
        this.validMoves = null;
    }

    resetDrag(){
        this.dragOrigin = null;
        this.dragPiece = null;
    }

    restoreDraggedPiece(){
        if (!this.dragPiece){
            return;
        }
        this.board.putPiece(this.dragOrigin.x, this.dragOrigin.y, this.dragPiece);
        this.resetDrag();
        this.draw();
    }

    reset(){
        this.resetDrag();
        this.quitLastPieceMove();
        this.unselectCurrentPiece();
        this.draw();
    }

    addToCounterPiece (piece) {
        // TODO: Add the counters as properties to boardView.
        const counter = isWhitePiece(piece) ? whiteCounter : blackCounter;
        const pieceSet = isWhitePiece(piece) ? WhitePiece : BlackPiece;
        for(let key in pieceSet){
            if (pieceSet[key] !== piece)
                continue;
            counter.addOneTo(key.toLocaleLowerCase());
            break;
        } 
    }

}
