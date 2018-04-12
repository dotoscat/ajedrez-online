import signal
import socket
import argparse
import selectors

signal.signal(signal.SIGINT, signal.SIG_DFL)

class Player:
    def __init__(self, conn, addr):
        self.conn = conn
        self.addr = addr

    def __del__(self):
        self.conn.close()

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

    def accept(self, socket):
       conn, addr = socket.accept()
       print("Accept", addr)
       self.players[addr] = Player(conn, addr)
       self.selector.register(conn, selectors.EVENT_READ, self.read)

    def read(self, conn):
        data = conn.recv(1024)
        addr = conn.getpeername()
        print("read", data, addr)
        if data:
            print(data, "from", addr)
        else:
            print("Close", addr)
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
    print("Listen from", args.ip)
    server = Server(args.ip, 1337)
    server.run()

if __name__ == "__main__":
    main()
