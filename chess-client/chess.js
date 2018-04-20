'use strict';

class Board {
    constructor (drawarea, tileSize) {
        this.tileSize = typeof tileSize !== "undefined" ? tileSize : 32;
        this.drawarea = drawarea;
        drawarea.width = this.tileSize*8;
        drawarea.height = this.tileSize*8;
        drawarea.addEventListener("click", this.onClick.bind(this));
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
