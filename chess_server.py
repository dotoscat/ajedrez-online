# Copyright (C) 2018  Oscar 'dotoscat' Garcia

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https:#www.gnu.org/licenses/>.import signal

import signal
import socket
import argparse
import selectors
import logging
import random
import chess
import aiohttp
from aiohttp import web
import aiohttp_jinja2
import jinja2
from chessasir import protocol
import chessasir

logging.basicConfig(format="%(pathname)s:%(module)s:%(levelname)s:%(message)s", level=logging.DEBUG)
signal.signal(signal.SIGINT, signal.SIG_DFL)

class Player:
    def __init__(self, ws):
        self.ws = ws
        self.color = None
        self.ready = False

class Game:
    def __init__(self):
        self.board = chess.Board()
        self.players = []

    @property
    def unpaired(self):
        return len(self.players) != 2

    def add_player(self, ws):
        if not self.unpaired:
            return False
        player = Player(ws)
        self.players.append(player) 
        return True

    async def remove_player(self, ws):
        player = [p for p in self.players if p.ws == ws][0]
        self.players.remove(player)
        if self.white == player:
            self.white = None
        else:
            self.black = None
        await send_player_quits(self.players[0].ws, player.color)

    async def start(self):
        if self.unpaired:
            return False
        random_players = list(self.players)
        random.shuffle(random_players)
        self.white = random_players.pop()
        self.white.color = "WHITE"
        self.black = random_players.pop()
        self.black.color = "BLACK"
        await send_start_game(self.white.ws, "WHITE")
        await send_start_game(self.black.ws, "BLACK")
        return True

async def send_player_quits(ws, color):
    message = {"command": "PLAYERQUITS", "color": color}
    await ws.send_json(message)

async def send_start_game(ws, color):
    message = {"command": "STARTGAME", "color": color}
    await ws.send_json(message)

def main():
    ip_list = socket.gethostbyname_ex(socket.gethostname())[2]

    parse = argparse.ArgumentParser()
    parse.add_argument("--ip", "-i", default=ip_list.pop(), help="ipv4")
    parse.add_argument("--port", "-p", default=1337)
    args = parse.parse_args()
    logging.info("Listen from {}:{}".format(args.ip, args.port))
    app = web.Application()
    aiohttp_jinja2.setup(app,
        loader=jinja2.FileSystemLoader('chess-client'))

    async def index(request):
        response = aiohttp_jinja2.render_template(
            'index.html',
            request, 
            {"host": args.ip, "port": args.port})
        return response
   
    async def websocket_handler(request):
        peer = request.transport.get_extra_info("peername")
        print("request peer", peer)
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        game = request.app['game']
        game.add_player(ws)

        if not game.unpaired:
            await game.start()
            print("Start GAME!")

        async for msg in ws:
            if msg.type == aiohttp.WSMsgType.TEXT:
                if msg.data == 'close':
                    await ws.close()
                else:
                    await ws.send_str(msg.data + '/answer')
            elif msg.type == aiohttp.WSMsgType.ERROR:
                print('ws connection clossed with exception {}'.format(ws.exception()))
            elif msg.type == aiohttp.WSMsgType.CLOSE:
                print(peer, "close")
            elif msg.type == aiohttp.WSMsgType.CLOSED:
                print(peer, "closed")

        print('websocket connection closed')

        await game.remove_player(ws)

        return ws

    app['game'] = Game()

    app.router.add_get("/", index)
    app.router.add_get("/ws", websocket_handler)
    app.router.add_static("/", "chess-client")
    web.run_app(app, host=args.ip, port=args.port)
    # server = Server(args.ip, args.port)
    # server.run()

if __name__ == "__main__":
    main()
