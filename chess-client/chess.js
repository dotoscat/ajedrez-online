'use strict';

class Board {
    constructor (drawarea, tileSize) {
        this.tileSize = typeof tileSize !== "undefined" ? tileSize : 32;
        this.drawarea = drawarea;
        drawarea.width = this.tileSize*8;
        drawarea.height = this.tileSize*8;
        /*
        drawarea.addEventListener("click", (evt) => {
            const pos = this.getMousePos(evt);
            const x = this.tileSize/pos.x;
            const y = this.tileSize/pos.y;
            console.log("click", this.getMousePos(evt), this.tileSize, x, y);
        });
        */
    }

    getMousePos(evt) {
        const rect = this.drawarea.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    saludo(evt) {
        console.log("Hola mundo", this);
    }

}
