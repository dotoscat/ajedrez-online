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

function sendToServer(conn, command, data) {
    const message = Object.assign({'command': command}, data);
    conn.send(JSON.stringify(message));
}

function sendAcceptRestart(conn){
    sendToServer(conn, "ACCEPTRESTART");
}

function sendRejectRestart(conn){
    sendToServer(conn, "REJECTRESTART");
}

function sendRequestRestart(conn){
    sendToServer(conn, "REQUESTRESTART");
}

function sendUCI(conn, from, to, fromXY, toXY, color, promotion){
    const data = {
        'from': from,
        'to': to,
        'color': color,
        "fromXY": fromXY,
        "toXY": toXY
    };
    if (promotion)
        data['promotion'] = promotion;
    sendToServer(conn, "SENDMOVE", data);
}
