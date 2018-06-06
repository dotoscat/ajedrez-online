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

function translateNotationToSpanish(san){
    const trans = {
        Q: 'D',
        K: 'R',
        R: 'T',
        B: 'A',
        N: 'C'
    };
    return san.replace(/[QKRBN]/g, match => trans[match]);
}

const WhitePiece = {
    KING: {text: "\u2654"},
    QUEEN: {text: "\u2655"},
    ROOK: {text: "\u2656"},
    BISHOP: {text: "\u2657"},
    KNIGHT: {text: "\u2658"},
    PAWN: {text: "\u2659"},
};

const BlackPiece = {
    KING: {text: "\u265A"},
    QUEEN: {text: "\u265B"},
    ROOK: {text: "\u265C"},
    BISHOP: {text: "\u265D"},
    KNIGHT: {text: "\u265E"},
    PAWN: {text: "\u265F"},
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

function isWhitePiece(piece){
    return Object.values(WhitePiece).includes(piece);
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

    clear(){
        this.tiles.forEach(row => row.forEach(tile => tile.piece = null));
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
        this.blackSide = false;
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
        const fontSize = this.tileSize/3;
        ctx.font = fontSize + "px Verdana";
        for (let i = 0; i < files.length; i += 1){
            if (this.blackSide){
                ctx.fillText(files[i],
                    this.drawarea.width - (i*this.tileSize + tileSize + fontSize/2),
                    this.drawarea.height - (this.tileSize/2 - fontSize - 1));
            }else{
                ctx.fillText(files[i],
                    i*this.tileSize + this.tileSize/2 - fontSize/2,
                    this.drawarea.height - (this.tileSize/2 - fontSize - 1));
            }
        }
        for (let i = 0; i < this.board.tiles.length; i += 1){
            if (this.blackSide){
                ctx.fillText(i+1,
                    this.boardWidth + fontSize/2,
                    this.tileSize + i*this.tileSize - fontSize/1.25);
                continue;
            }
            ctx.fillText(i+1,
                this.boardWidth + fontSize/2,
                (this.drawarea.height-i*this.tileSize-fontSize-fontSize/2)-fontSize);
        }
        ctx.restore();
    }

    transformBySide(x, y){
        const tileSize = this.tileSize;
        if (this.blackSide){
           return {
               x: this.boardWidth - x*tileSize - tileSize,
               y: y*tileSize - tileSize/8. + tileSize
           }; 
        }
        return {x: x, y: y};
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
            if (this.blackSide){
                ctx.fillRect(
                    this.boardWidth - this.newPos.x*tileSize - tileSize,
                    this.newPos.y*tileSize, 
                    tileSize, tileSize);
            }else{
                ctx.fillRect(
                    this.newPos.x*tileSize,
                    height - this.newPos.y*tileSize - tileSize,
                    tileSize, tileSize);
            }
            ctx.restore();
        }
        for (let y = 0; y < 8; y += 1){
            for(let x = 0; x < 8; x += 1){
                const tile = boardTiles[y][x];
                if (tile.piece === null)
                    continue;
                let finalX = 0;
                let finalY = 0;
                if (this.blackSide){
                    finalX = this.boardWidth - x*tileSize - tileSize;
                    finalY = y*tileSize - tileSize/8. + tileSize;
                }else{
                    finalX = x*tileSize;
                    finalY = height - y*tileSize - tileSize/8.;
                }
                ctx.fillText(tile.piece.text, finalX, finalY);
            }
        }
        if (this.lastPos){
            ctx.save();
            ctx.fillStyle = "#0000FF77";if (this.blackSide){
                ctx.fillRect(
                    this.boardWidth - this.lastPos.x*tileSize - tileSize,
                    this.lastPos.y*tileSize, 
                    tileSize, tileSize);
            }else{
                ctx.fillRect(
                    this.lastPos.x*tileSize,
                    height - this.lastPos.y*tileSize - tileSize,
                    tileSize, tileSize);
            }
            //ctx.fillRect(this.lastPos.x*tileSize, height-this.lastPos.y*tileSize-tileSize, tileSize, tileSize);
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
            if (this.blackSide){
                ctx.fillRect(this.boardWidth - tile.x*tileSize - tileSize,
                    tile.y*tileSize,
                    tileSize, tileSize);
            }else{
                ctx.fillRect(tile.x*tileSize,
                    (height-tile.y*tileSize) - tileSize,
                    tileSize, tileSize);
            }
        }
        ctx.restore();
    }

    getMousePos(evt) {
        const rect = this.drawarea.getBoundingClientRect();
        const computedCSS = window.getComputedStyle(this.drawarea);
        const borderLeftWidth = +computedCSS.borderLeftWidth.replace(/\D+/, '');
        const borderTopWidth = +computedCSS.borderTopWidth.replace(/\D+/, '');
        console.debug("border", borderLeftWidth, borderTopWidth);
        //invert y coordinates
        return {
            x: evt.clientX - rect.left - borderLeftWidth,
            y: this.boardHeight - (evt.clientY - rect.top - borderTopWidth)
        };
    }
    
    getMousePosTopLeft(evt) {
        const rect = this.drawarea.getBoundingClientRect();
        const computedCSS = window.getComputedStyle(this.drawarea);
        const borderLeftWidth = +computedCSS.borderLeftWidth.replace(/\D+/, '');
        const borderTopWidth = +computedCSS.borderTopWidth.replace(/\D+/, '');
        return {
            x: evt.clientX - rect.left - borderLeftWidth,
            y: evt.clientY - rect.top - borderTopWidth
        };
    }

    getTilePos(x, y) {
        if (this.blackSide){
            return {
                x: 7 - parseInt(x/this.tileSize),
                y: 7 - parseInt(y/this.tileSize),
            };
        }
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
                console.debug("current moves", this.currentMoves);
                const lastTile = this.board.getTile(this.dragOrigin.x, this.dragOrigin.y);
                const currentTile = this.board.getTile(tilePos.x, tilePos.y);
                if ((this.dragPiece === WhitePiece.PAWN
                    || this.dragPiece === BlackPiece.PAWN)
                    && (tilePos.y === 0 || tilePos.y === 7)){
                        console.debug("promotion", this.assignedColor);
                        promotion.show(lastTile.name, currentTile.name,
                            this.dragOrigin, tilePos,
                            this.assignedColor);
                        return;
                    }
                const piece = this.board.putPiece(tilePos.x, tilePos.y, this.dragPiece);
                this.lastPos = this.dragOrigin;
                this.newPos = tilePos;
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
        this.currentMoves = null;
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
