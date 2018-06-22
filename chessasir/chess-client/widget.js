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

const Pieces = {
    White: {
        QUEEN: "\u2655",
        ROOK: "\u2656",
        BISHOP: "\u2657",
        KNIGHT: "\u2658",
        PAWN: "\u2659"
    },
    Black: {
        QUEEN: "\u265B",
        ROOK: "\u265C",
        BISHOP: "\u265D",
        KNIGHT: "\u265E",
        PAWN: "\u265F"
    }
};

class Messages {
    constructor(element){
        this.element = element;
    }

    set text (content){
        this.element.innerText = content;
    }

    get text(){
        return this.element.innerText;
    }

    add(content) {
       this.element.innerText = ' ' + content; 
    }

    clear(){
        this.element.innerText = "";
    }

}

class Historial {
    constructor(element){
        this.parent = element.parentNode;
        this.element = element.tBodies[0];
        this.lastRow = null;
    }

    add (turn, san){
        const row = this.element.insertRow();
        this.lastRow = row;
        row.insertCell();
        row.insertCell();
        row.insertCell();
        row.cells[0].innerText = turn;
        row.cells[1].innerText = san;
        this.parent.scroll(0, this.parent.getBoundingClientRect().bottom);
    }

    addToLast(san){
        if(!this.lastRow)
            return;
        this.lastRow.cells[2].innerText = san;
    }

    clear (){
        while (this.element.rows.length !== 0){
            this.element.deleteRow(0);
        }
    }

}

class PieceCounter {
    constructor(color){
        this.element = document.createElement("ul");
        const pieceColor = typeof color === 'string' && color === 'white' ?
            Pieces.White :
            Pieces.Black ;
        this.pieces = {
            pawn: this._createPiece(pieceColor.PAWN), 
            knight: this._createPiece(pieceColor.KNIGHT), 
            bishop: this._createPiece(pieceColor.BISHOP), 
            rook: this._createPiece(pieceColor.ROOK), 
            queen: this._createPiece(pieceColor.QUEEN), 
        };
    }

    _createPiece (piece) {
        const child = document.createElement('li');
        console.debug("createPiece", piece, child);
        this.element.appendChild(child);
        return {
            piece: piece,
            element: child,
            amount: 0
        };
    }

    _updatePiece(piece) {
        const aPiece = this.pieces[piece];
        console.debug('_updatePiece', piece, aPiece);
        if (typeof aPiece === 'undefined') return;
        aPiece.element.innerText = aPiece.piece + ' ' + aPiece.amount;
    }

    addOneTo(piece) {
        const aPiece = this.pieces[piece];
        console.debug('_addOneTo', piece, aPiece);
        if (typeof aPiece === 'undefined') return;
        aPiece.amount += 1;
        this._updatePiece(piece);
    }

    addToParent(parent){
        parent.appendChild(this.element);
        for (let key in this.pieces){
            this._updatePiece(key);
        }
    }

    reset(){
        for(let key in this.pieces){
            this.pieces[key].amount = 0;
            this._updatePiece(key);
        }
    }

}

class Promotion {
    constructor(element, boardView){
        this.element = element;
        this.boardView = boardView;
        this.color = "WHITE";
        this.from = null;
        this.to = null;
        this.lastPos = null;
        this.newPos = null;

        document.getElementById("cancel")
            .addEventListener("click", this.cancel.bind(this));
        document.getElementById("p-queen")
            .addEventListener("click", this.promote.bind(this, "queen"));
        document.getElementById("p-bishop")
            .addEventListener("click", this.promote.bind(this, "bishop"));
        document.getElementById("p-rook")
            .addEventListener("click", this.promote.bind(this, "rook"));
        document.getElementById("p-knight")
            .addEventListener("click", this.promote.bind(this, "knight"));
    }

    promote(piece){
        let pieceSet = Pieces.White;
        if (this.color === "BLACK")
            pieceSet = Pieces.Black;
        let thePiece = null;
        let p = null;
        switch (piece){
            case "queen":
                thePiece = pieceSet.QUEEN;
                p = 'q';
            break;
            case "rook":
                thePiece = pieceSet.ROOK;
                p = 'r';
            break;
            case "knight":
                thePiece = pieceSet.KNIGHT;
                p = 'n';
            break;
            case "bishop":
                thePiece = pieceSet.BISHOP;
                p = 'b';
            break;
        }
        sendUCI(conn, this.from, this.to, this.lastPos, this.newPos, this.color, p);
        this.boardView.resetDrag();
        this.hide();
        const uci = this.from + this.to + p;
        console.debug("Promote", thePiece);
        console.debug("uci", uci);
    }

    show(from, to, lastPos, newPos, color){
        this.from = from;
        this.to = to;
        this.lastPos = lastPos;
        this.newPos = newPos;
        this.color = (color === "WHITE" || color === "BLACK") ? color : "WHITE";
        const pieceSet = this.color === "WHITE" ? Pieces.White : Pieces.Black;
        document.getElementById("p-queen").textContent = pieceSet.QUEEN;
        document.getElementById("p-rook").textContent = pieceSet.ROOK;
        document.getElementById("p-bishop").textContent = pieceSet.BISHOP;
        document.getElementById("p-knight").textContent = pieceSet.KNIGHT;
        this.element.classList.remove('hide');
        this.boardView.block = true;
    }
    
    hide(){
        this.element.classList.add('hide');
        this.boardView.block = false;
    }

    isVisible(){
        return !this.element.classList.contains("hide");
    }

    cancel(){
        this.boardView.restoreDraggedPiece();
        this.hide();
    }

}

class StartGame {
    constructor(element){
        this.element = element;
        this.element.addEventListener("click", this.doRequest.bind(this));
    }

    show(){
        this.element.style.visibility = "visible";
    }

    hide(){
        this.element.style.visibility = "hidden";
    }

    doRequest(evt){
        sendToServer(conn, "REQUESTWHITE");
    }

}

class RequestRestart{
    constructor(element){
        this.element = element;
        this.text = element.innerText;
        element.addEventListener("click", this.sendRequestRestart.bind(this));
    }

    disable(text){
        this.element.disabled = true;
        this.element.innerText = text;
    }

    enable(){
        this.element.disabled = false;
        this.element.innerText = this.text;
    }
    
    show(){
        this.element.style.visibility = "visible";
    }

    hide(){
        this.element.style.visibility = "hidden";
    }

    sendRequestRestart(){
        sendRequestRestart(conn);
        game.saveCurrentBoardViewBlock();
        boardViewer.block = true;
        game.saveCurrentMessage();
        messages.text = "Esperando respuesta del jugador para reiniciar la partida como BLANCAS...";
        this.hide();
        console.debug("Send request restart");
    }

}

class RequestDialog {
    constructor(element){
        this.element = element;
        const requestYes = document.getElementById("request-yes");
        const requestNo = document.getElementById("request-no");
        requestNo.addEventListener("click", this.requestNo.bind(this));
        requestYes.addEventListener("click", this.requestYes.bind(this));
    }

    requestNo(){
        game.restoreBoardViewBlockByTurn();
        sendRejectRestart(conn);
        this.hide();
        requestRestart.show();
        console.debug("request no");
    }

    requestYes(){
        sendAcceptRestart(conn);
        console.debug("request yes");
    }
    
    show(){
        this.element.style.visibility = "visible";
    }

    hide(){
        this.element.style.visibility = "hidden";
    }
}
