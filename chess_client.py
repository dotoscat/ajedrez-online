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

    def __del__(self):
        self.selectors.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--ip", "-i", help="ipv4", required=True)
    parser.add_argument("--port", "-p", help="port", default=1337)
    args = parser.parse_args()

    logging.debug("Client connects to {}:{}".format(args.ip, args.port))
