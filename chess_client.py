import argparse
import logging
import selectors
import signal
import socket
import errno
import os
from chessasir import protocol
import chessasir

signal.signal(signal.SIGINT, signal.SIG_DFL)
logging.basicConfig(format="%(module)s:%(levelname)s:%(message)s", level=logging.DEBUG)

class Client:
    def __init__(self, ip, port):
        self.selectors = selectors.DefaultSelector()
        self.conn = socket.socket()
        self.host = (ip, port)
        self.playing = False
        self.color = None
        self.turn = False
        self.selectors.register(self.conn, selectors.EVENT_READ, self.read)

    def read(self, conn):
        data = conn.recv(1024)
        logging.info("from server: {}".format(data))
        command = protocol.get_command(data)
        print("commang", command)
        if command == protocol.STARTGAME:
            self.start_game(data)

    def start_game(self, data):
        command, color = protocol.startgame.unpack(data)
        self.color = color
        if color == chessasir.WHITE:
            self.turn = True
            print("You are white")
        else:
            self.turn = False
            print("You are black")
        self.playing = True

    def __del__(self):
        self.selectors.close()

    def run(self):
        try:
            self.conn.connect(self.host)
        except ConnectionRefusedError:
            print("Host {} does not exist.".format(self.host))
            return
        while True:
            if not self.playing:
                print("Waiting a player to join...")
            elif self.turn:
                print("Enter your input")
            else:
                print("Waiting for your rival's move...")
            events = self.selectors.select()
            for key, events in events:
                key.data(key.fileobj)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ip", "-i", help="ipv4", required=True)
    parser.add_argument("--port", "-p", help="port", default=1337)
    args = parser.parse_args()

    logging.debug("Client connects to {}:{}".format(args.ip, args.port))
    client = Client(args.ip, args.port)
    client.run()
