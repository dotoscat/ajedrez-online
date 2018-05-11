class Game{
    constructor(conn, boardView, messages){
        this.conn = conn;
        this.assignedColor = null;
        this.boardView = boardView;
        this.messages = messages;
        this.playing = false;

        conn.addEventListener('message', this.dispatchMessage.bind(this));
    }

    dispatchMessage(event){
        const message = event.data;
        console.log("message", message);
        switch(message.startGame){
            case "STARTGAME":
                this.startGame(message);
            break;
        }
    }

    startGame(message){
        this.playing = true;
        this.assignedColor = message.color;
        messages.add("Game start! You are " + message.color);
    }

}