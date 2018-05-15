function sendToServer(conn, command, data) {
    const message = Object.assign({'command': command}, data);
    conn.send(JSON.stringify(message));
}

function sendUCI(conn, from, to, fromXY, toXY, color){
    const data = {
        'from': from,
        'to': to,
        'color': color,
        "fromXY": fromXY,
        "toXY": toXY
    };
    sendToServer(conn, "SENDMOVE", data);
}
