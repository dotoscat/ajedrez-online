class Game{
    constructor(conn, boardView, messages){
        this.conn = conn;
        this.assignedColor = null;
        this.boardView = boardView;
        this.messages = messages;

        conn.addEventListener('message', event => {
            console.debug("event", event.data);
        });

    }
}