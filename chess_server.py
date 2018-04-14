import signal
import socket
import argparse
import selectors
import logging
import random
import chess
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

class Game:
    def __init__(self, white:Player=None, black:Player=None):
        self.white = white
        self.black = black
        self.board = chess.Board()
        self.current = white

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
        self.game = Game(white=white, black=black)

    def read(self, conn):
        try:
            addr = conn.getpeername()
            data = conn.recv(1024)
            if data:
                print(data, "from", addr)
                
            else:
                self.remove_player(addr, conn)
        except ConnectionResetError:
            self.remove_player(addr, conn)

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
    parse.add_argument("--ip", default=ip_list.pop(), help="ipv4")
    args = parse.parse_args()
    logging.info("Listen from {}".format(args.ip))
    server = Server(args.ip, 1337)
    server.run()

if __name__ == "__main__":
    main()
