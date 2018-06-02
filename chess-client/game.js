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

class Game{
    constructor(conn, boardView, messages){
        this.conn = conn;
        this.boardView = boardView;
        this.messages = messages;
        this.playing = false;

        conn.addEventListener('message', this.dispatchMessage.bind(this));
        conn.addEventListener('close', (close) => {
            if (close.code === 1000 && close.wasClean){
                return;
            }
            const message = `Conexión perdida con el servidor, ${close.code}. Recarga la página.`;
            this.messages.set = message;
            this.boardView.block = true;
        });
    }

    dispatchMessage(event){
        const message = JSON.parse(event.data);
        console.log("message", message);
        switch(message.command){
            case "STARTGAME":
                this.startGame(message);
            break;
            case "PLAYERQUITS":
                this.playerQuits(message);
            break;
            case "OKMOVE":
                this.OKMove(message);
            break;
            case "PLAYERMOVE":
                this.playerMove(message);
            break;
        }
    }

    startGame(message){
        this.playing = true;
        this.boardView.assignedColor = message.color;
        historial.clear();
        this.boardView.block = message.color !== "WHITE";
        this.boardView.board.setFromFEN(message.fen);
        this.boardView.reset();
        if (message.color === 'WHITE'){
            this.boardView.validMoves = message.moves;
            messages.text = "Comienza el juego. Su turno.";
        }else{
            messages.text = "Esperando turno del jugador."
        }
        blackCounter.reset();
        whiteCounter.reset();
    }

    playerQuits(message){
        this.playing = false;
        this.message.text = "El otro jugador se ha quitado de la partida. Esperando a un jugador...";
    }

    OKMove(message){
        this.addToMessagesSAN(message.turn, message.san, message.color);
        this.boardView.block = true;
        messages.text = "Esperando turno del jugador.";
        if (message.fen){
            this.boardView.board.setFromFEN(message.fen);
            this.boardView.draw();
        }
        if (message.ep){
            if (message.color === "WHITE"){
                blackCounter.addOneTo('pawn');
            }else{
                whiteCounter.addOneTo('pawn');
            }
        }
    }

    playerMove(message){
        this.addToMessagesSAN(message.turn, message.san, message.color);
        this.boardView.block = false;
        messages.text = "Su turno.";
        this.boardView.validMoves = message.moves;
        this.boardView.pushMove(message.from, message.to);
        if (message.fen){
            this.boardView.board.setFromFEN(message.fen);
            this.boardView.draw();
        }
        if (message.ep){
            if (message.color === "WHITE"){
                blackCounter.addOneTo('pawn');
            }else{
                whiteCounter.addOneTo('pawn');
            }
        }
    }

    addToMessagesSAN(turn, san, color){
        if (color === 'WHITE'){
            historial.add(`${turn}. ${translateNotationToSpanish(san)}`);         
        }else{
            historial.addToLast(` ${translateNotationToSpanish(san)}`);
        }
    }

}