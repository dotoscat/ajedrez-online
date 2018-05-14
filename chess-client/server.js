function sendToServer(conn, command, data) {
    const message = Object.assign({'command': command}, data);
    conn.send(JSON.stringify(message));
}

function sendUCI(conn, from, to, color){
    sendToServer(conn, "SENDPIECE", {'from': from, 'to': to, 'color': color});
}
