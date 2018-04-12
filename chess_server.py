import signal
import socket
import argparse

signal.signal(signal.SIGINT, signal.SIG_DFL)



def main():
    ip_list = socket.gethostbyname_ex(socket.gethostname())[2]

    parse = argparse.ArgumentParser()
    parse.add_argument("--ip", default=ip_list.pop(), help="ipv4")
    args = parse.parse_args()
    print("Listen from", args.ip)

if __name__ == "__main__":
    main()
