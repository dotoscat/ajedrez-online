'use strict';

const Piece = {
    WHITE_KING: {text: "\u2654"},
    WHITE_QUEEN: {text: "\u2655"},
    WHITE_ROOK: {text: "\u2656"},
    WHITE_BISHOP: {text: "\u2657"},
    WHITE_KNIGHT: {text: "\u2658"},
    WHITE_PAWN: {text: "\u2659"},
};

class Tile {
    constructor(file, rank) {
        this.name = file + rank;
        this.piece = null;
    }
}

class Board {
    constructor (drawarea, tileSize) {
        this.tileSize = typeof tileSize !== "undefined" ? tileSize : 32;
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
        this.drawarea.getContext("2d").font = "32px Verdana";
        // TODO: debug
        this.tiles[1][1].piece = Piece.WHITE_KING;
        this.draw();
    }

    draw(){
        this.drawBackground();
        this.drawPieces();
    }

    drawBackground() {
        const ctx = this.drawarea.getContext("2d");
        const colors = ["purple", "green"];
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
        ctx.fillStyle = "white";
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

    getTilePos(x, y) {
        return {
            x: parseInt(x/this.tileSize),
            y: parseInt(y/this.tileSize),
        };
    }

    onClick(evt) {
        const pos = this.getMousePos(evt); 
        const x = parseInt(pos.x/this.tileSize);
        // Invert the position since the origin is top left
        //const y = 7-parseInt(pos.y/this.tileSize);
        //const tile = this.tiles[y][x];
        console.log("Hola mundo", pos);
        this.draw();
    }

    onMouseDown(evt){
        return; // TODO: remove
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
        const pos = this.getMousePos(evt);
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
