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
        moves: [
            [8, 8],
            [-8, 8],
            [8, -8],
            [-8, -8]
        ]
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
    KING: {text: "\u2654"},
    QUEEN: {text: "\u2655"},
    ROOK: {text: "\u2656", moves: PieceMoves.ROOK},
    BISHOP: {text: "\u2657"},
    KNIGHT: {text: "\u2658", moves: PieceMoves.KNIGHT},
    PAWN: {text: "\u2659", moves: PieceMoves.WHITE_PAWN},
};

const BlackPiece = {
    KING: {text: "\u265A"},
    QUEEN: {text: "\u265B"},
    ROOK: {text: "\u265C", moves: PieceMoves.ROOK},
    BISHOP: {text: "\u265D"},
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
    }
}

function pawnMoves(x, y, piece, tiles) {
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

class Board {
    constructor (drawarea, tileSize) {
        this.tileSize = typeof tileSize !== "undefined" ? tileSize : 64;
        this.drawarea = drawarea;
        this.tiles = new Array(8);
        this.dragOrigin = null;
        this.dragPiece = null;
        this.validMoves = null;
        const files = "abcdefgh";
        for (let y = 0; y < 8; y += 1){
            this.tiles[y] = new Array(8);
            for (let x = 0; x < 8; x += 1) {
                this.tiles[y][x] = new Tile(files[x], y+1);
            }
        }
        drawarea.width = this.tileSize*8;
        drawarea.height = this.tileSize*8;
        drawarea.addEventListener("click", this.onClick.bind(this));
        drawarea.addEventListener("mousedown", this.onMouseDown.bind(this));
        drawarea.addEventListener("mousemove", this.onMouseMove.bind(this));
        drawarea.addEventListener("mouseup", this.onMouseUp.bind(this));
        this.drawarea.getContext("2d").font = this.tileSize + "px Verdana";
        // TODO: debug
        this.tiles[1][1].piece = WhitePiece.KING;
        this.draw();
    }

    getValidMovesOf(x, y){
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
            break;
        }
        return validMoves;
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
                    x += number;
                }
            }
        }
        this.draw();
    }

    draw(){
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
    }

    drawPieces() {
        const tileSize = this.tileSize;
        const height = this.drawarea.height;
        const ctx = this.drawarea.getContext("2d");
        ctx.fillStyle = "black";
        for (let y = 0; y < 8; y += 1){
            for(let x = 0; x < 8; x += 1){
                const tile = this.tiles[y][x];
                if (tile.piece === null)
                    continue;
                ctx.fillText(tile.piece.text, x*tileSize, height-y*tileSize);
            }
        }
    }

    drawValidMoves(){
        if (this.validMoves === null){
            return;
        }
        const ctx = this.drawarea.getContext("2d");
        const tileSize = this.tileSize;
        const height = this.drawarea.height;
        ctx.save();
        ctx.strokeStyle = "green";
        for (let move of this.validMoves){
            if (move === null){
                continue;
            }
            ctx.strokeRect(move[0]*tileSize, (height-move[1]*tileSize)-tileSize, tileSize, tileSize);
        }
        ctx.restore();
    }


    getMousePos(evt) {
        const rect = this.drawarea.getBoundingClientRect();
        //invert y coordinates
        return {
            x: evt.clientX - rect.left,
            y: this.drawarea.height - (evt.clientY - rect.top)
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

    onClick(evt) {
        const pos = this.getMousePos(evt); 
        const tilePos = this.getTilePos(pos.x, pos.y);
        const tile = this.tiles[tilePos.y][tilePos.x];
        console.log("Hola mundo", pos, tile);
        this.draw();
    }

    onMouseDown(evt){
        const pos = this.getMousePos(evt);
        const tilePos = this.getTilePos(pos.x, pos.y);
        this.dragOrigin = tilePos;
        this.validMoves = this.getValidMovesOf(tilePos.x, tilePos.y);
        this.draw();
    }

    onMouseMove(evt){
        if (this.dragOrigin === null){
            return;
        } else if (this.dragPiece === null){
            const tilePos = this.dragOrigin;
            const piece = this.tiles[tilePos.y][tilePos.x].piece;
            this.dragPiece = piece;
            this.tiles[tilePos.y][tilePos.x].piece = null;
            console.log("on start drag", tilePos, piece);
        }
        this.draw();
        const pos = this.getMousePosTopLeft(evt);
        const ctx = this.drawarea.getContext("2d");
        ctx.fillText(this.dragPiece.text, pos.x - this.tileSize/2., pos.y + this.tileSize/2.);
    }

    onMouseUp(evt) {
        const pos = this.getMousePos(evt);
        const tilePos = this.getTilePos(pos.x, pos.y);
        if (this.dragPiece !== null){
            const tile = this.tiles[tilePos.y][tilePos.x];
            tile.piece = this.dragPiece;
            this.dragPiece = null;
            this.validMoves = null;
        }
        this.dragOrigin = null;
        this.draw();
    }

}
