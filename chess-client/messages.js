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

class Messages {
    constructor(element, height){
        this.element = element;
        element.style.height = typeof height === 'number' ? height + 'px' : element.height + 'px';
    }

    add(content) {
        const p = document.createElement("p");
        p.innerText = content;
        this.element.appendChild(p);
        this.element.scrollTo(0, this.element.scrollHeight);
    }

    addToLast(content, separator){
        const sep = typeof separator === 'undefined' ? ' ' : separator;
        this.element.lastChild.innerText += sep + content;
    }

}

class PieceCounter {
    constructor(color){
        this.element = document.createElement("ul");
        const WhitePiece = {
            KING: "\u2654",
            QUEEN: "\u2655",
            ROOK: "\u2656",
            BISHOP: "\u2657",
            KNIGHT: "\u2658",
            PAWN: "\u2659"
        };

        const BlackPiece = {
            KING: "\u265A",
            QUEEN: "\u265B",
            ROOK: "\u265C",
            BISHOP: "\u265D",
            KNIGHT: "\u265E",
            PAWN: "\u265F"
        };
        const pieceColor = typeof color === 'string' && color === 'white' ?
            WhitePiece :
            BlackPiece ;
        this.pieces = {
            pawn: this._createPiece(pieceColor.PAWN), 
        };
    }

    _createPiece (piece) {
        const child = document.createElement('li');
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
        this._updatePiece('pawn');
    }

}
