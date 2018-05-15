class Game{
    constructor(conn, boardView, messages){
        this.conn = conn;
        this.boardView = boardView;
        this.messages = messages;
        this.playing = false;

        conn.addEventListener('message', this.dispatchMessage.bind(this));
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
        this.messages.add("Game start! You are " + message.color + ".");
        this.boardView.block = message.color !== "WHITE";
    }

    playerQuits(message){
        this.playing = false;
        this.messages.add("Player " + message.color + " quits from the match.");
        this.messages.add("Waiting a player...");
    }

    OKMove(message){
        this.addToMessagesSAN(message.turn, message.san, message.color);
        this.boardView.block = true;
    }

    playerMove(message){
        this.addToMessagesSAN(message.turn, message.san, message.color);
        this.boardView.block = true;
    }

    addToMessagesSAN(turn, san, color){
        if (color === 'WHITE'){
            this.messages.add(`${turn}. ${san}`);         
        }else{
            this.messages.addToLast(` ${san}`);
        }
    }

}