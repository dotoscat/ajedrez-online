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
from aiohttp import web
import aiohttp_jinja2
import jinja2
from chessasir import protocol
import chessasir

logging.basicConfig(format="%(pathname)s:%(module)s:%(levelname)s:%(message)s", level=logging.DEBUG)
signal.signal(signal.SIGINT, signal.SIG_DFL)

class Player:
    def __init__(self, conn, addr):
        self.conn = conn
        self.addr = addr
        self.color = None

    def __del__(self):
        self.conn.close()

    def assign_color(self, color):
        self.color = color
        data = protocol.startgame.pack(protocol.STARTGAME, color)
        self.conn.sendall(data)

    def send_data(self, data):
        self.conn.sendall(data)

class Game:
    def __init__(self, white:Player=None, black:Player=None):
        self.white = white
        self.black = black
        self.board = chess.Board()
        self.current = white

    def do_move(self, color, move):
        if self.current.color != color:
            return False
        self.board.push_uci(move)
        if self.current == self.white:
            self.current = self.black
        else:
            self.current = self.white
        return True

    def send_move_to_current(self, data):
        self.current.send_data(data)

class Server:
    def __init__(self, ip, port):
        self.host = (ip, port)
        self.listener = socket.socket()
        self.listener.setblocking(False)
        self.listener.bind(self.host)
        self.listener.listen(10)
        self.selector = selectors.DefaultSelector()
        self.selector.register(self.listener, selectors.EVENT_READ, self.accept)
        self.players = {}
        self.game = None

    def accept(self, socket):
       conn, addr = socket.accept()
       logging.debug("Accept {}".format(addr))
       self.players[addr] = Player(conn, addr)
       self.selector.register(conn, selectors.EVENT_READ, self.read)
       if len(self.players) == 2:
           self.start_game()

    def start_game(self):
        addrs = [addr for addr in self.players]
        white = random.choice(addrs)
        self.players[white].assign_color(chessasir.WHITE)
        addrs.remove(white)
        black = addrs.pop()
        self.players[black].assign_color(chessasir.BLACK)
        self.game = Game(white=self.players[white], black=self.players[black])

    def read(self, conn):
        try:
            addr = conn.getpeername()
            data = conn.recv(1024)
            if data:
                print(data, "from", addr)
                command = protocol.get_command(data)
                if command == protocol.MOVE:
                    self.move(data)
            else:
                self.remove_player(addr, conn)
        except ConnectionResetError:
            self.remove_player(addr, conn)

    def move(self, data):
        command, color, uci = protocol.move.unpack(data)
        move = uci.decode().rstrip('\x00')
        logging.debug("move {} {}".format(color, uci))
        if self.game.do_move(color, move):
            print("Send move to rival")
            self.game.send_move_to_current(data)

    def remove_player(self, addr, conn):
        logging.info("Close {}".format(addr))
        self.selector.unregister(conn)
        del self.players[addr]

    def run(self):
        while True:
            events = self.selector.select()
            for key, events in events:
                key.data(key.fileobj)

    def __del__(self):
        self.selector.close()


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
        html = open("chess-client/index.html").read()
        response = aiohttp_jinja2.render_template('index.html', request, {"host": args.ip})
        return response
        # return web.Response(text=html, content_type="text/html")
   
    app.router.add_get("/", index)
    app.router.add_static("/", "chess-client")
    web.run_app(app, host=args.ip, port=args.port)
    # server = Server(args.ip, args.port)
    # server.run()

if __name__ == "__main__":
    main()
