import signal
import socket
import argparse

signal.signal(signal.SIGINT, signal.SIG_DFL)

ip_list = socket.gethostbyname_ex(socket.gethostname())[2]

parse = argparse.ArgumentParser()
parse.add_argument("--ip", default=ip_list.pop(), help="ipv4")
args = parse.parse_args()

if __name__ == "__main__":
    print("Listen from", args.ip)
