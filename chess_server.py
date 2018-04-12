import signal
import socket
import argparse
import selectors

signal.signal(signal.SIGINT, signal.SIG_DFL)

class Server:
    def __init__(self, ip, port):
        self.host = (ip, port)
        self.listener = socket.socket()
        self.listener.setblocking(False)
        self.listener.bind(self.host)
        self.selector = selectors.DefaultSelector()
        self.selector.register(self.listener, selectors.EVENT_READ, self.accept)

    def accept(self, socket):
        pass

    def run(self):
        while True:
            events = self.selector.select()
            for key, events in events:
                print(key, events)

    def __del__(self):
        self.selector.close()

def main():
    ip_list = socket.gethostbyname_ex(socket.gethostname())[2]

    parse = argparse.ArgumentParser()
    parse.add_argument("--ip", default=ip_list.pop(), help="ipv4")
    args = parse.parse_args()
    print("Listen from", args.ip)

if __name__ == "__main__":
    main()
