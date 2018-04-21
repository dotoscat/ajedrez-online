'use strict';

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
    }
}

class Board {
    constructor (drawarea, tileSize) {
        this.tileSize = typeof tileSize !== "undefined" ? tileSize : 64;
        this.drawarea = drawarea;
        this.tiles = new Array(8);
        this.dragOrigin = null;
        this.dragPiece = null;
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

    setFromFEN(data){
        const positions = data.split(' ')[0];
        const ranks = positions.split('/');
        for (let y = 0; y < ranks.length; y += 1){
            const rank = ranks[y];
            for (let x = 0, r = 0; r < rank.length && x < 8; r += 1) {
                const value = rank[r];
                const number = Number(value);
                if (Number.isNaN(number)) {

                }
            }
        }
    }

    draw(){
        this.drawBackground();
        this.drawPieces();
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
        const piece = this.tiles[tilePos.y][tilePos.x].piece;
        this.dragPiece = piece;
        this.tiles[tilePos.y][tilePos.x].piece = null;
        console.log("on start drag", pos, tilePos, piece);
    }

    onMouseMove(evt){
        if (this.dragPiece === null)
            return;
        this.draw();
        const pos = this.getMousePosTopLeft(evt);
        const ctx = this.drawarea.getContext("2d");
        ctx.fillText(this.dragPiece.text, pos.x - this.tileSize/2., pos.y + this.tileSize/2.);
    }

    onMouseUp(evt) {
        if (this.dragPiece !== null){
            const pos = this.getMousePos(evt);
            const tilePos = this.getTilePos(pos.x, pos.y);
            const tile = this.tiles[tilePos.y][tilePos.x];
            tile.piece = this.dragPiece;
            this.dragPiece = null;
            this.draw();
        }
    }

}
