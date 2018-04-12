import signal
import socket

signal.signal(signal.SIGINT, signal.SIG_DFL)

ip_list = socket.gethostbyname_ex(socket.gethostname())[2]
ip = ip_list.pop()

if __name__ == "__main__":
    print("Listen from", ip)
