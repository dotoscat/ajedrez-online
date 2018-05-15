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
        const color = message.color;
        const san = message.san;
        if (color === 'WHITE'){
            const turn = message.turn;
            this.messages.add(`${turn}. ${san}`);         
        }else{
            this.messages.addToLast(` ${san}`);
        }
        this.boardView.block = true;
    }

}