'use strict';

const Piece = {
    WHITE_KING: {text: "\u2654"},
    WHITE_QUEEN: {text: "\u2655"},
    WHITE_ROOK: {text: "\u2656"},
    WHITE_BISHOP: {text: "\u2657"},
    WHITE_KNIGHT: {text: "\u2658"},
    WHITE_PAWN: {text: "\u2659"},
};

class Board {
    constructor (drawarea, tileSize) {
        this.tileSize = typeof tileSize !== "undefined" ? tileSize : 32;
        this.drawarea = drawarea;
        drawarea.width = this.tileSize*8;
        drawarea.height = this.tileSize*8;
        drawarea.addEventListener("click", this.onClick.bind(this));
    }

    drawBackground() {
        const ctx = this.drawarea.getContext("2d");
        const colors = ["white", "black"];
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

    getMousePos(evt) {
        const rect = this.drawarea.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    onClick(evt) {
        const pos = this.getMousePos(evt); 
        const x = parseInt(pos.x/this.tileSize);
        const y = parseInt(pos.y/this.tileSize);
        console.log("Hola mundo", x, y);
    }

}
