import argparse
import logging
import selectors
import signal
import socket
import errno
import os

signal.signal(signal.SIGINT, signal.SIG_DFL)
logging.basicConfig(format="%(module)s:%(levelname)s:%(message)s", level=logging.DEBUG)

class Client:
    def __init__(self, ip, port):
        self.selectors = selectors.DefaultSelector()
        self.conn = socket.socket()
        self.playing = False
        err = self.conn.connect_ex((ip, port))
        if err:
            raise RuntimeError(os.strerror(err))
        self.selectors.register(self.conn, selectors.EVENT_READ, self.read)

    def read(self, conn):
        data = conn.recv(1024)
        logging.info("from server: {}".format(data))

    def __del__(self):
        self.selectors.close()

    def run(self):
        while True:
            if not self.playing:
                print("Esperando jugador...")
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
