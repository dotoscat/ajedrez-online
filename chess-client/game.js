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
        }
    }

    startGame(message){
        this.playing = true;
        this.boardView.assignedColor = message.color;
        messages.add("Game start! You are " + message.color + ".");
        this.boardView.block = message.color !== "WHITE";
    }

    playerQuits(message){
        this.playing = false;
        messages.add("Player " + message.color + " quits from the match.");
        messages.add("Waiting a player...");
    }

}